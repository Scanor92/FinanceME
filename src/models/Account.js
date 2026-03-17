const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const accountSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['cash', 'bank', 'mobile_money', 'other'],
      default: 'other',
    },
    currency: {
      type: String,
      default: 'XOF',
      trim: true,
      uppercase: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    movements: {
      type: [movementSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);
