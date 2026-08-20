import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import protrackMark from '../assets/protrack-mark.png';
import { aktifkanModeTab, matikanModeTab, modeTabAktif } from '../utils/sessionScope';
import { useLang } from '../i18n';
import { catatAktivitas } from '../components/ProtectedRoute';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Sesi khusus tab ini, supaya beberapa akun bisa dibuka sekaligus dalam satu
  // profil browser tanpa saling menimpa.
  const [sesiTabIni, setSesiTabIni] = useState(modeTabAktif());
  const navigate = useNavigate();
  const { t } = useLang();

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

      // Penanda mode harus dipasang sebelum token ditulis, karena itu yang
      // menentukan token disimpan ke sessionStorage (khusus tab ini) atau ke
      // localStorage (dipakai bersama semua tab).
      if (sesiTabIni) aktifkanModeTab(); else matikanModeTab();

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Penanda aktivitas WAJIB disegarkan di sini. Kalau penanda lama dari
      // sesi sebelumnya masih tertinggal dan usianya lewat batas menganggur,
      // ProtectedRoute menganggap sesi baru ini sudah kedaluwarsa dan langsung
      // menendang balik ke halaman login padahal login-nya berhasil.
      catatAktivitas();

      Swal.fire({
        icon: 'success',
        title: t('login.success'),
        text: t('login.welcome', { nama: res.data.user.username }),
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1e293b'
      });

      navigate('/dashboard');
    } catch (err) {
      // Pesan dari server masih berbahasa Indonesia; menerjemahkannya butuh
      // kode error di backend, yang masuk tahap i18n berikutnya.
      const errorMsg = err.response?.data?.msg || t('login.failed');
      const isLocked = err.response?.data?.isLocked;
      const remainingAttempts = err.response?.data?.remainingAttempts;

      if (isLocked) {
        Swal.fire({
          icon: 'error',
          title: t('login.locked'),
          html: `<p class="text-slate-700">${errorMsg}</p>
                 <p class="text-slate-500 text-sm mt-2">${t('login.lockedHelp')}</p>`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4f46e5',
          background: '#ffffff'
        });
      } else if (remainingAttempts !== undefined && remainingAttempts > 0) {
        Swal.fire({
          icon: 'warning',
          title: t('login.wrongPassword'),
          html: `<p class="text-slate-700">${errorMsg}</p>
                 <p class="text-amber-600 text-sm font-bold mt-2">${t('login.attemptsLeft', { n: remainingAttempts })}</p>`,
          confirmButtonText: t('login.retry'),
          confirmButtonColor: '#4f46e5',
          background: '#ffffff'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: t('login.failed'),
          text: errorMsg,
          confirmButtonText: t('login.retry'),
          confirmButtonColor: '#4f46e5',
          background: '#ffffff'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen font-sans bg-white">

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234f46e5%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-100"></div>
      </div>

      <div className="relative z-20 w-full max-w-md p-4 mx-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">

          <div className="p-8 md:p-10">

            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-2xl blur-xl opacity-50"></div>
                <img
                  src={protrackMark}
                  alt="ProTrack ERP"
                  className="object-contain relative w-16 h-16"
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                ProTrack <span className="text-indigo-600">ERP</span>
              </h1>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Enterprise Resource Planning
              </p>
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-indigo-300 to-transparent mx-auto mt-3"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none" title="The token is stored for this tab only, so another tab can be signed in with a different account. The session ends when the tab is closed.">
                  <input
                    type="checkbox"
                    checked={sesiTabIni}
                    onChange={(e) => setSesiTabIni(e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tab-only session
                  </span>
                </label>

                <a href="/forgot-password" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                  Forgot Password?
                </a>
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

            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                <p className="text-2xs font-black text-slate-400 uppercase tracking-[0.2em]">Secure Connection</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
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