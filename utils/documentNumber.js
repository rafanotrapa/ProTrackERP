const Counter = require('../models/Counter');

// Batas percobaan saat nomor hasil urutan ternyata sudah terpakai. Angkanya
// menyamai ensureUniquePONumber di controllers/poController.js supaya perilaku
// kedua jalur penomoran tidak berbeda-beda.
const MAKS_PERCOBAAN = 20;

const yearMonth = (tanggal = new Date()) =>
  `${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, '0')}`;

/**
 * Ambil urutan berikutnya untuk satu kunci counter.
 * @param {string} kunci mis. 'BJK-202608'
 * @returns {Promise<number>}
 */
async function nextSequence(kunci) {
  const naikkan = () => Counter.findOneAndUpdate(
    { _id: kunci },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  try {
    return (await naikkan()).seq;
  } catch (err) {
    // Dua permintaan bersamaan pada bulan yang dokumen counter-nya belum ada
    // sama-sama mencoba menyisipkan _id yang sama, dan salah satunya kalah
    // dengan E11000. Percobaan kedua pasti menemukan dokumennya sudah ada,
    // sehingga jatuh ke jalur $inc biasa.
    if (err.code !== 11000) throw err;
    return (await naikkan()).seq;
  }
}

/**
 * Nomor dokumen berurutan dengan format PREFIX-YYYYMM-NNNN, ulang dari 0001
 * setiap ganti bulan.
 *
 * Nomor lama di sistem ini dibuat acak pada rentang 1000-9999, sedangkan urutan
 * baru mulai dari 0001. Jadi 999 nomor pertama tiap bulan mustahil bertabrakan
 * dengan data lama. Sesudah itu barulah urutannya memasuki wilayah nomor acak
 * lama, dan di situ `sudahDipakai` yang menjaga: nomor yang bentrok dilewati,
 * bukan menggagalkan penyimpanan.
 *
 * @param {string} prefix mis. 'BJK'
 * @param {(nomor: string) => Promise<boolean>} sudahDipakai pemeriksa ke koleksi terkait
 * @param {Date} [tanggal] untuk pengujian
 * @returns {Promise<string>}
 */
async function nextDocumentNumber(prefix, sudahDipakai, tanggal = new Date()) {
  const bulan = yearMonth(tanggal);
  const kunci = `${prefix}-${bulan}`;

  for (let percobaan = 0; percobaan < MAKS_PERCOBAAN; percobaan += 1) {
    const seq = await nextSequence(kunci);
    const nomor = `${prefix}-${bulan}-${String(seq).padStart(4, '0')}`;

    if (typeof sudahDipakai !== 'function') return nomor;
    if (!(await sudahDipakai(nomor))) return nomor;
  }

  // Sudah 20 nomor berturut-turut bentrok. Daripada menggagalkan pembuatan
  // dokumen, pakai timestamp yang praktis pasti unik — sama seperti jalan
  // keluar yang dipakai penomoran PO.
  return `${prefix}-${bulan}-${Date.now().toString().slice(-6)}`;
}

module.exports = { nextDocumentNumber, nextSequence, yearMonth, MAKS_PERCOBAAN };
