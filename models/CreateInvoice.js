const mongoose = require('mongoose');

const CreateInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },

  // Siapa yang membuat dokumen ini. Tanpa ini, notifikasi arah balik
  // ('dokumenmu ditolak') tidak bisa dituju ke orangnya dan terpaksa
  // disiarkan ke seluruh peran. Diisi server dari req.user.id.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectName: { type: String }, 
  clientName: { type: String, required: true },
  amount: { type: Number, required: true },
  // Mata uang dan kurs terkunci saat dokumen dibuat; nilai rupiahnya dihitung
  // saat agregasi lewat utils/uang.js. Lihat penjelasan lengkap di
  // models/SupplierQuotation.js.
  currency:     { type: String, default: 'IDR' },
  exchangeRate: { type: Number, default: 1 },

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

// Satu project hanya boleh punya satu invoice per tahap termin.
//
// generateNextInvoice menghitung invoice yang sudah ada lalu membuat yang
// berikutnya berdasarkan hitungan itu. Tanpa penguncian, dua Finance yang
// menekan "Generate Invoice" bersamaan sama-sama membaca hitungan lama dan
// keduanya berhasil membuat invoice untuk termin yang sama. Diuji dengan lima
// permintaan paralel: lahir lima invoice "Termin 1 (30%)" senilai Rp 90 juta,
// total Rp 450 juta untuk satu tahap.
//
// Indeks unik ini membuat database sendiri yang menolak duplikat, sehingga
// aman berapa pun jumlah permintaan yang datang bersamaan. Dibatasi pada
// dokumen yang punya billingPhase agar data lama tanpa field itu tidak bentrok.
CreateInvoiceSchema.index(
  { projectId: 1, billingPhase: 1 },
  { unique: true, partialFilterExpression: { billingPhase: { $type: 'string' } } }
);

module.exports = mongoose.model('CreateInvoice', CreateInvoiceSchema);