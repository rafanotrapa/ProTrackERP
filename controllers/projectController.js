const Project = require('../models/Project');
const Log = require('../models/Log');
const User = require('../models/User');

exports.addProject = async (req, res) => {
  try {

    const {
      projectId,
      projectName,
      institutionName,
      clientCompany,
      clientName,
      clientContact,
      clientAddress,
      amount,
      currency,
      description,
      quotationMode
    } = req.body;

    // Pemeriksaan ini sebelumnya ada di routes/projectRoutes.js. Ikut pindah ke
    // sini supaya tidak hilang saat rute disambungkan ke controller.
    const sudahAda = await Project.findOne({ projectId });
    if (sudahAda) {
      return res.status(400).json({ success: false, msg: 'ID BJK sudah terdaftar!' });
    }

    // Field disebut satu per satu, bukan menyalin req.body mentah. Dengan begitu
    // status, penanda milestone, dan createdBy hanya bisa ditentukan server —
    // klien tidak bisa menitipkan PIC palsu lewat body.
    const newProject = new Project({
      projectId,
      projectName,
      institutionName,
      clientCompany: clientCompany || '',
      clientName,
      clientContact,
      clientAddress,
      amount,
      currency,
      description,
      quotationMode: quotationMode || 'auto',
      status: 'Tendering',
      createdBy: req.user.id
    });

    const savedProject = await newProject.save();

    await Log.create({
      user: req.user.username,
      action: `CREATED NEW PROJECT: ${projectName} [ID: ${projectId}]`,
      category: 'PROJECT',
      type: 'CREATE'
    });

    // success dan data dipertahankan karena itu bentuk balasan rute lama.
    res.status(201).json({
      success: true,
      msg: 'Project berhasil didaftarkan!',
      project: savedProject,
      data: savedProject
    });

  } catch (err) {
    console.error("Error Save Project:", err);
    res.status(500).json({ success: false, msg: 'Gagal simpan project ke database' });
  }
};

/** Daftar user Marketing untuk mengisi dropdown pemindahan PIC. */
exports.getPicOptions = async (req, res) => {
  try {
    const marketing = await User.find({ role: 'Marketing' })
      .select('username')
      .sort({ username: 1 });
    res.json(marketing);
  } catch (err) {
    console.error('Error ambil kandidat PIC:', err);
    res.status(500).json({ msg: 'Gagal mengambil daftar PIC' });
  }
};

/**
 * Pindahkan PIC sebuah project.
 *
 * Sengaja terpisah dari update-status, yang memakai $set: req.body tanpa
 * membatasi field dan terbuka untuk Marketing — lewat sana siapa pun bisa
 * memindahkan project ke dirinya sendiri.
 */
exports.updateProjectPIC = async (req, res) => {
  try {
    const { createdBy } = req.body || {};
    if (!createdBy) {
      return res.status(400).json({ msg: 'PIC tujuan wajib diisi.' });
    }

    const calonPIC = await User.findById(createdBy).select('username role');
    if (!calonPIC) {
      return res.status(404).json({ msg: 'User tujuan tidak ditemukan.' });
    }
    if (calonPIC.role !== 'Marketing') {
      return res.status(400).json({ msg: 'PIC project hanya bisa dipegang akun Marketing.' });
    }

    const project = await Project.findOneAndUpdate(
      { projectId: req.params.projectId.trim() },
      { $set: { createdBy: calonPIC._id } },
      { new: true }
    ).populate('createdBy', 'username role');

    if (!project) {
      return res.status(404).json({ msg: 'Project tidak ditemukan.' });
    }

    await Log.create({
      user: req.user?.username || 'System',
      action: `CHANGED PROJECT PIC: ${project.projectName} [ID: ${project.projectId}] -> ${calonPIC.username}`,
      category: 'PROJECT',
      type: 'UPDATE'
    });

    res.json({ success: true, msg: `PIC dipindahkan ke ${calonPIC.username}.`, data: project });
  } catch (err) {
    console.error('Error ubah PIC:', err);
    res.status(500).json({ msg: 'Gagal memindahkan PIC project.' });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal mengambil data project' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project tidak ditemukan' });
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal mengambil detail project' });
  }
};

exports.getProjectByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ projectId: projectId });
    if (!project) {
      return res.status(404).json({ msg: 'Project tidak ditemukan' });
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal mengambil detail project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProject) {
      return res.status(404).json({ msg: 'Project tidak ditemukan' });
    }

    await Log.create({
      user: req.user.username,
      action: `UPDATED PROJECT: ${updatedProject.projectName} [ID: ${updatedProject.projectId}]`,
      category: 'PROJECT',
      type: 'UPDATE'
    });

    res.json({ msg: 'Project berhasil diupdate', project: updatedProject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project tidak ditemukan' });

    const deletedName = project.projectName;
    const deletedID = project.projectId;

    await Project.findByIdAndDelete(req.params.id);

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

exports.updateProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDPPaid, isItemsReceived, isItemsDelivered, isFinalPaid } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ msg: 'Project tidak ditemukan' });
    }

    if (isDPPaid !== undefined) project.isDPPaid = isDPPaid;
    if (isItemsReceived !== undefined) project.isItemsReceived = isItemsReceived;
    if (isItemsDelivered !== undefined) project.isItemsDelivered = isItemsDelivered;
    if (isFinalPaid !== undefined) project.isFinalPaid = isFinalPaid;

    await project.save();

    await Log.create({
      user: req.user.username,
      action: `UPDATED PROGRESS: ${project.projectName} [DP:${project.isDPPaid}, Received:${project.isItemsReceived}, Delivered:${project.isItemsDelivered}, Final:${project.isFinalPaid}]`,
      category: 'PROJECT',
      type: 'UPDATE'
    });

    res.json({ msg: 'Progress project berhasil diupdate', project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal update progress project' });
  }
};