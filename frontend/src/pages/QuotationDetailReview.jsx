import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, ArrowLeft, Paperclip, FileText, Download, Eye } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const QuotationDetailReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quo, setQuo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/supplier_quotation/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuo(res.data);
      } catch (err) {
        console.error("Gagal tarik detail", err);
        Swal.fire('ERROR', 'Failed to load quotation details', 'error');
        navigate('/quotation-approval');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const handleAction = async (action) => {
    const isApprove = action === 'Approved';
    const result = await Swal.fire({
      title: `${isApprove ? 'APPROVE' : 'REJECT'} QUOTATION?`,
      html: isApprove 
        ? 'This supplier quotation will be available for <strong>Client Quotation</strong> creation.'
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
        
        await axios.patch(`http://localhost:5000/api/supplier_quotation/${id}/approve`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          icon: 'success',
          title: 'PROCESSED',
          text: `Supplier quotation has been ${action.toLowerCase()}`,
          confirmButtonColor: '#0f172a'
        });
        navigate('/quotation-approval');
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
        <button onClick={() => navigate('/quotation-approval')} className="mt-4 text-indigo-600 underline text-sm">Back to Queue</button>
      </div>
    </div>
  );

  const totalCOGS = (quo.items || []).reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 0)), 0);
  const additionalFee = quo.additionalFee || 0;
  const taxAmount = quo.taxAmount || 0;
  const grandTotal = totalCOGS + additionalFee + taxAmount;

  const isPending = quo.approvalStatus === 'Pending';
  const isApproved = quo.approvalStatus === 'Approved';
  const isRejected = quo.approvalStatus === 'Rejected';

  const documentUrl = quo.documentUrl ? `http://localhost:5000${quo.documentUrl}` : null;
  const isImage = documentUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(documentUrl);
  const isPdf = documentUrl && /\.pdf$/i.test(documentUrl);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      
      <div className="p-6 md:p-10 lg:p-12">
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate('/quotation-approval')} 
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
                    ? 'This quotation is now available for Client Quotation creation' 
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
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {quo.projectId}
              </h1>
              <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1">🏢 Vendor: {quo.vendorId || 'N/A'}</span>
                <span className="flex items-center gap-1">📅 {new Date(quo.timestamp).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total (COGS + Fee + Tax)</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">Rp {grandTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN - ITEMS & DETAILS */}
            <div className="lg:col-span-2 space-y-8">
              {/* INFO CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">TOP</label>
                  <p className="text-sm font-black text-amber-600 uppercase">{quo.topOption || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Additional Fee</label>
                  <p className="text-sm font-black text-slate-800">Rp {additionalFee.toLocaleString()}</p>
                  {quo.additionalFeeRemarks && <p className="text-[8px] text-slate-400">{quo.additionalFeeRemarks}</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tax</label>
                  <p className="text-sm font-black text-slate-800">{quo.isTaxIncluded ? `${quo.taxPercentage}%` : 'No Tax'}</p>
                  {quo.isTaxIncluded && <p className="text-[8px] text-slate-400">Rp {taxAmount.toLocaleString()}</p>}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Items</label>
                  <p className="text-sm font-black text-slate-800">{quo.items?.length || 0} item(s)</p>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2 mb-5">
                  <span className="w-6 h-0.5 bg-indigo-600"></span> Itemized COGS (Supplier Price)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-l-xl">Item</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Qty</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Unit</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right rounded-r-xl">Unit Price (COGS)</th>
                        <th className="py-4 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right rounded-r-xl">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(quo.items || []).map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-3 font-bold text-slate-800 text-sm uppercase">{item.itemName}</td>
                          <td className="py-4 px-3 text-center font-bold text-slate-600">{item.quantity}</td>
                          <td className="py-4 px-3 text-center font-bold text-slate-600">{item.unit}</td>
                          <td className="py-4 px-3 text-right font-bold text-indigo-600">Rp {item.cogs?.toLocaleString()}</td>
                          <td className="py-4 px-3 text-right font-bold text-slate-700">Rp {((item.cogs || 0) * (item.quantity || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100">
                      <tr>
                        <td colSpan="3" className="py-4 px-3 text-right font-black text-slate-800 uppercase tracking-wider">TOTAL COGS</td>
                        <td className="py-4 px-3 text-right font-black text-indigo-600">Rp {totalCOGS.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* REMARKS */}
              {quo.remarks && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Remarks / Notes</label>
                  <p className="text-sm text-slate-600 italic">{quo.remarks}</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - DOCUMENT PREVIEW & ACTION */}
            <div className="space-y-6">
              {/* DOCUMENT PREVIEW CARD */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-lg">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Paperclip size={14}/> Attached Document
                  </h3>
                </div>
                <div className="p-4">
                  {documentUrl ? (
                    <div>
                      {/* IMAGE PREVIEW */}
                      {isImage && (
                        <div className="relative group">
                          <img 
                            src={documentUrl} 
                            alt="Quotation Document" 
                            className="w-full h-auto rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(documentUrl, '_blank')}
                          />
                          <button
                            onClick={() => window.open(documentUrl, '_blank')}
                            className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      )}
                      
                      {/* PDF PREVIEW - tampilkan thumbnail/icon + link */}
                      {isPdf && (
                        <div className="text-center">
                          <div className="bg-slate-100 rounded-2xl p-8 mb-4">
                            <FileText size={64} className="text-red-500 mx-auto mb-3" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PDF Document</p>
                          </div>
                          <button
                            onClick={() => window.open(documentUrl, '_blank')}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black text-white text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={14}/> Open PDF Document
                          </button>
                        </div>
                      )}
                      
                      {!isImage && !isPdf && (
                        <div className="text-center py-8">
                          <FileText size={48} className="text-slate-300 mx-auto mb-3" />
                          <a 
                            href={documentUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-indigo-600 text-xs font-bold underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Document Attached</p>
                      <p className="text-[8px] text-slate-400 mt-1">Supplier did not upload any file</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS (HANYA UNTUK PENDING) */}
              {isPending && (
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-lg sticky top-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle size={14}/> Management Action
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
                    Approval will make this quotation available for Client Quotation
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
                        {quo.approvalDate ? new Date(quo.approvalDate).toLocaleString() : '-'}
                      </span>
                    </div>
                    {isRejected && quo.rejectionReason && (
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
                onClick={() => navigate('/quotation-approval')}
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

export default QuotationDetailReview;