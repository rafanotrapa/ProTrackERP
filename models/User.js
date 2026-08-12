const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'Marketing', 'Procurement', 'Finance', 'Owner', 'Management',
      // Dulu bernama 'Admin'. Diganti agar perannya jelas: mengelola user dan
      // log aktivitas, bukan "admin" dalam arti serba bisa.
      'Administrator',
      // Dua peran lihat-saja. Keduanya tidak boleh menulis apa pun; penegakannya
      // terpusat di middleware/auth.js, bukan disebar ke tiap rute.
      'Super Admin',
      'Viewer',
    ],
    default: 'Marketing'
  },

  // Modul yang boleh dilihat pemegang peran Viewer. Nilainya memakai nama modul
  // dari MODULE_MAP di middleware/auth.js supaya tidak ada daftar modul kedua
  // yang bisa berbeda diam-diam. Super Admin mengabaikan field ini — aksesnya
  // mencakup seluruh modul.
  viewModules: { type: [String], default: [] },
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date },
  lastLoginAttempt: { type: Date },

  // Penanda untuk mencabut token yang sudah terbit.
  //
  // protect hanya memverifikasi tanda tangan JWT dan tidak pernah membaca ulang
  // data user, sehingga selama token belum kedaluwarsa: menghapus user, mengubah
  // perannya, atau mereset passwordnya tidak berpengaruh apa pun. Token lama
  // tetap sah dengan peran lamanya.
  //
  // Angka ini ikut dimasukkan ke payload token. Menaikkannya membuat semua token
  // lama milik user tersebut langsung ditolak.
  tokenVersion: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now }
});

// Super Admin hanya boleh ada satu. Pemeriksaan di controller saja bisa dilewati
// dua permintaan yang datang bersamaan — keduanya membaca "belum ada" sebelum
// salah satunya sempat menyimpan. Indeks parsial ini yang benar-benar menahan;
// pola yang sama dipakai untuk invoice termin ganda di models/CreateInvoice.js.
UserSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'Super Admin' } }
);

module.exports = mongoose.model('User', UserSchema);