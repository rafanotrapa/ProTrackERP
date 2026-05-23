import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, LayoutList, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierQuotationMenu = () => {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Add New Quotation",
      desc: "Input detail COGS, Pajak & Ongkir dari Supplier.",
      icon: <FilePlus />,
      path: "/add-supplier-quotation"
    },
    {
      title: "Quotation Track Record",
      desc: "Histori penawaran dari vendor & status approval.",
      icon: <LayoutList />,
      path: "/supplier-quotation-record"
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
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Supplier <span className="text-indigo-600">Quotation</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Price Agreement</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Quotation Operations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {menus.map((menu, index) => (
            <div 
              key={index}
              onClick={() => navigate(menu.path)}
              className="group relative bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-100"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-all duration-300">
                {React.cloneElement(menu.icon, { size: 20, className: "text-slate-600 group-hover:text-white transition-all" })}
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1">{menu.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 leading-relaxed mb-3">{menu.desc}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Access</span>
                <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupplierQuotationMenu;