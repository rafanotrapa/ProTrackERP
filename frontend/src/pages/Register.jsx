import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Register = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'Marketing' 
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const roles = [
    { label: 'Marketing Division', value: 'Marketing' },
    { label: 'Procurement Division', value: 'Procurement' },
    { label: 'Finance Division', value: 'Finance' },
    { label: 'Management', value: 'Management' },
    { label: 'Company Owner', value: 'Owner' },
    { label: 'Super Admin Access', value: 'Admin' }
  ];

  // Menutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // SweetAlert2 Sukses
      Swal.fire({
        title: 'SUCCESS!',
        text: 'Karyawan Baru Berhasil Terdaftar ke Sistem.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        customClass: {
          title: 'font-black italic uppercase tracking-tighter',
          confirmButton: 'rounded-xl px-10 py-3 font-black uppercase text-xs tracking-widest'
        }
      }).then(() => {
        navigate('/manage-users');
      });

    } catch (err) {
      // SweetAlert2 Error
      Swal.fire({
        title: 'ERROR!',
        text: err.response?.data?.msg || 'Gagal registrasi user',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans flex flex-col items-center">
      <div className="w-full max-w-6xl">
        
        <header className="flex justify-between items-end mb-8 px-2">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Add New <span className="text-indigo-600">Employee</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
              Human Resources • Access Control Protocol
            </p>
          </div>
          <button 
            onClick={() => navigate('/manage-users')} 
            className="text-slate-400 font-black text-[10px] uppercase border-b-2 border-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all tracking-widest pb-1"
          >
            Back to User List
          </button>
        </header>

        <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 p-8 md:p-12">
          <form onSubmit={handleRegister} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              
              {/* FULL NAME */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" required 
                  className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xl font-black italic uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-800"
                  placeholder="E.G. JOHN DOE"
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Email</label>
                <input 
                  type="email" required 
                  className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-600"
                  placeholder="johndoe@gmail.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* CUSTOM DROPDOWN ROLE */}
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign Division Role</label>
                
                <div 
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 font-black uppercase text-sm cursor-pointer flex justify-between items-center transition-all ${isOpen ? 'ring-4 ring-indigo-500/10 bg-white border-indigo-200' : ''}`}
                >
                  <span className="text-indigo-600">
                    {roles.find(r => r.value === formData.role)?.label || 'Select Role'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-indigo-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                    {roles.map((role) => (
                      <div 
                        key={role.value}
                        className="px-5 py-4 text-xs font-black uppercase italic tracking-wider text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                        onClick={() => {
                          setFormData({...formData, role: role.value});
                          setIsOpen(false);
                        }}
                      >
                        {role.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PASSWORD WITH VIEW TOGGLE */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Initial Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-800 pr-14"
                    placeholder="••••••••"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-2 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:bg-slate-300"
              >
                {loading ? 'SYNCING DATABASE...' : 'DEPLOY ACCOUNT'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/manage-users')} 
                className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">
             Authorized Personnel Only • Secure Session Enabled
           </p>
        </div>

      </div>
    </div>
  );
};

export default Register;