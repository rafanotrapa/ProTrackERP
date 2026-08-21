const PurchaseOrder = require('../models/PurchaseOrder');
const SupplierQuotation = require('../models/SupplierQuotation');
const Vendor = require('../models/Vendor');
const { computePOPaymentStatuses, UNPAID } = require('../utils/poPaymentStatus');
const { lengkapiNamaProject } = require('../utils/projectNames');
const { kirimDiamDiam } = require('../utils/notify');
const { picMarketing, usersByRole, gabung, namaPelaku } = require('../utils/notifyTargets');

// Field vendor yang dibutuhkan dokumen PO. Sebelumnya di sini tertulis
// 'vendorContact', yang tidak ada di skema Vendor — nama sebenarnya
// contactPerson — sehingga nilainya selalu kosong tanpa disadari.
const VENDOR_FIELDS = 'vendorName contactPerson address phone';

// Nomor PO dibuat di browser dengan Math.random pada rentang 1000-9999, jadi hanya
// ada 9.000 kemungkinan per bulan dan tabrakan bisa terjadi. Karena poNumber unik di
// level database, tabrakan tadinya muncul sebagai error 500 mentah ke user.
const ensureUniquePONumber = async (candidate) => {
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  let poNumber = candidate || `PO-${yearMonth}-${Math.floor(1000 + Math.random() * 9000)}`;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const taken = await PurchaseOrder.exists({ poNumber });
    if (!taken) return poNumber;
    poNumber = `PO-${yearMonth}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  // Jatuh ke timestamp yang pasti unik daripada menggagalkan pembuatan PO.
  return `PO-${yearMonth}-${Date.now().toString().slice(-6)}`;
};

exports.createPO = async (req, res) => {
  try {
    const { poNumber: requestedPONumber, quotationId, shippingAddress } = req.body;
    const poNumber = await ensureUniquePONumber(requestedPONumber);

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
      topOption: quote.topOption,
      customTop: quote.customTop,
      additionalFee: addFee,
      additionalFeeRemarks: quote.additionalFeeRemarks, 
      isTaxIncluded: quote.isTaxIncluded,             
      taxPercentage: quote.taxPercentage,             
      taxAmount: taxAmt,                             
      totalAmount: grandTotal,
      shippingAddress,
      createdBy: req.user?.id
    });

    await newPO.save();

    // Vendor di-populate supaya frontend bisa langsung menyusun dokumen PDF PO
    // tanpa permintaan kedua. Daftar field disamakan dengan getAllPOs agar util
    // PDF menerima bentuk data yang sama dari kedua jalur.
    await newPO.populate('vendorId', VENDOR_FIELDS);

    res.status(201).json({ msg: 'Purchase Order resmi diterbitkan!', data: newPO });

    const [fin, mkt] = await Promise.all([usersByRole('Finance'), picMarketing(newPO.projectId)]);
    const pPO = { nomor: newPO.poNumber, oleh: await namaPelaku(req) };
    kirimDiamDiam({ penerima: gabung([fin], req.user?.id), jenis: 'poCreated', params: pPO,
      targetTipe: 'supplierPayment', actor: req.user?.id });
    kirimDiamDiam({ penerima: gabung([mkt], req.user?.id), jenis: 'poCreated', params: pPO,
      targetTipe: 'poRecord', actor: req.user?.id });
  } catch (err) {
    console.error("Error create PO:", err.message);
    res.status(500).json({ msg: `Gagal membuat PO: ${err.message}` });
  }
};

/**
 * Mengarsipkan berkas PDF dokumen PO yang dihasilkan browser.
 *
 * Diarsipkan sekali saat PO terbit. Bila PO sudah punya berkas, permintaan
 * berikutnya diabaikan supaya dokumen yang sudah dikirim ke supplier tidak
 * tergantikan versi lain.
 */
exports.attachPODocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Berkas dokumen tidak diterima.' });

    const po = await PurchaseOrder.findOne({ poNumber: req.params.poNumber.trim() });
    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan.' });

    if (po.documentFile) {
      return res.json({ msg: 'Dokumen sudah diarsipkan sebelumnya.', documentFile: po.documentFile });
    }

    po.documentFile = req.file.filename;
    await po.save();

    res.json({ msg: 'Dokumen PO diarsipkan.', documentFile: po.documentFile });
  } catch (err) {
    console.error('Error arsip dokumen PO:', err.message);
    res.status(500).json({ msg: 'Gagal mengarsipkan dokumen PO.' });
  }
};

exports.getAllPOs = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
        .populate('quotationId')
        .populate('vendorId', VENDOR_FIELDS)
        .sort({ timestamp: -1 });

    // paymentStatus diturunkan dari tagihan supplier yang sudah dibayar supaya
    // tidak basi. Nilai yang disimpan di dokumen PO tidak pernah diperbarui.
    const statusMap = await computePOPaymentStatuses(pos);
    const hasil = pos.map(po => {
      const obj = po.toObject();
      /* PO yang terbit sebelum topOption/customTop ada di skema tidak menyimpan
       * syarat pembayaran sama sekali, sehingga setiap tagihan supplier darinya
       * jatuh ke 'Full Payment'. Quotation-nya sudah di-populate di atas, jadi
       * nilainya bisa diambil dari sana tanpa query tambahan dan tanpa migrasi.
       * Hanya sebagai cadangan: PO baru menyimpan salinannya sendiri, dan
       * salinan itu yang menang kalau ada. */
      if (!obj.topOption && obj.quotationId) {
        obj.topOption = obj.quotationId.topOption || '';
        obj.customTop = obj.quotationId.customTop || '';
      }
      return { ...obj, paymentStatus: statusMap.get(po.poNumber) || UNPAID };
    });

    // Nama project ikut dikirim supaya daftar PO bisa dibaca dan dicari tanpa
    // harus hafal kode projectnya.
    res.json(await lengkapiNamaProject(hasil));
  } catch (err) {
    console.error('Error get all PO:', err.message);
    res.status(500).json({ msg: 'Gagal mengambil data PO' });
  }
};

// Peninggalan alur lama saat Finance menyetujui PO secara langsung. Tidak ada
// pemanggilan dari frontend; pembayaran vendor kini lewat Supplier Payment dan
// statusnya diturunkan dari tagihan yang lunas.
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

    const pQC = { nomor: po.poNumber, oleh: await namaPelaku(req) };
    if (status === 'Passed') {
      kirimDiamDiam({ penerima: gabung([await usersByRole('Procurement')], req.user?.id),
        jenis: 'poQcPassed', params: pQC, targetTipe: 'deliveryManagement', actor: req.user?.id });
    } else if (status === 'Returned') {
      const [mg, mk] = await Promise.all([usersByRole('Management'), picMarketing(po.projectId)]);
      kirimDiamDiam({ penerima: gabung([mg, mk], req.user?.id),
        jenis: 'poQcReturned', params: pQC, targetTipe: 'poRecord', actor: req.user?.id });
    }
  } catch (err) {
    res.status(500).json({ msg: 'Server error saat QC Check' });
  }
};

exports.updateDelivery = async (req, res) => {
  try {
    const { status, deliveryDate, courierName, trackingNumber, deliveryQty } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) return res.status(404).json({ msg: 'PO tidak ditemukan' });

    po.deliveryStatus = status;
    if (deliveryDate) po.deliveryDate = deliveryDate;
    if (courierName) po.courierName = courierName;
    if (trackingNumber) po.trackingNumber = trackingNumber;
    if (deliveryQty) po.deliveryQty = Number(deliveryQty);
    if (req.file) po.deliveryPhoto = req.file.filename;

    await po.save();
    res.json({ msg: `Status Pengiriman diupdate menjadi: ${status}`, data: po });

    if (status === 'Delivered') {
      const [mk, fn] = await Promise.all([picMarketing(po.projectId), usersByRole('Finance')]);
      kirimDiamDiam({ penerima: gabung([mk, fn], req.user?.id), jenis: 'poDelivered',
        params: { nomor: po.poNumber, oleh: await namaPelaku(req) },
        targetTipe: 'projectBilling', targetId: po.projectId, actor: req.user?.id });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error saat update delivery' });
  }
};