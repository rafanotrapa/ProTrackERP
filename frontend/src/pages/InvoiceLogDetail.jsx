import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, FileText, 
  Truck, Receipt, User, Building2, DollarSign, Calendar,
  Printer, Download
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const InvoiceLogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/client_invoice/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoice(res.data);
      } catch (err) {
        console.error("Gagal load detail:", err);
        Swal.fire('Error', 'Failed to load invoice detail', 'error');
        navigate('/invoice-log');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
            <CheckCircle size={16} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">PAID</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
            <Clock size={16} className="text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">UNPAID</span>
          </div>
        );
    }
  };

  const formatRupiah = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  const handleDownloadPDF = () => {
    Swal.fire('Info', 'PDF download feature coming soon', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING INVOICE...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="font-black text-slate-600 text-lg">Invoice not found</p>
          <button onClick={() => navigate('/invoice-log')} className="mt-4 text-indigo-600 underline text-sm">Back to Log</button>
        </div>
      </div>
    );
  }

  const subtotal = (invoice.items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const shippingFee = invoice.shippingFee || 0;
  const taxAmount = invoice.taxAmount || 0;
  const grandTotal = invoice.amount || subtotal + shippingFee + taxAmount;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />
      
      {/* HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/invoice-log')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Invoice <span className="text-indigo-600">Detail</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
        >
          <Download size={14} /> Download PDF
        </button>
      </div>

      <main className="flex-1 p-8 md:p-12">
        
        {/* STATUS BANNER */}
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          {getStatusBadge(invoice.status)}
          <div className="flex items-center gap-4 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> Created: {new Date(invoice.createdAt).toLocaleDateString()}</span>
            {invoice.dueDate && (
              <span className="flex items-center gap-1"><Clock size={12} /> Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building2 size={12} /> Project</p>
                  <p className="text-xl font-black text-slate-800 uppercase mt-1">{invoice.projectName || invoice.projectId}</p>
                  <p className="text-[10px] text-slate-500 mt-1">ID: {invoice.projectId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={12} /> Client</p>
                  <p className="text-xl font-black text-slate-800 uppercase mt-1">{invoice.clientName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOP</p>
                  <p className="text-base font-black text-amber-600 uppercase mt-1">{invoice.topOption || 'COD'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing Phase</p>
                  <p className="text-base font-black text-slate-800 mt-1">{invoice.billingPhase || 'Full Payment'}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                  <FileText size={14} /> Itemized Invoice
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-4">Item</th>
                      <th className="px-5 py-4 text-center">Qty</th>
                      <th className="px-5 py-4 text-center">Unit</th>
                      <th className="px-5 py-4 text-right">Unit Price</th>
                      <th className="px-5 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(invoice.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-bold text-slate-800 text-sm uppercase">{item.itemName}</td>
                        <td className="px-5 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                        <td className="px-5 py-4 text-center text-slate-600">{item.unit}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-600">Rp {formatRupiah(item.price)}</td>
                        <td className="px-5 py-4 text-right font-black text-emerald-600">Rp {formatRupiah((item.quantity || 0) * (item.price || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks */}
            {invoice.remarks && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks / Notes</p>
                <p className="text-sm text-slate-600 italic">{invoice.remarks}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - SUMMARY */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-24">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                Financial Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[10px] font-bold text-slate-300">Subtotal</span>
                  <span className="font-black text-white">Rp {formatRupiah(subtotal)}</span>
                </div>
                {shippingFee > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Truck size={12} /> Shipping</span>
                    <span className="font-black text-white">Rp {formatRupiah(shippingFee)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Receipt size={12} /> Tax</span>
                    <span className="font-black text-white">Rp {formatRupiah(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 mt-2 bg-indigo-500/20 -mx-3 px-3 rounded-xl">
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">GRAND TOTAL</span>
                  <span className="text-xl font-black text-indigo-300">Rp {formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default InvoiceLogDetail;