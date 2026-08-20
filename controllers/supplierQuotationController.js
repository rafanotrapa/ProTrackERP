const SupplierQuotation = require('../models/SupplierQuotation');
const Vendor = require('../models/Vendor');
const { lengkapiNamaProject } = require('../utils/projectNames');
const { nextDocumentNumber } = require('../utils/documentNumber');
const { kirimDiamDiam } = require('../utils/notify');
const { picMarketing, usersByRole, gabung } = require('../utils/notifyTargets');

exports.createQuotation = async (req, res) => {
  try {
    const {
      projectId, vendorId, topOption, customTop, remarks,
      additionalFee, additionalFeeRemarks, isTaxIncluded, taxAmount, currency
    } = req.body;

    // Nomor dibuat server dan berurutan. Sebelumnya browser mengaraknya dan tidak
    // ada pemeriksaan duplikat sama sekali, sehingga tabrakan pada index unik
    // muncul ke user sebagai pesan Mongo mentah lewat res 500 di bawah.
    const quotationId = await nextDocumentNumber(
      'SQ',
      async (nomor) => Boolean(await SupplierQuotation.exists({ quotationId: nomor }))
    );

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
    
    const cleanTaxAmount = taxBool ? (Number(String(taxAmount || '0').replace(/[^0-9]/g, '')) || 0) : 0;

    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : '';

    const newQuotation = new SupplierQuotation({
      quotationId,
      projectId,
      vendorId,
      items: parsedItems, 
      additionalFee: cleanAdditionalFee,
      additionalFeeRemarks,
      isTaxIncluded: taxBool,
      taxAmount: cleanTaxAmount,
      currency: currency || 'IDR',
      topOption,
      customTop: topOption === 'Termin' ? customTop : '',
      remarks,
      documentUrl,
      approvalStatus: 'Pending',
      createdBy: req.user?.id
    });

    await newQuotation.save();
    res.status(201).json({ success: true, msg: 'Supplier Quotation berhasil disimpan!', data: newQuotation });

    kirimDiamDiam({
      penerima: gabung([await usersByRole('Management')], req.user?.id),
      jenis: 'supplierQuotationCreated',
      params: { nomor: newQuotation.quotationId, oleh: req.user?.username },
      targetTipe: 'quotationApproval',
      targetId: newQuotation._id,
      actor: req.user?.id,
    });

  } catch (err) {
    console.error("Error save quotation:", err);
    // err.message dari Mongoose membocorkan nama field dan index ke layar user.
    // Pesannya diseragamkan seperti controller lain.
    res.status(500).json({ msg: 'Gagal menyimpan Supplier Quotation' });
  }
};

exports.getAllQuotations = async (req, res) => {
  try {
    // projectName ditempelkan di sini supaya daftar pilihan di layar bisa
    // menampilkan nama project, bukan kodenya saja.
    const data = await SupplierQuotation.find().sort({ timestamp: -1 }).lean();
    res.json(await lengkapiNamaProject(data));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

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

exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const quotation = await SupplierQuotation.findOne({ 
      projectId: projectId,
      approvalStatus: 'Approved'
    }).sort({ timestamp: -1 });

    if (!quotation) {
      return res.status(404).json({ msg: 'Data Supplier belum di-approve atau tidak ditemukan.' });
    }
    res.json(quotation);
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
    // vendorId disimpan sebagai kode (VND-xxx), bukan referensi. Tanpa namanya,
    // Management menyetujui quotation tanpa tahu itu vendor yang mana.
    const vendor = await Vendor.findOne({ vendorId: quotation.vendorId });
    res.json({ ...quotation.toObject(), vendorName: vendor?.vendorName || '' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

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

    if (status === 'Rejected' && rejectionReason) updateData.rejectionReason = rejectionReason;

    const updatedQuo = await SupplierQuotation.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedQuo) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });

    res.json({ success: true, msg: `Quotation berhasil di-${status}!`, data: updatedQuo });

    // Sesudah respons terkirim. Notifikasi adalah efek samping — kalau gagal,
    // approval yang sudah tersimpan tidak boleh ikut terlihat gagal di layar.
    const params = { nomor: updatedQuo.quotationId, oleh: req.user?.username };
    if (status === 'Approved') {
      // Inti alurnya: Marketing pemegang project yang harus mengerjakan
      // Client Quotation berikutnya.
      const [marketing, procurement] = await Promise.all([
        picMarketing(updatedQuo.projectId),
        usersByRole('Procurement'),
      ]);
      kirimDiamDiam({
        penerima: gabung([marketing], userId),
        jenis: 'supplierQuotationApproved',
        params,
        targetTipe: 'clientQuote',
        actor: userId,
      });
      kirimDiamDiam({
        penerima: gabung([procurement], userId),
        jenis: 'supplierQuotationApproved',
        params,
        targetTipe: 'poRecord',
        actor: userId,
      });
    } else if (status === 'Rejected') {
      // Diarahkan ke pembuatnya kalau tercatat; dokumen lama belum punya
      // createdBy sehingga jatuh ke seluruh Procurement.
      const pembuat = updatedQuo.createdBy ? [updatedQuo.createdBy] : await usersByRole('Procurement');
      kirimDiamDiam({
        penerima: gabung([pembuat], userId),
        jenis: 'supplierQuotationRejected',
        params,
        targetTipe: 'supplierQuotationRecord',
        actor: userId,
      });
    }
  } catch (err) {
    console.error('Error approve quotation:', err.message);
    if (!res.headersSent) res.status(500).json({ msg: 'Gagal memproses persetujuan quotation' });
  }
};

exports.updateQuotationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const updatedQuotation = await SupplierQuotation.findByIdAndUpdate(id, { items: items }, { new: true });
    if (!updatedQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: 'Items updated successfully', data: updatedQuotation });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getDraftByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const draft = await SupplierQuotation.findOne({ projectId: projectId, approvalStatus: 'Draft' }).sort({ createdAt: -1 });
    if (!draft) return res.status(404).json({ msg: 'No draft found for this project' });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, additionalFee, additionalFeeRemarks, isTaxIncluded, taxAmount, topOption, remarks } = req.body;

    const taxBool = isTaxIncluded === 'true' || isTaxIncluded === true;
    const cleanTaxAmount = taxBool ? (Number(String(taxAmount || '0').replace(/[^0-9]/g, '')) || 0) : 0;

    const updatedQuotation = await SupplierQuotation.findByIdAndUpdate(
      id,
      {
        items: items,
        additionalFee: additionalFee,
        additionalFeeRemarks: additionalFeeRemarks,
        isTaxIncluded: taxBool,
        taxAmount: cleanTaxAmount,
        topOption: topOption,
        remarks: remarks,
        approvalStatus: 'Pending'
      },
      { new: true }
    );

    if (!updatedQuotation) return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    res.json({ success: true, msg: 'Quotation submitted for approval!', data: updatedQuotation });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};