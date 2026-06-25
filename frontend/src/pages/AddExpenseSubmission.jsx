import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Upload, Search, ReceiptText, Plus, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────────────────────
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  const numberString = value.toString().replace(/[^0-9]/g, '');
  if (numberString === '') return '';
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const stripNonNumeric = (str) => str.toString().replace(/[^0-9]/g, '');

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  name: '',
  description: '',
  amount: '',
});

const AddExpenseSubmission = () => {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [projects, setProjects] = useState([]);

  // ── Project searchable dropdown ──────────────────────────
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    submissionId: `EXP-${Date.now()}`,
    projectId:    '',
    projectName:  '',
    currency:     'IDR',
    remarks:      '',
    file:         null,
  });

  // ── Multi-item — mirip konsep ClientQuotation/SupplierQuotation ──
  const [items, setItems] = useState([emptyItem()]);

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [items]
  );

  // ── Load project list (semua project — fleksibel, tidak terikat status) ──
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data || []);
      } catch (err) {
        console.error('Gagal load project list', err);
      }
    };
    fetchProjects();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      `${p.projectId || ''} ${p.projectName || ''} ${p.clientName || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const handleSelectProject = (p) => {
    setFormData((prev) => ({
      ...prev,
      projectId:   p.projectId,
      projectName: p.projectName,
    }));
    setOpenDropdown(false);
    setSearchTerm('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/')) {
        Swal.fire('ERROR', 'Hanya dokumen/gambar yang diperbolehkan!', 'error');
        return;
      }
      setFormData((prev) => ({ ...prev, file: selectedFile }));
    }
  };

  // ── CRUD items ────────────────────────────────────────────
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'amount') {
          const raw = stripNonNumeric(value);
          return { ...it, amount: raw ? Number(raw) : '' };
        }
        return { ...it, [field]: value };
      })
    );
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectId) {
      return Swal.fire('PILIH PROJECT', 'Silakan pilih project terlebih dahulu!', 'warning');
    }

    const validItems = items.filter((it) => it.name.trim() && Number(it.amount) > 0);
    if (validItems.length === 0) {
      return Swal.fire('ITEM TIDAK VALID', 'Minimal satu item dengan nama & nominal wajib diisi!', 'warning');
    }
    if (!formData.file) {
      return Swal.fire('LAMPIRAN WAJIB', 'Upload bukti / lampiran pendukung dulu!', 'warning');
    }

    setLoading(true);
    const data = new FormData();
    data.append('submissionId', formData.submissionId);
    data.append('projectId', formData.projectId);
    data.append('projectName', formData.projectName);
    data.append('currency', formData.currency);
    data.append('remarks', formData.remarks);
    data.append('file', formData.file);
    data.append('items', JSON.stringify(
      validItems.map((it) => ({
        name: it.name,
        description: it.description,
        amount: Number(it.amount),
      }))
    ));

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/expense-submission', data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon:               'success',
        title:              'SUBMITTED',
        text:               'Pengajuan biaya berhasil dikirim untuk verifikasi Finance.',
        confirmButtonColor: '#0f172a',
      });
      navigate('/expense-submission-log');
    } catch (err) {
      console.error('FULL ERROR TRACE:', err);
      const errorMessage = err.response?.data?.msg || err.message;
      Swal.fire('GAGAL', `Detail: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6">
        <button
          onClick={() => navigate('/expense-submission-menu')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-amber-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Submit <span className="text-amber-600">Expense</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Biaya Tambahan • Reimburse & Operasional Project
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-10">

          {/* ── SECTION 1: PROJECT ─────────────────────────── */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-amber-600" /> 01. Project Reference
            </h3>

            <div className="space-y-1" ref={dropdownRef}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                Pilih Project <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown((v) => !v)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-left text-slate-800 focus:border-amber-500 outline-none shadow-sm flex items-center justify-between"
                >
                  <span className={formData.projectId ? 'text-slate-800' : 'text-slate-400'}>
                    {formData.projectId
                      ? `${formData.projectId} — ${formData.projectName}`
                      : '-- Cari Project ID / Nama --'}
                  </span>
                  <Search size={14} className="text-slate-400" />
                </button>

                {openDropdown && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
                      <input
                        type="text"
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari project..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                    {filteredProjects.length === 0 ? (
                      <p className="p-4 text-center text-[10px] text-slate-400 italic">Tidak ada project ditemukan</p>
                    ) : (
                      filteredProjects.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => handleSelectProject(p)}
                          className="px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <p className="text-xs font-black text-slate-800">{p.projectId}</p>
                          <p className="text-[10px] text-slate-500">{p.projectName}</p>
                          <p className="text-[9px] text-slate-400">{p.clientName}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="text-[9px] text-slate-400 ml-1 mt-1 italic">
                Project boleh dalam status apa saja — aktif maupun sudah selesai.
              </p>
            </div>

            <div className="space-y-1 max-w-xs">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white font-black text-amber-600 outline-none cursor-pointer"
              >
                <option value="IDR">IDR (Indonesian Rupiah)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="SGD">SGD (Singapore Dollar)</option>
              </select>
            </div>
          </div>

          {/* ── SECTION 2: DAFTAR BIAYA (MULTI-ITEM) ───────── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                <span className="w-8 h-1 bg-amber-600" /> 02. Daftar Biaya
              </h3>
              <span className="text-[9px] font-black text-slate-400 uppercase">{items.length} item</span>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 items-start">
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Nama Biaya {index === 0 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="e.g Meeting"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Deskripsi</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Detail singkat (optional)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-9 md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Nominal *</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">Rp</span>
                      <input
                        type="text"
                        value={formatRupiah(item.amount)}
                        onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                        placeholder="0"
                        className={`w-full p-2 pl-7 bg-white border rounded-lg font-black text-right text-sm outline-none ${
                          item.amount > 0 ? 'border-amber-300 text-amber-600' : 'border-slate-300 text-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-1 flex items-end justify-center pb-1">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:text-amber-800 transition-colors"
              >
                <Plus size={14} /> Tambah Item Biaya
              </button>
            </div>

            {/* Total Summary */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <div className="text-right w-72">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pengajuan</p>
                <p className="text-2xl font-black text-amber-600 tracking-tighter">
                  Rp {formatRupiah(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: LAMPIRAN ────────────────────────── */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-amber-600" /> 03. Lampiran / Bukti
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 italic">
                Upload Bukti (Struk / Invoice / Foto) <span className="text-red-500">*</span>
              </label>
              <label
                htmlFor="expense-file"
                className="w-full flex items-center gap-3 p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl cursor-pointer hover:bg-amber-100 transition-all"
              >
                <Upload size={20} className="text-amber-600" />
                <div>
                  <p className="text-xs font-black text-amber-700">
                    {formData.file ? formData.file.name : 'Klik untuk upload file'}
                  </p>
                  <p className="text-[9px] text-amber-500">JPG, PNG, atau PDF — maks 5MB. Satu file untuk semua item di atas.</p>
                </div>
              </label>
              <input
                id="expense-file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                Catatan Tambahan (Optional)
              </label>
              <textarea
                name="remarks"
                rows="2"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Catatan internal untuk Finance..."
                className="w-full p-4 bg-white border border-slate-300 rounded-2xl outline-none font-medium text-slate-700 focus:border-amber-500 shadow-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* ── BUTTON ──────────────────────────────────────── */}
          <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className={`px-10 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
              }`}
            >
              <ReceiptText size={14} />
              {loading ? 'MENGIRIM...' : 'Submit Pengajuan →'}
            </button>
          </div>

          {/* INFO BANNER */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Verification Required: Pengajuan ini akan direview Finance sebelum masuk sebagai beban project.
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddExpenseSubmission;