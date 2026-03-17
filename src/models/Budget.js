const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    direction: {
      type: String,
      enum: ['increase', 'decrease'],
      required: true,
    },
    previousAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    nextAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'],
      default: 'monthly',
    },
    adjustments: {
      type: [adjustmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);
