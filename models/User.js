const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Nanti bakal kita acak (hash)
  role: { 
    type: String, 
    enum: ['Marketing', 'Procurement', 'Finance', 'Owner', 'Management', 'Admin'], 
    default: 'Marketing' 
  },
  resetPasswordToken: String, // Buat fitur recovery
  resetPasswordExpire: Date,   // Buat fitur recovery (token hangus dlm 10 mnt)
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);