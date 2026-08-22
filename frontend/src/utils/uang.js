/* Cermin dari utils/uang.js di backend, plus pembantu tampilan.
 *
 * Logika konversinya WAJIB sepakat dengan sisi backend — tests/uang.test.js
 * mengimpor kedua berkas ini dengan Node polos dan membandingkan hasilnya,
 * meniru cara tests/passwordPolicy.test.js menjaga kembarannya.
 *
 * Karena itu bagian logika di berkas ini sengaja tidak mengimpor React maupun
 * context apa pun. Pembantu tampilan di bawah boleh mengimpor currencies.js
 * karena itu juga modul murni.
 */
// Ekstensi .js ditulis eksplisit, berbeda dari impor lain di proyek ini yang
// mengandalkan resolusi Vite. Alasannya: tests/uang.test.js memuat berkas ini
// dengan Node ESM polos untuk membandingkannya dengan versi backend, dan Node
// menolak impor tanpa ekstensi. Vite menerima kedua bentuk.
import { currencySymbol } from './currencies.js';

export const MATA_UANG_DASAR = 'IDR';
export const KURS_DASAR = 1;

const TANPA_DESIMAL = new Set([
  'IDR', 'JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'TWD',
  'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF', 'BIF', 'DJF',
  'GNF', 'KMF', 'MGA', 'VUV', 'LAK',
]);

export const desimalMataUang = (kode) =>
  (TANPA_DESIMAL.has(String(kode || '').toUpperCase()) ? 0 : 2);

export const mataUangDasar = (kode) =>
  String(kode || MATA_UANG_DASAR).toUpperCase() === MATA_UANG_DASAR;

export function kursValid(kode, kurs) {
  const angka = Number(kurs);
  if (!Number.isFinite(angka) || angka <= 0) return false;
  if (mataUangDasar(kode)) return angka === KURS_DASAR;
  return true;
}

export function kursDipakai(kode, kurs) {
  if (mataUangDasar(kode)) return KURS_DASAR;
  const angka = Number(kurs);
  return Number.isFinite(angka) && angka > 0 ? angka : KURS_DASAR;
}

export function keIDR(nominal, kurs, kode) {
  const n = Number(nominal) || 0;
  return n * kursDipakai(kode, kurs);
}

export function jumlahIDR(daftar, ambilNominal) {
  return (daftar || []).reduce(
    (total, d) => total + keIDR(ambilNominal(d), d?.exchangeRate, d?.currency),
    0
  );
}

/* ── Pembantu tampilan ──────────────────────────────────────────────────────
 *
 * Sebelum ini ada 22 salinan formatRupiah yang tersebar di halaman-halaman,
 * tidak satu pun menerima parameter mata uang, dan semuanya membuang karakter
 * non-digit — sehingga "$12,500.50" rusak jadi 1250050. Di sini desimalnya
 * mengikuti mata uangnya.
 */

/** Angka saja, dengan pemisah ribuan dan desimal sesuai mata uangnya. */
export function angkaUang(nominal, kode) {
  const desimal = desimalMataUang(kode);
  return Number(nominal || 0).toLocaleString('id-ID', {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  });
}

/** Nominal lengkap dengan simbol mata uangnya, mis. "$ 12.500,50". */
export function formatUang(nominal, kode) {
  return `${currencySymbol(kode || MATA_UANG_DASAR)} ${angkaUang(nominal, kode)}`;
}

/** Selalu dalam rupiah — dipakai laporan keuangan yang memang berbasis IDR. */
export function formatIDR(nominal) {
  return `Rp ${angkaUang(nominal, MATA_UANG_DASAR)}`;
}

/**
 * Baris kecil "≈ Rp 202.500.000" di bawah nominal aslinya.
 * Mengembalikan null untuk dokumen rupiah, supaya alur IDR yang selama ini
 * dipakai tidak mendapat baris tambahan yang mubazir.
 */
export function setaraIDR(nominal, kurs, kode) {
  if (mataUangDasar(kode)) return null;
  return `≈ ${formatIDR(keIDR(nominal, kurs, kode))}`;
}

/**
 * Keterangan kurs, mis. "1 USD = Rp 16.200".
 * Null untuk dokumen rupiah.
 */
export function keteranganKurs(kode, kurs) {
  if (mataUangDasar(kode)) return null;
  return `1 ${String(kode).toUpperCase()} = ${formatIDR(kursDipakai(kode, kurs))}`;
}

/**
 * Membersihkan ketikan pengguna jadi angka yang bisa dihitung.
 *
 * Untuk mata uang tanpa desimal, semua non-digit dibuang — perilaku lama tetap
 * sama. Untuk mata uang berdesimal, satu koma atau titik desimal dipertahankan,
 * sehingga 12.500,50 dan 12500.50 sama-sama terbaca benar.
 */
export function bacaAngka(teks, kode) {
  const mentah = String(teks ?? '');
  if (desimalMataUang(kode) === 0) {
    const digit = mentah.replace(/[^0-9]/g, '');
    return digit ? Number(digit) : 0;
  }
  // Pemisah desimal = tanda baca TERAKHIR yang muncul; sisanya pemisah ribuan.
  const posisi = Math.max(mentah.lastIndexOf(','), mentah.lastIndexOf('.'));
  if (posisi === -1) {
    const digit = mentah.replace(/[^0-9]/g, '');
    return digit ? Number(digit) : 0;
  }
  const bulat = mentah.slice(0, posisi).replace(/[^0-9]/g, '');
  const pecahan = mentah.slice(posisi + 1).replace(/[^0-9]/g, '').slice(0, 2);
  const gabung = `${bulat || '0'}.${pecahan || '0'}`;
  const angka = Number(gabung);
  return Number.isFinite(angka) ? angka : 0;
}
