import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. GENERATOR UPDATE: Ganti PRJ jadi BJK sesuai request
  const generateProjectID = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BJK-${yearMonth}-${random}`;
  };

  const [formData, setFormData] = useState({
    projectId: generateProjectID(),
    projectName: '',
    institutionName: '',
    clientName: '',
    clientContact: '',
    clientAddress: '',
    amount: '',
    currency: 'IDR',
    description: '' // Init state description
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // POST ke /api/project (Tanpa 's' sesuai database lo)
      await axios.post('http://localhost:5000/api/project', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert(`Project ${formData.projectId} Berhasil Disimpan!`);
      navigate('/dashboard');
    } catch (err) {
      console.error("Error Detail:", err.response);
      const errorMsg = err.response?.data?.msg || 'Koneksi Backend Gagal / Endpoint 404';
      alert(`Gagal: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* HEADER */}
        <div className="bg-indigo-700 p-8 text-white">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-indigo-200 hover:text-white font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2 transition-all"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-black tracking-tighter uppercase">New Project Registration</h1>
          <p className="text-indigo-100 text-sm opacity-80 uppercase tracking-widest font-bold">Marketing Module • ProTrack v1.0</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* SECTION 1: IDENTITY */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-2">01. Project Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Project ID</label>
                <input type="text" readOnly value={formData.projectId} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Project Name</label>
                <input name="projectName" type="text" required placeholder="Nama Proyek" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.projectName} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SECTION 2: CLIENT */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-2">02. Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Institution</label>
                <input name="institutionName" type="text" placeholder="PT / Instansi" className="w-full p-3 border border-slate-200 rounded-xl outline-none" 
                  value={formData.institutionName} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">PIC Name</label>
                <input name="clientName" type="text" required placeholder="Nama PIC" className="w-full p-3 border border-slate-200 rounded-xl outline-none" 
                  value={formData.clientName} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Contact</label>
                <input name="clientContact" type="text" placeholder="Email/Phone" className="w-full p-3 border border-slate-200 rounded-xl outline-none" 
                  value={formData.clientContact} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SECTION 3: FINANCIAL & DESCRIPTION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-2">03. Financial & Scope</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Currency</label>
                <select name="currency" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold text-indigo-700"
                  value={formData.currency} onChange={handleChange}>
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount</label>
                <input name="amount" type="number" required placeholder="0" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-lg" 
                  value={formData.amount} onChange={handleChange} />
              </div>
            </div>

            {/* DESCRIPTION FIELD FIX */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Project Description</label>
              <textarea 
                name="description" 
                placeholder="Tuliskan detail cakupan proyek..." 
                className="w-full p-3 border border-slate-200 rounded-xl h-28 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full p-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${
              loading ? 'bg-slate-400' : 'bg-indigo-700 hover:bg-indigo-800'
            }`}
          >
            {loading ? 'SYNCING TO DATABASE...' : 'SAVE PROJECT DATA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProject;