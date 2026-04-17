import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // CUSTOM DROPDOWN STATES
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        console.error("Gagal load project list");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();

    // Close dropdown click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = 
        (p.projectId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.institutionName || p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'All' ? true : 
        statusFilter === 'Paid' ? p.isFinalPaid === true : 
        p.isFinalPaid === false;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, projects]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      {/* SUB-HEADER & ACTIONS */}
      <div className="w-full border-b border-slate-100 px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
            <span className="text-slate-400 group-hover:text-indigo-600 text-lg font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Timeline <span className="text-indigo-600">Monitoring</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Project Tracking Hub • Real-time Status</p>
          </div>
        </div>

        {/* SEARCH & CUSTOM DROPDOWN FILTER */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
             <input 
               type="text" 
               placeholder="Search..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full p-2.5 pl-9 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm italic"
             />
             <span className="absolute left-3 top-2.5 text-slate-300 text-xs">🔍</span>
          </div>
          
          {/* CUSTOM UI DROPDOWN FILTER */}
          <div className="relative md:w-40" ref={dropdownRef}>
            <div 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                {statusFilter === 'All' ? 'All Status' : statusFilter === 'Paid' ? 'Paid' : 'Pending'}
              </span>
              <span className={`text-[8px] transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>

            {isFilterOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl">
                {['All', 'Paid', 'Pending'].map((opt) => (
                  <div 
                    key={opt}
                    onClick={() => { setStatusFilter(opt); setIsFilterOpen(false); }}
                    className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors ${
                      statusFilter === opt ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  >
                    {opt === 'All' ? 'Show All' : opt === 'Paid' ? 'Paid / Cleared' : 'Pending / Active'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-8 md:pt-4"> 
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex justify-between items-end px-1 mb-1">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Active Pipeline</h2>
            <p className="text-[9px] font-bold text-indigo-600 uppercase leading-none">Displaying {filteredProjects.length} Records</p>
          </div>

          {loading ? (
            <div className="p-20 text-center"><div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredProjects.map((p) => (
                <div key={p._id} onClick={() => navigate(`/timeline/${p.projectId}`)} className="bg-white p-4 rounded-[1.2rem] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group active:scale-[0.99]">
                  <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                    <div className="bg-slate-900 h-10 w-10 flex flex-col items-center justify-center rounded-lg text-white font-black group-hover:bg-indigo-600 transition-colors shadow-md">
                       <span className="text-[6px] opacity-40 leading-none mb-0.5">ID</span><span className="text-[8px] uppercase">BJK</span>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-indigo-500 uppercase italic mb-1">{(p.projectId || 'N/A')}</p>
                      <h3 className="text-base font-black text-slate-800 uppercase italic leading-tight group-hover:text-indigo-600 tracking-tight">{(p.projectName || 'Untitled')}</h3>
                    </div>
                  </div>
                  <div className="flex-1 text-center py-2 md:py-0 border-y md:border-y-0 border-slate-50 my-2 md:my-0 w-full">
                    <p className="text-[8px] font-black text-slate-300 uppercase italic">Institution</p>
                    <p className="text-[11px] font-black text-slate-600 uppercase italic">{(p.institutionName || p.clientName || 'N/A')}</p>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Finance</p>
                        <div className="flex items-center gap-2 justify-end">
                           <span className={`w-1.5 h-1.5 rounded-full ${p.isFinalPaid ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`}></span>
                           <p className={`text-[9px] font-black italic uppercase ${p.isFinalPaid ? 'text-green-600' : 'text-orange-500'}`}>{p.isFinalPaid ? 'Cleared' : 'On-Going'}</p>
                        </div>
                     </div>
                     <button className="bg-slate-900 group-hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md transition-all group-hover:translate-x-1">Timeline →</button>
                  </div>
                </div>
              ))}
              {filteredProjects.length === 0 && !loading && (
                <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl"><p className="text-lg font-black italic uppercase text-slate-300 tracking-tighter">No Records Match.</p></div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectList;