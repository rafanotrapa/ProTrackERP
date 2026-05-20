import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ChevronRight, FolderOpen } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = 'http://localhost:5000';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('projectId');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token}` };

        const [projRes, billingRes] = await Promise.allSettled([
          axios.get(`${API}/api/project`, { headers: h }),
          axios.get(`${API}/api/project-billing`, { headers: h })
        ]);

        const projs = projRes.status === 'fulfilled' ? projRes.value.data : [];
        const billingMap = new Map();
        if (billingRes.status === 'fulfilled') {
          billingRes.value.data.forEach(b => billingMap.set(b.projectId, b));
        }

        const enriched = projs.map(p => {
          const b = billingMap.get(p.projectId) || {};
          return {
            ...p,
            progressPercent: b.progressPercent || 0,
            totalContract: b.totalContractValue || p.amount || 0,
            totalPaid: b.summary?.totalPaid || b.totalPaid || 0,
            isComplete: b.summary?.isComplete || b.isComplete || false,
            stagesCount: b.stagesCount || 1,
            paidCount: b.paidCount || 0
          };
        });
        setProjects(enriched);
      } catch (err) {
        console.error('Gagal load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fmt = (v) => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0';

  const getStatusCfg = (p) => {
    if (p.isComplete) return { label: 'COMPLETED', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    if ((p.progressPercent || 0) >= 50) return { label: 'ON TRACK', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' };
    return { label: 'ACTIVE', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
  };

  const barColor = (pct) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-indigo-500';
    return 'bg-amber-500';
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = projects.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (p.projectId || '').toLowerCase().includes(q) ||
        (p.projectName || '').toLowerCase().includes(q) ||
        (p.clientName || p.institutionName || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? !p.isComplete : p.isComplete;
      return matchSearch && matchStatus;
    });

    return [...list].sort((a, b) => {
      let va = a[sortField] ?? '', vb = b[sortField] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchTerm, statusFilter, projects, sortField, sortDir]);

  const counts = {
    all: projects.length,
    active: projects.filter(p => !p.isComplete).length,
    completed: projects.filter(p => p.isComplete).length
  };

  const SortTh = ({ label, field, className = '' }) => (
    <th
      className={`px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap select-none cursor-pointer hover:text-white transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown size={10} className={`ml-1 inline-block ${sortField === field ? 'text-indigo-400' : 'text-slate-600'}`} />
    </th>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING PROJECTS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      {/* PAGE HEADER */}
      <div className="sticky top-16 z-10 bg-white border-b border-slate-100 px-6 md:px-10 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all active:scale-90 shadow-sm group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-lg font-black italic leading-none">&#8592;</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Project <span className="text-indigo-600">List</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
            {projects.length} Projects &bull; Real-time Status
          </p>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10">

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', active: 'bg-indigo-600 text-white border-indigo-600' },
              { key: 'active', label: 'Active', active: 'bg-amber-500 text-white border-amber-500' },
              { key: 'completed', label: 'Completed', active: 'bg-emerald-600 text-white border-emerald-600' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  statusFilter === t.key ? t.active : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Project ID, Nama, Client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* TABLE */}
        {filtered.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-2xl border border-slate-100">
            <FolderOpen size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-black text-base uppercase tracking-tighter italic">Tidak ada project</p>
            <p className="text-[10px] text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-175">
                <thead>
                  <tr className="bg-slate-900">
                    <SortTh label="Project ID" field="projectId" className="w-32" />
                    <SortTh label="Project Name" field="projectName" className="min-w-45" />
                    <SortTh label="Client" field="clientName" className="min-w-35" />
                    <SortTh label="Total Contract" field="totalContract" className="w-44" />
                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 w-48">Progress</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 w-32">Status</th>
                    <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 w-16">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p, idx) => {
                    const s = getStatusCfg(p);
                    const pct = p.progressPercent || 0;
                    return (
                      <tr
                        key={p._id}
                        onClick={() => navigate(`/timeline/${p.projectId}`)}
                        className={`group cursor-pointer transition-colors hover:bg-indigo-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors">
                            {p.projectId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-black text-slate-800 uppercase italic tracking-tight text-[12px] line-clamp-1 group-hover:text-indigo-700 transition-colors">
                            {p.projectName || 'Untitled'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">
                            {p.clientName || p.institutionName || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-[12px] font-black text-slate-800">{fmt(p.totalContract)}</p>
                          <p className="text-[8px] text-emerald-600 font-bold">Paid: {fmt(p.totalPaid)}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black w-8 text-right ${pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-indigo-600' : 'text-amber-600'}`}>
                              {pct}%
                            </span>
                          </div>
                          <p className="text-[8px] text-slate-400 mt-0.5">
                            {p.paidCount || 0}/{p.stagesCount || 1} stages paid
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-600 transition-all">
                            <ChevronRight size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {filtered.length} dari {projects.length} project
              </p>
              <p className="text-[9px] text-slate-300 font-black uppercase italic">
                Klik baris untuk lihat timeline
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProjectList;