/* Kunci terjemahan syarat password, dipetakan berdasarkan URUTAN yang
 * dikembalikan cekSyarat() — bukan berdasarkan teks labelnya.
 *
 * Dipisah ke berkas sendiri karena dipakai dua tempat: PasswordChecklist yang
 * menampilkannya sebagai daftar, dan UserManagement yang merangkai syarat yang
 * belum terpenuhi menjadi satu kalimat di dalam dialog reset password. Sebelum
 * ini UserManagement memakai s.label apa adanya, sehingga kalimatnya selalu
 * berbahasa Indonesia walau toggle di English.
 *
 * Tidak ditaruh di utils/passwordPolicy.js: berkas itu punya kembaran di backend
 * dan diimpor Node polos oleh tests/passwordPolicy.test.js untuk memastikan
 * kedua sisi sepakat, jadi isinya sengaja dijaga tetap murni logika.
 *
 * Kalau urutan atau jumlah syarat di cekSyarat berubah, daftar ini harus ikut
 * berubah. Pengujian 'Daftar aturan yang ditampilkan' menjaga jumlahnya tetap
 * tujuh.
 */
export const KUNCI_SYARAT = [
  'password.minLength',
  'password.lower',
  'password.upper',
  'password.digit',
  'password.symbol',
  'password.notCommon',
  'password.notIdentity',
];
