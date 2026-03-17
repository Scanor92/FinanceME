const express = require('express');

const Debt = require('../models/Debt');
const authMiddleware = require('../middleware/auth.middleware');
const { isNonEmptyString, toNonNegativeNumber, pickAllowedFields } = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);

const buildDebtPayload = (body) => {
  const allowed = pickAllowedFields(body, ['personName', 'type', 'principalAmount', 'dueDate', 'note', 'status']);

  if (Object.prototype.hasOwnProperty.call(allowed, 'personName')) {
    allowed.personName = String(allowed.personName).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'type')) {
    allowed.type = String(allowed.type).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'principalAmount')) {
    allowed.principalAmount = toNonNegativeNumber(allowed.principalAmount);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'status')) {
    allowed.status = String(allowed.status).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'note') && allowed.note !== undefined) {
    allowed.note = String(allowed.note).trim();
  }

  return allowed;
};

const validateDebtPayload = (payload, { partial = false } = {}) => {
  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'personName')) {
    if (!isNonEmptyString(payload.personName)) {
      return 'personName is required';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'type')) {
    if (!['payable', 'receivable'].includes(payload.type)) {
      return 'type must be payable or receivable';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'principalAmount')) {
    if (toNonNegativeNumber(payload.principalAmount) === null) {
      return 'principalAmount must be a number greater than or equal to 0';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status') && !['open', 'paid'].includes(payload.status)) {
    return 'status must be open or paid';
  }

  return null;
};

router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = { userId: req.userId };

    if (type) {
      if (!['payable', 'receivable'].includes(type)) {
        return res.status(400).json({ message: 'type must be payable or receivable' });
      }
      query.type = type;
    }

    if (status) {
      if (!['open', 'paid'].includes(status)) {
        return res.status(400).json({ message: 'status must be open or paid' });
      }
      query.status = status;
    }

    const debts = await Debt.find(query).sort({ createdAt: -1 });
    return res.status(200).json(debts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch debts', error: error.message });
  }
});

router.get('/summary/totals', async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.userId });
    const summary = debts.reduce(
      (acc, debt) => {
        if (debt.status === 'open') {
          if (debt.type === 'payable') {
            acc.iOwe += debt.remainingAmount;
          } else {
            acc.owedToMe += debt.remainingAmount;
          }
        }
        return acc;
      },
      { iOwe: 0, owedToMe: 0 }
    );

    return res.status(200).json({
      ...summary,
      net: summary.owedToMe - summary.iOwe,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch debt summary', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    return res.status(200).json(debt);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch debt', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildDebtPayload(req.body);
    const validationError = validateDebtPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const debt = await Debt.create({
      ...payload,
      userId: req.userId,
      remainingAmount: payload.principalAmount,
      status: payload.principalAmount === 0 ? 'paid' : 'open',
    });

    return res.status(201).json(debt);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create debt', error: error.message });
  }
});

const updateDebt = async (req, res) => {
  try {
    const payload = buildDebtPayload(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }

    const validationError = validateDebtPayload(payload, { partial: true });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'principalAmount')) {
      const alreadyPaid = debt.principalAmount - debt.remainingAmount;
      if (payload.principalAmount < alreadyPaid) {
        return res.status(400).json({ message: 'principalAmount cannot be lower than amount already paid' });
      }
      debt.principalAmount = payload.principalAmount;
      debt.remainingAmount = payload.principalAmount - alreadyPaid;
      debt.status = debt.remainingAmount === 0 ? 'paid' : 'open';
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'personName')) debt.personName = payload.personName;
    if (Object.prototype.hasOwnProperty.call(payload, 'type')) debt.type = payload.type;
    if (Object.prototype.hasOwnProperty.call(payload, 'dueDate')) debt.dueDate = payload.dueDate;
    if (Object.prototype.hasOwnProperty.call(payload, 'note')) debt.note = payload.note;
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) debt.status = payload.status;

    await debt.save();
    return res.status(200).json(debt);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update debt', error: error.message });
  }
};

router.put('/:id', updateDebt);
router.patch('/:id', updateDebt);

router.post('/:id/payments', async (req, res) => {
  try {
    const amount = toNonNegativeNumber(req.body.amount);
    const note = req.body.note ? String(req.body.note).trim() : undefined;
    const date = req.body.date ? new Date(req.body.date) : new Date();

    if (amount === null || amount <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'date must be valid' });
    }

    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    if (debt.remainingAmount === 0) {
      return res.status(400).json({ message: 'Debt is already fully paid' });
    }

    if (amount > debt.remainingAmount) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining amount' });
    }

    debt.payments.push({ amount, note, date });
    debt.remainingAmount -= amount;
    debt.status = debt.remainingAmount === 0 ? 'paid' : 'open';

    await debt.save();
    return res.status(200).json(debt);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to register payment', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    return res.status(200).json({ message: 'Debt deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete debt', error: error.message });
  }
});

module.exports = router;
