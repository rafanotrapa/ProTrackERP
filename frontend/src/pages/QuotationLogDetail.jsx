import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, FileText, 
  Truck, Receipt, User, Building2, DollarSign, Calendar, 
  Edit, Trash2, Save, X, Plus, Minus
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const QuotationLogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editForm, setEditForm] = useState({
    remarks: '',
    topOption: '',
    shippingFee: '',
    taxPercentage: ''
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/client_quotation/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotation(res.data);
        setEditItems(res.data.items.map(item => ({ ...item })));
        setEditForm({
          remarks: res.data.remarks || '',
          topOption: res.data.topOption || 'COD',
          shippingFee: res.data.shippingFee || 0,
          taxPercentage: res.data.taxPercentage || 11
        });
      } catch (err) {
        console.error("Gagal load detail:", err);
        Swal.fire('Error', 'Failed to load quotation detail', 'error');
        navigate('/quotation-log');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600"><CheckCircle size={12} /> APPROVED</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-red-100 text-red-600"><XCircle size={12} /> REJECTED</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600"><Clock size={12} /> PENDING</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-slate-100 text-slate-500"><FileText size={12} /> DRAFT</span>;
    }
  };

  const formatRupiah = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString();
  };

  const handleItemPriceChange = (index, newPrice) => {
    const updated = [...editItems];
    updated[index].salesPrice = newPrice;
    setEditItems(updated);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const calculateSubtotal = () => {
    return editItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.salesPrice || 0)), 0);
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = Number(editForm.shippingFee) || 0;
    const tax = (subtotal * (Number(editForm.taxPercentage) || 0)) / 100;
    return subtotal + shipping + tax;
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        items: editItems,
        clientPrice: calculateSubtotal(),
        remarks: editForm.remarks,
        topOption: editForm.topOption,
        shippingFee: Number(editForm.shippingFee),
        taxPercentage: Number(editForm.taxPercentage),
        taxAmount: (calculateSubtotal() * Number(editForm.taxPercentage)) / 100
      };
      
      await axios.patch(`http://localhost:5000/api/client_quotation/${id}/revision`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Quotation has been updated successfully',
        confirmButtonColor: '#0f172a'
      });
      
      setIsEditing(false);
      
      // Refresh data
      const res = await axios.get(`http://localhost:5000/api/client_quotation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotation(res.data);
      
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err.response?.data?.msg || 'Failed to update quotation',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Quotation?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/client_quotation/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Quotation has been deleted',
          confirmButtonColor: '#0f172a'
        });
        navigate('/quotation-log');
        
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.msg || 'Failed to delete quotation',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  const subtotal = calculateSubtotal();
  const shippingFee = editForm.shippingFee || 0;
  const taxPercentage = editForm.taxPercentage || 0;
  const taxAmount = (subtotal * taxPercentage) / 100;
  const grandTotal = calculateGrandTotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING QUOTATION...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="font-black text-slate-600 text-lg">Quotation not found</p>
          <button onClick={() => navigate('/quotation-log')} className="mt-4 text-indigo-600 underline text-sm">Back to Log</button>
        </div>
      </div>
    );
  }

  const canEdit = true;
  const canDelete = quotation.approvalStatus === 'Draft' || quotation.approvalStatus === 'Rejected';

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />
      
      <div className="w-full border-b border-slate-100 px-8 py-8 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/quotation-log')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Quotation <span className="text-indigo-600">Detail</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">{quotation.quotationId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-300 transition-all">
              <Edit size={14} /> Edit
            </button>
          )}
          {canDelete && !isEditing && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-3 bg-white border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {isEditing && (
            <>
              <button onClick={handleUpdate} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                <Save size={14} /> Save Changes
              </button>
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-5 py-3 bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">
                <X size={14} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          {getStatusBadge(quotation.approvalStatus)}
          <div className="flex items-center gap-4 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> Created: {new Date(quotation.createdAt).toLocaleDateString()}</span>
            {quotation.approvalDate && (
              <span className="flex items-center gap-1"><Clock size={12} /> Approved: {new Date(quotation.approvalDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building2 size={12} /> Project</p>
                  <p className="text-xl font-black text-slate-800 uppercase mt-1">{quotation.projectName || quotation.projectId}</p>
                  <p className="text-[10px] text-slate-500 mt-1">ID: {quotation.projectId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={12} /> Client</p>
                  <p className="text-xl font-black text-slate-800 uppercase mt-1">{quotation.clientName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOP</p>
                  {isEditing ? (
                    <select name="topOption" value={editForm.topOption} onChange={handleEditChange} className="mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold outline-none">
                      <option value="COD">COD</option>
                      <option value="CBD">CBD</option>
                      <option value="CIA">CIA</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                      <option value="DP 30%">DP 30%</option>
                      <option value="DP 50%">DP 50%</option>
                    </select>
                  ) : (
                    <p className="text-base font-black text-amber-600 uppercase mt-1">{quotation.topOption || 'COD'}</p>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Currency</p>
                  <p className="text-base font-black text-slate-800 mt-1">{quotation.currency || 'IDR'}</p>
                </div>
              </div>
            </div>

            {/* Items Table with Edit Capability */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                  <FileText size={14} /> Itemized Quotation
                </h3>
                {isEditing && (
                  <span className="text-[9px] text-amber-600 italic">✏️ Klik pada harga untuk mengedit</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-4">Item</th>
                      <th className="px-5 py-4 text-center">Qty</th>
                      <th className="px-5 py-4 text-center">Unit</th>
                      <th className="px-5 py-4 text-right">Unit Price</th>
                      <th className="px-5 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(isEditing ? editItems : quotation.items).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-bold text-slate-800 text-sm uppercase">{item.itemName}</td>
                        <td className="px-5 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                        <td className="px-5 py-4 text-center text-slate-600">{item.unit}</td>
                        <td className="px-5 py-4 text-right">
                          {isEditing ? (
                            <input
                              type="text"
                              value={formatRupiah(item.salesPrice)}
                              onChange={(e) => handleItemPriceChange(idx, Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                              className="w-32 p-2 bg-white border border-indigo-300 rounded-lg text-right font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                          ) : (
                            <span className="font-bold text-slate-600">Rp {formatRupiah(item.salesPrice)}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-emerald-600">Rp {formatRupiah((item.quantity || 0) * (item.salesPrice || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks / Notes</p>
              {isEditing ? (
                <textarea name="remarks" value={editForm.remarks} onChange={handleEditChange} rows="3" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-indigo-600" placeholder="Additional notes..." />
              ) : (
                <p className="text-sm text-slate-600 italic">{quotation.remarks || '-'}</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - SUMMARY */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-24">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                Financial Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[10px] font-bold text-slate-300">Subtotal</span>
                  <span className="font-black text-white">Rp {formatRupiah(subtotal)}</span>
                </div>
                
                {isEditing ? (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Truck size={12} /> Shipping</span>
                    <input type="text" name="shippingFee" value={formatRupiah(editForm.shippingFee)} onChange={(e) => setEditForm(prev => ({ ...prev, shippingFee: e.target.value.replace(/[^0-9]/g, '') || 0 }))} className="w-32 p-1 bg-slate-800 rounded text-right text-white text-sm font-bold outline-none" />
                  </div>
                ) : (
                  shippingFee > 0 && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Truck size={12} /> Shipping</span>
                      <span className="font-black text-white">Rp {formatRupiah(shippingFee)}</span>
                    </div>
                  )
                )}
                
                {isEditing ? (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Receipt size={12} /> PPN %</span>
                    <input type="number" name="taxPercentage" value={editForm.taxPercentage} onChange={handleEditChange} className="w-20 p-1 bg-slate-800 rounded text-right text-white text-sm font-bold outline-none" min="0" max="100" />
                  </div>
                ) : (
                  taxPercentage > 0 && (
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Receipt size={12} /> PPN {taxPercentage}%</span>
                      <span className="font-black text-white">Rp {formatRupiah(taxAmount)}</span>
                    </div>
                  )
                )}
                
                <div className="flex justify-between py-3 mt-2 bg-indigo-500/20 -mx-3 px-3 rounded-xl">
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">GRAND TOTAL</span>
                  <span className="text-xl font-black text-indigo-300">Rp {formatRupiah(grandTotal)}</span>
                </div>
              </div>
              
              {quotation.approvalStatus === 'Approved' && !isEditing && (
                <p className="text-[8px] text-slate-500 text-center mt-4 pt-3 border-t border-white/10">
                  ⚠️ Setelah edit, quotation akan berstatus Revised dan perlu approval ulang dari Management.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuotationLogDetail;