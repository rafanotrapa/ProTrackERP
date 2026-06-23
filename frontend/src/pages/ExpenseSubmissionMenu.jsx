import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, LayoutList, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ExpenseSubmissionMenu = () => {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Submit Expense",
      desc: "Ajukan biaya di luar quotation supplier (meeting, entertainment, dll) ke Finance.",
      icon: <ReceiptText />,
      path: "/add-expense-submission"
    },
    {
      title: "Expense Log",
      desc: "Histori semua pengajuan biaya beserta status verifikasi Finance.",
      icon: <LayoutList />,
      path: "/expense-submission-log"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-white shadow-sm z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-amber-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Expense <span className="text-amber-600">Submission</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">
            Biaya Tambahan • Reimburse & Operasional Project
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">
            Expense Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {menus.map((menu, index) => (
            <div
              key={index}
              onClick={() => navigate(menu.path)}
              className="group relative bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-100"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-amber-600 transition-all duration-300">
                {React.cloneElement(menu.icon, { size: 20, className: "text-slate-600 group-hover:text-white transition-all" })}
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1">{menu.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 leading-relaxed mb-3">{menu.desc}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Access</span>
                <ArrowRight size={12} className="text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Setiap pengajuan akan masuk sebagai beban tambahan project setelah disetujui Finance.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExpenseSubmissionMenu;