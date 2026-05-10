const SupplierQuotation = require('../models/SupplierQuotation');

// 1. Fungsi Create
exports.createQuotation = async (req, res) => {
  try {
    // Tangkap additionalFee dari body
    const { quotationId, projectId, vendorId, topOption, remarks, additionalFee } = req.body;
    
    let parsedItems = [];
    if (req.body.items) {
      const rawItems = JSON.parse(req.body.items);
      
      parsedItems = rawItems.map(item => ({
        itemName: String(item.itemName),
        quantity: Number(item.quantity) || 1, 
        unit: String(item.unit),
        cogs: Number(String(item.cogs).replace(/[^0-9]/g, '')) || 0 
      }));
    }

    // Sterilisasi additionalFee (hilangkan titik dan pastikan jadi Number)
    const cleanAdditionalFee = Number(String(additionalFee || '0').replace(/[^0-9]/g, '')) || 0;

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items: parsedItems, 
      additionalFee: cleanAdditionalFee, // <-- Masukkan ke DB
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

// 3. FUNGSI BARU: Get by Project ID
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