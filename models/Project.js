const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  // --- IDENTITY ---
  projectId: { type: String, required: true, unique: true }, // Format BJK-...
  projectName: { type: String, required: true },
  institutionName: { type: String },
  clientName: { type: String, required: true },
  clientContact: { type: String },
  clientAddress: { type: String },

  // --- FINANCIAL & SCOPE ---
  amount: { type: Number },
  currency: { type: String, default: 'IDR' },
  description: { type: String },

  // --- PROGRESS TRACKING (Step-by-Step) ---
  isDPPaid: { type: Boolean, default: false },         // Step 1: DP Lunas
  isItemsReceived: { type: Boolean, default: false },  // Step 2: Barang di Gudang Subcon
  isItemsDelivered: { type: Boolean, default: false }, // Step 3: Barang Sampai di Client (BAST)
  isFinalPaid: { type: Boolean, default: false },      // Step 4: Pelunasan Lunas

  // --- METADATA ---
  status: { type: String, default: 'Tendering' },      // Status operasional
  createdBy: {                                         // Buat nangkep siapa yang input (Admin/Marketing)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { type: Date, default: Date.now }

}, { 
  collection: 'project', // Sesuai request: Paksa nama folder tetap 'project' di Compass
  timestamps: true       // Otomatis nambahin updatedAt kalau ada perubahan status
});

module.exports = mongoose.model('Project', ProjectSchema);