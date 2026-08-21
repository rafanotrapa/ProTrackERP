import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  CheckCircle, Clock, XCircle, Eye, Trash2,
  FileText, Search, Plus,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { openSecureFile } from '../utils/secureFile';
import { akunBacaSaja } from '../utils/peran';

import { useLang } from '../i18n';
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');


const ExpenseSubmissionLog = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [user] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { role: 'Guest' };
  });
  const isFinance = ['Finance', 'Admin', 'Administrator', 'Owner'].includes(user.role);

  // Akun lihat-saja tidak ditawari tombol yang mengubah data.
  const bacaSaja = akunBacaSaja();


  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/expense-submission', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Gagal load expense log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filtered = expenses.filter((e) => {
    const q = searchTerm.toLowerCase();
    const itemNames = (e.items || []).map((it) => it.name).join(' ');
    const matchSearch =
      (e.submissionId || '').toLowerCase().includes(q) ||
      (e.projectId    || '').toLowerCase().includes(q) ||
      (e.projectName  || '').toLowerCase().includes(q) ||
      itemNames.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' ? true : e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:      expenses.length,
    pending:  expenses.filter((e) => e.status === 'Pending Verification').length,
    approved: expenses.filter((e) => e.status === 'Approved').length,
    rejected: expenses.filter((e) => e.status === 'Rejected').length,
  };

  const handleReview = async (exp, status) => {
    let rejectionReason = '';
    if (status === 'Rejected') {
      const { value } = await Swal.fire({
        title: 'Alasan Penolakan',
        input: 'textarea',
        inputPlaceholder: 'Jelaskan alasan menolak submission ini...',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Tolak Submission',
      });
      if (value === undefined) return;
      rejectionReason = value;
    } else {
      const result = await Swal.fire({
        title: 'Setujui Submission?',
        html: `<strong>${exp.items?.length || 0} item</strong> {t('common.totalLower')} <strong class="text-emerald-600">Rp ${formatRupiah(exp.amount)}</strong> {t('page.willCountAsCost')} <strong>${exp.projectId}</strong>.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Ya, Setujui',
      });
      if (!result.isConfirmed) return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/expense-submission/${exp._id}/review`,
        { status, rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: 'success', title: status === 'Approved' ? 'DISETUJUI' : 'DITOLAK', timer: 1500, showConfirmButton: false });
      fetchExpenses();
    } catch (err) {
      Swal.fire('GAGAL', err.response?.data?.msg || 'Gagal memproses review', 'error');
    }
  };


  const handleDelete = async (exp) => {
    const result = await Swal.fire({
      title: t('msg.deleteSubmission'),
      html: `Submission <strong>${exp.submissionId}</strong> akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t('msg.yesDelete'),
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/expense-submission/${exp._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({ icon: 'success', title: 'DIHAPUS', timer: 1200, showConfirmButton: false });
      fetchExpenses();
    } catch (err) {
      Swal.fire('GAGAL', err.response?.data?.msg || 'Submission tidak bisa dihapus', 'error');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Approved') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-600"><CheckCircle size={12} /> APPROVED</span>;
    }
    if (status === 'Rejected') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-600"><XCircle size={12} /> REJECTED</span>;
    }
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-600"><Clock size={12} /> PENDING</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-4" />
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
          onClick={() => navigate('/expense-submission-menu')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-amber-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Expense <span className="text-amber-600">Log</span>
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            {t('page.expenseHistory')}
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',      label: `All (${counts.all})`,           cls: 'bg-slate-900 text-white' },
              { key: 'Pending Verification', label: `Pending (${counts.pending})`, cls: 'bg-amber-500 text-white' },
              { key: 'Approved', label: `Approved (${counts.approved})`, cls: 'bg-emerald-600 text-white' },
              { key: 'Rejected', label: `Rejected (${counts.rejected})`, cls: 'bg-rose-500 text-white' },
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
              placeholder={t('search.expense')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-amber-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FileText size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No submissions found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Submission</th>
                  <th className="px-6 py-4">Project / Items</th>
                  <th className="px-6 py-4 text-right">{t('common.total')}</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Submitted</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-amber-600 uppercase tracking-wider">{exp.submissionId}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.submittedBy?.name || exp.submittedByName || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-400 mb-1">
                        {exp.projectName || exp.projectId} <span className="text-slate-300">({exp.projectId})</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(exp.items || []).slice(0, 3).map((it, idx) => (
                          <span key={idx} className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {it.name}
                          </span>
                        ))}
                        {(exp.items || []).length > 3 && (
                          <span className="text-xs font-bold text-slate-400">+{exp.items.length - 3} lagi</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-amber-600">Rp {formatRupiah(exp.amount)}</p>
                      <p className="text-2xs text-slate-400">{exp.currency} &bull; {(exp.items || []).length} item</p>
                    </td>
                    <td className="px-6 py-5 text-center">{getStatusBadge(exp.status)}</td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-xs font-bold text-slate-500">
                        {new Date(exp.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {exp.file && (
                          <button
                            type="button"
                            onClick={() => openSecureFile(exp.file)}
                            className="p-2 text-slate-500 hover:text-indigo-600 transition-all"
                            title="Lihat Lampiran"
                          >
                            <Eye size={15} />
                          </button>
                        )}

                        {/* Tidak ada tombol Edit: pengajuan bersifat sekali kirim.
                            Setelah diajukan, satu-satunya kelanjutan yang sah
                            adalah Approve atau Reject oleh Finance. */}
                        {!bacaSaja && exp.status !== 'Approved' && (
                          <button
                            onClick={() => handleDelete(exp)}
                            className="p-2 text-slate-500 hover:text-rose-600 transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}

                        {!bacaSaja && isFinance && exp.status === 'Pending Verification' && (
                          <>
                            <button
                              onClick={() => handleReview(exp, 'Approved')}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-2xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(exp, 'Rejected')}
                              className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-2xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
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

export default ExpenseSubmissionLog;