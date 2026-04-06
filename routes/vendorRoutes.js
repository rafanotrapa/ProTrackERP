const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');

// @route   POST api/vendor
router.post('/', async (req, res) => {
  try {
    const newVendor = new Vendor(req.body);
    const savedVendor = await newVendor.save();
    res.status(201).json({ 
      success: true, 
      msg: "Vendor Berhasil Terdaftar!",
      data: savedVendor 
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// @route   GET api/vendor (Buat dropdown di form lain nanti)
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.status(200).json(vendors);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;