import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddItem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Material', 
    unit: 'Pcs',
    specifications: ''    
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/item', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'MASTER SAVED',
        text: `Item ${formData.itemName} successfully added to catalog.`,
        confirmButtonColor: '#0f172a'
      });
      navigate('/existing-items'); // Gue arahin ke list item biar lo bisa liat hasilnya
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'ERROR',
        text: err.response?.data?.msg || "Gagal simpan item bre!"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      {/* SUB-HEADER (FULL WIDTH) */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/vendor')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Master <span className="text-indigo-600">Item</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Catalog Management</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        {/* max-w-none biar spacenya keisi semua Fa */}
        <form onSubmit={handleSubmit} className="max-w-none w-full space-y-12">
          
          {/* SECTION 1: BASIC INFO */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Item Definition
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Item Name</label>
                <input 
                  name="itemName" 
                  required 
                  placeholder="e.g. Spectrum Analyzer X-100"
                  onChange={handleChange} 
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Category</label>
                <select 
                  name="category" 
                  onChange={handleChange} 
                  value={formData.category}
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm cursor-pointer"
                >
                  <option value="Material">Material</option>
                  <option value="Jasa">Jasa</option>
                  <option value="Tools">Tools</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: SPECIFICATIONS */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02. Technical Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Unit Measurement</label>
                <input 
                  name="unit" 
                  placeholder="Pcs / Lot / Set"
                  onChange={handleChange} 
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-sm transition-all" 
                />
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Specifications & Notes</label>
                <textarea 
                  name="specifications" 
                  placeholder="Detail spek barang, dimensi, atau kapasitas..."
                  onChange={handleChange} 
                  className="w-full p-5 bg-white border border-slate-300 rounded-2xl h-32 outline-none font-medium text-slate-700 focus:border-indigo-600 shadow-sm transition-all" 
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-12 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'STORING DATA...' : 'SAVE MASTER ITEM →'}
            </button>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddItem;