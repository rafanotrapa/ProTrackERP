import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  CheckCircle, Clock, XCircle, Eye, Pencil, Trash2,
  FileText, Search, Plus,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');
const stripNonNumeric = (str) => str.toString().replace(/[^0-9]/g, '');

const getFileUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `http://localhost:5000/uploads/documents/${filename}`;
};

const ExpenseSubmissionLog = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [user] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { role: 'Guest' };
  });
  const isFinance = ['Finance', 'Admin', 'Owner'].includes(user.role);

  // ── Edit modal state ────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]     = useState({ items: [], remarks: '' });
  const [savingEdit, setSavingEdit] = useState(false);

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

  // ── Filter ───────────────────────────────────────────────
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

  // ── Approve / Reject (Finance only) ─────────────────────
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
        html: `<strong>${exp.items?.length || 0} item</strong> total <strong class="text-emerald-600">Rp ${formatRupiah(exp.amount)}</strong> akan masuk sebagai beban project <strong>${exp.projectId}</strong>.`,
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

  // ── Edit ─────────────────────────────────────────────────
  const openEdit = (exp) => {
    setEditTarget(exp);
    setEditForm({
      items: (exp.items || []).map((it, idx) => ({
        id: idx,
        name: it.name || '',
        description: it.description || '',
        amount: it.amount || '',
      })),
      remarks: exp.remarks || '',
    });
  };

  const updateEditItem = (id, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        if (field === 'amount') {
          const raw = stripNonNumeric(value);
          return { ...it, amount: raw ? Number(raw) : '' };
        }
        return { ...it, [field]: value };
      }),
    }));
  };

  const addEditItem = () => {
    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), name: '', description: '', amount: '' }],
    }));
  };

  const removeEditItem = (id) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
    }));
  };

  const handleSaveEdit = async () => {
    const validItems = editForm.items.filter((it) => it.name.trim() && Number(it.amount) > 0);
    if (validItems.length === 0) {
      return Swal.fire('ITEM TIDAK VALID', 'Minimal satu item dengan nama & nominal wajib diisi!', 'warning');
    }

    setSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/expense-submission/${editTarget._id}`,
        {
          items: JSON.stringify(validItems.map((it) => ({
            name: it.name, description: it.description, amount: Number(it.amount),
          }))),
          remarks: editForm.remarks,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: 'success', title: 'TERSIMPAN', timer: 1200, showConfirmButton: false });
      setEditTarget(null);
      fetchExpenses();
    } catch (err) {
      Swal.fire('GAGAL', err.response?.data?.msg || 'Gagal menyimpan perubahan', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (exp) => {
    const result = await Swal.fire({
      title: 'Hapus Submission?',
      html: `Submission <strong>${exp.submissionId}</strong> akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Hapus',
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
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600"><CheckCircle size={12} /> APPROVED</span>;
    }
    if (status === 'Rejected') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-rose-100 text-rose-600"><XCircle size={12} /> REJECTED</span>;
    }
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600"><Clock size={12} /> PENDING</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-4" />
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
          onClick={() => navigate('/expense-submission-menu')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-amber-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Expense <span className="text-amber-600">Log</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Histori Pengajuan Biaya
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        {/* Filter pills & Search */}
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
              placeholder="Cari ID, Project, Nama Biaya..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-amber-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FileText size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No submissions found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Submission</th>
                  <th className="px-6 py-4">Project / Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Submitted</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">{exp.submissionId}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{exp.submittedBy?.name || exp.submittedByName || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[9px] text-slate-400 mb-1">
                        {exp.projectName || exp.projectId} <span className="text-slate-300">({exp.projectId})</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(exp.items || []).slice(0, 3).map((it, idx) => (
                          <span key={idx} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {it.name}
                          </span>
                        ))}
                        {(exp.items || []).length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400">+{exp.items.length - 3} lagi</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-amber-600">Rp {formatRupiah(exp.amount)}</p>
                      <p className="text-[8px] text-slate-400">{exp.currency} &bull; {(exp.items || []).length} item</p>
                    </td>
                    <td className="px-6 py-5 text-center">{getStatusBadge(exp.status)}</td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-[9px] font-bold text-slate-500">
                        {new Date(exp.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {exp.file && (
                          <a
                            href={getFileUrl(exp.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-indigo-600 transition-all"
                            title="Lihat Lampiran"
                          >
                            <Eye size={15} />
                          </a>
                        )}

                        {exp.status !== 'Approved' && (
                          <>
                            <button
                              onClick={() => openEdit(exp)}
                              className="p-2 text-slate-500 hover:text-amber-600 transition-all"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(exp)}
                              className="p-2 text-slate-500 hover:text-rose-600 transition-all"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}

                        {isFinance && exp.status === 'Pending Verification' && (
                          <>
                            <button
                              onClick={() => handleReview(exp, 'Approved')}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(exp, 'Rejected')}
                              className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
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

      {/* ── EDIT MODAL (multi-item) ──────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                Edit Submission — {editTarget.submissionId}
              </h3>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600 text-lg font-black">✕</button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {editForm.items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="col-span-4">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Nama Biaya</label>
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => updateEditItem(it.id, 'name', e.target.value)}
                      className="w-full p-2 mt-0.5 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Deskripsi</label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateEditItem(it.id, 'description', e.target.value)}
                      className="w-full p-2 mt-0.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Nominal</label>
                    <input
                      type="text"
                      value={formatRupiah(it.amount)}
                      onChange={(e) => updateEditItem(it.id, 'amount', e.target.value)}
                      className="w-full p-2 mt-0.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-amber-600 text-right outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-1">
                    {editForm.items.length > 1 && (
                      <button onClick={() => removeEditItem(it.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={addEditItem}
                className="flex items-center gap-1.5 text-amber-600 font-black text-[9px] uppercase tracking-widest hover:text-amber-800"
              >
                <Plus size={12} /> Tambah Item
              </button>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan</label>
              <textarea
                rows="2"
                value={editForm.remarks}
                onChange={(e) => setEditForm((p) => ({ ...p, remarks: e.target.value }))}
                className="w-full p-2.5 mt-1 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {editTarget.status === 'Rejected' && (
              <p className="text-[9px] text-amber-600 bg-amber-50 rounded-lg p-2 font-bold">
                ⚠ Submission ini sebelumnya ditolak. Setelah diedit, status akan kembali menjadi Pending Verification.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ExpenseSubmissionLog;