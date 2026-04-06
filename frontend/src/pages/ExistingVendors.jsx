import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin } from 'lucide-react';

const ExistingVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('token');
        // Endpoint GET ke /api/vendor (Tanpa 's')
        const res = await axios.get('http://localhost:5000/api/vendor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVendors(res.data);
      } catch (err) {
        console.error("Gagal ambil data vendor:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <button 
              onClick={() => navigate('/vendor')}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase mb-2 transition-all"
            >
              <ArrowLeft size={14} /> Back to Vendor Menu
            </button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
              <Building2 className="text-blue-600" />
              Existing Vendors Database
            </h1>
          </div>
          <button 
            onClick={() => navigate('/add-vendor')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg transition-all"
          >
            + Register New Vendor
          </button>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center font-bold text-slate-400 animate-pulse">
              SYNCING VENDOR DATA...
            </div>
          ) : vendors.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-bold">Belum ada vendor terdaftar bre.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Company</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5">
                        <p className="text-[10px] font-mono font-bold text-blue-600">{vendor.vendorId}</p>
                        <p className="font-bold text-slate-800">{vendor.companyType}. {vendor.vendorName}</p>
                      </td>
                      <td className="p-5 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={12} /> {vendor.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={12} /> {vendor.phone || '-'}
                        </div>
                      </td>
                      <td className="p-5 text-sm font-medium text-slate-600">
                        {vendor.category}
                      </td>
                      <td className="p-5 text-center">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExistingVendors;