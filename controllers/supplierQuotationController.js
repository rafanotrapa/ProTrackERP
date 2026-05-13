const SupplierQuotation = require('../models/SupplierQuotation');

// 1. Fungsi Create
exports.createQuotation = async (req, res) => {
  try {
    const { 
      quotationId, projectId, vendorId, topOption, remarks, 
      additionalFee, additionalFeeRemarks, isTaxIncluded, taxPercentage 
    } = req.body;
    
    let parsedItems = [];
    let subTotal = 0; // Buat ngitung pajak

    if (req.body.items) {
      const rawItems = JSON.parse(req.body.items);
      parsedItems = rawItems.map(item => {
        const cogs = Number(String(item.cogs).replace(/[^0-9]/g, '')) || 0;
        const qty = Number(item.quantity) || 1;
        
        subTotal += (cogs * qty); // Tambahin ke subtotal

        return {
          itemName: String(item.itemName),
          quantity: qty, 
          unit: String(item.unit),
          cogs: cogs 
        };
      });
    }

    const cleanAdditionalFee = Number(String(additionalFee || '0').replace(/[^0-9]/g, '')) || 0;
    
    // Parsing Tax
    const taxBool = isTaxIncluded === 'true' || isTaxIncluded === true;
    const cleanTaxPerc = taxBool ? (Number(taxPercentage) || 0) : 0;
    
    // Kalkulasi Nominal Pajak di Backend
    const calculatedTaxAmount = taxBool ? (subTotal * (cleanTaxPerc / 100)) : 0;

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items: parsedItems, 
      additionalFee: cleanAdditionalFee,
      additionalFeeRemarks,
      isTaxIncluded: taxBool,
      taxPercentage: cleanTaxPerc,
      taxAmount: calculatedTaxAmount, // Simpan nominal hasil hitungan
      topOption,
      remarks,
      documentUrl
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

// 3. Fungsi Get by Project ID
exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // TAMBAHKAN FILTER approvalStatus: 'Approved'
    const quotation = await SupplierQuotation.findOne({ 
      projectId: projectId,
      approvalStatus: 'Approved' // <--- KUNCINYA DI SINI
    }).sort({ timestamp: -1 });

    if (!quotation) {
      // Kasih pesan yang spesifik biar user tau kenapa gak ketarik
      return res.status(404).json({ 
        msg: 'Data Supplier belum di-approve oleh Management atau tidak ditemukan.' 
      });
    }

    res.json(quotation);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Tambahin ini di controllers/supplierQuotationController.js
exports.approveQuotation = async (req, res) => {
  try {
    const { status } = req.body; // Isinya 'Approved' atau 'Rejected'
    const updatedQuo = await SupplierQuotation.findByIdAndUpdate(
      req.params.id,
      { 
        approvalStatus: status,
        approvalDate: new Date() 
      },
      { new: true }
    );

    if (!updatedQuo) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    res.json({ 
      success: true, 
      msg: `Quotation berhasil di-${status}!`, 
      data: updatedQuo 
    });
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
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Format ID salah' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
};