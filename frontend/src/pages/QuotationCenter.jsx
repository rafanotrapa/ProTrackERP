import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, FileText, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const QuotationCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />
      
      {/* HEADER - SAMA SEPERTI DASHBOARD */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Quotation <span className="text-indigo-600">Center</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Create & Manage Client Quotations</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CARD KIRI: CREATE NEW QUOTATION */}
          <div 
            onClick={() => navigate('/client-quote')}
            className="group relative bg-white border-2 border-slate-100 rounded-3xl p-8 cursor-pointer hover:border-indigo-600 hover:shadow-2xl transition-all overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 text-slate-50 font-black text-8xl italic opacity-0 group-hover:opacity-100 transition-opacity">
              01
            </div>
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 transition-all">
              <FilePlus size={28} className="text-indigo-600 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Create Quotation</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Buat quotation baru untuk client. Isi items, sales price, dan TOP.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-indigo-600 group-hover:translate-x-2 transition-transform">
              Start Creating <span>→</span>
            </div>
          </div>

          {/* CARD KANAN: QUOTATION LOG */}
          <div 
            onClick={() => navigate('/quotation-log')}
            className="group relative bg-white border-2 border-slate-100 rounded-3xl p-8 cursor-pointer hover:border-indigo-600 hover:shadow-2xl transition-all overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 text-slate-50 font-black text-8xl italic opacity-0 group-hover:opacity-100 transition-opacity">
              02
            </div>
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-800 transition-all">
              <FileText size={28} className="text-slate-600 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Quotation Log</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Lihat history quotation, status approval, dan detail.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-600 group-hover:translate-x-2 transition-transform">
              View History <span>→</span>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuotationCenter;