const PurchaseOrder = require('../models/PurchaseOrder');
const SupplierQuotation = require('../models/SupplierQuotation');
const Vendor = require('../models/Vendor'); 

// 1. CREATE PO (Procurement)
exports.createPO = async (req, res) => {
  try {
    const { poNumber, quotationId, shippingAddress } = req.body; 

    const quote = await SupplierQuotation.findById(quotationId);
    if (!quote) return res.status(404).json({ msg: 'Quotation dasar tidak ditemukan!' });

    // CARI OBJECT ID ASLI DARI VENDOR
    let realVendorObjectId = null;
    if (quote.vendorId) {
        const vendorData = await Vendor.findOne({ vendorId: quote.vendorId });
        if (vendorData) {
            realVendorObjectId = vendorData._id; 
        }
    }

    let totalAmount = 0;
    if (quote.items && quote.items.length > 0) {
       totalAmount = quote.items.reduce((sum, item) => sum + (item.cogs * item.quantity), 0);
    }

    const newPO = new PurchaseOrder({
      poNumber,
      quotationId,
      projectId: quote.projectId,
      vendorId: realVendorObjectId, 
      items: quote.items,       
      totalAmount,
      shippingAddress
    });

    await newPO.save();
    res.status(201).json({ msg: 'Purchase Order resmi diterbitkan!', data: newPO });
  } catch (err) {
    console.error("Error create PO:", err.message);
    res.status(500).json({ msg: `Gagal membuat PO: ${err.message}` });
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

// 3. FINANCE APPROVAL
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

// 4. QC CHECK / RETURN GOODS (Procurement/Gudang)
exports.qcCheckPO = async (req, res) => {
  try {
    const { status, qcRemarks } = req.body; // status = 'Passed' atau 'Returned'
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan' });

    // HAPUS BLOK PENGECEKAN PAYMENT STATUS (Biar gak nunggu DP Finance lagi)
    // if (po.paymentStatus !== 'Approved') { ... } <-- INI UDAH GUE BUANG

    // Gembok Baru: Kalau udah 'Passed', gak boleh diubah lagi.
    if (po.qcStatus === 'Passed') {
        return res.status(400).json({ msg: 'Gagal! Barang ini sudah berstatus PASSED.' });
    }

    po.qcStatus = status;
    
    // Kalau diretur lagi, catatannya ditambah, gak dioverwrite.
    if (qcRemarks) {
        po.qcRemarks = po.qcRemarks ? `${po.qcRemarks} | Update: ${qcRemarks}` : qcRemarks;
    }
    
    await po.save();

    res.json({ msg: `Status QC berhasil diupdate menjadi: ${status}`, data: po });
  } catch (err) {
    res.status(500).json({ msg: 'Server error saat QC Check' });
  }
};

// 5. UPDATE DELIVERY STATUS (Logistics)
exports.updateDelivery = async (req, res) => {
  try {
    const { status, deliveryDate, courierName, trackingNumber } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    
    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan' });

    po.deliveryStatus = status;
    if (deliveryDate) po.deliveryDate = deliveryDate;
    if (courierName) po.courierName = courierName;
    if (trackingNumber) po.trackingNumber = trackingNumber;

    await po.save();
    res.json({ msg: `Status Pengiriman diupdate menjadi: ${status}`, data: po });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error saat update delivery' });
  }
};