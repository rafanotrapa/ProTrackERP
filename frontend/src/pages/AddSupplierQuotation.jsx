import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Trash2, Info, Truck, Receipt } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddSupplierQuotation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);

  const [openDropdown, setOpenDropdown] = useState(null); 
  const [searchTerms, setSearchTerms] = useState({ project: '' });
  const dropdownRef = useRef(null);

  const generateSQID = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SQ-${yearMonth}-${random}`;
  };

  const formatRupiah = (value) => {
    if (!value && value !== 0) return '';
    let numberString = value.toString().replace(/[^0-9]/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [formData, setFormData] = useState({
    quotationId: generateSQID(),
    projectId: '',
    vendorId: '', 
    currency: 'IDR',
    topOption: 'Termin 30 Days',
    customTop: '',
    additionalFee: '', 
    additionalFeeRemarks: '', 
    isTaxIncluded: false, 
    taxPercentage: '',
    remarks: '',
    document: null 
  });

  const [quotationItems, setQuotationItems] = useState([
    { itemName: '', quantity: 1, unit: 'Pcs', cogs: '' }
  ]);

  const calculateEffectiveCogsPreview = () => {
    const subTotal = calculateSubTotal();
    const addFee = Number(formData.additionalFee) || 0;
    const taxNominal = calculateTaxNominal();
    const grandTotal = subTotal + addFee + taxNominal;
    
    if (subTotal === 0 || quotationItems.length === 0) return [];
    
    return quotationItems.map(item => {
      const itemSubtotal = (item.cogs || 0) * (item.quantity || 1);
      const proportion = itemSubtotal / subTotal;
      const allocatedCost = grandTotal * proportion;
      const newCogsPerUnit = allocatedCost / (item.quantity || 1);
      return {
        ...item,
        effectiveCogs: Math.round(newCogsPerUnit),
        originalCogs: item.cogs || 0
      };
    });
  };

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

  const filteredProjects = useMemo(() => 
    projects.filter(p => `${p.projectId || ''} ${p.projectName || ''}`.toLowerCase().includes((searchTerms.project || '').toLowerCase())),
  [projects, searchTerms.project]);

  const handleProjectSelect = (pId) => {
    const linkedVendor = vendors.find(v => v.projectId === pId && v.approvalStatus === 'Approved');

    setFormData(prev => ({
      ...prev,
      projectId: pId,
      vendorId: linkedVendor ? linkedVendor.vendorId : ''
    }));

    setOpenDropdown(null);
    setSearchTerms({ project: '' });

    if (!linkedVendor) {
      Swal.fire({
        icon: 'info',
        title: 'NO VENDOR LINKED',
        text: 'Project ini belum memiliki Supplier yang diverifikasi Management.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...quotationItems];

    if (name === 'cogs') {
      const rawValue = value.replace(/\./g, '');
      updatedItems[index][name] = rawValue ? Number(rawValue) : '';
    } else if (name === 'quantity') {
      updatedItems[index][name] = value ? Number(value) : '';
    } else {
      updatedItems[index][name] = value;
    }
    
    setQuotationItems(updatedItems);
  };

  const addItemRow = () => {
    setQuotationItems([...quotationItems, { itemName: '', quantity: 1, unit: 'Pcs', cogs: '' }]);
  };

  const removeItemRow = (index) => {
    const updatedItems = [...quotationItems];
    updatedItems.splice(index, 1);
    setQuotationItems(updatedItems);
  };

  const handleFileChange = (e) => setFormData({ ...formData, document: e.target.files[0] });

  const calculateSubTotal = () => {
    return quotationItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cogs || 0)), 0);
  };

  const calculateTaxNominal = () => {
    const subTotal = calculateSubTotal();
    const taxPerc = formData.isTaxIncluded ? (Number(formData.taxPercentage) || 0) : 0;
    return subTotal * (taxPerc / 100);
  };

  const calculateGrandTotal = () => {
    const subTotal = calculateSubTotal();
    const addFee = Number(formData.additionalFee) || 0;
    const taxNominal = calculateTaxNominal();
    return subTotal + addFee + taxNominal;
  };

  const effectiveItems = calculateEffectiveCogsPreview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.vendorId) {
       return Swal.fire('Warning', 'Project dan Vendor harus lengkap!', 'warning');
    }

    if (formData.isTaxIncluded && (!formData.taxPercentage || Number(formData.taxPercentage) <= 0)) {
       return Swal.fire('Data Incomplete', 'Persentase Pajak wajib diisi jika opsi PPN diaktifkan!', 'warning');
    }

    if (formData.topOption === 'Termin' && !formData.customTop) {
       return Swal.fire('Data Incomplete', 'Harap isi detail termin pembayaran!', 'warning');
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if(key !== 'additionalFee' && key !== 'taxPercentage' && key !== 'isTaxIncluded' && key !== 'document') {
            data.append(key, formData[key]);
        }
    });
    
    data.append('additionalFee', formData.additionalFee || 0);
    data.append('taxPercentage', formData.taxPercentage || 0);
    data.append('isTaxIncluded', formData.isTaxIncluded);
    data.append('items', JSON.stringify(quotationItems));
    if (formData.document) {
        data.append('document', formData.document);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/supplier_quotation', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire({ icon: 'success', title: 'SAVED', text: 'Quotation recorded. Database updated.', confirmButtonColor: '#0f172a' });
      navigate('/dashboard'); 
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ERROR', text: err.response?.data?.msg || "Gagal simpan quotation!" });
    } finally { setLoading(false); }
  };

  const hasAdditionalFee = Number(formData.additionalFee) > 0;
  const hasTax = formData.isTaxIncluded && Number(formData.taxPercentage) > 0;

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
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-12">
          
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
              <Info size={12}/>
              COGS akan otomatis terdistribusi dengan Additional Fee dan Pajak di sistem Marketing.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 01. Source Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">SQ ID</label>
                <input type="text" readOnly value={formData.quotationId} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-600 font-bold outline-none" />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Linked Project</label>
                <div onClick={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 flex justify-between items-center cursor-pointer hover:border-indigo-600 transition-all shadow-sm">
                  <span className="truncate">{projects.find(p => p.projectId === formData.projectId)?.projectName || '-- Select Project --'}</span>
                  <span className={`text-[8px] transition-transform ${openDropdown === 'project' ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {openDropdown === 'project' && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    <input type="text" placeholder="Search Project..." className="w-full p-3 text-xs border-b outline-none font-bold" value={searchTerms.project} onChange={(e) => setSearchTerms({...searchTerms, project: e.target.value})} autoFocus />
                    <ul className="max-h-48 overflow-y-auto">
                      {filteredProjects.map(p => (
                        <li key={p._id} onClick={() => handleProjectSelect(p.projectId)} className="px-4 py-3 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer transition-all uppercase">{p.projectId} - {p.projectName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Currency</label>
                <select 
                  name="currency" 
                  className="w-full p-3.5 border border-indigo-200 rounded-xl bg-indigo-50 font-black text-indigo-600 outline-none cursor-pointer" 
                  value={formData.currency} 
                  onChange={handleChange}
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Auto-Mapped Supplier</label>
                <div className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 shadow-inner cursor-not-allowed flex items-center">
                  <span className="truncate">
                    {formData.vendorId 
                      ? vendors.find(v => v.vendorId === formData.vendorId)?.vendorName || formData.vendorId 
                      : '-- Auto Fill from Project --'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 02. Goods & Commercials</h3>
            
            <div className="space-y-4">
              {quotationItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl items-end relative transition-all hover:border-indigo-300">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Item Name</label>
                    <input list={`item-list-${index}`} name="itemName" value={item.itemName} onChange={(e) => handleItemChange(index, e)} required placeholder="Ketik nama barang..." className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-indigo-600 shadow-sm" />
                    <datalist id={`item-list-${index}`}>
                      {items.map(i => <option key={i._id} value={i.itemName} />)}
                    </datalist>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Qty</label>
                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} min="1" required className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-indigo-600 shadow-sm"/>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">UoM</label>
                    <input name="unit" value={item.unit} onChange={(e) => handleItemChange(index, e)} required placeholder="Pcs/Lot" className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-indigo-600 shadow-sm"/>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Harga/Unit ({formData.currency})</label>
                    <input type="text" name="cogs" value={formatRupiah(item.cogs)} onChange={(e) => handleItemChange(index, e)} required placeholder="0" className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm font-black text-indigo-600 outline-none focus:border-indigo-600 shadow-sm"/>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Total ({formData.currency})</label>
                    <input type="text" readOnly value={formatRupiah((item.quantity || 0) * (item.cogs || 0))} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-sm font-black text-slate-500 outline-none cursor-not-allowed shadow-inner" />
                  </div>
                  <div className="md:col-span-1 flex justify-center pb-1">
                    {quotationItems.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(index)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItemRow} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-colors mt-2 ml-1">
              <Plus size={14} strokeWidth={3} /> Add Another Item
            </button>

            <div className="flex flex-col items-end mt-8 space-y-5 bg-white p-6 md:p-8 border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex justify-between items-center w-full md:w-2/3 lg:w-1/2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Subtotal (Item)</span>
                <span className="text-sm font-bold text-slate-600">{formData.currency} {formatRupiah(calculateSubTotal())}</span>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center w-full md:w-2/3 lg:w-1/2 gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input 
                    type="checkbox" 
                    id="ppnCheckbox"
                    checked={formData.isTaxIncluded} 
                    onChange={(e) => setFormData({ ...formData, isTaxIncluded: e.target.checked, taxPercentage: e.target.checked ? formData.taxPercentage : '' })} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="ppnCheckbox" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic cursor-pointer flex items-center gap-1">
                    <Receipt size={12}/> Include PPN / Pajak
                  </label>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-1/2 justify-end">
                  {formData.isTaxIncluded && (
                    <span className="text-[10px] font-black text-slate-400 italic">
                      (+ {formData.currency} {formatRupiah(calculateTaxNominal())})
                    </span>
                  )}
                  <div className="relative w-24">
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      disabled={!formData.isTaxIncluded}
                      value={formData.taxPercentage} 
                      onChange={(e) => setFormData({...formData, taxPercentage: e.target.value})} 
                      placeholder="%" 
                      className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-600 outline-none focus:border-indigo-600 text-right shadow-inner transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-end md:items-center w-full md:w-2/3 lg:w-1/2 gap-3">
                <div className="flex flex-col w-full md:w-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1 flex items-center gap-1">
                    <Truck size={12}/> Additional Fee <span className="text-slate-300 font-medium normal-case">(Opsional)</span>
                  </span>
                  <input 
                    type="text" 
                    value={formData.additionalFeeRemarks}
                    onChange={(e) => setFormData({...formData, additionalFeeRemarks: e.target.value})}
                    placeholder="Keterangan (ex: Ongkir)"
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-600 transition-all"
                  />
                </div>
                <input 
                  type="text" 
                  value={formatRupiah(formData.additionalFee)} 
                  onChange={(e) => setFormData({...formData, additionalFee: e.target.value.replace(/[^0-9]/g, '')})} 
                  placeholder="Nominal Fee" 
                  className="w-full md:w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-600 outline-none focus:border-indigo-600 text-right shadow-inner transition-all"
                />
              </div>

              <div className="w-full md:w-2/3 lg:w-1/2 h-px bg-slate-200 my-2"></div>

              <div className="flex justify-between items-center w-full md:w-2/3 lg:w-1/2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest italic">Grand Total</span>
                <span className="text-xl font-black text-indigo-600 tracking-tight">{formData.currency} {formatRupiah(calculateGrandTotal())}</span>
              </div>
            </div>

            {(hasAdditionalFee || hasTax) && calculateSubTotal() > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info size={12}/>
                  Preview COGS Setelah Distribusi (yang akan dilihat Marketing)
                </p>
                <div className="space-y-2">
                  {effectiveItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{item.itemName || `Item ${idx + 1}`}</span>
                      <div className="flex gap-4">
                        <span className="text-slate-400 line-through">{formData.currency} {formatRupiah(item.originalCogs)}/unit</span>
                        <span className="font-black text-emerald-600">→ {formData.currency} {formatRupiah(item.effectiveCogs)}/unit (all-in)</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-slate-500 mt-3 italic">
                  *Additional Fee dan Pajak akan didistribusikan secara proporsional ke setiap item.
                </p>
              </div>
            )}
            
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 03. Documentation & Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Term of Payment (TOP) <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select name="topOption" className="flex-1 p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 shadow-sm cursor-pointer" onChange={handleChange} value={formData.topOption}>
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="CBD">Cash Before Delivery (CBD)</option>
                      <option value="CIA">Cash in Advance (CIA)</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                      <option value="Net 90">Net 90 Days</option>
                      <option value="Net EOM">Net End of Month (EOM)</option>
                      <option value="2/10 Net 30">2/10 Net 30 (2% Disc/10 Days)</option>
                      <option value="Termin">Custom Cicilan / Termin (Manual)</option>
                    </select>
                    {formData.topOption === 'Termin' && (
                      <input type="text" placeholder="Ex: DP 30%" name="customTop" className="w-1/3 p-3 border-2 border-amber-400 rounded-xl outline-none font-black text-amber-600" onChange={handleChange} value={formData.customTop} required />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Quotation File (PDF/IMG)</label>
                  <div className="relative group">
                    <input type="file" accept="image/*,application/pdf" className="w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl font-bold text-xs text-slate-500 file:hidden cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all" onChange={handleFileChange} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-indigo-500 pointer-events-none group-hover:translate-x-1 transition-all">Upload File →</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Remarks / Notes</label>
                <textarea name="remarks" placeholder="Catatan tambahan untuk management..." className="w-full p-4 bg-white border border-slate-300 rounded-2xl h-full min-h-[120px] outline-none font-medium text-slate-700 focus:border-indigo-600 shadow-sm transition-all" onChange={handleChange} value={formData.remarks} />
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button type="submit" disabled={loading} className={`px-12 py-5 rounded-xl font-black text-white uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200 hover:-translate-y-1'}`}>
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