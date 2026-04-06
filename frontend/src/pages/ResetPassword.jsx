import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { token } = useParams(); // Ambil token dari URL
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Password gak cocok, Fa!");

    try {
      // Tembak API Backend lo (Method PUT)
      const res = await axios.put(`http://localhost:5000/api/auth/resetpassword/${token}`, { password });
      alert(res.data.msg);
      navigate('/'); // Balik ke Login
    } catch (err) {
      alert(err.response?.data?.msg || "Token kadaluarsa atau salah!");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border-t-8 border-orange-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Password Baru</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="password" 
            placeholder="Masukkan Password Baru" 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-orange-500 outline-none" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Konfirmasi Password Baru" 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-orange-500 outline-none" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 transition-all">
            UPDATE PASSWORD
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;