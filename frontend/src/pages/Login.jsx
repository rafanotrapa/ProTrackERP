import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Building2, Eye, EyeOff, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      alert(err.response?.data?.msg || 'Login Gagal! Cek kredensial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen font-sans bg-white">
      
      {/* Background subtle pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234f46e5%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md p-4 mx-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <div className="p-8 md:p-10">
            
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 size={28} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                ProTrack <span className="text-indigo-600">ERP</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Enterprise Resource Planning
              </p>
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-indigo-300 to-transparent mx-auto mt-3"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="admin@protrack.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full rounded-xl py-3.5 font-black text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-700 hover:shadow-indigo-100'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    SIGN IN
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Security */}
            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Connection</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                © 2026 ProTrack ERP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;