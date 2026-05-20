import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ArrowLeft, Building2, FileText, DollarSign, Clock, CheckCircle, Calendar, User, AlertCircle, Eye } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierPayment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/supplier_invoices/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleConfirmPayment = async (id, invoiceNumber, vendorName) => {
    const result = await Swal.fire({
      title: 'Confirm Payment?',
      html: `You are about to mark <strong>${invoiceNumber}</strong> from <strong>${vendorName}</strong> as <strong class="text-emerald-600">PAID</strong>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#1e293b',
      confirmButtonText: 'Yes, Confirm Payment',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/supplier_invoices/${id}/confirm`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Payment Confirmed!',
          text: `Invoice ${invoiceNumber} has been marked as PAID.`,
          confirmButtonColor: '#0f172a'
        });
        fetchPayments();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.msg || 'Failed to confirm payment.',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  const formatRupiah = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  const getStatusBadge = (status) => {
    if (status === 'Paid') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600"><CheckCircle size={12} /> PAID</span>;
    }
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600"><Clock size={12} /> PENDING</span>;
  };

  const filteredPayments = payments.filter(p => 
    p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.projectId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = payments.filter(p => p.status === 'Pending Verification').length;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Supplier <span className="text-emerald-600">Payment</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Finance Division • Vendor Settlement</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        
        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by Invoice #, Vendor, Project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>
          <div className="flex gap-3">
            <div className="bg-amber-100 px-4 py-2 rounded-xl">
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Pending</p>
              <p className="text-xl font-black text-amber-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-[10px] text-slate-400">Loading pending invoices...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <CheckCircle size={48} className="text-emerald-300 mx-auto mb-3" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic">No pending payments</p>
            <p className="text-[10px] text-slate-400 mt-2">All supplier invoices have been processed</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Vendor / Project</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Submitted</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => navigate(`/supplier-payment-detail/${p._id}`)}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:underline transition-all"
                      >
                        {p.invoiceNumber}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <div>
                          <p className="font-black text-slate-800 text-sm">{p.vendorName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Project: {p.projectId || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-emerald-600">Rp {formatRupiah(p.amount)}</p>
                      <p className="text-[8px] text-slate-400">{p.terminName || 'Full Payment'}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-[9px] font-bold text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => navigate(`/supplier-payment-detail/${p._id}`)}
                          className="p-2 text-slate-500 hover:text-indigo-600 transition-all"
                          title="View Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {p.status !== 'Paid' && (
                          <button 
                            onClick={() => handleConfirmPayment(p._id, p.invoiceNumber, p.vendorName)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            Confirm Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default SupplierPayment;