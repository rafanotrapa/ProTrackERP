const mongoose = require('mongoose');

const CreateInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  projectName: { type: String }, // Tambahan biar rapi di laporan
  clientName: { type: String, required: true },
  amount: { type: Number, required: true },
  items: { type: Array }, // Simpan detail barang dari quotation
  status: { type: String, default: 'Unpaid' }, // Set default Paid biar langsung masuk profit dashboard
  dueDate: { type: Date }, // Samain sama frontend
  remarks: { type: String },
  totalContractValue: { type: Number },
  billingPhase: { type: String },
  topOption: { type: String }
}, { 
  timestamps: true,
  collection: 'client_invoice' // Tetap sesuai permintaan lo
});

module.exports = mongoose.model('CreateInvoice', CreateInvoiceSchema);