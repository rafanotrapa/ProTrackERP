import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("Akses ditolak: Token tidak ditemukan");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/payments/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPayments(res.data);
      } catch (err) {
        console.error("Fetch Error:", err.response?.status, err.response?.data?.msg || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Verified':
        return (
          <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            ✓ PAID
          </div>
        );
      case 'Rejected':
        return (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            ✗ REJECTED
          </div>
        );
      default:
        return (
          <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
            ● PENDING
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Header />
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Finance Verification <span className="text-indigo-600">.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic font-bold">
            Client Payment Validation Queue
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center font-black uppercase tracking-widest text-slate-300">Loading Queue...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {payments.length === 0 ? (
              <div className="p-20 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400 font-bold uppercase italic">
                No pending payments found
              </div>
            ) : (
              payments.map((pay) => (
                <div 
                  key={pay._id} 
                  onClick={() => navigate(`/verify-payment/${pay._id}`)} // ← SEMUA BISA DI KLIK
                  className={`group relative p-8 bg-slate-50 border-2 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between transition-all overflow-hidden cursor-pointer ${
                    pay.status === 'Pending' 
                      ? 'hover:bg-white hover:border-slate-900 hover:shadow-2xl' 
                      : 'hover:bg-white hover:border-slate-300 hover:shadow-lg opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-8 z-10">
                    <div className={`w-3 h-3 rounded-full ${
                      pay.status === 'Verified' ? 'bg-emerald-500' : 
                      pay.status === 'Rejected' ? 'bg-red-500' : 
                      'bg-amber-500 animate-pulse'
                    }`} />
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Invoice Number</label>
                      <p className="font-black text-lg uppercase leading-none">{pay.invoiceId?.invoiceNumber || 'N/A'}</p>
                    </div>

                    <div className="hidden lg:block border-l-2 border-slate-200 pl-8 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Project & Client</label>
                      <p className="font-bold text-xs uppercase leading-none text-slate-600">
                        {pay.invoiceId?.projectName} <span className="text-slate-300 mx-2">|</span> {pay.invoiceId?.clientName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 flex items-center gap-6 z-10">
                    <div className="text-left md:text-right">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Payment Amount</label>
                      <p className="font-black text-2xl tracking-tighter leading-none">
                        Rp {Number(pay.amountPaid).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    {getStatusBadge(pay.status)}
                  </div>

                  {/* Hover Decoration - tetap ada tapi beda warna untuk yang sudah diproses */}
                  <div className={`absolute right-0 top-0 h-full w-2 transition-transform ${
                    pay.status === 'Pending' ? 'bg-indigo-600 group-hover:translate-x-0 translate-x-full' : 'bg-slate-400 group-hover:translate-x-0 translate-x-full'
                  }`} />
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PaymentVerification;