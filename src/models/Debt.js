const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const debtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['payable', 'receivable'],
      required: true,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'paid'],
      default: 'open',
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Debt', debtSchema);
