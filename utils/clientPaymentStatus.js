const mongoose = require('mongoose');
const Payment = require('../models/Payment');

const PAID    = 'Paid';
const PARTIAL = 'Partial';
const UNPAID  = 'Unpaid';

// Toleransi pembulatan saat membandingkan uang masuk dengan nilai tagihan.
// Angka yang sama dipakai di utils/poPaymentStatus.js untuk sisi supplier.
const TOLERANSI = 1;

/**
 * Status pembayaran invoice klien diturunkan dari uang yang benar-benar masuk,
 * bukan dari sebuah tanda yang dipasang sekali lalu tidak pernah ditinjau ulang.
 *
 * Sebelumnya verifyPayment menyetel invoice menjadi 'Paid' tanpa syarat, tanpa
 * membandingkan nominalnya dengan nilai tagihan. Akibatnya bayar sebagian sudah
 * cukup untuk membuat invoice hilang dari daftar tagihan yang bisa dibayar,
 * mengecilkan sisa tagihan di ringkasan penagihan, menyatakan project selesai,
 * dan membuka penerbitan termin berikutnya — semuanya dari satu tanda yang salah.
 *
 * Satu invoice bisa dibayar beberapa kali; createPayment memang sudah
 * menjumlahkan pembayaran terverifikasi sebelumnya untuk menghitung sisa
 * tagihan. Fungsi ini memakai penjumlahan yang sama sebagai satu-satunya sumber
 * kebenaran.
 */

/**
 * Total pembayaran terverifikasi untuk sekumpulan invoice.
 *
 * Satu query untuk seluruh daftar, bukan satu query per invoice. Pola lama
 * memanggil Payment.findOne() di dalam perulangan: pada 19 invoice biayanya
 * 551 ms berbanding 33 ms, dan tumbuh linier terhadap jumlah invoice.
 *
 * @param {Array} invoiceIds daftar ObjectId invoice
 * @returns {Promise<Map<string, number>>} peta id invoice -> total terverifikasi
 */
async function totalTerbayarPerInvoice(invoiceIds = []) {
  const hasil = new Map();
  if (invoiceIds.length === 0) return hasil;

  const ids = invoiceIds
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(String(id)));

  const baris = await Payment.aggregate([
    { $match: { invoiceId: { $in: ids }, status: 'Verified' } },
    { $group: { _id: '$invoiceId', total: { $sum: '$amountPaid' } } },
  ]);

  baris.forEach((b) => hasil.set(String(b._id), Number(b.total) || 0));
  return hasil;
}

/** Total pembayaran terverifikasi untuk satu invoice. */
async function totalTerbayar(invoiceId) {
  const peta = await totalTerbayarPerInvoice([invoiceId]);
  return peta.get(String(invoiceId)) || 0;
}

/**
 * Status invoice dari uang yang masuk dibanding nilai tagihannya.
 * @returns {'Paid'|'Partial'|'Unpaid'}
 */
function statusDariNominal(terbayar, nilaiTagihan) {
  const masuk = Number(terbayar) || 0;
  const nilai = Number(nilaiTagihan) || 0;

  if (masuk <= 0) return UNPAID;
  if (nilai <= 0) return PAID;
  if (masuk + TOLERANSI >= nilai) return PAID;
  return PARTIAL;
}

/** Benar hanya kalau tagihannya benar-benar tertutup penuh. */
const sudahLunas = (terbayar, nilaiTagihan) =>
  statusDariNominal(terbayar, nilaiTagihan) === PAID;

/**
 * Peta status untuk sekumpulan invoice, siap dipakai halaman daftar.
 * @param {Array} invoices dokumen invoice yang punya _id dan amount
 * @returns {Promise<Map<string, 'Paid'|'Partial'|'Unpaid'>>}
 */
async function statusPerInvoice(invoices = []) {
  const terbayar = await totalTerbayarPerInvoice(invoices.map((i) => i._id));
  const hasil = new Map();

  invoices.forEach((inv) => {
    const kunci = String(inv._id);
    hasil.set(kunci, statusDariNominal(terbayar.get(kunci) || 0, inv.amount));
  });

  return hasil;
}

module.exports = {
  totalTerbayarPerInvoice,
  totalTerbayar,
  statusDariNominal,
  sudahLunas,
  statusPerInvoice,
  PAID,
  PARTIAL,
  UNPAID,
  TOLERANSI,
};

// Pemeriksaan mandiri, pola yang sama dengan utils/paymentTerms.js.
// Jalankan: node utils/clientPaymentStatus.js
if (require.main === module) {
  const assert = require('assert');

  assert.strictEqual(statusDariNominal(0, 1000), UNPAID);
  assert.strictEqual(statusDariNominal(400, 1000), PARTIAL);
  assert.strictEqual(statusDariNominal(1000, 1000), PAID);
  assert.strictEqual(statusDariNominal(1200, 1000), PAID, 'lebih bayar tetap lunas');

  // Toleransi pembulatan: kurang satu rupiah masih dianggap lunas, kurang dua tidak.
  assert.strictEqual(statusDariNominal(999, 1000), PAID);
  assert.strictEqual(statusDariNominal(998, 1000), PARTIAL);

  // Regresi bug: bayar sebagian dulu membuat invoice berstatus Paid.
  assert.notStrictEqual(statusDariNominal(1, 100_000_000), PAID);
  assert.strictEqual(sudahLunas(4_000_000, 10_000_000), false);
  assert.strictEqual(sudahLunas(10_000_000, 10_000_000), true);

  // Termin 30/40/30 dari kontrak 1 miliar, dibayar dua termin pertama.
  assert.strictEqual(sudahLunas(300_000_000, 300_000_000), true);
  assert.strictEqual(sudahLunas(250_000_000, 400_000_000), false);

  console.log('✅ clientPaymentStatus self-check passed');
}
