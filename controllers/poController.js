const PurchaseOrder = require('../models/PurchaseOrder');
const SupplierQuotation = require('../models/SupplierQuotation');

// 1. CREATE PO (Procurement)
exports.createPO = async (req, res) => {
  try {
    const { poNumber, quotationId, shippingAddress } = req.body; // <-- DIHAPUS DARI SINI

    const quote = await SupplierQuotation.findById(quotationId);
    if (!quote) return res.status(404).json({ msg: 'Quotation dasar tidak ditemukan!' });

    let totalAmount = 0;
    if (quote.items && quote.items.length > 0) {
       totalAmount = quote.items.reduce((sum, item) => sum + (item.cogs * item.quantity), 0);
    }

    const newPO = new PurchaseOrder({
      poNumber,
      quotationId,
      projectId: quote.projectId,
      vendorId: quote.vendorId, 
      items: quote.items,       
      totalAmount,
      shippingAddress
      // <-- DIHAPUS DARI SINI
    });

    await newPO.save();
    res.status(201).json({ msg: 'Purchase Order resmi diterbitkan!', data: newPO });
  } catch (err) {
    console.error("Error create PO:", err);
    res.status(500).json({ msg: 'Gagal membuat Purchase Order' });
  }
};

// 2. GET ALL POs
exports.getAllPOs = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
        .populate('quotationId')
        .populate('vendorId', 'vendorName vendorContact') 
        .sort({ timestamp: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ msg: 'Gagal mengambil data PO' });
  }
};

// 3. FINANCE APPROVAL (Nanti dipanggil dari modul Finance)
exports.financeApprovePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan' });

    po.paymentStatus = 'Approved';
    await po.save();

    res.json({ msg: 'Pembayaran DP disetujui, Supplier siap mengirim barang!', data: po });
  } catch (err) {
    res.status(500).json({ msg: 'Server error saat approve finance' });
  }
};

// 4. QC CHECK / RETURN GOODS (Procurement)
exports.qcCheckPO = async (req, res) => {
  try {
    const { status, qcRemarks } = req.body; // status = 'Passed' atau 'Returned'
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan' });

    if (po.paymentStatus !== 'Approved') {
        return res.status(400).json({ msg: 'Gagal QC! Barang ilegal dikirim sebelum Finance bayar DP.' });
    }

    po.qcStatus = status;
    if (qcRemarks) po.qcRemarks = qcRemarks;
    
    await po.save();

    res.json({ msg: `Status QC berhasil diupdate menjadi: ${status}`, data: po });
  } catch (err) {
    res.status(500).json({ msg: 'Server error saat QC Check' });
  }
};