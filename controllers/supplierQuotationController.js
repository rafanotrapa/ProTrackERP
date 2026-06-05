const SupplierQuotation = require('../models/SupplierQuotation');

exports.createQuotation = async (req, res) => {
  try {
    const { 
      quotationId, projectId, vendorId, topOption, customTop, remarks, 
      additionalFee, additionalFeeRemarks, isTaxIncluded, taxAmount, currency 
    } = req.body;
    
    let parsedItems = [];
    let subTotal = 0;

    if (req.body.items) {
      const rawItems = JSON.parse(req.body.items);
      parsedItems = rawItems.map(item => {
        const cogs = Number(String(item.cogs).replace(/[^0-9]/g, '')) || 0;
        const qty = Number(item.quantity) || 1;
        subTotal += (cogs * qty);
        return {
          itemName: String(item.itemName),
          quantity: qty, 
          unit: String(item.unit),
          cogs: cogs
        };
      });
    }

    const cleanAdditionalFee = Number(String(additionalFee || '0').replace(/[^0-9]/g, '')) || 0;
    const taxBool = isTaxIncluded === 'true' || isTaxIncluded === true;
    
    const cleanTaxAmount = taxBool ? (Number(String(taxAmount || '0').replace(/[^0-9]/g, '')) || 0) : 0;

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items: parsedItems, 
      additionalFee: cleanAdditionalFee,
      additionalFeeRemarks,
      isTaxIncluded: taxBool,
      taxAmount: cleanTaxAmount,
      currency: currency || 'IDR',
      topOption,
      customTop: topOption === 'Termin' ? customTop : '',
      remarks,
      documentUrl,
      approvalStatus: 'Pending'
    });

    await newQuotation.save();
    res.status(201).json({ success: true, msg: 'Supplier Quotation berhasil disimpan!', data: newQuotation });

  } catch (err) {
    console.error("Error save quotation:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getAllQuotations = async (req, res) => {
  try {
    const data = await SupplierQuotation.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingQuotes = await SupplierQuotation.find({ 
      approvalStatus: 'Pending' 
    }).sort({ createdAt: -1 });
    res.json(pendingQuotes);
  } catch (err) {
    console.error("Error get pending approvals:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const quotation = await SupplierQuotation.findOne({ 
      projectId: projectId,
      approvalStatus: 'Approved'
    }).sort({ timestamp: -1 });

    if (!quotation) {
      return res.status(404).json({ msg: 'Data Supplier belum di-approve atau tidak ditemukan.' });
    }
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await SupplierQuotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    }
    res.json(quotation);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.approveQuotation = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;
    const userId = req.user?.id;

    const updateData = {
      approvalStatus: status,
      approvalDate: new Date(),
      approvedBy: userId
    };

    if (status === 'Rejected' && rejectionReason) updateData.rejectionReason = rejectionReason;

    const updatedQuo = await SupplierQuotation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedQuo) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    res.json({ success: true, msg: `Quotation berhasil di-${status}!`, data: updatedQuo });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateQuotationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const updatedQuotation = await SupplierQuotation.findByIdAndUpdate(id, { items: items }, { new: true });
    if (!updatedQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: 'Items updated successfully', data: updatedQuotation });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getDraftByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const draft = await SupplierQuotation.findOne({ projectId: projectId, approvalStatus: 'Draft' }).sort({ createdAt: -1 });
    if (!draft) return res.status(404).json({ msg: 'No draft found for this project' });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, additionalFee, additionalFeeRemarks, isTaxIncluded, taxAmount, topOption, remarks } = req.body;

    const taxBool = isTaxIncluded === 'true' || isTaxIncluded === true;
    const cleanTaxAmount = taxBool ? (Number(String(taxAmount || '0').replace(/[^0-9]/g, '')) || 0) : 0;

    const updatedQuotation = await SupplierQuotation.findByIdAndUpdate(
      id,
      {
        items: items,
        additionalFee: additionalFee,
        additionalFeeRemarks: additionalFeeRemarks,
        isTaxIncluded: taxBool,
        taxAmount: cleanTaxAmount,
        topOption: topOption,
        remarks: remarks,
        approvalStatus: 'Pending'
      },
      { new: true }
    );

    if (!updatedQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: 'Quotation submitted for approval!', data: updatedQuotation });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};