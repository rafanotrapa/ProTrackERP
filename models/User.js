const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Marketing', 'Procurement', 'Finance', 'Owner', 'Management', 'Admin'],
    default: 'Marketing'
  },
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

module.exports = mongoose.model('User', UserSchema);