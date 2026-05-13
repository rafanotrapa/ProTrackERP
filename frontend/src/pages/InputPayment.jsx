import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const InputPayment = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    invoiceId: '',
    invoiceNumber: '',
    projectName: '',
    clientName: '',
    amountToPay: 0,
    totalContractValue: 0,
    topOption: '',
    billingPhase: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
const fetchInvoices = async () => {
  try {
    const token = localStorage.getItem('token');
    // Nembak ke rute payment yang baru kita buat (GET /api/payments/invoices)
    const res = await axios.get('http://localhost:5000/api/payments/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setInvoices(res.data);
  } catch (err) {
    console.error("Gagal load data invoice:", err);
  }
};
    fetchInvoices();
  }, []);

  const handleInvoiceChange = (e) => {
    const id = e.target.value;
    const selected = invoices.find(inv => inv._id === id);

    if (selected) {
      setFormData({
        ...formData,
        invoiceId: selected._id,
        invoiceNumber: selected.invoiceNumber,
        projectName: (selected.projectName || "").toUpperCase(),
        clientName: (selected.clientName || "").toUpperCase(),
        amountToPay: selected.amount || 0,
        totalContractValue: selected.totalContractValue || 0,
        topOption: (selected.topOption || "").toUpperCase(),
        billingPhase: (selected.billingPhase || "PAYMENT").toUpperCase()
      });
    } else {
      setFormData({ ...formData, invoiceId: '', amountToPay: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return Swal.fire('Attention', 'Please upload payment evidence.', 'warning');

    setLoading(true);
    const data = new FormData();
    data.append('invoiceId', formData.invoiceId);
    data.append('amountPaid', formData.amountToPay);
    data.append('paymentDate', formData.paymentDate);
    data.append('evidence', selectedFile);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/payments', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire({ 
        icon: 'success', 
        title: 'PAYMENT SUBMITTED', 
        text: 'Data forwarded to Finance verification.',
        confirmButtonColor: '#0f172a'
      });
      navigate('/dashboard');
    } catch (err) {
      Swal.fire('Error', 'Failed to submit payment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Header />
      <main className="flex-1 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-12">
          
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Payment Submission <span className="text-indigo-600">.</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic">
              Verification Routing System
            </p>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">1. Select Reference Invoice</label>
              <select 
                className="w-full p-5 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all shadow-sm cursor-pointer appearance-none bg-slate-50" 
                onChange={handleInvoiceChange}
                required
              >
                <option value="">-- SEARCH INVOICE --</option>
                {invoices.map(inv => (
                  <option key={inv._id} value={inv._id}>{inv.invoiceNumber} | {inv.projectName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">2. Actual Payment Date</label>
              <input 
                type="date" 
                required 
                className="w-full p-5 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm bg-slate-50" 
                value={formData.paymentDate}
                onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
              />
            </div>
          </div>

          {/* Detailed Info Card (Slate 900) */}
          <div className="p-12 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white border-b-8 border-indigo-600">
            <div className="relative z-10 flex flex-col gap-8">
              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Confirmed Billing Amount</label>
                <h2 className="text-6xl font-black mt-2 tracking-tighter">
                  Rp {Number(formData.amountToPay).toLocaleString()}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/10">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Client Identity</label>
                    <p className="text-lg font-black uppercase leading-none mt-1">{formData.clientName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Project Assignment</label>
                    <p className="text-lg font-black uppercase leading-none mt-1">{formData.projectName || '-'}</p>
                  </div>
                </div>
                <div className="md:text-right space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Total Contract Value</label>
                    <p className="text-lg font-black leading-none mt-1 text-slate-300">Rp {Number(formData.totalContractValue).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Billing Phase / TOP</label>
                    <p className="text-lg font-black text-indigo-400 uppercase leading-none mt-1">{formData.billingPhase} - {formData.topOption}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Upload Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">3. Transaction Evidence (Image Only)</label>
            <div className="relative border-4 border-dashed border-slate-100 rounded-4xl p-16 flex flex-col items-center justify-center hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer group">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept="image/*"
              />
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {selectedFile ? selectedFile.name : "Attach Transfer Slip"}
              </p>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-12 py-5 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-all active:scale-95 ${
                loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'Processing...' : 'Submit to Finance'}
            </button>
          </div>

        </form>
      </main>
      <Footer />
    </div>
  );
};

export default InputPayment;