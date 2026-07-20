const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status:        { type: String, required: true },
  changedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  note:          { type: String },
  timestamp:     { type: Date, default: Date.now },
}, { _id: false });

const ExpenseItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  amount:      { type: Number, required: true },
}, { _id: false });

const ExpenseSubmissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },

  projectId:    { type: String, required: true },
  projectName:  { type: String },

  items: [ExpenseItemSchema],

  amount:       { type: Number, required: true },
  currency:     { type: String, default: 'IDR' },

  file:         { type: String },

  submittedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: { type: String },

  status: {
    type:    String,
    enum:    ['Pending Verification', 'Approved', 'Rejected'],
    default: 'Pending Verification',
  },
  statusHistory: [StatusHistorySchema],

  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedByName:  { type: String },
  reviewDate:      { type: Date },
  rejectionReason: { type: String },

  remarks: { type: String },

}, {
  timestamps: true,
  collection: 'expense_submission',
});

module.exports = mongoose.model('ExpenseSubmission', ExpenseSubmissionSchema);