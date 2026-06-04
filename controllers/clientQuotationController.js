const ClientQuotation  = require('../models/ClientQuotation');
const SupplierQuotation = require('../models/SupplierQuotation');

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const calculateClientPrice = (items = []) =>
  items.reduce((total, item) => total + (item.quantity || 0) * (item.salesPrice || 0), 0);

const injectSupplierModal = async (quo) => {
  const quoObj = typeof quo.toObject === 'function' ? quo.toObject() : quo;
  let sqSubtotal = 0, sqFee = 0, sqTax = 0, sqModalMurni = 0;

  if (quoObj.quotationMode === 'auto') {
    const sq = await SupplierQuotation.findOne({
      projectId: quoObj.projectId, approvalStatus: 'Approved',
    });
    if (sq) {
      sqSubtotal   = sq.items.reduce((s, i) => s + (i.cogs || 0) * (i.quantity || 1), 0);
      sqFee        = sq.additionalFee || 0;
      sqTax        = sq.taxAmount     || 0;
      sqModalMurni = sqSubtotal + sqFee;
    }
  } else {
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
//  FIX: terima taxAmount sebagai nominal langsung dari frontend
//       tidak lagi hitung dari taxPercentage
// ─────────────────────────────────────────────────────────────
exports.createQuotation = async (req, res) => {
  try {
    const {
      quotationId, projectId, projectName, clientName,
      items, currency, topOption, customTop, remarks,
      bankAccount, quotationMode, shippingFee,
      taxAmount,   // ← nominal langsung, bukan percentage
    } = req.body;

    const calculatedClientPrice = calculateClientPrice(items);
    const cleanTaxAmount        = Number(taxAmount) || 0;
    const isPPN                 = cleanTaxAmount > 0;
    const finalTop              = topOption === 'Termin' ? customTop : topOption;

    const newQuotation = new ClientQuotation({
      quotationId,
      projectId,
      projectName,
      clientName,
      items:          items         || [],
      currency:       currency      || 'IDR',
      clientPrice:    calculatedClientPrice,
      topOption:      finalTop,
      remarks:        remarks       || '',
      bankAccount:    isPPN ? (bankAccount || '') : '',
      approvalStatus: req.body.approvalStatus || 'Draft',
      quotationMode:  quotationMode || 'auto',
      shippingFee:    Number(shippingFee) || 0,
      taxPercentage:  0,           // selalu 0, tidak dipakai
      taxAmount:      cleanTaxAmount,
    });

    const saved = await newQuotation.save();
    res.status(201).json({ success: true, msg: 'Quotation draft saved!', data: saved });
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
    const quotations = await ClientQuotation.find().sort({ createdAt: -1 });
    const enriched   = await Promise.all(quotations.map((q) => injectSupplierModal(q)));
    res.json(enriched);
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
    const enriched = await injectSupplierModal(quotation);
    res.json(enriched);
  } catch (err) {
    console.error('Error get quotation by id:', err);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Format ID salah' });
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  4. GET BY PROJECT ID — hanya Approved
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  5. GET PENDING APPROVALS
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  6. APPROVE / REJECT
// ─────────────────────────────────────────────────────────────
exports.approveQuotation = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id }                      = req.params;
    const updateData = { approvalStatus: status, approvalDate: new Date() };
    if (status === 'Rejected' && rejectionReason) updateData.rejectionReason = rejectionReason;
    const updated = await ClientQuotation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: `Quotation berhasil di-${status}!`, data: updated });
  } catch (err) {
    console.error('Error approve quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  7. UPDATE ITEMS (save draft / revisi)
//  FIX: terima taxAmount sebagai nominal langsung
// ─────────────────────────────────────────────────────────────
exports.updateQuotationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items, topOption, customTop, currency, remarks,
      bankAccount, clientName, projectName, quotationMode,
      shippingFee,
      taxAmount,   // ← nominal langsung
    } = req.body;

    const existing = await ClientQuotation.findById(id);
    if (!existing) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    const calculatedClientPrice = calculateClientPrice(items || []);
    const finalTop              = topOption === 'Termin' ? customTop : topOption;
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

// ─────────────────────────────────────────────────────────────
//  8. GET DRAFT BY PROJECT ID
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  9. SUBMIT DRAFT FOR APPROVAL
//  FIX: terima taxAmount sebagai nominal langsung
// ─────────────────────────────────────────────────────────────
exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotationId, projectId, projectName, clientName,
      items, currency, topOption, customTop, remarks,
      bankAccount, quotationMode, shippingFee,
      taxAmount,   // ← nominal langsung
    } = req.body;

    const calculatedClientPrice = calculateClientPrice(items || []);
    const finalTop              = topOption === 'Termin' ? customTop : topOption;
    const cleanTaxAmount        = Number(taxAmount) || 0;
    const isPPN                 = cleanTaxAmount > 0;

    const updated = await ClientQuotation.findByIdAndUpdate(
      id,
      {
        quotationId,
        projectId,
        projectName,
        clientName,
        items:          items         || [],
        currency:       currency      || 'IDR',
        clientPrice:    calculatedClientPrice,
        topOption:      finalTop,
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
  } catch (err) {
    console.error('Error submit quotation:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  10. UPDATE APPROVED QUOTATION
//  FIX: terima taxAmount sebagai nominal langsung
// ─────────────────────────────────────────────────────────────
exports.updateApprovedQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items, topOption, customTop, currency, remarks,
      bankAccount, clientPrice, shippingFee,
      taxAmount,   // ← nominal langsung
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

    if (topOption) updateData.topOption = topOption === 'Termin' ? customTop : topOption;

    const updated = await ClientQuotation.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, msg: 'Approved quotation has been revised!', data: updated });
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