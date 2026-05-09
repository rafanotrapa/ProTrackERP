const SupplierQuotation = require('../models/SupplierQuotation');

// 1. Fungsi Create (Sudah gue rapihin)
exports.createQuotation = async (req, res) => {
  try {
    const { quotationId, projectId, vendorId, topOption, remarks } = req.body;
    
    let items = [];
    if (req.body.items) {
      items = JSON.parse(req.body.items);
    }

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items,
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

// 3. FUNGSI BARU: Get by Project ID (BIAR AUTO-FILL JALAN)
exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const quotation = await SupplierQuotation.findOne({ projectId: projectId }).sort({ timestamp: -1 });

    if (!quotation) {
      return res.status(404).json({ msg: 'Penawaran supplier tidak ditemukan untuk project ini' });
    }
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};