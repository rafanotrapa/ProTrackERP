import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Gagal tarik data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const resetPasswordManual = async (id, username) => {
    const { value: newPass } = await Swal.fire({
      title: 'FORCE RESET PASSWORD',
      text: `Set password baru untuk ${username}`,
      input: 'password',
      inputPlaceholder: 'Input password (min. 6 karakter)',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'OVERRIDE PASSWORD',
      cancelButtonText: 'CANCEL',
      customClass: {
        title: 'font-black italic uppercase tracking-tighter',
        input: 'rounded-xl border-slate-200 font-bold',
        confirmButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3',
        cancelButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3'
      }
    });

    if (newPass) {
      if (newPass.length < 6) {
        return Swal.fire({
          title: 'ERROR!',
          text: 'Password minimal 6 karakter, Fa!',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
      
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/auth/reset-admin/${id}`, 
          { password: newPass },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: 'SUCCESS',
          text: `Password ${username} berhasil diganti!`,
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      } catch (err) {
        Swal.fire('FAILED', err.response?.data?.msg || "Gagal reset password", 'error');
      }
    }
  };

  const deleteUser = async (id, username) => {
    const result = await Swal.fire({
      title: 'REVOKE ACCESS?',
      text: `Akses ${username} akan dicabut permanen dari sistem ProTrack!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'YES, REMOVE ACCOUNT',
      cancelButtonText: 'CANCEL',
      customClass: {
        title: 'font-black italic uppercase tracking-tighter',
        confirmButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3',
        cancelButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3'
      }
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/auth/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          title: 'REMOVED',
          text: 'Akses karyawan telah dicabut.',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
        fetchUsers(); 
      } catch (err) { 
        Swal.fire('ERROR', 'Gagal menghapus user.', 'error'); 
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-slate-900 pb-16">
      
      {/* HEADER: KONSISTEN DENGAN MODULE LAIN */}
      <header className="w-full px-8 py-8 md:px-12 lg:px-16 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex justify-center items-center w-12 h-12 bg-white rounded-2xl border transition-all active:scale-90 shadow-sm group border-slate-200 hover:bg-slate-50 flex-shrink-0"
          >
            <span className="text-xl font-black italic transition-colors text-slate-400 group-hover:text-indigo-600">←</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              User <span className="text-indigo-600">Management</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 italic">Administrative Control • Password Override</p>
          </div>
        </div>
        
        <div>
          <button 
            onClick={() => navigate('/register')} 
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap"
          >
            + Add New Employee
          </button>
        </div>
      </header>

      {/* MAIN CONTENT: FULL PAGE TABLE CARD */}
      <main className="flex-1 w-full px-8 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-7xl bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          
          {/* SUB-HEADER INSIDE CARD (MIMIC "READY FOR DISPATCH") */}
          <div className="px-8 py-8 md:px-10">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Registered Personnel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-[0.2em] italic">
                <tr>
                  <th className="px-8 md:px-10 py-6 whitespace-nowrap">Karyawan / Division</th>
                  <th className="px-8 md:px-10 py-6 whitespace-nowrap">Email Address</th>
                  <th className="px-8 md:px-10 py-6 text-center whitespace-nowrap">Actions Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-24 text-center font-black text-slate-200 text-2xl animate-pulse italic uppercase">Syncing User Database...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-24 text-center font-black text-slate-300 text-xl italic uppercase">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="px-8 md:px-10 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 italic uppercase tracking-tight text-lg">{u.username}</span>
                          <span className={`w-fit mt-1 px-3 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            u.role === 'Admin' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 md:px-10 py-6 font-bold text-slate-500">{u.email}</td>
                      <td className="px-8 md:px-10 py-6">
                        <div className="flex justify-center gap-6">
                          <button 
                            onClick={() => resetPasswordManual(u._id, u.username)}
                            className="flex flex-col items-center group/btn"
                          >
                            <span className="text-indigo-600 font-black text-[10px] uppercase tracking-tighter group-hover/btn:underline">Reset Pass</span>
                            <span className="text-[9px] opacity-30 italic font-bold">Override</span>
                          </button>
                          <div className="w-px h-8 bg-slate-100"></div>
                          <button 
                            onClick={() => deleteUser(u._id, u.username)}
                            className="flex flex-col items-center group/del"
                          >
                            <span className="text-red-400 font-black text-[10px] uppercase tracking-tighter group-hover/del:text-red-600 group-hover/del:underline">Remove</span>
                            <span className="text-[9px] opacity-30 italic font-bold">Revoke</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;