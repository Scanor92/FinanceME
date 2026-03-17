const express = require('express');
const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const authMiddleware = require('../middleware/auth.middleware');
const {
  isNonEmptyString,
  toNonNegativeNumber,
  pickAllowedFields,
} = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);

const validateTransactionPayload = (payload, { partial = false } = {}) => {
  const { title, amount, type, category } = payload;

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'title')) {
    if (!isNonEmptyString(title)) {
      return 'title is required';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'category')) {
    if (!isNonEmptyString(category)) {
      return 'category is required';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'type')) {
    if (!isNonEmptyString(type)) {
      return 'type is required';
    }
    if (!['income', 'expense'].includes(type)) {
      return 'type must be income or expense';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'amount')) {
    if (toNonNegativeNumber(amount) === null) {
      return 'amount must be a number greater than or equal to 0';
    }
  }

  return null;
};

const buildTransactionPayload = (body) => {
  const allowed = pickAllowedFields(body, ['title', 'amount', 'type', 'category', 'date', 'note', 'accountId']);

  if (Object.prototype.hasOwnProperty.call(allowed, 'title')) {
    allowed.title = String(allowed.title).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'category')) {
    allowed.category = String(allowed.category).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'type')) {
    allowed.type = String(allowed.type).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'amount')) {
    allowed.amount = toNonNegativeNumber(allowed.amount);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'note') && allowed.note !== undefined) {
    allowed.note = String(allowed.note).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'accountId')) {
    allowed.accountId = String(allowed.accountId).trim();
  }

  return allowed;
};

const getSignedAmount = ({ type, amount }) => (type === 'income' ? amount : -amount);

const applyBalanceDelta = async ({ userId, accountId, delta }) => {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    return { error: 'Account not found' };
  }

  const nextBalance = account.currentBalance + delta;
  if (nextBalance < 0) {
    return { error: 'Insufficient account balance for this transaction' };
  }

  account.currentBalance = nextBalance;
  account.movements.push({ amount: delta, note: 'Transaction sync' });
  await account.save();

  return { account };
};

router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '10', type, category, startDate, endDate } = req.query;
    const pageNumber = Number.parseInt(page, 10);
    const fetchAll = limit === 'all';
    const limitNumber = fetchAll ? null : Number.parseInt(limit, 10);

    if (Number.isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: 'page must be a positive integer' });
    }

    if (!fetchAll && (Number.isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100)) {
      return res.status(400).json({ message: 'limit must be an integer between 1 and 100, or "all"' });
    }

    const query = { userId: req.userId };

    if (type) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'type must be income or expense' });
      }
      query.type = type;
    }

    if (category) {
      query.category = String(category).trim();
    }

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (Number.isNaN(parsedStartDate.getTime())) {
          return res.status(400).json({ message: 'startDate must be a valid date' });
        }
        query.date.$gte = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (Number.isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({ message: 'endDate must be a valid date' });
        }
        query.date.$lte = parsedEndDate;
      }
    }

    const [transactions, total] = await Promise.all([
      fetchAll
        ? Transaction.find(query).sort({ date: -1 }).populate('accountId', 'name type')
        : Transaction.find(query).sort({ date: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).populate('accountId', 'name type'),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      data: transactions,
      pagination: {
        page: fetchAll ? 1 : pageNumber,
        limit: fetchAll ? 'all' : limitNumber,
        total,
        totalPages: fetchAll ? 1 : Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch transaction', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildTransactionPayload(req.body);

    if (!payload.title && payload.category) {
      payload.title = payload.category;
    }

    const validationError = validateTransactionPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (payload.accountId) {
      if (!mongoose.Types.ObjectId.isValid(payload.accountId)) {
        return res.status(400).json({ message: 'accountId must be valid' });
      }

      const signedAmount = getSignedAmount({ type: payload.type, amount: payload.amount });
      const accountResult = await applyBalanceDelta({
        userId: req.userId,
        accountId: payload.accountId,
        delta: signedAmount,
      });

      if (accountResult.error) {
        return res.status(400).json({ message: accountResult.error });
      }
    }

    const transaction = await Transaction.create({
      ...payload,
      userId: req.userId,
    });

    return res.status(201).json(transaction);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create transaction', error: error.message });
  }
});

const updateTransaction = async (req, res) => {
  try {
    const payload = buildTransactionPayload(req.body);

    if (Object.prototype.hasOwnProperty.call(payload, 'title') && !payload.title && payload.category) {
      payload.title = payload.category;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }
    const validationError = validateTransactionPayload(payload, { partial: true });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'accountId') && !mongoose.Types.ObjectId.isValid(payload.accountId)) {
      return res.status(400).json({ message: 'accountId must be valid' });
    }

    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const nextType = Object.prototype.hasOwnProperty.call(payload, 'type') ? payload.type : transaction.type;
    const nextAmount = Object.prototype.hasOwnProperty.call(payload, 'amount') ? payload.amount : transaction.amount;
    const previousAccountId = transaction.accountId ? String(transaction.accountId) : null;
    const nextAccountId = Object.prototype.hasOwnProperty.call(payload, 'accountId')
      ? payload.accountId || null
      : previousAccountId;

    const previousSignedAmount = getSignedAmount({ type: transaction.type, amount: transaction.amount });
    const nextSignedAmount = getSignedAmount({ type: nextType, amount: nextAmount });

    if (previousAccountId) {
      const revertResult = await applyBalanceDelta({
        userId: req.userId,
        accountId: previousAccountId,
        delta: -previousSignedAmount,
      });

      if (revertResult.error) {
        return res.status(400).json({ message: revertResult.error });
      }
    }

    if (nextAccountId) {
      const applyResult = await applyBalanceDelta({
        userId: req.userId,
        accountId: nextAccountId,
        delta: nextSignedAmount,
      });

      if (applyResult.error) {
        if (previousAccountId) {
          await applyBalanceDelta({
            userId: req.userId,
            accountId: previousAccountId,
            delta: previousSignedAmount,
          });
        }
        return res.status(400).json({ message: applyResult.error });
      }
    }

    Object.assign(transaction, payload);
    await transaction.save();

    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update transaction', error: error.message });
  }
};

router.put('/:id', updateTransaction);
router.patch('/:id', updateTransaction);

router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.accountId) {
      const signedAmount = getSignedAmount({ type: transaction.type, amount: transaction.amount });
      const adjustResult = await applyBalanceDelta({
        userId: req.userId,
        accountId: transaction.accountId,
        delta: -signedAmount,
      });

      if (adjustResult.error) {
        return res.status(400).json({ message: adjustResult.error });
      }
    }

    await Transaction.deleteOne({ _id: transaction._id });

    return res.status(200).json({ message: 'Transaction deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete transaction', error: error.message });
  }
});

module.exports = router;
