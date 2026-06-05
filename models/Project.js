const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  // --- IDENTITY ---
  projectId: { type: String, required: true, unique: true },
  projectName: { type: String, required: true },
  institutionName: { type: String, required: true },  
  clientCompany: { type: String },  
  clientName: { type: String, required: true },
  clientContact: { type: String },
  clientAddress: { type: String },

  // --- FINANCIAL & SCOPE ---
  amount: { type: Number },
  currency: { type: String, default: 'IDR' },
  description: { type: String },

  // --- QUOTATION MODE ---
  quotationMode: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto'
  },

  // --- PROGRESS TRACKING ---
  isDPPaid: { type: Boolean, default: false },
  isItemsReceived: { type: Boolean, default: false },
  isItemsDelivered: { type: Boolean, default: false },
  isFinalPaid: { type: Boolean, default: false },

  // --- METADATA ---
  status: { type: String, default: 'Tendering' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { type: Date, default: Date.now }

}, { 
  collection: 'project',
  timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);