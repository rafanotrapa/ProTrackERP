const mongoose = require('mongoose');

const CreateInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  clientName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Unpaid' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CreateInvoice', CreateInvoiceSchema, 'client_invoice');