import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Eye, Check, XCircle, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierPayment = () => {
  const [submissions, setSubmissions] = useState([]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/invoice_submission', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleAction = async (id, status) => {
    const title = status === 'Approved' ? 'Approve Payment?' : 'Reject Payment?';
    const color = status === 'Approved' ? '#10b981' : '#ef4444';

    Swal.fire({
      title,
      text: "Pastikan nominal inputan Procurement sama dengan File PDF!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: color,
      confirmButtonText: 'Yes, Confirm'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/invoice_submission/${id}`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire('Success', `Status updated to ${status}`, 'success');
          fetchSubmissions();
        } catch (err) { Swal.fire('Error', 'Update gagal!', 'error'); }
      }
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <div className="p-8 md:p-16">
        <h1 className="text-3xl font-black italic uppercase mb-8">Supplier <span className="text-indigo-600">Payment Queue</span></h1>
        
        <div className="bg-white border-2 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest italic">
              <tr>
                <th className="p-6">Project / Vendor</th>
                <th className="p-6">Inputted Amount</th>
                <th className="p-6">Evidence</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Gatekeeper Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 transition-all group">
                  <td className="p-6">
                    <p className="text-[10px] font-black text-indigo-500 italic">{s.projectId}</p>
                    <p className="font-black text-slate-800 uppercase italic">{s.vendorName}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-black text-xl text-slate-900 italic">Rp {Number(s.amount).toLocaleString('id-ID')}</p>
                  </td>
                  <td className="p-6">
                    <a href={`http://localhost:5000/uploads/${s.file}`} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase border border-indigo-100 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                      <Eye size={14}/> View Paper Invoice
                    </a>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[9px] font-black rounded-full uppercase italic tracking-widest">{s.status}</span>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <button onClick={() => handleAction(s._id, 'Approved')} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90"><Check size={18}/></button>
                    <button onClick={() => handleAction(s._id, 'Rejected')} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"><XCircle size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SupplierPayment;