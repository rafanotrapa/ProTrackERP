const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CreateInvoice', 
    required: true 
  },
  amountPaid: {
    type: Number,
    required: true
  },
  // Selisih kalau klien membayar melebihi nilai invoice. Disimpan eksplisit supaya
  // kelebihannya tidak menguap dari laporan dan tidak diam-diam menutupi tunggakan
  // project lain saat outstanding dihitung secara agregat.
  excessAmount: {
    type: Number,
    default: 0
  },
  evidencePath: { 
    type: String, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    required: true 
  },
  remarks: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'], 
    default: 'Pending' 
  }
}, { timestamps: true });

// Setiap halaman penagihan menanyakan hal yang sama: adakah pembayaran
// terverifikasi untuk invoice ini. Tanpa indeks ini MongoDB memindai seluruh
// koleksi payments untuk tiap invoice — explain() mengembalikan COLLSCAN.
//
// autoIndex dimatikan di produksi, jadi indeksnya baru benar-benar terpasang
// setelah `npm run sync-indexes` dijalankan di server.
paymentSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);