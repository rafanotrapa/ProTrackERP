import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddVendor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]); 
  const [existingVendors, setExistingVendors] = useState([]); // <-- State baru buat cek limit vendor

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Tarik Project & Vendor sekaligus untuk pengecekan limitasi
        const [resProj, resVend] = await Promise.all([
          axios.get('http://localhost:5000/api/project', { headers }),
          axios.get('http://localhost:5000/api/vendor', { headers })
        ]);
        
        setProjects(resProj.data);
        setExistingVendors(resVend.data);
      } catch (err) {
        console.error("Gagal load data", err);
      }
    };
    fetchData();
  }, []);

  const generateVendorID = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VND-${yearMonth}-${random}`;
  };

  const [formData, setFormData] = useState({
    vendorId: generateVendorID(),
    projectId: '', 
    vendorName: '',
    companyType: 'PT',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: 'IT Services'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // VALIDASI NOMOR HP: Hanya angka & Max 15 digit
    if (name === 'phone') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 15) {
        setFormData({ ...formData, phone: onlyNums });
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) return Swal.fire('Warning', 'Pilih Project Target terlebih dahulu!', 'warning');

    // --- LOGIC GATE: CEK LIMITASI VENDOR BERDASARKAN QUOTATION MODE ---
    const selectedProj = projects.find(p => p.projectId === formData.projectId);
    
    if (selectedProj && selectedProj.quotationMode === 'auto') {
      // Hitung ada berapa vendor yang terikat dengan project ini di DB
      const linkedVendorsCount = existingVendors.filter(v => v.projectId === formData.projectId).length;
      
      if (linkedVendorsCount >= 1) {
        return Swal.fire({
          icon: 'error',
          title: 'RESTRICTED',
          text: `Project ini berstatus AUTO MODE (Maksimal 1 Supplier). Sudah ada supplier yang terikat dengan project ini!`,
          confirmButtonColor: '#0f172a'
        });
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/vendor', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: 'success',
        title: 'REGISTERED',
        text: `Vendor ${formData.vendorName} successfully added to queue.`,
        confirmButtonColor: '#0f172a' 
      });
      navigate('/existing-vendors');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'FAILED', text: err.response?.data?.msg || 'Gagal simpan vendor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button onClick={() => navigate('/vendor')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Vendor <span className="text-indigo-600">Registration</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Partner Onboarding</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <form onSubmit={handleSubmit} className="max-w-none w-full space-y-12">
          
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Company Profile & Target
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Vendor ID</label>
                <input type="text" readOnly value={formData.vendorId} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-600 font-bold outline-none shadow-sm" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Project Target</label>
                <select name="projectId" required className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm cursor-pointer" onChange={handleChange} value={formData.projectId}>
                  <option value="">-- Select Linked Project --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p.projectId}>{p.projectId} - {p.projectName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Type</label>
                <select name="companyType" className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm cursor-pointer" onChange={handleChange} value={formData.companyType}>
                  <option value="PT">PT</option>
                  <option value="CV">CV</option>
                  <option value="Persero">Persero</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-1 md:col-span-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Legal Company Name</label>
                 <input name="vendorName" type="text" required placeholder="e.g. Batavia Jaya Teknologi" className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm transition-all" onChange={handleChange} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Category</label>
                 <select name="category" className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm cursor-pointer" onChange={handleChange} value={formData.category}>
                   <option value="IT Services">IT Services</option>
                   <option value="Stationary">Stationary</option>
                   <option value="Construction">Construction</option>
                   <option value="Furniture">Furniture</option>
                   <option value="Consultant">Consultant</option>
                 </select>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02. Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Email Address</label>
                <input name="email" type="email" required placeholder="contact@vendor.com" className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm transition-all" onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Phone / WhatsApp</label>
                <input name="phone" type="text" placeholder="0812xxxx" className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm transition-all" value={formData.phone} onChange={handleChange} />
                <p className="text-[8px] text-slate-400 mt-1 ml-1">Hanya angka (Max 15 digit)</p>
              </div>
            </div>
            <div className="space-y-1 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Full Office Address</label>
              <textarea name="address" placeholder="Detail Alamat Kantor..." className="w-full p-5 bg-white border border-slate-300 rounded-2xl h-28 outline-none font-medium text-slate-700 focus:border-indigo-600 shadow-sm transition-all" onChange={handleChange} />
            </div>
          </div>

          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-12 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'SYNCING...' : 'REGISTER VENDOR →'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddVendor;