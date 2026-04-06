const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  unit: { type: String, default: 'Pcs' }, // Pcs, Box, Lot, Meter
  specifications: String,
  category: String,
  vendorName: String, // Nanti bisa dikembangin pake ObjectId vendor
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: 'item' // Konsisten tanpa "s" sesuai request lo
});

module.exports = mongoose.model('Item', ItemSchema);