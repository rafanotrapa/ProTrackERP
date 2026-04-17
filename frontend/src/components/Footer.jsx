import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-slate-900 text-white relative overflow-hidden mt-auto">
      {/* Top Border Accent */}
      <div className="h-1 w-full bg-linear-to-r from-indigo-600 via-blue-500 to-indigo-600"></div>

      <div className="max-w-400 mx-auto px-10 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* LEFT: BRANDING */}
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="bg-indigo-600 p-1.5 rounded-lg font-black text-[10px] italic shadow-lg shadow-indigo-500/20">BJK</div>
              <p className="text-xl font-black italic uppercase tracking-tighter">
                BATAVIA JAYA <span className="text-indigo-500">KREASINDO</span>
              </p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em] ml-1">
              Strategic Enterprise Resource Planning
            </p>
          </div>

          {/* CENTER: SYSTEM INFO (Keisi Spacenya) */}
          <div className="flex gap-12 text-center border-x border-slate-800 px-12 lg:flex">
            <div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Version</p>
              <p className="text-xs font-black italic text-slate-300 uppercase">v1.0.4 - Stable</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Environment</p>
              <p className="text-xs font-black italic text-emerald-500 uppercase">Production</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Server Time</p>
              <p className="text-xs font-black italic text-slate-300 uppercase">{new Date().getFullYear()}</p>
            </div>
          </div>

          {/* RIGHT: SECURITY STATUS */}
          <div className="text-center md:text-right">
            <div className="flex items-center gap-2 justify-center md:justify-end mb-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">System Encrypted</p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] italic">
              Authorized Personnel Only
            </p>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
            © 2026 ProTrack ERP • Developed for Capstone Project
          </p>
          <div className="flex gap-6">
            <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest italic cursor-default hover:text-indigo-400 transition-colors">Privacy Policy</span>
            <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest italic cursor-default hover:text-indigo-400 transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Background Decorative Text (Ujung ke Ujung) */}
      <div className="absolute -bottom-6 -left-10 opacity-[0.02] pointer-events-none select-none">
        <div className="text-[12rem] font-black italic tracking-tighter leading-none">PROTRACK</div>
      </div>
    </footer>
  );
};

export default Footer;