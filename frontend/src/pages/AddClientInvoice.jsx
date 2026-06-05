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
    isProgressInvoice: false,
    shippingFee: 0,
    taxAmount: 0,
    taxPercentage: 0
  });

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_quotation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter hanya yang approvalStatus === 'Approved'
        const approvedQuotes = res.data.filter(q => q.approvalStatus === 'Approved');
        
        // Hitung remaining amount berdasarkan GRAND TOTAL (include shipping & tax)
        const quotesWithBalance = await Promise.all(approvedQuotes.map(async (quote) => {
          try {
            const invoicesRes = await axios.get(`http://localhost:5000/api/client_invoice/project/${quote.projectId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const shippingFee = quote.shippingFee || 0;
            const taxAmount = quote.taxAmount || 0;
            const grandTotal = quote.clientPrice + shippingFee + taxAmount;
            const totalPaid = invoicesRes.data.summary?.totalPaid || 0;
            const remainingAmount = grandTotal - totalPaid;
            
            return {
              ...quote,
              grandTotal: grandTotal,
              remainingAmount: remainingAmount,
              totalPaid: totalPaid,
              hasPartialPayment: totalPaid > 0
            };
          } catch (err) {
            console.error("Error fetching invoices for project:", quote.projectId, err);
            const shippingFee = quote.shippingFee || 0;
            const taxAmount = quote.taxAmount || 0;
            const grandTotal = quote.clientPrice + shippingFee + taxAmount;
            
            return {
              ...quote,
              grandTotal: grandTotal,
              remainingAmount: grandTotal,
              totalPaid: 0,
              hasPartialPayment: false
            };
          }
        }));
        
        const availableQuotes = quotesWithBalance.filter(q => q.remainingAmount > 0);
        setQuotations(availableQuotes);
      } catch (err) {
        console.error("Gagal load data quotations", err);
        Swal.fire('Warning', 'Gagal memuat data quotation', 'warning');
      }
    };
    fetchQuotes();
  }, []);

  const handleProjectChange = (e) => {
    const selectedProjectId = e.target.value;
    const selectedQuote = quotations.find(q => q.projectId === selectedProjectId);

    if (selectedQuote) {
      const rawTop = selectedQuote.topOption || 'COD';
      const topText = rawTop.toUpperCase();
      
      let percent = 100;
      let phase = "FULL PAYMENT";
      let calculatedAmount = 0;

      // Cek apakah ini progress invoice (sudah ada yang paid)
      const hasPartialPayment = selectedQuote.totalPaid > 0;
      
      if (hasPartialPayment) {
        // Jika sudah pernah bayar, hitung sisa dari GRAND TOTAL
        calculatedAmount = selectedQuote.remainingAmount;
        phase = `REMAINING BALANCE (${topText})`;
        percent = (calculatedAmount / selectedQuote.grandTotal) * 100;
      } else {
        // Logic TOP berdasarkan GRAND TOTAL
        const percentageMatch = topText.match(/(\d+)%/);
        
        if (percentageMatch) {
          percent = parseInt(percentageMatch[1]);
          phase = `TERMIN/DP ${percent}%`;
          calculatedAmount = (selectedQuote.grandTotal * percent) / 100;
        } else if (
          topText.includes("NET") || 
          topText.includes("COD") || 
          topText.includes("CBD") || 
          topText.includes("CIA") ||
          topText.includes("/") 
        ) {
          percent = 100;
          phase = `FULL PAYMENT (${topText})`;
          calculatedAmount = selectedQuote.grandTotal;
        } else if (topText.includes("TERMIN")) {
          percent = 100;
          phase = "TERMIN (FULL AMOUNT)";
          calculatedAmount = selectedQuote.grandTotal;
        }
      }

      // Mapping items dengan salesPrice dari client quotation
      const itemsWithSalesPrice = (selectedQuote.items || []).map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.salesPrice || item.cogs,
        cogs: item.cogs
      }));

      setFormData({
        ...formData,
        projectId: selectedQuote.projectId,
        projectName: (selectedQuote.projectName || "PROJECT " + selectedQuote.projectId).toUpperCase(),
        clientName: (selectedQuote.clientName || "N/A").toUpperCase(),
        items: itemsWithSalesPrice,
        amount: calculatedAmount,
        totalContractValue: selectedQuote.grandTotal,
        billingPhase: phase.toUpperCase(),
        topOption: topText,
        isProgressInvoice: hasPartialPayment,
        shippingFee: selectedQuote.shippingFee || 0,
        taxAmount: selectedQuote.taxAmount || 0,
        taxPercentage: selectedQuote.taxPercentage || 0
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
        isProgressInvoice: false,
        shippingFee: 0,
        taxAmount: 0,
        taxPercentage: 0
      });
    }
  };

  const generatePDF = (data) => {
    try {
      const doc = new jsPDF();
      
      doc.addImage("/header-batavia.png", 'PNG', 0, 0, 210, 40);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text("INVOICE", 105, 55, { align: 'center' });

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
      doc.text("Due Date", 120, 77);  
      doc.text(`: ${data.dueDate || '-'}`, 150, 77);
      doc.text("TOP", 120, 83);  
      doc.text(`: ${data.topOption || '-'}`, 150, 83);

      // TABEL ITEMS
      const tableRows = (data.items || []).map(item => [
        item.quantity || 0,
        (item.itemName || '').toUpperCase(),
        (item.unit || '').toUpperCase(),
        `Rp ${Number(item.price || 0).toLocaleString()}`,
        `Rp ${(Number(item.quantity || 0) * Number(item.price || 0)).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 92,
        head: [['Qty', 'Description', 'Unit', 'Unit Price (IDR)', 'Total (IDR)']],
        body: tableRows,
        theme: 'plain',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        bodyStyles: { halign: 'center' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left', cellWidth: 75 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 45 },
          4: { halign: 'right', cellWidth: 45 },
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            doc.setDrawColor(230);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      let currentY = finalY;
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text("Subtotal", 130, currentY);
      doc.text(`Rp ${Number(data.totalContractValue - (data.shippingFee || 0) - (data.taxAmount || 0)).toLocaleString()}`, 196, currentY, { align: 'right' });
      
      if (data.shippingFee > 0) {
        currentY += 7;
        doc.text("Shipping Fee", 130, currentY);
        doc.text(`Rp ${Number(data.shippingFee).toLocaleString()}`, 196, currentY, { align: 'right' });
      }
      
      if (data.taxAmount > 0) {
        currentY += 7;
        doc.text(`PPN ${data.taxPercentage || 0}%`, 130, currentY);
        doc.text(`Rp ${Number(data.taxAmount).toLocaleString()}`, 196, currentY, { align: 'right' });
      }
      
      currentY += 10;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      
      const isProgress = data.billingPhase?.includes('REMAINING');
      
      if (isProgress) {
        doc.text("REMAINING BALANCE", 130, currentY);
        doc.text(`Rp ${Number(data.amount).toLocaleString()}`, 196, currentY, { align: 'right' });
        var paymentStartY = currentY + 20;
      } else {
        doc.text((data.billingPhase || 'FULL PAYMENT').toUpperCase(), 130, currentY);
        doc.text(`Rp ${Number(data.amount).toLocaleString()}`, 196, currentY, { align: 'right' });
        var paymentStartY = currentY + 20;
      }

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

      // Stempel
      const stampY = paymentStartY + (infoList.length * 4) + 10;
      try {
        doc.addImage("/stample-batavia.png", 'PNG', 140, stampY, 55, 55);
        doc.setDrawColor(200);
        doc.line(140, stampY + 50, 195, stampY + 50);
      } catch {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('[Digital Stamp]', 167, stampY + 30, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      doc.save(`${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire('PDF Error', 'Failed to generate PDF', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDASI: Pastikan due date diisi
    if (!formData.dueDate) {
      Swal.fire({
        icon: 'warning',
        title: 'INCOMPLETE DATA',
        text: 'Please fill in the Payment Due Date!',
        confirmButtonColor: '#0f172a'
      });
      return;
    }
    
    // Validasi amount tidak 0
    if (formData.amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Amount',
        text: 'Billing amount is 0. Project might be fully paid or no remaining balance.',
        confirmButtonColor: '#0f172a'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        invoiceNumber: formData.invoiceNumber,
        projectId: formData.projectId,
        projectName: formData.projectName,
        clientName: formData.clientName,
        items: formData.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          cogs: item.cogs
        })),
        amount: formData.amount,
        totalContractValue: formData.totalContractValue,
        billingPhase: formData.billingPhase,
        dueDate: formData.dueDate,
        remarks: formData.remarks,
        topOption: formData.topOption,
        status: 'Unpaid',
        isProgressInvoice: formData.isProgressInvoice,
        shippingFee: formData.shippingFee,
        taxAmount: formData.taxAmount,
        taxPercentage: formData.taxPercentage
      };
      
      await axios.post('http://localhost:5000/api/client_invoice', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await Swal.fire({
        icon: 'success',
        title: 'INVOICE CREATED!',
        html: `
          <div class="text-left">
            <p class="font-bold mb-2">${formData.isProgressInvoice ? 'Progress Invoice' : 'Invoice'} <strong>${formData.invoiceNumber}</strong> has been created!</p>
            <p class="text-sm text-slate-600 mt-2">Amount: <strong>Rp ${formData.amount.toLocaleString()}</strong></p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📄 Download PDF',
        cancelButtonText: 'Go to Dashboard',
        confirmButtonColor: '#0f172a',
        cancelButtonColor: '#64748b'
      });
      
      if (result.isConfirmed) {
        generatePDF(formData);
      }
      
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
                  Select Project (From Approved Client Quotation)
                </label>
                <select 
                  name="projectId" 
                  required 
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm cursor-pointer" 
                  onChange={handleProjectChange}
                  value={formData.projectId}
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
                  * Only projects with approved client quotation and unpaid balance are shown
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Invoice Number</label>
                <input type="text" value={formData.invoiceNumber} readOnly className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: INVOICE DETAILS */}
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
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Itemized Billing (with Sales Price)</label>
                <div className="grid grid-cols-1 gap-3">
                  {formData.items.length > 0 ? formData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div>
                        <span className="font-bold text-slate-700 uppercase text-xs italic">{item.itemName}</span>
                        <span className="text-[9px] text-slate-400 ml-2">({item.quantity} {item.unit})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          Rp {Number(item.price || 0).toLocaleString()} / unit
                        </span>
                        {item.cogs && (
                          <p className="text-[8px] text-slate-400 line-through mt-1">COGS: Rp {item.cogs.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-[10px] italic text-slate-400 uppercase font-black tracking-widest">Awaiting data...</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: DUE DATE & PRICING */}
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
                      Grand Total: <span className="text-slate-600">Rp {Number(formData.totalContractValue || 0).toLocaleString()}</span>
                    </p>
                    <p className="text-[9px] font-black text-indigo-500 uppercase italic tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">
                      TOP: {formData.topOption || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* BUTTONS */}
          <div className="flex justify-end items-stretch gap-3 pt-8 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading || formData.amount <= 0 || !formData.dueDate}
              className={`px-10 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading || formData.amount <= 0 || !formData.dueDate ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'GENERATING...' : formData.isProgressInvoice ? 'Generate Progress Invoice' : 'Generate Client Invoice'}
            </button>

            <button 
              type="button" 
              onClick={() => generatePDF(formData)}
              disabled={formData.amount <= 0 || formData.items.length === 0}
              className={`px-6 py-4 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center group ${
                formData.amount <= 0 || formData.items.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
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