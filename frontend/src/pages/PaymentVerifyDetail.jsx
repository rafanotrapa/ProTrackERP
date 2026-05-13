import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PaymentVerifyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/payments/detail/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setPayment(res.data);
      } catch (err) {
        console.error(err);
        Swal.fire('ERROR', 'Failed to load payment details', 'error');
        navigate('/verify-payment');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const handleAction = async (status) => {
    if (payment.status !== 'Pending') return;

    setActionLoading(true);
    try {
      await axios.patch('http://localhost:5000/api/payments/verify', 
        { paymentId: id, status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      Swal.fire({
        title: 'SUCCESS!',
        text: `Payment has been ${status.toLowerCase()}`,
        icon: 'success',
        confirmButtonColor: '#1e293b',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/verify-payment');
      });
    } catch (err) {
      Swal.fire({
        title: 'ERROR!',
        text: err.response?.data?.msg || 'Action failed',
        icon: 'error',
        confirmButtonColor: '#1e293b'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !payment) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="font-bold uppercase tracking-widest text-slate-400 text-[10px]">LOADING DATA...</p>
      </div>
    </div>
  );

  const isPending = payment.status === 'Pending';
  const isVerified = payment.status === 'Verified';
  const isRejected = payment.status === 'Rejected';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Header />
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-8">
          <div className="border-l-4 border-slate-900 pl-4">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Payment Review</h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Transaction ID: {payment._id}</p>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
          >
            Back to List
          </button>
        </div>

        {/* Status Banner - Hanya info, bukan penghalang */}
        {!isPending && (
          <div className={`p-6 rounded-[2rem] border-2 ${
            isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <p className="font-black uppercase text-sm tracking-wider">
                {isVerified ? '✓ PAYMENT VERIFIED & MARKED AS PAID' : '✗ PAYMENT REJECTED'}
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-75">
              This payment has already been processed - View only mode
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Sisi Kiri: Bukti Bayar */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transfer Evidence Attachment</label>
            <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 shadow-inner overflow-hidden">
              <img 
                src={`http://localhost:5000/${payment.evidencePath}`} 
                alt="Payment Slip" 
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>

          {/* Sisi Kanan: Detail & Action */}
          <div className="space-y-8">
            <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Amount</label>
               <h2 className="text-5xl font-black mt-2 tracking-tighter">Rp {payment.amountPaid.toLocaleString()}</h2>
               
               {/* Status Badge di Detail */}
               <div className="absolute top-6 right-6">
                 {isVerified && (
                   <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                     ✓ VERIFIED
                   </div>
                 )}
                 {isRejected && (
                   <div className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                     ✗ REJECTED
                   </div>
                 )}
                 {isPending && (
                   <div className="bg-amber-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse shadow-lg">
                     ● PENDING
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Client Name</label>
                    <p className="font-bold uppercase">{payment.invoiceId?.clientName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Project</label>
                    <p className="font-bold uppercase">{payment.invoiceId?.projectName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Invoice Number</label>
                    <p className="font-bold uppercase">{payment.invoiceId?.invoiceNumber || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Transfer Date</label>
                    <p className="font-bold uppercase">{new Date(payment.paymentDate).toLocaleDateString('id-ID')}</p>
                  </div>
               </div>
            </div>

            {/* Tombol Action - HANYA muncul kalau status masih Pending */}
            {isPending && (
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => handleAction('Rejected')}
                  disabled={actionLoading}
                  className={`flex-1 py-4 border-2 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                    actionLoading
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {actionLoading ? 'PROCESSING...' : 'Reject Payment'}
                </button>
                <button 
                  onClick={() => handleAction('Verified')}
                  disabled={actionLoading}
                  className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                    actionLoading
                      ? 'bg-slate-300 text-white cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {actionLoading ? 'PROCESSING...' : 'Verify & Mark as Paid'}
                </button>
              </div>
            )}

            {/* Tombol back tambahan untuk yang sudah diproses */}
            {!isPending && (
              <div className="text-center pt-4">
                <button
                  onClick={() => navigate('/verify-payment')}
                  className="w-full py-4 border-2 border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                >
                  ← Back to Payment List
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentVerifyDetail;