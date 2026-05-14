import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FinanceInputPayment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [unpaidStages, setUnpaidStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    evidence: null
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project-billing', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        console.error("Gagal load projects", err);
      }
    };
    fetchProjects();
  }, []);

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    const project = projects.find(p => p.projectId === projectId);
    setSelectedProject(project);
    setSelectedStage(null);
    setSelectedInvoice(null);
    setFormData(prev => ({ ...prev, amountPaid: '' }));
    
    if (projectId) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/project-billing/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const unpaid = res.data.stages?.filter(stage => 
          stage.status !== 'Paid' && stage.invoice
        ) || [];
        
        setUnpaidStages(unpaid);
        
        if (unpaid.length === 0) {
          Swal.fire('Info', 'No unpaid invoices for this project', 'info');
        }
      } catch (err) {
        console.error("Gagal load stages", err);
        setUnpaidStages([]);
      }
    } else {
      setUnpaidStages([]);
    }
  };

  const handleStageChange = (e) => {
    const stageIndex = e.target.value;
    const stage = unpaidStages[stageIndex];
    setSelectedStage(stage);
    
    if (stage && stage.invoice) {
      setSelectedInvoice(stage.invoice);
      setFormData(prev => ({
        ...prev,
        amountPaid: stage.invoice.amount
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, evidence: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      Swal.fire('Warning', 'Please select a project', 'warning');
      return;
    }
    
    if (!selectedInvoice) {
      Swal.fire('Warning', 'Please select an invoice to pay', 'warning');
      return;
    }
    
    if (!formData.evidence) {
      Swal.fire('Warning', 'Please upload payment evidence', 'warning');
      return;
    }
    
    if (!formData.amountPaid || Number(formData.amountPaid) <= 0) {
      Swal.fire('Warning', 'Invalid payment amount', 'warning');
      return;
    }
    
    setLoading(true);
    
    const submitData = new FormData();
    submitData.append('invoiceId', selectedInvoice.id);
    submitData.append('amountPaid', formData.amountPaid);
    submitData.append('paymentDate', formData.paymentDate);
    submitData.append('remarks', formData.remarks);
    submitData.append('evidence', formData.evidence);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/payments', submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'PAYMENT SUBMITTED',
        text: 'Payment has been recorded and forwarded to verification queue',
        confirmButtonColor: '#0f172a'
      }).then(() => {
        navigate('/verify-payment');
      });
      
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire({
        icon: 'error',
        title: 'FAILED',
        text: err.response?.data?.msg || 'Failed to submit payment',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      <div className="w-full border-b border-slate-100 px-6 md:px-10 py-6 flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Finance <span className="text-indigo-600">Payment Input</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 italic">Record Client Payment • Upload Evidence</p>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
          
          {/* SECTION 1: SELECT PROJECT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
              <span className="w-8 h-1 bg-indigo-600"></span> 01. Select Project
            </h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project</label>
              <select 
                className="w-full mt-1 p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm cursor-pointer"
                onChange={handleProjectChange}
                value={selectedProject?.projectId || ''}
              >
                <option value="">-- Select Project --</option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectId} - {p.projectName} ({p.progressPercent}% paid)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 2: SELECT INVOICE / TERMIN */}
          {selectedProject && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
                <span className="w-8 h-1 bg-indigo-600"></span> 02. Select Invoice / Termin
              </h3>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unpaid Invoices</label>
                <select 
                  className="w-full mt-1 p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm cursor-pointer"
                  onChange={handleStageChange}
                  value={selectedStage ? unpaidStages.indexOf(selectedStage) : ''}
                >
                  <option value="">-- Select Invoice --</option>
                  {unpaidStages.map((stage, idx) => (
                    <option key={idx} value={idx}>
                      {stage.invoice?.invoiceNumber} - {stage.name} (Rp {stage.invoice?.amount?.toLocaleString()})
                    </option>
                  ))}
                </select>
                {unpaidStages.length === 0 && selectedProject && (
                  <p className="text-[10px] text-amber-600 mt-2">No unpaid invoices for this project</p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: DETAIL INVOICE CARD */}
          {selectedInvoice && (
            <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">INVOICE NUMBER</p>
                  <p className="text-xl md:text-2xl font-black mt-1">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">TERMIN / PHASE</p>
                  <p className="text-base md:text-lg font-black mt-1 text-amber-300">{selectedStage?.name || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/10">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client Name</p>
                  <p className="font-bold text-sm uppercase">{selectedProject?.clientName || '-'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project</p>
                  <p className="font-bold text-sm uppercase">{selectedProject?.projectName || '-'}</p>
                </div>
              </div>
              
              <div className="mt-5 pt-5 border-t border-white/10 text-right">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">AMOUNT TO PAY</p>
                <p className="text-2xl md:text-3xl font-black tracking-tighter">Rp {selectedInvoice.amount?.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* SECTION 4: PAYMENT DETAILS */}
          {selectedInvoice && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
                <span className="w-8 h-1 bg-indigo-600"></span> 03. Payment Details
              </h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="amountPaid"
                      required
                      value={formatRupiah(formData.amountPaid)}
                      onChange={handleChange}
                      className="w-full mt-1 p-4 bg-white border border-slate-300 rounded-xl font-black text-emerald-600 text-xl outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      name="paymentDate"
                      required
                      value={formData.paymentDate}
                      onChange={handleChange}
                      className="w-full mt-1 p-4 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Evidence <span className="text-red-500">*</span></label>
                  <div className="relative mt-1 group">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      required
                      onChange={handleFileChange}
                      className="w-full p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl font-bold text-xs text-slate-500 file:hidden cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-indigo-500 pointer-events-none">
                      Upload File →
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1">Accepted formats: JPG, PNG, PDF</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remarks / Notes (Optional)</label>
                  <textarea 
                    name="remarks"
                    rows="3"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full mt-1 p-4 bg-white border border-slate-300 rounded-xl outline-none font-medium text-slate-700 focus:border-indigo-600 transition-all resize-none"
                    placeholder="Additional notes for verification..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading || !selectedProject || !selectedInvoice || !formData.evidence}
              className={`px-8 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading || !selectedProject || !selectedInvoice || !formData.evidence 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'SUBMITTING...' : 'Submit Payment →'}
            </button>
          </div>

          {/* INFO BANNER */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Payment will be forwarded to Verification Queue for Finance approval.
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default FinanceInputPayment;