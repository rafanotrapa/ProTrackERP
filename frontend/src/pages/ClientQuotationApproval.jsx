import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Clock, ArrowLeft, Package, Truck, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ClientQuotationApproval = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/client_quotation/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotations(res.data);
    } catch (err) {
      console.error("Gagal load client quotations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

  // Helper untuk format currency
  const formatCurrency = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  // Helper untuk hitung grand total (subtotal + shipping + tax)
  const calculateGrandTotal = (quo) => {
    const subtotal = quo.clientPrice || 0;
    const shipping = quo.shippingFee || 0;
    const tax = quo.taxAmount || (subtotal * (quo.taxPercentage || 0) / 100);
    return subtotal + shipping + tax;
  };

  // Helper untuk get mode badge
  const getModeBadge = (mode) => {
    if (mode === 'manual') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic bg-purple-100 text-purple-600 flex items-center gap-1">
          <Package size={8}/> MANUAL
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic bg-blue-100 text-blue-600 flex items-center gap-1">
        <TrendingUp size={8}/> AUTO
      </span>
    );
  };

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
            Client Quotation <span className="text-indigo-600">Approval</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Management Verification • Pricing & Terms</p>
        </div>
      </div>

      <main className="px-12 flex-1 pb-20 pt-8">
        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 text-center font-black text-slate-200 text-3xl animate-pulse italic">SYNCING DATABASE...</div>
          ) : quotations.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
              <p className="text-slate-300 font-black italic uppercase text-lg tracking-tighter">No Pending Approvals</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">All client quotations have been processed</p>
            </div>
          ) : (
            quotations.map((quo) => {
              const grandTotal = calculateGrandTotal(quo);
              const hasShipping = (quo.shippingFee || 0) > 0;
              const hasTax = (quo.taxPercentage || 0) > 0;
              
              return (
                <div 
                  key={quo._id} 
                  onClick={() => navigate(`/client-quotation-approval/${quo._id}`)}
                  className="group flex items-center justify-between p-6 bg-slate-50 hover:bg-indigo-600 rounded-4xl border border-slate-100 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="bg-white p-4 rounded-2xl text-indigo-600 group-hover:text-indigo-600 shadow-sm">
                      <FileText size={24}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[10px] font-black text-indigo-500 group-hover:text-indigo-200 uppercase italic tracking-widest">
                          {quo.quotationId}
                        </p>
                        {getModeBadge(quo.quotationMode)}
                        <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase italic ${
                          quo.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                          quo.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {quo.approvalStatus || 'Pending'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 group-hover:text-white uppercase italic tracking-tighter mt-1">
                        {quo.projectName || quo.projectId}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10}/> {new Date(quo.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 group-hover:text-emerald-300 uppercase tracking-widest">
                          Total: Rp {formatCurrency(grandTotal)}
                        </span>
                        {hasShipping && (
                          <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                            <Truck size={8}/> + Ongkir
                          </span>
                        )}
                        {hasTax && (
                          <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-300 uppercase tracking-widest">
                            + PPN {quo.taxPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-300 group-hover:text-white pr-4">
                    <ChevronRight size={32} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientQuotationApproval;