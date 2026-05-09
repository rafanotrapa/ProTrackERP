import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, ArrowRight, Search, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ClientInvoice = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch data dari backend saat komponen dimuat
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_invoice', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Pastikan data yang masuk adalah array
        if (Array.isArray(res.data)) {
          setInvoices(res.data);
        } else {
          setInvoices([]);
        }
      } catch (err) {
        console.error("Gagal load data invoices:", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // 2. Logic Filter: Aman dari error toLowerCase dan data null
  const filteredInvoices = invoices.filter((inv) => {
    if (!inv) return false;
    const name = inv.clientName ? String(inv.clientName).toLowerCase() : "";
    const num = inv.invoiceNumber ? String(inv.invoiceNumber).toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || num.includes(search);
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Header />
      
      {/* Search & Header Section */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/30 gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="h-12 w-12 rounded-2xl border-2 border-slate-200 flex items-center justify-center font-black italic shadow-sm hover:border-indigo-600 transition-all active:scale-90"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
              Client <span className="text-indigo-600">Invoices</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic leading-none">
              Finance Module • ProTrack ERP
            </p>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Client or Invoice No..." 
            className="pl-12 pr-6 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-600 w-full md:w-80 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 uppercase font-black italic text-slate-400 animate-pulse">
            <Loader2 className="animate-spin text-indigo-600" size={32} /> 
            Fetching Data Invoices...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <div 
                  key={inv._id} 
                  className="group bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 hover:border-indigo-600 transition-all shadow-sm hover:shadow-xl"
                >
                  {/* Status & Icon Section */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="h-16 w-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-lg">
                      <FileText size={32} />
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border ${
                      String(inv?.status || '').toLowerCase() === 'unpaid' 
                        ? 'bg-amber-100 text-amber-600 border-amber-200' 
                        : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                    }`}>
                      {inv.status || 'Unpaid'}
                    </span>
                  </div>

                  {/* Detail Section */}
                  <div className="space-y-1 mb-8">
                    <p className="text-[11px] font-black text-indigo-600 uppercase italic tracking-widest">
                      {inv.invoiceNumber || 'NO-REF'}
                    </p>
                    <h2 className="text-2xl font-black uppercase italic leading-tight text-slate-900 truncate">
                      {inv.clientName || 'Unknown Client'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase truncate italic">
                      {inv.projectName || '-'}
                    </p>
                  </div>

                  {/* Pricing Section */}
                  <div className="py-6 border-y border-dashed border-slate-200 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1 tracking-widest">
                      Total Amount Receivable
                    </p>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter">
                      Rp {Number(inv.amount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Action Buttons Section */}
                  <div className="flex gap-4">
                    {/* Link PDF: Gue sesuaikan jalurnya ke uploads/documents/ */}
                    <a 
                      href={`http://localhost:5000/uploads/documents/${inv.file}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex-1 bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 transition-all"
                    >
                      <Download size={18} /> 
                      <span className="text-[10px] font-black uppercase italic text-slate-600">PDF</span>
                    </a>

                    {/* Button Process: HANYA MUNCUL KALO STATUS BUKAN PAID */}
                    {String(inv?.status || '').toLowerCase() !== 'paid' && (
                      <button 
                        onClick={() => navigate(`/client-payment/${inv._id}`)} 
                        className="flex-1 bg-slate-900 hover:bg-indigo-600 p-4 rounded-2xl flex items-center justify-center gap-2 text-white shadow-xl active:scale-95 transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase italic">Process</span> 
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 font-black italic uppercase tracking-widest">
                No invoices found
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ClientInvoice;