import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─────────────────────────────────────────────────────────────
//  HELPER: format angka ke format Rupiah tanpa simbol
// ─────────────────────────────────────────────────────────────
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  const numberString = value.toString().replace(/[^0-9]/g, '');
  if (numberString === '') return '';
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const stripNonNumeric = (str) => str.toString().replace(/[^0-9]/g, '');

// ─────────────────────────────────────────────────────────────
//  KOMPONEN UTAMA
// ─────────────────────────────────────────────────────────────
const AddClientQuotation = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────
  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [fetching, setFetching]           = useState(false);
  const [loadingDraft, setLoadingDraft]   = useState(false);
  const [quotationMode, setQuotationMode] = useState('auto');
  const [manualItems, setManualItems]     = useState([]);
  const [shippingFee, setShippingFee]     = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(11);

  // ── Form ─────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    quotationId:    `CQ-${Date.now()}`,
    projectId:      '',
    projectName:    '',
    clientName:     '',
    selectedItems:  '',
    items:          [],
    currency:       'IDR',
    topOption:      'COD',
    customTop:      '',
    timestamp:      new Date().toISOString().split('T')[0],
    remarks:        '',
    _id:            null,
    approvalStatus: 'Draft',
  });

  // ─────────────────────────────────────────────────────────
  //  REFS — KUNCI MENCEGAH INFINITE LOOP
  //
  //  lastProjectIdRef : menyimpan projectId yang TERAKHIR
  //                     di-fetch. Jika projectId sama dengan
  //                     nilai ini, skip fetch → tidak ada loop.
  //  isFetchingRef    : mutex sederhana agar tidak ada dua
  //                     fetch berjalan bersamaan.
  //
  //  Dengan dua ref ini, useEffect([formData.projectId]) aman:
  //  - setFormData di dalam effect TIDAK memicu effect ulang
  //    karena dependency hanya formData.projectId (bukan
  //    seluruh formData).
  //  - Jika projectId tidak berubah, ref guard langsung return.
  // ─────────────────────────────────────────────────────────
  const lastProjectIdRef = useRef(null);
  const isFetchingRef    = useRef(false);

  // ─────────────────────────────────────────────────────────
  //  DERIVED VALUES — dihitung langsung saat render,
  //  BUKAN melalui useEffect/useState tambahan.
  //  Ini menghilangkan seluruh kelas masalah "state update
  //  memicu re-render memicu state update".
  // ─────────────────────────────────────────────────────────
  const activeItems  = quotationMode === 'auto' ? formData.items : manualItems;
  const subtotal     = activeItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.salesPrice) || 0), 0
  );
  const taxAmount    = (subtotal * taxPercentage) / 100;
  const grandTotal   = subtotal + (Number(shippingFee) || 0) + taxAmount;

  // ─────────────────────────────────────────────────────────
  //  LOAD PROJECTS LIST — sekali saat mount, [] deps
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/project', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      } catch (err) {
        console.error('Gagal load project list', err);
      }
    };
    fetchProjectsList();
  }, []); // ← hanya sekali

  // ─────────────────────────────────────────────────────────
  //  MAIN EFFECT — fetch data saat projectId berubah
  //
  //  MENGAPA AMAN DARI INFINITE LOOP:
  //  1. Dependency: hanya formData.projectId (string primitif).
  //     React membandingkan string dengan === → hanya trigger
  //     saat nilai string benar-benar berbeda.
  //  2. Guard lastProjectIdRef: bahkan jika React re-render
  //     ulang karena alasan lain dan effect ini dipanggil,
  //     jika projectId sama → langsung return, tidak fetch.
  //  3. setFormData di dalam effect TIDAK mengubah projectId,
  //     jadi tidak ada pemicu ulang effect ini.
  //  4. quotationMode, manualItems, shippingFee, taxPercentage
  //     bukan dependency → perubahannya tidak memicu effect.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const projectId = formData.projectId;

    // Guard 1: belum ada project
    if (!projectId) return;

    // Guard 2: project sama, tidak perlu fetch ulang
    if (lastProjectIdRef.current === projectId) return;

    // Guard 3: mutex — fetch sedang berjalan
    if (isFetchingRef.current) return;

    // Tandai sebelum async dimulai
    lastProjectIdRef.current = projectId;
    isFetchingRef.current    = true;

    const fetchAllDetails = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');

        // ── Fetch project info ─────────────────────────────
        const resProject = await axios.get(
          `http://localhost:5000/api/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const mode = resProject.data.quotationMode || 'auto';

        // setQuotationMode hanya mengubah state lokal 'quotationMode',
        // tidak termasuk dalam dependency → tidak memicu effect ulang
        setQuotationMode(mode);

        if (mode === 'auto') {
          // ── AUTO MODE ──────────────────────────────────
          try {
            const resSQ = await axios.get(
              `http://localhost:5000/api/supplier_quotation/project/${projectId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const supplierItems = (resSQ.data.items || []).map((item) => ({
              itemName:   item.itemName,
              quantity:   item.quantity,
              unit:       item.unit,
              cogs:       item.cogs,
              salesPrice: 0,
            }));

            const itemNamesString = supplierItems.length > 0
              ? supplierItems.map((i) => `- ${i.itemName} (${i.quantity} ${i.unit})`).join('\n')
              : 'Tidak ada item ditemukan';

            // Satu setFormData — tidak menyentuh projectId
            setFormData((prev) => ({
              ...prev,
              projectName:   resProject.data.projectName || 'Tanpa Nama Project',
              clientName:    resProject.data.clientName  || 'N/A',
              selectedItems: itemNamesString,
              items:         supplierItems,
              topOption:     resSQ.data.topOption || 'COD',
            }));
            setManualItems([]);

            // Load draft (opsional, tidak mengubah projectId)
            await loadDraftSilently(projectId, 'auto');

          } catch {
            setFormData((prev) => ({
              ...prev,
              projectName:   resProject.data.projectName || 'Tanpa Nama Project',
              clientName:    resProject.data.clientName  || 'N/A',
              selectedItems: 'Belum ada penawaran supplier yang sudah di-approve.',
              items:         [],
            }));
          }

        } else {
          // ── MANUAL MODE ────────────────────────────────
          setFormData((prev) => ({
            ...prev,
            projectName:   resProject.data.projectName || 'Tanpa Nama Project',
            clientName:    resProject.data.clientName  || 'N/A',
            selectedItems: 'Manual Mode: Input items below',
            items:         [],
          }));
          setManualItems([]);

          await loadDraftSilently(projectId, 'manual');
        }

      } catch (err) {
        console.error('Error fetching project/supplier details:', err);
      } finally {
        setFetching(false);
        isFetchingRef.current = false; // lepas mutex
      }
    };

    fetchAllDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.projectId]); // ← HANYA string projectId, bukan object formData

  // ─────────────────────────────────────────────────────────
  //  LOAD DRAFT — dipanggil secara imperatif dari dalam
  //  fetchAllDetails, BUKAN sebagai useEffect terpisah.
  //  Ini mencegah loadDraft menjadi trigger tambahan loop.
  // ─────────────────────────────────────────────────────────
  const loadDraftSilently = async (projectId, mode) => {
    if (!projectId) return;
    setLoadingDraft(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/client_quotation/draft/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data._id) {
        const draft = res.data;

        const itemNamesString = (draft.items || []).length > 0
          ? draft.items.map((item) => `- ${item.itemName} (${item.quantity} ${item.unit})`).join('\n')
          : '';

        // Tidak mengubah projectId → tidak memicu main effect
        setFormData((prev) => ({
          ...prev,
          _id:            draft._id,
          quotationId:    draft.quotationId    || prev.quotationId,
          projectName:    draft.projectName    || prev.projectName,
          clientName:     draft.clientName     || prev.clientName,
          selectedItems:  itemNamesString      || prev.selectedItems,
          items:          mode === 'auto' ? (draft.items || prev.items) : prev.items,
          currency:       draft.currency       || prev.currency,
          topOption:      draft.topOption      || prev.topOption,
          customTop:      draft.customTop      || '',
          remarks:        draft.remarks        || '',
          approvalStatus: draft.approvalStatus || 'Draft',
        }));

        if (mode === 'manual' && draft.items && draft.items.length > 0) {
          setManualItems(
            draft.items.map((item, idx) => ({ ...item, id: Date.now() + idx }))
          );
        }

        if (draft.shippingFee   !== undefined) setShippingFee(draft.shippingFee);
        if (draft.taxPercentage !== undefined) setTaxPercentage(draft.taxPercentage);

        Swal.fire({
          icon:              'info',
          title:             'DRAFT LOADED',
          text:              'Draft sebelumnya ditemukan. Lanjutkan editing!',
          timer:             2000,
          showConfirmButton: false,
        });
      }
    } catch {
      // Tidak ada draft — normal
    } finally {
      setLoadingDraft(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  //  VALIDASI FORM
  // ─────────────────────────────────────────────────────────
  const isFormComplete = useCallback(() => {
    if (!formData.projectId) return false;
    if (!formData.topOption)  return false;
    if (formData.topOption === 'Termin' && !formData.customTop) return false;

    if (quotationMode === 'auto') {
      if (formData.items.length === 0) return false;
      return formData.items.every((item) => item.salesPrice && item.salesPrice > 0);
    } else {
      if (manualItems.length === 0) return false;
      return manualItems.every(
        (item) => item.salesPrice > 0 && item.cogs > 0 && item.itemName.trim() !== ''
      );
    }
  }, [formData.projectId, formData.topOption, formData.customTop, formData.items, quotationMode, manualItems]);

  // ─────────────────────────────────────────────────────────
  //  CRUD MANUAL ITEMS
  // ─────────────────────────────────────────────────────────
  const addManualItem = () => {
    setManualItems((prev) => [
      ...prev,
      { id: Date.now(), itemName: '', quantity: 1, unit: 'Pcs', cogs: 0, salesPrice: 0 },
    ]);
  };

  const updateManualItem = (id, field, value) => {
    setManualItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const numericFields = ['cogs', 'salesPrice', 'quantity'];
        const newValue = numericFields.includes(field)
          ? (stripNonNumeric(value) ? Number(stripNonNumeric(value)) : 0)
          : value;
        return { ...item, [field]: newValue };
      })
    );
  };

  const removeManualItem = (id) => {
    setManualItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ─────────────────────────────────────────────────────────
  //  SALES PRICE (AUTO MODE)
  // ─────────────────────────────────────────────────────────
  const handleSalesPriceChange = (index, value) => {
    const raw = stripNonNumeric(value);
    setFormData((prev) => {
      const updatedItems = prev.items.map((item, i) =>
        i === index ? { ...item, salesPrice: raw ? Number(raw) : 0 } : item
      );
      return { ...prev, items: updatedItems };
    });
  };

  // ─────────────────────────────────────────────────────────
  //  HANDLE FORM CHANGE
  // ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─────────────────────────────────────────────────────────
  //  HANDLE PROJECT SELECT — terpisah agar lebih eksplisit.
  //  Saat project berubah, reset ref agar fetch bisa jalan
  //  (kasus user kembali memilih project yang sama setelah
  //   ganti ke project lain).
  // ─────────────────────────────────────────────────────────
  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;

    // Reset mutex dan last project id saat user ganti project
    // agar effect bisa fetch project baru
    if (newProjectId !== formData.projectId) {
      lastProjectIdRef.current = null;
      isFetchingRef.current    = false;
    }

    setFormData((prev) => ({
      ...prev,
      projectId:      newProjectId,
      projectName:    '',
      clientName:     '',
      selectedItems:  '',
      items:          [],
      _id:            null,
      approvalStatus: 'Draft',
      quotationId:    `CQ-${Date.now()}`,
    }));
    setManualItems([]);
    setShippingFee(0);
    setTaxPercentage(11);
    setQuotationMode('auto');
  };

  // ─────────────────────────────────────────────────────────
  //  SAVE DRAFT
  // ─────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!formData.projectId) {
      Swal.fire({ icon: 'warning', title: 'Pilih Project', text: 'Silakan pilih project terlebih dahulu!' });
      return;
    }
    const itemsToSave = quotationMode === 'auto' ? formData.items : manualItems;
    if (itemsToSave.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No Items', text: 'Tidak ada items untuk disimpan!' });
      return;
    }

    setLoading(true);
    const finalTop = formData.topOption === 'Termin' ? formData.customTop : formData.topOption;

    const payload = {
      quotationId:    formData.quotationId,
      projectId:      formData.projectId,
      projectName:    formData.projectName,
      clientName:     formData.clientName,
      items:          itemsToSave,
      currency:       formData.currency,
      topOption:      finalTop,
      customTop:      formData.customTop,
      remarks:        formData.remarks || '',
      timestamp:      formData.timestamp,
      approvalStatus: 'Draft',
      quotationMode,
      shippingFee,
      taxPercentage,
      taxAmount,
    };

    try {
      const token = localStorage.getItem('token');
      let response;

      if (formData._id) {
        response = await axios.patch(
          `http://localhost:5000/api/client_quotation/${formData._id}/items`,
          { items: itemsToSave, ...payload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/client_quotation',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const newId = response.data.data?._id || response.data._id;
      // Hanya update _id — tidak mengubah projectId → tidak memicu fetch ulang
      setFormData((prev) => ({ ...prev, _id: newId }));

      Swal.fire({
        icon:               'success',
        title:              'DRAFT SAVED',
        text:               'Draft quotation berhasil disimpan. Bisa dilanjutkan nanti.',
        confirmButtonColor: '#0f172a',
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'GAGAL', text: err.response?.data?.msg || 'Gagal simpan draft!' });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  //  SUBMIT FOR APPROVAL
  // ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete()) {
      Swal.fire({
        icon:               'warning',
        title:              'DATA BELUM LENGKAP',
        html:
          'Lengkapi semua field yang diperlukan:<br/>' +
          '- Semua item harus memiliki Sales Price &gt; 0<br/>' +
          '- Term of Payment harus dipilih<br/>' +
          (formData.topOption === 'Termin' ? '- Custom TOP harus diisi<br/>' : ''),
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    setLoading(true);
    const finalTop      = formData.topOption === 'Termin' ? formData.customTop : formData.topOption;
    const itemsToSubmit = quotationMode === 'auto' ? formData.items : manualItems;

    const payload = {
      quotationId:    formData.quotationId,
      projectId:      formData.projectId,
      projectName:    formData.projectName,
      clientName:     formData.clientName,
      items:          itemsToSubmit,
      currency:       formData.currency,
      topOption:      finalTop,
      customTop:      formData.customTop,
      remarks:        formData.remarks || '',
      timestamp:      formData.timestamp,
      approvalStatus: 'Pending',
      quotationMode,
      shippingFee,
      taxPercentage,
      taxAmount,
    };

    try {
      const token = localStorage.getItem('token');
      let response;

      if (formData._id) {
        response = await axios.put(
          `http://localhost:5000/api/client_quotation/${formData._id}/submit`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/client_quotation',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Swal.fire({
        icon:               'success',
        title:              'QUOTATION SUBMITTED',
        text:               'Client Quotation telah dikirim untuk persetujuan Management!',
        confirmButtonColor: '#0f172a',
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'GAGAL', text: err.response?.data?.msg || 'Gagal submit quotation!' });
    } finally {
      setLoading(false);
    }
  };

const generatePDF = () => {
  const currentItems = quotationMode === 'auto' ? formData.items : manualItems;

  if (!formData.projectId || currentItems.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'BELUM ADA DATA',
      text: 'Pilih project dan tambahkan items terlebih dahulu sebelum download PDF.',
      confirmButtonColor: '#0f172a',
    });
    return;
  }

  try {
    const doc = new jsPDF();
    
    const subtotal = quotationMode === 'auto' 
      ? formData.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.salesPrice || 0)), 0)
      : manualItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.salesPrice || 0)), 0);
    
    const taxCalc = (subtotal * taxPercentage) / 100;
    const grandTotalPDF = subtotal + (Number(shippingFee) || 0) + taxCalc;

    // Header image
    try {
      doc.addImage('/header-batavia.png', 'PNG', 0, 0, 210, 40);
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
    doc.text('QUOTATION', 105, 55, { align: 'center' });

    // Info klien & quotation
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('To :', 14, 65);
    doc.setFont('helvetica', 'bold');
    doc.text((formData.clientName || '').toUpperCase(), 14, 71);

    doc.setFont('helvetica', 'normal');
    doc.text('Date', 120, 65);
    doc.text(`: ${new Date().toLocaleDateString('en-GB')}`, 150, 65);
    doc.text('QUOTATION #', 120, 71);
    doc.text(`: ${formData.quotationId}`, 150, 71);
    doc.text('Project ID', 120, 77);
    doc.text(`: ${formData.projectId || '-'}`, 150, 77);

    // Tabel items - CENTERED
    const tableRows = currentItems.map((item) => [
      item.quantity || 0,
      (item.itemName || '').toUpperCase(),
      (item.unit || '').toUpperCase(),
      `Rp ${Number(item.salesPrice || 0).toLocaleString('id-ID')}`,
      `Rp ${((Number(item.quantity) || 0) * (Number(item.salesPrice) || 0)).toLocaleString('id-ID')}`,
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Qty', 'Description', 'Unit', 'Unit Price (IDR)', 'Line Total (IDR)']],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        halign: 'center',  // ← CENTER semua isi tabel
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 70 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 45 },
        4: { halign: 'right', cellWidth: 45 },
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(230);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 15;
    let currentY = finalY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Subtotal', 130, currentY);
    doc.text(`Rp ${subtotal.toLocaleString('id-ID')}`, 196, currentY, { align: 'right' });

    if (shippingFee > 0) {
      currentY += 7;
      doc.text('Shipping Fee', 130, currentY);
      doc.text(`Rp ${Number(shippingFee).toLocaleString('id-ID')}`, 196, currentY, { align: 'right' });
    }

    if (taxPercentage > 0) {
      currentY += 7;
      doc.text(`PPN ${taxPercentage}%`, 130, currentY);
      doc.text(`Rp ${taxCalc.toLocaleString('id-ID')}`, 196, currentY, { align: 'right' });
    }

    currentY += 10;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('GRAND TOTAL', 130, currentY);
    doc.text(`Rp ${grandTotalPDF.toLocaleString('id-ID')}`, 196, currentY, { align: 'right' });

    // Footer
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TERM OF PAYMENT :', 14, currentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(
      formData.topOption === 'Termin'
        ? (formData.customTop || 'Termin')
        : (formData.topOption || 'COD'),
      14, currentY + 27
    );

    if (formData.remarks) {
      doc.setFont('helvetica', 'bold');
      doc.text('REMARKS :', 14, currentY + 37);
      doc.setFont('helvetica', 'normal');
      const splitRemarks = doc.splitTextToSize(formData.remarks, 180);
      doc.text(splitRemarks, 14, currentY + 44);
    }

    // ── STEMPEL / TTD (DITURUNKAN) ──
    const stampY = currentY + (formData.remarks ? 55 : 45);
    
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

    doc.save(`${formData.quotationId}.pdf`);

  } catch (error) {
    console.error('PDF Error:', error);
    Swal.fire('PDF Error', 'Gagal generate PDF: ' + error.message, 'error');
  }
};

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="w-full border-b border-slate-100 px-8 py-8 flex items-center gap-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-white hover:bg-slate-50 border border-slate-200 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group"
        >
          <span className="text-slate-400 group-hover:text-indigo-600 text-xl font-black italic">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Create <span className="text-indigo-600">Quotation</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
            Marketing Module • Revenue Generation
          </p>
        </div>
      </div>

      <main className="flex-1 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-6xl space-y-10">

          {/* Mode Banner */}
          {quotationMode === 'manual' && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                Manual Mode: Input items, COGS, dan Sales Price secara manual
              </p>
            </div>
          )}

          {quotationMode === 'auto' && formData._id && formData.approvalStatus === 'Draft' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Draft Mode: Quotation tersimpan sebagai draft. Lengkapi semua harga dan submit untuk approval.
              </p>
            </div>
          )}

          {/* ── SECTION 1: PROJECT SOURCE ─────────────────── */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600" /> 01. Project Source
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                  Select Project BJK
                </label>
                <select
                  name="projectId"
                  required
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-600 outline-none shadow-sm cursor-pointer"
                  onChange={handleProjectChange}
                  value={formData.projectId}
                >
                  <option value="">-- Cari Project ID --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p.projectId}>
                      {p.projectId} - {p.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                  Quotation Date
                </label>
                <input
                  type="text"
                  value={formData.timestamp}
                  readOnly
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 2: ITEMS & PRICING ────────────────── */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600" /> 02. Items & Pricing
            </h3>

            {fetching || loadingDraft ? (
              <div className="p-20 text-center bg-slate-50 rounded-3xl animate-pulse">
                <p className="font-black text-slate-400 text-sm italic">Loading...</p>
              </div>
            ) : quotationMode === 'auto' ? (
              /* AUTO MODE */
              formData.items.length === 0 ? (
                <div className="p-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="font-black text-slate-400 text-sm italic uppercase tracking-wider">
                    No items available
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Pilih project dengan supplier quotation yang sudah di-approve
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 items-end"
                    >
                      <div className="col-span-4 space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Name</label>
                        <p className="font-bold text-slate-800 text-sm uppercase">{item.itemName}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qty</label>
                        <p className="font-bold text-slate-800">{item.quantity} {item.unit}</p>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">COGS (Modal)</label>
                        <p className="font-bold text-slate-400 text-sm">Rp {Number(item.cogs || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                          Sales Price (to Client) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formatRupiah(item.salesPrice)}
                          onChange={(e) => handleSalesPriceChange(index, e.target.value)}
                          className={`w-full p-2 bg-white border rounded-lg font-black text-right outline-none focus:border-emerald-500 ${
                            item.salesPrice && item.salesPrice > 0
                              ? 'border-emerald-300 text-emerald-600'
                              : 'border-red-300 text-red-500'
                          }`}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* MANUAL MODE */
              <div className="space-y-4">
                {manualItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 items-end"
                  >
                    <div className="col-span-3 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Name *</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateManualItem(item.id, 'itemName', e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg font-bold text-sm uppercase"
                        placeholder="Item name"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qty *</label>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateManualItem(item.id, 'quantity', e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg font-bold text-right"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateManualItem(item.id, 'unit', e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg font-bold"
                        placeholder="Pcs"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">COGS (Modal) *</label>
                      <input
                        type="text"
                        value={formatRupiah(item.cogs)}
                        onChange={(e) => updateManualItem(item.id, 'cogs', e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg font-bold text-right text-slate-600"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sales Price *</label>
                      <input
                        type="text"
                        value={formatRupiah(item.salesPrice)}
                        onChange={(e) => updateManualItem(item.id, 'salesPrice', e.target.value)}
                        className={`w-full p-2 bg-white border rounded-lg font-black text-right ${
                          item.salesPrice > 0 ? 'text-emerald-600 border-emerald-300' : 'text-red-500 border-red-300'
                        }`}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeManualItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addManualItem}
                  className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-colors mt-2"
                >
                  + Add Item
                </button>
              </div>
            )}

            {/* Total Summary — pakai derived values */}
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
              <div className="text-right w-80 space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</p>
                <p className="text-2xl font-black text-slate-800">Rp {formatRupiah(subtotal)}</p>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Shipping Fee</label>
                  <input
                    type="text"
                    value={formatRupiah(shippingFee)}
                    onChange={(e) => setShippingFee(Number(stripNonNumeric(e.target.value)) || 0)}
                    className="w-40 p-2 bg-white border border-slate-300 rounded-lg font-bold text-right"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PPN (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(Number(e.target.value) || 0)}
                      className="w-20 p-2 bg-white border border-slate-300 rounded-lg font-bold text-right"
                      min="0"
                      max="100"
                    />
                    <span className="text-[10px] font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 mt-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax ({taxPercentage}%)</p>
                  <p className="text-sm font-black text-slate-500">Rp {formatRupiah(taxAmount)}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Grand Total</p>
                  <p className="text-3xl font-black text-emerald-600 tracking-tighter">
                    Rp {formatRupiah(grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: TERMS & COMMERCIALS ───────────── */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600" /> 03. Terms & Commercials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Currency</label>
                <select
                  name="currency"
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white font-black text-indigo-600 outline-none cursor-pointer"
                  onChange={handleChange}
                  value={formData.currency}
                >
                  <option value="IDR">IDR (Indonesian Rupiah)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="SGD">SGD (Singapore Dollar)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 italic">
                  Term of Payment (TOP) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="topOption"
                    required
                    className="flex-1 p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none shadow-sm cursor-pointer"
                    onChange={handleChange}
                    value={formData.topOption}
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="CBD">Cash Before Delivery (CBD)</option>
                    <option value="CIA">Cash in Advance (CIA)</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Net 90">Net 90 Days</option>
                    <option value="Net EOM">Net End of Month (EOM)</option>
                    <option value="2/10 Net 30">2/10 Net 30 (2% Disc/10 Days)</option>
                    <option value="Termin">Custom Cicilan / Termin (Manual)</option>
                  </select>

                  {formData.topOption === 'Termin' && (
                    <input
                      type="text"
                      placeholder="Ex: DP 30%"
                      name="customTop"
                      className="w-1/3 p-3 border-2 border-amber-400 rounded-xl outline-none font-black text-amber-600"
                      onChange={handleChange}
                      value={formData.customTop}
                      required
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: ADDITIONAL NOTES ───────────────── */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-indigo-600" /> 04. Additional Notes
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                Remarks / Notes (Optional)
              </label>
              <textarea
                name="remarks"
                rows="3"
                className="w-full p-4 bg-white border border-slate-300 rounded-2xl outline-none font-medium text-slate-700 focus:border-indigo-600 shadow-sm transition-all resize-none"
                placeholder="Tambahkan catatan khusus untuk management..."
                onChange={handleChange}
                value={formData.remarks}
              />
            </div>
          </div>

          {/* ── BUTTONS ───────────────────────────────────── */}
          <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={
                loading ||
                !formData.projectId ||
                (quotationMode === 'auto' ? formData.items.length === 0 : manualItems.length === 0)
              }
              className={`px-6 py-4 rounded-xl font-black text-slate-600 uppercase tracking-widest text-[10px] border-2 border-slate-300 transition-all active:scale-95 ${
                loading ||
                !formData.projectId ||
                (quotationMode === 'auto' ? formData.items.length === 0 : manualItems.length === 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-slate-50 hover:border-indigo-300'
              }`}
            >
              💾 Save Draft
            </button>

            {/* Download PDF — selalu aktif jika ada items */}
            <button
              type="button"
              onClick={generatePDF}
              disabled={
                !formData.projectId ||
                (quotationMode === 'auto' ? formData.items.length === 0 : manualItems.length === 0)
              }
              className={`px-6 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-2 ${
                !formData.projectId ||
                (quotationMode === 'auto' ? formData.items.length === 0 : manualItems.length === 0)
                  ? 'bg-slate-300 cursor-not-allowed'
                  : formData.approvalStatus === 'Approved'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                    : 'bg-slate-600 hover:bg-slate-700 shadow-lg shadow-slate-100'
              }`}
              title={
                formData.approvalStatus !== 'Approved'
                  ? 'Download PDF (Draft — belum di-approve)'
                  : 'Download PDF Final'
              }
            >
              📄 {formData.approvalStatus === 'Approved' ? 'Download PDF' : 'Download PDF'}
            </button>

            {/* Submit for Approval */}
            <button
              type="submit"
              disabled={loading || !isFormComplete()}
              className={`px-10 py-4 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                loading || !isFormComplete()
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-indigo-700 shadow-slate-200'
              }`}
            >
              {loading ? 'SUBMITTING...' : 'Submit for Approval →'}
            </button>
          </div>

          {/* INFO BANNER */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Approval Required: Quotation ini akan direview Management sebelum bisa digunakan untuk Client Invoice.
              PDF dapat didownload kapan saja sebagai draft preview.
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddClientQuotation;