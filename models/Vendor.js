const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true }, 
  vendorName: { type: String, required: true },
  /* Bentuk badan usaha. Empat nilai pertama adalah bentuk Indonesia dan sengaja
   * dipertahankan supaya 13 vendor yang sudah ada tetap valid; sisanya bentuk
   * asing yang lazim, ditambahkan karena vendor luar negeri sebelumnya terpaksa
   * dipaksa memilih 'PT'. */
  companyType: {
    type: String,
    enum: ['PT', 'CV', 'Persero', 'Individual',
           'Ltd', 'Inc', 'Co., Ltd', 'Pte Ltd', 'GmbH', 'Sdn Bhd', 'Other'],
    default: 'PT',
  },

  // Negara asal vendor. Kosong berarti Indonesia — 13 vendor lama tidak perlu
  // diisi ulang.
  country: { type: String, default: '' },

  /* Mata uang yang biasa dipakai vendor ini. Mengisi otomatis kolom currency
   * saat Supplier Quotation dibuat, supaya tidak salah pilih setiap kali
   * bertransaksi dengan vendor asing yang sama. Bukan pengunci: masih bisa
   * diubah per dokumen. */
  defaultCurrency: { type: String, default: 'IDR' },
  contactPerson: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  bankAccount: String, 
  category: { type: String, default: 'General' }, 
  approvalStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Approved' 
  },
  
  approvalDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now } 
}, { 
  collection: 'vendor' 
});

module.exports = mongoose.model('Vendor', VendorSchema);