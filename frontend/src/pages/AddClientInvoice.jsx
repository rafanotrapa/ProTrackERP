import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddClientInvoice = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    projectId: '',
    projectName: '',
    clientName: '',
    amount: 0,
    dueDate: '',
    remarks: ''
  });

  // 1. Ambil data Quotation untuk dropdown
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_quotation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data || []);
      } catch (err) {
        console.error("Gagal load data quotation:", err);
      }
    };
    fetchQuotations();
  }, []);

  // 2. Logic pas pilih Quotation (Auto-fill data project)
  const handleQuotationChange = (e) => {
    const selectedQuote = quotations.find(q => q._id === e.target.value);
    if (selectedQuote) {
      setFormData({
        ...formData,
        projectId: selectedQuote._id,
        projectName: selectedQuote.projectName,
        clientName: selectedQuote.clientName,
        amount: selectedQuote.totalAmount || 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/client_invoice', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Invoice Berhasil Dibuat!");
      navigate('/dashboard');
    } catch (err) {
      alert("Gagal membuat invoice: " + err.response?.data?.msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-10 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
            Create <span className="text-violet-600">Client Invoice</span>
          </h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕ CANCEL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          {/* INVOICE NUMBER */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Invoice Number</label>
            <input 
              type="text"
              value={formData.invoiceNumber}
              disabled
              className="bg-slate-100 p-4 rounded-xl border-none font-mono text-slate-500"
            />
          </div>

          {/* SELECT QUOTATION (LINKING) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Select Quotation Source</label>
            <select 
              onChange={handleQuotationChange}
              required
              className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 focus:border-violet-500 focus:ring-0 transition-all outline-none"
            >
              <option value="">-- Choose Approved Quotation --</option>
              {quotations.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.projectName} ({q.clientName})
                </option>
              ))}
            </select>
          </div>

          {/* PROJECT NAME (READ ONLY) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Project Name</label>
            <input 
              type="text"
              value={formData.projectName}
              readOnly
              className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-slate-500 cursor-not-allowed"
              placeholder="Auto-filled"
            />
          </div>

          {/* CLIENT NAME (READ ONLY) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Client Name</label>
            <input 
              type="text"
              value={formData.clientName}
              readOnly
              className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-slate-500 cursor-not-allowed"
              placeholder="Auto-filled"
            />
          </div>

          {/* DUE DATE */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Due Date</label>
            <input 
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 focus:border-violet-500 outline-none transition-all"
            />
          </div>

          {/* AMOUNT */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Total Amount (IDR)</label>
            <input 
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 font-bold text-violet-600 focus:border-violet-500 outline-none"
            />
          </div>

          {/* REMARKS */}
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Remarks / Notes</label>
            <textarea 
              rows="3"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 focus:border-violet-500 outline-none transition-all"
              placeholder="Add additional notes here..."
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="col-span-2 mt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:bg-slate-300"
            >
              {loading ? 'Processing...' : 'Generate & Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientInvoice;