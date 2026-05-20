const ClientQuotation  = require('../models/ClientQuotation');
const SupplierQuotation = require('../models/SupplierQuotation');

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/** Hitung total harga jual (clientPrice) dari array items */
const calculateTotalClientPrice = (items = []) =>
  items.reduce((total, item) => total + (item.quantity || 0) * (item.salesPrice || 0), 0);

/**
 * Suntikkan data modal dari Supplier Quotation ke objek quotation.
 * Modal murni = subtotal barang + ongkir supplier (pajak supplier = pass-through).
 */
const injectSupplierModal = async (quo) => {
  const quoObj = typeof quo.toObject === 'function' ? quo.toObject() : quo;

  let sqSubtotal   = 0;
  let sqFee        = 0;
  let sqTax        = 0;
  let sqModalMurni = 0;

  if (quoObj.quotationMode === 'auto') {
    const sq = await SupplierQuotation.findOne({
      projectId:      quoObj.projectId,
      approvalStatus: 'Approved',
    });
    if (sq) {
      sqSubtotal   = sq.items.reduce((s, i) => s + (i.cogs || 0) * (i.quantity || 1), 0);
      sqFee        = sq.additionalFee || 0;
      sqTax        = sq.taxAmount     || 0;
      sqModalMurni = sqSubtotal + sqFee;
    }
  } else {
    // Manual mode: modal dari COGS input marketing
    sqSubtotal   = (quoObj.items || []).reduce((s, i) => s + (i.cogs || 0) * (i.quantity || 1), 0);
    sqModalMurni = sqSubtotal;
  }

  quoObj.supplierSubtotal = sqSubtotal;
  quoObj.supplierFee      = sqFee;
  quoObj.supplierTax      = sqTax;
  quoObj.totalModal       = sqModalMurni;

  return quoObj;
};

// ─────────────────────────────────────────────────────────────
//  1. CREATE — draft pertama kali
// ─────────────────────────────────────────────────────────────
exports.createQuotation = async (req, res) => {
  try {
    const {
      quotationId,
      projectId,
      projectName,
      clientName,
      items,
      currency,
      topOption,
      customTop,
      remarks,
      bankAccount,      // ← rekening bank (kosong jika non-PPN)
      quotationMode,
      shippingFee,
      taxPercentage,
    } = req.body;

    const calculatedClientPrice = calculateTotalClientPrice(items);
    const cleanTaxPerc          = Number(taxPercentage) || 0;
    const calculatedTaxAmount   = calculatedClientPrice * (cleanTaxPerc / 100);
    const finalTop              = topOption === 'Termin' ? customTop : topOption;

    const newQuotation = new ClientQuotation({
      quotationId,
      projectId,
      projectName,
      clientName,
      items:          items || [],
      currency:       currency       || 'IDR',
      clientPrice:    calculatedClientPrice,
      topOption:      finalTop,
      remarks:        remarks        || '',
      // Simpan rekening hanya jika kena pajak
      bankAccount:    cleanTaxPerc > 0 ? (bankAccount || '') : '',
      approvalStatus: req.body.approvalStatus || 'Draft',
      quotationMode:  quotationMode  || 'auto',
      shippingFee:    Number(shippingFee)    || 0,
      taxPercentage:  cleanTaxPerc,
      taxAmount:      calculatedTaxAmount,
    });

    const savedQuotation = await newQuotation.save();
    res.status(201).json({ success: true, msg: 'Quotation draft saved!', data: savedQuotation });
  } catch (err) {
    console.error('Error create client quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  2. GET ALL
// ─────────────────────────────────────────────────────────────
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations     = await ClientQuotation.find().sort({ createdAt: -1 });
    const enrichedQuotes = await Promise.all(quotations.map((q) => injectSupplierModal(q)));
    res.json(enrichedQuotes);
  } catch (err) {
    console.error('Error get all quotations:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  3. GET BY ID
// ─────────────────────────────────────────────────────────────
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await ClientQuotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    const enrichedQuote = await injectSupplierModal(quotation);
    res.json(enrichedQuote);
  } catch (err) {
    console.error('Error get quotation by id:', err);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Format ID salah' });
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  4. GET BY PROJECT ID — hanya yang Approved (untuk invoice)
// ─────────────────────────────────────────────────────────────
exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const quotation = await ClientQuotation.findOne({
      projectId,
      approvalStatus: 'Approved',
    }).sort({ createdAt: -1 });

    if (!quotation)
      return res.status(404).json({ msg: 'Client Quotation belum di-approve atau tidak ditemukan.' });

    const enrichedQuote = await injectSupplierModal(quotation);
    res.json(enrichedQuote);
  } catch (err) {
    console.error('Error get quotation by project:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  5. GET PENDING APPROVALS
// ─────────────────────────────────────────────────────────────
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingQuotes  = await ClientQuotation.find({ approvalStatus: 'Pending' }).sort({ createdAt: -1 });
    const enrichedQuotes = await Promise.all(pendingQuotes.map((q) => injectSupplierModal(q)));
    res.json(enrichedQuotes);
  } catch (err) {
    console.error('Error get pending approvals:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  6. APPROVE / REJECT
// ─────────────────────────────────────────────────────────────
exports.approveQuotation = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id }                      = req.params;

    const updateData = { approvalStatus: status, approvalDate: new Date() };
    if (status === 'Rejected' && rejectionReason) updateData.rejectionReason = rejectionReason;

    const updatedQuotation = await ClientQuotation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    res.json({ success: true, msg: `Quotation berhasil di-${status}!`, data: updatedQuotation });
  } catch (err) {
    console.error('Error approve quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  7. UPDATE ITEMS (save draft / revisi)
// ─────────────────────────────────────────────────────────────
exports.updateQuotationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items,
      topOption,
      customTop,
      currency,
      remarks,
      bankAccount,
      clientName,
      projectName,
      quotationMode,
      shippingFee,
      taxPercentage,
    } = req.body;

    const existingQuotation = await ClientQuotation.findById(id);
    if (!existingQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    const calculatedClientPrice = calculateTotalClientPrice(items || []);
    const finalTop              = topOption === 'Termin' ? customTop : topOption;
    const finalTaxPerc          = taxPercentage !== undefined ? Number(taxPercentage) : existingQuotation.taxPercentage;
    const calculatedTaxAmount   = calculatedClientPrice * (finalTaxPerc / 100);

    const updatedQuotation = await ClientQuotation.findByIdAndUpdate(
      id,
      {
        items:         items,
        clientPrice:   calculatedClientPrice,
        topOption:     finalTop,
        currency:      currency      || existingQuotation.currency,
        remarks:       remarks       !== undefined ? remarks : existingQuotation.remarks,
        // Simpan rekening hanya jika kena pajak; kosongkan jika non-PPN
        bankAccount:   finalTaxPerc > 0 ? (bankAccount || existingQuotation.bankAccount || '') : '',
        clientName:    clientName    || existingQuotation.clientName,
        projectName:   projectName   || existingQuotation.projectName,
        quotationMode: quotationMode || existingQuotation.quotationMode,
        shippingFee:   shippingFee   !== undefined ? Number(shippingFee) : existingQuotation.shippingFee,
        taxPercentage: finalTaxPerc,
        taxAmount:     calculatedTaxAmount,
      },
      { new: true }
    );

    res.json({ success: true, msg: 'Quotation updated successfully', data: updatedQuotation });
  } catch (err) {
    console.error('Error update quotation items:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  8. GET DRAFT BY PROJECT ID
// ─────────────────────────────────────────────────────────────
exports.getDraftByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const draft = await ClientQuotation.findOne({
      projectId,
      approvalStatus: 'Draft',
    }).sort({ createdAt: -1 });

    if (!draft) return res.status(404).json({ msg: 'No draft found for this project' });

    const enrichedDraft = await injectSupplierModal(draft);
    res.json(enrichedDraft);
  } catch (err) {
    console.error('Error get draft by project:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  9. SUBMIT DRAFT FOR APPROVAL
// ─────────────────────────────────────────────────────────────
exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotationId,
      projectId,
      projectName,
      clientName,
      items,
      currency,
      topOption,
      customTop,
      remarks,
      bankAccount,
      quotationMode,
      shippingFee,
      taxPercentage,
    } = req.body;

    const calculatedClientPrice = calculateTotalClientPrice(items || []);
    const finalTop              = topOption === 'Termin' ? customTop : topOption;
    const cleanTaxPerc          = Number(taxPercentage) || 0;
    const calculatedTaxAmount   = calculatedClientPrice * (cleanTaxPerc / 100);

    const updatedQuotation = await ClientQuotation.findByIdAndUpdate(
      id,
      {
        quotationId,
        projectId,
        projectName,
        clientName,
        items:          items || [],
        currency:       currency      || 'IDR',
        clientPrice:    calculatedClientPrice,
        topOption:      finalTop,
        remarks:        remarks       || '',
        bankAccount:    cleanTaxPerc > 0 ? (bankAccount || '') : '',
        approvalStatus: 'Pending',
        quotationMode:  quotationMode || 'auto',
        shippingFee:    Number(shippingFee) || 0,
        taxPercentage:  cleanTaxPerc,
        taxAmount:      calculatedTaxAmount,
      },
      { new: true }
    );

    if (!updatedQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    res.json({ success: true, msg: 'Quotation submitted for approval!', data: updatedQuotation });
  } catch (err) {
    console.error('Error submit quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  10. UPDATE APPROVED QUOTATION (revisi harga pasca approval)
// ─────────────────────────────────────────────────────────────
exports.updateApprovedQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items,
      topOption,
      customTop,
      currency,
      remarks,
      bankAccount,
      clientPrice,
      shippingFee,
      taxPercentage,
    } = req.body;

    const existingQuotation = await ClientQuotation.findById(id);
    if (!existingQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    let finalClientPrice = clientPrice;
    if (items && items.length > 0) finalClientPrice = calculateTotalClientPrice(items);

    const finalTaxPerc        = taxPercentage !== undefined ? Number(taxPercentage) : existingQuotation.taxPercentage;
    const calculatedTaxAmount = finalClientPrice * (finalTaxPerc / 100);

    const updateData = {
      items:         items        || existingQuotation.items,
      clientPrice:   finalClientPrice,
      currency:      currency     || existingQuotation.currency,
      remarks:       remarks      !== undefined ? remarks : existingQuotation.remarks,
      bankAccount:   finalTaxPerc > 0 ? (bankAccount || existingQuotation.bankAccount || '') : '',
      shippingFee:   shippingFee  !== undefined ? Number(shippingFee) : existingQuotation.shippingFee,
      taxPercentage: finalTaxPerc,
      taxAmount:     calculatedTaxAmount,
    };

    if (topOption) updateData.topOption = topOption === 'Termin' ? customTop : topOption;

    const updatedQuotation = await ClientQuotation.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, msg: 'Approved quotation has been revised!', data: updatedQuotation });
  } catch (err) {
    console.error('Error update approved quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  11. GET MY QUOTATIONS (list ringan, limit 50)
// ─────────────────────────────────────────────────────────────
exports.getMyQuotations = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find().sort({ createdAt: -1 }).limit(50);
    res.json(quotations);
  } catch (err) {
    console.error('Error get quotations:', err);
    res.status(500).json({ msg: err.message });
  }
};