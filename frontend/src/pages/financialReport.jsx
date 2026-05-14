import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import { Download, TrendingUp, DollarSign, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FinancialReport = () => {
  const [data, setData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [receivables, setReceivables] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profitloss');
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 1. Profit & Loss per Project
        const plRes = await axios.get('http://localhost:5000/api/financial/project-report', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(plRes.data || []);
        
        // 2. Cash Flow (Payments)
        const paymentsRes = await axios.get('http://localhost:5000/api/payments/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const verifiedPayments = (paymentsRes.data || []).filter(p => p.status === 'Verified');
        const totalCashIn = verifiedPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        
        setCashFlowData({
          cashIn: totalCashIn,
          cashOut: 0,
          balance: totalCashIn,
          recentPayments: verifiedPayments.slice(0, 5)
        });
        
        // 3. Accounts Receivable (Unpaid Invoices)
        const invoicesRes = await axios.get('http://localhost:5000/api/client_invoice', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unpaidInvoices = (invoicesRes.data || []).filter(inv => inv.status === 'Unpaid');
        setReceivables(unpaidInvoices);
        
        // 4. Monthly Trend
        const allInvoices = invoicesRes.data || [];
        const monthlyMap = new Map();
        allInvoices.forEach(inv => {
          if (!inv.createdAt) return;
          const date = new Date(inv.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { month: monthKey, revenue: 0, count: 0 });
          }
          const monthData = monthlyMap.get(monthKey);
          monthData.revenue += inv.amount || 0;
          monthData.count += 1;
        });
        setMonthlyTrend(Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6));
        
      } catch (err) {
        console.error("Error fetching financial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const totalRevenue = data.reduce((acc, curr) => acc + (curr.income || 0), 0);
  const totalExpense = data.reduce((acc, curr) => acc + (curr.expense || 0), 0);
  const totalProfit = totalRevenue - totalExpense;
  const totalReceivables = receivables.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("FINANCIAL REPORT", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text("SUMMARY", 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Revenue: Rp ${totalRevenue.toLocaleString()}`, 14, 55);
    doc.text(`Total Expense: Rp ${totalExpense.toLocaleString()}`, 14, 62);
    doc.text(`Net Profit: Rp ${totalProfit.toLocaleString()}`, 14, 69);
    doc.text(`Outstanding Receivables: Rp ${totalReceivables.toLocaleString()}`, 14, 76);
    
    const tableRows = data.map(item => [
      item.projectId || '-',
      `Rp ${(item.income || 0).toLocaleString()}`,
      `Rp ${(item.expense || 0).toLocaleString()}`,
      `Rp ${(item.profit || 0).toLocaleString()}`,
      `${item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : 0}%`
    ]);
    
    autoTable(doc, {
      startY: 95,
      head: [['Project ID', 'Revenue', 'Expense', 'Profit', 'Margin']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });
    
    doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatRupiah = (value) => {
    if (!value || value === 0) return '0';
    return value.toLocaleString();
  };

  const getMonthName = (monthKey) => {
    if (!monthKey) return '-';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-slate-400 text-[10px] italic">LOADING FINANCIAL DATA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <div className="w-full border-b border-slate-100 px-6 md:px-10 py-6 bg-white flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Financial <span className="text-indigo-600">Dashboard</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 italic">Real-time Fiscal Analysis</p>
        </div>
        <button 
          onClick={generatePDF}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      <main className="flex-1 p-6 md:p-10">
        
        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200">
          {[
            { id: 'profitloss', label: 'P&L per Project', icon: DollarSign },
            { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
            { id: 'receivables', label: 'Receivables', icon: Clock },
            { id: 'trend', label: 'Monthly Trend', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PROFIT & LOSS */}
        {activeTab === 'profitloss' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                <p className="text-xl md:text-2xl font-black text-emerald-600">Rp {formatRupiah(totalRevenue)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expense</p>
                <p className="text-xl md:text-2xl font-black text-rose-500">Rp {formatRupiah(totalExpense)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Profit</p>
                <p className={`text-xl md:text-2xl font-black ${totalProfit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                  Rp {formatRupiah(totalProfit)}
                </p>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl shadow-sm">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Margin</p>
                <p className="text-xl md:text-2xl font-black text-emerald-400">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-black text-sm uppercase tracking-wider">Project Profit & Loss</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-4">Project</th>
                      <th className="px-4 py-4 text-right">Revenue</th>
                      <th className="px-4 py-4 text-right">Expense</th>
                      <th className="px-4 py-4 text-right">Profit</th>
                      <th className="px-4 py-4 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center text-slate-400 text-sm italic">No data available</td>
                      </tr>
                    ) : (
                      data.map((item) => {
                        const margin = item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : 0;
                        return (
                          <Fragment key={item.projectId}>
                            <tr 
                              className="hover:bg-slate-50/50 transition-all cursor-pointer"
                              onClick={() => setExpandedProject(expandedProject === item.projectId ? null : item.projectId)}
                            >
                              <td className="px-4 py-4">
                                <p className="font-black text-slate-800 text-sm">{item.projectName || item.projectId}</p>
                                <p className="text-[8px] text-slate-400 font-mono mt-0.5">{item.projectId}</p>
                              </td>
                              <td className="px-4 py-4 text-right font-black text-emerald-600">Rp {formatRupiah(item.income)}</td>
                              <td className="px-4 py-4 text-right font-black text-rose-500">Rp {formatRupiah(item.expense)}</td>
                              <td className="px-4 py-4 text-right font-black text-slate-800">Rp {formatRupiah(item.profit)}</td>
                              <td className="px-4 py-4 text-right">
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black ${item.profit > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                  {margin}%
                                </span>
                               </td>
                             </tr>
                            {expandedProject === item.projectId && (
                              <tr className="bg-slate-50/30">
                                <td colSpan="5" className="px-4 py-4">
                                  <p className="text-[9px] font-black text-slate-500 mb-2">Item Details</p>
                                  <p className="text-[8px] text-slate-400 italic">No item breakdown available</p>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: CASH FLOW */}
        {activeTab === 'cashflow' && cashFlowData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-wider mb-4">Cash Flow Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <p className="text-[8px] font-black text-emerald-600 uppercase">Cash In</p>
                    <p className="text-lg font-black text-emerald-600">Rp {formatRupiah(cashFlowData.cashIn)}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-900 rounded-xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Balance</p>
                    <p className="text-lg font-black text-emerald-400">Rp {formatRupiah(cashFlowData.balance)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-black text-sm uppercase tracking-wider">Recent Payments</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {cashFlowData.recentPayments.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm italic">No recent payments</div>
                  ) : (
                    cashFlowData.recentPayments.map((payment, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-black text-sm">{payment.invoiceId?.invoiceNumber || 'N/A'}</p>
                          <p className="text-[8px] text-slate-400">{payment.invoiceId?.clientName || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600">Rp {formatRupiah(payment.amountPaid)}</p>
                          <p className="text-[8px] text-slate-400">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-wider mb-4">Insights</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Net Cash Position</p>
                  <p className={`text-xl font-black ${cashFlowData.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {cashFlowData.balance >= 0 ? 'Positive' : 'Negative'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Recommendation</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {cashFlowData.balance < 0 ? '⚠️ Review payables and accelerate collections.' : '✅ Healthy cash position.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNTS RECEIVABLE */}
        {activeTab === 'receivables' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Outstanding Receivables</h3>
                <p className="text-[8px] text-slate-400 mt-1">Unpaid client invoices</p>
              </div>
              <div className="bg-amber-50 px-4 py-2 rounded-xl">
                <p className="text-[8px] font-black text-amber-600 uppercase">Total Outstanding</p>
                <p className="text-lg font-black text-amber-600">Rp {formatRupiah(totalReceivables)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-4">Invoice #</th>
                    <th className="px-4 py-4">Project</th>
                    <th className="px-4 py-4">Client</th>
                    <th className="px-4 py-4 text-right">Amount</th>
                    <th className="px-4 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {receivables.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-slate-400 text-sm italic">No outstanding receivables</td>
                    </tr>
                  ) : (
                    receivables.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-4 font-black text-indigo-600 text-sm">{inv.invoiceNumber}</td>
                        <td className="px-4 py-4 font-bold text-slate-800 text-sm">{inv.projectName}</td>
                        <td className="px-4 py-4 text-slate-600 text-sm">{inv.clientName}</td>
                        <td className="px-4 py-4 text-right font-black text-emerald-600">Rp {formatRupiah(inv.amount)}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-full text-[8px] font-black bg-amber-100 text-amber-600">PENDING</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MONTHLY TREND */}
        {activeTab === 'trend' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-wider mb-4">Revenue Trend (Last 6 Months)</h3>
              <div className="space-y-3">
                {monthlyTrend.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm italic py-8">No data available</p>
                ) : (
                  monthlyTrend.map((month, idx) => {
                    const maxRevenue = Math.max(...monthlyTrend.map(m => m.revenue), 1);
                    const barHeight = (month.revenue / maxRevenue) * 100;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-20 text-[8px] font-black text-slate-500">{getMonthName(month.month)}</div>
                        <div className="flex-1 h-8 bg-slate-100 rounded-xl overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-end px-2 text-white text-[8px] font-black"
                            style={{ width: `${barHeight}%` }}
                          >
                            {barHeight > 20 && `Rp ${formatRupiah(month.revenue)}`}
                          </div>
                        </div>
                        {barHeight <= 20 && (
                          <div className="text-[8px] font-black text-indigo-600 w-28 text-right">Rp {formatRupiah(month.revenue)}</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-wider mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[8px] font-black text-slate-500">Avg Revenue/Project</span>
                    <span className="font-black text-slate-800">Rp {formatRupiah(totalRevenue / (data.length || 1))}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[8px] font-black text-slate-500">Gross Margin</span>
                    <span className="font-black text-emerald-600">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[8px] font-black text-slate-500">Collection Rate</span>
                    <span className="font-black text-blue-600">{totalRevenue > 0 ? (((totalRevenue - totalReceivables) / totalRevenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('receivables')}
                    className="w-full text-left p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all"
                  >
                    <p className="font-black text-amber-800 text-xs uppercase">View Outstanding Payments</p>
                    <p className="text-[8px] text-amber-600 mt-1">Rp {formatRupiah(totalReceivables)} needs collection</p>
                  </button>
                  <button 
                    onClick={generatePDF}
                    className="w-full text-left p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"
                  >
                    <p className="font-black text-indigo-800 text-xs uppercase">Export Full Report</p>
                    <p className="text-[8px] text-indigo-600 mt-1">Download as PDF</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FinancialReport;