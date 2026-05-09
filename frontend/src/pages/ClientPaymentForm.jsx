import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  CreditCard, Landmark, ArrowLeft, Upload, 
  ShieldCheck, Hash, Banknote, Loader2, FileText 
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ClientPaymentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    amountPaid: '',
    referenceNumber: '',
    file: null
  });

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/client_invoice/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setInvoice(res.data);
          setFormData(prev => ({ ...prev, amountPaid: res.data.amount || '' }));
        }
      } catch (err) {
        Swal.fire('ERROR', 'Data invoice tidak ditemukan!', 'error');
        navigate('/client-invoice');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoiceData();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return Swal.fire('WAIT!', 'Mohon upload bukti transfer!', 'warning');

    setBtnLoading(true);
    const token = localStorage.getItem('token');
    
    const submitData = new FormData();
    submitData.append('invoiceId', id);
    submitData.append('bankName', formData.bankName);
    submitData.append('amountPaid', formData.amountPaid);
    submitData.append('referenceNumber', formData.referenceNumber);
    submitData.append('file', formData.file);

    try {
      Swal.fire({ 
        title: 'Verifying...', 
        text: 'Sedang mengunggah bukti dan memproses data',
        allowOutsideClick: false, 
        didOpen: () => Swal.showLoading() 
      });
      
      await axios.post('http://localhost:5000/api/client_payment', submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });

      Swal.fire('SUCCESS!', 'Pembayaran Berhasil Diverifikasi', 'success');
      navigate('/client-invoice');
    } catch (err) {
      console.error("Submit Error:", err.response?.data);
      Swal.fire('FAILED', err.response?.data?.msg || 'Gagal verifikasi pembayaran', 'error');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4 uppercase font-black italic text-slate-400 animate-pulse">
      <Loader2 className="animate-spin text-indigo-600" size={48} /> Processing Transaction...
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <Header />
      <main className="flex-1 p-8 md:p-16 flex flex-col lg:flex-row gap-16 max-w-7xl mx-auto w-full">
        <div className="lg:w-2/5 space-y-8">
            <button onClick={() => navigate('/client-invoice')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={14} /> Back to Queue
            </button>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Verify <br /><span className="text-indigo-600">Payment</span></h1>
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20"></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                        <div><p className="text-[10px] font-black uppercase text-slate-400 italic mb-1 tracking-widest">Target Invoice</p><p className="text-2xl font-black italic tracking-tighter">{invoice?.invoiceNumber}</p></div>
                        <CreditCard className="text-indigo-400" size={32} />
                    </div>
                    <div><p className="text-[10px] font-black uppercase text-slate-400 italic mb-1 tracking-widest">Client Name</p><p className="text-xl font-bold uppercase truncate">{invoice?.clientName}</p></div>
                    <div className="pt-8 border-t border-slate-800"><p className="text-[10px] font-black uppercase text-indigo-400 italic mb-1 tracking-widest">Total Amount</p><p className="text-4xl font-black italic tracking-tighter">Rp {invoice?.amount?.toLocaleString('id-ID')}</p></div>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-slate-50/50 rounded-[3rem] border border-slate-100 p-8 md:p-12 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase italic tracking-widest text-slate-500">Destination Bank</label>
                        <div className="relative">
                            <Landmark className="absolute left-4 top-4 text-slate-400" size={20} />
                            <input required type="text" placeholder="e.g. BCA / MANDIRI" className="w-full p-4 pl-12 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none uppercase" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase italic tracking-widest text-slate-500">Reference Number</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-4 text-slate-400" size={20} />
                            <input type="text" placeholder="Transaction ID" className="w-full p-4 pl-12 bg-white border-2 border-slate-200 rounded-2xl font-bold focus:border-indigo-600 transition-all outline-none" value={formData.referenceNumber} onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase italic tracking-widest text-slate-500">Amount Received (IDR)</label>
                    <div className="relative">
                        <Banknote className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input required type="number" value={formData.amountPaid} className="w-full p-4 pl-12 bg-white border-2 border-slate-200 rounded-2xl font-black italic focus:border-indigo-600 outline-none text-lg" onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase italic tracking-widest text-slate-500">Evidence / Transfer Slip</label>
                    <div className="relative group h-48 border-4 border-dashed border-slate-200 rounded-4xl bg-white flex flex-col items-center justify-center transition-all hover:border-indigo-600 overflow-hidden">
                        <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setFormData({...formData, file: e.target.files[0]})} />
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {formData.file ? <FileText size={24} /> : <Upload size={24} />}
                            </div>
                            <p className="text-[11px] font-black uppercase italic text-slate-900 truncate max-w-[200px]">{formData.file ? formData.file.name : 'Drop Slip Proof'}</p>
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={btnLoading} className="w-full bg-slate-900 text-white p-6 rounded-4xl font-black italic uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-4">
                    {btnLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={22} /> Verify & Mark as Paid</>}
                </button>
            </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientPaymentForm;