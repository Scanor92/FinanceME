const express = require('express');

const SavingsGoal = require('../models/SavingsGoal');
const authMiddleware = require('../middleware/auth.middleware');
const {
  isNonEmptyString,
  toNonNegativeNumber,
  pickAllowedFields,
} = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);

const validateSavingsPayload = (payload, { partial = false } = {}) => {
  const { name, targetAmount, currentAmount, targetDate } = payload;

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'name')) {
    if (!isNonEmptyString(name)) {
      return 'name is required';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'targetAmount')) {
    if (toNonNegativeNumber(targetAmount) === null) {
      return 'targetAmount must be a number greater than or equal to 0';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'currentAmount') && toNonNegativeNumber(currentAmount) === null) {
    return 'currentAmount must be a number greater than or equal to 0';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'targetDate') && targetDate) {
    const parsedDate = new Date(targetDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'targetDate must be a valid date';
    }
  }

  return null;
};

const buildSavingsPayload = (body) => {
  const allowed = pickAllowedFields(body, ['name', 'targetAmount', 'currentAmount', 'targetDate']);

  if (Object.prototype.hasOwnProperty.call(allowed, 'name')) {
    allowed.name = String(allowed.name).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'targetAmount')) {
    allowed.targetAmount = toNonNegativeNumber(allowed.targetAmount);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'currentAmount')) {
    allowed.currentAmount = toNonNegativeNumber(allowed.currentAmount);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'targetDate')) {
    allowed.targetDate = allowed.targetDate ? new Date(allowed.targetDate) : null;
  }

  return allowed;
};

router.get('/', async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json(savingsGoals);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch savings goals', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    return res.status(200).json(savingsGoal);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch savings goal', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildSavingsPayload(req.body);
    const validationError = validateSavingsPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const savingsGoal = await SavingsGoal.create({
      ...payload,
      userId: req.userId,
    });

    return res.status(201).json(savingsGoal);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create savings goal', error: error.message });
  }
});

const updateSavingsGoal = async (req, res) => {
  try {
    const payload = buildSavingsPayload(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }
    const validationError = validateSavingsPayload(payload, { partial: true });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      payload,
      { new: true, runValidators: true }
    );

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    return res.status(200).json(savingsGoal);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update savings goal', error: error.message });
  }
};

router.put('/:id', updateSavingsGoal);
router.patch('/:id', updateSavingsGoal);

router.delete('/:id', async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    return res.status(200).json({ message: 'Savings goal deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete savings goal', error: error.message });
  }
});

module.exports = router;
