import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddVendor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const generateVendorID = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VND-${yearMonth}-${random}`;
  };

  const [formData, setFormData] = useState({
    vendorId: generateVendorID(),
    vendorName: '',
    companyType: 'PT',
    contactPerson: '',
    email: '',
    phone: '', // Tambahan
    address: '',
    category: 'IT Services' // Tambahan Default
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/vendor', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Vendor ${formData.vendorName} Berhasil Didaftarkan!`);
      navigate('/existing-vendors'); // Langsung lempar ke list biar kelihatan hasilnya
    } catch (err) {
      alert(err.response?.data?.msg || 'Gagal simpan vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* HEADER */}
        <div className="bg-emerald-600 p-8 text-white">
          <button 
            onClick={() => navigate('/vendor')}
            className="text-emerald-100 hover:text-white font-bold text-xs uppercase mb-4 block"
          >
            ← Back to Menu
          </button>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Vendor Registration</h1>
          <p className="text-sm opacity-80 font-bold tracking-widest">Procurement Module • ProTrack</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vendor ID</label>
              <input type="text" readOnly value={formData.vendorId} className="w-full p-3 bg-slate-100 border rounded-xl font-mono text-emerald-700 font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
              <input name="vendorName" type="text" required placeholder="Nama Perusahaan Vendor" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
              <select name="companyType" className="w-full p-3 border rounded-xl outline-none" onChange={handleChange}>
                <option value="PT">PT</option>
                <option value="CV">CV</option>
                <option value="Persero">Persero</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
              <input name="email" type="email" required placeholder="vendor@mail.com" className="w-full p-3 border rounded-xl outline-none" onChange={handleChange} />
            </div>
          </div>

          {/* NEW SECTION: PHONE & CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
              <input name="phone" type="text" placeholder="0812xxxx" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vendor Category</label>
              <select name="category" className="w-full p-3 border rounded-xl outline-none" onChange={handleChange}>
                <option value="IT Services">IT Services</option>
                <option value="Stationary">Stationary</option>
                <option value="Construction">Construction</option>
                <option value="Furniture">Furniture</option>
                <option value="Consultant">Consultant</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Full Address</label>
            <textarea name="address" placeholder="Alamat kantor vendor..." className="w-full p-3 border rounded-xl h-24 outline-none focus:ring-2 focus:ring-emerald-500" onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading} className={`w-full p-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {loading ? 'REGISTERING...' : 'REGISTER VENDOR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVendor;