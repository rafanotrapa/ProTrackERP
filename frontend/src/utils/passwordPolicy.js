/**
 * Cermin dari utils/passwordPolicy.js di backend.
 *
 * Ini HANYA untuk umpan balik di layar. Yang menentukan diterima atau tidak
 * tetap backend, karena API bisa dipanggil tanpa melewati halaman ini.
 * Kalau aturan di backend diubah, file ini harus ikut diubah.
 */

export const PANJANG_MIN = 8;
export const PANJANG_MAX = 72;

const KATA_TERLARANG = [
  'password', 'passw0rd', 'qwerty', 'asdf', 'zxcv',
  '12345678', '123456789', '87654321', '11111111',
  'protrack', 'batavia', 'kreasindo', 'erp',
  'admin', 'administrator', 'superadmin',
  'marketing', 'procurement', 'finance', 'owner', 'management',
  'welcome', 'letmein', 'iloveyou', 'sayang', 'rahasia',
];

/**
 * Daftar syarat beserta status lolos/belum, untuk ditampilkan sebagai checklist.
 */
export const cekSyarat = (password = '', { username = '', email = '' } = {}) => {
  const rendah = password.toLowerCase();
  const namaEmail = String(email).split('@')[0];

  const memuatIdentitas =
    (username.length >= 3 && rendah.includes(username.toLowerCase())) ||
    (namaEmail.length >= 3 && rendah.includes(namaEmail.toLowerCase()));

  return [
    { label: `Minimal ${PANJANG_MIN} karakter`, lolos: password.length >= PANJANG_MIN },
    { label: 'Ada huruf kecil (a-z)', lolos: /[a-z]/.test(password) },
    { label: 'Ada huruf besar (A-Z)', lolos: /[A-Z]/.test(password) },
    { label: 'Ada angka (0-9)', lolos: /[0-9]/.test(password) },
    { label: 'Ada simbol (! @ # $ % ^ & *)', lolos: /[^A-Za-z0-9]/.test(password) },
    {
      label: 'Bukan kata yang mudah ditebak',
      lolos: password.length > 0 && !KATA_TERLARANG.some((k) => rendah.includes(k)),
    },
    {
      label: 'Tidak memuat username atau email',
      lolos: password.length > 0 && !memuatIdentitas,
    },
  ];
};

export const passwordValid = (password, identitas) =>
  password.length <= PANJANG_MAX &&
  password === password.trim() &&
  cekSyarat(password, identitas).every((s) => s.lolos);

/** Teks satu baris untuk placeholder atau tooltip. */
export const RINGKASAN_ATURAN =
  `Min. ${PANJANG_MIN} karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol.`;
