import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PaymentVerifyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        Swal.fire('ERROR', 'Token tidak ditemukan, silakan login ulang', 'error');
        navigate('/');
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/payments/detail/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayment(res.data);
        
        // Jika payment memiliki invoiceId, fetch data invoice secara terpisah
        if (res.data.invoiceId) {
          const invoiceId = res.data.invoiceId._id || res.data.invoiceId;
          try {
            const invoiceRes = await axios.get(`http://localhost:5000/api/client_invoice/${invoiceId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setInvoiceData(invoiceRes.data);
          } catch (invErr) {
            console.error("Failed to fetch invoice:", invErr);
          }
        }
        
      } catch (err) {
        console.error("Fetch error:", err);
        Swal.fire({
          icon: 'error',
          title: 'GAGAL',
          text: err.response?.data?.msg || 'Gagal memuat detail pembayaran',
          confirmButtonColor: '#1e293b'
        });
        navigate('/verify-payment');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const handleAction = async (status) => {
    if (payment.status !== 'Pending') return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/api/payments/verify', 
        { paymentId: id, status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      Swal.fire({
        title: 'SUCCESS!',
        text: `Payment has been ${status.toLowerCase()}`,
        icon: 'success',
        confirmButtonColor: '#1e293b',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/verify-payment');
      });
    } catch (err) {
      console.error("Action error:", err);
      Swal.fire({
        title: 'ERROR!',
        text: err.response?.data?.msg || 'Action failed',
        icon: 'error',
        confirmButtonColor: '#1e293b'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Fungsi download PDF invoice
  const downloadInvoicePDF = async (invoice) => {
    if (!invoice) {
      Swal.fire('Error', 'Invoice data not found', 'error');
      return;
    }

    setDownloading(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      try {
        doc.addImage("/header-batavia.png", 'PNG', 0, 0, 210, 40);
      } catch {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PT. BATAVIA JAYA KREASI', 105, 13, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      // Judul
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("INVOICE", 105, 55, { align: 'center' });

      // Info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text("To :", 14, 65);
      doc.setFont('helvetica', 'bold');
      doc.text((invoice.clientName || '').toUpperCase(), 14, 71);
      
      doc.setFont('helvetica', 'normal');
      doc.text("Date", 120, 65);
      doc.text(`: ${new Date().toLocaleDateString('en-GB')}`, 150, 65);
      doc.text("INVOICE #", 120, 71);
      doc.text(`: ${invoice.invoiceNumber}`, 150, 71);
      doc.text("Due Date", 120, 77);
      doc.text(`: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '-'}`, 150, 77);
      doc.text("TOP", 120, 83);
      doc.text(`: ${invoice.topOption || '-'}`, 150, 83);

      // Tabel items
      const tableRows = (invoice.items || []).map(item => [
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
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Total", 130, finalY);
      doc.text(`Rp ${Number(invoice.amount || 0).toLocaleString()}`, 196, finalY, { align: 'right' });

      // Payment status info
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Payment Status: ${payment?.status || 'Unknown'}`, 14, finalY + 20);
      
      if (payment?.status === 'Verified') {
        doc.setTextColor(0, 128, 0);
        doc.text(`✓ Verified on ${new Date(payment.updatedAt).toLocaleDateString('id-ID')}`, 14, finalY + 27);
      } else if (payment?.status === 'Pending') {
        doc.setTextColor(255, 140, 0);
        doc.text(`⏳ Waiting for verification`, 14, finalY + 27);
      } else if (payment?.status === 'Rejected') {
        doc.setTextColor(255, 0, 0);
        doc.text(`✗ Rejected`, 14, finalY + 27);
      }

      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("PAYMENT & DELIVERY INFO :", 14, finalY + 40);
      
      doc.setFont('helvetica', 'normal');
      const infoList = [
        "Pembayaran melalui Cash / Transfer",
        "Bank Mandiri : 1170011046968",
        "A.n : BATAVIA JAYA KREASINDO",
        `Term of Payment : ${invoice.topOption}`,
        `Delivery Time   : 7 Working Days after PO / DP Received`,
        "Warranty        : 1 Year"
      ];
      doc.text(infoList, 14, finalY + 47);

      // Stempel
      const stampY = finalY + 85;
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

      doc.save(`${invoice.invoiceNumber}.pdf`);
      
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded',
        text: `Invoice ${invoice.invoiceNumber} has been downloaded`,
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire('Error', 'Failed to generate PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="font-bold uppercase tracking-widest text-slate-400 text-[10px]">LOADING DATA...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-bold text-slate-600 text-lg">Payment data not found</p>
          <button 
            onClick={() => navigate('/verify-payment')} 
            className="mt-4 text-indigo-600 underline text-sm"
          >
            Back to Payment List
          </button>
        </div>
      </div>
    );
  }

  const isPending = payment.status === 'Pending';
  const isVerified = payment.status === 'Verified';
  const isRejected = payment.status === 'Rejected';

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000/${path}`;
  };

  // Tentukan invoice yang akan digunakan (dari invoiceData atau payment.invoiceId)
  const displayInvoice = invoiceData || payment.invoiceId;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Header />
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-8 flex-wrap gap-4">
          <div className="border-l-4 border-slate-900 pl-4">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Payment Review</h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Transaction ID: {payment._id}</p>
          </div>
          <button 
            onClick={() => navigate('/verify-payment')} 
            className="px-6 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
          >
            ← Back to List
          </button>
        </div>

        {/* Status Banner */}
        {!isPending && (
          <div className={`p-6 rounded-4xl border-2 ${
            isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <p className="font-black uppercase text-sm tracking-wider">
                {isVerified ? '✓ PAYMENT VERIFIED & MARKED AS PAID' : '✗ PAYMENT REJECTED'}
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-75">
              This payment has already been processed - View only mode
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Sisi Kiri: Bukti Bayar */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transfer Evidence Attachment</label>
            <div className="bg-slate-50 p-4 rounded-4xl border border-slate-100 shadow-inner overflow-hidden">
              {payment.evidencePath ? (
                <img 
                  src={getImageUrl(payment.evidencePath)} 
                  alt="Payment Slip" 
                  className="w-full h-auto rounded-2xl shadow-lg"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm italic">No evidence uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Detail & Action */}
          <div className="space-y-8">
            <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Amount</label>
              <h2 className="text-5xl font-black mt-2 tracking-tighter">Rp {Number(payment.amountPaid || 0).toLocaleString()}</h2>
              
              {/* Status Badge di Detail */}
              <div className="absolute top-6 right-6">
                {isVerified && (
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    ✓ VERIFIED
                  </div>
                )}
                {isRejected && (
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    ✗ REJECTED
                  </div>
                )}
                {isPending && (
                  <div className="bg-amber-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse shadow-lg">
                    ● PENDING
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Client Name</label>
                  <p className="font-bold uppercase">{displayInvoice?.clientName || payment.invoiceId?.clientName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Project</label>
                  <p className="font-bold uppercase">{displayInvoice?.projectName || payment.invoiceId?.projectName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Invoice Number</label>
                  <p className="font-bold uppercase">{displayInvoice?.invoiceNumber || payment.invoiceId?.invoiceNumber || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Transfer Date</label>
                  <p className="font-bold uppercase">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('id-ID') : '-'}</p>
                </div>
                {payment.remarks && (
                  <div className="col-span-2 space-y-1 mt-2 pt-2 border-t border-white/10">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Remarks</label>
                    <p className="text-sm italic text-slate-300">{payment.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Download Invoice PDF - PAKAI displayInvoice */}
            {displayInvoice && (
              <button
                onClick={() => downloadInvoicePDF(displayInvoice)}
                disabled={downloading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloading ? 'GENERATING PDF...' : '📄 Download Invoice PDF'}
              </button>
            )}

            {/* Tombol Action - HANYA muncul kalau status masih Pending */}
            {isPending && (
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => handleAction('Rejected')}
                  disabled={actionLoading}
                  className={`flex-1 py-4 border-2 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                    actionLoading
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {actionLoading ? 'PROCESSING...' : 'Reject Payment'}
                </button>
                <button 
                  onClick={() => handleAction('Verified')}
                  disabled={actionLoading}
                  className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                    actionLoading
                      ? 'bg-slate-300 text-white cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {actionLoading ? 'PROCESSING...' : 'Verify & Mark as Paid'}
                </button>
              </div>
            )}

            {/* Tombol back tambahan untuk yang sudah diproses */}
            {!isPending && (
              <div className="text-center pt-4">
                <button
                  onClick={() => navigate('/verify-payment')}
                  className="w-full py-4 border-2 border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                >
                  ← Back to Payment List
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentVerifyDetail;