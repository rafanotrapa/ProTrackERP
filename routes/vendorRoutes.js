const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect, authorizeRoles } = require('../middleware/auth');
const { nextDocumentNumber } = require('../utils/documentNumber');

router.use(protect);

router.post('/', authorizeRoles('Procurement','Admin'), async (req, res) => {
  try {
    // vendorId dibuat server dan berurutan; kiriman klien diabaikan. Field juga
    // disebut satu per satu, bukan menyalin req.body mentah — dengan spread,
    // klien bisa menitipkan approvalStatus atau createdAt sekehendaknya.
    const vendorId = await nextDocumentNumber(
      'VND',
      async (nomor) => Boolean(await Vendor.exists({ vendorId: nomor }))
    );

    const newVendor = new Vendor({
      vendorId,
      projectId: req.body.projectId,
      vendorName: req.body.vendorName,
      companyType: req.body.companyType,
      // Negara dan mata uang bawaan vendor. Keduanya opsional: vendor dalam
      // negeri cukup dibiarkan kosong dan otomatis dianggap IDR.
      country: req.body.country || '',
      defaultCurrency: String(req.body.defaultCurrency || 'IDR').toUpperCase(),
      contactPerson: req.body.contactPerson,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      bankAccount: req.body.bankAccount,
      category: req.body.category,
      approvalStatus: 'Approved',
      approvalDate: new Date()
    });
    const savedVendor = await newVendor.save();
    res.status(201).json({
      success: true,
      msg: "Vendor Berhasil Terdaftar di Database!",
      data: savedVendor
    });
  } catch (err) {
    console.error('Error save vendor:', err);
    res.status(500).json({ success: false, msg: 'Gagal menyimpan vendor' });
  }
});

router.get('/', authorizeRoles('Procurement','Marketing','Management','Owner','Finance','Admin'), async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.status(200).json(vendors);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.patch('/:id/approve', authorizeRoles('Management','Admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: status,
        approvalDate: new Date()
      },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ msg: 'Vendor tidak ditemukan' });

    res.json({
      success: true,
      msg: `Status Vendor berhasil diupdate menjadi ${status}!`,
      data: vendor
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;