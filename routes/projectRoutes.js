const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const SupplierQuotation = require('../models/SupplierQuotation'); 

// 1. GET ALL PROJECTS
// Digunakan untuk: Dropdown di Client Quotation & List di halaman Timeline
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("Error GET Projects:", err.message);
    res.status(500).json({ msg: "Gagal ambil daftar project" });
  }
});

// 2. GET SINGLE PROJECT (AUTO-FILL & TIMELINE DATA)
// Digunakan untuk: Narik detail Client + Merge barang dari Supplier Quotation
router.get('/:projectId', async (req, res) => {
  try {
    const pId = req.params.projectId.trim(); // ID BJK-xxx
    
    // Step A: Cari data dasar Project (Nama Client, TOP, Status Milestone)
    const project = await Project.findOne({ projectId: pId });
    if (!project) {
      return res.status(404).json({ msg: "Project BJK tidak ditemukan di database" });
    }

    // Step B: Cari semua penawaran Supplier untuk BJK ini (Buat merger Item)
    const supplierQuotes = await SupplierQuotation.find({ projectId: pId });
    
    // Gabungin selectedItems dari semua penawaran supplier yang masuk
    const itemList = supplierQuotes.map(sq => sq.selectedItems).filter(Boolean);
    const mergedItems = [...new Set(itemList)].join(', ');

    // Step C: Kirim data gabungan
    res.json({
      ...project._doc,
      itemsFromSQ: mergedItems || "Belum ada item dari penawaran supplier"
    });

  } catch (err) {
    console.error("Error GET Detail Project:", err.message);
    res.status(500).json({ msg: "Gagal tarik detail project BJK" });
  }
});

// 3. POST: SIMPAN PROJECT BARU
router.post('/', async (req, res) => {
  try {
    // Validasi duplikat ID BJK
    const existingProject = await Project.findOne({ projectId: req.body.projectId });
    if (existingProject) {
      return res.status(400).json({ success: false, msg: "ID BJK sudah terdaftar!" });
    }

    const newProject = new Project(req.body);
    const savedProject = await newProject.save();

    res.status(201).json({ 
      success: true, 
      msg: "Project BJK Berhasil Disimpan!",
      data: savedProject 
    });
  } catch (err) {
    console.error("Error POST Project:", err.message);
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 4. PATCH: UPDATE STATUS MILESTONE (FUNGSI TIMELINE)
// Digunakan untuk: Update isDPPaid, isItemsReceived, dsb secara otomatis
router.patch('/update-status/:projectId', async (req, res) => {
  try {
    const pId = req.params.projectId.trim();
    
    // Kita update field apapun yang dikirim di req.body (isDPPaid, dsb)
    const updatedProject = await Project.findOneAndUpdate(
      { projectId: pId },
      { $set: req.body },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ msg: "Gagal update, Project tidak ditemukan" });
    }

    res.json({ 
      success: true, 
      msg: "Status Milestone Updated!", 
      data: updatedProject 
    });
  } catch (err) {
    console.error("Error Update Status:", err.message);
    res.status(500).json({ msg: "Gagal update status proyek" });
  }
});

module.exports = router;