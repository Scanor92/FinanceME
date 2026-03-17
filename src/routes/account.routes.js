const express = require('express');

const Account = require('../models/Account');
const authMiddleware = require('../middleware/auth.middleware');
const { isNonEmptyString, toNonNegativeNumber, pickAllowedFields } = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);

const buildAccountPayload = (body) => {
  const allowed = pickAllowedFields(body, ['name', 'type', 'currency', 'openingBalance', 'isActive']);

  if (Object.prototype.hasOwnProperty.call(allowed, 'name')) {
    allowed.name = String(allowed.name).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'type')) {
    allowed.type = String(allowed.type).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'currency')) {
    allowed.currency = String(allowed.currency).trim().toUpperCase();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'openingBalance')) {
    allowed.openingBalance = toNonNegativeNumber(allowed.openingBalance);
  }

  return allowed;
};

const validateAccountPayload = (payload, { partial = false } = {}) => {
  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'name')) {
    if (!isNonEmptyString(payload.name)) {
      return 'name is required';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'type') && !['cash', 'bank', 'mobile_money', 'other'].includes(payload.type)) {
    return 'type must be cash, bank, mobile_money or other';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'openingBalance') && toNonNegativeNumber(payload.openingBalance) === null) {
    return 'openingBalance must be a number greater than or equal to 0';
  }

  return null;
};

router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json(accounts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch accounts', error: error.message });
  }
});

router.get('/summary/totals', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId, isActive: true });
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0);

    return res.status(200).json({
      totalBalance,
      accountsCount: accounts.length,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch account summary', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    return res.status(200).json(account);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch account', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildAccountPayload(req.body);
    const validationError = validateAccountPayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const openingBalance = payload.openingBalance ?? 0;
    const account = await Account.create({
      ...payload,
      userId: req.userId,
      openingBalance,
      currentBalance: openingBalance,
    });

    return res.status(201).json(account);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create account', error: error.message });
  }
});

const updateAccount = async (req, res) => {
  try {
    const payload = buildAccountPayload(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }

    const validationError = validateAccountPayload(payload, { partial: true });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const account = await Account.findOne({ _id: req.params.id, userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'openingBalance')) {
      const delta = payload.openingBalance - account.openingBalance;
      const nextCurrentBalance = account.currentBalance + delta;
      if (nextCurrentBalance < 0) {
        return res.status(400).json({ message: 'Invalid openingBalance update: resulting currentBalance would be negative' });
      }
      account.openingBalance = payload.openingBalance;
      account.currentBalance = nextCurrentBalance;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'name')) account.name = payload.name;
    if (Object.prototype.hasOwnProperty.call(payload, 'type')) account.type = payload.type;
    if (Object.prototype.hasOwnProperty.call(payload, 'currency')) account.currency = payload.currency;
    if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) account.isActive = Boolean(payload.isActive);

    await account.save();
    return res.status(200).json(account);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update account', error: error.message });
  }
};

router.put('/:id', updateAccount);
router.patch('/:id', updateAccount);

router.post('/:id/adjust', async (req, res) => {
  try {
    const amount = typeof req.body.amount === 'string' ? Number(req.body.amount) : req.body.amount;
    const note = req.body.note ? String(req.body.note).trim() : undefined;

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount === 0) {
      return res.status(400).json({ message: 'amount must be a non-zero number' });
    }

    const account = await Account.findOne({ _id: req.params.id, userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const nextBalance = account.currentBalance + amount;
    if (nextBalance < 0) {
      return res.status(400).json({ message: 'Insufficient balance for this adjustment' });
    }

    account.currentBalance = nextBalance;
    account.movements.push({ amount, note });
    await account.save();

    return res.status(200).json(account);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to adjust account balance', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete account', error: error.message });
  }
});

module.exports = router;
