import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Eye } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { akunBacaSaja } from '../utils/peran';
import { useLang } from '../i18n';
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');

const SupplierQuotationRecord = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  // Akun lihat-saja tetap boleh membuka halaman ini, tapi form tujuannya
  // ditolak ProtectedRoute. Tombolnya disembunyikan agar tidak jadi
  // tombol mati yang melempar balik ke dashboard.
  const bacaSaja = akunBacaSaja();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/supplier_quotation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data || []);
      } catch (err) {
        console.error('Gagal ambil data quotation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateGrandTotal = (quo) => {
    const subtotal = (quo.items || []).reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 1)), 0);
    return subtotal + (quo.additionalFee || 0) + (quo.taxAmount || 0);
  };

  const filtered = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (q.quotationId || '').toLowerCase().includes(term) ||
      (q.vendorId    || '').toLowerCase().includes(term) ||
      (q.projectId   || '').toLowerCase().includes(term) ||
      (q.projectName || '').toLowerCase().includes(term);
    const currentStatus = q.approvalStatus || 'Pending';
    const matchStatus = statusFilter === 'all' ? true : currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:      quotations.length,
    pending:  quotations.filter((q) => (q.approvalStatus || 'Pending') === 'Pending').length,
    approved: quotations.filter((q) => q.approvalStatus === 'Approved').length,
    rejected: quotations.filter((q) => q.approvalStatus === 'Rejected').length,
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
          onClick={() => navigate('/supplier-quotation-menu')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Quotation <span className="text-indigo-600">Track Record</span>
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Procurement Module • Price Agreement History
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',      label: `All (${counts.all})`,           cls: 'bg-slate-900 text-white' },
              { key: 'Pending',  label: `Pending (${counts.pending})`,   cls: 'bg-amber-500 text-white' },
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

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder={t('search.sq')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {!bacaSaja && (
            <button
              onClick={() => navigate('/add-supplier-quotation')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm whitespace-nowrap"
            >
              + New Quotation
            </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FileText size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No quotations found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">SQ ID / Vendor</th>
                  <th className="px-6 py-4 text-center">Linked Project</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((quo) => {
                  const currentStatus = quo.approvalStatus || 'Pending';
                  const grandTotal = calculateGrandTotal(quo);
                  return (
                    <tr key={quo._id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">{quo.quotationId}</p>
                        <p className="font-black text-slate-800 text-sm mt-0.5">{quo.vendorId}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{quo.items?.length || 0} Items &bull; {quo.topOption}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-100">
                          {quo.projectId || 'N/A'}
                        </span>
                        {quo.projectName && (
                          <p className="mt-1.5 text-xs font-bold text-slate-500">{quo.projectName}</p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                          currentStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          currentStatus === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="font-black text-emerald-600">{quo.currency || 'IDR'} {formatRupiah(grandTotal)}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="text-xs font-bold text-slate-500">{formatDate(quo.timestamp)}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => navigate(`/quotation-approval/${quo._id}`)}
                          title={t('tip.viewQuotationDetail')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-2xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-90"
                        >
                          <Eye size={11} /> {t('common.view')}
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

export default SupplierQuotationRecord;