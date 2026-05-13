import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupplierApproval = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/vendor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedVendors = res.data.sort((a, b) => {
        const statA = a.approvalStatus || 'Pending';
        const statB = b.approvalStatus || 'Pending';
        if (statA === 'Pending' && statB !== 'Pending') return -1;
        if (statA !== 'Pending' && statB === 'Pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setVendors(sortedVendors);
    } catch (err) {
      console.error("Gagal tarik data vendor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchVendors(); 
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleApproval = async (id, name, action) => {
    const isApprove = action === 'Approved';
    
    const result = await Swal.fire({
      title: `${isApprove ? 'APPROVE' : 'REJECT'} SUPPLIER?`,
      text: `Anda akan me-${isApprove ? 'nyetujui' : 'nolak'} ${name} sebagai mitra resmi.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `YES, ${isApprove ? 'APPROVE' : 'REJECT'}`,
      cancelButtonText: 'CANCEL',
      customClass: {
        title: 'font-black italic uppercase tracking-tighter',
        confirmButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3',
        cancelButton: 'rounded-xl font-black text-[10px] tracking-widest px-6 py-3'
      }
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/vendor/${id}/approve`, 
          { status: action },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: isApprove ? 'APPROVED' : 'REJECTED',
          text: `Vendor ${name} telah di-${action}.`,
          icon: 'success',
          confirmButtonColor: '#0f172a'
        });
        fetchVendors(); 
      } catch (err) {
        Swal.fire('ERROR', 'Gagal memproses persetujuan.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-slate-900 pb-16">
      <Header />

      <header className="w-full px-8 py-8 md:px-12 lg:px-16 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex justify-center items-center w-12 h-12 bg-white rounded-2xl border transition-all active:scale-90 shadow-sm group border-slate-200 hover:bg-slate-50 shrink-0"
          >
            <span className="text-xl font-black italic transition-colors text-slate-400 group-hover:text-emerald-600">←</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Supplier <span className="text-emerald-600">Approval</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 italic">Management Access • Vendor Verification</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-8 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-7xl bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden min-h-125">
          
          <div className="px-8 py-8 md:px-10 border-b border-slate-50 flex justify-between items-center">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Pending Verification Queue</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest italic">
                <tr>
                  <th className="p-6 md:px-10 whitespace-nowrap">ID / Vendor Profile</th>
                  <th className="p-6 whitespace-nowrap">Target Project</th>
                  <th className="p-6 text-center whitespace-nowrap">Current Status</th>
                  <th className="p-6 md:px-10 text-right whitespace-nowrap">Management Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-24 text-center font-black text-slate-200 text-2xl animate-pulse italic uppercase">Syncing Verification Queue...</td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-24 text-center font-black text-slate-300 text-xl italic uppercase">No Vendors to Review.</td>
                  </tr>
                ) : (
                  vendors.map((vendor) => {
                    const currentStatus = vendor.approvalStatus || 'Pending';
                    
                    return (
                    <tr key={vendor._id} className="hover:bg-emerald-50/30 transition-all group">
                      <td className="p-6 md:px-10">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 p-3 rounded-xl text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic leading-none mb-1">{vendor.vendorId}</p>
                            <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight leading-none">
                              {vendor.companyType}. {vendor.vendorName}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{vendor.email} • {vendor.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">
                             {vendor.projectId || 'N/A'}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                             Submitted: {formatDate(vendor.createdAt)}
                           </span>
                        </div>
                      </td>

                      <td className="p-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic inline-flex items-center gap-1.5 ${
                          currentStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          currentStatus === 'Rejected' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {currentStatus === 'Pending' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                          {currentStatus}
                        </span>
                      </td>

                      <td className="p-6 md:px-10 text-right">
                        {currentStatus === 'Pending' ? (
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => handleApproval(vendor._id, vendor.vendorName, 'Rejected')}
                              className="flex items-center justify-center p-3 rounded-xl border-2 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                              title="Reject Vendor"
                            >
                              <XCircle size={20} />
                            </button>
                            <button 
                              onClick={() => handleApproval(vendor._id, vendor.vendorName, 'Approved')}
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
                            >
                              <CheckCircle size={16} /> Approve
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                              DECISION MADE
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {formatDate(vendor.approvalDate)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierApproval;