import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LayoutList, PackagePlus, Boxes, ArrowLeft } from 'lucide-react';

const VendorMenu = () => {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Add New Vendor",
      desc: "Registrasi mitra atau supplier baru ke sistem.",
      icon: <UserPlus size={32} className="text-emerald-600" />,
      path: "/add-vendor",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-500"
    },
    {
      title: "Existing Vendors",
      desc: "Database supplier terdaftar dan evaluasi performa.",
      icon: <LayoutList size={32} className="text-blue-600" />,
      path: "/existing-vendors",
      bg: "bg-blue-50",
      border: "hover:border-blue-500"
    },
    {
      title: "Add New Item",
      desc: "Input katalog barang atau jasa baru dari vendor.",
      icon: <PackagePlus size={32} className="text-indigo-600" />,
      path: "/add-item",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-500"
    },
    {
      title: "Existing Items",
      desc: "Cek stok, harga master, dan katalog barang.",
      icon: <Boxes size={32} className="text-violet-600" />,
      path: "/existing-items",
      bg: "bg-violet-50",
      border: "hover:border-violet-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase mb-8 transition-all"
        >
          <ArrowLeft size={16} /> Back to Procurement Dashboard
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Vendor & Item Management</h1>
          <p className="text-slate-500 font-medium">Kelola database supplier dan katalog barang dalam satu modul terintegrasi.</p>
        </div>

        {/* GRID 4 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menus.map((menu, index) => (
            <div 
              key={index}
              onClick={() => navigate(menu.path)}
              className={`group cursor-pointer bg-white p-8 rounded-3xl shadow-sm border border-slate-100 ${menu.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`${menu.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {menu.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{menu.title}</h3>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                {menu.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">ProTrack ERP • Master Data Module</p>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMenu;