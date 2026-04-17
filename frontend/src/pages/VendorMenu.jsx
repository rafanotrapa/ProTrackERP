import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LayoutList, PackagePlus, Boxes } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const VendorMenu = () => {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Add New Vendor",
      desc: "Registrasi mitra atau supplier baru ke sistem.",
      icon: <UserPlus size={32} className="text-emerald-600" />,
      path: "/add-vendor",
      bg: "bg-emerald-50",
      accent: "bg-emerald-600"
    },
    {
      title: "Existing Vendors",
      desc: "Database supplier terdaftar dan evaluasi performa.",
      icon: <LayoutList size={32} className="text-blue-600" />,
      path: "/existing-vendors",
      bg: "bg-blue-50",
      accent: "bg-blue-600"
    },
    {
      title: "Add New Item",
      desc: "Input katalog barang atau jasa baru dari vendor.",
      icon: <PackagePlus size={32} className="text-indigo-600" />,
      path: "/add-item",
      bg: "bg-indigo-50",
      accent: "bg-indigo-600"
    },
    {
      title: "Existing Items",
      desc: "Cek stok, harga master, dan katalog barang.",
      icon: <Boxes size={32} className="text-violet-600" />,
      path: "/existing-items",
      bg: "bg-violet-50",
      accent: "bg-violet-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* SUB-HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Vendor & <span className="text-indigo-600">Item</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Master Data Management</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex justify-between items-end mb-8 px-2">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Available Operations</h2>
          </div>

          {/* GRID 4 CARDS - High End Version */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {menus.map((menu, index) => (
              <div 
                key={index}
                onClick={() => navigate(menu.path)}
                className="group relative cursor-pointer bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-100/50 transition-all duration-500 hover:-translate-y-3 hover:border-indigo-200 hover:shadow-2xl active:scale-95 overflow-hidden"
              >
                {/* Decorative Accent Bar */}
                <div className={`absolute top-0 left-0 w-full h-2 ${menu.accent} opacity-20 group-hover:opacity-100 transition-opacity`}></div>

                <div className={`${menu.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
                  {menu.icon}
                </div>
                
                <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-800 leading-tight">
                  {menu.title}
                </h3>
                
                <p className="text-slate-400 text-[11px] font-bold mt-4 leading-relaxed uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity">
                  {menu.desc}
                </p>

                <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  Open Module <span>→</span>
                </div>

                {/* Big Number Background */}
                <span className="absolute -bottom-6 -right-2 text-7xl font-black italic text-slate-50 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                  0{index + 1}
                </span>
              </div>
            ))}
          </div>

          {/* INTERNAL NOTE */}
          <div className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div>
                   <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] italic mb-1">System Integrity Note</p>
                   <p className="text-white font-black text-sm uppercase italic tracking-tighter italic">"Database vendor dan katalog terpusat untuk akurasi Quotation & Purchase Order."</p>
                </div>
                <div className="flex gap-2">
                   <div className="h-2 w-10 bg-indigo-600 rounded-full"></div>
                   <div className="h-2 w-4 bg-slate-700 rounded-full"></div>
                </div>
             </div>
             {/* Background Decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 font-black italic text-6xl tracking-tighter pointer-events-none select-none">
                PROTRACK MASTER DATA
             </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VendorMenu;