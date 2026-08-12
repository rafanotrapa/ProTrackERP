/**
 * Ubah peran 'Admin' menjadi 'Administrator'.
 *
 * Nama perannya diganti agar jelas cakupannya: mengelola user dan log aktivitas.
 * Jalankan sekali setelah deploy yang membawa perubahan ini:
 *
 *   node scripts/migrate-admin-role.js
 *
 * Aman diulang — akun yang sudah berperan Administrator tidak tersentuh.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'protrack_erp' });
  console.log('Terhubung ke protrack_erp\n');

  const lama = await User.find({ role: 'Admin' }).select('username email');
  if (lama.length === 0) {
    console.log('Tidak ada akun ber-peran "Admin". Tidak ada yang perlu diubah.');
  } else {
    console.log(`Akan diubah menjadi Administrator (${lama.length} akun):`);
    lama.forEach((u) => console.log(`  ${u.username.padEnd(28)} ${u.email}`));

    const hasil = await User.updateMany({ role: 'Admin' }, { $set: { role: 'Administrator' } });
    console.log(`\nSelesai. ${hasil.modifiedCount} akun diperbarui.`);
  }

  // Ketunggalan Super Admin ditahan indeks parsial. Indeks itu hanya terpasang
  // otomatis saat autoIndex aktif, yang mati di produksi — jadi diterapkan di sini.
  const jumlahSuper = await User.countDocuments({ role: 'Super Admin' });
  if (jumlahSuper > 1) {
    console.log(`\nPERINGATAN: ada ${jumlahSuper} akun Super Admin. Sisakan satu dulu,`);
    console.log('indeks unik tidak bisa dipasang selama masih ada duplikat.');
  } else {
    await User.syncIndexes();
    console.log('\nIndeks pada koleksi users:');
    (await User.collection.indexes()).forEach((i) =>
      console.log(`  ${i.name}${i.unique ? '  [unik]' : ''}`)
    );
  }

  const ringkas = await User.aggregate([
    { $group: { _id: '$role', jumlah: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('\nSebaran peran sekarang:');
  ringkas.forEach((r) => console.log(`  ${String(r._id).padEnd(16)} ${r.jumlah}`));

  await mongoose.disconnect();
})().catch((e) => { console.error('GAGAL:', e.message); process.exit(1); });
