const mongoose = require('mongoose');

// Hanya menyimpan "terpakai" per item. Jumlah awal (initialQty) TIDAK
// disimpan di sini — selalu dihitung ulang dari total item di semua
// Purchase Order (lihat inventoryController), supaya idempoten & selalu
// sinkron dengan PO. Sisa = initialQty - usedQty.
const InventoryUsageSchema = new mongoose.Schema({
  itemName:      { type: String, required: true, unique: true, trim: true },
  usedQty:       { type: Number, default: 0 },
  updatedByName: { type: String },
}, {
  timestamps: true,
  collection: 'inventory_usage',
});

module.exports = mongoose.model('InventoryUsage', InventoryUsageSchema);
