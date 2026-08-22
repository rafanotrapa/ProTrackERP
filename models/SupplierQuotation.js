const mongoose = require('mongoose');

const SupplierQuotationSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, trim: true },
  vendorId: { type: String, required: true },

  // Siapa yang membuat dokumen ini. Tanpa ini, notifikasi arah balik
  // ('dokumenmu ditolak') tidak bisa dituju ke orangnya dan terpaksa
  // disiarkan ke seluruh peran. Diisi server dari req.user.id.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  items: [{ 
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true },
    cogs: { type: Number, required: true }
  }],
  
  additionalFee: { type: Number, default: 0 },
  additionalFeeRemarks: { type: String }, 
  
  isTaxIncluded: { type: Boolean, default: false }, 
  taxAmount: { type: Number, default: 0 },
  
  currency: { type: String, default: 'IDR' },
  /* Mata uang dan kurs terkunci saat dokumen dibuat.
   *
   * Nominal di atas disimpan APA ADANYA dalam mata uang aslinya — yang dikirim
   * ke pihak luar harus persis angka yang disepakati. Nilai rupiahnya dihitung
   * saat agregasi lewat utils/uang.js, bukan disimpan terpisah, supaya tidak ada
   * dua sumber kebenaran yang bisa berbeda.
   *
   * Kurs sengaja dibekukan di dokumen: pergerakan pasar tidak boleh mengubah
   * angka transaksi yang sudah terjadi. Bawaan 1 membuat seluruh dokumen lama
   * yang berdenominasi rupiah menghasilkan angka yang persis sama.
   */
  exchangeRate: { type: Number, default: 1 },

  topOption: { type: String },
  customTop: { type: String },
  remarks: { type: String },
  documentUrl: { type: String },
  
  approvalStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Draft'], 
    default: 'Pending' 
  },
  approvalDate: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  
  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'supplier_quotation',
  timestamps: true
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);