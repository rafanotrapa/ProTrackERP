import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import langsung fungsinya
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddClientInvoice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    invoiceId: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
    projectId: '',
    projectName: '',
    clientName: '',
    selectedItems: '',
    currency: 'IDR',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_quotation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data || []);
      } catch (err) {
        console.error("Gagal load data quotation:", err);
      }
    };
    fetchQuotations();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProject = (q) => {
    setFormData({
      ...formData,
      projectId: q.projectId || '',
      projectName: q.projectName || '',
      clientName: q.clientName || '',
      selectedItems: q.selectedItems || '',
      currency: q.currency || 'IDR',
      amount: q.clientPrice || '0',
    });
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const formatRupiah = (value) => {
    if (!value) return '0';
    let numberString = value.toString().replace(/[^0-9]/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // --- LOGIC GENERATE PDF (ANTI-CRASH VERSION) ---
  const generatePDF = () => {
    if (!formData.projectId) {
      return Swal.fire({
        icon: 'warning',
        title: 'PROJECT NOT SELECTED',
        text: 'Pilih Project ID dulu dari dropdown!',
        confirmButtonColor: '#4f46e5'
      });
    }

    try {
      const doc = new jsPDF();
      
      // Branding Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); 
      doc.text("INVOICE", 105, 25, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(79, 70, 229); 
      doc.text("BATAVIA JAYA KREASINDO • PROTRACK ERP SYSTEM", 105, 32, { align: "center" });
      doc.line(20, 38, 190, 38);

      // Info Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("INVOICE INFORMATION", 20, 50);
      
      doc.setTextColor(15, 23, 42);
      doc.text(`Invoice ID  : ${formData.invoiceId}`, 20, 58);
      doc.text(`Date        : ${formData.date}`, 20, 63);
      doc.text(`Project Ref : ${formData.projectId}`, 20, 68);

      // Client Info
      doc.setTextColor(100, 116, 139);
      doc.text("BILLED TO:", 135, 50);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text((formData.clientName || '').toUpperCase(), 135, 58);

      // Manggil autoTable secara langsung (Fix Error: doc.autoTable is not a function)
      autoTable(doc, {
        startY: 75,
        head: [['DESCRIPTION', 'QTY', 'CURRENCY', 'TOTAL AMOUNT']],
        body: [
          [
            formData.selectedItems || 'Standard Project Procurement', 
            '1 Lot', 
            formData.currency, 
            formatRupiah(formData.amount)
          ]
        ],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 }
      });

      // Total Section
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`TOTAL DUE:`, 120, finalY);
      doc.setTextColor(79, 70, 229); 
      doc.text(`${formData.currency} ${formatRupiah(formData.amount)}`, 190, finalY, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Computer-generated invoice, no signature required.", 105, 285, { align: "center" });

      // Download PDF
      doc.save(`${formData.invoiceId}_${formData.projectId}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'PDF GENERATED',
        text: 'Invoice berhasil diunduh.',
        confirmButtonColor: '#0f172a'
      });

    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire('ERROR', 'Gagal cetak PDF! Cek koneksi library.', 'error');
    }
  };

  const filteredQuotations = useMemo(() => 
    quotations.filter(q => (q.projectId || '').toLowerCase().includes(searchTerm.toLowerCase())),
  [quotations, searchTerm]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col text-slate-900">
      <Header />

      {/* SUB-HEADER */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6 bg-slate-50/30">
        <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Create <span className="text-indigo-600">Invoice</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic leading-none">Marketing Module • Billing Generator</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <div className="max-w-none w-full space-y-12">
          
          {/* SECTION 1: PROJECT SELECTOR (AUTO-FILL SOURCE) */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 01. Project Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Select Project BJK (Auto-Fill)</label>
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-4 bg-white border-2 border-indigo-600 rounded-xl font-black text-indigo-600 flex justify-between items-center cursor-pointer shadow-lg shadow-indigo-50 transition-all hover:bg-indigo-50/30">
                  <span className="truncate">{formData.projectId || '-- Click to Select Project --'}</span>
                  <span className={`text-[8px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <input type="text" placeholder="Search Project ID..." className="w-full p-4 text-xs border-b outline-none font-bold italic bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                    <ul className="max-h-60 overflow-y-auto">
                      {filteredQuotations.length > 0 ? filteredQuotations.map(q => (
                        <li key={q._id} onClick={() => handleSelectProject(q)} className="px-5 py-4 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer transition-all uppercase border-b border-slate-50 last:border-none">{q.projectId} - {q.clientName}</li>
                      )) : <li className="px-5 py-4 text-[10px] text-slate-400 italic text-center">No Data.</li>}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Generation Date</label>
                <input type="text" readOnly value={formData.date} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-400 font-bold outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: AUTO ACQUISITION */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 02. Data Acquisition</h3>
            <div className="p-10 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 flex flex-col md:flex-row gap-12 relative overflow-hidden group">
              <div className="relative z-10">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2 block">Client Name</label>
                <p className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{formData.clientName || '-'}</p>
              </div>
              <div className="relative z-10 flex-1 border-t md:border-t-0 md:border-l border-slate-200 md:pl-12 pt-6 md:pt-0">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2 block">Items (Auto-Merge)</label>
                <p className="text-xl font-bold text-slate-500 italic uppercase tracking-tight leading-relaxed">{formData.selectedItems || '-'}</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMERCIALS */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic"><span className="w-8 h-1 bg-indigo-600"></span> 03. Commercials</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Currency</label>
                <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 text-center uppercase tracking-widest italic">{formData.currency}</div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 italic leading-none mb-1.5">Billed Amount</label>
                <div className="w-full p-4 bg-white border-2 border-green-500 rounded-2xl font-black text-5xl text-green-600 shadow-xl shadow-green-100/30 flex items-center px-8">
                   <span>{formatRupiah(formData.amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end pt-12 border-t border-slate-100">
            <button 
              onClick={generatePDF}
              type="button"
              className="px-16 py-5 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all active:scale-95 bg-slate-900 hover:bg-indigo-600 shadow-indigo-200 italic"
            >
              Print as a PDF →
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddClientInvoice;