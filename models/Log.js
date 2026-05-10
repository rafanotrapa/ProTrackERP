const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: { type: String, required: true }, 
  action: { type: String, required: true }, 
  category: { type: String, default: 'SYSTEM' }, 
  type: { type: String, default: 'INFO' }, 
  
  timestamp: { 
    type: Date, 
    default: Date.now,
    expires: '7d' // <-- PELURU KENDALINYA DI SINI! (Otomatis hapus setelah 7 hari)
  }
});

module.exports = mongoose.model('Log', LogSchema);