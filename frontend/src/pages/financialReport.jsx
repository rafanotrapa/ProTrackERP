import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FinancialReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/financial/project-report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };
  fetchReport();
}, []);

  // Hitung Total Keseluruhan untuk Stat Cards
  const totalRevenue = data.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);
  const totalProfit = totalRevenue - totalExpense;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />
      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
              FINANCIAL <span className="text-indigo-600">OVERVIEW</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">
              ProTrack ERP • Real-time Fiscal Analysis
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase italic">Status: </span>
            <span className="text-[10px] font-black text-emerald-500 uppercase italic ml-2 animate-pulse">● System Live</span>
          </div>
        </div>

        {/* STAT CARDS (Ala Pinterest) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-600 transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Revenue (Client)</p>
            <h2 className="text-3xl font-black italic text-slate-900">Rp {totalRevenue.toLocaleString()}</h2>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
               <span className="text-8xl italic font-black">IN</span>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-500 transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Expense (Vendor)</p>
            <h2 className="text-3xl font-black italic text-slate-900">Rp {totalExpense.toLocaleString()}</h2>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
               <span className="text-8xl italic font-black">OUT</span>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Profitability</p>
            <h2 className="text-3xl font-black italic text-emerald-400">Rp {totalProfit.toLocaleString()}</h2>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
               <span className="text-8xl italic font-black text-white">FIX</span>
            </div>
          </div>
        </div>

        {/* MAIN TABLE SECTION */}
        <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black italic uppercase text-lg tracking-tight">Project Profit & Loss</h3>
            <button className="text-[10px] font-black bg-slate-100 px-5 py-2 rounded-full uppercase tracking-widest">Download PDF</button>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                <th className="px-10 py-6">Project Name & ID</th>
                <th>Revenue (Sell)</th>
                <th>Expense (Cost)</th>
                <th>Profit</th>
                <th className="px-10 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center font-black italic text-slate-300 animate-pulse">SYNCING DATA...</td></tr>
              ) : data.length > 0 ? (
                data.map((item) => {
                  const margin = item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : 0;
                  return (
                    <tr key={item.projectId} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-10 py-8">
                        <div className="font-black text-slate-800 italic uppercase leading-none text-base">{item.projectName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-2 tracking-widest">ID: {item.projectId}</div>
                      </td>
                      <td>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Invoiced</div>
                        <div className="font-black text-emerald-600 italic">Rp {item.income.toLocaleString()}</div>
                      </td>
                      <td>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Spent</div>
                        <div className="font-black text-rose-500 italic">Rp {item.expense.toLocaleString()}</div>
                      </td>
                      <td>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Net</div>
                        <div className="font-black text-slate-900 italic text-xl">Rp {item.profit.toLocaleString()}</div>
                      </td>
                      <td className="px-10 text-right">
                        <div className={`inline-block px-5 py-2 rounded-2xl text-[11px] font-black italic ${item.profit > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {margin}%
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-32 text-center">
                    <div className="text-slate-300 font-black italic uppercase text-xl tracking-tighter">No Transaction Data Available</div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest italic">Check your Client & Supplier Invoices status</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FinancialReport;