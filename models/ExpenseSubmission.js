const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
//  Status history — mengikuti pola SupplierInvoice
// ─────────────────────────────────────────────────────────────
const StatusHistorySchema = new mongoose.Schema({
  status:        { type: String, required: true },
  changedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  note:          { type: String },
  timestamp:     { type: Date, default: Date.now },
}, { _id: false });

// ─────────────────────────────────────────────────────────────
//  Item — satu baris biaya (mirip items di ClientQuotation/
//  SupplierQuotation). Beberapa item bisa diinput dalam satu
//  submission, tapi lampirannya tetap satu untuk semua item.
// ─────────────────────────────────────────────────────────────
const ExpenseItemSchema = new mongoose.Schema({
  // Nama biaya — bebas teks, contoh: "Meeting dengan client", "Dinner entertainment"
  name:        { type: String, required: true },
  description: { type: String },
  amount:      { type: Number, required: true },
}, { _id: false });

// ─────────────────────────────────────────────────────────────
//  ExpenseSubmission — biaya di luar Supplier Quotation/Invoice
//  (entertainment, meeting, reimburse, dll) yang dikaitkan ke
//  sebuah project. Bersifat fleksibel terhadap waktu — bisa
//  diinput kapan saja terlepas dari status project.
//
//  Mendukung multi-item dalam satu submission (konsep sama
//  seperti ClientQuotation/SupplierQuotation items[]), tapi
//  lampiran (file) tetap satu untuk seluruh submission —
//  penggabungan bukti dilakukan manual oleh pengaju.
// ─────────────────────────────────────────────────────────────
const ExpenseSubmissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },

  // Project terkait — tidak terikat status project, hanya butuh
  // projectId valid agar bisa dikaitkan ke laporan keuangan.
  projectId:    { type: String, required: true },
  projectName:  { type: String },

  // Daftar item biaya — minimal 1 item
  items: [ExpenseItemSchema],

  // Total dihitung dari sum semua item.amount (disimpan agar
  // query agregasi di Financial Report tidak perlu hitung ulang)
  amount:       { type: Number, required: true },
  currency:     { type: String, default: 'IDR' },

  // Bukti / lampiran (struk, invoice meeting, dll) — satu untuk
  // semua item dalam submission ini
  file:         { type: String },

  // Siapa yang submit
  submittedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: { type: String },

  // ── Approval flow (mirip Supplier Invoice) ─────────────────
  status: {
    type:    String,
    enum:    ['Pending Verification', 'Approved', 'Rejected'],
    default: 'Pending Verification',
  },
  statusHistory: [StatusHistorySchema],

  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:  { type: String },
  reviewDate:      { type: Date },
  rejectionReason: { type: String },

  remarks: { type: String },

}, {
  timestamps: true,
  collection: 'expense_submission',
});

module.exports = mongoose.model('ExpenseSubmission', ExpenseSubmissionSchema);