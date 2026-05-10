import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    { label: 'ALL MODULES', value: 'ALL' },
    { label: 'ACCOUNTS', value: 'ACCOUNT' },
    { label: 'MARKETING', value: 'MARKETING' },
    { label: 'PROCUREMENT', value: 'PROCUREMENT' },
    { label: 'FINANCE', value: 'FINANCE' }
  ];

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Gagal tarik logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(log => log.category === filter);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-slate-900 pb-16">
      
      {/* HEADER KONSISTEN */}
      <header className="w-full px-8 py-8 md:px-12 lg:px-16 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex justify-center items-center w-12 h-12 bg-white rounded-2xl border transition-all active:scale-90 shadow-sm group border-slate-200 hover:bg-slate-50 flex-shrink-0"
          >
            <span className="text-xl font-black italic transition-colors text-slate-400 group-hover:text-red-600">←</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              System <span className="text-red-600">Audit Logs</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 italic">Security Monitoring • Cross-Module Activity</p>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* CUSTOM DROPDOWN UI FILTER */}
          <div className="relative w-full md:w-auto" ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer flex justify-between md:justify-center items-center gap-4 shadow-sm hover:border-red-200 transition-all text-slate-600"
            >
              <span>{categories.find(c => c.value === filter).label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full md:w-56 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {categories.map((c) => (
                  <div 
                    key={c.value}
                    onClick={() => { setFilter(c.value); setIsDropdownOpen(false); }}
                    className="px-5 py-4 text-[10px] font-black uppercase italic tracking-widest text-slate-500 hover:bg-red-600 hover:text-white cursor-pointer transition-all border-b border-slate-50 last:border-none"
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT: FULL PAGE LIST CARD */}
      <main className="flex-1 w-full px-8 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-7xl bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden min-h-[500px]">
          
          {/* SUB-HEADER INSIDE CARD */}
          <div className="px-8 py-8 md:px-10 border-b border-slate-50">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Activity Records</span>
          </div>

          <div className="p-8 md:p-10">
            {loading ? (
              <p className="py-24 text-center font-black text-slate-200 text-3xl animate-pulse italic uppercase tracking-tighter">Syncing Audit Trail...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="py-24 text-center font-black text-slate-300 text-xl italic uppercase">No activity recorded here.</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log._id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-red-200 hover:bg-white transition-all group shadow-sm mb-4 gap-4 md:gap-0">
                  <div className="flex items-center gap-6">
                    <div className={`w-28 text-center py-2 rounded-xl font-black text-[9px] uppercase italic tracking-tighter ${
                      log.category === 'ACCOUNT' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    }`}>
                      {log.category}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase italic underline decoration-red-500/20">{log.user}</p>
                        <span className="text-[8px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-black uppercase italic">{log.type}</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight group-hover:text-red-600 transition-colors">{log.action}</h3>
                    </div>
                  </div>
                  <div className="text-left md:text-right ml-34 md:ml-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                    <p className="text-[8px] font-bold text-slate-200 mt-1">ID: {log._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemLogs;