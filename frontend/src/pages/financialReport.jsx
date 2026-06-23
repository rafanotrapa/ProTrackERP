import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const rp  = (v) => `Rp ${(Number(v) || 0).toLocaleString('id-ID')}`;
const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—';
const monthLabel = (k) => {
  if (!k) return '—';
  const [y, m] = k.split('-');
  return new Date(+y, +m - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
};

// ─────────────────────────────────────────────────────────────
//  KPI CARD
// ─────────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, tone = 'default' }) => {
  const tones = {
    default: 'bg-white border-slate-100 text-slate-900',
    green:   'bg-emerald-50 border-emerald-100 text-emerald-700',
    red:     'bg-rose-50 border-rose-100 text-rose-700',
    dark:    'bg-slate-900 border-slate-800 text-white',
    amber:   'bg-amber-50 border-amber-100 text-amber-700',
    indigo:  'bg-indigo-50 border-indigo-100 text-indigo-700',
  };
  const subTones = {
    default: 'text-slate-400',
    green:   'text-emerald-500',
    red:     'text-rose-500',
    dark:    'text-slate-400',
    amber:   'text-amber-500',
    indigo:  'text-indigo-500',
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm flex flex-col gap-1.5 ${tones[tone]}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.18em] opacity-60">{label}</p>
      <p className="text-xl md:text-2xl font-black leading-none tracking-tight">{value}</p>
      {sub && <p className={`text-[9px] font-medium mt-0.5 ${subTones[tone]}`}>{sub}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  SECTION HEADER
// ─────────────────────────────────────────────────────────────
const SectionHead = ({ title, badge }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <span className="w-1 h-5 bg-slate-900 rounded-full" />
      <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-700">{title}</h2>
    </div>
    {badge && (
      <span className="text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
        {badge}
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  PASS-THROUGH ROW
// ─────────────────────────────────────────────────────────────
const PTRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-dashed border-slate-100 last:border-0">
    <span className="text-[10px] text-slate-400 italic">{label}</span>
    <span className="text-[10px] font-bold text-slate-400">{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  MAIN
//
//  ⚠️ FIX UTAMA: field name disesuaikan persis dengan response
//  dari controllers/financialController.js (getProjectProfitability,
//  getCashFlow, getReceivables, getMonthlyTrend).
//
//  Mapping field LAMA (salah) → BARU (sesuai controller):
//    p.revenueItems     → p.clientRevenue
//    p.revenueShipping  → p.clientShipping
//    p.revenueTax       → p.clientTax
//    p.grandTotal       → p.grandTotalBilled
//    p.cogs             → p.supplierCOGS
//    p.importDuty       → p.supplierImportDuty
//    p.supplierTax      → p.supplierTaxPassThru
//    p.cashIn           → p.cashReceived
//    cashFlow.cashIn/cashOut (per entry) → cashFlow.entries[].amount
//    trend.cashIn/cashOut → trend.revenue / trend.expense
//
//  Plus: otherExpenseTotal (biaya reimburse/meeting dari ExpenseSubmission)
//  ditambahkan sebagai breakdown baru di Expense Detail.
// ─────────────────────────────────────────────────────────────
const FinancialReport = () => {
  const navigate = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [projects,   setProjects]   = useState([]);
  const [cashFlow,   setCashFlow]   = useState(null);
  const [receivables,setReceivables]= useState(null);
  const [trend,      setTrend]      = useState([]);
  const [expanded,   setExpanded]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { headers: { Authorization: `Bearer ${token}` } };
    const load = async () => {
      try {
        const [pRes, cRes, rRes, tRes] = await Promise.allSettled([
          axios.get('http://localhost:5000/api/financial/project-report', h),
          axios.get('http://localhost:5000/api/financial/cash-flow',      h),
          axios.get('http://localhost:5000/api/financial/receivables',    h),
          axios.get('http://localhost:5000/api/financial/monthly-trend',  h),
        ]);
        if (pRes.status === 'fulfilled') setProjects(pRes.value.data   || []);
        else console.error('project-report failed:', pRes.reason?.response?.data || pRes.reason);

        if (cRes.status === 'fulfilled') setCashFlow(cRes.value.data   || null);
        else console.error('cash-flow failed:', cRes.reason?.response?.data || cRes.reason);

        if (rRes.status === 'fulfilled') setReceivables(rRes.value.data|| null);
        else console.error('receivables failed:', rRes.reason?.response?.data || rRes.reason);

        if (tRes.status === 'fulfilled') setTrend(tRes.value.data      || []);
        else console.error('monthly-trend failed:', tRes.reason?.response?.data || tRes.reason);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── Derived totals — FIELD NAME SUDAH DISESUAIKAN KE CONTROLLER ──
  const totalRevenue     = projects.reduce((s, p) => s + (p.clientRevenue      || 0), 0);
  const totalShipping    = projects.reduce((s, p) => s + (p.clientShipping     || 0), 0);
  const totalClientTax   = projects.reduce((s, p) => s + (p.clientTax          || 0), 0);
  const totalBilled      = projects.reduce((s, p) => s + (p.grandTotalBilled   || 0), 0);
  const totalCOGS        = projects.reduce((s, p) => s + (p.supplierCOGS       || 0), 0);
  const totalDuty         = projects.reduce((s, p) => s + (p.supplierImportDuty || 0), 0);
  const totalSupTax       = projects.reduce((s, p) => s + (p.supplierTaxPassThru|| 0), 0);
  const totalOtherExpense = projects.reduce((s, p) => s + (p.otherExpenseTotal  || 0), 0);
  const totalExpense      = projects.reduce((s, p) => s + (p.totalExpense       || 0), 0);
  const totalNetProfit    = projects.reduce((s, p) => s + (p.netProfit          || 0), 0);
  const totalCashIn       = projects.reduce((s, p) => s + (p.cashReceived       || 0), 0);
  const totalOutstanding  = projects.reduce((s, p) => s + (p.outstanding        || 0), 0);
  const netMargin         = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  // ── PDF ────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN', 105, 16, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 105, 23, { align: 'center' });

    autoTable(doc, {
      startY: 30,
      head: [['Item', 'Nominal']],
      body: [
        ['Revenue Bisnis (item)', rp(totalRevenue)],
        ['Total Ditagihkan ke Client', rp(totalBilled)],
        ['COGS', rp(totalCOGS)],
        ['Bea Masuk / Import Duty', rp(totalDuty)],
        ['Biaya Lain (Reimburse/Meeting/dll)', rp(totalOtherExpense)],
        ['Total Expense', rp(totalExpense)],
        ['Net Profit', rp(totalNetProfit)],
        ['Net Margin', pct(totalNetProfit, totalRevenue)],
        ['Cash Diterima', rp(totalCashIn)],
        ['Outstanding', rp(totalOutstanding)],
      ],
      theme: 'plain',
      headStyles: { fillColor: [15,23,42], textColor: 255, fontSize: 8 },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Project', 'Revenue', 'COGS', 'Bea Masuk', 'Biaya Lain', 'Net Profit', 'Margin']],
      body: projects.map(p => [
        p.projectName || p.projectId,
        rp(p.clientRevenue),
        rp(p.supplierCOGS),
        rp(p.supplierImportDuty),
        rp(p.otherExpenseTotal),
        rp(p.netProfit),
        pct(p.netProfit, p.clientRevenue),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15,23,42], textColor: 255, fontSize: 7 },
      styles: { fontSize: 8 },
    });

    doc.save(`Laporan_Keuangan_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-8 bg-slate-900 rounded-full animate-pulse"
                style={{ animationDelay: `${i*120}ms` }} />
            ))}
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
            Memuat Data Keuangan
          </p>
        </div>
      </div>
    </div>
  );

  // Monthly trend di controller pakai field: revenue, expense, netProfit
  // (bukan cashIn/cashOut — itu untuk getCashFlow, bukan getMonthlyTrend)
  const maxTrend = Math.max(...trend.map(m => Math.max(m.revenue || 0, m.expense || 0)), 1);

  return (
    <div className="min-h-screen bg-[#f8f8f7] flex flex-col font-sans">
      <Header />

      {/* ── Top Bar ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm px-6 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
        >
          <span className="text-slate-500 font-black text-base leading-none">←</span>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Laporan <span className="text-indigo-600">Keuangan</span>
          </h1>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
        >
          ↓ Export PDF
        </button>
      </div>

      <main className="flex-1 px-6 md:px-10 py-8 space-y-10 max-w-7xl mx-auto w-full">

        {/* ════════════════════════════════════════════════
            SECTION 1 — P&L SUMMARY (angka utama)
            ════════════════════════════════════════════════ */}
        <section>
          <SectionHead title="Ringkasan Laba Rugi" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* P&L Statement */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Income Statement</p>
                <p className="text-xs font-black uppercase tracking-wide text-white mt-0.5">
                  {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} — YTD
                </p>
              </div>

              <div className="px-6 py-5 space-y-0 divide-y divide-slate-50">
                {/* Revenue */}
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Revenue Bisnis</p>
                    <p className="text-[9px] text-slate-400">clientPrice — subtotal barang</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600">{rp(totalRevenue)}</p>
                </div>

                {/* COGS */}
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Cost of Goods Sold (COGS)</p>
                    <p className="text-[9px] text-slate-400">harga beli dari supplier</p>
                  </div>
                  <p className="text-sm font-black text-rose-500">({rp(totalCOGS)})</p>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between items-center py-3 bg-slate-50 -mx-6 px-6">
                  <p className="text-xs font-black text-slate-700">Gross Profit</p>
                  <p className="text-sm font-black text-slate-900">
                    {rp(totalRevenue - totalCOGS)}
                    <span className="text-[9px] text-slate-400 ml-2">
                      ({pct(totalRevenue - totalCOGS, totalRevenue)})
                    </span>
                  </p>
                </div>

                {/* Bea Masuk */}
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Bea Masuk / Import Duty</p>
                    <p className="text-[9px] text-slate-400">biaya operasional impor</p>
                  </div>
                  <p className="text-sm font-black text-amber-600">({rp(totalDuty)})</p>
                </div>

                {/* Biaya Lain — dari ExpenseSubmission */}
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Biaya Lain (Reimburse / Meeting / dll)</p>
                    <p className="text-[9px] text-slate-400">expense submission yang sudah Approved</p>
                  </div>
                  <p className="text-sm font-black text-orange-600">({rp(totalOtherExpense)})</p>
                </div>

                {/* Total Expense */}
                <div className="flex justify-between items-center py-3">
                  <p className="text-xs font-black text-slate-700">Total Expense</p>
                  <p className="text-sm font-black text-rose-600">({rp(totalExpense)})</p>
                </div>

                {/* Net Profit */}
                <div className={`flex justify-between items-center py-4 -mx-6 px-6 border-t-2 border-slate-200 mt-1 ${
                  totalNetProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
                }`}>
                  <div>
                    <p className="text-sm font-black text-slate-900">NET PROFIT</p>
                    <p className="text-[9px] text-slate-500">Revenue − COGS − Bea Masuk − Biaya Lain</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {rp(totalNetProfit)}
                    </p>
                    <p className={`text-[9px] font-black ${totalNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Margin {pct(totalNetProfit, totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: pass-throughs + cash status */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                  Pass-Through (bukan pendapatan bisnis)
                </p>
                <PTRow label="PPN Client → ke negara"      value={rp(totalClientTax)} />
                <PTRow label="Ongkir Client → ke ekspedisi" value={rp(totalShipping)} />
                <PTRow label="PPN Vendor → ke negara"       value={rp(totalSupTax)} />
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-500 font-bold">Total Ditagihkan ke Client</span>
                    <span className="text-[9px] font-black text-slate-700">{rp(totalBilled)}</span>
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1">
                    Revenue + PPN + Ongkir client
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                  Status Penerimaan
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-slate-500">Cash Diterima</span>
                      <span className="text-[9px] font-black text-emerald-600">{rp(totalCashIn)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: totalBilled > 0 ? `${Math.min((totalCashIn / totalBilled) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                    <p className="text-[8px] text-slate-400 mt-0.5">
                      {pct(totalCashIn, totalBilled)} dari total tagihan
                    </p>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-[9px] text-slate-500">Outstanding</span>
                    <span className={`text-[9px] font-black ${totalOutstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {totalOutstanding > 0 ? rp(totalOutstanding) : '✓ Lunas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            SECTION 2 — KPI CARDS
            ════════════════════════════════════════════════ */}
        <section>
          <SectionHead title="Indikator Kinerja" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI
              label="Net Profit"
              value={rp(totalNetProfit)}
              sub={`Margin ${pct(totalNetProfit, totalRevenue)}`}
              tone={totalNetProfit >= 0 ? 'green' : 'red'}
            />
            <KPI
              label="Gross Profit"
              value={rp(totalRevenue - totalCOGS)}
              sub={`Margin ${pct(totalRevenue - totalCOGS, totalRevenue)}`}
              tone="indigo"
            />
            <KPI
              label="Outstanding"
              value={rp(totalOutstanding)}
              sub={`${((receivables?.invoices?.length) || 0)} invoice belum dibayar`}
              tone={totalOutstanding > 0 ? 'amber' : 'green'}
            />
            <KPI
              label="Projects Aktif"
              value={projects.length}
              sub={`${projects.filter(p => p.netProfit > 0).length} profitable`}
              tone="dark"
            />
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            SECTION 3 — P&L PER PROJECT (table, expandable)
            ════════════════════════════════════════════════ */}
        <section>
          <SectionHead title="P&L per Project" badge={`${projects.length} projects`} />

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-3">Project</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">COGS</th>
                    <th className="px-4 py-3 text-right">Bea Masuk</th>
                    <th className="px-4 py-3 text-right">Biaya Lain</th>
                    <th className="px-4 py-3 text-right">Net Profit</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-400 italic text-sm">
                        Belum ada data project
                      </td>
                    </tr>
                  ) : projects.map(p => {
                    const isOpen = expanded === p.projectId;
                    const profit = p.netProfit || 0;
                    return (
                      <React.Fragment key={p.projectId}>
                        <tr className={`hover:bg-slate-50/60 transition-all ${isOpen ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-900 text-xs">{p.projectName || p.projectId}</p>
                            <p className="text-[8px] text-slate-400 font-mono mt-0.5">{p.projectId}</p>
                          </td>
                          <td className="px-4 py-4 text-right font-black text-emerald-600 text-xs whitespace-nowrap">
                            {rp(p.clientRevenue)}
                          </td>
                          <td className="px-4 py-4 text-right text-rose-500 font-bold text-xs whitespace-nowrap">
                            {rp(p.supplierCOGS)}
                          </td>
                          <td className="px-4 py-4 text-right text-amber-600 font-bold text-xs whitespace-nowrap">
                            {p.supplierImportDuty > 0 ? rp(p.supplierImportDuty) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-4 text-right text-orange-600 font-bold text-xs whitespace-nowrap">
                            {p.otherExpenseTotal > 0 ? rp(p.otherExpenseTotal) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className={`px-4 py-4 text-right font-black text-sm whitespace-nowrap ${profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            {rp(profit)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              profit >= 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {pct(profit, p.clientRevenue)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-xs whitespace-nowrap">
                            {p.outstanding > 0
                              ? <span className="font-black text-amber-600">{rp(p.outstanding)}</span>
                              : <span className="text-emerald-500 font-bold text-[9px]">✓ Lunas</span>
                            }
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => setExpanded(isOpen ? null : p.projectId)}
                              className="text-[9px] font-black uppercase tracking-wide text-indigo-600 hover:text-indigo-800 transition-all"
                            >
                              {isOpen ? '▲ Tutup' : '▼ Detail'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isOpen && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={9} className="px-6 py-5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                {/* Revenue breakdown */}
                                <div className="bg-white rounded-xl border border-slate-100 p-4">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-3">Revenue Detail</p>
                                  <div className="space-y-2">
                                    {[
                                      { l: 'Revenue Bisnis (item)', v: rp(p.clientRevenue), bold: true },
                                      { l: 'Ongkir Client (pass-through)', v: rp(p.clientShipping), muted: true },
                                      { l: 'PPN Client (pass-through)', v: rp(p.clientTax), muted: true },
                                      { l: 'Total Ditagihkan', v: rp(p.grandTotalBilled) },
                                    ].map(({ l, v, bold, muted }) => (
                                      <div key={l} className="flex justify-between gap-4">
                                        <span className={`text-[9px] ${muted ? 'text-slate-400 italic' : 'text-slate-600'}`}>{l}</span>
                                        <span className={`text-[9px] whitespace-nowrap ${bold ? 'font-black text-slate-900' : muted ? 'text-slate-400' : 'font-bold text-slate-700'}`}>{v}</span>
                                      </div>
                                    ))}
                                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                                      <span className="text-[9px] text-slate-500">Cash Diterima</span>
                                      <span className="text-[9px] font-black text-emerald-600">{rp(p.cashReceived)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Expense breakdown */}
                                <div className="bg-white rounded-xl border border-slate-100 p-4">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-rose-600 mb-3">Expense Detail</p>
                                  <div className="space-y-2">
                                    {[
                                      { l: 'COGS (harga beli vendor)', v: rp(p.supplierCOGS), bold: true },
                                      { l: 'Bea Masuk / Import Duty', v: rp(p.supplierImportDuty) },
                                      { l: 'Biaya Lain (Reimburse/Meeting/dll)', v: rp(p.otherExpenseTotal) },
                                      { l: 'Total Expense Bisnis', v: rp(p.totalExpense), bold: true },
                                      { l: 'PPN Vendor (pass-through)', v: rp(p.supplierTaxPassThru), muted: true },
                                    ].map(({ l, v, bold, muted }) => (
                                      <div key={l} className="flex justify-between gap-4">
                                        <span className={`text-[9px] ${muted ? 'text-slate-400 italic' : 'text-slate-600'}`}>{l}</span>
                                        <span className={`text-[9px] whitespace-nowrap ${bold ? 'font-black text-slate-900' : muted ? 'text-slate-400' : 'font-bold text-slate-700'}`}>{v}</span>
                                      </div>
                                    ))}
                                    <div className={`pt-2 border-t border-slate-100 flex justify-between rounded-lg px-2 py-1.5 ${profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                      <span className="text-[9px] font-black text-slate-700">Net Profit</span>
                                      <span className={`text-[9px] font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{rp(profit)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Other expense breakdown detail */}
                                <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-orange-500 mb-3">
                                    Detail Biaya Lain ({(p.otherExpenseBreakdown || []).length})
                                  </p>
                                  {(p.otherExpenseBreakdown || []).length === 0 ? (
                                    <p className="text-[9px] text-slate-400 italic">Tidak ada submission biaya lain</p>
                                  ) : (
                                    p.otherExpenseBreakdown.map((e, idx) => (
                                      <div key={idx} className="flex justify-between gap-4 py-1.5 border-b border-slate-50 last:border-0">
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-700">{e.category}</p>
                                          <p className="text-[8px] text-slate-400">{e.submittedBy || '-'}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-orange-600">{rp(e.amount)}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {/* Footer totals */}
                {projects.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-[9px] font-black text-white">
                      <td className="px-5 py-3">TOTAL ({projects.length} Projects)</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{rp(totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-rose-400">{rp(totalCOGS)}</td>
                      <td className="px-4 py-3 text-right text-amber-300">{rp(totalDuty)}</td>
                      <td className="px-4 py-3 text-right text-orange-300">{rp(totalOtherExpense)}</td>
                      <td className="px-4 py-3 text-right text-indigo-300">{rp(totalNetProfit)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{pct(totalNetProfit, totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-amber-300">{rp(totalOutstanding)}</td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            SECTION 4 — MONTHLY TREND
            (controller getMonthlyTrend mengembalikan: revenue, expense, netProfit
             — bukan cashIn/cashOut)
            ════════════════════════════════════════════════ */}
        {trend.length > 0 && (
          <section>
            <SectionHead title="Tren Bulanan" badge="12 bulan terakhir" />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="space-y-3">
                {trend.map((m, i) => {
                  const inPct  = Math.round((m.revenue || 0) / maxTrend * 100);
                  const outPct = Math.round((m.expense || 0) / maxTrend * 100);
                  const net    = m.netProfit || 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[8px] font-black text-slate-400 w-12 shrink-0 text-right">
                        {monthLabel(m.month)}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-10 text-[7px] text-slate-400 font-bold text-right shrink-0">REV</div>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${inPct}%` }} />
                          </div>
                          <span className="w-28 text-[8px] font-black text-emerald-600 text-right whitespace-nowrap shrink-0">
                            {rp(m.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 text-[7px] text-slate-400 font-bold text-right shrink-0">EXP</div>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${outPct}%` }} />
                          </div>
                          <span className="w-28 text-[8px] font-black text-rose-500 text-right whitespace-nowrap shrink-0">
                            {rp(m.expense)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black w-28 text-right shrink-0 whitespace-nowrap ${net >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {net >= 0 ? '+' : ''}{rp(net)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-5 mt-5 pt-4 border-t border-slate-100">
                {[
                  { dot: 'bg-emerald-400', label: 'Revenue' },
                  { dot: 'bg-rose-400',    label: 'Expense' },
                  { dot: 'bg-indigo-500',  label: 'Net Profit' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                    <span className="text-[8px] text-slate-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 5 — OUTSTANDING RECEIVABLES
            ════════════════════════════════════════════════ */}
        {receivables && receivables.invoices && receivables.invoices.length > 0 && (
          <section>
            <SectionHead
              title="Piutang Belum Dibayar"
              badge={`${receivables.invoices.length} invoice`}
            />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">
                  Total Outstanding
                </p>
                <p className="text-sm font-black text-amber-700">
                  {rp(receivables.totalOutstanding || 0)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left">Invoice #</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                      <th className="px-4 py-3 text-center">Jatuh Tempo</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {receivables.invoices.map(inv => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-5 py-3 font-mono font-black text-indigo-600 text-xs">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 text-xs">{inv.projectName}</p>
                          <p className="text-[8px] text-slate-400">{inv.projectId}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{inv.clientName}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 whitespace-nowrap">
                          {rp(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-center text-[10px] text-slate-500">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '—'}
                          {inv.isOverdue && <span className="ml-1 text-rose-500 font-black">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                            inv.isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.isOverdue ? `Overdue ${inv.overdueDays}d` : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════
            FOOTER NOTE
            ════════════════════════════════════════════════ */}
        <div className="bg-slate-100 rounded-2xl p-5 text-[9px] text-slate-500 leading-relaxed">
          <p className="font-black text-slate-600 uppercase tracking-wider mb-1">Catatan Metodologi</p>
          <p>
            <strong>Revenue Bisnis</strong> = clientPrice (subtotal item saja, tidak termasuk PPN & ongkir client).
            {' '}<strong>Pass-through</strong> = uang yang diterima dari client lalu diteruskan ke pihak ketiga (negara / ekspedisi) — tidak masuk P&L.
            {' '}<strong>Expense</strong> = COGS dari supplier + Bea Masuk + Biaya Lain (reimburse/meeting yang sudah disetujui Finance).
            {' '}<strong>Net Profit</strong> = Revenue Bisnis − COGS − Bea Masuk − Biaya Lain.
          </p>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default FinancialReport;