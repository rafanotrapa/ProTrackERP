import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { currencyList } from '../utils/currencies';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Custom Dropdown States
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const formatRupiah = (value) => {
    if (!value) return '';
    let numberString = value.toString().replace(/[^0-9]/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

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
    clientCompany: '',  // 🆕 PT Tujuan (opsional)
    clientName: '',
    clientContact: '',
    clientAddress: '',
    amount: '',
    currency: 'IDR',
    description: '',
    quotationMode: 'auto'
  });

  // Validasi form - cek semua field wajib terisi
  const isFormValid = () => {
    return (
      formData.projectName.trim() !== '' &&
      formData.institutionName.trim() !== '' &&
      formData.clientName.trim() !== '' &&
      formData.clientContact.trim() !== '' &&
      formData.clientAddress.trim() !== '' &&
      formData.amount !== '' && 
      Number(formData.amount) > 0
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Khusus untuk clientContact (nomor telepon) - hanya angka dan + (plus)
    if (name === 'clientContact') {
      const phoneRegex = /^[0-9+\s]*$/;
      if (phoneRegex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    // Khusus untuk amount (hanya angka)
    if (name === 'amount') {
      const rawValue = value.replace(/\./g, '');
      setFormData((prev) => ({ ...prev, [name]: rawValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectCurrency = (code) => {
    setFormData(prev => ({ ...prev, currency: code }));
    setIsCurrencyOpen(false);
    setSearchTerm('');
  };

  const filteredCurrencies = currencyList.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'INCOMPLETE DATA', 
        text: 'Please fill in all required fields (Project Name, Institution, PIC Name, Contact, Address, and Amount)!',
        confirmButtonColor: '#0f172a' 
      });
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/project', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      Swal.fire({ 
        icon: 'success', 
        title: 'SAVED', 
        text: `Project ${formData.projectId} Recorded.`, 
        confirmButtonColor: '#0f172a' 
      });
      navigate('/dashboard');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ERROR', text: 'Database sync failed.' });
    } finally { setLoading(false); }
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Add <span className="text-indigo-600">Project</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Marketing Module • Create Record</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-6xl space-y-10">
          
          {/* SECTION 1: IDENTITY */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Project ID</label>
                <input type="text" readOnly value={formData.projectId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-600 font-bold outline-none shadow-sm" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input name="projectName" type="text" required placeholder="Enter project name..." 
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-800" 
                  value={formData.projectName} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SECTION 2: CLIENT */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02. Client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input name="institutionName" type="text" required placeholder="BIN / TNI / Polri..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all shadow-sm" 
                  value={formData.institutionName} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Client Company <span className="text-slate-400 text-[8px] ml-1">(Opsional)</span>
                </label>
                <input name="clientCompany" type="text" placeholder="PT. Maju Jaya / CV. Karya Abadi..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all shadow-sm" 
                  value={formData.clientCompany} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  PIC Name <span className="text-red-500">*</span>
                </label>
                <input name="clientName" type="text" required placeholder="Contact person name..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all shadow-sm" 
                  value={formData.clientName} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input 
                  name="clientContact" 
                  type="tel" 
                  required 
                  placeholder="+62 812 3456 7890"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all shadow-sm" 
                  value={formData.clientContact} 
                  onChange={handleChange}
                />
                <p className="text-[8px] text-slate-400 mt-1">Only numbers, spaces, and + symbol allowed</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input name="clientAddress" type="text" required placeholder="Full logistics address..." 
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-700 shadow-sm focus:border-indigo-600 transition-all" 
                  value={formData.clientAddress} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SECTION 2.5: QUOTATION MODE */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02.5. Quotation Mode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all has-checked:border-indigo-600 has-checked:bg-indigo-50">
                    <input 
                      type="radio" 
                      name="quotationMode" 
                      value="auto" 
                      checked={formData.quotationMode === 'auto'}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div>
                      <p className="font-black text-sm uppercase">Auto Mode</p>
                      <p className="text-[9px] text-slate-500">Beli barang jadi dari 1 supplier</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all has-checked:border-indigo-600 has-checked:bg-indigo-50">
                    <input 
                      type="radio" 
                      name="quotationMode" 
                      value="manual" 
                      checked={formData.quotationMode === 'manual'}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div>
                      <p className="font-black text-sm uppercase">Manual Mode</p>
                      <p className="text-[9px] text-slate-500">Rakit sendiri / multi vendor</p>
                    </div>
                  </label>
                </div>
                <p className="text-[8px] text-slate-400 mt-2 ml-1">
                  {formData.quotationMode === 'auto' 
                    ? '✓ Client Quotation akan otomatis mengambil items dari Supplier Quotation yang sudah di-approve'
                    : '✓ Client Quotation akan menggunakan form manual input items (tanpa tergantung supplier)'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: FINANCE */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 03. Finance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                <div 
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white font-black text-indigo-600 cursor-pointer flex justify-between items-center hover:border-indigo-600 transition-all shadow-sm"
                >
                  <span className="text-sm">{formData.currency}</span>
                  <span className={`text-[8px] transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isCurrencyOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-slate-50 bg-slate-50">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full p-2 text-[10px] border-none bg-white rounded-lg outline-none font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredCurrencies.map((c) => (
                        <li 
                          key={c.code}
                          onClick={() => selectCurrency(c.code)}
                          className="px-4 py-2.5 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center transition-all uppercase"
                        >
                          <span>{c.code} - {c.name}</span>
                          <span className="opacity-40">{c.symbol}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Contract Amount <span className="text-red-500">*</span>
                </label>
                <input 
                  name="amount" 
                  type="text" 
                  required 
                  placeholder="0" 
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none font-black text-2xl text-slate-800 focus:border-indigo-600 shadow-sm" 
                  value={formatRupiah(formData.amount)} 
                  onChange={handleChange} 
                />
                <p className="text-[8px] text-slate-400 mt-1">Numeric characters only (minimum &gt; 0)</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Requirements</label>
              <textarea name="description" placeholder="Project scope, delivery notes, etc..." 
                className="w-full p-4 bg-white border border-slate-300 rounded-2xl h-24 outline-none text-sm font-medium text-slate-700 focus:border-indigo-600 transition-all shadow-sm" 
                value={formData.description} onChange={handleChange} />
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading || !isFormValid()}
              className={`px-10 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading || !isFormValid() ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'SAVING...' : 'Save Project →'}
            </button>
          </div>

          {/* INFO BANNER */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              All fields marked with <span className="text-red-500">*</span> are required before submission.
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddProject;