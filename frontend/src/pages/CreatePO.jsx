import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CreatePO = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const generatePONumber = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PO-${yearMonth}-${random}`;
  };

  const [formData, setFormData] = useState({
    poNumber: generatePONumber(),
    quotationId: '',
    shippingAddress: '' 
  });

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/supplier_quotation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data);
      } catch (err) {
        console.error("Gagal load Quotation:", err);
      }
    };
    fetchQuotations();
  }, []);

  const handleQuoteChange = (e) => {
    const qId = e.target.value;
    setFormData({ ...formData, quotationId: qId });
    const foundQuote = quotations.find(q => q._id === qId);
    setSelectedQuote(foundQuote || null);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quotationId) return Swal.fire('Warning', 'Pilih Quotation dasar terlebih dahulu!', 'warning');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/po', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({ icon: 'success', title: 'PO ISSUED', text: 'Purchase Order resmi diterbitkan berdasarkan quotation marketing.', confirmButtonColor: '#0f172a' });
      navigate('/dashboard'); 
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ERROR', text: err.response?.data?.msg || "Gagal membuat PO" });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 text-slate-900">
      <Header />
      <div className="flex items-center gap-6 px-8 py-8 w-full border-b bg-slate-50/30 border-slate-200">
        <button onClick={() => navigate('/dashboard')} className="flex justify-center items-center w-12 h-12 bg-white rounded-2xl border transition-all active:scale-90 shadow-sm group border-slate-200 hover:bg-slate-50">
          <span className="text-xl font-black italic transition-colors text-slate-400 group-hover:text-blue-600">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black italic leading-none tracking-tighter uppercase text-slate-900">
            Purchase <span className="text-blue-600">Order</span>
          </h1>
          <p className="mt-1 text-[10px] font-black italic leading-none tracking-[0.2em] uppercase text-slate-400">Procurement • Tied to Client Deal</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <form onSubmit={handleSubmit} className="mx-auto space-y-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT COL: PO DETAILS */}
            <div className="p-8 space-y-6 bg-white border border-slate-200 shadow-sm rounded-4xl h-fit">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-blue-600"></span> 01. Order Identity</h3>
              
              <div className="space-y-1">
                <label className="mb-1.5 ml-1 text-[10px] font-black italic leading-none tracking-widest uppercase text-slate-400">PO Number</label>
                <input type="text" readOnly value={formData.poNumber} className="w-full p-4 font-mono font-bold outline-none bg-slate-50 border-slate-200 rounded-xl text-blue-600" />
              </div>

              <div className="space-y-1">
                <label className="mb-1.5 ml-1 text-[10px] font-black italic leading-none tracking-widest uppercase text-slate-400">Link to Marketing Quotation</label>
                <select name="quotationId" value={formData.quotationId} onChange={handleQuoteChange} required className="w-full p-4 font-bold outline-none transition-all bg-slate-50 border-slate-300 rounded-xl text-slate-800 focus:border-blue-600 focus:bg-white cursor-pointer">
                  <option value="">-- Pilih Quotation Dasar (Deal) --</option>
                  {quotations.map(q => (
                    <option key={q._id} value={q._id}>{q.quotationId} (Project: {q.projectId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="mb-1.5 ml-1 text-[10px] font-black italic leading-none tracking-widest uppercase text-slate-400">Shipping Address / Delivery Target</label>
                <textarea name="shippingAddress" value={formData.shippingAddress} onChange={(e)=>setFormData({...formData, shippingAddress: e.target.value})} required placeholder="Alamat gudang / site proyek..." className="w-full h-32 p-4 font-medium outline-none transition-all bg-slate-50 border-slate-300 rounded-xl text-slate-700 focus:border-blue-600 focus:bg-white" />
              </div>
            </div>

            {/* RIGHT COL: ITEMS PREVIEW DARI QUOTATION */}
            <div className="p-8 bg-slate-900 border border-slate-800 shadow-xl rounded-4xl flex flex-col">
               <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3 italic mb-6"><span className="w-8 h-1 bg-blue-500"></span> 02. Goods Summary</h3>
               {selectedQuote ? (
                 <div className="flex-1 flex flex-col">
                    <div className="mb-6 p-4 bg-slate-800 rounded-xl">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendor ID / Supplier</p>
                       <p className="text-white font-bold">{selectedQuote.vendorId}</p>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-55 pr-2 custom-scrollbar">
                       {selectedQuote.items?.map((item, i) => (
                         <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><ShoppingCart size={16}/></div>
                               <div>
                                  <p className="text-white font-bold text-sm leading-tight">{item.itemName}</p>
                                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-0.5">{item.quantity} {item.unit} • {formatRupiah(item.cogs)}/unit</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-blue-400 font-black text-sm">{formatRupiah(item.quantity * item.cogs)}</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    {/* REKAP TOTAL BESERTA FEE & PPN */}
                    <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
                       <div className="flex justify-between items-center text-slate-400">
                          <p className="text-[10px] font-black uppercase tracking-widest">Subtotal Barang</p>
                          <p className="text-xs font-bold">{formatRupiah(selectedQuote.items?.reduce((sum, item) => sum + (item.cogs * item.quantity), 0))}</p>
                       </div>
                       
                       {/* PPN REVIEW */}
                       {selectedQuote.isTaxIncluded && (
                         <div className="flex justify-between items-center text-slate-300">
                            <p className="text-[10px] font-black uppercase tracking-widest">PPN ({selectedQuote.taxPercentage}%)</p>
                            <p className="text-xs font-bold">+ {formatRupiah(selectedQuote.taxAmount)}</p>
                         </div>
                       )}

                       {/* ADDITIONAL FEE REVIEW */}
                       {selectedQuote.additionalFee > 0 && (
                         <div className="flex justify-between items-center text-amber-500">
                            <p className="text-[10px] font-black uppercase tracking-widest">
                              {selectedQuote.additionalFeeRemarks || 'Additional Fee'}
                            </p>
                            <p className="text-xs font-bold">+ {formatRupiah(selectedQuote.additionalFee)}</p>
                         </div>
                       )}

                       <div className="flex justify-between items-end pt-2 border-t border-slate-700/50 mt-2">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Grand Total</p>
                          <p className="text-2xl font-black text-white italic">
                            {formatRupiah(
                               (selectedQuote.items?.reduce((sum, item) => sum + (item.cogs * item.quantity), 0) || 0) + 
                               (selectedQuote.taxAmount || 0) +
                               (selectedQuote.additionalFee || 0)
                            )}
                          </p>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-black uppercase tracking-widest italic">No Quotation Selected</p>
                    <p className="text-[10px] mt-2 max-w-50 mx-auto">Silakan pilih Quotation Dasar di sebelah kiri untuk melihat daftar barang yang akan di-order.</p>
                 </div>
               )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading || !selectedQuote} className={`px-14 py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-xl ${loading || !selectedQuote ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:-translate-y-1'}`}>
              {loading ? 'PROCESSING...' : 'ISSUE PURCHASE ORDER →'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreatePO;