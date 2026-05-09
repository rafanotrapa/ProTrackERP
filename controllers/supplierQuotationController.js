const SupplierQuotation = require('../models/SupplierQuotation');

// 1. Fungsi Create (Sudah diperbaiki dengan Parsing & Casting Ketat)
exports.createQuotation = async (req, res) => {
  try {
    const { quotationId, projectId, vendorId, topOption, remarks } = req.body;
    
    let parsedItems = [];
    if (req.body.items) {
      // 1. Parse JSON string dari FormData React
      const rawItems = JSON.parse(req.body.items);
      
      // 2. Mapping wajib: Pastikan tipe data dikonversi sesuai Mongoose Schema
      parsedItems = rawItems.map(item => ({
        itemName: String(item.itemName),
        // Paksa jadi Number, kalau kosong default ke 1
        quantity: Number(item.quantity) || 1, 
        unit: String(item.unit),
        // Bersihkan karakter aneh/titik rupiah (jika ada), lalu paksa jadi Number
        cogs: Number(String(item.cogs).replace(/[^0-9]/g, '')) || 0 
      }));
    }

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items: parsedItems, // <-- Masukkan array yang sudah steril
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