const SupplierQuotation = require('../models/SupplierQuotation');

// Helper function to calculate totals
const calculateTotals = (items, additionalFee, isTaxIncluded, taxPercentage) => {
  const subTotal = items.reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 0)), 0);
  const taxAmount = isTaxIncluded ? (subTotal * (taxPercentage / 100)) : 0;
  const grandTotal = subTotal + (additionalFee || 0) + taxAmount;
  return { subTotal, taxAmount, grandTotal };
};

// Helper function to distribute ongkir & tax to each item (COGS all-in)
const distributeCostToItems = (items, subTotal, additionalFee, taxAmount) => {
  const grandTotal = subTotal + additionalFee + taxAmount;
  
  if (subTotal === 0) return items;
  
  return items.map(item => {
    const itemSubtotal = item.cogs * item.quantity;
    const proportion = itemSubtotal / subTotal;
    const allocatedCost = grandTotal * proportion;
    const newCogsPerUnit = allocatedCost / item.quantity;
    
    return {
      ...item,
      cogs: Math.round(newCogsPerUnit)
    };
  });
};

// 1. Fungsi Create
exports.createQuotation = async (req, res) => {
  try {
    const { 
      quotationId, projectId, vendorId, topOption, remarks, 
      additionalFee, additionalFeeRemarks, isTaxIncluded, taxPercentage 
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
    const cleanTaxPerc = taxBool ? (Number(taxPercentage) || 0) : 0;
    const calculatedTaxAmount = taxBool ? (subTotal * (cleanTaxPerc / 100)) : 0;

    // Distribusi COGS all-in
    const finalItems = distributeCostToItems(
      parsedItems, 
      subTotal, 
      cleanAdditionalFee, 
      calculatedTaxAmount
    );

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items: finalItems,
      additionalFee: cleanAdditionalFee,
      additionalFeeRemarks,
      isTaxIncluded: taxBool,
      taxPercentage: cleanTaxPerc,
      taxAmount: calculatedTaxAmount,
      topOption,
      remarks,
      documentUrl,
      approvalStatus: 'Pending'
    });

    await newQuotation.save();
    res.status(201).json({ success: true, msg: 'Supplier Quotation & Dokumen berhasil disimpan!', data: newQuotation });

  } catch (err) {
    console.error("Error save quotation:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 2. Fungsi Get All
exports.getAllQuotations = async (req, res) => {
  try {
    const data = await SupplierQuotation.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 3. FUNGSI GET PENDING APPROVALS
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

// 4. Fungsi Get by Project ID (HANYA YANG APPROVED)
exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const quotation = await SupplierQuotation.findOne({ 
      projectId: projectId,
      approvalStatus: 'Approved'
    }).sort({ timestamp: -1 });

    if (!quotation) {
      return res.status(404).json({ 
        msg: 'Data Supplier belum di-approve oleh Management atau tidak ditemukan.' 
      });
    }

    res.json(quotation);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 5. Fungsi Get by ID
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await SupplierQuotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    }
    
    res.json(quotation);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Format ID salah' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
};

// 6. Fungsi Approve/Reject Quotation
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

    if (status === 'Rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedQuo = await SupplierQuotation.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedQuo) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    res.json({ 
      success: true, 
      msg: `Quotation berhasil di-${status}!`, 
      data: updatedQuo 
    });
  } catch (err) {
    console.error("Error approve quotation:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 7. UPDATE QUOTATION ITEMS (untuk save draft)
exports.updateQuotationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const updatedQuotation = await SupplierQuotation.findByIdAndUpdate(
      id,
      { items: items },
      { new: true }
    );

    if (!updatedQuotation) {
      return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    }

    res.json({ 
      success: true, 
      msg: 'Items updated successfully', 
      data: updatedQuotation 
    });
  } catch (err) {
    console.error("Error update quotation items:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 8. GET DRAFT BY PROJECT ID
exports.getDraftByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const draft = await SupplierQuotation.findOne({ 
      projectId: projectId,
      approvalStatus: 'Draft'
    }).sort({ createdAt: -1 });

    if (!draft) {
      return res.status(404).json({ msg: 'No draft found for this project' });
    }

    res.json(draft);
  } catch (err) {
    console.error("Error get draft by project:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 9. SUBMIT DRAFT FOR APPROVAL
exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, additionalFee, additionalFeeRemarks, isTaxIncluded, taxPercentage, taxAmount, topOption, remarks } = req.body;

    const updatedQuotation = await SupplierQuotation.findByIdAndUpdate(
      id,
      {
        items: items,
        additionalFee: additionalFee,
        additionalFeeRemarks: additionalFeeRemarks,
        isTaxIncluded: isTaxIncluded,
        taxPercentage: taxPercentage,
        taxAmount: taxAmount,
        topOption: topOption,
        remarks: remarks,
        approvalStatus: 'Pending'
      },
      { new: true }
    );

    if (!updatedQuotation) {
      return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    }

    res.json({ 
      success: true, 
      msg: 'Quotation submitted for approval!', 
      data: updatedQuotation 
    });
  } catch (err) {
    console.error("Error submit quotation:", err);
    res.status(500).json({ msg: err.message });
  }
};