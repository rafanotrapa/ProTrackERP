const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierQuotation', required: true },
  projectId: { type: String, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, 
  shippingAddress: { type: String, required: true }, 
  items: [{ 
    itemName: String,
    quantity: Number,
    unit: String,
    cogs: Number
  }],
  totalAmount: { type: Number, default: 0 },
  
  paymentStatus: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' }, 
  qcStatus: { type: String, enum: ['Waiting Delivery', 'Passed', 'Returned'], default: 'Waiting Delivery' }, 
  qcRemarks: { type: String }, 
  
  // --- NEW: LOGISTICS / DELIVERY FIELDS ---
  deliveryStatus: { type: String, enum: ['Pending', 'Scheduled', 'In Transit', 'Delivered'], default: 'Pending' },
  deliveryDate: { type: Date },
  courierName: { type: String },
  trackingNumber: { type: String },

  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'purchase_orders' 
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);