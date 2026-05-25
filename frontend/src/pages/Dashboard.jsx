import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlus, FileText, Receipt, CreditCard, Calendar, 
  Truck, Package, ClipboardCheck, FileCheck, 
  Users, Logs, Award, Shield, DollarSign, BarChart3,
  ArrowRight, CircleDot, Layers, Briefcase, Sparkles, TrendingUp
} from 'lucide-react';
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
      { title: 'Add Project', icon: FolderPlus, desc: 'Input data project baru', path: '/add-project' },
      { title: 'Create Quotation', icon: FileText, desc: 'Buat penawaran harga detail', path: '/quotation-center' },
      { title: 'Create Invoice', icon: Receipt, desc: 'Buat invoice untuk customer', path: '/invoice-center' },
      { title: 'Input Payment', icon: CreditCard, desc: 'Upload bukti transfer client', path: '/input-payment' },
      { title: 'Project Timeline', icon: Calendar, desc: 'Monitor progress & milestones', path: '/timeline' }
    ],
    Procurement: [
      { title: 'Vendor Directory', icon: Package, desc: 'Kelola Master Supplier', path: '/vendor' },
      { title: 'Supplier Quotation', icon: FileCheck, desc: 'Input COGS dari supplier', path: '/supplier-quotation-menu' },
      { title: 'Purchase Order', icon: ClipboardCheck, desc: 'Kelola & Histori PO', path: '/po-menu' },
      { title: 'Receive & QC Goods', icon: '🔍', desc: 'Terima, cek barang & proses retur.', path: '/receive-qc', color: 'border-amber-500' },
      { title: 'Invoice Submission', icon: FileText, desc: 'Kirim tagihan vendor ke Finance', path: '/supplier-invoice-menu' },
      { title: 'Delivery Management', icon: Truck, desc: 'Jadwal pengiriman ke klien', path: '/delivery-management' }
    ],
    Finance: [
      { title: 'Project Billing', icon: Receipt, desc: 'Generate tagihan dari Quotation', path: '/project-billing' },
      { title: 'Input Payment', icon: CreditCard, desc: 'Input pembayaran masuk', path: '/finance-input-payment' },
      { title: 'Payment Verification', icon: Shield, desc: 'Verifikasi bukti bayar', path: '/verify-payment' },
      { title: 'Supplier Payment', icon: DollarSign, desc: 'Proses pembayaran vendor', path: '/supplier-payment' },
      { title: 'Financial Report', icon: BarChart3, desc: 'Laporan laba rugi', path: '/financial-report' }
    ],
    Admin: [
      { title: 'User Management', icon: Users, desc: 'Atur akun karyawan', path: '/manage-users' },
      { title: 'System Logs', icon: Logs, desc: 'Audit aktivitas sistem', path: '/logs' }
    ],
    Owner: [
      { title: 'Executive Summary', icon: Award, desc: 'Analisis profit & performa', path: '/owner-insight' }
    ],
    Management: [
      { title: 'Supplier Quotation Approval', icon: FileCheck, desc: 'Approve penawaran supplier', path: '/quotation-approval' },
      { title: 'Client Quotation Approval', icon: FileText, desc: 'Approve quotation client', path: '/client-quotation-approval' },
      { title: 'Transaction Approval', icon: Shield, desc: 'Verifikasi transaksi', path: '/approve-transaction' }
    ]
  };

  let userModules = [];
  if (user.role === 'Admin') {
    userModules = [...allModules.Admin];
  } else if (user.role === 'Management') {
    userModules = [...allModules.Management];
  } else if (user.role === 'Owner') {
    userModules = [...allModules.Owner, ...allModules.Finance.filter(f => f.title === 'Financial Report')];
  } else {
    userModules = allModules[user.role] || [];
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />

      <main className="flex-1 px-6 md:px-10 py-8 max-w-7xl mx-auto w-full">
        <div className="relative mb-10 bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-indigo-400" />
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">ProTrack ERP</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic leading-tight">
                {greeting()}, <span className="text-indigo-600">{user.username}</span>
              </h1>
              <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest">
                {user.role} • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100">
              <CircleDot size={16} className="text-emerald-500" />
              <div>
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">System Status</p>
                <p className="text-slate-800 font-black text-xs uppercase">Operational</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Layers size={18} className="text-indigo-500" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Quick Access</h2>
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[8px] font-black text-slate-400">{userModules.length} Modules</span>
          </div>
          
          {userModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {userModules.map((mod, idx) => (
                <div 
                  key={`${mod.path}-${idx}`}
                  onClick={() => navigate(mod.path)}
                  className="group relative bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-100"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-all duration-300">
                    <mod.icon size={20} className="text-slate-600 group-hover:text-white transition-all" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1">
                    {mod.title}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 leading-relaxed mb-3">
                    {mod.desc}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Access</span>
                    <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-slate-200">
              <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-xl font-black italic text-slate-400 uppercase tracking-tighter">No Modules Available</p>
              <p className="text-[9px] text-slate-400 mt-2">Contact administrator for access</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;