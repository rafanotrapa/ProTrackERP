const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const SupplierQuotation = require('../models/SupplierQuotation');

// Konfigurasi Penyimpanan File
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/'); // Pastikan folder ini ada atau buat manual
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Filter: Hanya terima PDF dan Image (No Audio/Video sesuai request)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung! Hanya PDF dan Gambar.'), false);
  }
};

const upload = multer({ storage, fileFilter });

// @route   POST api/supplier-quotation
router.post('/', upload.single('document'), async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      documentUrl: req.file ? `/uploads/documents/${req.file.filename}` : null
    };

    const newQuotation = new SupplierQuotation(quotationData);
    await newQuotation.save();

    res.status(201).json({ success: true, msg: "Quotation & Dokumen Berhasil Disimpan!" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Route GET untuk Dropdown atau List
router.get('/', async (req, res) => {
  try {
    const data = await SupplierQuotation.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;