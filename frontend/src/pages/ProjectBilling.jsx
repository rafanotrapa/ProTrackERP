import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, CheckCircle, Clock, Building2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProjectBilling = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project-billing', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        console.error("Gagal load project billing", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const getProgressColor = (percent) => {
    if (percent === 100) return 'bg-emerald-500';
    if (percent >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Project <span className="text-indigo-600">Billing</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Finance • Payment Progress Monitoring</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        {loading ? (
          <div className="py-20 text-center font-black text-slate-200 text-3xl animate-pulse italic">LOADING PROJECTS...</div>
        ) : projects.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
            <DollarSign size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-300 font-black italic uppercase text-lg tracking-tighter">No billing data available</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Create invoices first to see billing progress</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div 
                key={project.projectId}
                onClick={() => navigate(`/project-billing/${project.projectId}`)}
                className="group cursor-pointer bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-indigo-300 hover:shadow-xl transition-all"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={16} className="text-indigo-500" />
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{project.projectId}</p>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">{project.projectName}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{project.clientName}</p>
                  </div>
                  {project.isComplete ? (
                    <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                      <CheckCircle size={12} /> COMPLETE
                    </div>
                  ) : (
                    <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                      <Clock size={12} /> IN PROGRESS
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 mb-1">
                    <span>Payment Progress</span>
                    <span>{project.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progressPercent)}`}
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Stages</p>
                    <p className="text-lg font-black text-slate-800">{project.paidCount}/{project.stagesCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Paid</p>
                    <p className="text-sm font-black text-emerald-600">Rp {project.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
                    <p className="text-sm font-black text-amber-600">Rp {project.remainingAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Next Stage Indicator */}
                {!project.isComplete && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp size={10} /> Next: Stage {project.paidCount + 1} of {project.stagesCount}
                    </span>
                    <span className="text-[9px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Click to view →
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProjectBilling;