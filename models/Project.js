const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  projectName: { type: String, required: true },
  institutionName: String,
  clientName: { type: String, required: true },
  clientContact: String,
  clientAddress: String,
  amount: Number,
  currency: { type: String, default: 'IDR' },
  description: String,
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: 'project' // <-- INI KUNCINYA biar namanya tetap 'project' di Compass
});

module.exports = mongoose.model('Project', ProjectSchema);