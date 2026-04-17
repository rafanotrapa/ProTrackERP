const Project = require('../models/Project');
const Log = require('../models/Log');

// 1. ADD NEW PROJECT (Marketing Action)
exports.addProject = async (req, res) => {
  try {
    // Ambil data sesuai dengan formData di AddProject.jsx
    const { 
      projectId, 
      projectName, 
      institutionName, 
      clientName, 
      clientContact, 
      clientAddress, 
      amount, 
      currency, 
      description 
    } = req.body;

    const newProject = new Project({
      projectId,        // BJK-YYYYMM-RANDOM
      projectName,
      institutionName,
      clientName,
      clientContact,
      clientAddress,
      amount,
      currency,
      description,
      status: 'Tendering', // Status default awal proyek
      createdBy: req.user.id
    });

    const savedProject = await newProject.save();

    // ==========================================
    // INSERT LOG: CREATE PROJECT
    // ==========================================
    await Log.create({
      user: req.user.username,
      action: `CREATED NEW PROJECT: ${projectName} [ID: ${projectId}]`,
      category: 'PROJECT',
      type: 'CREATE'
    });

    res.status(201).json({
      msg: 'Project berhasil didaftarkan!',
      project: savedProject
    });

  } catch (err) {
    console.error("Error Save Project:", err);
    res.status(500).json({ msg: 'Gagal simpan project ke database' });
  }
};

// 2. GET ALL PROJECTS (Buat Monitoring/Timeline)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal mengambil data project' });
  }
};

// 3. DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project tidak ditemukan' });

    const deletedName = project.projectName;
    const deletedID = project.projectId;

    await Project.findByIdAndDelete(req.params.id);

    // ==========================================
    // INSERT LOG: DELETE PROJECT
    // ==========================================
    await Log.create({
      user: req.user.username,
      action: `DELETED PROJECT: ${deletedName} [ID: ${deletedID}]`,
      category: 'PROJECT',
      type: 'DELETE'
    });

    res.json({ msg: 'Project berhasil dihapus dari sistem' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal menghapus project' });
  }
};