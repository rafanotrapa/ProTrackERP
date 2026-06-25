import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Clock, XCircle, Eye, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────────────────────
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');

const InputPaymentLog = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/payments/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(res.data || []);
      } catch (err) {
        console.error('Gagal load payment log:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'Verified') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600"><CheckCircle size={12} /> VERIFIED</span>;
    }
    if (status === 'Rejected') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-rose-100 text-rose-600"><XCircle size={12} /> REJECTED</span>;
    }
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600"><Clock size={12} /> PENDING</span>;
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (p.invoiceId?.invoiceNumber || '').toLowerCase().includes(term) ||
      (p.invoiceId?.clientName    || '').toLowerCase().includes(term) ||
      (p.invoiceId?.projectId     || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' ? true : (p.status || 'Pending') === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:      payments.length,
    pending:  payments.filter((p) => (p.status || 'Pending') === 'Pending').length,
    verified: payments.filter((p) => p.status === 'Verified').length,
    rejected: payments.filter((p) => p.status === 'Rejected').length,
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
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Payment <span className="text-indigo-600">Log</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Marketing Module • Histori Bukti Pembayaran
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        {/* Filter pills & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',      label: `All (${counts.all})`,           cls: 'bg-slate-900 text-white' },
              { key: 'Pending',  label: `Pending (${counts.pending})`,   cls: 'bg-amber-500 text-white' },
              { key: 'Verified', label: `Verified (${counts.verified})`, cls: 'bg-emerald-600 text-white' },
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
              placeholder="Cari Invoice #, Client, Project..."
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
            <CreditCard size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No payments found</p>
            <button
              onClick={() => navigate('/input-payment')}
              className="mt-4 text-[10px] font-black text-indigo-600 underline"
            >
              Upload bukti pembayaran pertama →
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client / Project</th>
                  <th className="px-6 py-4 text-right">Amount Paid</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Tanggal Bayar</th>
                  <th className="px-6 py-4 text-center">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                        {p.invoiceId?.invoiceNumber || '-'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{p.invoiceId?.billingPhase || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800 text-sm">{p.invoiceId?.clientName || '-'}</p>
                      <p className="text-[9px] text-slate-400">{p.invoiceId?.projectId || '-'}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-emerald-600">Rp {formatRupiah(p.amountPaid)}</p>
                    </td>
                    <td className="px-6 py-5 text-center">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-[9px] font-bold text-slate-500">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {p.evidencePath ? (
                        <a
                          href={`http://localhost:5000/${p.evidencePath.replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-2 text-slate-500 hover:text-indigo-600 transition-all"
                          title="Lihat Bukti Transfer"
                        >
                          <Eye size={16} />
                        </a>
                      ) : (
                        <span className="text-[9px] text-slate-300">-</span>
                      )}
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

export default InputPaymentLog;