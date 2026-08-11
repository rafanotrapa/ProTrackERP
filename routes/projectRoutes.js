const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const SupplierQuotation = require('../models/SupplierQuotation');
const { protect, authorizeRoles } = require('../middleware/auth');
const { addProject, getPicOptions, updateProjectPIC } = require('../controllers/projectController');

router.use(protect);

// Kandidat PIC harus didaftarkan sebelum '/:projectId', kalau tidak string
// 'pic-options' akan ditangkap sebagai nomor project.
router.get('/pic-options', authorizeRoles('Management','Owner','Admin'), getPicOptions);

router.get('/', authorizeRoles('Marketing','Procurement','Finance','Management','Owner','Admin'), async (req, res) => {
  try {
    // createdBy di-populate supaya frontend bisa menampilkan nama PIC, bukan
    // sekadar ObjectId.
    const projects = await Project.find()
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 });
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

// Dulu rute ini punya handler sendiri yang menyimpan lewat new Project(req.body),
// sehingga createdBy tidak pernah terisi dan pembuat project tak terlacak.
// projectController.addProject sudah mengisinya dari token dan membatasi field
// yang boleh datang dari klien.
router.post('/', authorizeRoles('Marketing','Admin'), addProject);

// Pemindahan PIC dipisahkan dari update-status di bawah, yang memakai
// $set: req.body tanpa pembatasan field dan boleh diakses Marketing.
router.patch('/:projectId/pic', authorizeRoles('Management','Owner','Admin'), updateProjectPIC);

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