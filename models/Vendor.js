const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true },
  vendorName: { type: String, required: true },
  companyType: { type: String, enum: ['PT', 'CV', 'Persero', 'Individual'], default: 'PT' },
  contactPerson: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  bankAccount: String, // Buat pembayaran vendor nanti
  category: { type: String, default: 'General' }, // Misal: IT, Konstruksi, Alat Kantor
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: 'vendor' // Tetap konsisten tanpa "s"
});

module.exports = mongoose.model('Vendor', VendorSchema);