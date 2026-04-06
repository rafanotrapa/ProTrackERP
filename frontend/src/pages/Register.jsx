import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  // Pastikan role awal (default) ada di dalam Enum Model lo
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'Marketing' 
  });
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert(res.data.msg || 'Registrasi Berhasil!');
      navigate('/'); // Balik ke halaman login
    } catch (err) {
      // Biar lo tau error spesifiknya apa di console
      console.error("Detail Error:", err.response?.data);
      alert(err.response?.data?.msg || 'Gagal Daftar, cek console!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border-t-8 border-green-600">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Daftar Akun ProTrack</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              placeholder="Contoh: rafa_maheswara" 
              required 
              className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="email@protrack.com" 
              required 
              className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Divisi</label>
            <select 
              className="w-full p-3 border rounded bg-white focus:ring-2 focus:ring-green-500 outline-none" 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              {/* Pilihan ini HARUS sama persis dengan Enum di Model User backend lo */}
              <option value="Marketing">Marketing</option>
              <option value="Procurement">Procurement</option>
              <option value="Finance">Finance</option>
              <option value="Management">Management</option>
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 active:scale-95 transition-all shadow-md mt-4"
          >
            DAFTAR SEKARANG
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun? <Link to="/" className="text-blue-600 font-bold hover:underline">Login di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;