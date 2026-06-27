import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, Package, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ReceiveQCGoods = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPOs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/po', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchaseOrders(res.data || []);
    } catch (err) {
      console.error('Gagal load PO:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPOs(); }, []);

  const handleQC = async (id, actionStatus) => {
    let qcRemarks = '';

    if (actionStatus === 'Returned') {
      const { value: text } = await Swal.fire({
        title: 'REJECT / RETURN GOODS',
        input: 'textarea',
        inputLabel: 'Alasan Retur / Gagal QC',
        inputPlaceholder: 'Contoh: Barang cacat, quantity kurang...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        inputValidator: (value) => { if (!value) return 'Alasan retur wajib diisi!'; }
      });
      if (!text) return;
      qcRemarks = text;
    } else {
      const result = await Swal.fire({
        title: 'QC PASSED?',
        text: 'Barang sudah sesuai dan lengkap? Status ini akan membuka akses pembuatan Invoice.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'YES, ALL GOOD'
      });
      if (!result.isConfirmed) return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/po/${id}/qc-check`, { status: actionStatus, qcRemarks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('BERHASIL', `Status QC diupdate menjadi ${actionStatus}`, 'success');
      fetchPOs();
    } catch (err) {
      Swal.fire('ERROR', err.response?.data?.msg || 'Gagal update status QC', 'error');
    }
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = purchaseOrders.filter((po) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (po.poNumber             || '').toLowerCase().includes(term) ||
      (po.vendorId?.vendorName || '').toLowerCase().includes(term) ||
      (po.projectId            || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' ? true : po.qcStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:      purchaseOrders.length,
    waiting:  purchaseOrders.filter((po) => po.qcStatus === 'Waiting Delivery').length,
    passed:   purchaseOrders.filter((po) => po.qcStatus === 'Passed').length,
    returned: purchaseOrders.filter((po) => po.qcStatus === 'Returned').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
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
          <span className="text-slate-400 group-hover:text-amber-500 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Receive & QC <span className="text-amber-500">Goods</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Procurement • Receiving & Validation
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">

        {/* Filter pills & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',                label: `All (${counts.all})`,            cls: 'bg-slate-900 text-white' },
              { key: 'Waiting Delivery',   label: `Waiting (${counts.waiting})`,    cls: 'bg-amber-500 text-white' },
              { key: 'Passed',             label: `Passed (${counts.passed})`,      cls: 'bg-emerald-600 text-white' },
              { key: 'Returned',           label: `Returned (${counts.returned})`,  cls: 'bg-rose-500 text-white' },
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
              placeholder="Cari PO Number, Vendor, Project..."
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
            <Package size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic mt-3">No purchase orders found</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">PO Number / Project</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4 text-center">Status QC</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{po.poNumber}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Project: {po.projectId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700 text-sm">{po.vendorId?.vendorName || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {po.qcStatus === 'Passed' && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">GOODS PASSED</span>
                      )}
                      {po.qcStatus === 'Returned' && (
                        <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest">RETURNED</span>
                      )}
                      {po.qcStatus === 'Waiting Delivery' && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">WAITING RECEIPT</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleQC(po._id, 'Passed')}
                          disabled={po.qcStatus === 'Passed'}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <CheckCircle size={13} /> PASS
                        </button>
                        <button
                          onClick={() => handleQC(po._id, 'Returned')}
                          disabled={po.qcStatus === 'Passed'}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-rose-500 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 hover:border-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <XCircle size={13} /> RETURN
                        </button>
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

export default ReceiveQCGoods;