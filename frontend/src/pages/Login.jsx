import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // CEK APAKAH USER SUDAH LOGIN?
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard'); // Kalau udah ada token, lempar langsung ke dashboard
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Tembak API Backend
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      
      // SIMPAN TOKEN & DATA USER KE LOCALSTORAGE
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Info Sukses
      console.log("Login Success:", res.data.user);
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err);
      // Alert lebih informatif
      alert(err.response?.data?.msg || 'Login Gagal! Cek koneksi internet atau kredensial lo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl border-b-8 border-indigo-700">
        
        {/* LOGO SECTION */}
        <div className="mb-10 text-center">
          <div className="inline-block bg-indigo-700 text-white px-4 py-1 rounded-lg font-black text-2xl mb-2 shadow-lg shadow-indigo-200">
            PT
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            PROTRACK <span className="text-indigo-700">ERP</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Enterprise Resource Planning
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
              Email Address
            </label>
            <input 
              type="email" 
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              placeholder="nama@protrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" title="forgot" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter">
                Lupa Password?
              </Link>
            </div>
            <input 
              type="password" 
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full rounded-xl p-4 font-black text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 flex justify-center items-center gap-2 ${
              loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                CHECKING...
              </>
            ) : 'SIGN IN TO SYSTEM'}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500 font-medium">
            Belum punya akses?{' '}
            <Link to="/register" className="text-indigo-700 font-black hover:underline">
              Minta Akun
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          © 2026 ProTrack ERP • Version 1.0
        </p>
      </div>
    </div>
  );
};

export default Login;