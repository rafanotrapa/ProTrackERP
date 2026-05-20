import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Eye, Search, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const QuotationLog = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_quotation/my-quotations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data);
      } catch (err) {
        console.error("Gagal load quotations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 text-emerald-600"><CheckCircle size={10} /> APPROVED</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-red-100 text-red-600"><XCircle size={10} /> REJECTED</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-amber-100 text-amber-600"><Clock size={10} /> PENDING</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-100 text-slate-500"><FileText size={10} /> DRAFT</span>;
    }
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.projectId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : q.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />
      
      {/* HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button 
          onClick={() => navigate('/quotation-center')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Quotation <span className="text-indigo-600">Log</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">History & Status Tracking</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Project, Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Quotation List - TABLE STYLE */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-[10px] text-slate-400">Loading quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <FileText size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-black text-lg uppercase tracking-tighter italic">No quotations found</p>
            <button 
              onClick={() => navigate('/client-quote')}
              className="mt-4 text-[10px] font-black text-indigo-600 underline"
            >
              Create your first quotation →
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-6 py-4">Quotation ID</th>
                  <th className="px-6 py-4">Project / Client</th>
                  <th className="px-6 py-4 text-right">Total Value</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => navigate(`/quotation-log-detail/${q._id}`)}>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{q.quotationId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800">{q.projectName || q.projectId}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{q.clientName}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-emerald-600">Rp {q.clientPrice?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(q.approvalStatus)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-[9px] font-bold text-slate-500">{new Date(q.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Eye size={16} className="text-slate-400 mx-auto hover:text-indigo-600 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default QuotationLog;