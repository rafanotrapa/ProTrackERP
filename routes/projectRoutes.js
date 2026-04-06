const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const SupplierQuotation = require('../models/SupplierQuotation'); // Narik data penawaran supplier

// 1. GET ALL: Buat isi Dropdown Project (BJK-xxx)
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Gagal ambil data project" });
  }
});

// 2. GET SINGLE: MERGE DATA (Project + Items dari Supplier Quotation)
router.get('/:projectId', async (req, res) => {
  try {
    const pId = req.params.projectId.trim(); // ID BJK-xxx
    
    // Cari data Project (untuk dapet Client Name)
    const project = await Project.findOne({ projectId: pId });
    if (!project) return res.status(404).json({ msg: "Project BJK tidak ditemukan" });

    // Cari semua barang yang sudah ada penawaran Supplier-nya untuk Project ini
    const supplierQuotes = await SupplierQuotation.find({ projectId: pId });
    
    // Gabungin nama barangnya jadi satu teks
    const itemList = supplierQuotes.map(sq => sq.selectedItems).filter(Boolean);
    const mergedItems = [...new Set(itemList)].join(', ');

    // Kirim data lengkap ke Frontend
    res.json({
      ...project._doc,
      itemsFromSQ: mergedItems || "Belum ada penawaran supplier untuk project ini"
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 3. POST: Simpan Project Baru
router.post('/', async (req, res) => {
  try {
    const newProject = new Project(req.body);
    await newProject.save();
    res.status(201).json({ success: true, msg: "Project BJK Berhasil Disimpan!" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;