import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Clock, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const QuotationApproval = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/supplier_quotation/pending', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotations(res.data);
    } catch (err) {
      console.error("Gagal load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

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
            Verification <span className="text-indigo-600">Queue</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Procurement • Cost Center Verification</p>
        </div>
      </div>

      <main className="px-12 flex-1 pb-20 pt-8">
        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 text-center font-black text-slate-200 text-3xl animate-pulse italic">SYNCING DATABASE...</div>
          ) : quotations.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
              <p className="text-slate-300 font-black italic uppercase text-lg tracking-tighter">No Pending Approvals</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">All supplier quotations have been processed</p>
            </div>
          ) : (
            quotations.map((quo) => (
              <div 
                key={quo._id} 
                onClick={() => navigate(`/quotation-approval/${quo._id}`)}
                className="group flex items-center justify-between p-6 bg-slate-50 hover:bg-indigo-600 rounded-4xl border border-slate-100 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl text-indigo-600 group-hover:text-indigo-600 shadow-sm">
                    <FileText size={24}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-500 group-hover:text-indigo-200 uppercase italic tracking-widest">{quo.quotationId}</p>
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-white uppercase italic tracking-tighter">
                      Project: {quo.projectId}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10}/> {new Date(quo.timestamp).toLocaleDateString()}
                      </span>
                      <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase italic ${
                        quo.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                        quo.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {quo.approvalStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-white pr-4">
                  <ChevronRight size={32} />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuotationApproval;