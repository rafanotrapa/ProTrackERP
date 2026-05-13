const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CreateInvoice', 
    required: true 
  },
  amountPaid: { 
    type: Number, 
    required: true 
  },
  evidencePath: { 
    type: String, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    required: true 
  },
  remarks: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'], 
    default: 'Pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);