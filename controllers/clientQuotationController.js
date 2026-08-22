const ClientQuotation  = require('../models/ClientQuotation');
const SupplierQuotation = require('../models/SupplierQuotation');
const { resolveTopOption } = require('../utils/paymentTerms');
const { keIDR, normalkanUang } = require('../utils/uang');
const { kirimDiamDiam } = require('../utils/notify');
const { picMarketing, usersByRole, gabung, namaPelaku } = require('../utils/notifyTargets');

const calculateClientPrice = (items = []) =>
  items.reduce((total, item) => total + (item.quantity || 0) * (item.salesPrice || 0), 0);

const injectSupplierModal = async (quo) => {
  const quoObj = typeof quo.toObject === 'function' ? quo.toObject() : quo;
  let sqSubtotal = 0, sqFee = 0, sqTax = 0, sqModalMurni = 0;

  /* Modal SELALU dikembalikan dalam Rupiah.
   *
   * Alasannya: angka ini dipakai untuk menghitung margin terhadap harga jual,
   * dan quotation supplier bisa berbeda mata uang dengan quotation client-nya.
   * Sebelum ini keduanya dijumlahkan sebagai angka telanjang — COGS dalam CNY
   * dibandingkan langsung dengan harga jual dalam Rupiah.
   *
   * Karena hasilnya kini benar-benar Rupiah, label 'Rp' yang sudah lama
   * di-hardcode di halaman review justru menjadi benar. */
  if (quoObj.quotationMode === 'auto') {
    const sq = await SupplierQuotation.findOne({
      projectId: quoObj.projectId, approvalStatus: 'Approved',
    });
    if (sq) {
      const kurs = sq.exchangeRate;
      const mata = sq.currency;
      sqSubtotal   = keIDR(sq.items.reduce((s, i) => s + (i.cogs || 0) * (i.quantity || 1), 0), kurs, mata);
      sqFee        = keIDR(sq.additionalFee || 0, kurs, mata);
      sqTax        = keIDR(sq.taxAmount     || 0, kurs, mata);
      sqModalMurni = sqSubtotal + sqFee;
    }
  } else {
    // Mode manual: COGS diketik langsung di quotation ini, jadi mata uangnya
    // mengikuti quotation ini pula.
    sqSubtotal   = keIDR(
      (quoObj.items || []).reduce((s, i) => s + (i.cogs || 0) * (i.quantity || 1), 0),
      quoObj.exchangeRate, quoObj.currency
    );
    sqModalMurni = sqSubtotal;
  }

  // Ditandai eksplisit supaya frontend tahu satuan angka-angka ini, dan tidak
  // perlu menebak dari currency milik quotation-nya.
  quoObj.modalCurrency    = 'IDR';
  quoObj.supplierSubtotal = sqSubtotal;
  quoObj.supplierFee      = sqFee;
  quoObj.supplierTax      = sqTax;
  quoObj.totalModal       = sqModalMurni;
  return quoObj;
};

exports.createQuotation = async (req, res) => {
  try {
    const {
      quotationId, projectId, projectName, clientName,
      items, currency, topOption, customTop, remarks,
      bankAccount, quotationMode, shippingFee,
      taxAmount,
    } = req.body;

    const calculatedClientPrice = calculateClientPrice(items);
    const cleanTaxAmount        = Number(taxAmount) || 0;
    const isPPN                 = cleanTaxAmount > 0;
    const finalTop              = resolveTopOption(topOption, customTop);
    const statusAwal            = req.body.approvalStatus || 'Draft';

    /* Mata uang asing wajib membawa kurs — sama seperti Supplier Quotation.
     * Angka ini menentukan nilai Rupiah yang masuk ke laporan dan margin, jadi
     * divalidasi di server, bukan hanya di layar. */
    const uang = normalkanUang(currency, req.body.exchangeRate);
    if (!uang) {
      return res.status(400).json({
        msg: `Quotation dalam ${String(currency).toUpperCase()} wajib menyertakan kurs terhadap Rupiah yang lebih besar dari nol`,
      });
    }

    const newQuotation = new ClientQuotation({
      quotationId,
      projectId,
      projectName,
      clientName,
      items:          items         || [],
      currency:       uang.currency,
      exchangeRate:   uang.exchangeRate,
      clientPrice:    calculatedClientPrice,
      topOption:      finalTop,
      customTop:      finalTop,
      remarks:        remarks       || '',
      bankAccount:    isPPN ? (bankAccount || '') : '',
      approvalStatus: statusAwal,
      quotationMode:  quotationMode || 'auto',
      shippingFee:    Number(shippingFee) || 0,
      taxPercentage:  0,
      taxAmount:      cleanTaxAmount,
    });

    const saved = await newQuotation.save();
    res.status(201).json({
      success: true,
      msg: statusAwal === 'Pending' ? 'Quotation submitted for approval!' : 'Quotation draft saved!',
      data: saved,
    });

    /* Tombol Submit di frontend bercabang: kalau draft-nya belum pernah
     * disimpan, formData._id masih kosong sehingga yang terpanggil POST ke sini,
     * bukan PUT /:id/submit. Dulu hanya submitQuotation yang mengirim
     * notifikasi, jadi quotation yang diisi lalu langsung disubmit muncul di
     * antrean approval TANPA memberi tahu Management sama sekali.
     *
     * Penjagaannya ditaruh di controller, bukan di frontend, supaya jalur POST
     * mana pun — termasuk yang belum ada — ikut terlindungi. */
    if (statusAwal === 'Pending') {
      kirimDiamDiam({
        penerima: gabung([await usersByRole('Management')], req.user?.id),
        jenis: 'clientQuotationSubmitted',
        params: { nomor: saved.quotationId, oleh: await namaPelaku(req) },
        targetTipe: 'clientQuotationApproval', targetId: saved._id, actor: req.user?.id,
      });
    }
  } catch (err) {
    console.error('Error create client quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find().sort({ createdAt: -1 });
    const enriched   = await Promise.all(quotations.map((q) => injectSupplierModal(q)));
    res.json(enriched);
  } catch (err) {
    console.error('Error get all quotations:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await ClientQuotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    const enriched = await injectSupplierModal(quotation);
    res.json(enriched);
  } catch (err) {
    console.error('Error get quotation by id:', err);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Format ID salah' });
    res.status(500).json({ msg: err.message });
  }
};

exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const quotation = await ClientQuotation.findOne({
      projectId, approvalStatus: 'Approved',
    }).sort({ createdAt: -1 });
    if (!quotation)
      return res.status(404).json({ msg: 'Client Quotation belum di-approve atau tidak ditemukan.' });
    const enriched = await injectSupplierModal(quotation);
    res.json(enriched);
  } catch (err) {
    console.error('Error get quotation by project:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {
    const pending  = await ClientQuotation.find({ approvalStatus: 'Pending' }).sort({ createdAt: -1 });
    const enriched = await Promise.all(pending.map((q) => injectSupplierModal(q)));
    res.json(enriched);
  } catch (err) {
    console.error('Error get pending approvals:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.approveQuotation = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id }                      = req.params;
    // approvedBy sebelumnya tidak pernah diisi padahal fieldnya sudah ada di
    // models/ClientQuotation.js — sehingga tidak ada jejak siapa yang menyetujui.
    const updateData = { approvalStatus: status, approvalDate: new Date(), approvedBy: req.user?.id };
    if (status === 'Rejected' && rejectionReason) updateData.rejectionReason = rejectionReason;
    const updated = await ClientQuotation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: `Quotation berhasil di-${status}!`, data: updated });

    const params = { nomor: updated.quotationId, oleh: await namaPelaku(req) };
    if (status === 'Approved') {
      // Finance yang menerbitkan invoice termin setelah quotation disetujui.
      kirimDiamDiam({
        penerima: gabung([await usersByRole('Finance')], req.user?.id),
        jenis: 'clientQuotationApproved', params,
        targetTipe: 'projectBilling', targetId: updated.projectId, actor: req.user?.id,
      });
    } else if (status === 'Rejected') {
      kirimDiamDiam({
        penerima: gabung([await picMarketing(updated.projectId)], req.user?.id),
        jenis: 'clientQuotationRejected', params,
        targetTipe: 'quotationLog', actor: req.user?.id,
      });
    }
  } catch (err) {
    console.error('Error approve quotation:', err);
    if (!res.headersSent) res.status(500).json({ msg: 'Gagal memproses persetujuan quotation' });
  }
};

exports.updateQuotationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items, topOption, customTop, currency, remarks,
      bankAccount, clientName, projectName, quotationMode,
      shippingFee,
      taxAmount,
    } = req.body;

    const existing = await ClientQuotation.findById(id);
    if (!existing) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    const calculatedClientPrice = calculateClientPrice(items || []);
    const finalTop              = resolveTopOption(topOption, customTop);
    const cleanTaxAmount        = taxAmount !== undefined
      ? Number(taxAmount)
      : (existing.taxAmount || 0);
    const isPPN                 = cleanTaxAmount > 0;

    const updated = await ClientQuotation.findByIdAndUpdate(
      id,
      {
        items,
        clientPrice:   calculatedClientPrice,
        topOption:     finalTop,
        customTop:     finalTop,
        currency:      currency      || existing.currency,
        remarks:       remarks       !== undefined ? remarks : existing.remarks,
        bankAccount:   isPPN ? (bankAccount || existing.bankAccount || '') : '',
        clientName:    clientName    || existing.clientName,
        projectName:   projectName   || existing.projectName,
        quotationMode: quotationMode || existing.quotationMode,
        shippingFee:   shippingFee   !== undefined ? Number(shippingFee) : existing.shippingFee,
        taxPercentage: 0,
        taxAmount:     cleanTaxAmount,
      },
      { new: true }
    );

    res.json({ success: true, msg: 'Quotation updated successfully', data: updated });
  } catch (err) {
    console.error('Error update quotation items:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getDraftByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const draft = await ClientQuotation.findOne({
      projectId, approvalStatus: 'Draft',
    }).sort({ createdAt: -1 });
    if (!draft) return res.status(404).json({ msg: 'No draft found for this project' });
    const enriched = await injectSupplierModal(draft);
    res.json(enriched);
  } catch (err) {
    console.error('Error get draft by project:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotationId, projectId, projectName, clientName,
      items, currency, topOption, customTop, remarks,
      bankAccount, quotationMode, shippingFee,
      taxAmount,
    } = req.body;

    const calculatedClientPrice = calculateClientPrice(items || []);
    const finalTop              = resolveTopOption(topOption, customTop);
    const cleanTaxAmount        = Number(taxAmount) || 0;
    const isPPN                 = cleanTaxAmount > 0;

    /* Mata uang asing wajib membawa kurs — sama seperti Supplier Quotation.
     * Angka ini menentukan nilai Rupiah yang masuk ke laporan dan margin, jadi
     * divalidasi di server, bukan hanya di layar. */
    const uang = normalkanUang(currency, req.body.exchangeRate);
    if (!uang) {
      return res.status(400).json({
        msg: `Quotation dalam ${String(currency).toUpperCase()} wajib menyertakan kurs terhadap Rupiah yang lebih besar dari nol`,
      });
    }

    const updated = await ClientQuotation.findByIdAndUpdate(
      id,
      {
        quotationId,
        projectId,
        projectName,
        clientName,
        items:          items         || [],
        currency:       uang.currency,
        exchangeRate:   uang.exchangeRate,
        clientPrice:    calculatedClientPrice,
        topOption:      finalTop,
        customTop:      finalTop,
        remarks:        remarks       || '',
        bankAccount:    isPPN ? (bankAccount || '') : '',
        approvalStatus: 'Pending',
        quotationMode:  quotationMode || 'auto',
        shippingFee:    Number(shippingFee) || 0,
        taxPercentage:  0,
        taxAmount:      cleanTaxAmount,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: 'Quotation submitted for approval!', data: updated });

    kirimDiamDiam({
      penerima: gabung([await usersByRole('Management')], req.user?.id),
      jenis: 'clientQuotationSubmitted',
      params: { nomor: updated.quotationId, oleh: await namaPelaku(req) },
      targetTipe: 'clientQuotationApproval', targetId: updated._id, actor: req.user?.id,
    });
  } catch (err) {
    console.error('Error submit quotation:', err);
    if (!res.headersSent) res.status(500).json({ msg: 'Gagal mengirim quotation untuk persetujuan' });
  }
};

exports.updateApprovedQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items, topOption, customTop, currency, remarks,
      bankAccount, clientPrice, shippingFee,
      taxAmount,
    } = req.body;

    const existing = await ClientQuotation.findById(id);
    if (!existing) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    let finalClientPrice = Number(clientPrice) || existing.clientPrice;
    if (items && items.length > 0) finalClientPrice = calculateClientPrice(items);

    const cleanTaxAmount = taxAmount !== undefined
      ? Number(taxAmount)
      : (existing.taxAmount || 0);
    const isPPN          = cleanTaxAmount > 0;

    const updateData = {
      items:         items       || existing.items,
      clientPrice:   finalClientPrice,
      currency:      currency    || existing.currency,
      remarks:       remarks     !== undefined ? remarks : existing.remarks,
      bankAccount:   isPPN ? (bankAccount || existing.bankAccount || '') : '',
      shippingFee:   shippingFee !== undefined ? Number(shippingFee) : existing.shippingFee,
      taxPercentage: 0,
      taxAmount:     cleanTaxAmount,
    };

    if (topOption) {
      updateData.topOption = resolveTopOption(topOption, customTop);
      updateData.customTop = updateData.topOption;
    }

    const updated = await ClientQuotation.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, msg: 'Approved quotation has been revised!', data: updated });
  } catch (err) {
    console.error('Error update approved quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getMyQuotations = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find().sort({ createdAt: -1 }).limit(50);
    res.json(quotations);
  } catch (err) {
    console.error('Error get quotations:', err);
    res.status(500).json({ msg: err.message });
  }
};