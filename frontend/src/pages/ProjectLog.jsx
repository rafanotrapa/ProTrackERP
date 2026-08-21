import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { akunBacaSaja } from '../utils/peran';

import { useLang } from '../i18n';
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');

const statusBadge = (status) => {
  const map = {
    Tendering:  'bg-amber-100 text-amber-600',
    Ongoing:    'bg-indigo-100 text-indigo-600',
    Completed:  'bg-emerald-100 text-emerald-600',
    Cancelled:  'bg-rose-100 text-rose-600',
  };
  return map[status] || 'bg-slate-100 text-slate-500';
};

const ProjectLog = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pemindahan PIC adalah keputusan atasan; Marketing tetap melihat kolomnya
  // tapi tanpa tombol ubah. Server juga menolaknya lewat authorizeRoles,
  // pemeriksaan di sini hanya supaya tombolnya tidak menggoda untuk diklik.
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') || {}; }
    catch { return {}; }
  });
  const bolehUbahPIC = ['Management', 'Owner', 'Admin', 'Administrator'].includes(user.role);

  // Akun lihat-saja tidak ditawari tombol yang mengubah data; server juga
  // menolaknya, jadi tombolnya hanya akan berujung pesan gagal.
  const bacaSaja = akunBacaSaja();

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/project', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data || []);
    } catch (err) {
      console.error('Gagal load project log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleEditBudget = async (p) => {
    const { value } = await Swal.fire({
      title: 'Edit Contract Value',
      text: `${p.projectId} — ${p.projectName}`,
      input: 'text',
      inputValue: String(p.amount || 0),
      inputLabel: 'Nominal (IDR)',
      showCancelButton: true,
      confirmButtonText: t('common.save'),
      cancelButtonText: t('common.cancel'),
      confirmButtonColor: '#4f46e5',
      inputValidator: (val) => {
        const num = Number(String(val).replace(/[^0-9]/g, ''));
        if (!val || num <= 0) return 'Nominal wajib diisi dengan angka valid!';
        return null;
      },
    });

    if (value === undefined) return;

    const amount = Number(String(value).replace(/[^0-9]/g, ''));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/project/update-status/${p.projectId}`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: 'success', title: 'Budget Updated!', timer: 1500, showConfirmButton: false });
      fetchProjects();
    } catch (err) {
      console.error('Gagal update budget:', err);
      Swal.fire('Error', t('sw.contractUpdateFailed'), 'error');
    }
  };

  const handleChangePIC = async (p) => {
    const token = localStorage.getItem('token');

    let kandidat = [];
    try {
      const res = await axios.get('http://localhost:5000/api/project/pic-options', {
        headers: { Authorization: `Bearer ${token}` },
      });
      kandidat = res.data || [];
    } catch (err) {
      console.error('Gagal ambil kandidat PIC:', err);
      return Swal.fire('Error', t('sw.marketingListFailed'), 'error');
    }

    if (kandidat.length === 0) {
      return Swal.fire(t('sw.noCandidate'), t('sw.noMarketingAccount'), 'info');
    }

    const pilihan = Object.fromEntries(kandidat.map((u) => [u._id, u.username]));
    const picSekarang = p.createdBy?._id || '';

    const { value } = await Swal.fire({
      title: 'Pindahkan PIC',
      text: `${p.projectId} — ${p.projectName}`,
      input: 'select',
      inputOptions: pilihan,
      inputValue: picSekarang,
      inputPlaceholder: 'Pilih akun Marketing',
      showCancelButton: true,
      confirmButtonText: 'Pindahkan',
      cancelButtonText: t('common.cancel'),
      confirmButtonColor: '#4f46e5',
      inputValidator: (val) => (!val ? 'Pilih dulu PIC tujuannya!' : null),
    });

    if (!value || value === picSekarang) return;

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/project/${p.projectId}/pic`,
        { createdBy: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: 'success',
        title: res.data?.msg || 'PIC dipindahkan!',
        timer: 1600,
        showConfirmButton: false,
      });
      fetchProjects();
    } catch (err) {
      console.error('Gagal ubah PIC:', err);
      Swal.fire('Error', err.response?.data?.msg || 'Gagal memindahkan PIC.', 'error');
    }
  };

  const filtered = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (p.projectId    || '').toLowerCase().includes(q) ||
      (p.projectName  || '').toLowerCase().includes(q) ||
      (p.clientName   || '').toLowerCase().includes(q) ||
      (p.institutionName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:       projects.length,
    tendering: projects.filter((p) => p.status === 'Tendering').length,
    ongoing:   projects.filter((p) => p.status === 'Ongoing').length,
    completed: projects.filter((p) => p.status === 'Completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button
          onClick={() => navigate('/project-center')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Project <span className="text-indigo-600">Log</span>
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            {t('page.allProjects')}
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',       label: `All (${counts.all})`,             cls: 'bg-slate-900 text-white' },
              { key: 'Tendering', label: `Tendering (${counts.tendering})`, cls: 'bg-amber-500 text-white' },
              { key: 'Ongoing',   label: `Ongoing (${counts.ongoing})`,     cls: 'bg-indigo-600 text-white' },
              { key: 'Completed', label: `Completed (${counts.completed})`, cls: 'bg-emerald-600 text-white' },
            ].map(({ key, label, cls }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  statusFilter === key ? cls : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder={t('search.projectLog')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FolderOpen size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No projects found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4 text-right">Contract Value</th>
                  <th className="px-6 py-4">PIC</th>
                  <th className="px-6 py-4 text-center">Mode</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Created</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">{p.projectId}</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{p.projectName}</p>
                      <p className="text-xs text-slate-400">{p.institutionName}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700 text-sm">{p.clientName}</p>
                      <p className="text-xs text-slate-400">{p.clientContact}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <p className="font-black text-emerald-600">Rp {formatRupiah(p.amount)}</p>
                        {!bacaSaja && (
                          <button
                            onClick={() => handleEditBudget(p)}
                            title="Edit Contract Value"
                            className="text-slate-300 hover:text-indigo-600 transition-all active:scale-90"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-2xs text-slate-400">{p.currency}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        {p.createdBy ? (
                          <p className="font-bold text-slate-700 text-sm">{p.createdBy.username}</p>
                        ) : (
                          <p className="text-xs font-bold text-slate-300 italic">{t('common.none')}</p>
                        )}
                        {bolehUbahPIC && (
                          <button
                            onClick={() => handleChangePIC(p)}
                            title="Pindahkan PIC"
                            className="text-slate-300 hover:text-indigo-600 transition-all active:scale-90"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2 py-1 rounded-full text-2xs font-black uppercase ${
                        p.quotationMode === 'manual' ? 'bg-purple-100 text-purple-600' : 'bg-sky-100 text-sky-600'
                      }`}>
                        {p.quotationMode || 'auto'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${statusBadge(p.status)}`}>
                        {p.status || 'Tendering'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-xs font-bold text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => navigate(`/timeline/${p.projectId}`)}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-2xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                      >
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProjectLog;