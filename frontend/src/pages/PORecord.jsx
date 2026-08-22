import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Search, Download } from 'lucide-react';
import Header from '../components/Header';
import NilaiUang from '../components/NilaiUang';
import Footer from '../components/Footer';
import { unduhDokumenPO } from '../utils/poDocument';

import { akunBacaSaja } from '../utils/peran';
import { useLang } from '../i18n';

const PORecord = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  // Akun lihat-saja tetap boleh membuka halaman ini, tapi form tujuannya
  // ditolak ProtectedRoute. Tombolnya disembunyikan agar tidak jadi
  // tombol mati yang melempar balik ke dashboard.
  const bacaSaja = akunBacaSaja();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/po', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPos(res.data || []);
      } catch (err) {
        console.error('Gagal ambil data PO:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPOs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filtered = pos.filter((po) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (po.poNumber             || '').toLowerCase().includes(term) ||
      (po.vendorId?.vendorName || '').toLowerCase().includes(term) ||
      (po.projectId            || '').toLowerCase().includes(term) ||
      (po.projectName          || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' ? true : po.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:     pos.length,
    unpaid:  pos.filter((po) => po.paymentStatus === 'Unpaid').length,
    partial: pos.filter((po) => po.paymentStatus === 'Partial').length,
    paid:    pos.filter((po) => po.paymentStatus === 'Paid').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto mb-4" />
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
          onClick={() => navigate('/po-menu')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-sky-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            PO <span className="text-sky-600">Track Record</span>
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Procurement Module • Issued Orders
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',     label: `All (${counts.all})`,         cls: 'bg-slate-900 text-white' },
              { key: 'Unpaid',  label: `Unpaid (${counts.unpaid})`,   cls: 'bg-amber-500 text-white' },
              { key: 'Partial', label: `Partial (${counts.partial})`, cls: 'bg-sky-600 text-white' },
              { key: 'Paid',    label: `Paid (${counts.paid})`,       cls: 'bg-emerald-600 text-white' },
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

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder={t('search.po')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-sky-500"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {!bacaSaja && (
            <button
              onClick={() => navigate('/create-po')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all shadow-sm whitespace-nowrap"
            >
              + Create PO
            </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <ClipboardCheck size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No purchase orders found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">PO Number / Vendor</th>
                  <th className="px-6 py-4 text-center">Linked Project</th>
                  <th className="px-6 py-4 text-center">Payment Status</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                  <th className="px-6 py-4 text-center">Issued</th>
                  <th className="px-6 py-4 text-center">{t('common.document')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-sky-600 uppercase tracking-wider">{po.poNumber}</p>
                      <p className="font-black text-slate-800 text-sm mt-0.5">{po.vendorId?.vendorName || 'Unknown Vendor'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{po.items?.length || 0} Items &bull; {po.topOption}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-black uppercase tracking-widest border border-sky-100">
                        {po.projectId || 'N/A'}
                      </span>
                      {po.projectName && (
                        <p className="mt-1.5 text-xs font-bold text-slate-500">{po.projectName}</p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                        po.paymentStatus === 'Paid'    ? 'bg-emerald-100 text-emerald-600' :
                        po.paymentStatus === 'Partial' ? 'bg-sky-100 text-sky-600' :
                                                         'bg-amber-100 text-amber-600'
                      }`}>
                        {po.paymentStatus || 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-black text-sky-600"><NilaiUang nominal={po.totalAmount} currency={po.currency} rate={po.exchangeRate} /></p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <p className="text-xs font-bold text-slate-500">{formatDate(po.timestamp)}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => unduhDokumenPO(po)}
                        title={t('tip.downloadPo')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-2xs font-black uppercase tracking-widest hover:bg-sky-700 transition-all active:scale-90"
                      >
                        <Download size={11} /> PDF
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

export default PORecord;