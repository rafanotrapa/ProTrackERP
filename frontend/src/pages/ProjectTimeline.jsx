import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, DollarSign,
  FileText, Truck, TrendingUp, TrendingDown, Package,
  ChevronDown, ChevronUp, BarChart3, Receipt, ShoppingCart,
  Boxes, MapPin, Phone, Activity, Banknote, Wallet, XCircle
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = 'http://localhost:5000';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) => 'Rp ' + (Number(v) || 0).toLocaleString('id-ID');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getFileUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${API}/uploads/documents/${filename}`;
};

const StatusPill = ({ status, size = 'sm' }) => {
  const map = {
    Paid:                   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Unpaid:                 { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
    Pending:                { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
    Delivered:              { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'In Transit':           { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
    Scheduled:              { bg: 'bg-sky-100',     text: 'text-sky-700',     dot: 'bg-sky-500' },
    'Waiting Delivery':     { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
    Passed:                 { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Returned:               { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
    Approved:               { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Rejected:               { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500' },
    'Pending Verification': { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  };
  const cfg = map[status] || map['Pending'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status || 'Pending'}
    </span>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ icon, title, badge, id, open, onToggle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <button
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</span>
        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{title}</span>
        {badge != null && (
          <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
    </button>
    {open && <div className="border-t border-slate-100">{children}</div>}
  </div>
);

// ─── Info row in financial tables ─────────────────────────────────────────────
const InfoRow = ({ label, value, valueClass = 'text-slate-800', border = true }) => (
  <div className={`flex justify-between items-center py-2.5 ${border ? 'border-b border-slate-100' : ''}`}>
    <span className="text-[11px] font-semibold text-slate-500">{label}</span>
    <span className={`font-black text-sm ${valueClass}`}>{value}</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ProjectTimeline = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({
    stages: true,
    financial: true,
    clientInvoices: true,
    po: true,
    logistics: false,
    cashOut: false,
    expenses: true,   // ← baru: terbuka default biar langsung kelihatan
    profit: false
  });

  const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API}/api/project-timeline/${projectId}`, { headers: h });
        setData(res.data);
      } catch (err) {
        console.error('Timeline fetch error:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING TIMELINE...</p>
        </div>
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-black text-slate-700 text-xl uppercase tracking-tight">Project Not Found</p>
          <p className="text-[10px] text-slate-400 mt-1">{projectId}</p>
          <button onClick={() => navigate('/timeline')} className="mt-5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all">
            ← Kembali ke List
          </button>
        </div>
      </div>
    );
  }

  const {
    project, financial, progress, paymentStages, clientInvoices,
    purchaseOrders, supplierInvoices, cashOut, profitMargin,
    expenses, // ← baru
  } = data;
  const isComplete = progress.isComplete;
  const pct = progress.percent || 0;
  const barColor = isComplete ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      {/* STICKY PAGE HEADER */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-100 px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/timeline')}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm active:scale-90"
          >
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">{project.projectId}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isComplete ? '✓ SELESAI' : '● BERJALAN'}
              </span>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Timeline</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Grand Total</p>
            <p className="text-sm font-black text-slate-800">{fmt(financial.grandTotal)}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-100 ${pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {pct}% terbayar
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-5">

        {/* ── 1. PROJECT IDENTITY ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-1 line-clamp-2">
            {project.projectName}
          </h2>
          <p className="text-sm font-semibold text-slate-500 mb-4">{project.clientName}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Project ID', value: project.projectId, bg: 'bg-indigo-50', text: 'text-indigo-700' },
              { label: 'Client', value: project.clientName || '—', bg: 'bg-slate-50', text: 'text-slate-700' },
              { label: 'Grand Total', value: fmt(financial.grandTotal), bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { label: 'Terms of Payment', value: financial.topOption, bg: 'bg-amber-50', text: 'text-amber-700' }
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-3`}>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className={`text-[11px] font-black ${item.text} line-clamp-1`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Contact info jika ada */}
          {(project.clientContact || project.clientAddress) && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
              {project.clientContact && (
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Phone size={11} className="text-slate-400" /> {project.clientContact}
                </span>
              )}
              {project.clientAddress && (
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <MapPin size={11} className="text-slate-400" /> {project.clientAddress}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 2. PROGRESS BAR ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Progress Pembayaran</h3>
            <span className={`text-2xl font-black ${pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-indigo-600' : 'text-amber-600'}`}>{pct}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-black text-slate-400">
            <span>{fmt(financial.totalPaid)} terbayar</span>
            <span>{fmt(financial.grandTotal)} total kontrak</span>
          </div>

          {/* Milestone flags dari Project model */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: 'DP Paid', done: project.milestones.isDPPaid },
              { label: 'Items Received', done: project.milestones.isItemsReceived },
              { label: 'Items Delivered', done: project.milestones.isItemsDelivered },
              { label: 'Final Paid', done: project.milestones.isFinalPaid }
            ].map((m, i) => (
              <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl ${m.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                {m.done
                  ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  : <Clock size={14} className="text-slate-300 shrink-0" />}
                <span className={`text-[9px] font-black uppercase ${m.done ? 'text-emerald-700' : 'text-slate-400'}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. PAYMENT STAGES (TERMIN) ──────────────────────────────────── */}
        <Section icon={<Receipt size={14} />} title="Payment Stages (Termin)" id="stages"
          badge={`${progress.paidStages}/${progress.totalStages} paid`}
          open={open.stages} onToggle={toggle}
        >
          {paymentStages.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase">Belum ada stages — approve client quotation terlebih dahulu</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paymentStages.map((stage) => (
                <div
                  key={stage.stageNumber}
                  className={`flex flex-wrap items-center gap-4 px-6 py-4 transition-colors ${
                    stage.status === 'Paid' ? 'bg-emerald-50/60' :
                    stage.status === 'Unpaid' ? 'bg-amber-50/40' : 'bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black ${
                    stage.status === 'Paid' ? 'bg-emerald-500 text-white' :
                    stage.status === 'Unpaid' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {stage.status === 'Paid' ? <CheckCircle2 size={16} /> : stage.stageNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-800">{stage.name}</p>
                      <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{stage.percentage}%</span>
                    </div>
                    {stage.invoice && (
                      <p className="text-[9px] text-indigo-500 font-bold mt-0.5">
                        {stage.invoice.invoiceNumber} &bull; Due {fmtDate(stage.invoice.dueDate)}
                      </p>
                    )}
                    {!stage.invoice && (
                      <p className="text-[9px] text-slate-400 mt-0.5">Invoice belum diterbitkan</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-800">{fmt(stage.expectedAmount)}</p>
                  </div>

                  <div className="shrink-0">
                    <StatusPill status={stage.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 4. FINANCIAL SUMMARY ────────────────────────────────────────── */}
        <Section icon={<DollarSign size={14} />} title="Ringkasan Keuangan" id="financial"
          open={open.financial} onToggle={toggle}
        >
          <div className="px-6 py-4 space-y-0">
            <InfoRow label="Subtotal (Harga Client)" value={fmt(financial.clientPrice)} />
            <InfoRow label="Ongkos Kirim" value={fmt(financial.shippingFee)} />
            <InfoRow label={`Pajak (${financial.taxPercentage}%)`} value={fmt(financial.taxAmount)} />

            {/* Grand Total highlight */}
            <div className="flex justify-between items-center py-3 -mx-6 px-6 bg-slate-900 text-white my-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Grand Total</span>
              <span className="font-black text-base">{fmt(financial.grandTotal)}</span>
            </div>

            <InfoRow label="Total Diterima (Paid)" value={fmt(financial.totalPaid)} valueClass="text-emerald-600" />
            <InfoRow label="Belum Terbayar" value={fmt(financial.totalUnpaid)} valueClass="text-amber-600" />
            <InfoRow label="Sisa Tagihan" value={fmt(financial.remaining)} valueClass={financial.remaining > 0 ? 'text-red-600' : 'text-emerald-600'} border={false} />
          </div>
        </Section>

        {/* ── 5. INVOICE CLIENT ───────────────────────────────────────────── */}
        <Section icon={<FileText size={14} />} title="Invoice Client" id="clientInvoices"
          badge={clientInvoices.length > 0 ? `${clientInvoices.length} invoice` : null}
          open={open.clientInvoices} onToggle={toggle}
        >
          {clientInvoices.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <FileText size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-black text-slate-300 uppercase">Belum ada invoice diterbitkan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['No Invoice', 'Phase', 'Jumlah', 'Jatuh Tempo', 'Status'].map((h, i) => (
                      <th key={i} className="px-5 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3"><span className="font-black text-indigo-600 text-[11px]">{inv.invoiceNumber}</span></td>
                      <td className="px-5 py-3"><span className="text-[11px] text-slate-600 font-medium">{inv.billingPhase}</span></td>
                      <td className="px-5 py-3"><span className="font-black text-slate-800">{fmt(inv.amount)}</span></td>
                      <td className="px-5 py-3"><span className="text-[11px] text-slate-500">{fmtDate(inv.dueDate)}</span></td>
                      <td className="px-5 py-3"><StatusPill status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── 6. PURCHASE ORDER ───────────────────────────────────────────── */}
        <Section icon={<ShoppingCart size={14} />} title="Purchase Order (PO)" id="po"
          badge={purchaseOrders.length > 0 ? `${purchaseOrders.length} PO` : '0 PO'}
          open={open.po} onToggle={toggle}
        >
          {purchaseOrders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Package size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-black text-slate-300 uppercase">Belum ada PO dibuat</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => (
                <div key={po._id} className="px-6 py-5">
                  {/* PO Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-black text-slate-800 text-base">{po.poNumber}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Vendor: <span className="font-bold text-slate-700">{po.vendorName}</span></p>
                      {po.vendorContact && <p className="text-[9px] text-slate-400">{po.vendorContact}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">{fmt(po.totalAmount)}</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">{fmtDate(po.createdAt)}</p>
                    </div>
                  </div>

                  {/* Status grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
                      <StatusPill status={po.paymentStatus} />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">QC Status</p>
                      <StatusPill status={po.qcStatus} />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Delivery Status</p>
                      <StatusPill status={po.deliveryStatus} />
                    </div>
                  </div>

                  {/* Items */}
                  {po.items && po.items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            {['Item', 'Qty', 'Unit', 'COGS/unit', 'Subtotal'].map((h, i) => (
                              <th key={i} className="py-1.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {po.items.map((item, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-4 text-[11px] font-medium text-slate-700">{item.itemName}</td>
                              <td className="py-1.5 pr-4 text-[11px] text-slate-600">{item.quantity}</td>
                              <td className="py-1.5 pr-4 text-[11px] text-slate-600">{item.unit}</td>
                              <td className="py-1.5 pr-4 text-[11px] text-slate-600">{fmt(item.cogs)}</td>
                              <td className="py-1.5 font-black text-[11px] text-slate-800">{fmt((item.cogs || 0) * (item.quantity || 1))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 7. LOGISTICS ────────────────────────────────────────────────── */}
        {purchaseOrders.length > 0 && (
          <Section icon={<Truck size={14} />} title="Logistics & Pengiriman" id="logistics"
            open={open.logistics} onToggle={toggle}
          >
            <div className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => (
                <div key={po._id} className="px-6 py-5">
                  <p className="font-black text-slate-700 text-sm mb-3">{po.poNumber} &mdash; {po.vendorName}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Delivery Status</p>
                      <StatusPill status={po.deliveryStatus} />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Tanggal Kirim</p>
                      <p className="text-[11px] font-black text-slate-700">{fmtDate(po.deliveryDate)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Kurir</p>
                      <p className="text-[11px] font-black text-slate-700">{po.courierName}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Resi / Tracking</p>
                      <p className="text-[11px] font-black text-slate-700">{po.trackingNumber}</p>
                    </div>
                  </div>
                  {po.qcRemarks && (
                    <p className="mt-3 text-[10px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-black text-slate-600">QC Notes:</span> {po.qcRemarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── 8. DUIT KELUAR (SUPPLIER INVOICES) ──────────────────────────── */}
        <Section icon={<Banknote size={14} />} title="Tagihan Supplier (Duit Keluar)" id="cashOut"
          badge={supplierInvoices.length > 0 ? `${supplierInvoices.length} tagihan` : null}
          open={open.cashOut} onToggle={toggle}
        >
          <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-slate-100">
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-1">Total Terbayar</p>
              <p className="font-black text-red-700">{fmt(cashOut.totalPaid)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider mb-1">Menunggu Bayar</p>
              <p className="font-black text-amber-700">{fmt(cashOut.totalPending)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Tagihan</p>
              <p className="font-black text-slate-800">{fmt(cashOut.total)}</p>
            </div>
          </div>

          {supplierInvoices.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase">Belum ada tagihan supplier</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['No Invoice', 'Vendor', 'Termin', 'Jumlah', 'Status', 'Tgl Bayar'].map((h, i) => (
                      <th key={i} className="px-5 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierInvoices.map((si) => (
                    <tr key={si._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3"><span className="font-black text-indigo-600 text-[11px]">{si.invoiceNumber}</span></td>
                      <td className="px-5 py-3"><span className="text-[11px] font-medium text-slate-700">{si.vendorName}</span></td>
                      <td className="px-5 py-3"><span className="text-[11px] text-slate-500">{si.terminName}</span></td>
                      <td className="px-5 py-3"><span className="font-black text-slate-800">{fmt(si.amount)}</span></td>
                      <td className="px-5 py-3"><StatusPill status={si.status} /></td>
                      <td className="px-5 py-3"><span className="text-[11px] text-slate-500">{fmtDate(si.paymentDate)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── 9. REIMBURSE / EXPENSE SUBMISSION (BARU) ────────────────────── */}
        <Section icon={<Wallet size={14} />} title="Reimburse & Biaya Lain" id="expenses"
          badge={expenses.count > 0 ? `${expenses.count} pengajuan` : null}
          open={open.expenses} onToggle={toggle}
        >
          <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-slate-100">
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-orange-500 uppercase tracking-wider mb-1">Disetujui (mengurangi profit)</p>
              <p className="font-black text-orange-700">{fmt(expenses.totalApproved)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider mb-1">Menunggu Verifikasi Finance</p>
              <p className="font-black text-amber-700">{fmt(expenses.totalPending)}</p>
            </div>
          </div>

          {expenses.items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Wallet size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-black text-slate-300 uppercase">Belum ada pengajuan biaya untuk project ini</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses.items.map((e) => (
                <div key={e._id} className="flex flex-wrap items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    e.status === 'Approved' ? 'bg-emerald-100' :
                    e.status === 'Rejected' ? 'bg-rose-100' : 'bg-amber-100'
                  }`}>
                    {e.status === 'Approved' ? <CheckCircle2 size={16} className="text-emerald-600" /> :
                     e.status === 'Rejected' ? <XCircle size={16} className="text-rose-600" /> :
                     <Clock size={16} className="text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{e.submissionId}</span>
                      <span className="text-[8px] font-bold text-slate-400">{(e.items || []).length} item</span>
                    </div>
                    {/* Multi-item list */}
                    <div className="space-y-1">
                      {(e.items || []).map((it, idx) => (
                        <div key={idx} className="flex justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-800 text-sm">{it.name}</p>
                            {it.description && (
                              <p className="text-[10px] text-slate-500">{it.description}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 shrink-0">{fmt(it.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2">
                      Diajukan oleh <span className="font-bold text-slate-500">{e.submittedByName}</span> &bull; {fmtDate(e.createdAt)}
                    </p>
                    {e.status === 'Rejected' && e.rejectionReason && (
                      <p className="text-[9px] text-rose-500 mt-1 bg-rose-50 rounded-lg px-2 py-1 inline-block">
                        Ditolak: {e.rejectionReason}
                      </p>
                    )}
                    {e.file && (
                      <a
                        href={getFileUrl(e.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-indigo-500 font-bold mt-1 inline-block hover:underline"
                      >
                        📎 Lihat Lampiran
                      </a>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-800">{fmt(e.amount)}</p>
                    <p className="text-[8px] text-slate-400">Total &bull; {e.currency}</p>
                  </div>

                  <div className="shrink-0">
                    <StatusPill status={e.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 10. PROFIT MARGIN ───────────────────────────────────────────── */}
        <Section icon={<BarChart3 size={14} />} title="Profit Margin" id="profit"
          open={open.profit} onToggle={toggle}
        >
          <div className="px-6 py-5">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-wider mb-1">Sales Price (Client)</p>
                <p className="text-xl font-black text-indigo-800">{fmt(profitMargin.salesPrice)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-1">Total COGS (Supplier)</p>
                <p className="text-xl font-black text-red-800">{fmt(profitMargin.cogs)}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider mb-1">Biaya Lain (Reimburse)</p>
                <p className="text-xl font-black text-orange-800">{fmt(profitMargin.otherExpense)}</p>
              </div>
              <div className={`${profitMargin.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl p-4`}>
                <p className={`text-[8px] font-black uppercase tracking-wider mb-1 ${profitMargin.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Net Profit
                </p>
                <p className={`text-xl font-black ${profitMargin.netProfit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                  {fmt(profitMargin.netProfit)}
                </p>
              </div>
            </div>

            {/* Gross vs Net breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">Gross Profit (sebelum biaya lain)</span>
                <span className={`text-sm font-black ${profitMargin.grossProfit >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                  {fmt(profitMargin.grossProfit)}
                </span>
              </div>
              {profitMargin.otherExpense > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-orange-500">− Biaya Lain (Reimburse Approved)</span>
                  <span className="text-sm font-black text-orange-600">({fmt(profitMargin.otherExpense)})</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black text-slate-700">Net Profit</span>
                <span className={`text-base font-black ${profitMargin.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(profitMargin.netProfit)}
                </span>
              </div>
            </div>

            {/* Margin bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Net Margin</p>
                <div className="flex items-center gap-1.5">
                  {profitMargin.netProfit >= 0
                    ? <TrendingUp size={14} className="text-emerald-500" />
                    : <TrendingDown size={14} className="text-red-500" />}
                  <span className={`text-xl font-black ${profitMargin.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profitMargin.netMarginPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${profitMargin.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(profitMargin.netMarginPercent), 100)}%` }}
                />
              </div>
              {profitMargin.cogs === 0 && (
                <p className="text-[9px] text-slate-400 mt-2 text-center italic">
                  COGS akan muncul setelah supplier quotation di-approve
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── PROJECT HEALTH BANNER ─────────────────────────────────────── */}
        <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
          isComplete ? 'bg-emerald-50 border-emerald-200' :
          pct >= 75  ? 'bg-indigo-50 border-indigo-200' :
          pct >= 40  ? 'bg-amber-50 border-amber-200' :
                       'bg-slate-50 border-slate-200'
        }`}>
          <Activity size={18} className={`mt-0.5 shrink-0 ${
            isComplete ? 'text-emerald-600' : pct >= 75 ? 'text-indigo-600' : pct >= 40 ? 'text-amber-600' : 'text-slate-400'
          }`} />
          <div>
            <p className={`font-black text-xs uppercase tracking-tighter ${
              isComplete ? 'text-emerald-800' : pct >= 75 ? 'text-indigo-800' : pct >= 40 ? 'text-amber-800' : 'text-slate-600'
            }`}>Project Health</p>
            <p className={`text-[9px] mt-1 ${
              isComplete ? 'text-emerald-600' : pct >= 75 ? 'text-indigo-600' : pct >= 40 ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {isComplete
                ? 'Project selesai. Semua tahapan pembayaran telah terlunasi.'
                : pct >= 75 ? 'Mendekati selesai — tahap akhir pembayaran sedang berjalan.'
                : pct >= 40 ? 'Project on track. Terus pantau milestone pembayaran.'
                : 'Project tahap awal. Milestone utama masih menunggu.'}
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default ProjectTimeline;