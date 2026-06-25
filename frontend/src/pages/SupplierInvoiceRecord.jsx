import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────────────────────
const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');

const SupplierInvoiceRecord = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/supplier_invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(res.data || []);
      } catch (err) {
        console.error('Gagal ambil data invoice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // ── Filter ───────────────────────────────────────────────
  const filtered = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.vendorName    || '').toLowerCase().includes(q) ||
      (inv.poNumber      || '').toLowerCase().includes(q) ||
      (inv.projectId     || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' ? true : (inv.status || 'Pending Verification') === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:      invoices.length,
    pending:  invoices.filter((i) => (i.status || 'Pending Verification') === 'Pending Verification').length,
    paid:     invoices.filter((i) => i.status === 'Paid').length,
    rejected: invoices.filter((i) => i.status === 'Rejected').length,
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
          onClick={() => navigate('/supplier-invoice-menu')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Invoice <span className="text-indigo-600">Log</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Procurement Module • Billing History
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        {/* Filter pills & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',                    label: `All (${counts.all})`,           cls: 'bg-slate-900 text-white' },
              { key: 'Pending Verification',   label: `Pending (${counts.pending})`,   cls: 'bg-amber-500 text-white' },
              { key: 'Paid',                   label: `Paid (${counts.paid})`,         cls: 'bg-emerald-600 text-white' },
              { key: 'Rejected',                label: `Rejected (${counts.rejected})`, cls: 'bg-rose-500 text-white' },
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
              placeholder="Cari Invoice, Vendor, PO..."
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
            <FileText size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No invoices found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Invoice / PO</th>
                  <th className="px-6 py-4">Vendor / Project</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const grandTotal = (inv.amount || 0) + (inv.taxAmount || 0) + (inv.importDutyAmount || 0);
                  const currentStatus = inv.status || 'Pending Verification';
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{inv.invoiceNumber}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">PO: {inv.poNumber} &bull; {inv.terminName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 text-sm">{inv.vendorName}</p>
                        <p className="text-[9px] text-slate-400">{inv.projectId}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="font-black text-emerald-600">{inv.currency} {formatRupiah(grandTotal)}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          currentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                          currentStatus === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="text-[9px] font-bold text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                        </p>
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

export default SupplierInvoiceRecord;