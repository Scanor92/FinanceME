const express = require('express');

const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/auth.middleware');
const {
  isNonEmptyString,
  toNonNegativeNumber,
  pickAllowedFields,
} = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);
const allowedPeriods = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];
const allowedAdjustmentDirections = ['increase', 'decrease'];

const validateBudgetPayload = (payload, { partial = false } = {}) => {
  const { name, amount, category, period } = payload;

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'name')) {
    if (!isNonEmptyString(name)) {
      return 'name is required';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'category')) {
    if (!isNonEmptyString(category)) {
      return 'category is required';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'amount')) {
    if (toNonNegativeNumber(amount) === null) {
      return 'amount must be a number greater than or equal to 0';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'period') && period && !allowedPeriods.includes(period)) {
    return 'period must be weekly, monthly, quarterly, semiannual or annual';
  }

  return null;
};

const buildBudgetPayload = (body) => {
  const allowed = pickAllowedFields(body, ['name', 'amount', 'spent', 'category', 'period']);

  if (Object.prototype.hasOwnProperty.call(allowed, 'name')) {
    allowed.name = String(allowed.name).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'category')) {
    allowed.category = String(allowed.category).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'period')) {
    allowed.period = String(allowed.period).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'amount')) {
    allowed.amount = toNonNegativeNumber(allowed.amount);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'spent')) {
    allowed.spent = toNonNegativeNumber(allowed.spent);
  }

  return allowed;
};

router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json(budgets);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch budgets', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    return res.status(200).json(budget);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch budget', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildBudgetPayload(req.body);
    const validationError = validateBudgetPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const budget = await Budget.create({
      ...payload,
      userId: req.userId,
    });

    return res.status(201).json(budget);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create budget', error: error.message });
  }
});

const updateBudget = async (req, res) => {
  try {
    const payload = buildBudgetPayload(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }
    const validationError = validateBudgetPayload(payload, { partial: true });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      payload,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    return res.status(200).json(budget);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update budget', error: error.message });
  }
};

router.put('/:id', updateBudget);
router.patch('/:id', updateBudget);

router.post('/:id/adjustments', async (req, res) => {
  try {
    const amount = toNonNegativeNumber(req.body?.amount);
    const direction = String(req.body?.direction || '').trim();

    if (amount === null || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a number greater than 0' });
    }

    if (!allowedAdjustmentDirections.includes(direction)) {
      return res.status(400).json({ message: 'direction must be increase or decrease' });
    }

    const budget = await Budget.findOne({ _id: req.params.id, userId: req.userId });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const previousAmount = Number(budget.amount || 0);
    const signedAmount = direction === 'decrease' ? -amount : amount;
    const nextAmount = previousAmount + signedAmount;

    if (nextAmount < 0) {
      return res.status(400).json({ message: 'Budget amount cannot be negative' });
    }

    budget.amount = nextAmount;
    budget.adjustments.unshift({
      amount,
      direction,
      previousAmount,
      nextAmount,
      date: new Date(),
    });

    await budget.save();
    return res.status(200).json(budget);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to adjust budget', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    return res.status(200).json({ message: 'Budget deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete budget', error: error.message });
  }
});

module.exports = router;
