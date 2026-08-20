/* Kalimat notifikasi untuk EMAIL.
 *
 * Kenapa disalin di sini alih-alih memakai frontend/src/i18n/kamus.js:
 * berkas itu modul ESM milik Vite dan tidak ikut dikirim ke server saat deploy
 * (deploy-build.sh hanya mengemas berkas backend). Backend juga CommonJS.
 *
 * Kenapa hanya satu bahasa: email dikirim saat kejadian, sedangkan pilihan
 * bahasa hidup di browser penerima dan tidak pernah sampai ke server. Jadi
 * tidak ada cara jujur untuk tahu bahasa apa yang diinginkan pembacanya. Dipakai
 * bahasa Indonesia karena itu bahasa bawaan aplikasi. Lonceng in-app tetap
 * dwibahasa — di sana bahasanya memang diketahui saat render.
 *
 * Salinan ini WAJIB sejalan dengan kunci 'notif.*' di kamus frontend.
 * tests/notifikasi.test.js yang menjaganya: kalau ada jenis yang dipakai
 * controller tapi tidak punya kalimat di salah satu sisi, test gagal. Pola ini
 * meniru tests/passwordPolicy.test.js yang menjaga util backend dan cerminan
 * frontendnya tetap sepakat.
 */

const TEKS = {
  supplierQuotationCreated: 'Supplier Quotation {nomor} dari {oleh} perlu Anda setujui',
  supplierQuotationApproved: 'Supplier Quotation {nomor} disetujui — Client Quotation bisa dikerjakan',
  supplierQuotationRejected: 'Supplier Quotation {nomor} ditolak {oleh} — perbaiki dan ajukan ulang',
  clientQuotationSubmitted: 'Client Quotation {nomor} dari {oleh} perlu Anda setujui',
  clientQuotationApproved: 'Client Quotation {nomor} disetujui — invoice bisa diterbitkan',
  clientQuotationRejected: 'Client Quotation {nomor} ditolak {oleh} — perbaiki dan ajukan ulang',
  poCreated: 'Purchase Order {nomor} terbit — siapkan pembayaran ke vendor',
  poQcPassed: 'Barang PO {nomor} lolos QC — siap dijadwalkan kirim',
  poQcReturned: 'Barang PO {nomor} diretur saat QC — perlu ditindaklanjuti ke vendor',
  poDelivered: 'Barang PO {nomor} sudah terkirim — tagihan ke client bisa diterbitkan',
  supplierInvoiceSubmitted: 'Tagihan supplier {nomor} dari {oleh} perlu dibayar',
  supplierInvoicePaid: 'Tagihan supplier {nomor} sudah dibayar — vendor bisa dikabari',
  invoiceIssued: 'Invoice {nomor} terbit — kirimkan ke client untuk ditagihkan',
  paymentSubmitted: 'Bukti pembayaran invoice {nomor} perlu Anda verifikasi',
  paymentVerified: 'Pembayaran invoice {nomor} terverifikasi — progress project bertambah',
  paymentRejected: 'Pembayaran invoice {nomor} ditolak — periksa ulang bukti transfernya',
  projectCompleted: 'Project {nomor} selesai — seluruh tagihan lunas',
  expenseApproved: 'Pengajuan biaya {nomor} disetujui {oleh}',
  expenseRejected: 'Pengajuan biaya {nomor} ditolak {oleh} — lihat alasannya di detail',
  picChanged: 'Anda kini memegang project {nomor} sebagai PIC',
};

/** Sisipkan {param} ke dalam kalimat; parameter kosong dibuang, bukan dibiarkan mentah. */
const isi = (teks, params = {}) =>
  teks.replace(/\{(\w+)\}/g, (cocok, kunci) =>
    params[kunci] === undefined || params[kunci] === '' ? '' : String(params[kunci])
  ).replace(/\s{2,}/g, ' ').trim();

/** Kalimat notifikasi siap tampil. Jenis tak dikenal mengembalikan null. */
function kalimat(jenis, params) {
  return TEKS[jenis] ? isi(TEKS[jenis], params) : null;
}

module.exports = { TEKS, kalimat };
