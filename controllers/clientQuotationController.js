const ClientQuotation = require('../models/ClientQuotation');

// 1. CREATE QUOTATION
exports.createQuotation = async (req, res) => {
  try {
    const {
      quotationId,
      projectId,
      projectName,
      clientName,
      items,
      currency,
      clientPrice,
      topOption,
      remarks
    } = req.body;

    const newQuotation = new ClientQuotation({
      quotationId,
      projectId,
      projectName,
      clientName,
      items: items || [],
      currency,
      clientPrice,
      topOption,
      remarks,
      approvalStatus: 'Pending' // DEFAULT PENDING
    });

    const savedQuotation = await newQuotation.save();
    res.status(201).json({ 
      success: true, 
      msg: 'Client Quotation berhasil disimpan!', 
      data: savedQuotation 
    });
  } catch (err) {
    console.error("Error create client quotation:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 2. GET ALL QUOTATIONS (UNTUK MANAGEMENT LIST)
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await ClientQuotation.find()
      .sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    console.error("Error get all quotations:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 3. GET QUOTATION BY ID (UNTUK DETAIL REVIEW)
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await ClientQuotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    }
    res.json(quotation);
  } catch (err) {
    console.error("Error get quotation by id:", err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Format ID salah' });
    }
    res.status(500).json({ msg: err.message });
  }
};

// 4. GET QUOTATION BY PROJECT ID (UNTUK AUTO-FILL DI CREATE INVOICE)
//    HANYA MENAMPILKAN YANG SUDAH APPROVED!
exports.getQuotationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const quotation = await ClientQuotation.findOne({ 
      projectId: projectId,
      approvalStatus: 'Approved' // <-- KUNCI: HANYA YANG SUDAH APPROVED
    }).sort({ createdAt: -1 });

    if (!quotation) {
      return res.status(404).json({ 
        msg: 'Client Quotation belum di-approve oleh Management atau tidak ditemukan.' 
      });
    }

    res.json(quotation);
  } catch (err) {
    console.error("Error get quotation by project:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 5. GET PENDING APPROVALS (UNTUK LIST DI HALAMAN APPROVAL)
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingQuotes = await ClientQuotation.find({ 
      approvalStatus: 'Pending' 
    }).sort({ createdAt: -1 });
    res.json(pendingQuotes);
  } catch (err) {
    console.error("Error get pending approvals:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 6. APPROVE OR REJECT QUOTATION
exports.approveQuotation = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' atau 'Rejected'
    const { id } = req.params;

    const updateData = {
      approvalStatus: status,
      approvalDate: new Date()
    };

    // Jika ditolak, bisa tambah reason (opsional dari body)
    if (status === 'Rejected' && req.body.rejectionReason) {
      updateData.rejectionReason = req.body.rejectionReason;
    }

    const updatedQuotation = await ClientQuotation.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedQuotation) {
      return res.status(404).json({ msg: 'Quotation tidak ditemukan' });
    }

    res.json({ 
      success: true, 
      msg: `Quotation berhasil di-${status}!`, 
      data: updatedQuotation 
    });
  } catch (err) {
    console.error("Error approve quotation:", err);
    res.status(500).json({ msg: err.message });
  }
};