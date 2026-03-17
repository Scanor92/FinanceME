const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    averageBuyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    assetType: {
      type: String,
      enum: ['livestock', 'land', 'real_estate', 'agriculture', 'trade', 'cooperative', 'fixed_deposit', 'gold', 'crypto', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'sold', 'pending'],
      default: 'active',
    },
    currency: {
      type: String,
      enum: ['XOF', 'USD', 'EUR'],
      default: 'XOF',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    area: {
      type: Number,
      min: 0,
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    estimatedCurrentValue: {
      type: Number,
      min: 0,
      default: null,
    },
    expectedAnnualReturnRate: {
      type: Number,
      min: 0,
      default: null,
    },
    maturityDate: {
      type: Date,
      default: null,
    },
    exitDate: {
      type: Date,
      default: null,
    },
    exitValue: {
      type: Number,
      min: 0,
      default: null,
    },
    institution: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Investment', investmentSchema);
