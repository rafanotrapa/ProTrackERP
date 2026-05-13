const mongoose = require('mongoose');

const ClientQuotationSchema = new mongoose.Schema({
  // --- IDENTITAS ---
  quotationId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  projectId: { 
    type: String, 
    required: true 
  },
  projectName: { 
    type: String 
  },
  clientName: { 
    type: String 
  },
  
  // --- DAFTAR BARANG (DARI SUPPLIER QUOTATION) ---
  items: [{ 
    itemName: String,
    quantity: Number,
    unit: String,
    cogs: Number
  }],

  // --- KOMERSIAL ---
  currency: { 
    type: String, 
    default: 'IDR' 
  },
  clientPrice: { 
    type: Number, 
    required: true 
  },
  topOption: { 
    type: String 
  },
  remarks: { 
    type: String 
  },
  
  // --- SISTEM APPROVAL (UNTUK MANAGEMENT) ---
  approvalStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  approvalDate: { 
    type: Date 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  rejectionReason: { 
    type: String 
  },
  
  // --- LOG WAKTU ---
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  collection: 'client_quotation',
  timestamps: true 
});

module.exports = mongoose.model('ClientQuotation', ClientQuotationSchema);