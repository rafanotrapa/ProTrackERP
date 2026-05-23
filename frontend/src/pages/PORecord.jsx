import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PORecord = () => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/po', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPos(res.data);
      } catch (err) {
        console.error("Gagal ambil data PO:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPOs();
  }, []);

  const filteredPOs = useMemo(() => {
    return pos.filter((po) => 
      (po.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.vendorId?.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.projectId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, pos]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
            onClick={() => navigate('/po-menu')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-sky-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              PO <span className="text-sky-600">Track Record</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Issued Orders</p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <input 
               type="text" 
               placeholder="Search PO Number, Vendor, Project..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full p-3 pl-10 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-sky-600 transition-all shadow-sm italic placeholder:text-slate-300"
             />
             <span className="absolute left-4 top-3 text-slate-300">
               <Search size={16} />
             </span>
          </div>
          <button 
            onClick={() => navigate('/create-po')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-600 shadow-xl shadow-slate-200 transition-all active:scale-95 whitespace-nowrap"
          >
            + Create New PO
          </button>
        </div>
      </div>

      <main className="flex-1 w-full px-8 md:px-12 lg:px-16 mt-8">
        <div className="mx-auto w-full max-w-7xl bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-100/50 overflow-hidden">
          
          <div className="px-8 py-8 md:px-10 border-b border-slate-50 flex justify-between items-center">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Historical Issued Purchase Orders</span>
             <span className="text-[10px] font-bold text-sky-600 uppercase bg-sky-50 px-3 py-1 rounded-full">{filteredPOs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest italic">
                <tr>
                  <th className="p-6 md:px-10 whitespace-nowrap">PO Number / Vendor</th>
                  <th className="p-6 text-center whitespace-nowrap">Linked Project</th>
                  <th className="p-6 md:px-10 text-right whitespace-nowrap">Grand Total & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-24 text-center font-black text-slate-200 text-2xl animate-pulse italic uppercase">Syncing PO History...</td>
                  </tr>
                ) : filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-24 text-center font-black text-slate-300 text-xl italic uppercase">No Purchase Orders Found.</td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="p-6 md:px-10">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 p-3 rounded-xl text-slate-400 group-hover:bg-sky-600 group-hover:text-white transition-all">
                            <ClipboardCheck size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest italic leading-none mb-1">{po.poNumber}</p>
                            <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight leading-none group-hover:text-sky-600 transition-all">
                              {po.vendorId?.vendorName || 'Unknown Vendor'}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{po.items?.length || 0} Items • {po.topOption}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-6 text-center">
                         <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase tracking-widest italic border border-sky-100">
                            {po.projectId || 'N/A'}
                         </span>
                      </td>

                      <td className="p-6 md:px-10 text-right">
                         <div className="flex flex-col items-end">
                            <span className="text-base font-black text-sky-600 tracking-tight group-hover:text-emerald-600 transition-colors">
                              {po.currency || 'IDR'} {formatRupiah(po.totalAmount)}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              Issued: <span className="text-slate-600">{formatDate(po.timestamp)}</span>
                            </span>
                         </div>
                      </td>
                    </tr>
                  ))
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

export default PORecord;