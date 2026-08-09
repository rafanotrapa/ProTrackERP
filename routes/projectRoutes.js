const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const SupplierQuotation = require('../models/SupplierQuotation');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);

router.get('/', authorizeRoles('Marketing','Procurement','Finance','Management','Owner','Admin'), async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("Error GET Projects:", err.message);
    res.status(500).json({ msg: "Gagal ambil daftar project" });
  }
});

router.get('/:projectId', authorizeRoles('Marketing','Procurement','Finance','Management','Owner','Admin'), async (req, res) => {
  try {
    const pId = req.params.projectId.trim();

    const project = await Project.findOne({ projectId: pId });
    if (!project) {
      return res.status(404).json({ msg: "Project BJK tidak ditemukan di database" });
    }

    const supplierQuotes = await SupplierQuotation.find({ projectId: pId });

    const itemList = supplierQuotes.flatMap(sq => (sq.items || []).map(it => it.itemName)).filter(Boolean);
    const mergedItems = [...new Set(itemList)].join(', ');

    res.json({
      ...project._doc,
      itemsFromSQ: mergedItems || "Belum ada item dari penawaran supplier"
    });

  } catch (err) {
    console.error("Error GET Detail Project:", err.message);
    res.status(500).json({ msg: "Gagal tarik detail project BJK" });
  }
});

router.post('/', authorizeRoles('Marketing','Admin'), async (req, res) => {
  try {

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

router.patch('/update-status/:projectId', authorizeRoles('Marketing','Finance','Admin'), async (req, res) => {
  try {
    const pId = req.params.projectId.trim();

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