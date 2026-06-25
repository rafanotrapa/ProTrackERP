import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CheckCircle, Clock, Search, Eye } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────────────────────
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');

const ProjectBilling = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project-billing', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data || []);
      } catch (err) {
        console.error('Gagal load project billing', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // ── Filter ───────────────────────────────────────────────
  const filtered = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (p.projectId   || '').toLowerCase().includes(term) ||
      (p.projectName || '').toLowerCase().includes(term) ||
      (p.clientName  || '').toLowerCase().includes(term);
    const matchStatus =
      statusFilter === 'all'        ? true :
      statusFilter === 'complete'   ? p.isComplete :
      statusFilter === 'inprogress' ? !p.isComplete : true;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:        projects.length,
    inprogress: projects.filter((p) => !p.isComplete).length,
    complete:   projects.filter((p) => p.isComplete).length,
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
        <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Project <span className="text-indigo-600">Billing</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Finance • Payment Progress Monitoring</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        {/* Filter pills & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',        label: `All (${counts.all})`,               cls: 'bg-slate-900 text-white' },
              { key: 'inprogress', label: `In Progress (${counts.inprogress})`, cls: 'bg-amber-500 text-white' },
              { key: 'complete',   label: `Complete (${counts.complete})`,     cls: 'bg-emerald-600 text-white' },
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
              placeholder="Cari Project ID, Nama, Client..."
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
            <DollarSign size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No billing data found</p>
            <p className="text-[10px] text-slate-400 mt-2">Create invoices first to see billing progress</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-center">Stages</th>
                  <th className="px-6 py-4 text-right">Total Paid</th>
                  <th className="px-6 py-4 text-right">Remaining</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const progressColor =
                    p.progressPercent === 100 ? 'bg-emerald-500' :
                    p.progressPercent >= 50   ? 'bg-blue-500' : 'bg-amber-500';
                  return (
                    <tr key={p.projectId} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{p.projectId}</p>
                        <p className="font-black text-slate-800 text-sm mt-0.5">{p.projectName}</p>
                        <p className="text-[9px] text-slate-400">{p.clientName}</p>
                      </td>
                      <td className="px-6 py-5 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progressColor}`}
                              style={{ width: `${p.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-600 w-8 text-right">{p.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[10px] font-black text-slate-700">{p.paidCount}/{p.stagesCount}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="font-black text-emerald-600">Rp {formatRupiah(p.totalPaid)}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="font-black text-amber-600">Rp {formatRupiah(p.remainingAmount)}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {p.isComplete ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600">
                            <CheckCircle size={12} /> COMPLETE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600">
                            <Clock size={12} /> IN PROGRESS
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => navigate(`/project-billing/${p.projectId}`)}
                          className="p-2 text-slate-500 hover:text-indigo-600 transition-all"
                          title="Lihat Detail Billing"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProjectBilling;