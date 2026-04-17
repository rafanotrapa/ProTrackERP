const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: true 
  }, 
  action: { 
    type: String, 
    required: true 
  }, // Contoh: "Created Invoice #INV-001" atau "Deleted User John"
  category: { 
    type: String, 
    required: true,
    enum: ['ACCOUNT', 'MARKETING', 'PROCUREMENT', 'FINANCE', 'PROJECT'] 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'SECURITY', 'APPROVE'] 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Kunci ke koleksi 'logs'
module.exports = mongoose.model('Log', logSchema, 'logs');