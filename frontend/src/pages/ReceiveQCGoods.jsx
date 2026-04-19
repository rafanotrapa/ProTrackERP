import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ReceiveQCGoods = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPOs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/po', { headers: { Authorization: `Bearer ${token}` } });
      setPurchaseOrders(res.data);
    } catch (err) {
      console.error("Gagal load PO:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPOs(); }, []);

  const handleQC = async (id, actionStatus) => {
    let qcRemarks = '';
    
    // Kalau reject/return, minta alasan wajib!
    if (actionStatus === 'Returned') {
      const { value: text } = await Swal.fire({
        title: 'REJECT / RETURN GOODS',
        input: 'textarea',
        inputLabel: 'Alasan Retur / Gagal QC',
        inputPlaceholder: 'Barang cacat, quantity kurang...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        inputValidator: (value) => { if (!value) return 'Alasan retur wajib diisi!' }
      });
      if (!text) return; // Batal klik
      qcRemarks = text;
    } else {
      // Konfirmasi Pass QC
      const result = await Swal.fire({
        title: 'QC PASSED?',
        text: 'Barang sudah sesuai dan siap diteruskan ke Finance untuk pelunasan?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'YES, ALL GOOD'
      });
      if (!result.isConfirmed) return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/po/${id}/qc-check`, { status: actionStatus, qcRemarks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire('BERHASIL', `Status QC diupdate menjadi ${actionStatus}`, 'success');
      fetchPOs(); // Refresh data
    } catch (err) {
      Swal.fire('ERROR', err.response?.data?.msg || 'Gagal update status QC', 'error');
    }
  };

  // Kita kasih API pura-pura buat testing Finance Approve (Khusus Development)
  const handleDummyFinanceApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/po/${id}/finance-approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire('DP APPROVED!', 'Finance telah menyetujui, Supplier mengirim barang.', 'success');
      fetchPOs();
    } catch (err) {
      Swal.fire('ERROR', 'Gagal update payment status', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 text-slate-900">
      <Header />
      <div className="flex items-center gap-6 px-8 py-8 w-full border-b bg-slate-50/30 border-slate-200">
        <button onClick={() => navigate('/dashboard')} className="flex justify-center items-center w-12 h-12 bg-white rounded-2xl border transition-all active:scale-90 shadow-sm group border-slate-200 hover:bg-slate-50">
          <span className="text-xl font-black italic transition-colors text-slate-400 group-hover:text-amber-500">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black italic leading-none tracking-tighter uppercase text-slate-900">
            Receive & QC <span className="text-amber-500">Goods</span>
          </h1>
          <p className="mt-1 text-[10px] font-black italic leading-none tracking-[0.2em] uppercase text-slate-400">Procurement • Receiving & Validation</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <div className="mx-auto max-w-7xl bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Incoming Shipments</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">PO Number / Project</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Supplier</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center">Status Finance</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center">Status QC</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {purchaseOrders.length === 0 ? (
                   <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold italic">No Purchase Orders found.</td></tr>
                ) : purchaseOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                         <div className="bg-amber-100 text-amber-600 p-3 rounded-xl"><Package size={20}/></div>
                         <div>
                            <p className="text-sm font-black text-slate-800 uppercase italic">{po.poNumber}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Project: {po.projectId}</p>
                         </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <p className="text-xs font-bold text-slate-700 uppercase">{po.vendorId?.vendorName || 'N/A'}</p>
                    </td>
                    
                    {/* STATUS FINANCE */}
                    <td className="p-6 text-center">
                       {po.paymentStatus === 'Approved' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">DP APPROVED</span>
                       ) : (
                          <div className="flex flex-col items-center gap-2">
                             <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">WAITING FINANCE</span>
                             {/* TOMBOL DUMMY BUAT TESTING - NANTI BISA DIHAPUS KALO MODUL FINANCE UDAH JADI */}
                             <button onClick={() => handleDummyFinanceApprove(po._id)} className="text-[8px] font-black underline text-blue-500 hover:text-blue-700">Simulate Approve</button>
                          </div>
                       )}
                    </td>

                    {/* STATUS QC */}
                    <td className="p-6 text-center">
                       {po.qcStatus === 'Passed' && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">GOODS PASSED</span>}
                       {po.qcStatus === 'Returned' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest">RETURNED</span>}
                       {po.qcStatus === 'Waiting Delivery' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">WAITING RECEIPT</span>}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        {/* Tombol QC hanya aktif kalau Finance udah bayar DP dan QC belum Passed/Returned */}
                        <button 
                          onClick={() => handleQC(po._id, 'Passed')}
                          disabled={po.paymentStatus !== 'Approved' || po.qcStatus !== 'Waiting Delivery'}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-50 hover:border-green-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <CheckCircle size={14}/> PASS
                        </button>
                        <button 
                          onClick={() => handleQC(po._id, 'Returned')}
                          disabled={po.paymentStatus !== 'Approved' || po.qcStatus !== 'Waiting Delivery'}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <XCircle size={14}/> RETURN
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReceiveQCGoods;