import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false); // State buat nandain email udah kekirim

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Tembak API Backend
      const res = await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });
      setMessage(res.data.msg);
      setIsSent(true); // Ubah tampilan jadi sukses
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Gagal mengirim email, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // TAMPILAN SETELAH BERHASIL KIRIM
  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center border-t-8 border-blue-600">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Cek Mailtrap Lo!</h2>
          <p className="text-slate-600 mb-6">
            Link reset password sudah dikirim ke email <b>{email}</b>. 
            Silakan buka dashboard Mailtrap dan klik tombol di dalam email tersebut.
          </p>
          <div className="space-y-4">
            <a 
              href="https://mailtrap.io/inboxes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              BUKA MAILTRAP SEKARANG
            </a>
            <Link to="/" className="block text-sm text-slate-500 hover:text-blue-700 font-semibold">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN AWAL (FORM INPUT)
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border-t-8 border-slate-800">
        <h2 className="text-2xl font-bold mb-2 text-slate-800 text-center">Lupa Password?</h2>
        <p className="text-sm text-slate-500 text-center mb-8">
          Masukkan email akun ProTrack lo, kami bakal kirim link reset ke Mailtrap.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 text-left">Email Terdaftar</label>
            <input 
              type="email" 
              placeholder="rafa@protrack.com" 
              required 
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-800 transition-all" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white p-3 rounded-lg font-bold shadow-md transition-all active:scale-95 ${
              loading ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {loading ? 'MENGIRIM...' : 'KIRIM LINK RECOVERY'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-blue-600 font-bold hover:underline">Batal, saya ingat passwordnya</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;