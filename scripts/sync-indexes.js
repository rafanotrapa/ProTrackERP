/**
 * Terapkan definisi indeks dari schema ke database.
 *
 * Mongoose hanya membuat indeks baru secara otomatis saat autoIndex aktif
 * (default mati di produksi). Jalankan sekali setelah deploy yang menambah
 * atau mengubah indeks:
 *
 *   node scripts/sync-indexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const CreateInvoice = require('../models/CreateInvoice');
const Notification = require('../models/Notification');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'protrack_erp' });
  console.log('Terhubung ke protrack_erp\n');

  // Deteksi duplikat lebih dulu; pembuatan indeks unik akan gagal kalau ada.
  const duplikat = await CreateInvoice.aggregate([
    { $match: { billingPhase: { $type: 'string' } } },
    { $group: { _id: { projectId: '$projectId', billingPhase: '$billingPhase' }, n: { $sum: 1 }, nomor: { $push: '$invoiceNumber' } } },
    { $match: { n: { $gt: 1 } } },
  ]);

  if (duplikat.length) {
    console.log('DUPLIKAT DITEMUKAN. Bersihkan dulu sebelum indeks bisa dibuat:');
    duplikat.forEach(d => console.log(`  ${d._id.projectId} / ${d._id.billingPhase}: ${d.n}x -> ${d.nomor.join(', ')}`));
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('Tidak ada duplikat projectId+billingPhase.');

  await CreateInvoice.syncIndexes();
  console.log('\nIndeks CreateInvoice sesudah sinkron:');
  (await CreateInvoice.collection.indexes()).forEach(i =>
    console.log(`  ${i.name}${i.unique ? '  [unik]' : ''}`)
  );

  // Notifikasi tidak punya indeks unik, jadi tidak perlu deteksi duplikat.
  // Tapi indeks gabungannya menentukan segalanya: hitungan lonceng dipanggil
  // tiap menit oleh setiap akun yang sedang membuka aplikasi, dan tanpa indeks
  // ini query itu memindai seluruh koleksi.
  await Notification.syncIndexes();
  console.log('\nIndeks Notification sesudah sinkron:');
  (await Notification.collection.indexes()).forEach(i =>
    console.log(`  ${i.name}${i.unique ? '  [unik]' : ''}`)
  );

  await mongoose.disconnect();
})().catch(e => { console.error('GAGAL:', e.message); process.exit(1); });
