const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);

router.post('/', authorizeRoles('Procurement','Admin'), async (req, res) => {
  try {
    const newVendor = new Vendor({
      ...req.body,
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
    res.status(500).json({ success: false, msg: err.message });
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