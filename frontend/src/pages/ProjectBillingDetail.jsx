import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import { ArrowLeft, CheckCircle, Clock, FileText, TrendingUp, Package } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProjectBillingDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/project-billing/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error("Gagal load detail", err);
        Swal.fire('Error', 'Failed to load billing details', 'error');
        navigate('/project-billing');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [projectId, navigate]);

  // Fungsi generate PDF invoice
  const generateInvoicePDF = (invoice) => {
    try {
      const doc = new jsPDF();
      
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

      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("INVOICE", 105, 55, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text("To :", 14, 65);
      doc.setFont('helvetica', 'bold');
      doc.text((invoice.clientName || data?.clientName || '').toUpperCase(), 14, 71);
      
      doc.setFont('helvetica', 'normal');
      doc.text("Date", 120, 65);
      doc.text(`: ${new Date().toLocaleDateString('en-GB')}`, 150, 65);
      doc.text("INVOICE #", 120, 71);
      doc.text(`: ${invoice.invoiceNumber}`, 150, 71);
      doc.text("Due Date", 120, 77);
      doc.text(`: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, 150, 77);
      doc.text("TOP", 120, 83);
      doc.text(`: ${invoice.topOption || data?.topOption || '-'}`, 150, 83);

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

      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("PAYMENT & DELIVERY INFO :", 14, finalY + 25);
      
      doc.setFont('helvetica', 'normal');
      const infoList = [
        "Pembayaran melalui Cash / Transfer",
        "Bank Mandiri : 1170011046968",
        "A.n : BATAVIA JAYA KREASINDO",
        `Term of Payment : ${invoice.topOption || data?.topOption}`,
        `Delivery Time   : 7 Working Days after PO / DP Received`,
        "Warranty        : 1 Year"
      ];
      doc.text(infoList, 14, finalY + 32);

      const stampY = finalY + 70;
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
      
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire('Error', 'Failed to generate PDF', 'error');
    }
  };

  // Handle generate next invoice
  const handleGenerateNext = async () => {
    const nextStage = data?.stages?.find(s => s.canGenerate);
    
    const result = await Swal.fire({
      title: 'Generate Invoice?',
      html: `Create invoice for <strong>${nextStage?.name || 'next stage'}</strong><br/>Amount: <strong>Rp ${nextStage?.expectedAmount?.toLocaleString()}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'Yes, Generate',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setGenerating(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`http://localhost:5000/api/project-billing/${projectId}/generate-next`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.invoice) {
          generateInvoicePDF(res.data.invoice);
          
          await Swal.fire({
            icon: 'success',
            title: 'Invoice Generated!',
            html: `
              <p>${res.data.msg}</p>
              <p class="text-sm text-slate-600 mt-2">Invoice: <strong>${res.data.invoice.invoiceNumber}</strong></p>
              <p class="text-sm text-slate-600">Amount: <strong>Rp ${res.data.invoice.amount?.toLocaleString()}</strong></p>
            `,
            confirmButtonColor: '#0f172a',
            timer: 2000,
            showConfirmButton: false
          });
        }
        
        const refreshRes = await axios.get(`http://localhost:5000/api/project-billing/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(refreshRes.data);
        
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.response?.data?.msg || 'Failed to generate invoice',
          confirmButtonColor: '#0f172a'
        });
      } finally {
        setGenerating(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, stages } = data;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      <div className="p-6 md:p-10 lg:p-12">
        <button 
          onClick={() => navigate('/project-billing')} 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-6"
        >
          <ArrowLeft size={16} /> Back to Billing List
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={18} className="text-indigo-500" />
              <p className="text-[10px] font-black text-indigo-500 uppercase">{data.projectId}</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase">{data.projectName}</h1>
            <p className="text-slate-500 font-bold text-xs mt-2">{data.clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Total Contract</p>
            <p className="text-3xl font-black text-emerald-600">Rp {data.totalContractValue?.toLocaleString()}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase mt-1">TOP: {data.topOption}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 p-5 rounded-2xl border">
            <p className="text-[8px] font-black text-slate-400 uppercase">Progress</p>
            <p className="text-2xl font-black">{summary.progressPercent?.toFixed(0)}%</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border">
            <p className="text-[8px] font-black text-slate-400 uppercase">Total Paid</p>
            <p className="text-2xl font-black text-emerald-600">Rp {summary.totalPaid?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border">
            <p className="text-[8px] font-black text-slate-400 uppercase">Remaining</p>
            <p className="text-2xl font-black text-amber-600">Rp {summary.remainingAmount?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border">
            <p className="text-[8px] font-black text-slate-400 uppercase">Status</p>
            <div className="flex items-center gap-2">
              {summary.isComplete ? (
                <><CheckCircle size={18} className="text-emerald-500" /><span className="font-black text-emerald-600">COMPLETE</span></>
              ) : (
                <><Clock size={18} className="text-amber-500" /><span className="font-black text-amber-600">IN PROGRESS</span></>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-[11px] font-black text-slate-800 uppercase mb-5">Payment Stages</h3>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="py-4 px-4 text-[9px] font-black text-slate-500 uppercase">Stage</th>
                <th className="py-4 px-4 text-[9px] font-black text-slate-500 uppercase">Description</th>
                <th className="py-4 px-4 text-[9px] font-black text-slate-500 uppercase text-right">Amount</th>
                <th className="py-4 px-4 text-[9px] font-black text-slate-500 uppercase text-center">Status</th>
                <th className="py-4 px-4 text-[9px] font-black text-slate-500 uppercase text-center">Tgl Bayar</th>
                <th className="py-4 px-4 text-[9px] font-black text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {stages?.map((stage) => (
                <tr key={stage.stageNumber} className="border-b border-slate-100">
                  <td className="py-4 px-4 font-black">{stage.stageNumber}</td>
                  <td className="py-4 px-4 font-bold text-slate-600">{stage.name}</td>
                  <td className="py-4 px-4 text-right font-black text-emerald-600">Rp {stage.expectedAmount?.toLocaleString()}</td>
                  <td className="py-4 px-4 text-center">
                    {stage.status === 'Paid' ? (
                      <span className="px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600">✓ PAID</span>
                    ) : stage.invoice ? (
                      <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600">⏳ UNPAID</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[9px] font-black bg-slate-100 text-slate-500">NOT GENERATED</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {stage.invoice?.paymentDate ? (
                      <span className="text-[10px] font-bold text-slate-600">
                        {new Date(stage.invoice.paymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {stage.canGenerate && (
                      <button
                        onClick={handleGenerateNext}
                        disabled={generating}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase disabled:opacity-50"
                      >
                        {generating ? 'GENERATING...' : 'Generate Invoice'}
                      </button>
                    )}
                    {stage.invoice && stage.status !== 'Paid' && (
                      <button
                        onClick={() => navigate('/finance-input-payment')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[9px] uppercase"
                      >
                        Record Payment
                      </button>
                    )}
                    {stage.invoice && stage.status === 'Paid' && (
                      <span className="text-[9px] font-black text-emerald-600">✓ Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!summary.isComplete && summary.nextStageCanGenerate && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-indigo-600" />
              <div>
                <p className="font-black text-indigo-800 text-sm uppercase">Ready to Generate Next Invoice</p>
                <p className="text-[9px] text-indigo-600 font-bold uppercase mt-1">
                  Click "Generate Invoice" to create the next invoice. PDF will be downloaded automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProjectBillingDetail;