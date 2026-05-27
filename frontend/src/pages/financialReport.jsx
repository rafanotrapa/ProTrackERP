import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  ChevronDown, ChevronRight, Download, BarChart2,
  CreditCard, Clock, ArrowUpRight, ArrowDownLeft,
  Package, Truck, FileText, Activity
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = 'http://localhost:5000/api';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);

const fmtRp = (v) => `Rp ${fmt(v)}`;

const pct = (num, den) =>
  den > 0 ? ((num / den) * 100).toFixed(1) + '%' : '0%';

const getMonthLabel = (key) => {
  if (!key) return '-';
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('id-ID', {
    month: 'short', year: 'numeric',
  });
};

const ageBadge = (days) => {
  if (days === null) return null;
  if (days === 0) return { label: 'Due Today', cls: 'bg-amber-100 text-amber-700' };
  if (days > 0)  return { label: `${days}d overdue`, cls: 'bg-rose-100 text-rose-700' };
  return null;
};

// ─── micro-components ────────────────────────────────────────────────────────
const Pill = ({ label, cls = 'bg-slate-100 text-slate-600' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${cls}`}>
    {label}
  </span>
);

const StatCard = ({ label, value, sub, accent = false, dark = false }) => (
  <div
    className={`rounded-2xl p-5 flex flex-col gap-1 shadow-sm border
      ${dark   ? 'bg-slate-900 border-slate-800' :
        accent ? 'bg-indigo-600 border-indigo-500' :
                 'bg-white border-slate-100'}`}
  >
    <p className={`text-[8px] font-black uppercase tracking-widest
      ${dark ? 'text-slate-400' : accent ? 'text-indigo-200' : 'text-slate-400'}`}>
      {label}
    </p>
    <p className={`text-xl md:text-2xl font-black leading-none
      ${dark ? 'text-emerald-400' : accent ? 'text-white' : 'text-slate-900'}`}>
      {value}
    </p>
    {sub && (
      <p className={`text-[9px] mt-1
        ${dark ? 'text-slate-500' : accent ? 'text-indigo-200' : 'text-slate-400'}`}>
        {sub}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TABS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview',       Icon: BarChart2   },
  { id: 'profitloss',   label: 'P&L per Project',Icon: DollarSign  },
  { id: 'cashflow',     label: 'Cash Flow',       Icon: Activity    },
  { id: 'receivables',  label: 'Receivables',     Icon: Clock       },
  { id: 'trend',        label: 'Monthly Trend',   Icon: TrendingUp  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const FinancialReport = () => {
  const [tab,      setTab]      = useState('overview');
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  const [summary,    setSummary]    = useState(null);
  const [projects,   setProjects]   = useState([]);
  const [cashFlow,   setCashFlow]   = useState(null);
  const [receivables,setReceivables]= useState(null);
  const [trend,      setTrend]      = useState([]);

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { headers: { Authorization: `Bearer ${token}` } };

    const load = async () => {
      try {
        const [sumRes, projRes, cfRes, recRes, trendRes] = await Promise.all([
          axios.get(`${API}/financial/summary`,        h),
          axios.get(`${API}/financial/project-report`, h),
          axios.get(`${API}/financial/cash-flow`,      h),
          axios.get(`${API}/financial/receivables`,    h),
          axios.get(`${API}/financial/monthly-trend`,  h),
        ]);
        setSummary(sumRes.data);
        setProjects(projRes.data || []);
        setCashFlow(cfRes.data);
        setReceivables(recRes.data);
        setTrend(trendRes.data || []);
      } catch (e) {
        console.error('Financial data fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── PDF export ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    const now = new Date().toLocaleString('id-ID');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL REPORT', 105, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${now}`, 105, 26, { align: 'center' });

    // Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN', 14, 38);

    const sumRows = [
      ['Revenue Bisnis (excl. tax & shipping)',  fmtRp(summary.totalClientRevenue)],
      ['PPN Client (pass-through)',               fmtRp(summary.totalClientTax)],
      ['Ongkir Client (pass-through)',            fmtRp(summary.totalClientShipping)],
      ['Total Ditagihkan ke Client',              fmtRp(summary.totalBilled)],
      ['', ''],
      ['COGS (harga beli vendor)',                fmtRp(summary.totalCOGS)],
      ['Bea Cukai / Import Duty',                 fmtRp(summary.totalImportDuty)],
      ['PPN Vendor (pass-through, info only)',    fmtRp(summary.totalSupplierTaxPassThru)],
      ['Total Expense Bisnis',                    fmtRp(summary.totalExpense)],
      ['', ''],
      ['NET PROFIT',                              fmtRp(summary.netProfit)],
      ['Gross Margin',                            pct(summary.netProfit, summary.totalClientRevenue)],
      ['', ''],
      ['Cash Diterima (Verified Payments)',       fmtRp(summary.totalCashReceived)],
      ['Outstanding Piutang',                     fmtRp(summary.totalOutstanding)],
    ];

    autoTable(doc, {
      startY: 42,
      body: sumRows,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    // P&L table
    const y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('P&L PER PROJECT', 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['Project', 'Revenue', 'COGS', 'Bea Cukai', 'Expense', 'Net Profit', 'Margin']],
      body: projects.map(p => [
        p.projectName || p.projectId,
        fmtRp(p.clientRevenue),
        fmtRp(p.supplierCOGS),
        fmtRp(p.supplierImportDuty),
        fmtRp(p.totalExpense),
        fmtRp(p.netProfit),
        `${p.margin}%`,
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    });

    doc.save(`Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Loading Financial Data…
        </p>
      </div>
    </div>
  );

  // ── aggregates ────────────────────────────────────────────────────────────
  const s = summary || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="w-full border-b border-slate-100 px-6 md:px-10 py-5 bg-white flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
        >
          <span className="text-slate-500 font-black text-lg leading-none">←</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Financial <span className="text-indigo-600">Report</span>
          </h1>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 italic">
            Revenue · Expense · Tax · Import Duty
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-10 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                tab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 md:p-10 space-y-8">

        {/* ════════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <>
            {/* Explainer Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 items-start">
              <AlertCircle size={16} className="text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-indigo-800 uppercase tracking-wide mb-1">Cara Baca Laporan Ini</p>
                <p className="text-[10px] text-indigo-700 leading-relaxed">
                  <strong>Revenue Bisnis</strong> = hanya <code>clientPrice</code> (subtotal barang). PPN & ongkir client adalah <em>pass-through</em> — uangnya masuk ke kita tapi langsung diteruskan ke negara & ekspedisi, bukan pendapatan bisnis.
                  {' '}<strong>Expense Bisnis</strong> = COGS (harga beli vendor) + Bea Cukai (biaya operasional riil). PPN vendor juga pass-through, tidak masuk P&L.
                </p>
              </div>
            </div>

            {/* Revenue Cards */}
            <section>
              <SectionTitle icon={<ArrowUpRight size={14} />} label="Revenue & Penerimaan" color="text-emerald-600" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <StatCard
                  label="Revenue Bisnis (Bersih)"
                  value={fmtRp(s.totalClientRevenue)}
                  sub="clientPrice tanpa tax & shipping"
                  accent
                />
                <StatCard
                  label="PPN Client (Pass-through)"
                  value={fmtRp(s.totalClientTax)}
                  sub="Diteruskan ke negara"
                />
                <StatCard
                  label="Ongkir Client (Pass-through)"
                  value={fmtRp(s.totalClientShipping)}
                  sub="Diteruskan ke ekspedisi"
                />
                <StatCard
                  label="Total Ditagihkan ke Client"
                  value={fmtRp(s.totalBilled)}
                  sub="Revenue + PPN + Ongkir"
                  dark
                />
              </div>
            </section>

            {/* Expense Cards */}
            <section>
              <SectionTitle icon={<ArrowDownLeft size={14} />} label="Expense & Pengeluaran Bisnis" color="text-rose-600" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <StatCard
                  label="COGS (Harga Beli Vendor)"
                  value={fmtRp(s.totalCOGS)}
                  sub="Biaya pokok barang"
                />
                <StatCard
                  label="Bea Cukai / Import Duty"
                  value={fmtRp(s.totalImportDuty)}
                  sub="Biaya operasional impor"
                />
                <StatCard
                  label="PPN Vendor (Info Only)"
                  value={fmtRp(s.totalSupplierTaxPassThru)}
                  sub="Pass-through ke negara, bukan expense"
                />
                <StatCard
                  label="Total Expense Bisnis"
                  value={fmtRp(s.totalExpense)}
                  sub="COGS + Bea Cukai"
                  dark
                />
              </div>
            </section>

            {/* Bottom Line */}
            <section>
              <SectionTitle icon={<TrendingUp size={14} />} label="Hasil Akhir" color="text-indigo-600" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <StatCard
                  label="Net Profit"
                  value={fmtRp(s.netProfit)}
                  sub={`Revenue − COGS − Bea Cukai`}
                  accent={s.netProfit >= 0}
                />
                <StatCard
                  label="Gross Margin"
                  value={pct(s.netProfit, s.totalClientRevenue)}
                  sub="Net Profit / Revenue Bisnis"
                />
                <StatCard
                  label="Cash Diterima"
                  value={fmtRp(s.totalCashReceived)}
                  sub="Dari payments verified"
                />
                <StatCard
                  label="Outstanding Piutang"
                  value={fmtRp(s.totalOutstanding)}
                  sub="Belum dibayar client"
                />
              </div>
            </section>

            {/* Project count bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-wrap gap-6 items-center">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Projects</p>
                <p className="text-3xl font-black text-slate-900">{projects.length}</p>
              </div>
              <div className="h-12 w-px bg-slate-100" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Profitable</p>
                <p className="text-3xl font-black text-emerald-600">
                  {projects.filter(p => p.netProfit > 0).length}
                </p>
              </div>
              <div className="h-12 w-px bg-slate-100" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Loss</p>
                <p className="text-3xl font-black text-rose-500">
                  {projects.filter(p => p.netProfit < 0).length}
                </p>
              </div>
              <div className="h-12 w-px bg-slate-100" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Avg Margin</p>
                <p className="text-3xl font-black text-indigo-600">
                  {projects.length > 0
                    ? (projects.reduce((s, p) => s + p.margin, 0) / projects.length).toFixed(1) + '%'
                    : '—'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: P&L PER PROJECT
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'profitloss' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                    Profit & Loss per Project
                  </h3>
                  <p className="text-[8px] text-slate-400 mt-0.5">
                    Klik baris untuk melihat breakdown detail
                  </p>
                </div>
                <Pill label={`${projects.length} projects`} cls="bg-slate-100 text-slate-600" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-3">Project</th>
                      <th className="px-4 py-3 text-right">Revenue Bisnis</th>
                      <th className="px-4 py-3 text-right">PPN Client</th>
                      <th className="px-4 py-3 text-right">Ongkir Client</th>
                      <th className="px-4 py-3 text-right bg-rose-50 text-rose-400">COGS</th>
                      <th className="px-4 py-3 text-right bg-rose-50 text-rose-400">Bea Cukai</th>
                      <th className="px-4 py-3 text-right bg-rose-50 text-rose-400">PPN Vendor</th>
                      <th className="px-4 py-3 text-right font-black text-slate-600">Net Profit</th>
                      <th className="px-4 py-3 text-right">Margin</th>
                      <th className="px-4 py-3 text-center">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-slate-400 italic text-sm">
                          Tidak ada data project
                        </td>
                      </tr>
                    ) : projects.map(p => {
                      const isOpen = expanded === p.projectId;
                      const profitColor = p.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600';

                      return (
                        <Fragment key={p.projectId}>
                          {/* ── Main Row ── */}
                          <tr
                            onClick={() => setExpanded(isOpen ? null : p.projectId)}
                            className="hover:bg-indigo-50/30 cursor-pointer transition-all"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {isOpen
                                  ? <ChevronDown size={13} className="text-indigo-500 shrink-0" />
                                  : <ChevronRight size={13} className="text-slate-300 shrink-0" />}
                                <div>
                                  <p className="font-black text-slate-900 text-xs">{p.projectName || p.projectId}</p>
                                  <p className="text-[8px] text-slate-400 font-mono">{p.projectId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right font-black text-emerald-600 text-xs whitespace-nowrap">
                              {fmtRp(p.clientRevenue)}
                            </td>
                            <td className="px-4 py-4 text-right text-[10px] text-slate-500 whitespace-nowrap">
                              {p.clientTax > 0 ? fmtRp(p.clientTax) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-4 text-right text-[10px] text-slate-500 whitespace-nowrap">
                              {p.clientShipping > 0 ? fmtRp(p.clientShipping) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-4 text-right text-[10px] text-rose-500 bg-rose-50/40 whitespace-nowrap">
                              {fmtRp(p.supplierCOGS)}
                            </td>
                            <td className="px-4 py-4 text-right text-[10px] text-rose-500 bg-rose-50/40 whitespace-nowrap">
                              {p.supplierImportDuty > 0 ? fmtRp(p.supplierImportDuty) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-4 text-right text-[10px] text-slate-400 bg-rose-50/40 whitespace-nowrap">
                              {p.supplierTaxPassThru > 0 ? fmtRp(p.supplierTaxPassThru) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className={`px-4 py-4 text-right font-black text-sm whitespace-nowrap ${profitColor}`}>
                              {fmtRp(p.netProfit)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <Pill
                                label={`${p.margin}%`}
                                cls={p.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                              />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-[9px] text-slate-500">
                                {p.invoiceSummary.paid}/{p.invoiceSummary.total}
                              </span>
                            </td>
                          </tr>

                          {/* ── Expanded Detail ── */}
                          {isOpen && (
                            <tr className="bg-slate-50/60">
                              <td colSpan={10} className="px-8 py-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                  {/* Revenue Detail */}
                                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-1">
                                      <ArrowUpRight size={11}/> Revenue Breakdown
                                    </p>
                                    <div className="space-y-2">
                                      <DetailRow label="Revenue Bisnis (clientPrice)" val={fmtRp(p.clientRevenue)} highlight />
                                      <DetailRow label="PPN Client (pass-through)" val={fmtRp(p.clientTax)} muted />
                                      <DetailRow label="Ongkir Client (pass-through)" val={fmtRp(p.clientShipping)} muted />
                                      <div className="border-t border-slate-100 pt-2 mt-2">
                                        <DetailRow label="Grand Total Tagihan ke Client" val={fmtRp(p.grandTotalBilled)} />
                                      </div>
                                      <div className="border-t border-slate-100 pt-2 mt-2">
                                        <DetailRow label="Cash Diterima" val={fmtRp(p.cashReceived)} />
                                        <DetailRow
                                          label="Outstanding"
                                          val={fmtRp(p.outstanding)}
                                          cls={p.outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expense Detail */}
                                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-1">
                                      <ArrowDownLeft size={11}/> Expense Breakdown
                                    </p>
                                    <div className="space-y-2">
                                      <DetailRow label="COGS (harga beli vendor)" val={fmtRp(p.supplierCOGS)} highlight />
                                      <DetailRow label="Bea Cukai / Import Duty" val={fmtRp(p.supplierImportDuty)} />
                                      <DetailRow label="Total Expense Bisnis" val={fmtRp(p.totalExpense)} bold />
                                      <div className="border-t border-slate-100 pt-2 mt-2">
                                        <DetailRow
                                          label="PPN Vendor (info only, pass-through)"
                                          val={fmtRp(p.supplierTaxPassThru)}
                                          muted
                                        />
                                        <DetailRow
                                          label="Total Transfer ke Vendor"
                                          val={fmtRp(p.supplierTotalPaid)}
                                          muted
                                        />
                                      </div>
                                      <div className="border-t border-slate-100 pt-2 mt-2 bg-slate-50 rounded-lg px-2 py-2">
                                        <DetailRow label="NET PROFIT" val={fmtRp(p.netProfit)}
                                          cls={p.netProfit >= 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Items */}
                                  <div className="bg-white rounded-xl border border-slate-100 p-4">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-3 flex items-center gap-1">
                                      <Package size={11}/> Item Quotation
                                    </p>
                                    {p.itemsDetail.length === 0 ? (
                                      <p className="text-[9px] text-slate-400 italic">Tidak ada item data</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {p.itemsDetail.map((it, idx) => (
                                          <div key={idx} className="text-[9px] border-b border-slate-50 pb-2">
                                            <p className="font-black text-slate-800">{it.itemName}</p>
                                            <p className="text-slate-500">{it.qty} {it.unit}</p>
                                            <div className="flex justify-between mt-1">
                                              <span className="text-rose-500">COGS: {fmtRp(it.totalCogs)}</span>
                                              <span className="text-emerald-600">Sales: {fmtRp(it.totalSales)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Supplier invoices breakdown */}
                                {p.supplierBreakdown.length > 0 && (
                                  <div className="mt-4 bg-white rounded-xl border border-slate-100 overflow-hidden">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 px-4 py-3 border-b border-slate-100 flex items-center gap-1">
                                      <FileText size={11}/> Supplier Invoices
                                    </p>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-[9px]">
                                        <thead className="bg-slate-50">
                                          <tr className="text-slate-400 font-black uppercase tracking-wider">
                                            <th className="px-4 py-2 text-left">Invoice</th>
                                            <th className="px-4 py-2 text-left">Vendor</th>
                                            <th className="px-4 py-2 text-right">COGS</th>
                                            <th className="px-4 py-2 text-right">Bea Cukai</th>
                                            <th className="px-4 py-2 text-right">PPN Vendor</th>
                                            <th className="px-4 py-2 text-right">Total Transfer</th>
                                            <th className="px-4 py-2 text-center">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {p.supplierBreakdown.map((si, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                              <td className="px-4 py-2 font-mono text-indigo-600">{si.invoiceNumber}</td>
                                              <td className="px-4 py-2 text-slate-700">{si.vendorName}</td>
                                              <td className="px-4 py-2 text-right text-rose-500">{fmtRp(si.cogs)}</td>
                                              <td className="px-4 py-2 text-right">
                                                {si.importDuty > 0 ? (
                                                  <span className="text-amber-600">{fmtRp(si.importDuty)}</span>
                                                ) : <span className="text-slate-300">—</span>}
                                              </td>
                                              <td className="px-4 py-2 text-right text-slate-400">
                                                {si.taxAmount > 0 ? fmtRp(si.taxAmount) : <span className="text-slate-300">—</span>}
                                              </td>
                                              <td className="px-4 py-2 text-right font-black text-slate-700">{fmtRp(si.totalPaid)}</td>
                                              <td className="px-4 py-2 text-center">
                                                <Pill
                                                  label={si.status}
                                                  cls={si.status === 'Paid'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'}
                                                />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: CASH FLOW
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'cashflow' && cashFlow && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard accent label="Cash In (dari client)" value={fmtRp(cashFlow.totalCashIn)} sub="Verified payments" />
              <StatCard label="Cash Out (ke vendor)" value={fmtRp(cashFlow.totalCashOut)} sub="Supplier invoices paid" />
              <StatCard dark label="Net Balance" value={fmtRp(cashFlow.netBalance)}
                sub={cashFlow.netBalance >= 0 ? '✓ Posisi kas positif' : '⚠ Posisi kas negatif'} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Riwayat Transaksi</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Tipe</th>
                      <th className="px-4 py-3 text-left">Deskripsi</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                      <th className="px-4 py-3 text-right">COGS</th>
                      <th className="px-4 py-3 text-right">Bea Cukai</th>
                      <th className="px-4 py-3 text-right">PPN Vendor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(cashFlow.entries || []).length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400 italic text-sm">Tidak ada data</td></tr>
                    ) : (cashFlow.entries || []).slice(0, 50).map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 text-[10px] text-slate-500">
                          {e.date ? new Date(e.date).toLocaleDateString('id-ID') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Pill
                            label={e.type}
                            cls={e.type === 'Cash In'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'}
                          />
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-700 font-mono">{e.description}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-600">{e.projectName || e.clientName || e.vendorName || '—'}</td>
                        <td className={`px-4 py-3 text-right font-black text-xs whitespace-nowrap ${e.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {e.type === 'Cash In' ? '+' : '−'}{fmtRp(e.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] text-slate-500 whitespace-nowrap">
                          {e.breakdown?.cogs > 0 ? fmtRp(e.breakdown.cogs) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] text-amber-600 whitespace-nowrap">
                          {e.breakdown?.importDuty > 0 ? fmtRp(e.breakdown.importDuty) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] text-slate-400 whitespace-nowrap">
                          {e.breakdown?.taxAmount > 0 ? fmtRp(e.breakdown.taxAmount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: RECEIVABLES
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'receivables' && receivables && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard accent label="Total Outstanding" value={fmtRp(receivables.totalOutstanding)} />
              <StatCard label="Jumlah Invoice Unpaid" value={receivables.invoices?.length || 0} />
              <StatCard label="Overdue" value={receivables.overdueCount || 0} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Outstanding Receivables</h3>
                <p className="text-[8px] text-slate-400 mt-0.5">Invoice client yang belum dibayar</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left">Invoice #</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                      <th className="px-4 py-3 text-center">Due Date</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(receivables.invoices || []).length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic text-sm">Tidak ada outstanding receivables</td></tr>
                    ) : (receivables.invoices || []).map(inv => {
                      const badge = ageBadge(inv.overdueDays);
                      return (
                        <tr key={inv._id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-black text-indigo-600 font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="px-4 py-4 font-bold text-slate-800 text-xs">{inv.projectName || inv.projectId}</td>
                          <td className="px-4 py-4 text-slate-600 text-xs">{inv.clientName}</td>
                          <td className="px-4 py-4 text-right font-black text-emerald-600 whitespace-nowrap">{fmtRp(inv.amount)}</td>
                          <td className="px-4 py-4 text-center text-[10px] text-slate-500">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '—'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {badge
                              ? <Pill label={badge.label} cls={badge.cls} />
                              : <Pill label="Pending" cls="bg-amber-100 text-amber-700" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: MONTHLY TREND
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'trend' && (
          <>
            {trend.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <p className="text-slate-400 italic">Belum ada data trend</p>
              </div>
            ) : (
              <>
                {/* Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-black text-sm uppercase tracking-wider mb-6">Revenue vs Expense vs Profit per Bulan</h3>
                  <div className="space-y-4">
                    {trend.map((m, idx) => {
                      const maxVal = Math.max(...trend.map(x => Math.max(x.revenue, x.expense, Math.abs(x.netProfit))), 1);
                      return (
                        <div key={idx}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-slate-500 w-16 shrink-0">{getMonthLabel(m.month)}</span>
                            <div className="flex-1 space-y-1">
                              {/* Revenue */}
                              <div className="flex items-center gap-2">
                                <span className="text-[7px] text-slate-400 w-8">Rev</span>
                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400 rounded-full flex items-center px-2"
                                    style={{ width: `${(m.revenue / maxVal) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[8px] font-black text-emerald-600 w-28 text-right">{fmtRp(m.revenue)}</span>
                              </div>
                              {/* Expense */}
                              <div className="flex items-center gap-2">
                                <span className="text-[7px] text-slate-400 w-8">Exp</span>
                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-rose-400 rounded-full"
                                    style={{ width: `${(m.expense / maxVal) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[8px] font-black text-rose-500 w-28 text-right">{fmtRp(m.expense)}</span>
                              </div>
                              {/* Profit */}
                              <div className="flex items-center gap-2">
                                <span className="text-[7px] text-slate-400 w-8">P&L</span>
                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${m.netProfit >= 0 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                    style={{ width: `${(Math.abs(m.netProfit) / maxVal) * 100}%` }}
                                  />
                                </div>
                                <span className={`text-[8px] font-black w-28 text-right ${m.netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                                  {m.netProfit >= 0 ? '+' : '-'}{fmtRp(Math.abs(m.netProfit))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-6 mt-6 pt-4 border-t border-slate-100">
                    {[
                      { color: 'bg-emerald-400', label: 'Revenue Bisnis' },
                      { color: 'bg-rose-400',    label: 'Total Expense (COGS + Bea Cukai)' },
                      { color: 'bg-indigo-500',  label: 'Net Profit' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${l.color}`} />
                        <span className="text-[8px] text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly table */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-black text-sm uppercase tracking-wider">Tabel Detail Bulanan</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3 text-left">Bulan</th>
                          <th className="px-4 py-3 text-right">Revenue</th>
                          <th className="px-4 py-3 text-right">PPN Client</th>
                          <th className="px-4 py-3 text-right">Ongkir Client</th>
                          <th className="px-4 py-3 text-right">COGS</th>
                          <th className="px-4 py-3 text-right">Bea Cukai</th>
                          <th className="px-4 py-3 text-right">Expense</th>
                          <th className="px-4 py-3 text-right">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {trend.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-black text-slate-800 text-xs">{getMonthLabel(m.month)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-black whitespace-nowrap">{fmtRp(m.revenue)}</td>
                            <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                              {m.clientTax > 0 ? fmtRp(m.clientTax) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                              {m.clientShipping > 0 ? fmtRp(m.clientShipping) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-500 whitespace-nowrap">{fmtRp(m.cogs)}</td>
                            <td className="px-4 py-3 text-right text-amber-600 whitespace-nowrap">
                              {m.importDuty > 0 ? fmtRp(m.importDuty) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600 font-black whitespace-nowrap">{fmtRp(m.expense)}</td>
                            <td className={`px-4 py-3 text-right font-black whitespace-nowrap ${m.netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                              {m.netProfit >= 0 ? '+' : ''}{fmtRp(m.netProfit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

// ── Small helper sub-components ───────────────────────────────────────────────
const SectionTitle = ({ icon, label, color = 'text-slate-700' }) => (
  <div className={`flex items-center gap-2 ${color}`}>
    {icon}
    <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
  </div>
);

const DetailRow = ({ label, val, muted, highlight, bold, cls }) => (
  <div className="flex justify-between items-center gap-2">
    <span className={`text-[9px] ${muted ? 'text-slate-400 italic' : 'text-slate-600'}`}>{label}</span>
    <span className={`text-[9px] whitespace-nowrap ${cls || (highlight ? 'font-black text-slate-900' : bold ? 'font-black text-slate-800' : 'text-slate-700')}`}>
      {val}
    </span>
  </div>
);

export default FinancialReport;