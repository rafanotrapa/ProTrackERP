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
    cogs: { type: Number, required: true } // Harga modal dari supplier
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
  taxPercentage: { 
    type: Number, 
    default: 0 
  }, // Inputan user (contoh: 11 untuk 11%)
  taxAmount: { 
    type: Number, 
    default: 0 
  }, // Hasil hitungan backend/frontend (Subtotal * taxPercentage / 100)
  
  // --- KOMERSIAL & DOKUMEN ---
  topOption: { 
    type: String 
  }, // Term of Payment
  remarks: { 
    type: String 
  },
  documentUrl: { 
    type: String 
  }, // Path file PDF/Gambar penawaran asli
  
  // --- SISTEM APPROVAL (FOR MANAGEMENT) ---
  approvalStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  approvalDate: { 
    type: Date 
  },
  
  // --- LOG WAKTU ---
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  collection: 'supplier_quotation',
  timestamps: true // Otomatis nambahin createdAt & updatedAt
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);