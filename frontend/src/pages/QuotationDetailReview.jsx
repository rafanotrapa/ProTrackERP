import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, Clock, FileText, Building2, Package } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  QuotationDetailReview — Review SUPPLIER Quotation (COGS/modal
//  dari procurement). Management approve di sini SEBELUM quotation
//  ini bisa dipakai sebagai dasar input items di Client Quotation.
//
//  Endpoint: GET/PATCH /api/supplier_quotation/:id
//  (Beda dengan ClientQuotationDetailReview.jsx yang review margin
//  Sales Price ke client — file ini cuma review modal/COGS vendor,
//  belum ada sales price/margin di tahap ini.)
// ─────────────────────────────────────────────────────────────
const QuotationDetailReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quo, setQuo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/supplier_quotation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuo(res.data);
    } catch (err) {
      console.error('Gagal load supplier quotation:', err);
      Swal.fire('Error', 'Quotation tidak ditemukan', 'error');
      navigate('/quotation-approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const formatRupiah = (value) => (Number(value) || 0).toLocaleString('id-ID');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING QUOTATION...</p>
        </div>
      </div>
    );
  }

  if (!quo) return null;

  // ── Kalkulasi modal/COGS ─────────────────────────────────
  const subtotalCOGS  = (quo.items || []).reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 0)), 0);
  const additionalFee = quo.additionalFee || 0;
  const taxAmount     = quo.taxAmount || 0;
  const grandTotal     = subtotalCOGS + additionalFee + taxAmount;

  const handleApprove = async (status) => {
    let rejectionReason = '';

    if (status === 'Rejected') {
      const { value: text } = await Swal.fire({
        title: 'REJECT QUOTATION',
        input: 'textarea',
        inputLabel: 'Alasan Penolakan',
        inputPlaceholder: 'Contoh: Harga terlalu tinggi dibanding vendor lain...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Tolak Quotation',
        inputValidator: (value) => { if (!value) return 'Alasan penolakan wajib diisi!'; }
      });
      if (!text) return;
      rejectionReason = text;
    } else {
      const result = await Swal.fire({
        title: 'Setujui Quotation Ini?',
        html: `Modal dari vendor <strong>${quo.vendorId}</strong> sebesar <strong class="text-emerald-600">Rp ${formatRupiah(grandTotal)}</strong> akan disetujui dan bisa dipakai sebagai dasar Client Quotation.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Ya, Setujui'
      });
      if (!result.isConfirmed) return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/supplier_quotation/${id}/approve`,
        { status, rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: 'success',
        title: status === 'Approved' ? 'DISETUJUI' : 'DITOLAK',
        timer: 1500,
        showConfirmButton: false
      });
      navigate('/quotation-approval');
    } catch (err) {
      Swal.fire('GAGAL', err.response?.data?.msg || 'Gagal memproses approval', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const isPending = (quo.approvalStatus || 'Pending') === 'Pending';

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/quotation-approval')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Supplier <span className="text-indigo-600">Quotation</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">{quo.quotationId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(quo.approvalStatus === 'Approved') && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              <CheckCircle size={14} /> APPROVED
            </span>
          )}
          {(quo.approvalStatus === 'Rejected') && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-black text-rose-700 uppercase tracking-wider">
              <XCircle size={14} /> REJECTED
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-700 uppercase tracking-wider">
              <Clock size={14} /> PENDING VERIFICATION
            </span>
          )}
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — DETAILS */}
          <div className="lg:col-span-2 space-y-8">

            {/* Vendor & Project Info */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Building2 size={14} /> Vendor & Project
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendor</p>
                  <p className="text-lg font-black text-slate-800 uppercase mt-1">{quo.vendorId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project ID</p>
                  <p className="text-lg font-black text-slate-800 uppercase mt-1">{quo.projectId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Term of Payment</p>
                  <p className="text-base font-black text-amber-600 uppercase mt-1">{quo.topOption === 'Custom' ? quo.customTop : quo.topOption}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Currency</p>
                  <p className="text-base font-black text-slate-700 uppercase mt-1">{quo.currency || 'IDR'}</p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {quo.remarks && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText size={12} /> Remarks
                </p>
                <p className="text-sm text-slate-600 italic">{quo.remarks}</p>
              </div>
            )}

            {/* Items Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Package size={14} /> Itemized COGS Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3 text-center">Qty</th>
                      <th className="px-5 py-3 text-center">Unit</th>
                      <th className="px-5 py-3 text-right">COGS / Unit</th>
                      <th className="px-5 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(quo.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-5 py-3 font-bold text-slate-700 text-sm">{item.itemName}</td>
                        <td className="px-5 py-3 text-center text-slate-600 text-sm">{item.quantity}</td>
                        <td className="px-5 py-3 text-center text-slate-500 text-sm">{item.unit}</td>
                        <td className="px-5 py-3 text-right text-slate-600 text-sm">Rp {formatRupiah(item.cogs)}</td>
                        <td className="px-5 py-3 text-right font-black text-slate-800 text-sm">
                          Rp {formatRupiah((item.cogs || 0) * (item.quantity || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan="4" className="px-5 py-3 text-right font-black text-[10px] uppercase text-slate-500">Subtotal Barang</td>
                      <td className="px-5 py-3 text-right font-black text-slate-800">Rp {formatRupiah(subtotalCOGS)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Document attachment */}
            {quo.documentUrl && (
              <a
                href={`http://localhost:5000/${quo.documentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                <FileText size={14} /> Lihat Dokumen Pendukung
              </a>
            )}
          </div>

          {/* RIGHT — FINANCIAL SUMMARY + ACTIONS */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-24">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                Financial Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[10px] font-bold text-slate-300">Subtotal Barang</span>
                  <span className="font-black text-white">Rp {formatRupiah(subtotalCOGS)}</span>
                </div>
                {additionalFee > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300">Additional Fee</span>
                    <span className="font-black text-amber-300">+ Rp {formatRupiah(additionalFee)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300">
                      Tax {quo.isTaxIncluded ? '(Included)' : ''}
                    </span>
                    <span className="font-black text-amber-300">+ Rp {formatRupiah(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 mt-2 bg-indigo-500/20 -mx-3 px-3 rounded-xl">
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">TOTAL MODAL</span>
                  <span className="text-xl font-black text-indigo-300">Rp {formatRupiah(grandTotal)}</span>
                </div>
              </div>

              {quo.approvalStatus === 'Rejected' && quo.rejectionReason && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-[8px] text-rose-400 uppercase font-black tracking-widest">Alasan Ditolak</p>
                  <p className="text-[10px] text-rose-300 mt-1">{quo.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Management Actions */}
            {isPending && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Management Action</p>
                <button
                  onClick={() => handleApprove('Approved')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Approve Quotation
                </button>
                <button
                  onClick={() => handleApprove('Rejected')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <XCircle size={14} /> Reject Quotation
                </button>
                <p className="text-[8px] text-slate-400 text-center pt-1">
                  Approval akan membuka quotation ini untuk dipakai sebagai dasar Client Quotation.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuotationDetailReview;