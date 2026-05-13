import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
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
      title: `${isApprove ? 'APPROVE' : 'REJECT'}?`,
      text: "Keputusan ini bersifat final untuk modul marketing.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      confirmButtonText: `YES, ${action}`
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/client_quotation/${id}/approve`, 
          { status: action },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire('PROCESSED', `Client Quotation has been ${action}`, 'success');
        navigate('/client-quotation-approval');
      } catch (err) {
        Swal.fire('ERROR', 'Failed to process action', 'error');
      }
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse italic">LOADING DATA...</div>;
  if (!quo) return <div>Data not found</div>;

  const totalItems = (quo.items || []).reduce((sum, item) => sum + (item.cogs * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      
      <div className="p-8 md:p-12">
        {/* BACK BUTTON */}
        <button onClick={() => navigate('/client-quotation-approval')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-8 transition-all">
          <ArrowLeft size={16}/> Back to Queue
        </button>

        {/* SINGLE COLUMN LAYOUT - FULL WIDTH */}
        <div className="max-w-4xl mx-auto space-y-10">
          <header>
            <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[9px] font-black uppercase italic tracking-widest">Verification Mode</span>
            <h1 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter mt-4 leading-none">
              {quo.projectId}
            </h1>
            <p className="text-slate-400 font-bold mt-2 italic uppercase text-xs">Origin ID: {quo.quotationId} • Created: {new Date(quo.timestamp).toLocaleString()}</p>
          </header>

          <section className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Client Name</label>
              <p className="text-xl font-black text-slate-800 italic uppercase">{quo.clientName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Term of Payment</label>
              <p className="text-xl font-black text-amber-500 italic uppercase">{quo.topOption || 'N/A'}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Currency</label>
              <p className="text-xl font-black text-slate-800 italic uppercase">{quo.currency || 'IDR'}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sales Price to Client</label>
              <p className="text-2xl font-black text-emerald-600 italic tracking-tighter">Rp {quo.clientPrice?.toLocaleString()}</p>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-indigo-600"></span> Itemized Price List
            </h3>
            <div className="space-y-4">
              {(quo.items || []).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-6 bg-slate-50 rounded-4xl border border-slate-100">
                  <div>
                    <h4 className="font-black text-slate-800 italic uppercase">{item.itemName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">COGS (Supplier Price)</p>
                    <p className="text-lg font-black text-slate-500 italic line-through">Rp {item.cogs?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Remarks / Notes</span>
              <p className="italic text-sm">{quo.remarks || 'No additional remarks.'}</p>
            </div>
            <div className="flex justify-between items-end flex-wrap gap-6">
              <div>
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Total COGS (Modal)</span>
                <p className="text-2xl font-black italic tracking-tighter text-white/70">Rp {totalItems.toLocaleString()}</p>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Margin: Rp {(quo.clientPrice - totalItems).toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Sales Price to Client</span>
                <p className="text-4xl font-black italic tracking-tighter">Rp {quo.clientPrice?.toLocaleString()}</p>
              </div>
              {quo.approvalStatus === 'Pending' && (
                <div className="flex gap-4">
                  <button onClick={() => handleAction('Rejected')} className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                    <XCircle size={16}/> Reject
                  </button>
                  <button onClick={() => handleAction('Approved')} className="flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/30">
                    <CheckCircle size={16}/> Approve
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientQuotationDetailReview;