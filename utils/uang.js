/* Konversi nilai uang ke mata uang dasar.
 *
 * KENAPA ADA: sebelum ini setiap dokumen menyimpan `currency` sebagai string di
 * sebelah angkanya, dan tidak satu pun perhitungan membacanya. Quotation supplier
 * dalam CNY dijumlahkan langsung dengan rupiah di laporan keuangan, tanpa
 * peringatan. Berkas ini menjadi SATU-SATUNYA tempat perkalian kurs terjadi,
 * supaya tidak ada controller yang menulis ulang `* (d.exchangeRate || 1)` dan
 * salah di salah satunya.
 *
 * ATURAN DASAR:
 *
 *   1. IDR adalah mata uang dasar pelaporan. Semua agregasi lintas dokumen
 *      dinyatakan dalam IDR.
 *   2. Nominal disimpan APA ADANYA dalam mata uang aslinya. Yang dikirim ke
 *      vendor dan client harus persis angka yang disepakati, bukan hasil
 *      konversi.
 *   3. Kurs terkunci di dokumen saat dibuat. Kalau pasar bergerak, dokumen lama
 *      tidak ikut berubah — itu yang membuat angkanya bisa diaudit.
 *   4. Nilai IDR DIHITUNG, tidak disimpan ganda. Menyimpan `amountIDR` terpisah
 *      menciptakan dua sumber kebenaran yang bisa berbeda begitu salah satunya
 *      diubah.
 *
 * Dokumen lama tidak punya `exchangeRate`. Karena seluruhnya berdenominasi IDR,
 * bawaan 1 membuat hasilnya persis sama seperti sebelum perubahan ini — jadi
 * tidak ada migrasi data yang dibutuhkan.
 *
 * Berkas ini punya cermin di frontend/src/utils/uang.js. tests/uang.test.js
 * menjaga keduanya tetap sepakat, meniru tests/passwordPolicy.test.js.
 */

const MATA_UANG_DASAR = 'IDR';
const KURS_DASAR = 1;

/* Mata uang tanpa satuan pecahan menurut ISO 4217. IDR punya "sen" secara
 * formal, tapi tidak pernah dipakai dalam praktik bisnis Indonesia dan seluruh
 * sistem ini memperlakukannya bulat, jadi ikut didaftarkan di sini. */
const TANPA_DESIMAL = new Set([
  'IDR', 'JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'TWD',
  'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF', 'BIF', 'DJF',
  'GNF', 'KMF', 'MGA', 'VUV', 'LAK',
]);

/** Jumlah angka di belakang koma untuk sebuah mata uang. */
const desimalMataUang = (kode) => (TANPA_DESIMAL.has(String(kode || '').toUpperCase()) ? 0 : 2);

/** Apakah kode ini mata uang dasar. Perbandingan tidak peduli besar-kecil huruf. */
const mataUangDasar = (kode) =>
  String(kode || MATA_UANG_DASAR).toUpperCase() === MATA_UANG_DASAR;

/**
 * Apakah pasangan mata uang dan kurs ini masuk akal.
 *
 * IDR wajib berkurs tepat 1 — kurs selain itu berarti ada yang salah paham soal
 * arah konversinya, dan diam-diam akan menggandakan seluruh laporan.
 */
function kursValid(kode, kurs) {
  const angka = Number(kurs);
  if (!Number.isFinite(angka) || angka <= 0) return false;
  if (mataUangDasar(kode)) return angka === KURS_DASAR;
  return true;
}

/**
 * Kurs yang siap dipakai. Dokumen lama tanpa exchangeRate jatuh ke 1, dan IDR
 * selalu dipaksa 1 berapa pun yang dikirim klien.
 */
function kursDipakai(kode, kurs) {
  if (mataUangDasar(kode)) return KURS_DASAR;
  const angka = Number(kurs);
  return Number.isFinite(angka) && angka > 0 ? angka : KURS_DASAR;
}

/** Nilai sebuah nominal dalam mata uang dasar. */
function keIDR(nominal, kurs, kode) {
  const n = Number(nominal) || 0;
  return n * kursDipakai(kode, kurs);
}

/**
 * Jumlahkan sekumpulan dokumen dalam mata uang dasar.
 *
 * Dipakai menggantikan pola `reduce((s, d) => s + d.amount, 0)` yang tersebar di
 * financialController dan projectTimelineController — pola itulah yang selama ini
 * menjumlah dolar sebagai rupiah.
 *
 * @param {Array} daftar dokumen (boleh hasil .lean() maupun dokumen Mongoose)
 * @param {(d: any) => number} ambilNominal pengambil nominal dari satu dokumen
 */
function jumlahIDR(daftar, ambilNominal) {
  return (daftar || []).reduce(
    (total, d) => total + keIDR(ambilNominal(d), d?.exchangeRate, d?.currency),
    0
  );
}

/**
 * Bentuk siap simpan dari mata uang + kurs yang dikirim klien.
 * Mengembalikan null kalau pasangannya tidak valid, supaya controller bisa
 * membalas 400 alih-alih menyimpan angka yang salah diam-diam.
 */
function normalkanUang(kode, kurs) {
  const mataUang = String(kode || MATA_UANG_DASAR).toUpperCase();
  if (mataUangDasar(mataUang)) return { currency: MATA_UANG_DASAR, exchangeRate: KURS_DASAR };
  const angka = Number(kurs);
  if (!Number.isFinite(angka) || angka <= 0) return null;
  return { currency: mataUang, exchangeRate: angka };
}

module.exports = {
  MATA_UANG_DASAR,
  KURS_DASAR,
  desimalMataUang,
  mataUangDasar,
  kursValid,
  kursDipakai,
  keIDR,
  jumlahIDR,
  normalkanUang,
};

// Pemeriksaan mandiri, pola yang sama dengan utils/paymentTerms.js.
// Jalankan: node utils/uang.js
if (require.main === module) {
  const assert = require('assert');

  // Dokumen lama: tidak punya currency maupun exchangeRate sama sekali.
  assert.strictEqual(keIDR(1000), 1000, 'tanpa kurs harus apa adanya');
  assert.strictEqual(keIDR(1000, undefined, undefined), 1000);
  assert.strictEqual(keIDR(1000, null, 'IDR'), 1000);
  assert.strictEqual(keIDR(0, 16200, 'USD'), 0);

  // Konversi dasar.
  assert.strictEqual(keIDR(12500, 16200, 'USD'), 202_500_000);
  assert.strictEqual(keIDR(100000, 2250, 'CNY'), 225_000_000);

  // IDR mengabaikan kurs yang salah kirim — ini yang mencegah laporan berlipat.
  assert.strictEqual(keIDR(1000, 16200, 'IDR'), 1000, 'IDR harus tetap 1:1');
  assert.strictEqual(keIDR(1000, 16200, 'idr'), 1000, 'perbandingan tidak peduli huruf besar-kecil');

  // Validasi.
  assert.strictEqual(kursValid('IDR', 1), true);
  assert.strictEqual(kursValid('IDR', 16200), false, 'IDR berkurs selain 1 itu salah');
  assert.strictEqual(kursValid('USD', 16200), true);
  assert.strictEqual(kursValid('USD', 0), false);
  assert.strictEqual(kursValid('USD', -5), false);
  assert.strictEqual(kursValid('USD', NaN), false);
  assert.strictEqual(kursValid('USD', 'abc'), false);
  assert.strictEqual(kursValid('USD', undefined), false, 'mata uang asing wajib punya kurs');

  // normalkanUang: bentuk siap simpan, atau null supaya controller bisa menolak.
  assert.deepStrictEqual(normalkanUang('IDR', 1), { currency: 'IDR', exchangeRate: 1 });
  assert.deepStrictEqual(normalkanUang('idr', 99), { currency: 'IDR', exchangeRate: 1 });
  assert.deepStrictEqual(normalkanUang('usd', 16200), { currency: 'USD', exchangeRate: 16200 });
  assert.strictEqual(normalkanUang('USD', 0), null);
  assert.strictEqual(normalkanUang('USD', undefined), null);
  assert.deepStrictEqual(normalkanUang(undefined, undefined), { currency: 'IDR', exchangeRate: 1 });

  // jumlahIDR: inti perbaikannya — campuran mata uang dalam satu agregasi.
  const campuran = [
    { amount: 100, currency: 'USD', exchangeRate: 16200 },
    { amount: 5_000_000, currency: 'IDR', exchangeRate: 1 },
    { amount: 200, currency: 'CNY', exchangeRate: 2250 },
    { amount: 1_000_000 }, // dokumen lama tanpa field mata uang
  ];
  assert.strictEqual(
    jumlahIDR(campuran, (d) => d.amount),
    1_620_000 + 5_000_000 + 450_000 + 1_000_000
  );
  assert.strictEqual(jumlahIDR([], (d) => d.amount), 0);
  assert.strictEqual(jumlahIDR(null, (d) => d.amount), 0);

  // Regresi yang dijaga: seluruh data lama berdenominasi IDR, jadi hasilnya harus
  // persis sama dengan reduce polos sebelum perubahan ini.
  const lama = [{ amount: 380_000_000 }, { amount: 190_000_000 }, { amount: 95_000_000 }];
  assert.strictEqual(
    jumlahIDR(lama, (d) => d.amount),
    lama.reduce((s, d) => s + d.amount, 0),
    'data IDR lama tidak boleh berubah nilainya'
  );

  // Desimal.
  assert.strictEqual(desimalMataUang('IDR'), 0);
  assert.strictEqual(desimalMataUang('JPY'), 0);
  assert.strictEqual(desimalMataUang('usd'), 2);
  assert.strictEqual(desimalMataUang('EUR'), 2);

  console.log('✅ uang self-check passed');
}
