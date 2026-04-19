const SupplierQuotation = require('../models/SupplierQuotation');

exports.createQuotation = async (req, res) => {
  try {
    const { quotationId, projectId, vendorId, topOption, remarks } = req.body;
    
    // Karena dari frontend dikirim pakai FormData (JSON.stringify), kita harus parse balik ke Array
    let items = [];
    if (req.body.items) {
      items = JSON.parse(req.body.items);
    }

    // Ambil path file kalau ada yang di-upload (asumsi lu pake middleware Multer)
    const documentUrl = req.file ? req.file.path : '';

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
    res.status(201).json({ msg: 'Supplier Quotation berhasil disimpan!', data: newQuotation });

  } catch (err) {
    console.error("Error save quotation:", err);
    res.status(500).json({ msg: 'Gagal menyimpan Quotation ke server' });
  }
};