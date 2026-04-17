import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Building2, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ExistingVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('token');
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

  // LOGIC SEARCH (Biar gampang nyari vendor di database gede)
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => 
      (v.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vendorId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, vendors]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      {/* SUB-HEADER & ACTIONS (FULL WIDTH) */}
      <div className="w-full border-b border-slate-100 px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/vendor')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
          >
            <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Vendor <span className="text-indigo-600">Database</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Procurement Module • Master Supplier Records</p>
          </div>
        </div>

        {/* SEARCH & ADD BUTTON */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <input 
               type="text" 
               placeholder="Search Vendor Name, ID, or Category..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full p-3 pl-10 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm italic placeholder:text-slate-300"
             />
             <span className="absolute left-4 top-3 text-slate-300">
               <Search size={16} />
             </span>
          </div>
          <button 
            onClick={() => navigate('/add-vendor')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-slate-200 transition-all active:scale-95 whitespace-nowrap"
          >
            + Register Vendor
          </button>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <div className="max-w-none w-full">
          
          <div className="flex justify-between items-end px-2 mb-4">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Registered Partners</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase leading-none">
              {filteredVendors.length} Verified Vendors
            </p>
          </div>

          {/* TABLE SECTION (LEBAR MAKSIMAL) */}
          <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-2xl shadow-slate-100/50 overflow-hidden">
            {loading ? (
              <div className="p-32 text-center">
                <div className="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-slate-300 text-xl italic uppercase tracking-widest animate-pulse">Establishing Connection...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-32 text-center">
                <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-300 italic">No Vendor Records Found.</p>
                <button onClick={() => navigate('/add-vendor')} className="mt-4 text-indigo-600 font-black uppercase text-xs hover:underline italic">Register New Partner →</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-800">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">ID / Company Name</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center">Category</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Communication Info</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-center italic">Legal Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-right italic">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor._id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-3 rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <Building2 size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic leading-none mb-1">{vendor.vendorId}</p>
                              <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight leading-none group-hover:text-indigo-600 transition-all">
                                {vendor.companyType}. {vendor.vendorName}
                              </h3>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                           <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                              {vendor.category}
                           </span>
                        </td>
                        <td className="p-6 space-y-2">
                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                            <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                              <Mail size={12} />
                            </div>
                            <span className="italic">{vendor.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                            <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                              <Phone size={12} />
                            </div>
                            <span className="italic">{vendor.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-black uppercase tracking-widest italic">Verified Partner</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                           <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
                              <Search size={14} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExistingVendors;