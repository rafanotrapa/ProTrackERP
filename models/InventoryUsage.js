const mongoose = require('mongoose');

const InventoryUsageSchema = new mongoose.Schema({
  itemName:      { type: String, required: true, unique: true, trim: true },
  usedQty:       { type: Number, default: 0 },
  updatedByName: { type: String },
}, {
  timestamps: true,
  collection: 'inventory_usage',
});

module.exports = mongoose.model('InventoryUsage', InventoryUsageSchema);
