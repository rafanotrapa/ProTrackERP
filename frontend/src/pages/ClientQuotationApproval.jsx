import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Clock, ArrowLeft, Package, Truck, TrendingUp, DollarSign } from 'lucide-react';
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

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('id-ID');
  };

  const calculateGrandTotal = (quo) => {
    const subtotal = quo.clientPrice || 0;
    const shipping = quo.shippingFee || 0;
    const tax = quo.taxAmount || 0;
    return subtotal + shipping + tax;
  };

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
      
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <ArrowLeft className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={24} />
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
              
              // REVENUE MURNI KLIEN (Harga Jual Barang + Ongkir) --> PPN adalah uang titipan, tidak dihitung revenue
              const netRevenue = (quo.clientPrice || 0) + (quo.shippingFee || 0); 
              
              // TOTAL MODAL MURNI (Dari Backend: Harga Beli Barang + Ongkir Supplier)
              const totalModal = quo.totalModal || 0; 
              
              // GROSS PROFIT & MARGIN ASLI
              const grossProfit = netRevenue - totalModal; 
              const marginPerc = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : 0;

              return (
                <div 
                  key={quo._id} 
                  onClick={() => navigate(`/client-quotation-approval/${quo._id}`)}
                  className="group flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 hover:bg-indigo-600 rounded-4xl border border-slate-100 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 gap-4"
                >
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className="bg-white p-4 rounded-2xl text-indigo-600 shadow-sm hidden md:block">
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
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12}/> {new Date(quo.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-white uppercase tracking-widest flex items-center gap-1">
                          Client: {quo.clientName}
                        </span>
                        {(quo.shippingFee || 0) > 0 && (
                          <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                            <Truck size={8}/> + Ongkir
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FINANCIAL METRICS */}
                  <div className="flex flex-row md:flex-col gap-4 md:gap-1 items-end bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none w-full md:w-auto border border-slate-100 md:border-none shadow-sm md:shadow-none">
                    <div className="flex flex-col text-right flex-1 md:flex-none">
                       <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest">Bill to Client</span>
                       <span className="text-base font-black text-indigo-600 group-hover:text-white">
                         {quo.currency} {formatCurrency(grandTotal)}
                       </span>
                    </div>
                    <div className="hidden md:block w-px h-8 bg-slate-200 group-hover:bg-indigo-400 mx-2"></div>
                    <div className="flex flex-col text-right flex-1 md:flex-none">
                       <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest flex items-center justify-end gap-1"><DollarSign size={10}/> Gross Margin</span>
                       <span className={`text-sm font-black ${grossProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} group-hover:text-emerald-300`}>
                         {marginPerc}%
                       </span>
                    </div>
                  </div>

                  <div className="text-slate-300 group-hover:text-white hidden md:block pl-4">
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