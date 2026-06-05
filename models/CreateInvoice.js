const mongoose = require('mongoose');

const CreateInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  projectName: { type: String }, 
  clientName: { type: String, required: true },
  amount: { type: Number, required: true },
  items: { type: Array }, 
  status: { type: String, default: 'Unpaid' }, 
  dueDate: { type: Date }, 
  remarks: { type: String },
  totalContractValue: { type: Number },
  billingPhase: { type: String },
  topOption: { type: String }
}, { 
  timestamps: true,
  collection: 'client_invoice' 
});

module.exports = mongoose.model('CreateInvoice', CreateInvoiceSchema);