import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddSupplierQuotation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);

  // Generate ID: SQ-YYYYMM-RANDOM
  const generateSQID = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SQ-${yearMonth}-${random}`;
  };

  const [formData, setFormData] = useState({
    quotationId: generateSQID(),
    projectId: '',
    vendorId: '',
    selectedItems: '', 
    cogs: '',
    topOption: 'COD',
    remarks: '',
    document: null 
  });

  // Fetch data Master untuk Dropdown
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [resProj, resVend, resItem] = await Promise.all([
          axios.get('http://localhost:5000/api/project', { headers }),
          axios.get('http://localhost:5000/api/vendor', { headers }),
          axios.get('http://localhost:5000/api/item', { headers })
        ]);
        setProjects(resProj.data);
        setVendors(resVend.data);
        setItems(resItem.data);
      } catch (err) {
        console.error("Gagal load master data:", err.response?.config?.url || err.message);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, document: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('quotationId', formData.quotationId);
    data.append('projectId', formData.projectId);
    data.append('vendorId', formData.vendorId);
    data.append('selectedItems', formData.selectedItems);
    data.append('cogs', formData.cogs);
    data.append('topOption', formData.topOption);
    data.append('remarks', formData.remarks);
    if (formData.document) {
      data.append('document', formData.document);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/supplier_quotation', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      alert("Supplier Quotation Berhasil Disimpan!");
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Gagal simpan quotation bre!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-teal-600 p-8 text-white">
          <button onClick={() => navigate('/dashboard')} className="text-teal-100 text-xs font-bold uppercase mb-4 block">← Back</button>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Supplier Quotation Input</h1>
          <p className="text-sm opacity-80 font-bold tracking-widest">Procurement Module • COGS Analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Quotation ID</label>
              <input type="text" readOnly value={formData.quotationId} className="w-full p-3 bg-slate-100 border rounded-xl font-mono text-teal-700 font-bold outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Project ID (Target)</label>
              <select name="projectId" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" onChange={handleChange}>
                <option value="">-- Pilih Project --</option>
                {projects.map(p => <option key={p._id} value={p.projectId}>{p.projectId} - {p.projectName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier / Vendor</label>
              <select name="vendorId" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" onChange={handleChange}>
                <option value="">-- Pilih Supplier --</option>
                {vendors.map(v => <option key={v._id} value={v.vendorId}>{v.vendorName}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier TOP Option</label>
              <select name="topOption" className="w-full p-3 border rounded-xl outline-none" onChange={handleChange}>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Termin 30 Days">Termin 30 Days</option>
                <option value="Termin 60 Days">Termin 60 Days</option>
                <option value="DP 50%">DP 50%</option>
              </select>
            </div>
          </div>

                    <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Items selection</label>
            <select name="selectedItems" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" onChange={handleChange}>
                <option value="">-- Pilih Barang --</option>
                {items.map(i => (
                  // Cukup tampilin nama barangnya aja bre
                  <option key={i._id} value={i.itemName}>{i.itemName}</option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">COGS (Supplier Price)</label>
              <input name="cogs" type="number" required placeholder="Input harga penawaran supplier" className="w-full p-3 border rounded-xl outline-none font-bold text-teal-600" onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Quotation Document (PDF/IMG)</label>
              <input type="file" accept="image/*,application/pdf" className="w-full p-2 text-xs border border-dashed rounded-lg" onChange={handleFileChange} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Quotation Remarks</label>
            <textarea name="remarks" placeholder="Catatan tambahan penawaran..." className="w-full p-3 border rounded-xl h-24 outline-none" onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading} className={`w-full p-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {loading ? 'UPLOADING DATA...' : 'SUBMIT SUPPLIER QUOTATION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierQuotation;