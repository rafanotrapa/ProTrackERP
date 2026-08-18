/**
 * Kebijakan password ProTrack ERP.
 *
 * Dipakai oleh tiga jalur yang bisa menetapkan password:
 *   1. register            - Admin membuat akun karyawan
 *   2. adminResetPassword  - Admin menimpa password akun
 *   3. resetPassword       - User mengganti sendiri lewat tautan email
 *
 * Validasi di frontend hanya untuk kenyamanan; yang mengikat adalah file ini,
 * karena API bisa dipanggil langsung tanpa melewati halaman web.
 */

const PANJANG_MIN = 8;

// bcrypt hanya membaca 72 byte pertama dan MEMBUANG sisanya tanpa peringatan.
// Tanpa batas ini, dua password berbeda yang 72 byte pertamanya sama akan
// dianggap cocok saat login.
const PANJANG_MAX = 72;

// Kata yang terlalu mudah ditebak untuk sistem ini. Dicocokkan sebagai
// substring dan tidak peduli huruf besar/kecil, jadi "ProTrack2026!" ikut
// tertolak.
const KATA_TERLARANG = [
  'password', 'passw0rd', 'qwerty', 'asdf', 'zxcv',
  '12345678', '123456789', '87654321', '11111111',
  'protrack', 'batavia', 'kreasindo', 'erp',
  'admin', 'administrator', 'superadmin',
  'marketing', 'procurement', 'finance', 'owner', 'management',
  'welcome', 'letmein', 'iloveyou', 'sayang', 'rahasia',
];

const ATURAN = [
  `Minimal ${PANJANG_MIN} karakter`,
  'Mengandung huruf kecil (a-z)',
  'Mengandung huruf besar (A-Z)',
  'Mengandung angka (0-9)',
  'Mengandung simbol (contoh: ! @ # $ % ^ & *)',
  'Bukan kata umum atau nama yang berkaitan dengan sistem ini',
  'Tidak memuat username atau alamat email pemilik akun',
];

/**
 * @param {string} password
 * @param {{username?: string, email?: string}} identitas
 * @returns {{valid: boolean, errors: string[]}}
 */
const validatePassword = (password, identitas = {}) => {
  const errors = [];

  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, errors: ['Password wajib diisi.'] };
  }

  if (password.length < PANJANG_MIN) {
    errors.push(`Password minimal ${PANJANG_MIN} karakter.`);
  }

  if (Buffer.byteLength(password, 'utf8') > PANJANG_MAX) {
    errors.push(`Password maksimal ${PANJANG_MAX} karakter.`);
  }

  if (password !== password.trim()) {
    errors.push('Password tidak boleh diawali atau diakhiri spasi.');
  }

  if (!/[a-z]/.test(password)) errors.push('Password harus memuat huruf kecil (a-z).');
  if (!/[A-Z]/.test(password)) errors.push('Password harus memuat huruf besar (A-Z).');
  if (!/[0-9]/.test(password)) errors.push('Password harus memuat angka (0-9).');
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password harus memuat minimal satu simbol (contoh: ! @ # $ % ^ & *).');
  }

  const rendah = password.toLowerCase();

  const terlarang = KATA_TERLARANG.find((kata) => rendah.includes(kata));
  if (terlarang) {
    errors.push(`Password tidak boleh memuat kata yang mudah ditebak: "${terlarang}".`);
  }

  // Password yang memuat identitas pemiliknya adalah tebakan pertama penyerang.
  const { username, email } = identitas;
  if (username && username.length >= 3 && rendah.includes(username.toLowerCase())) {
    errors.push('Password tidak boleh memuat username.');
  }
  if (email) {
    const namaEmail = String(email).split('@')[0];
    if (namaEmail.length >= 3 && rendah.includes(namaEmail.toLowerCase())) {
      errors.push('Password tidak boleh memuat alamat email.');
    }
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validatePassword, ATURAN, PANJANG_MIN, PANJANG_MAX };
