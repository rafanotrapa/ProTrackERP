import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Header from '../components/Header';
import Footer from '../components/Footer';

const AddClientInvoice = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    projectId: '',
    projectName: '',
    clientName: '',
    items: [], // Array items dari quotation
    amount: 0,
    dueDate: '',
    remarks: '',
    status: 'Paid' // Default Paid biar langsung masuk ke laporan finansial lo
  });

  // 1. Fetch List Client Quotation (Karena Invoice sumbernya dari Quote Client)
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/client_quotation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuotations(res.data);
      } catch (err) {
        console.error("Gagal load client quotations");
      }
    };
    fetchQuotes();
  }, []);

  // 2. Logic Auto-fill pas Project dipilih
  const handleProjectChange = (e) => {
  const selectedProjectId = e.target.value;
  
  // Cari data quotation yang projectId-nya sesuai dengan yang dipilih di dropdown
  const selectedQuote = quotations.find(q => q.projectId === selectedProjectId);

  if (selectedQuote) {
    setFormData({
      ...formData,
      projectId: selectedQuote.projectId,
      // KUNCINYA DI SINI: Ambil projectName dari data quotation
      projectName: selectedQuote.projectName || "Project " + selectedQuote.projectId,
      clientName: selectedQuote.clientName,
      items: selectedQuote.items || [],
      amount: selectedQuote.clientPrice || 0,
      topOption: selectedQuote.topOption || 'COD'
    });
  } else {
    // Reset kalau gak milih apa-apa
    setFormData({
      ...formData,
      projectId: '',
      projectName: '',
      clientName: '',
      items: [],
      amount: 0
    });
  }
};

  // 3. Fungsi Generate PDF (Simple Template)
  const generatePDF = (data) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Invoice No: ${data.invoiceNumber}`, 14, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 45);
    doc.text(`Client: ${data.clientName}`, 14, 55);
    doc.text(`Project: ${data.projectName} (${data.projectId})`, 14, 60);

    const tableRows = data.items.map(item => [
      item.itemName,
      item.quantity,
      item.unit,
      `Rp ${Number(item.cogs).toLocaleString()}` // Ini COGS, bisa lo ganti jadi Price per item kalau ada
    ]);

    doc.autoTable({
      startY: 70,
      head: [['Item Name', 'Qty', 'Unit', 'Price']],
      body: tableRows,
    });

    doc.text(`Total Amount: Rp ${Number(data.amount).toLocaleString()}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`${data.invoiceNumber}.pdf`);
  };

  // 4. Submit: Save to DB + Download PDF
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const token = localStorage.getItem('token');
    
    // 1. Simpan data ke Database dulu (Ini yang tadi udah berhasil)
    await axios.post('http://localhost:5000/api/client_invoice', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 2. Coba Generate PDF (Gue tambahin block try-catch di sini biar gak ngerusak flow save)
    try {
      console.log("Memulai proses generate PDF...");
      generatePDF(formData); // Pastikan fungsi generatePDF lo udah nerima param formData
      console.log("PDF Berhasil di-trigger!");
    } catch (pdfError) {
      console.error("Gagal generate PDF:", pdfError.message);
      Swal.fire({
        icon: 'warning',
        title: 'DATA SAVED, BUT...',
        text: 'Data tersimpan tapi PDF gagal download. Cek console!',
      });
    }

    // 3. Popup Sukses (Kalau data udah masuk, ini harus muncul)
    Swal.fire({
      icon: 'success',
      title: 'INVOICE CREATED',
      text: 'Invoice berhasil disimpan dan data sudah masuk database!',
      confirmButtonColor: '#0f172a'
    });

    navigate('/dashboard');

  } catch (err) {
    console.error("Gagal simpan invoice:", err.message);
    Swal.fire({ 
      icon: 'error', 
      title: 'FAILED', 
      text: 'Gagal simpan invoice ke database. Cek nomor invoice atau koneksi!' 
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
          
          {/* SECTION 1: SOURCE */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Billing Source
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Select Project (From Quotation)</label>
                <select 
  name="projectId" 
  required 
  className="..." 
  onChange={handleProjectChange}
>
  <option value="">-- Link to Client Quotation --</option>
  {quotations.map(q => (
    <option key={q._id} value={q.projectId}>
      {q.projectId} - {q.projectName || 'Tanpa Nama'}
    </option>
  ))}
</select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Invoice Number</label>
                <input type="text" value={formData.invoiceNumber} readOnly className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: AUTO-FILL DISPLAY */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 02. Invoice Details
            </h3>
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {/* Ubah jadi grid-cols-3 */}
  <div>
    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Client Name</label>
    <div className="text-2xl font-black text-slate-800 italic uppercase">{formData.clientName || '---'}</div>
  </div>
  <div>
  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Project Name</label>
  <div className="text-xl font-bold text-slate-600 italic">
    {formData.projectName} {/* Bakal nampilin "Pengadaan Sabun" bukan ID lagi */}
  </div>
</div>
  <div> {/* Baris Baru buat TOP */}
    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Term of Payment</label>
    <div className="text-xl font-black text-amber-500 italic uppercase">{formData.topOption || '---'}</div>
  </div>
</div>
              </div>

              {/* Items Table Recap */}
              <div className="border-t border-slate-200 pt-6">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Itemized Billing</label>
                <div className="space-y-3">
                  {formData.items.length > 0 ? formData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="font-bold text-slate-700 uppercase text-sm italic">{item.itemName}</span>
                      <span className="text-xs font-black text-slate-400">{item.quantity} {item.unit}</span>
                    </div>
                  )) : <p className="text-xs italic text-slate-400 uppercase font-black">No items selected</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMERCIALS */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600"></span> 03. Due Date & Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Due Date</label>
                <input 
                  type="date" 
                  required 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none font-bold" 
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 italic underline decoration-emerald-500/30">Total Billing Amount (IDR)</label>
                <div className="relative">
                   <input 
                    type="text" 
                    readOnly 
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl font-black text-4xl text-emerald-600 outline-none" 
                    value={`Rp ${Number(formData.amount).toLocaleString()}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end pt-8 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-12 py-5 rounded-2xl font-black text-white uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
                loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'PROCESSING...' : 'SAVE INVOICE & DOWNLOAD PDF'}
              <span className="text-xl">⤓</span>
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default AddClientInvoice;