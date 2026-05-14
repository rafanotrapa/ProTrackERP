import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle, Truck, Package, 
  DollarSign, FileText, Download, TrendingUp, AlertCircle,
  Building2, User, MapPin, Phone, Mail, Printer
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProjectTimeline = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [poData, setPoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 1. Project Data
        const projectRes = await axios.get(`http://localhost:5000/api/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProject(projectRes.data);
        
        // 2. Billing Data (stages, progress)
        const billingRes = await axios.get(`http://localhost:5000/api/project-billing/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBilling(billingRes.data);
        
        // 3. Invoices
        const invoicesRes = await axios.get(`http://localhost:5000/api/client_invoice/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(invoicesRes.data.invoices || []);
        
        // 4. Purchase Order (opsional)
        try {
          const poRes = await axios.get(`http://localhost:5000/api/purchase_orders/project/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPoData(poRes.data);
        } catch {
          setPoData(null);
        }
        
      } catch (err) {
        console.error("Error fetching timeline data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [projectId]);

  const formatCurrency = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Paid': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'Unpaid': return <Clock size={14} className="text-amber-500" />;
      default: return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const generateReportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Project Report: ${project?.projectId}`, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text("Project Information", 14, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${project?.projectName || '-'}`, 14, 55);
    doc.text(`Client: ${project?.clientName || '-'}`, 14, 62);
    doc.text(`Contract Value: Rp ${formatCurrency(billing?.totalContractValue)}`, 14, 69);
    doc.text(`Progress: ${billing?.summary?.progressPercent?.toFixed(0) || 0}%`, 14, 76);
    
    if (billing?.stages) {
      const stageRows = billing.stages.map(s => [
        s.stageNumber,
        s.name,
        `Rp ${formatCurrency(s.expectedAmount)}`,
        s.status
      ]);
      autoTable(doc, {
        startY: 90,
        head: [['Stage', 'Description', 'Amount', 'Status']],
        body: stageRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
      });
    }
    
    doc.save(`Project_${projectId}_Report.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">LOADING TIMELINE...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-black text-slate-600 text-lg">Project not found</p>
          <button onClick={() => navigate('/timeline')} className="mt-4 text-indigo-600 underline">Back to List</button>
        </div>
      </div>
    );
  }

  const summary = billing?.summary || {};
  const stages = billing?.stages || [];
  const progress = summary.progressPercent || 0;
  const isComplete = summary.isComplete || false;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/timeline')}
            className="bg-white hover:bg-slate-50 border border-slate-200 h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm"
          >
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{project.projectId}</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Timeline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={generateReportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* PROJECT HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                {project.projectName}
              </h2>
              <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><User size={12} /> {project.clientName || 'N/A'}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> Start: {formatDate(project.createdAt)}</span>
                <span className="flex items-center gap-1"><DollarSign size={12} /> Rp {formatCurrency(billing?.totalContractValue)}</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isComplete ? '✓ PROJECT COMPLETED' : '● IN PROGRESS'}
            </div>
          </div>
        </div>

        {/* PROGRESS OVERVIEW */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Overall Progress</h3>
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-black mb-1">
              <span>{progress}% Complete</span>
              <span>{summary.totalPaid ? `Rp ${formatCurrency(summary.totalPaid)} / Rp ${formatCurrency(billing?.totalContractValue)}` : ''}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-emerald-500' : 'bg-linear-to-r from-indigo-500 to-indigo-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* STAGES GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {stages.map((stage) => (
              <div 
                key={stage.stageNumber}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${stage.status === 'Paid' ? 'bg-emerald-50 border-emerald-200' : stage.status === 'Unpaid' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}
                onClick={() => setActiveMilestone(activeMilestone === stage.stageNumber ? null : stage.stageNumber)}
              >
                <p className="text-[8px] font-black text-slate-400 uppercase">Stage {stage.stageNumber}</p>
                <p className="text-[10px] font-black mt-1">{stage.name}</p>
                <p className="text-[11px] font-black text-indigo-600 mt-1">Rp {formatCurrency(stage.expectedAmount)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {getStatusIcon(stage.status)}
                  <span className={`text-[8px] font-black ${stage.status === 'Paid' ? 'text-emerald-600' : stage.status === 'Unpaid' ? 'text-amber-600' : 'text-slate-400'}`}>
                    {stage.status || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TIMELINE MILESTONES */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Milestone Timeline</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            <div className="space-y-6">
              {stages.map((stage, idx) => (
                <div key={stage.stageNumber} className="relative pl-10">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${stage.status === 'Paid' ? 'bg-emerald-500 text-white' : stage.status === 'Unpaid' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-white'}`}>
                    {stage.status === 'Paid' ? <CheckCircle size={16} /> : stage.stageNumber}
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{stage.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Amount: Rp {formatCurrency(stage.expectedAmount)}</p>
                    {stage.invoice && (
                      <p className="text-[9px] text-indigo-600 mt-1">Invoice: {stage.invoice.invoiceNumber}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FINANCIAL & INVOICE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <DollarSign size={14} /> Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">Total Contract</span>
                <span className="font-black text-slate-800">Rp {formatCurrency(billing?.totalContractValue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">Total Paid</span>
                <span className="font-black text-emerald-600">Rp {formatCurrency(summary.totalPaid)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500">Remaining</span>
                <span className="font-black text-amber-600">Rp {formatCurrency(summary.remainingAmount)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[10px] font-bold text-slate-500">Collection Rate</span>
                <span className="font-black text-indigo-600">{summary.progressPercent?.toFixed(0) || 0}%</span>
              </div>
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={14} /> Invoice History
            </h3>
            {invoices.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-8">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-black text-sm">{inv.invoiceNumber}</p>
                      <p className="text-[8px] text-slate-500">{inv.billingPhase || 'Term'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600">Rp {formatCurrency(inv.amount)}</p>
                      <p className={`text-[8px] font-black ${inv.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {inv.status || 'Unpaid'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LOGISTICS & PO SECTION (Opsional) */}
        {poData && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Truck size={14} /> Purchase Order & Logistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-[9px] font-black text-slate-500 uppercase">PO Number</p>
                <p className="font-black text-indigo-600">{poData.poNumber || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-[9px] font-black text-slate-500 uppercase">Delivery Status</p>
                <p className="font-black">{poData.deliveryStatus || 'Pending'}</p>
              </div>
            </div>
          </div>
        )}

        {/* INFO BANNER */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="text-indigo-600 mt-0.5" />
            <div>
              <p className="font-black text-indigo-800 text-xs uppercase tracking-tighter">Project Health</p>
              <p className="text-[9px] text-indigo-600 mt-1">
                {isComplete 
                  ? 'Project completed successfully. All payments settled.'
                  : progress >= 75 
                    ? 'Project near completion. Final stages in progress.'
                    : progress >= 40
                      ? 'Project on track. Continue monitoring milestones.'
                      : 'Project in early stages. Key milestones ahead.'}
              </p>
            </div>
          </div>
        </div>

      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectTimeline;