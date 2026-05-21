const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true }, 
  vendorName: { type: String, required: true },
  companyType: { type: String, enum: ['PT', 'CV', 'Persero', 'Individual'], default: 'PT' },
  contactPerson: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  bankAccount: String, 
  category: { type: String, default: 'General' }, 
  
  // Langsung diset Approved dari awal
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