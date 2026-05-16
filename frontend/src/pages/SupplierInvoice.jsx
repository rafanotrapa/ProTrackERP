import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Upload, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const InvoiceSubmission = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availablePOs, setAvailablePOs] = useState([]); 
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Menyimpan PO yang sedang dipilih beserta list termin pembayarannya
  const [selectedPO, setSelectedPO] = useState(null); 
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    submissionId: `SUB-${Date.now()}`,
    poId: '',          
    poNumber: '',      
    projectId: '',
    vendorName: '',
    currency: 'IDR',
    terminName: 'Full Payment',
    invoiceNumber: '',
    amount: '',
    remarks: '',
    file: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/po', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Narik SEMUA PO tanpa filter QC, jadi Procurement bisa langsung submit tagihan (DP/Full)
        setAvailablePOs(res.data || []);
      } catch (err) {
        console.error("Gagal load data PO:", err);
      }
    };
    fetchData();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return availablePOs.filter(po => 
      `${po.poNumber || ''} ${po.projectId || ''} ${po.vendorId?.vendorName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availablePOs, searchTerm]);

  const handleSelect = (po) => {
    setSelectedPO(po);
    
    // PENANGKAL GHOST DATA: Pastikan topOption aman dari undefined
    const safeTopOption = po.topOption || '';
    
    // Cek apakah PO ini pakai Termin Dinamis
    const isTermin = safeTopOption === 'Termin' || safeTopOption.includes('DP');
    const firstTermin = isTermin && po.paymentTerms && po.paymentTerms.length > 0 ? po.paymentTerms[0] : null;

    setFormData((prev) => ({
      ...prev,
      poId: po._id,
      poNumber: po.poNumber || '',
      projectId: po.projectId || '',
      vendorName: po.vendorId?.vendorName || po.vendorId || 'Unknown Vendor',
      currency: po.currency || 'IDR',
      terminName: isTermin ? (firstTermin ? firstTermin.description : 'Termin') : 'Full Payment',
      amount: isTermin ? (firstTermin ? firstTermin.amount : (po.totalAmount || 0)) : (po.totalAmount || 0)
    }));
    
    setOpenDropdown(false);
    setSearchTerm('');
  };

  // Jika user ganti pilihan termin di UI
  const handleTerminChange = (e) => {
    const selectedDesc = e.target.value;
    const selectedTerminObj = selectedPO.paymentTerms.find(t => t.description === selectedDesc);
    
    setFormData(prev => ({
        ...prev,
        terminName: selectedDesc,
        amount: selectedTerminObj ? selectedTerminObj.amount : prev.amount
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/')) {
        Swal.fire('ERROR', 'Hanya dokumen/gambar yang diperbolehkan!', 'error');
        return;
      }
      setFormData({ ...formData, file: selectedFile });
    }
  };

  const formatRupiah = (value) => {
    if (!value && value !== 0) return '';
    let numberString = value.toString().replace(/[^0-9]/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return Swal.fire('MISSING FILE', 'Upload scan invoice supplier dulu!', 'warning');
    if (!formData.poId) return Swal.fire('WARNING', 'Pilih referensi Purchase Order!', 'warning');

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if (key === 'file') {
            data.append(key, formData[key]);
        } else {
            data.append(key, formData[key] || '');
        }
    });

    try {
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:5000/api/supplier_invoices', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({ 
        icon: 'success', 
        title: 'SUBMITTED', 
        text: 'Data tagihan sudah diteruskan ke Finance.',
        confirmButtonColor: '#0f172a'
      });
      navigate('/dashboard');
    } catch (err) {
      console.error("FULL ERROR TRACE:", err);
      let errorMessage = "Error tidak diketahui.";
      if (err.response) {
          errorMessage = err.response.data?.msg || JSON.stringify(err.response.data);
      } else if (err.request) {
          errorMessage = "Network Error: Tidak bisa terhubung ke server Backend.";
      } else {
          errorMessage = err.message;
      }
      Swal.fire('ERROR TRACER', `Detail: ${errorMessage}`, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 group transition-all">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Invoice <span className="text-indigo-600">Submission</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Procurement • Forward Billing to Finance</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <form onSubmit={handleSubmit} className="max-w-none w-full space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* LEFT COLUMN: BILLING DATA */}
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 01. Billing Reference</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* PO DROP (SEARCHABLE) */}
                  <div className="space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none">Purchase Order Reference</label>
                    <div onClick={() => setOpenDropdown(!openDropdown)} className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm">
                      <span className="truncate">{formData.poNumber ? `${formData.poNumber} - ${formData.vendorName}` : '-- Select PO Target --'}</span>
                      <span className={`text-[8px] transition-transform ${openDropdown ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    {openDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 bg-slate-50 border-b relative">
                          <input type="text" placeholder="Search PO or Vendor..." className="w-full p-2 pl-8 text-xs outline-none font-bold italic bg-white border rounded-lg focus:border-indigo-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                          <Search size={14} className="absolute left-7 top-7 text-slate-400" />
                        </div>
                        <ul className="max-h-56 overflow-y-auto">
                          {filteredOptions.length > 0 ? filteredOptions.map(po => (
                            <li 
                              key={po._id} 
                              onMouseDown={() => handleSelect(po)} // Menggunakan onMouseDown untuk mencegah race condition dengan blur
                              className="px-5 py-4 hover:bg-indigo-600 group cursor-pointer transition-all border-b border-slate-50 last:border-none"
                            >
                              <p className="text-[10px] font-black text-indigo-600 group-hover:text-white uppercase italic">{po.poNumber}</p>
                              <p className="text-xs font-black text-slate-800 group-hover:text-white uppercase truncate">{po.vendorId?.vendorName || 'Unknown'} (Proj: {po.projectId})</p>
                            </li>
                          )) : <li className="px-5 py-6 text-center text-[10px] font-bold text-slate-400 uppercase">No PO Found</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none">Vendor (Autofill)</label>
                    <input value={formData.vendorName || ''} readOnly className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-400 outline-none italic cursor-not-allowed" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none">Currency</label>
                    <input value={formData.currency} readOnly className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-400 outline-none cursor-not-allowed text-center" />
                  </div>
                </div>

                {/* --- SELEKSI TERMIN PEMBAYARAN (MUNCUL JIKA PO PAKAI TERMIN) --- */}
                {selectedPO && selectedPO.paymentTerms && selectedPO.paymentTerms.length > 0 && (
                  <div className="space-y-1 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                     <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none">Pilih Termin Pembayaran</label>
                     <select 
                        value={formData.terminName}
                        onChange={handleTerminChange}
                        className="w-full p-3 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer shadow-sm"
                     >
                        {selectedPO.paymentTerms.map((term, i) => (
                          <option key={i} value={term.description} disabled={term.status === 'Invoiced'}>
                             {term.description} - {formData.currency} {formatRupiah(term.amount)} {term.status === 'Invoiced' ? '(Sudah Ditagih)' : ''}
                          </option>
                        ))}
                     </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none text-nowrap">Supp. Invoice Number</label>
                    <input required value={formData.invoiceNumber} placeholder="INV-001/BJK/2026" onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all shadow-sm italic" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none">Billing Amount</label>
                    <input 
                      type="text" 
                      required 
                      value={formatRupiah(formData.amount)} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/[^0-9]/g, '')})} 
                      className={`w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-black text-xl outline-none focus:border-indigo-600 shadow-sm text-right ${selectedPO && selectedPO.paymentTerms?.length > 0 ? 'text-amber-600' : 'text-indigo-600'}`} 
                    />
                  </div>
                </div>

                {/* REMARKS */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block font-bold leading-none">Internal Notes</label>
                  <textarea value={formData.remarks} placeholder="Catatan untuk Finance: misal tagihan termin 1..." onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl h-20 outline-none focus:border-indigo-600 shadow-sm transition-all font-medium text-slate-600 text-sm" />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DOCUMENT UPLOAD */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 02. Digital Evidence</h3>
              <div className="relative h-full min-h-[300px]">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                <div className={`h-full border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 ${formData.file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-indigo-300 group'}`}>
                  {formData.file ? (
                    <div className="text-center animate-in zoom-in duration-300">
                      <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
                        <CheckCircle2 className="text-white" size={40} />
                      </div>
                      <p className="text-sm font-black text-slate-800 uppercase italic truncate max-w-[250px] mx-auto">{formData.file.name}</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase mt-2 underline">Change File</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 group-hover:scale-110 transition-transform shadow-sm">
                        <Upload size={40} />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase italic tracking-tighter">Click or Drop Invoice Scan</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 italic tracking-widest">PDF, JPG, PNG Only</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTION */}
          <div className="flex justify-between items-center pt-10 border-t border-slate-100">
             <div className="flex items-center gap-3 text-amber-500">
                <AlertCircle size={16} />
                <p className="text-[9px] font-black uppercase italic tracking-widest">Finance will verify entry against your document.</p>
             </div>
             <button 
                type="submit" 
                disabled={loading}
                className={`px-16 py-5 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all active:scale-95 italic ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {loading ? 'SYNCING DATA...' : 'FORWARD TO FINANCE →'}
             </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default InvoiceSubmission;