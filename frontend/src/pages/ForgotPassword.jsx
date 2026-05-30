import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.msg || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Cek Email Anda</h2>
          <p className="text-slate-500 text-sm">
            Kami sudah mengirimkan link reset password ke <strong>{email}</strong>. 
            Link akan kadaluarsa dalam 10 menit.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 text-indigo-600 font-bold text-sm"
          >
            ← Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800">Lupa Password?</h1>
            <p className="text-slate-500 text-sm mt-2">
              Masukkan email Anda, kami akan kirimkan link untuk reset password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  placeholder="email@protrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;