import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddSupplierQuotation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Master Data States
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);

  // Dropdown UI States
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [searchTerms, setSearchTerms] = useState({ project: '', vendor: '', item: '' });
  const dropdownRef = useRef(null);

  const generateSQID = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SQ-${yearMonth}-${random}`;
  };

  const formatRupiah = (value) => {
    if (!value) return '';
    let numberString = value.toString().replace(/[^0-9]/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [formData, setFormData] = useState({
    quotationId: generateSQID(),
    projectId: '',
    vendorId: '',
    selectedItems: '', 
    cogs: '',
    topOption: 'DP 30%',
    remarks: '',
    document: null 
  });

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
        setProjects(resProj.data || []);
        setVendors(resVend.data || []);
        setItems(resItem.data || []);
      } catch (err) {
        console.error("Gagal load master data:", err.message);
      }
    };
    fetchData();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // LOGIC FILTERING AMAN (ANTI-CRASH)
  const filteredProjects = useMemo(() => 
    projects.filter(p => `${p.projectId || ''} ${p.projectName || ''}`.toLowerCase().includes((searchTerms.project || '').toLowerCase())),
  [projects, searchTerms.project]);

  const filteredVendors = useMemo(() => 
    vendors.filter(v => (v.vendorName || '').toLowerCase().includes((searchTerms.vendor || '').toLowerCase())),
  [vendors, searchTerms.vendor]);

  const filteredItems = useMemo(() => 
    items.filter(i => (i.itemName || '').toLowerCase().includes((searchTerms.item || '').toLowerCase())),
  [items, searchTerms.item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cogs') {
      const rawValue = value.replace(/\./g, '');
      setFormData((prev) => ({ ...prev, [name]: rawValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectOption = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setOpenDropdown(null);
    setSearchTerms({ project: '', vendor: '', item: '' });
  };

  const handleFileChange = (e) => setFormData({ ...formData, document: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/supplier_quotation', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire({ icon: 'success', title: 'SAVED', text: 'Quotation recorded.', confirmButtonColor: '#0f172a' });
      navigate('/dashboard');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ERROR', text: "Gagal simpan quotation!" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Supplier <span className="text-indigo-600">Quotation</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Procurement • COGS Input</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16" ref={dropdownRef}>
        <form onSubmit={handleSubmit} className="max-w-none w-full space-y-12">
          
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 01. Source Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">SQ ID</label>
                <input type="text" readOnly value={formData.quotationId} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-600 font-bold outline-none" />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Project Target</label>
                <div onClick={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm">
                  <span className="truncate">{formData.projectId || '-- Select Project --'}</span>
                  <span className={`text-[8px] transition-transform ${openDropdown === 'project' ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {openDropdown === 'project' && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    <input type="text" placeholder="Search Project..." className="w-full p-3 text-xs border-b outline-none font-bold" value={searchTerms.project} onChange={(e) => setSearchTerms({...searchTerms, project: e.target.value})} autoFocus />
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredProjects.map(p => (
                        <li key={p._id} onClick={() => selectOption('projectId', p.projectId)} className="px-4 py-3 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer transition-all uppercase">{p.projectId} - {p.projectName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Supplier / Vendor</label>
                <div onClick={() => setOpenDropdown(openDropdown === 'vendor' ? null : 'vendor')} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm">
                  <span className="truncate">{vendors.find(v => v.vendorId === formData.vendorId)?.vendorName || '-- Select Supplier --'}</span>
                  <span className={`text-[8px] transition-transform ${openDropdown === 'vendor' ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {openDropdown === 'vendor' && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    <input type="text" placeholder="Search Vendor..." className="w-full p-3 text-xs border-b outline-none font-bold" value={searchTerms.vendor} onChange={(e) => setSearchTerms({...searchTerms, vendor: e.target.value})} autoFocus />
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredVendors.map(v => (
                        <li key={v._id} onClick={() => selectOption('vendorId', v.vendorId)} className="px-4 py-3 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer transition-all uppercase">{v.vendorName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 02. Commercials</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Item Selection</label>
                <div onClick={() => setOpenDropdown(openDropdown === 'item' ? null : 'item')} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm">
                  <span className="truncate">{formData.selectedItems || '-- Select Item --'}</span>
                  <span className={`text-[8px] transition-transform ${openDropdown === 'item' ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {openDropdown === 'item' && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    <input type="text" placeholder="Search Item..." className="w-full p-3 text-xs border-b outline-none font-bold" value={searchTerms.item} onChange={(e) => setSearchTerms({...searchTerms, item: e.target.value})} autoFocus />
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredItems.map(i => (
                        <li key={i._id} onClick={() => selectOption('selectedItems', i.itemName)} className="px-4 py-3 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer transition-all uppercase">{i.itemName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">COGS (Supplier Price)</label>
                <input name="cogs" type="text" required placeholder="0" className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-black text-2xl text-indigo-600 outline-none focus:border-indigo-600 shadow-sm" value={formatRupiah(formData.cogs)} onChange={handleChange} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">TOP Option</label>
                <select name="topOption" className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 cursor-pointer shadow-sm" onChange={handleChange} value={formData.topOption}>
                  <option value="Termin 30 Days">30 Days</option>
                  <option value="Termin 60 Days">60 Days</option>
                  <option value="DP 50%">DP 50%</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 03. Documentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Quotation File (PDF/IMG)</label>
                <div className="relative group">
                  <input type="file" accept="image/*,application/pdf" className="w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl font-bold text-xs text-slate-400 file:hidden cursor-pointer hover:border-indigo-400 transition-all" onChange={handleFileChange} />
                  <div className="absolute right-4 top-4 text-[10px] font-black uppercase text-indigo-500 pointer-events-none group-hover:translate-x-1 transition-all">Upload File →</div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Remarks</label>
                <textarea name="remarks" placeholder="Catatan tambahan..." className="w-full p-4 bg-white border border-slate-300 rounded-2xl h-14 outline-none font-medium text-slate-700 focus:border-indigo-600 shadow-sm transition-all" onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button type="submit" disabled={loading} className={`px-12 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700'}`}>
              {loading ? 'SYNCING...' : 'SUBMIT QUOTATION →'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default AddSupplierQuotation;