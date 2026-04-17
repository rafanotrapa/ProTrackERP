import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'User', role: 'Guest' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="flex sticky top-0 z-50 justify-between items-center p-4 bg-slate-900 border-b border-slate-800 shadow-xl">
      {/* LEFT: LOGO SECTION */}
      <div 
        className="flex items-center gap-3 cursor-pointer transition-all active:scale-95"
        onClick={() => navigate('/dashboard')}
      >
        <div className="p-2 font-black italic text-white bg-indigo-600 shadow-lg rounded-xl shadow-indigo-500/20">PT</div>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
            PROTRACK <span className="text-xs not-italic tracking-widest text-indigo-400 ml-1">ERP</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 italic">Enterprise Resource Planning</p>
        </div>
      </div>
      
      {/* RIGHT: USER PROFILE & LOGOUT */}
      <div className="flex items-center gap-6">
        <div className="hidden pr-6 text-right border-r sm:block border-slate-800">
          <p className="text-sm font-black uppercase leading-none text-white tracking-wide">
            {user.username || user.name || 'User'}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">
            {user.role} Access
          </p>
        </div>

        <div className="flex justify-center items-center w-10 h-10 font-black text-white bg-slate-800 rounded-full border border-slate-700 shadow-inner">
          {(user.username || user.name || 'U').charAt(0).toUpperCase()}
        </div>

        <button 
          onClick={handleLogout}
          className="px-6 py-2.5 bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all hover:bg-red-600 active:scale-95"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Header;