const mongoose = require('mongoose');

// Penyimpan urutan nomor dokumen. Satu dokumen per prefix per bulan, dengan _id
// berupa kunci alaminya (mis. 'BJK-202608') — jadi tidak perlu index tambahan,
// dan tidak perlu diurus scripts/sync-indexes.js yang autoIndex-nya mati di
// produksi.
//
// Kenaikan nomor memakai $inc pada satu dokumen, yang sudah atomik di MongoDB.
// Itu sebabnya penomoran berurutan di sini tidak memerlukan transaksi — penting,
// karena aplikasi ini sama sekali belum memakai session dan transaksi Mongoose
// menuntut replica set.
const CounterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
}, {
  collection: 'counter',
  versionKey: false,
});

module.exports = mongoose.model('Counter', CounterSchema);
