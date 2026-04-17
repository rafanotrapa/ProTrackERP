import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProjectTimeline = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProject(res.data);
      } catch (err) {
        console.error("Gagal tarik detail project");
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetail();
  }, [projectId]);

  const calculateProgress = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.isDPPaid) score += 25;
    if (p.isItemsReceived) score += 25;
    if (p.isItemsDelivered) score += 25;
    if (p.isFinalPaid) score += 25;
    return score;
  };

  const getStatusText = (p) => {
    if (p.isFinalPaid) return "PROJECT CLOSED / COMPLETED";
    if (p.isItemsDelivered) return "DELIVERED - AWAITING FINAL PAYMENT";
    if (p.isItemsReceived) return "IN WAREHOUSE - READY TO SHIP";
    if (p.isDPPaid) return "DP PAID - PROCUREMENT STAGE";
    return "INITIALIZING PROJECT";
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-slate-300 text-xl italic uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-black text-red-500 italic mb-4">404 NOT FOUND</h1>
      <button onClick={() => navigate('/timeline')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Back to List</button>
    </div>
  );

  const progress = calculateProgress(project);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* SUB-HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/timeline')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Project <span className="text-indigo-600">Timeline</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">BJK Tracker • ID: {project.projectId}</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <div className="max-w-7xl mx-auto">
          
          {/* MAIN INFO CARD */}
          <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-100/50 mb-10 relative overflow-hidden">
            <div className={`absolute top-0 right-0 px-8 py-4 font-black italic text-[10px] uppercase tracking-[0.3em] ${progress === 100 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}>
              Current Phase: {getStatusText(project)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Official Title</p>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-tight">
                  {project.projectName}
                </h2>
                <div className="flex items-center gap-4 pt-2">
                   <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{project.clientName}</div>
                   <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">{project.topOption || 'N/A'}</div>
                </div>
              </div>

              {/* PROGRESS CIRCLE / PERCENTAGE */}
              <div className="flex flex-col items-end">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Overall Progress</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-8xl font-black text-slate-900 tracking-tighter italic leading-none">{progress}</span>
                   <span className="text-2xl font-black text-indigo-600 italic">%</span>
                </div>
              </div>
            </div>

            {/* CUSTOM PROGRESS BAR */}
            <div className="mt-12 h-6 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
              <div 
                style={{ width: `${progress}%` }}
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                  progress === 100 
                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                    : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600'
                }`}
              ></div>
            </div>
          </div>

          {/* MILESTONE STEP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <StepCard active={project.isDPPaid} label="Down Payment" step="01" icon="💳" />
            <StepCard active={project.isItemsReceived} label="In Warehouse" step="02" icon="📦" />
            <StepCard active={project.isItemsDelivered} label="Delivered / BAST" step="03" icon="🚚" />
            <StepCard active={project.isFinalPaid} label="Final Payment" step="04" success icon="💰" />
          </div>

          {/* LOG AREA */}
          <div className="mt-12 p-8 bg-slate-900 rounded-[2rem] flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-4">
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-ping"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">System Monitoring Active</p>
             </div>
             <p className="text-xs font-bold text-slate-500 italic opacity-80">
                "BJK real-time synchronization with Finance & Warehouse modules."
             </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

// SUB-KOMPONEN STEP CARD (Luxury Version)
const StepCard = ({ active, label, step, success, icon }) => (
  <div className={`relative p-8 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-700 overflow-hidden ${
    active 
      ? (success ? 'bg-white border-green-500 shadow-2xl shadow-green-100 scale-[1.02]' : 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100 scale-[1.02]') 
      : 'bg-slate-50 border-slate-100 opacity-40 grayscale'
  }`}>
    {/* Step Number Background */}
    <span className="absolute -top-4 -right-2 text-6xl font-black italic text-slate-100 select-none group-hover:text-indigo-50 transition-colors">{step}</span>
    
    <span className="text-3xl mb-4 relative z-10">{icon}</span>
    <span className={`text-[9px] font-black mb-1 relative z-10 uppercase tracking-widest ${active ? (success ? 'text-green-500' : 'text-indigo-500') : 'text-slate-400'}`}>
      Phase {step}
    </span>
    <p className={`font-black text-xs uppercase tracking-tight text-center leading-tight relative z-10 ${active ? 'text-slate-800' : 'text-slate-400'}`}>
      {label}
    </p>
    
    {active && (
      <div className={`mt-4 h-1 w-12 rounded-full ${success ? 'bg-green-500' : 'bg-indigo-600'}`}></div>
    )}
  </div>
);

export default ProjectTimeline;