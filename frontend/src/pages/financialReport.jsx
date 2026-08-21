import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

import Header from '../components/Header';
import Footer from '../components/Footer';
import StyledSelect from '../components/StyledSelect';

import { useLang } from '../i18n';
const rp  = (v) => `Rp ${(Number(v) || 0).toLocaleString('id-ID')}`;
const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—';
const monthLabel = (k) => {
  if (!k) return '—';
  const [y, m] = k.split('-');
  return new Date(+y, +m - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
};

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
      <p className="text-2xs font-black uppercase tracking-[0.18em] opacity-60">{label}</p>
      <p className="text-xl md:text-2xl font-black leading-none tracking-tight">{value}</p>
      {sub && <p className={`text-xs font-medium mt-0.5 ${subTones[tone]}`}>{sub}</p>}
    </div>
  );
};

const SectionHead = ({ title, badge }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <span className="w-1 h-5 bg-slate-900 rounded-full" />
      <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-700">{title}</h2>
    </div>
    {badge && (
      <span className="text-2xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
        {badge}
      </span>
    )}
  </div>
);

const FinancialReport = () => {
  const { t } = useLang();
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

  // Ringkasan sebelumnya mencetak bulan berjalan di kepalanya, padahal angkanya
  // dijumlahkan dari seluruh project tanpa filter bulan — labelnya menyesatkan
  // dan tidak bisa diganti. Sekarang periodenya benar-benar dipilih, dan angkanya
  // ikut periode itu.
  const [periode, setPeriode] = useState('all');

  const bulanTersedia = [...trend].sort((a, b) => b.month.localeCompare(a.month));
  const bulanTerpilih = periode === 'all' ? null : trend.find((m) => m.month === periode);

  // Nilai pass-through (ongkir client, PPN client, PPN vendor) tidak lagi
  // dijumlahkan di sini — tabelnya sudah dicabut dari halaman.
  const totalRevenue      = projects.reduce((s, p) => s + (p.clientRevenue      || 0), 0);
  const totalBilled       = projects.reduce((s, p) => s + (p.grandTotalBilled   || 0), 0);
  const totalCOGS         = projects.reduce((s, p) => s + (p.supplierCOGS       || 0), 0);
  const totalDuty         = projects.reduce((s, p) => s + (p.supplierImportDuty || 0), 0);
  const totalOtherExpense = projects.reduce((s, p) => s + (p.otherExpenseTotal  || 0), 0);
  const totalExpense      = projects.reduce((s, p) => s + (p.totalExpense       || 0), 0);
  const totalNetProfit    = projects.reduce((s, p) => s + (p.netProfit          || 0), 0);
  const totalCashIn       = projects.reduce((s, p) => s + (p.cashReceived       || 0), 0);
  const totalOutstanding  = projects.reduce((s, p) => s + (p.outstanding        || 0), 0);

  // Angka yang tampil di kartu ringkasan. Saat satu bulan dipilih, sumbernya
  // data bulanan dari getMonthlyTrend — rinciannya sudah memuat field yang sama
  // persis, jadi tidak perlu endpoint tambahan.
  const ringkas = bulanTerpilih
    ? {
        revenue:      bulanTerpilih.revenue      || 0,
        cogs:         bulanTerpilih.cogs         || 0,
        duty:         bulanTerpilih.importDuty   || 0,
        otherExpense: bulanTerpilih.otherExpense || 0,
        expense:      bulanTerpilih.expense      || 0,
        netProfit:    bulanTerpilih.netProfit    || 0,
      }
    : {
        revenue:      totalRevenue,
        cogs:         totalCOGS,
        duty:         totalDuty,
        otherExpense: totalOtherExpense,
        expense:      totalExpense,
        netProfit:    totalNetProfit,
      };

  const labelPeriode = periode === 'all' ? 'Seluruh Periode' : monthLabel(periode);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('PROJECT FINANCIAL SUMMARY', 105, 16, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${labelPeriode}`, 105, 23, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 105, 29, { align: 'center' });

    // Ringkasan mengikuti periode yang dipilih di layar. Cash Diterima dan
    // Outstanding hanya ikut saat seluruh periode ditampilkan — keduanya posisi
    // kumulatif, bukan angka bulanan, jadi menyandingkannya dengan angka satu
    // bulan akan menyesatkan.
    const barisRingkas = [
      ['Revenue Bisnis', rp(ringkas.revenue)],
      ['COGS', rp(ringkas.cogs)],
      ['Bea Masuk / Import Duty', rp(ringkas.duty)],
      ['Biaya Lain (Reimburse/Meeting/dll)', rp(ringkas.otherExpense)],
      ['Total Expense', rp(ringkas.expense)],
      ['Net Profit', rp(ringkas.netProfit)],
      ['Net Margin', pct(ringkas.netProfit, ringkas.revenue)],
    ];
    if (periode === 'all') {
      barisRingkas.splice(1, 0, ['Total Ditagihkan ke Client', rp(totalBilled)]);
      barisRingkas.push(['Cash Diterima', rp(totalCashIn)], ['Outstanding', rp(totalOutstanding)]);
    }

    autoTable(doc, {
      startY: 36,
      head: [['Item', 'Nominal']],
      body: barisRingkas,
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

    doc.save(`Project_Financial_Summary_${new Date().toISOString().slice(0,10)}.pdf`);
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
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
            Memuat Data Keuangan
          </p>
        </div>
      </div>
    </div>
  );

  const maxTrend = Math.max(...trend.map(m => Math.max(m.revenue || 0, m.expense || 0)), 1);

  return (
    <div className="min-h-screen bg-[#f8f8f7] flex flex-col font-sans">
      <Header />

      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm px-6 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
        >
          <span className="text-slate-500 font-black text-base leading-none">←</span>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Project Financial <span className="text-indigo-600">Summary</span>
          </h1>
          <p className="text-2xs font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
        >
          ↓ Export PDF
        </button>
      </div>

      <main className="flex-1 px-6 md:px-10 py-8 space-y-10 w-full">

        <section>
          <SectionHead title={t('sec.revenueCost')} />

          {/* Dulu tiga kolom, dengan Pass-Through dan Status Penerimaan di kolom
              ketiga. Keduanya dicabut atas permintaan pembimbing, jadi ringkasan
              ini melebar penuh alih-alih menyisakan kolom kosong. */}
          <div className="grid grid-cols-1 gap-6">

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4">
                <div>
                  <p className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400">{t('page.revenueCostAmp')}</p>
                  <p className="text-xs font-black uppercase tracking-wide text-white mt-0.5">{labelPeriode}</p>
                </div>

                {/* Memakai StyledSelect yang sama dengan modul lain agar
                    tampilannya seragam; hanya warnanya digelapkan supaya cocok
                    di kepala kartu. Hanya bulan yang benar-benar punya data yang
                    bisa dipilih, supaya tidak ada periode kosong. */}
                <div className="w-44 shrink-0">
                  <StyledSelect
                    name="periode"
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    searchable={false}
                    options={[
                      { value: 'all', label: 'Seluruh Periode' },
                      ...bulanTersedia.map((m) => ({ value: m.month, label: monthLabel(m.month) })),
                    ]}
                    triggerClassName="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-black uppercase tracking-widest text-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-5 space-y-0 divide-y divide-slate-50">
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Revenue Bisnis</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600">{rp(ringkas.revenue)}</p>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Cost of Goods Sold (COGS)</p>
                  </div>
                  <p className="text-sm font-black text-rose-500">({rp(ringkas.cogs)})</p>
                </div>

                <div className="flex justify-between items-center py-3 bg-slate-50 -mx-6 px-6">
                  <p className="text-xs font-black text-slate-700">Gross Profit</p>
                  <p className="text-sm font-black text-slate-900">
                    {rp(ringkas.revenue - ringkas.cogs)}
                    <span className="text-xs text-slate-400 ml-2">
                      ({pct(ringkas.revenue - ringkas.cogs, ringkas.revenue)})
                    </span>
                  </p>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Bea Masuk / Import Duty</p>
                  </div>
                  <p className="text-sm font-black text-amber-600">({rp(ringkas.duty)})</p>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">{t('page.otherCostLong')}</p>
                  </div>
                  <p className="text-sm font-black text-orange-600">({rp(ringkas.otherExpense)})</p>
                </div>

                <div className="flex justify-between items-center py-3">
                  <p className="text-xs font-black text-slate-700">{t('page.totalExpense')}</p>
                  <p className="text-sm font-black text-rose-600">({rp(ringkas.expense)})</p>
                </div>

                <div className={`flex justify-between items-center py-4 -mx-6 px-6 border-t-2 border-slate-200 mt-1 ${
                  ringkas.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
                }`}>
                  <div>
                    <p className="text-sm font-black text-slate-900">NET PROFIT</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${ringkas.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {rp(ringkas.netProfit)}
                    </p>
                    <p className={`text-xs font-black ${ringkas.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Margin {pct(ringkas.netProfit, ringkas.revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

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
              sub={`${((receivables?.invoices?.length) || 0)} ${t('fin.unpaidInvoices')}`}
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

        <section>
          <SectionHead title={t('sec.marginDetail')} badge={`${projects.length} projects`} />

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-2xs font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-3">Project</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">COGS</th>
                    <th className="px-4 py-3 text-right">Bea Masuk</th>
                    <th className="px-4 py-3 text-right">{t('page.otherCostShort')}</th>
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
                        {t('empty.projectData')}
                      </td>
                    </tr>
                  ) : projects.map(p => {
                    const isOpen = expanded === p.projectId;
                    // Selama tagihan supplier belum masuk, COGS aktual masih 0 dan project
                    // akan tampak bermargin 100%. Pakai estimasi dari supplier quotation
                    // dan tandai jelas supaya tidak dibaca sebagai laba riil.
                    const isEstimated = !p.hasActualCOGS && (p.estimatedCOGS || 0) > 0;
                    const shownCOGS   = isEstimated ? p.estimatedCOGS   : p.supplierCOGS;
                    const profit      = isEstimated ? p.estimatedNetProfit : (p.netProfit || 0);
                    return (
                      <React.Fragment key={p.projectId}>
                        <tr className={`hover:bg-slate-50/60 transition-all ${isOpen ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-900 text-xs">{p.projectName || p.projectId}</p>
                            {/* Kode project selalu tampil kapital; sebagian
                                tersimpan huruf kecil di database. */}
                            <p className="text-2xs text-slate-400 font-mono mt-0.5 uppercase">{p.projectId}</p>
                          </td>
                          <td className="px-4 py-4 text-right font-black text-emerald-600 text-xs whitespace-nowrap">
                            {rp(p.clientRevenue)}
                          </td>
                          <td className="px-4 py-4 text-right text-rose-500 font-bold text-xs whitespace-nowrap">
                            {rp(shownCOGS)}
                            {isEstimated && (
                              <span className="ml-1.5 text-2xs font-black uppercase tracking-wider text-amber-600" title="Tagihan supplier belum masuk — angka dari supplier quotation">
                                est.
                              </span>
                            )}
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
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
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
                              : <span className="text-emerald-500 font-bold text-xs">✓ Lunas</span>
                            }
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => setExpanded(isOpen ? null : p.projectId)}
                              className="text-xs font-black uppercase tracking-wide text-indigo-600 hover:text-indigo-800 transition-all"
                            >
                              {isOpen ? '▲ Tutup' : '▼ Detail'}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={9} className="px-6 py-5">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                <div className="bg-white rounded-xl border border-slate-100 p-4">
                                  <p className="text-2xs font-black uppercase tracking-widest text-emerald-600 mb-3">Revenue Detail</p>
                                  <div className="space-y-2">
                                    {[
                                      { l: 'Revenue Bisnis', v: rp(p.clientRevenue), bold: true },
                                      { l: 'Total Ditagihkan', v: rp(p.grandTotalBilled) },
                                    ].map(({ l, v, bold, muted }) => (
                                      <div key={l} className="flex justify-between gap-4">
                                        <span className={`text-xs ${muted ? 'text-slate-400 italic' : 'text-slate-600'}`}>{l}</span>
                                        <span className={`text-xs whitespace-nowrap ${bold ? 'font-black text-slate-900' : muted ? 'text-slate-400' : 'font-bold text-slate-700'}`}>{v}</span>
                                      </div>
                                    ))}
                                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                                      <span className="text-xs text-slate-500">{t('page.cashReceived')}</span>
                                      <span className="text-xs font-black text-emerald-600">{rp(p.cashReceived)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-100 p-4">
                                  <p className="text-2xs font-black uppercase tracking-widest text-rose-600 mb-3">Expense Detail</p>
                                  <div className="space-y-2">
                                    {[
                                      { l: 'COGS (harga beli vendor)', v: rp(p.supplierCOGS), bold: true },
                                      { l: 'Bea Masuk / Import Duty', v: rp(p.supplierImportDuty) },
                                      { l: 'Biaya Lain (Reimburse/Meeting/dll)', v: rp(p.otherExpenseTotal) },
                                      { l: 'Total Expense Bisnis', v: rp(p.totalExpense), bold: true },
                                    ].map(({ l, v, bold, muted }) => (
                                      <div key={l} className="flex justify-between gap-4">
                                        <span className={`text-xs ${muted ? 'text-slate-400 italic' : 'text-slate-600'}`}>{l}</span>
                                        <span className={`text-xs whitespace-nowrap ${bold ? 'font-black text-slate-900' : muted ? 'text-slate-400' : 'font-bold text-slate-700'}`}>{v}</span>
                                      </div>
                                    ))}
                                    <div className={`pt-2 border-t border-slate-100 flex justify-between rounded-lg px-2 py-1.5 ${profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                      <span className="text-xs font-black text-slate-700">Net Profit</span>
                                      <span className={`text-xs font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{rp(profit)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3 max-h-64 overflow-y-auto">
                                  <p className="text-2xs font-black uppercase tracking-widest text-orange-500 mb-3">
                                    Detail Biaya Lain ({(p.otherExpenseBreakdown || []).length} submission)
                                  </p>
                                  {(p.otherExpenseBreakdown || []).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">{t('empty.otherExpense')}</p>
                                  ) : (
                                    p.otherExpenseBreakdown.map((sub, idx) => (
                                      <div key={idx} className="pb-2 border-b border-slate-50 last:border-0">
                                        <div className="flex justify-between gap-4 mb-1">
                                          <p className="text-2xs font-black text-slate-400 uppercase">{sub.submissionId}</p>
                                          <span className="text-xs font-black text-orange-600">{rp(sub.amount)}</span>
                                        </div>
                                        {(sub.items || []).map((it, i2) => (
                                          <div key={i2} className="flex justify-between gap-4 pl-2">
                                            <span className="text-xs text-slate-600">• {it.name}</span>
                                            <span className="text-xs font-bold text-slate-500">{rp(it.amount)}</span>
                                          </div>
                                        ))}
                                        <p className="text-2xs text-slate-400 pl-2 mt-0.5">{sub.submittedBy || '-'}</p>
                                      </div>
                                    ))
                                  )}
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                                  <p className="text-2xs font-black uppercase tracking-widest text-indigo-500 mb-3">
                                    Estimasi vs Aktual
                                  </p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-xs text-slate-500">Estimasi COGS (SQ)</span>
                                      <span className="text-xs font-bold text-slate-600">{rp(p.estimatedCOGS)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-xs text-slate-500">Aktual COGS (SI Paid)</span>
                                      <span className="text-xs font-black text-rose-600">{rp(p.supplierCOGS)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4 pt-2 border-t border-slate-100">
                                      <span className="text-xs font-bold text-slate-600">Selisih</span>
                                      <span className={`text-xs font-black ${
                                        (p.supplierCOGS - p.estimatedCOGS) > 0 ? 'text-rose-600' : 'text-emerald-600'
                                      }`}>
                                        {(p.supplierCOGS - p.estimatedCOGS) > 0 ? '+' : ''}{rp(p.supplierCOGS - p.estimatedCOGS)}
                                      </span>
                                    </div>
                                    <p className="text-2xs text-slate-400 italic pt-1">
                                      Bea cukai & PPN vendor belum terhitung di estimasi — baru diketahui saat Supplier Invoice masuk.
                                    </p>
                                    <div className="pt-2 border-t border-slate-100">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-xs text-slate-500">Est. Net Profit</span>
                                        <span className="text-xs font-bold text-slate-600">{rp(p.estimatedNetProfit)}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-xs text-slate-500">Est. Margin</span>
                                        <span className="text-xs font-bold text-slate-600">{(p.estimatedMargin ?? 0).toFixed(1)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {projects.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-xs font-black text-white">
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

        {trend.length > 0 && (
          <section>
            <SectionHead title="Tren Bulanan" badge="12 bulan terakhir" />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex gap-3">
                {/* Sumbu nilai. Hanya tiga tingkat supaya tidak merebut perhatian
                    dari batangnya. */}
                <div className="flex flex-col justify-between h-56 shrink-0 py-0.5">
                  {[1, 0.5, 0].map((f) => (
                    <span key={f} className="text-2xs font-bold text-slate-400 whitespace-nowrap leading-none">
                      {rp(maxTrend * f)}
                    </span>
                  ))}
                </div>

                <div className="flex-1 min-w-0 overflow-x-auto">
                  <div className="relative h-56" style={{ minWidth: `${trend.length * 44}px` }}>
                    {/* Garis bantu di belakang batang, sengaja tipis dan pucat. */}
                    {[0, 0.5, 1].map((f) => (
                      <div
                        key={f}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ top: `${f * 100}%` }}
                      />
                    ))}

                    <div className="absolute inset-0 flex items-end justify-between gap-1">
                      {trend.map((m, i) => {
                        const tinggiRev = maxTrend > 0 ? ((m.revenue || 0) / maxTrend) * 100 : 0;
                        const tinggiExp = maxTrend > 0 ? ((m.expense || 0) / maxTrend) * 100 : 0;
                        const net = m.netProfit || 0;
                        const judul =
                          `${monthLabel(m.month)}\n` +
                          `Revenue: ${rp(m.revenue)}\n` +
                          `Expense: ${rp(m.expense)}\n` +
                          `Net Profit: ${net >= 0 ? '+' : ''}${rp(net)}`;
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end h-full group" title={judul}>
                            {/* Jarak 2px antar batang bersebelahan supaya keduanya
                                tetap terbaca sebagai dua nilai terpisah. */}
                            <div className="flex items-end justify-center gap-0.5 h-full">
                              <div
                                className="w-2.5 rounded-t bg-[#2a78d6] transition-all group-hover:opacity-80"
                                style={{ height: `${tinggiRev}%` }}
                              />
                              <div
                                className="w-2.5 rounded-t bg-[#eb6834] transition-all group-hover:opacity-80"
                                style={{ height: `${tinggiExp}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between gap-1 border-t border-slate-200 pt-2" style={{ minWidth: `${trend.length * 44}px` }}>
                    {trend.map((m, i) => (
                      <span key={i} className="flex-1 text-2xs font-black text-slate-400 text-center whitespace-nowrap">
                        {monthLabel(m.month)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-5 mt-5 pt-4 border-t border-slate-100">
                {[
                  { warna: '#2a78d6', label: 'Revenue' },
                  { warna: '#eb6834', label: 'Expense' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.warna }} />
                    <span className="text-2xs text-slate-500 font-bold">{l.label}</span>
                  </div>
                ))}
                <span className="text-2xs text-slate-400 ml-auto">
                  {t('hint.hoverBar')}
                </span>
              </div>
            </div>
          </section>
        )}

        {receivables && receivables.invoices && receivables.invoices.length > 0 && (
          <section>
            <SectionHead
              title="Piutang Belum Dibayar"
              badge={`${receivables.invoices.length} invoice`}
            />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                <p className="text-xs font-black text-amber-700 uppercase tracking-wider">
                  {t('page.totalOutstanding')}
                </p>
                <p className="text-sm font-black text-amber-700">
                  {rp(receivables.totalOutstanding || 0)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-2xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
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
                          <p className="text-2xs text-slate-400">{inv.projectId}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{inv.clientName}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 whitespace-nowrap">
                          {rp(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '—'}
                          {inv.isOverdue && <span className="ml-1 text-rose-500 font-black">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-2xs font-black px-2 py-0.5 rounded-full ${
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

      </main>
      <Footer />
    </div>
  );
};

export default FinancialReport;