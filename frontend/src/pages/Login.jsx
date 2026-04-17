import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard'); 
    } catch (err) {
      alert(err.response?.data?.msg || 'Login Gagal! Cek kredensial lo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex overflow-hidden justify-center items-center p-4 min-h-screen font-sans">
      {/* BACKGROUND IMAGE */}
      <div 
        className="absolute inset-0 z-0 scale-110 bg-center bg-cover"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80')" }}
      ></div>

      {/* OVERLAY - FIXED LINE 42 (Pake blur-sm biar gak warning) */}
      <div className="absolute inset-0 z-10 bg-blue-400 opacity-10 backdrop-blur-sm"></div>

      {/* LOGIN CARD */}
      <div className="relative z-20 w-full max-w-95 p-10 bg-white/80 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] backdrop-blur-2xl">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white border shadow-sm rounded-2xl border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tight text-slate-800">ProTrack <span className="text-indigo-600">ERP</span></h1>
          <p className="mt-2 text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] text-slate-500">
            Internal Access Only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            required 
            className="px-4 py-3 w-full text-sm font-medium transition-all outline-none border border-slate-200/50 bg-slate-100/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            required 
            className="px-4 py-3 w-full text-sm font-medium transition-all outline-none border border-slate-200/50 bg-slate-100/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full rounded-xl py-3.5 font-black text-white shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-200 hover:bg-black'}`} 
          >
            {loading ? 'VALIDATING...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
             © 2026 ProTrack ERP • v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;