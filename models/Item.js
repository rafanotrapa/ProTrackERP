const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  unit: { type: String, default: 'Pcs' },
  specifications: String,
  category: String,
  vendorName: String, 
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: 'item' 
});

module.exports = mongoose.model('Item', ItemSchema);