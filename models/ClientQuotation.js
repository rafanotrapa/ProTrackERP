const mongoose = require('mongoose');

const ClientQuotationSchema = new mongoose.Schema({
  quotationId:  { type: String, required: true, unique: true },
  projectId:    { type: String, required: true },
  projectName:  { type: String },
  clientName:   { type: String },

  items: [{
    itemName:   String,
    quantity:   Number,
    unit:       String,
    cogs:       Number,
    salesPrice: Number,
  }],

  currency:    { type: String, default: 'IDR' },
  clientPrice: { type: Number, required: true },
  topOption:   { type: String },
  remarks:     { type: String },


  shippingFee:   { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 0 },   
  taxAmount:     { type: Number, default: 0 },

  bankAccount: { type: String, default: '' },
  approvalStatus: {
    type:    String,
    enum:    ['Draft', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft',
  },
  approvalDate:    { type: Date },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  quotationMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  timestamp: { type: Date, default: Date.now },
}, {
  collection: 'client_quotation',
  timestamps: true,
});

module.exports = mongoose.model('ClientQuotation', ClientQuotationSchema);