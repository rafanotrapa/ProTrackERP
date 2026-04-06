import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Ambil data user yang login (Rafa/Marketing1/dll)
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'User', role: 'Guest' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Daftar Modul Marketing sesuai requirement lo
  const roleConfig = {
    Marketing: [
      { title: 'Add Project', icon: '📁', desc: 'Input data project baru.', path: '/add-project', color: 'border-blue-500' },
      { title: 'Create Quotation', icon: '📝', desc: 'Buat penawaran harga detail.', path: '/client-quote', color: 'border-green-500' },
      { title: 'Invoice', icon: '📄', desc: 'Auto-fill invoice & PDF generator.', path: '/invoice', color: 'border-purple-500' },
      { title: 'Timeline Monitoring', icon: '📊', desc: 'Pantau progress fisik & payment.', path: '/timeline', color: 'border-orange-500' },
    ],
    Procurement: [
        { 
          title: 'Vendor & Items', 
          icon: '📦', 
          desc: 'Kelola data Master Supplier dan katalog barang.', 
          path: '/vendor', 
          color: 'border-emerald-500' 
        },
        { 
          title: 'Supplier Quotation', 
          icon: '📥', 
          desc: 'Input penawaran harga (COGS) dari supplier.', 
          path: '/supplier-quote', 
          color: 'border-teal-500' 
        },
        { 
          title: 'Purchase Order (PO)', 
          icon: '📝', 
          desc: 'Buat pesanan resmi ke supplier setelah Project Deal.', 
          path: '/create-po', 
          color: 'border-blue-600' 
        },
        { 
          title: 'Receive & QC', 
          icon: '✅', 
          desc: 'Input barang datang dan pengecekan kualitas.', 
          path: '/qc-check', 
          color: 'border-orange-500' 
        },
        { 
          title: 'Return & Claims', 
          icon: '🔄', 
          desc: 'Kelola pengembalian barang yang gagal QC.', 
          path: '/return-claims', 
          color: 'border-red-500' 
        },
        { 
          title: 'Upload Supplier Invoice', 
          icon: '📤', 
          desc: 'Input tagihan supplier untuk diproses oleh Finance.', 
          path: '/upload-invoice-supplier', 
          color: 'border-purple-600' 
        },
      ],
      Finance: [
        { 
          title: 'Client Invoice', 
          icon: '🧾', 
          desc: 'Generate invoice (DP/Termin) berdasarkan Quotation Deal.', 
          path: '/client-invoice', 
          color: 'border-violet-500' 
        },
        { 
          title: 'Payment Verification', 
          icon: '🛡️', 
          desc: 'Verifikasi bukti bayar client & update progress project.', 
          path: '/verify-payment', 
          color: 'border-fuchsia-500' 
        },
        { 
          title: 'Supplier Payment', 
          icon: '💸', 
          desc: 'Bayar tagihan supplier berdasarkan PO & TOP.', 
          path: '/supplier-payment', 
          color: 'border-pink-500' 
        },
        { 
          title: 'Financial Summary', 
          icon: '📈', 
          desc: 'Monitoring Cashflow (In vs Out) & Sisa Piutang Client.', 
          path: '/finance-summary', 
          color: 'border-cyan-600' 
        },
      ],
    Admin: [
      { title: 'User Management', icon: '👥', desc: 'Atur akun karyawan dan role.', path: '/manage-users', color: 'border-slate-800' },
      { title: 'System Logs', icon: '🛡️', desc: 'Pantau aktivitas sistem ProTrack.', path: '/logs', color: 'border-red-800' },
    ]
  };

  const userModules = roleConfig[user.role] || [];

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* NAVBAR: Sesuai Mockup (ProTrack ERP & Profile) */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center border-b-4 border-indigo-700">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-700 p-2 rounded-lg text-white font-black">PT</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tighter">
            PROTRACK <span className="text-indigo-700 text-sm font-black">ERP</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-800 leading-none">{user.username}</p>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-all shadow-sm"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-black text-slate-800">
            Welcome Back, <span className="text-indigo-700">{user.username}!</span>
          </h2>
          <p className="text-slate-500 font-medium">Apa yang ingin lo kerjakan di ProTrack hari ini?</p>
        </header>
        
        {/* GRID MODULE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {userModules.length > 0 ? (
            userModules.map((mod, index) => (
              <div 
                key={index}
                onClick={() => navigate(mod.path)}
                className={`bg-white p-6 rounded-2xl shadow-sm border-b-8 ${mod.color} hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group`}
              >
                <div className="text-5xl mb-6 group-hover:drop-shadow-lg transition-all">{mod.icon}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{mod.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{mod.desc}</p>
                
                <div className="mt-6 flex items-center text-indigo-600 font-bold text-xs uppercase tracking-wider group-hover:gap-2 transition-all">
                  Buka Modul <span>→</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-10 bg-white rounded-xl text-center shadow-sm">
               <p className="text-slate-500 font-bold">Role lo "{user.role}" belum punya akses modul nih, Fa.</p>
            </div>
          )}
        </div>

        {/* FOOTER STATS SIMPEL (Opsional buat pemanis) */}
        <div className="mt-12 p-6 bg-indigo-900 rounded-2xl text-white flex flex-wrap gap-8 items-center shadow-lg">
          <div>
            <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest">Active Projects</p>
            <p className="text-2xl font-black">12</p>
          </div>
          <div className="h-10 w-[1px] bg-indigo-700 hidden md:block"></div>
          <div>
            <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest">Pending Quotations</p>
            <p className="text-2xl font-black">5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;