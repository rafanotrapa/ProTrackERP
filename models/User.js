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
  
  // 🆕 Fitur Blokir Akun
  loginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date },
  lastLoginAttempt: { type: Date },
  
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);