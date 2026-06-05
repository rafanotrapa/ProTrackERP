const Project = require('../models/Project');
const Log = require('../models/Log');

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

    const newProject = new Project({
      projectId,
      projectName,
      institutionName,
      clientCompany: clientCompany || '',  // 🆕 Opsional
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

    res.status(201).json({
      msg: 'Project berhasil didaftarkan!',
      project: savedProject
    });

  } catch (err) {
    console.error("Error Save Project:", err);
    res.status(500).json({ msg: 'Gagal simpan project ke database' });
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