import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddClientQuotation = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    quotationId: `CQ-${Date.now()}`, 
    projectId: '',
    clientName: '', 
    selectedItems: '', // Ini bakal keisi otomatis dari Supplier Quote
    currency: 'IDR',
    clientPrice: '',
    topOption: 'COD',
    timestamp: new Date().toISOString().split('T')[0]
  });

  // Fetch List Project BJK
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        console.error("Gagal load project");
      }
    };
    fetchProjects();
  }, []);

  // LOGIC AUTO-FILL (Trigger saat Project ID dipilih)
  useEffect(() => {
    if (!formData.projectId) return;

    const fetchDetail = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/project/${formData.projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update form dengan data gabungan dari Backend
        setFormData(prev => ({
          ...prev,
          clientName: res.data.clientName || 'N/A',
          selectedItems: res.data.itemsFromSQ // Ngambil data merger tadi
        }));
      } catch (err) {
        console.error("Gagal tarik detail BJK");
      } finally {
        setFetching(false);
      }
    };
    fetchDetail();
  }, [formData.projectId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/client_quotation', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Client Quotation BJK Berhasil Disimpan!");
      navigate('/dashboard');
    } catch (err) {
      alert("Gagal simpan quotation!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-700 p-8 text-white">
          <h1 className="text-3xl font-black uppercase italic">Client Quotation (BJK)</h1>
          <p className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">Revenue Generation Module</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Select Project BJK</label>
              <select name="projectId" required className="w-full p-4 border-2 rounded-2xl font-bold focus:border-indigo-500 outline-none" onChange={handleChange}>
                <option value="">-- Cari Project ID --</option>
                {projects.map(p => <option key={p._id} value={p.projectId}>{p.projectId} - {p.projectName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
              <input type="text" value={formData.timestamp} readOnly className="w-full p-4 bg-slate-100 border rounded-2xl font-bold text-slate-500" />
            </div>
          </div>

          {/* AUTO-FILL MERGER AREA */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${fetching ? 'bg-slate-100 animate-pulse' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className="space-y-1 mb-4">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Client Name (Auto)</label>
              <input type="text" value={formData.clientName} readOnly className="w-full bg-transparent font-black text-indigo-900 text-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Items from Supplier Quotation (Auto-Merge)</label>
              <textarea value={formData.selectedItems} readOnly className="w-full bg-transparent font-bold text-indigo-800 outline-none h-16 resize-none italic" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</label>
              <select name="currency" className="w-full p-4 border rounded-2xl font-bold" onChange={handleChange}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Sales Price to Client</label>
              <input name="clientPrice" type="number" required placeholder="0.00" className="w-full p-4 border-2 border-green-100 rounded-2xl font-black text-3xl text-green-600 focus:border-green-500 outline-none" onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full p-6 rounded-3xl font-black text-white shadow-xl ${loading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-800 transition-all'}`}>
            {loading ? 'PROCESSING...' : 'GENERATE CLIENT QUOTATION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddClientQuotation;