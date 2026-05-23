const mongoose = require('mongoose');

const SupplierQuotationSchema = new mongoose.Schema({
  // --- IDENTITAS ---
  quotationId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  projectId: { 
    type: String, 
    required: true, 
    trim: true 
  },
  vendorId: { 
    type: String, 
    required: true 
  },
  
  // --- DAFTAR BARANG ---
  items: [{ 
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true },
    cogs: { type: Number, required: true }
  }],
  
  // --- BIAYA LAIN-LAIN ---
  additionalFee: { 
    type: Number, 
    default: 0 
  },
  additionalFeeRemarks: { 
    type: String 
  }, 
  
  // --- PERPAJAKAN ---
  isTaxIncluded: { 
    type: Boolean, 
    default: false 
  }, 
  taxAmount: { 
    type: Number, 
    default: 0 
  },
  
  // --- KOMERSIAL & DOKUMEN ---
  currency: { 
    type: String, 
    default: 'IDR' 
  },
  topOption: { 
    type: String 
  },
  customTop: { 
    type: String 
  },
  remarks: { 
    type: String 
  },
  documentUrl: { 
    type: String 
  },
  
  // --- SISTEM APPROVAL (FOR MANAGEMENT) ---
  approvalStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Draft'], 
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
  collection: 'supplier_quotation',
  timestamps: true
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);