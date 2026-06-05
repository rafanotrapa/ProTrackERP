const PurchaseOrder = require('../models/PurchaseOrder');
const SupplierQuotation = require('../models/SupplierQuotation');
const Vendor = require('../models/Vendor'); 

exports.createPO = async (req, res) => {
  try {
    const { poNumber, quotationId, shippingAddress } = req.body; 

    const quote = await SupplierQuotation.findById(quotationId);
    if (!quote) return res.status(404).json({ msg: 'Quotation dasar tidak ditemukan!' });

    let realVendorObjectId = null;
    if (quote.vendorId) {
        const vendorData = await Vendor.findOne({ vendorId: quote.vendorId });
        if (vendorData) {
            realVendorObjectId = vendorData._id; 
        }
    }

    let subTotal = 0;
    if (quote.items && quote.items.length > 0) {
       subTotal = quote.items.reduce((sum, item) => sum + ((item.cogs || 0) * (item.quantity || 1)), 0);
    }
    
    const addFee = quote.additionalFee || 0;
    const taxAmt = quote.taxAmount || 0;
    const grandTotal = subTotal + addFee + taxAmt;

    const newPO = new PurchaseOrder({
      poNumber,
      quotationId,
      projectId: quote.projectId,
      vendorId: realVendorObjectId, 
      items: quote.items, 
      additionalFee: addFee,
      additionalFeeRemarks: quote.additionalFeeRemarks, 
      isTaxIncluded: quote.isTaxIncluded,             
      taxPercentage: quote.taxPercentage,             
      taxAmount: taxAmt,                             
      totalAmount: grandTotal,                          
      shippingAddress
    });

    await newPO.save();
    res.status(201).json({ msg: 'Purchase Order resmi diterbitkan!', data: newPO });
  } catch (err) {
    console.error("Error create PO:", err.message);
    res.status(500).json({ msg: `Gagal membuat PO: ${err.message}` });
  }
};

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

exports.qcCheckPO = async (req, res) => {
  try {
    const { status, qcRemarks } = req.body; 
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan' });

    if (po.qcStatus === 'Passed') {
        return res.status(400).json({ msg: 'Gagal! Barang ini sudah berstatus PASSED.' });
    }

    po.qcStatus = status;
    
    if (qcRemarks) {
        po.qcRemarks = po.qcRemarks ? `${po.qcRemarks} | Update: ${qcRemarks}` : qcRemarks;
    }
    
    await po.save();

    res.json({ msg: `Status QC berhasil diupdate menjadi: ${status}`, data: po });
  } catch (err) {
    res.status(500).json({ msg: 'Server error saat QC Check' });
  }
};

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