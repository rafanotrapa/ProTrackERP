import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddClientQuotation = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // FUNGSI FORMAT RIBUAN
  const formatRupiah = (value) => {
    if (!value) return '';
    let numberString = value.toString().replace(/[^0-9]/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [formData, setFormData] = useState({
    quotationId: `CQ-${Date.now()}`, 
    projectId: '',
    clientName: '', 
    selectedItems: '', 
    currency: 'IDR',
    clientPrice: '',
    topOption: 'COD',
    timestamp: new Date().toISOString().split('T')[0]
  });

  // Fetch List Project untuk Dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        console.error("Gagal load project list");
      }
    };
    fetchProjects();
  }, []);

  const [rawItems, setRawItems] = useState([]);

  // LOGIC AUTO-FILL (Ini yang gue benerin total)
  useEffect(() => {
    if (!formData.projectId) return;

    const fetchAllDetails = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');
        
        // 1. Ambil data Project buat dapet Nama Client & Project Name
        const resProject = await axios.get(`http://localhost:5000/api/project/${formData.projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Ambil data Supplier Quotation buat dapet List Item Barang & TOP
        // Pastikan endpoint ini (/api/supplier_quotation/project/:id) sudah lo buat di backend
        const resSQ = await axios.get(`http://localhost:5000/api/supplier_quotation/project/${formData.projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Mapping items supplier untuk tampilan teks di textarea (selectedItems)
        const supplierItems = resSQ.data.items || [];
        const itemNamesString = supplierItems.length > 0 
          ? supplierItems.map(item => `- ${item.itemName} (${item.quantity} ${item.unit})`).join('\n')
          : 'Tidak ada item ditemukan';

        // 3. Update Form Data (PENTING: items: supplierItems dimasukkan agar data array ikut tersimpan)
        setFormData(prev => ({
  ...prev,
  // Ambil nama project asli dari database Project
  projectName: resProject.data.projectName || 'Tanpa Nama Project', 
  clientName: resProject.data.clientName || 'N/A',
  selectedItems: itemNamesString,
  items: supplierItems,
  topOption: resSQ.data.topOption || 'COD'
}));

      } catch (err) {
        console.error("Error fetching project/supplier details:", err);
        // Fallback jika data supplier belum ada tapi data project berhasil ditarik
        setFormData(prev => ({ 
          ...prev, 
          selectedItems: 'Belum ada penawaran supplier untuk project ini.',
          items: [] 
        }));
      } finally {
        setFetching(false);
      }
    };
    
    fetchAllDetails();
  }, [formData.projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clientPrice') {
      const rawValue = value.replace(/\./g, '');
      setFormData((prev) => ({ ...prev, [name]: rawValue }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/client_quotation', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ 
        icon: 'success', 
        title: 'QUOTATION CREATED', 
        text: 'Client Quotation BJK Berhasil Disimpan!',
        confirmButtonColor: '#0f172a'
      });
      navigate('/dashboard');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'FAILED', text: 'Gagal simpan quotation!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* SUB-HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Create <span className="text-indigo-600">Quotation</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Marketing Module • Revenue Generation</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-6xl space-y-10">
          
          {/* SECTION 1: SELECTION */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Project Source
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Select Project BJK</label>
                <select 
                  name="projectId" 
                  required 
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm cursor-pointer" 
                  onChange={handleChange}
                >
                  <option value="">-- Cari Project ID --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p.projectId}>{p.projectId} - {p.projectName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Quotation Date</label>
                <input type="text" value={formData.timestamp} readOnly className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: AUTO-FILL DATA */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02. Data Acquisition
            </h3>
            <div className={`p-6 rounded-2xl border-2 transition-all ${fetching ? 'bg-slate-100 animate-pulse border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Client Name</label>
                  <input type="text" value={formData.clientName} readOnly className="w-full bg-transparent font-black text-slate-800 text-xl outline-none" placeholder="Auto-filled..." />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Items from Supplier (Auto-Merge)</label>
                  <textarea 
                    value={formData.selectedItems} 
                    readOnly 
                    className="w-full bg-transparent font-bold text-slate-600 outline-none h-24 resize-none italic text-sm" 
                    placeholder="Technical specs will appear here..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PRICING */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 03. Commercials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Currency</label>
                <select name="currency" className="w-full p-3 border border-slate-300 rounded-xl bg-white font-black text-indigo-600 outline-none cursor-pointer" onChange={handleChange} value={formData.currency}>
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 italic underline decoration-green-500/30">Sales Price to Client</label>
                <input 
                  name="clientPrice" 
                  type="text" 
                  required 
                  placeholder="0" 
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-black text-3xl text-green-600 focus:border-green-500 shadow-sm" 
                  value={formatRupiah(formData.clientPrice)} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-8 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-10 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'GENERATING...' : 'Generate Client Quotation'}
            </button>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddClientQuotation;