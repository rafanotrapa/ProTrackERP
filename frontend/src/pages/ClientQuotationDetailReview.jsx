import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, ArrowLeft, DollarSign, Package, Clock, User, FileText, Truck, Receipt } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ClientQuotationDetailReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quo, setQuo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/client_quotation/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuo(res.data);
      } catch (err) {
        console.error("Gagal tarik detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleAction = async (action) => {
    const isApprove = action === 'Approved';
    const result = await Swal.fire({
      title: `${isApprove ? 'APPROVE' : 'REJECT'} QUOTATION?`,
      html: isApprove 
        ? 'This quotation will be available for <strong>Client Invoice</strong> creation.'
        : 'Please provide a reason for rejection:',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      confirmButtonText: `YES, ${action.toUpperCase()}`,
      input: !isApprove ? 'textarea' : undefined,
      inputPlaceholder: !isApprove ? 'Reason for rejection...' : undefined
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const payload = { status: action };
        if (!isApprove && result.value) {
          payload.rejectionReason = result.value;
        }
        
        await axios.patch(`http://localhost:5000/api/client_quotation/${id}/approve`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          icon: 'success',
          title: 'PROCESSED',
          text: `Quotation has been ${action.toLowerCase()}`,
          confirmButtonColor: '#0f172a'
        });
        navigate('/client-quotation-approval');
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'FAILED',
          text: err.response?.data?.msg || 'Failed to process action',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="font-black uppercase tracking-widest text-slate-400 text-[10px] italic">LOADING QUOTATION DATA...</p>
      </div>
    </div>
  );
  
  if (!quo) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <FileText size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="font-black text-slate-600 text-lg">Quotation not found</p>
        <button onClick={() => navigate('/client-quotation-approval')} className="mt-4 text-indigo-600 underline text-sm">Back to Approval</button>
      </div>
    </div>
  );

  // --- LOGIKA KALKULASI YANG BENAR & STERIL DARI BUG ---
  const totalSales = quo.clientPrice || 0;
  const shippingFee = quo.shippingFee || 0;
  const taxAmount = quo.taxAmount || 0;
  const taxPercentage = quo.taxPercentage || 0; // <-- INI YANG BIKIN WHITE SCREEN TADI!

  // 1. REVENUE KLIEN MURNI (Harga Jual Barang + Ongkir, Tanpa Pajak)
  const netRevenue = totalSales + shippingFee;

  // 2. MODAL MURNI (Didapat dari Backend, sudah All-in barang & ongkir supplier tanpa PPN supplier)
  const totalModal = quo.totalModal || (quo.items || []).reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 0)), 0);

  // 3. GROSS PROFIT & MARGIN ASLI
  const grossProfit = netRevenue - totalModal;
  const marginPercent = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : 0;

  // 4. GRAND TOTAL TAGIHAN KE KLIEN (Termasuk Pajak)
  const grandTotal = netRevenue + taxAmount;

  // Subtotal COGS Items murni (untuk tabel breakdown)
  const totalItemsCOGS = (quo.items || []).reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 0)), 0);

  const isPending = quo.approvalStatus === 'Pending';
  const isApproved = quo.approvalStatus === 'Approved';
  const isManualMode = quo.quotationMode === 'manual';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      
      <div className="p-6 md:p-10 lg:p-12">
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate('/client-quotation-approval')} 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-6 transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Approval Queue
        </button>

        {/* STATUS BANNER */}
        {!isPending && (
          <div className={`mb-6 p-5 rounded-2xl border-l-8 ${
            isApproved ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center gap-3">
              {isApproved ? <CheckCircle className="text-emerald-600" size={24} /> : <XCircle className="text-red-600" size={24} />}
              <div>
                <p className={`font-black uppercase text-sm tracking-tighter ${isApproved ? 'text-emerald-800' : 'text-red-800'}`}>
                  {isApproved ? 'QUOTATION APPROVED' : 'QUOTATION REJECTED'}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                  {isApproved 
                    ? 'This quotation is now available for Client Invoice creation' 
                    : `Reason: ${quo.rejectionReason || 'No reason provided'}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                  isPending ? 'bg-amber-100 text-amber-700' : 
                  isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {quo.approvalStatus || 'Pending'}
                </span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
                  {quo.quotationId}
                </span>
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                  isManualMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isManualMode ? 'MANUAL MODE' : 'AUTO MODE'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {quo.projectName || quo.projectId}
              </h1>
              <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1"><User size={12}/> {quo.clientName || 'N/A'}</span>
                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(quo.timestamp).toLocaleDateString('id-ID')}</span>
                {isManualMode && (
                  <span className="flex items-center gap-1 text-purple-500"><Package size={12}/> Manual Input</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">Rp {grandTotal.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN - ITEMS & DETAILS */}
            <div className="lg:col-span-2 space-y-8">
              {/* INFO CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Term of Payment</label>
                  <p className="text-base font-black text-amber-600 uppercase">{quo.topOption || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Currency</label>
                  <p className="text-base font-black text-slate-800 uppercase">{quo.currency || 'IDR'}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Items Count</label>
                  <p className="text-base font-black text-slate-800">{quo.items?.length || 0} item(s)</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mode</label>
                  <p className={`text-base font-black uppercase ${isManualMode ? 'text-purple-600' : 'text-blue-600'}`}>
                    {isManualMode ? 'Manual' : 'Auto'}
                  </p>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2 mb-5">
                  <span className="w-6 h-0.5 bg-indigo-600"></span> Itemized Price Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-l-xl">Item</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Qty</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Unit</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">COGS (Modal)</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Sales Price</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right rounded-r-xl">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(quo.items || []).map((item, index) => {
                        const itemCOGS = (item.cogs || 0) * (item.quantity || 0);
                        const itemSales = (item.salesPrice || 0) * (item.quantity || 0);
                        const itemMargin = itemSales - itemCOGS;
                        const itemMarginPercent = itemSales > 0 ? ((itemMargin / itemSales) * 100).toFixed(0) : 0;
                        return (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-3 font-bold text-slate-800 text-sm uppercase">{item.itemName}</td>
                            <td className="py-4 px-3 text-center font-bold text-slate-600">{item.quantity}</td>
                            <td className="py-4 px-3 text-center font-bold text-slate-600">{item.unit}</td>
                            <td className="py-4 px-3 text-right font-bold text-slate-400">Rp {itemCOGS.toLocaleString('id-ID')}</td>
                            <td className="py-4 px-3 text-right font-black text-emerald-600">Rp {itemSales.toLocaleString('id-ID')}</td>
                            <td className="py-4 px-3 text-right">
                              <span className={`text-[9px] font-black px-2 py-1 rounded-full ${itemMargin >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {itemMarginPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100">
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan="3" className="py-4 px-3 text-right font-black text-slate-800 uppercase tracking-wider">SUBTOTAL</td>
                        <td className="py-4 px-3 text-right font-bold text-slate-600">Rp {totalItemsCOGS.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-3 text-right font-black text-emerald-600">Rp {totalSales.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-3 text-right"></td>
                      </tr>
                      {(shippingFee > 0 || taxAmount > 0) && (
                        <>
                          {shippingFee > 0 && (
                            <tr className="bg-slate-50">
                              <td colSpan="4" className="py-3 px-3 text-right font-bold text-slate-600 flex items-center justify-end gap-2">
                                <Truck size={12}/> Shipping Fee
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-700">Rp {shippingFee.toLocaleString('id-ID')}</td>
                              <td className="py-3 px-3"></td>
                            </tr>
                          )}
                          {taxAmount > 0 && (
                            <tr className="bg-slate-50">
                              <td colSpan="4" className="py-3 px-3 text-right font-bold text-slate-600 flex items-center justify-end gap-2">
                                <Receipt size={12}/> PPN {taxPercentage}%
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-700">Rp {taxAmount.toLocaleString('id-ID')}</td>
                              <td className="py-3 px-3"></td>
                            </tr>
                          )}
                          <tr className="bg-indigo-50">
                            <td colSpan="4" className="py-4 px-3 text-right font-black text-indigo-800 uppercase tracking-wider">GRAND TOTAL</td>
                            <td className="py-4 px-3 text-right font-black text-indigo-700 text-lg">Rp {grandTotal.toLocaleString('id-ID')}</td>
                            <td className="py-4 px-3 text-right"></td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* REMARKS */}
              {quo.remarks && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Package size={12}/> Remarks / Notes
                  </label>
                  <p className="text-sm text-slate-600 italic">{quo.remarks}</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - SUMMARY & ACTION */}
            <div className="space-y-6">
              {/* FINANCIAL SUMMARY CARD - UPDATED WITH EXACT MARGIN LOGIC */}
              <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <DollarSign size={14}/> Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-xs text-slate-300">Total COGS (Modal)</span>
                    <span className="font-bold text-white">Rp {totalModal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-xs text-slate-300">Subtotal (Sales Price)</span>
                    <span className="font-bold text-emerald-300">Rp {totalSales.toLocaleString('id-ID')}</span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-xs text-slate-300 flex items-center gap-1"><Truck size={10}/> Shipping Fee</span>
                      <span className="font-bold text-white">Rp {shippingFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-xs text-slate-300 flex items-center gap-1"><Receipt size={10}/> PPN {taxPercentage}%</span>
                      <span className="font-bold text-white">Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-white/20">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Grand Total</span>
                    <span className="text-xl font-black text-emerald-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Gross Margin</span>
                    <div className="text-right">
                      <span className={`text-xl font-black ${grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Rp {grossProfit.toLocaleString('id-ID')}
                      </span>
                      <span className={`text-[10px] font-black ml-2 px-2 py-0.5 rounded-full ${grossProfit >= 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}>
                        {marginPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {isPending && (
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-lg sticky top-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14}/> Management Action
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleAction('Approved')}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16}/> APPROVE QUOTATION
                    </button>
                    <button 
                      onClick={() => handleAction('Rejected')}
                      className="w-full py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={16}/> REJECT QUOTATION
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-400 text-center mt-4 uppercase tracking-widest">
                    Approval will make this quotation available for Client Invoice
                  </p>
                </div>
              )}

              {/* ALREADY PROCESSED INFO */}
              {!isPending && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14}/> Approval Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-black ${isApproved ? 'text-emerald-600' : 'text-red-600'}`}>
                        {quo.approvalStatus?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approval Date</span>
                      <span className="font-bold text-slate-700">
                        {quo.approvalDate ? new Date(quo.approvalDate).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    {quo.approvalStatus === 'Rejected' && quo.rejectionReason && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <span className="text-slate-500 block mb-1 text-[9px] font-black uppercase tracking-widest">Rejection Reason</span>
                        <p className="text-slate-700 italic text-xs bg-white p-2 rounded-lg">{quo.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BACK BUTTON */}
              <button
                onClick={() => navigate('/client-quotation-approval')}
                className="w-full py-4 border-2 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              >
                ← Back to Approval List
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientQuotationDetailReview;