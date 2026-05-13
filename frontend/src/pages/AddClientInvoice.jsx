import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddClientInvoice = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoiceType, setInvoiceType] = useState('new'); // 'new' or 'progress'

  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    projectId: '',
    projectName: '',
    clientName: '',
    items: [],
    amount: 0,
    totalContractValue: 0,
    billingPhase: '',
    dueDate: '',
    remarks: '',
    topOption: '',
    status: 'Unpaid',
    isProgressInvoice: false
  });

  // Fetch available quotations (termasuk yang sudah partial paid)
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_invoice/quotations/available', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data);
      } catch (err) {
        console.error("Gagal load data quotations", err);
        Swal.fire('Warning', 'Some projects might be fully paid', 'warning');
      }
    };
    fetchQuotes();
  }, []);

  const handleProjectChange = (e) => {
    const selectedProjectId = e.target.value;
    const selectedQuote = quotations.find(q => q.projectId === selectedProjectId);

    if (selectedQuote) {
      const totalContract = Number(selectedQuote.clientPrice || 0);
      const rawTop = selectedQuote.topOption || 'COD';
      const topText = rawTop.toUpperCase();
      
      let percent = 100;
      let phase = "FULL PAYMENT";
      let calculatedAmount = 0;

      // Cek apakah ini progress invoice (sudah ada yang paid)
      const hasPartialPayment = selectedQuote.totalPaid > 0;
      
      if (hasPartialPayment) {
        // Jika sudah pernah bayar, hitung sisa
        calculatedAmount = selectedQuote.remainingAmount;
        phase = `REMAINING BALANCE (${topText})`;
        percent = (calculatedAmount / totalContract) * 100;
      } else {
        // Logic TOP seperti biasa
        const percentageMatch = topText.match(/(\d+)%/);
        
        if (percentageMatch) {
          percent = parseInt(percentageMatch[1]);
          phase = `TERMIN/DP ${percent}%`;
          calculatedAmount = (totalContract * percent) / 100;
        } else if (
          topText.includes("NET") || 
          topText.includes("COD") || 
          topText.includes("CBD") || 
          topText.includes("CIA") ||
          topText.includes("/") 
        ) {
          percent = 100;
          phase = `FULL PAYMENT (${topText})`;
          calculatedAmount = totalContract;
        } else if (topText.includes("TERMIN")) {
          percent = 100;
          phase = "TERMIN (FULL AMOUNT)";
          calculatedAmount = totalContract;
        }
      }

      setFormData({
        ...formData,
        projectId: selectedQuote.projectId,
        projectName: (selectedQuote.projectName || "PROJECT " + selectedQuote.projectId).toUpperCase(),
        clientName: (selectedQuote.clientName || "N/A").toUpperCase(),
        items: selectedQuote.items || [],
        amount: calculatedAmount,
        totalContractValue: totalContract,
        billingPhase: phase.toUpperCase(),
        topOption: topText,
        isProgressInvoice: hasPartialPayment
      });
    } else {
      setFormData({
        ...formData,
        projectId: '',
        projectName: '',
        clientName: '',
        items: [],
        amount: 0,
        totalContractValue: 0,
        billingPhase: '',
        topOption: '',
        isProgressInvoice: false
      });
    }
  };

const generatePDF = (data) => {
    try {
      const doc = new jsPDF();
      
      // HEADER
      doc.addImage("/header-batavia.png", 'PNG', 0, 0, 210, 40);
      
      // JUDUL INVOICE
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text("INVOICE", 14, 55);

      // INFO CLIENT & INVOICE
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("To :", 14, 65);
      doc.setFont(undefined, 'bold');
      doc.text((data.clientName || '').toUpperCase(), 14, 71);
      
      doc.setFont(undefined, 'normal');
      doc.text("Date", 120, 65);     
      doc.text(`: ${new Date().toLocaleDateString('en-GB')}`, 150, 65);
      doc.text("INVOICE #", 120, 71); 
      doc.text(`: ${data.invoiceNumber}`, 150, 71);
      doc.text("Quotation #", 120, 77); 
      doc.text(`: ${data.projectId || '-'}`, 150, 77);
      doc.text("Due Date", 120, 83);  
      doc.text(`: ${data.dueDate || '-'}`, 150, 83);

      // TABEL ITEMS
      const tableRows = (data.items || []).map(item => [
        item.quantity || 0,
        (item.itemName || '').toUpperCase(),
        '',
        `Rp ${Number(item.price || item.cogs || 0).toLocaleString()}`,
        `Rp ${(Number(item.quantity || 0) * Number(item.price || item.cogs || 0)).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 92,
        head: [['Qty', 'Description', '', 'Unit Price (IDR)', 'Line Total (IDR)']],
        body: tableRows,
        theme: 'plain',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left', cellWidth: 85 },
          2: { cellWidth: 5 },
          3: { halign: 'right', cellWidth: 38 },
          4: { halign: 'right', cellWidth: 38 },
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            doc.setDrawColor(230);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      // HITUNG POSISI SETELAH TABEL
      const finalY = doc.lastAutoTable.finalY + 15;
      
      // BARIS 1: TOTAL CONTRACT
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text("Total Contract", 130, finalY);
      doc.text(`Rp ${Number(data.totalContractValue).toLocaleString()}`, 196, finalY, { align: 'right' });
      
      // BARIS 2: BILLING PHASE (jarak 12pt kebawah)
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const isProgress = data.billingPhase?.includes('REMAINING') || data.billingPhase?.includes('SISA');
      
      if (isProgress) {
        doc.text("REMAINING BALANCE", 130, finalY + 12);
        doc.text(`Rp ${Number(data.amount).toLocaleString()}`, 196, finalY + 12, { align: 'right' });
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("*Previous payment has been made", 130, finalY + 18);
        var paymentStartY = finalY + 38;
      } else {
        doc.text((data.billingPhase || 'FULL PAYMENT').toUpperCase(), 130, finalY + 12);
        doc.text(`Rp ${Number(data.amount).toLocaleString()}`, 196, finalY + 12, { align: 'right' });
        var paymentStartY = finalY + 28;
      }

      // PAYMENT & DELIVERY INFO
      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text("PAYMENT & DELIVERY INFO :", 14, paymentStartY);
      
      doc.setFont(undefined, 'normal');
      const infoList = [
        "Pembayaran melalui Cash / Transfer",
        "Bank Mandiri : 1170011046968",
        "A.n : BATAVIA JAYA KREASINDO",
        `Term of Payment : ${data.topOption}`,
        `Delivery Time   : 7 Working Days after PO / DP Received`,
        "Warranty        : 1 Year"
      ];
      doc.text(infoList, 14, paymentStartY + 7);

      // STEMPEL
      doc.addImage("/stample-batavia.png", 'PNG', 140, paymentStartY + 5, 55, 55);
      doc.setDrawColor(200);
      doc.line(140, paymentStartY + 55, 195, paymentStartY + 55);

      // SIMPAN PDF
      doc.save(`${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire('PDF Error', 'Failed to generate PDF', 'error');
    }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Validasi amount tidak 0
      if (formData.amount <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Amount',
          text: 'Billing amount is 0. Project might be fully paid or no remaining balance.',
          confirmButtonColor: '#0f172a'
        });
        setLoading(false);
        return;
      }
      
      await axios.post('http://localhost:5000/api/client_invoice', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: 'INVOICE CREATED',
        html: formData.isProgressInvoice ? 
          `Progress invoice for remaining balance <strong>Rp ${formData.amount.toLocaleString()}</strong> has been created!` :
          `Invoice <strong>${formData.invoiceNumber}</strong> created successfully!`,
        confirmButtonColor: '#0f172a'
      });
      
      navigate('/dashboard');
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'FAILED', 
        text: err.response?.data?.msg || 'Gagal membuat invoice' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6">
        <button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group">
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Create <span className="text-indigo-600">Client Invoice</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Finance Module • Billing & Collection</p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-6xl space-y-10">
          
          {/* Info Banner untuk Progress Invoice */}
          {formData.isProgressInvoice && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-xl">!</div>
              <div>
                <p className="font-black text-amber-800 uppercase text-sm tracking-tight">Progress Invoice / Remaining Balance</p>
                <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">
                  This project already has paid invoice(s). Current billing is for the REMAINING balance.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 1: SOURCE */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Billing Source
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                  Select Project (Available for Billing)
                </label>
                <select 
                  name="projectId" 
                  required 
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm cursor-pointer" 
                  onChange={handleProjectChange}
                >
                  <option value="">-- Link to Client Quotation --</option>
                  {quotations.map(q => (
                    <option key={q._id} value={q.projectId}>
                      {q.projectId} - {q.projectName} 
                      {q.totalPaid > 0 && ` (Paid: Rp ${q.totalPaid.toLocaleString()} | Remaining: Rp ${q.remainingAmount.toLocaleString()})`}
                    </option>
                  ))}
                </select>
                <p className="text-[8px] text-slate-400 italic mt-1">
                  * Only projects with unpaid/remaining balance are shown
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Invoice Number</label>
                <input type="text" value={formData.invoiceNumber} readOnly className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: DETAILS (sama seperti sebelumnya) */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02. Invoice Details
            </h3>
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Client Name</label>
                  <div className="text-2xl font-black text-slate-800 italic uppercase leading-tight">{formData.clientName || '---'}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Project Name</label>
                  <div className="text-xl font-bold text-slate-600 italic leading-tight">{formData.projectName || '---'}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Term of Payment</label>
                  <div className="text-xl font-black text-amber-500 italic uppercase leading-tight">{formData.topOption || '---'}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Itemized Billing</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.items.length > 0 ? formData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="font-bold text-slate-700 uppercase text-xs italic">{item.itemName}</span>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  )) : <p className="text-[10px] italic text-slate-400 uppercase font-black tracking-widest">Awaiting data...</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMERCIALS (dengan tambahan info progress) */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 03. Due Date & Pricing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Payment Due Date</label>
                <input 
                  type="date" 
                  required 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none font-bold text-slate-800 focus:border-indigo-600 shadow-sm" 
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic underline decoration-emerald-500/30 ${
                  formData.isProgressInvoice ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {formData.isProgressInvoice ? 'REMAINING BALANCE' : 'Current Billing Amount'} ({formData.billingPhase || 'Full Payment'})
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    readOnly 
                    className={`w-full p-4 bg-slate-50 border-2 rounded-xl font-black text-4xl outline-none shadow-inner ${
                      formData.isProgressInvoice ? 'border-amber-500 text-amber-600' : 'border-emerald-500 text-emerald-600'
                    }`} 
                    value={`Rp ${Number(formData.amount || 0).toLocaleString()}`} 
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">
                      Total Contract: <span className="text-slate-600">Rp {Number(formData.totalContractValue || 0).toLocaleString()}</span>
                    </p>
                    <p className="text-[9px] font-black text-indigo-500 uppercase italic tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">
                      TOP: {formData.topOption || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end items-stretch gap-3 pt-8 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading || formData.amount <= 0}
              className={`px-10 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading || formData.amount <= 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'GENERATING...' : formData.isProgressInvoice ? 'Generate Progress Invoice' : 'Generate Client Invoice'}
            </button>

            <button 
              type="button" 
              onClick={() => generatePDF(formData)}
              disabled={formData.amount <= 0}
              className={`px-6 py-4 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center group ${
                formData.amount <= 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
              }`}
              title="Download PDF Only"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={3} 
                stroke="currentColor" 
                className="w-5 h-5 group-hover:translate-y-1 transition-transform"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default AddClientInvoice;