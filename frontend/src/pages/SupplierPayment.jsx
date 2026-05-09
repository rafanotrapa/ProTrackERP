import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierPayment = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/supplier_payment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleConfirmPayment = async (id) => {
    const result = await Swal.fire({
      title: 'CONFIRM PAYMENT?',
      text: "Pastikan transfer ke vendor sudah berhasil dilakukan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#1e293b',
      confirmButtonText: 'YES, MARK AS PAID'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/supplier_payment/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('PAID!', 'Invoice status has been updated to Paid.', 'success');
        fetchPayments();
      } catch (err) {
        Swal.fire('ERROR', 'Failed to update payment status.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <main className="flex-1 p-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
              Supplier <span className="text-emerald-600">Payment</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic">
              Finance Division • Vendor Settlement
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-10 py-7">Vendor / Project</th>
                <th>Invoice Info</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="px-10">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center font-black italic text-slate-300 animate-pulse">LOADING DATA...</td></tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-10 py-7">
                      <div className="font-black text-slate-800 italic uppercase leading-none">{p.vendorName}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{p.projectName || 'General Supply'}</div>
                    </td>
                    <td>
                      <div className="font-mono text-xs font-bold text-slate-600">{p.invoiceNumber}</div>
                      <div className="text-[9px] text-slate-400 uppercase mt-1 tracking-wider font-bold">Due: {new Date(p.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="font-black text-emerald-600 italic text-lg">
                      Rp {p.totalAmount?.toLocaleString()}
                    </td>
                    <td>
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-600 tracking-tight">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-10">
                      <button 
                        onClick={() => handleConfirmPayment(p._id)}
                        className="bg-slate-900 text-white text-[10px] font-black px-8 py-3 rounded-2xl uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-100"
                      >
                        CONFIRM PAY
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-300 italic font-black uppercase tracking-widest text-xs">
                    No Pending Invoices Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierPayment;