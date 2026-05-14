import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Calendar, DollarSign, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Enrich dengan data billing (progress)
        try {
          const billingRes = await axios.get('http://localhost:5000/api/project-billing', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const billingMap = new Map();
          billingRes.data.forEach(b => {
            billingMap.set(b.projectId, b);
          });
          
          const enriched = res.data.map(p => {
            const billing = billingMap.get(p.projectId) || {};
            return {
              ...p,
              progressPercent: billing.progressPercent || 0,
              totalContract: billing.totalContractValue || p.amount || 0,
              totalPaid: billing.totalPaid || 0,
              isComplete: billing.isComplete || false,
              stagesCount: billing.stagesCount || 1,
              paidCount: billing.paidCount || 0
            };
          });
          setProjects(enriched);
        } catch {
          setProjects(res.data);
        }
      } catch (err) {
        console.error("Gagal load projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        (p.projectId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.clientName || p.institutionName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' ? true : 
        statusFilter === 'active' ? !p.isComplete : p.isComplete;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, projects]);

  const formatCurrency = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  const getProgressColor = (percent) => {
    if (percent === 100) return 'bg-emerald-500';
    if (percent >= 50) return 'bg-indigo-500';
    return 'bg-amber-500';
  };

  const statusCounts = {
    all: projects.length,
    active: projects.filter(p => !p.isComplete).length,
    completed: projects.filter(p => p.isComplete).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING PROJECTS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />
      
      {/* HEADER */}
      <div className="w-full border-b border-slate-100 px-6 md:px-10 py-6 bg-white flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Project <span className="text-indigo-600">List</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 italic">All Active Projects • Real-time Status</p>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10">
        
        {/* FILTER & SEARCH BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === 'active' ? 'bg-amber-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Active ({statusCounts.active})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Completed ({statusCounts.completed})
            </button>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Name, Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* PROJECT CARDS */}
        {filteredProjects.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic">No projects found</p>
            <p className="text-[10px] text-slate-400 mt-2">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/timeline/${project.projectId}`)}
                className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer"
              >
                {/* Project ID & Status */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-2 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Building2 size={16} />
                    </div>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{project.projectId}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${project.isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {project.isComplete ? 'COMPLETED' : 'ACTIVE'}
                  </span>
                </div>
                
                {/* Project Name */}
                <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tighter mb-2 line-clamp-2">
                  {project.projectName || 'Untitled'}
                </h3>
                
                {/* Client Name */}
                <p className="text-[9px] font-bold text-slate-500 mb-3">
                  {project.clientName || project.institutionName || 'N/A'}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[7px] font-black text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{project.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progressPercent || 0)}`}
                      style={{ width: `${project.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="flex gap-3">
                    <div>
                      <p className="text-[6px] font-black text-slate-400 uppercase">Stages</p>
                      <p className="text-[10px] font-black">{project.paidCount || 0}/{project.stagesCount || 1}</p>
                    </div>
                    <div>
                      <p className="text-[6px] font-black text-slate-400 uppercase">Contract</p>
                      <p className="text-[9px] font-black text-emerald-600">Rp {formatCurrency(project.totalContract)}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectList;