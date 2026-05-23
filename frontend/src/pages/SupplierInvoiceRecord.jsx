import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierInvoiceRecord = () => {
  const [historicalInvoices, setHistoricalInvoices] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/supplier_invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistoricalInvoices(res.data);
      } catch (err) {
        console.error("Gagal ambil data invoice:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return historicalInvoices.filter((inv) => 
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, historicalInvoices]);

  const formatRupiah = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('id-ID');
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900 pb-16">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/supplier-invoice-menu')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Invoice <span className="text-indigo-600">Track Record</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Billing History</p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <input 
               type="text" 
               placeholder="Search Invoice, Vendor, PO..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full p-3 pl-10 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm italic placeholder:text-slate-300"
             />
             <span className="absolute left-4 top-3 text-slate-300">
               <Search size={16} />
             </span>
          </div>
          <button 
            onClick={() => navigate('/upload-to-finance')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-slate-200 transition-all active:scale-95 whitespace-nowrap"
          >
            + New Invoice
          </button>
        </div>
      </div>

      <main className="flex-1 w-full px-8 md:px-12 lg:px-16 mt-8">
        <div className="mx-auto w-full max-w-7xl bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-100/50 overflow-hidden">
          
          <div className="px-8 py-8 md:px-10 border-b border-slate-50 flex justify-between items-center">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Historical Submitted Invoices</span>
             <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">{filteredInvoices.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest italic">
                <tr>
                  <th className="p-6 md:px-8">Invoice / PO Reference</th>
                  <th className="p-6 md:px-8 text-center">Termin & Date</th>
                  <th className="p-6 md:px-8 text-center">Status</th>
                  <th className="p-6 md:px-8 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHistory ? (
                  <tr><td colSpan="4" className="py-16 text-center font-black text-slate-200 text-xl uppercase italic animate-pulse">Loading Records...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan="4" className="py-16 text-center font-black text-slate-300 text-xl uppercase italic">No Invoice Records Found</td></tr>
                ) : (
                  filteredInvoices.map(inv => {
                     const invGrandTotal = (inv.amount || 0) + (inv.taxAmount || 0) + (inv.importDutyAmount || 0);
                     const currentStatus = inv.status || 'Pending Verification';
                     
                     return (
                       <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="p-6 md:px-8">
                           <div className="flex items-center gap-4">
                             <div className="bg-slate-100 p-3 rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                               <FileText size={20} />
                             </div>
                             <div>
                               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic mb-1">{inv.invoiceNumber}</p>
                               <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">
                                 {inv.vendorName}
                               </h3>
                               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">PO: {inv.poNumber} (Proj: {inv.projectId})</p>
                             </div>
                           </div>
                         </td>
                         <td className="p-6 md:px-8 text-center">
                            <p className="text-xs font-black text-slate-700 uppercase italic">{inv.terminName}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                         </td>
                         <td className="p-6 md:px-8 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic inline-flex items-center gap-1.5 ${
                              currentStatus.includes('Paid') || currentStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                              currentStatus.includes('Reject') ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {currentStatus}
                            </span>
                         </td>
                         <td className="p-6 md:px-8 text-right">
                            <p className="text-base font-black text-emerald-600 tracking-tight">{inv.currency} {formatRupiah(invGrandTotal)}</p>
                         </td>
                       </tr>
                     )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupplierInvoiceRecord;