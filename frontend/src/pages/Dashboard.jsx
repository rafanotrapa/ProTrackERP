import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { username: 'User', role: 'Guest' };
  });

  const allModules = {
    Marketing: [
      { title: 'Add Project', icon: '📁', desc: 'Input data project baru.', path: '/add-project', color: 'border-blue-500' },
      { title: 'Create Quotation', icon: '📝', desc: 'Buat penawaran harga detail.', path: '/client-quote', color: 'border-green-500' },
      { title: 'Create Invoice', icon: '🧾', desc: 'Buat invoice untuk customer.', path: '/client-invoice', color: 'border-orange-500' },
      { title: 'Timeline Monitoring', icon: '📊', desc: 'Pantau progress fisik & payment.', path: '/timeline', color: 'border-orange-500' }
    ],
    Procurement: [
      { title: 'Vendor Directory', icon: '📦', desc: 'Kelola Master Supplier / Vendor.', path: '/vendor', color: 'border-emerald-500' },
      { title: 'Supplier Quotation', icon: '📥', desc: 'Input COGS dan barang dari supplier.', path: '/add-supplier-quotation', color: 'border-teal-500' },
      { title: 'Purchase Order', icon: '📝', desc: 'Buat pesanan resmi ke supplier.', path: '/create-po', color: 'border-blue-600' },
      { title: 'Return Goods', icon: '🔄', desc: 'Proses pengembalian barang ke vendor.', path: '/return-goods', color: 'border-red-500' },
      { title: 'Invoice Submission', icon: '📤', desc: 'Kirim invoice supplier ke Finance.', path: '/upload-to-finance', color: 'border-slate-600' },
    ],
    Finance: [
      { title: 'Client Invoice', icon: '🧾', desc: 'Generate tagihan dari Quotation.', path: '/client-invoice', color: 'border-violet-500' },
      { title: 'Client Payment', icon: '💰', desc: 'Input pembayaran masuk dari client.', path: '/client-payment', color: 'border-emerald-600' },
      { title: 'Payment Verification', icon: '🛡️', desc: 'Verifikasi bukti bayar client.', path: '/verify-payment', color: 'border-fuchsia-500' },
      { title: 'Supplier Payment', icon: '💸', desc: 'Proses pembayaran hutang ke vendor.', path: '/supplier-payment', color: 'border-rose-500' },
      { title: 'Financial Report', icon: '📈', desc: 'Laporan laba rugi per project.', path: '/finance-report', color: 'border-slate-900' },
    ],
    Admin: [
      { title: 'User Management', icon: '👥', desc: 'Atur akun karyawan dan role.', path: '/manage-users', color: 'border-slate-800' },
      { title: 'System Logs', icon: '🛡️', desc: 'Audit aktivitas sistem ProTrack.', path: '/logs', color: 'border-red-800' },
    ],
    Owner: [
      { 
        title: 'Executive Summary', 
        icon: '💎', 
        desc: 'Analisis profit, cashflow, dan performa bisnis.', 
        path: '/owner-insight', 
        color: 'border-amber-600' 
      },
    ],
  };

  let userModules = [];
  
  if (user.role === 'Admin') {
    userModules = [...allModules.Admin];
  } else if (user.role === 'Management') {
    userModules = [...allModules.Marketing, ...allModules.Procurement, ...allModules.Finance];
  } else if (user.role === 'Owner') {
    userModules = [...allModules.Owner, ...allModules.Finance.filter(f => f.title === 'Financial Report')];
  } else {
    userModules = allModules[user.role] || [];
  }

  return (
    <div className="min-h-screen font-sans bg-slate-50 flex flex-col">
      <Header />

      <div className="flex-1 p-6 mx-auto w-full max-w-7xl md:p-12">
        <header className="flex flex-col gap-4 justify-between items-start mb-12 md:flex-row md:items-end">
          <div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Welcome, <span className="text-indigo-600">{user.username}</span>
            </h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                {['Admin', 'Management', 'Owner'].includes(user.role) 
                  ? 'Strategic Monitoring Dashboard' 
                  : `Operational Dashboard • ${user.role} Division`}
            </p>
          </div>
          
          <div className="px-6 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">System Status</p>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="font-black italic uppercase text-slate-700 text-sm">Online • Secure</p>
             </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {userModules.length > 0 ? (
            userModules.map((mod, idx) => (
              <div 
                key={`${mod.path}-${idx}`}
                onClick={() => navigate(mod.path)}
                className={`group relative p-8 bg-white border-b-8 ${mod.color} cursor-pointer overflow-hidden rounded-[2.5rem] shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-3 hover:shadow-2xl active:scale-95`}
              >
                <div className="mb-8 text-6xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {mod.icon}
                </div>
                <h3 className="mb-3 text-xl font-black italic uppercase tracking-tight text-slate-800">{mod.title}</h3>
                <p className="text-xs font-bold leading-relaxed opacity-80 text-slate-500">{mod.desc}</p>
                
                <div className="flex items-center mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 transition-all group-hover:translate-x-2">
                  Launch Module <span className="ml-2">→</span>
                </div>

                <div className="absolute -right-4 -bottom-4 text-slate-50 font-black text-6xl italic opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx + 1}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-20 text-center bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
               <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-300">No Access Modules Assigned.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;