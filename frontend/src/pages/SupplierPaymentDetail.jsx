import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, Building2, FileText, DollarSign, Calendar, 
  Clock, CheckCircle, AlertCircle, User, Package, 
  Truck, Receipt, Download, Eye, CreditCard
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierPaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFile, setShowFile] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/supplier_invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoice(res.data);
      } catch (err) {
        console.error("Gagal load detail:", err);
        Swal.fire('Error', 'Failed to load invoice detail', 'error');
        navigate('/supplier-payment');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const handleConfirmPayment = async () => {
    const result = await Swal.fire({
      title: 'Confirm Payment?',
      html: `You are about to mark <strong>${invoice?.invoiceNumber}</strong> as <strong class="text-emerald-600">PAID</strong>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#1e293b',
      confirmButtonText: 'Yes, Confirm Payment',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/supplier_invoices/${id}/confirm`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Payment Confirmed!',
          text: `Invoice ${invoice?.invoiceNumber} has been marked as PAID.`,
          confirmButtonColor: '#0f172a'
        });
        
        // Refresh data
        const res = await axios.get(`http://localhost:5000/api/supplier_invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoice(res.data);
        
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.msg || 'Failed to confirm payment.',
          confirmButtonColor: '#0f172a'
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Paid') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle size={16} className="text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">PAID</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
        <Clock size={16} className="text-amber-600" />
        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">PENDING VERIFICATION</span>
      </div>
    );
  };

  const formatRupiah = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  const getFileUrl = (filename) => {
    if (!filename) return null;
    return `http://localhost:5000/uploads/${filename}`;
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
          <button onClick={() => navigate('/supplier-payment')} className="mt-4 text-indigo-600 underline text-sm">Back to List</button>
        </div>
      </div>
    );
  }

  const isPending = invoice.status === 'Pending Verification';
  const isPaid = invoice.status === 'Paid';

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />
      
      {/* HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/supplier-payment')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Supplier <span className="text-emerald-600">Invoice</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">{invoice.invoiceNumber}</p>
          </div>
        </div>
        {isPending && (
          <button 
            onClick={handleConfirmPayment}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <CreditCard size={14} /> Confirm Payment
          </button>
        )}
        {isPaid && (
          <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
            <CheckCircle size={14} /> Payment Completed
          </div>
        )}
      </div>

      <main className="flex-1 p-8 md:p-12">
        
        {/* STATUS BANNER */}
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          {getStatusBadge(invoice.status)}
          <div className="flex items-center gap-4 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={12} /> Submitted: {new Date(invoice.createdAt).toLocaleDateString()}</span>
            {invoice.paymentDate && (
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12} /> Paid: {new Date(invoice.paymentDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - DETAILS */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vendor & Project Info */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Building2 size={14} /> Vendor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendor Name</p>
                  <p className="text-lg font-black text-slate-800 uppercase mt-1">{invoice.vendorName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project ID</p>
                  <p className="text-lg font-black text-slate-800 uppercase mt-1">{invoice.projectId || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PO Number</p>
                  <p className="text-base font-black text-indigo-600 uppercase mt-1">{invoice.poNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Termin / Phase</p>
                  <p className="text-base font-black text-amber-600 uppercase mt-1">{invoice.terminName || 'Full Payment'}</p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {invoice.remarks && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText size={12} /> Internal Notes
                </p>
                <p className="text-sm text-slate-600 italic">{invoice.remarks}</p>
              </div>
            )}

            {/* Submission Info */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                  <User size={14} /> Submission Information
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[9px] font-black text-slate-400">Submission ID</span>
                  <span className="text-[10px] font-bold text-slate-600">{invoice.submissionId || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-black text-slate-400">Submitted By</span>
                  <span className="text-[10px] font-bold text-slate-600">{invoice.user?.name || 'Procurement'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-black text-slate-400">Submitted Date</span>
                  <span className="text-[10px] font-bold text-slate-600">{new Date(invoice.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - SUMMARY & FILE */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-24">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                Financial Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[10px] font-bold text-slate-300">Currency</span>
                  <span className="font-black text-white">{invoice.currency || 'IDR'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-[10px] font-bold text-slate-300">Billing Amount</span>
                  <span className="font-black text-emerald-300">Rp {formatRupiah(invoice.amount)}</span>
                </div>
                <div className="flex justify-between py-3 mt-2 bg-indigo-500/20 -mx-3 px-3 rounded-xl">
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">TOTAL</span>
                  <span className="text-xl font-black text-indigo-300">Rp {formatRupiah(invoice.amount)}</span>
                </div>
              </div>
              
              {isPaid && invoice.paymentDate && (
                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                  <p className="text-[8px] text-slate-400">Payment Date</p>
                  <p className="text-[10px] font-bold text-emerald-300">{new Date(invoice.paymentDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* File Attachment */}
            {invoice.file && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                    <FileText size={14} /> Invoice Attachment
                  </h3>
                </div>
                <div className="p-5">
                  {showFile ? (
                    <div className="relative">
                      <img 
                        src={getFileUrl(invoice.file)} 
                        alt="Invoice" 
                        className="w-full rounded-xl border border-slate-200"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400?text=File+Not+Found';
                        }}
                      />
                      <button
                        onClick={() => setShowFile(false)}
                        className="absolute top-2 right-2 p-2 bg-slate-900/80 text-white rounded-lg hover:bg-slate-900 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="text-indigo-500" />
                        <div>
                          <p className="text-[10px] font-black text-slate-700">{invoice.file}</p>
                          <p className="text-[8px] text-slate-400">Uploaded invoice document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowFile(true)}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  )}
                  {showFile && (
                    <a 
                      href={getFileUrl(invoice.file)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-slate-100 rounded-xl text-[9px] font-black text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      <Download size={12} /> Download Original
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SupplierPaymentDetail;