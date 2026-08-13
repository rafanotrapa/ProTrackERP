import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FolderPlus, FileText, Receipt, CreditCard, Calendar,
  Truck, Package, ClipboardCheck, FileCheck,
  Users, Logs, Award, Shield, DollarSign, BarChart3,
  ArrowRight, CircleDot, Layers, Briefcase, Sparkles, TrendingUp, Boxes,
  PackageSearch
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const UI_TEXT = {
  id: {
    quickAccess: 'Akses Cepat',
    modules: 'Modul',
    systemStatus: 'Status Sistem',
    operational: 'Beroperasi',
    access: 'Buka',
    noModules: 'Belum Ada Modul',
    contactAdmin: 'Hubungi administrator untuk mendapatkan akses',
    myProjects: 'Project Saya',
    myProjectsSub: 'Project yang Anda pegang sebagai PIC',
    allProjects: 'Seluruh Project',
    allProjectsSub: 'Pantauan semua project beserta pemegangnya',
    colProject: 'Project',
    colClient: 'Klien',
    colValue: 'Nilai',
    colPic: 'PIC',
    colStatus: 'Status',
    noProjects: 'Belum ada project',
    noProjectsMine: 'Anda belum memegang project. Project yang Anda buat akan muncul di sini.',
    loadingProjects: 'Memuat project...',
  },
  en: {
    quickAccess: 'Quick Access',
    modules: 'Modules',
    systemStatus: 'System Status',
    operational: 'Operational',
    access: 'Access',
    noModules: 'No Modules Available',
    contactAdmin: 'Contact administrator for access',
    myProjects: 'My Projects',
    myProjectsSub: 'Projects you hold as PIC',
    allProjects: 'All Projects',
    allProjectsSub: 'Overview of every project and its holder',
    colProject: 'Project',
    colClient: 'Client',
    colValue: 'Value',
    colPic: 'PIC',
    colStatus: 'Status',
    noProjects: 'No projects yet',
    noProjectsMine: 'You are not holding any project yet. Projects you create will appear here.',
    loadingProjects: 'Loading projects...',
  },
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { username: 'User', role: 'Guest' };
  });

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'id');
  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };
  const t = UI_TEXT[lang];

  // Marketing melihat project yang dia pegang; Management dan Owner melihat
  // semuanya lengkap dengan PIC. Peran lain tidak menampilkan tabel apa pun.
  const tabelMilikSendiri = user.role === 'Marketing';
  const tabelSemua = user.role === 'Management' || user.role === 'Owner';
  const pakaiTabel = tabelMilikSendiri || tabelSemua;

  const [projects, setProjects] = useState([]);
  const [memuatProject, setMemuatProject] = useState(pakaiTabel);

  useEffect(() => {
    if (!pakaiTabel) return;
    let batal = false;

    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!batal) setProjects(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!batal) setProjects([]);
      } finally {
        if (!batal) setMemuatProject(false);
      }
    })();

    return () => { batal = true; };
  }, [pakaiTabel]);

  // createdBy di-populate server jadi berbentuk objek; project lama bernilai null.
  const daftarProject = tabelMilikSendiri
    ? projects.filter((p) => p.createdBy && p.createdBy._id === user.id)
    : projects;

  const fmtNilai = (v) => (v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0');

  const allModules = {
    Marketing: [
      { title: 'Project Center', icon: FolderPlus, desc: 'Tambah project baru & lihat log', descEn: 'Add new projects & view logs', path: '/project-center' },
      { title: 'Create Quotation', icon: FileText, desc: 'Buat quotation harga untuk client', descEn: 'Create detailed price quotations', path: '/quotation-center' },
      { title: 'Create Invoice', icon: Receipt, desc: 'Buat invoice untuk client', descEn: 'Create invoices for customers', path: '/invoice-center' },
      { title: 'Input Payment', icon: CreditCard, desc: 'Upload bukti transfer client & riwayatnya', descEn: 'Upload client transfer proof & view log', path: '/input-payment-center' },
      { title: 'Project Timeline', icon: Calendar, desc: 'Pantau progress & milestone project', descEn: 'Monitor progress & milestones', path: '/timeline' },
      { title: 'Expense Submission', icon: FileText, desc: 'Ajukan biaya meeting/entertainment ke Finance', descEn: 'Submit meeting/entertainment expenses to Finance', path: '/expense-submission-menu' }
    ],
    Procurement: [
      { title: 'Vendor Directory', icon: Package, desc: 'Kelola data master supplier', descEn: 'Manage master suppliers', path: '/vendor' },
      { title: 'Supplier Quotation', icon: FileCheck, desc: 'Input harga modal (COGS) dari supplier', descEn: 'Input COGS from suppliers', path: '/supplier-quotation-menu' },
      { title: 'Purchase Order', icon: ClipboardCheck, desc: 'Kelola & riwayat PO', descEn: 'Manage & track PO history', path: '/po-menu' },
      { title: 'Receive & QC Goods', icon: PackageSearch, desc: 'Terima, cek barang & proses retur', descEn: 'Receive, inspect goods & process returns', path: '/receive-qc', color: 'border-amber-500' },
      { title: 'Invoice Submission', icon: FileText, desc: 'Teruskan tagihan vendor ke Finance', descEn: 'Forward vendor invoices to Finance', path: '/supplier-invoice-menu' },
      { title: 'Delivery Management', icon: Truck, desc: 'Atur jadwal pengiriman ke client', descEn: 'Schedule deliveries to clients', path: '/delivery-management' },
      { title: 'Inventory Storage', icon: Boxes, desc: 'Stok barang dari PO: sisa & terpakai', descEn: 'PO stock: remaining & used', path: '/inventory' },
      { title: 'Expense Submission', icon: FileText, desc: 'Ajukan biaya operasional ke Finance', descEn: 'Submit operational expenses to Finance', path: '/expense-submission-menu' }
    ],
    Finance: [
      { title: 'Project Billing', icon: Receipt, desc: 'Terbitkan invoice dari quotation', descEn: 'Generate invoices from quotations', path: '/project-billing' },
      { title: 'Client Payment', icon: CreditCard, desc: 'Input pembayaran masuk', descEn: 'Input incoming payments', path: '/finance-payment-center' },
      { title: 'Payment Verification', icon: Shield, desc: 'Verifikasi bukti bayar client', descEn: 'Verify client payment proofs', path: '/verify-payment' },
      { title: 'Supplier Payment', icon: DollarSign, desc: 'Proses pembayaran ke vendor', descEn: 'Process vendor payments', path: '/supplier-payment' },
      { title: 'Project Financial Summary', icon: BarChart3, desc: 'Ringkasan pendapatan & biaya per project', descEn: 'Revenue & cost summary per project', path: '/financial-report' },
      { title: 'Expense Submission', icon: FileText, desc: 'Ajukan & verifikasi biaya tambahan project', descEn: 'Submit & verify additional project expenses', path: '/expense-submission-menu' }
    ],
    Admin: [
      { title: 'User Management', icon: Users, desc: 'Atur akun karyawan', descEn: 'Manage employee accounts', path: '/manage-users' },
      { title: 'System Logs', icon: Logs, desc: 'Audit aktivitas sistem', descEn: 'Audit system activity', path: '/logs' }
    ],
    Owner: [
      { title: 'Project Financial Summary', icon: BarChart3, desc: 'Ringkasan pendapatan & biaya per project', descEn: 'Revenue & cost summary per project', path: '/financial-report' },
      { title: 'Project Timeline', icon: Calendar, desc: 'Pantau progress & milestone project', descEn: 'Monitor progress & milestones', path: '/timeline' }
    ],
    Management: [
      { title: 'Supplier Quotation Approval', icon: FileCheck, desc: 'Approve quotation dari supplier', descEn: 'Approve supplier quotations', path: '/quotation-approval' },
      { title: 'Client Quotation Approval', icon: FileText, desc: 'Approve quotation untuk client', descEn: 'Approve client quotations', path: '/client-quotation-approval' }
    ]
  };

  // Kartu untuk peran lihat-saja. Sengaja hanya berisi modul bersifat daftar,
  // catatan, dan laporan — tidak ada kartu Add/Create/Input, sehingga form tidak
  // pernah terjangkau dari dashboard. Server tetap menolak semua permintaan
  // tulis dari peran ini, jadi ini lapis kenyamanan, bukan lapis keamanan.
  // Harus sejalan dengan MODUL_BISA_DILIHAT di middleware/auth.js. Modul yang
  // bisa dicentang tapi tidak punya kartu di sini akan tersimpan diam-diam tanpa
  // pernah muncul di layar.
  const modulLihatSaja = [
    { modul: 'Project',            title: 'Project Log', icon: Logs, desc: 'Daftar seluruh project', descEn: 'All project records', path: '/project-log' },
    { modul: 'Project Timeline',   title: 'Project Timeline', icon: Calendar, desc: 'Pantau progress & milestone', descEn: 'Monitor progress & milestones', path: '/timeline' },
    { modul: 'Client Quotation',   title: 'Quotation Log', icon: FileText, desc: 'Riwayat quotation ke client', descEn: 'Client quotation history', path: '/quotation-log' },
    { modul: 'Client Invoice',     title: 'Invoice Log', icon: Receipt, desc: 'Riwayat invoice client', descEn: 'Client invoice history', path: '/invoice-log' },
    { modul: 'Client Payment',     title: 'Payment Log', icon: CreditCard, desc: 'Riwayat pembayaran masuk', descEn: 'Incoming payment history', path: '/input-payment-log' },
    { modul: 'Supplier Quotation', title: 'Supplier Quotation Record', icon: FileCheck, desc: 'Riwayat quotation supplier', descEn: 'Supplier quotation history', path: '/supplier-quotation-record' },
    { modul: 'Purchase Order',     title: 'PO Record', icon: ClipboardCheck, desc: 'Riwayat purchase order', descEn: 'Purchase order history', path: '/po-record' },
    { modul: 'Supplier Invoice',   title: 'Supplier Invoice Record', icon: FileText, desc: 'Riwayat tagihan vendor', descEn: 'Vendor invoice history', path: '/supplier-invoice-record' },
    { modul: 'Vendor',             title: 'Vendor Directory', icon: Package, desc: 'Data master supplier', descEn: 'Supplier master data', path: '/existing-vendors' },
    { modul: 'Inventory',          title: 'Inventory', icon: Boxes, desc: 'Stok & mutasi barang', descEn: 'Stock & movements', path: '/inventory' },
    { modul: 'Expense Submission', title: 'Expense Log', icon: DollarSign, desc: 'Riwayat pengajuan biaya', descEn: 'Expense submission history', path: '/expense-submission-log' },
    { modul: 'Financial Report',   title: 'Project Financial Summary', icon: BarChart3, desc: 'Ringkasan pendapatan & biaya', descEn: 'Revenue & cost summary', path: '/financial-report' },
    { modul: 'System Logs',        title: 'Activity Log', icon: Logs, desc: 'Jejak aktivitas sistem', descEn: 'System activity trail', path: '/logs' },
  ];

  let userModules = [];
  if (user.role === 'Super Admin') {
    userModules = modulLihatSaja;
  } else if (user.role === 'Viewer') {
    const boleh = user.viewModules || [];
    userModules = modulLihatSaja.filter((m) => boleh.includes(m.modul));
  } else if (user.role === 'Admin' || user.role === 'Administrator') {
    userModules = [...allModules.Admin];
  } else if (user.role === 'Management') {
    userModules = [...allModules.Management];
  } else if (user.role === 'Owner') {
    userModules = [...allModules.Owner];
  } else {
    userModules = allModules[user.role] || [];
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (lang === 'id') {
      if (hour < 11) return 'Selamat Pagi';
      if (hour < 15) return 'Selamat Siang';
      if (hour < 18) return 'Selamat Sore';
      return 'Selamat Malam';
    }
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
                {user.role} • {new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
                {['id', 'en'].map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                      lang === l ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {l === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100">
                <CircleDot size={16} className="text-emerald-500" />
                <div>
                  <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">{t.systemStatus}</p>
                  <p className="text-slate-800 font-black text-xs uppercase">{t.operational}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Layers size={18} className="text-indigo-500" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t.quickAccess}</h2>
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[8px] font-black text-slate-400">{userModules.length} {t.modules}</span>
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
                    {lang === 'en' ? (mod.descEn || mod.desc) : mod.desc}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t.access}</span>
                    <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-slate-200">
              <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-xl font-black italic text-slate-400 uppercase tracking-tighter">{t.noModules}</p>
              <p className="text-[9px] text-slate-400 mt-2">{t.contactAdmin}</p>
            </div>
          )}

          {pakaiTabel && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-1">
                <Briefcase size={16} className="text-indigo-600" />
                <h2 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">
                  {tabelMilikSendiri ? t.myProjects : t.allProjects}
                </h2>
                <span className="text-[9px] font-black text-slate-400">({daftarProject.length})</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-7">
                {tabelMilikSendiri ? t.myProjectsSub : t.allProjectsSub}
              </p>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {memuatProject ? (
                  <p className="p-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t.loadingProjects}
                  </p>
                ) : daftarProject.length === 0 ? (
                  <div className="p-12 text-center">
                    <Briefcase size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {tabelMilikSendiri ? t.noProjectsMine : t.noProjects}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-150">
                      <thead className="bg-slate-50">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-3">{t.colProject}</th>
                          {tabelMilikSendiri && <th className="px-6 py-3">{t.colClient}</th>}
                          <th className="px-6 py-3">{t.colValue}</th>
                          {tabelSemua && <th className="px-6 py-3">{t.colPic}</th>}
                          <th className="px-6 py-3">{t.colStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {daftarProject.map((p) => (
                          <tr
                            key={p._id || p.projectId}
                            onClick={() => navigate('/project-log')}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-3">
                              <p className="font-bold text-slate-800">{p.projectName}</p>
                              <p className="text-[9px] font-bold text-slate-400">{p.projectId}</p>
                            </td>
                            {tabelMilikSendiri && (
                              <td className="px-6 py-3 text-slate-600">{p.institutionName || '—'}</td>
                            )}
                            <td className="px-6 py-3 font-bold text-slate-700">{fmtNilai(p.amount)}</td>
                            {tabelSemua && (
                              <td className="px-6 py-3 text-slate-600">
                                {p.createdBy ? p.createdBy.username : '—'}
                              </td>
                            )}
                            <td className="px-6 py-3">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {p.status || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;