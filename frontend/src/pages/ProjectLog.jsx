import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
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
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // ── Filter ───────────────────────────────────────────────
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Histori Semua Project
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        {/* Filter pills & Search */}
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
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
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
              placeholder="Cari ID, Nama Project, Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FolderOpen size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No projects found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4 text-right">Contract Value</th>
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
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{p.projectId}</p>
                      <p className="text-[10px] font-bold text-slate-700 mt-0.5">{p.projectName}</p>
                      <p className="text-[9px] text-slate-400">{p.institutionName}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700 text-sm">{p.clientName}</p>
                      <p className="text-[9px] text-slate-400">{p.clientContact}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-emerald-600">Rp {formatRupiah(p.amount)}</p>
                      <p className="text-[8px] text-slate-400">{p.currency}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                        p.quotationMode === 'manual' ? 'bg-purple-100 text-purple-600' : 'bg-sky-100 text-sky-600'
                      }`}>
                        {p.quotationMode || 'auto'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black ${statusBadge(p.status)}`}>
                        {p.status || 'Tendering'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-[9px] font-bold text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => navigate(`/timeline/${p.projectId}`)}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
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