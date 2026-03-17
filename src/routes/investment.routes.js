const express = require('express');

const Investment = require('../models/Investment');
const authMiddleware = require('../middleware/auth.middleware');
const {
  isNonEmptyString,
  toNonNegativeNumber,
  pickAllowedFields,
} = require('../utils/validators');

const router = express.Router();

router.use(authMiddleware);

const validateInvestmentPayload = (payload, { partial = false } = {}) => {
  const {
    assetName,
    symbol,
    quantity,
    averageBuyPrice,
    assetType,
    status,
    currency,
    location,
    area,
    purchaseDate,
    estimatedCurrentValue,
    expectedAnnualReturnRate,
    maturityDate,
    exitDate,
    exitValue,
    institution,
    notes,
  } = payload;

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'assetName')) {
    if (!isNonEmptyString(assetName)) {
      return 'assetName is required';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'symbol') && symbol && !isNonEmptyString(symbol)) {
    return 'symbol must be a non-empty string';
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'quantity')) {
    if (toNonNegativeNumber(quantity) === null) {
      return 'quantity must be a number greater than or equal to 0';
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'averageBuyPrice')) {
    if (toNonNegativeNumber(averageBuyPrice) === null) {
      return 'averageBuyPrice must be a number greater than or equal to 0';
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'assetType') &&
    assetType &&
    !['livestock', 'land', 'real_estate', 'agriculture', 'trade', 'cooperative', 'fixed_deposit', 'gold', 'crypto', 'other'].includes(assetType)
  ) {
    return 'assetType must be livestock, land, real_estate, agriculture, trade, cooperative, fixed_deposit, gold, crypto or other';
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'status') &&
    status &&
    !['active', 'completed', 'sold', 'pending'].includes(status)
  ) {
    return 'status must be active, completed, sold or pending';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'currency') && currency && !['XOF', 'USD', 'EUR'].includes(currency)) {
    return 'currency must be XOF, USD or EUR';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'location') && location && !isNonEmptyString(location)) {
    return 'location must be a non-empty string';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'institution') && institution && !isNonEmptyString(institution)) {
    return 'institution must be a non-empty string';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'notes') && notes && !isNonEmptyString(notes)) {
    return 'notes must be a non-empty string';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'area') && area !== null && toNonNegativeNumber(area) === null) {
    return 'area must be a number greater than or equal to 0';
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'estimatedCurrentValue') &&
    estimatedCurrentValue !== null &&
    toNonNegativeNumber(estimatedCurrentValue) === null
  ) {
    return 'estimatedCurrentValue must be a number greater than or equal to 0';
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'expectedAnnualReturnRate') &&
    expectedAnnualReturnRate !== null &&
    toNonNegativeNumber(expectedAnnualReturnRate) === null
  ) {
    return 'expectedAnnualReturnRate must be a number greater than or equal to 0';
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'exitValue') &&
    exitValue !== null &&
    toNonNegativeNumber(exitValue) === null
  ) {
    return 'exitValue must be a number greater than or equal to 0';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'purchaseDate') && purchaseDate !== null) {
    const parsedDate = new Date(purchaseDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'purchaseDate must be a valid date';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'maturityDate') && maturityDate !== null) {
    const parsedDate = new Date(maturityDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'maturityDate must be a valid date';
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'exitDate') && exitDate !== null) {
    const parsedDate = new Date(exitDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'exitDate must be a valid date';
    }
  }

  const nextStatus = Object.prototype.hasOwnProperty.call(payload, 'status') ? status : null;
  const requiresExitData = ['sold', 'completed'].includes(nextStatus);
  if (requiresExitData) {
    if (!Object.prototype.hasOwnProperty.call(payload, 'exitDate') || exitDate === null) {
      return 'exitDate is required when status is sold or completed';
    }
    if (!Object.prototype.hasOwnProperty.call(payload, 'exitValue') || exitValue === null) {
      return 'exitValue is required when status is sold or completed';
    }
  }

  return null;
};

const buildInvestmentPayload = (body) => {
  const allowed = pickAllowedFields(body, [
    'assetName',
    'symbol',
    'quantity',
    'averageBuyPrice',
    'assetType',
    'status',
    'currency',
    'location',
    'area',
    'purchaseDate',
    'estimatedCurrentValue',
    'expectedAnnualReturnRate',
    'maturityDate',
    'exitDate',
    'exitValue',
    'institution',
    'notes',
  ]);

  if (Object.prototype.hasOwnProperty.call(allowed, 'assetName')) {
    allowed.assetName = String(allowed.assetName).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'symbol')) {
    allowed.symbol = String(allowed.symbol).trim().toUpperCase();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'assetType')) {
    allowed.assetType = String(allowed.assetType).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'status')) {
    allowed.status = String(allowed.status).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'currency')) {
    allowed.currency = String(allowed.currency).trim().toUpperCase();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'location')) {
    allowed.location = String(allowed.location).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'institution')) {
    allowed.institution = String(allowed.institution).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'notes')) {
    allowed.notes = String(allowed.notes).trim();
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'quantity')) {
    allowed.quantity = toNonNegativeNumber(allowed.quantity);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'averageBuyPrice')) {
    allowed.averageBuyPrice = toNonNegativeNumber(allowed.averageBuyPrice);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'area')) {
    allowed.area = allowed.area === '' || allowed.area === null ? null : Number(allowed.area);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'estimatedCurrentValue')) {
    allowed.estimatedCurrentValue =
      allowed.estimatedCurrentValue === '' || allowed.estimatedCurrentValue === null
        ? null
        : Number(allowed.estimatedCurrentValue);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'expectedAnnualReturnRate')) {
    allowed.expectedAnnualReturnRate =
      allowed.expectedAnnualReturnRate === '' || allowed.expectedAnnualReturnRate === null
        ? null
        : Number(allowed.expectedAnnualReturnRate);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'exitValue')) {
    allowed.exitValue =
      allowed.exitValue === '' || allowed.exitValue === null
        ? null
        : Number(allowed.exitValue);
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'purchaseDate')) {
    allowed.purchaseDate = allowed.purchaseDate ? new Date(allowed.purchaseDate) : null;
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'maturityDate')) {
    allowed.maturityDate = allowed.maturityDate ? new Date(allowed.maturityDate) : null;
  }

  if (Object.prototype.hasOwnProperty.call(allowed, 'exitDate')) {
    allowed.exitDate = allowed.exitDate ? new Date(allowed.exitDate) : null;
  }

  return allowed;
};

router.get('/', async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json(investments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch investments', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    return res.status(200).json(investment);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch investment', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = buildInvestmentPayload(req.body);
    const validationError = validateInvestmentPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const investment = await Investment.create({
      ...payload,
      userId: req.userId,
    });

    return res.status(201).json(investment);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create investment', error: error.message });
  }
});

const updateInvestment = async (req, res) => {
  try {
    const payload = buildInvestmentPayload(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'At least one field is required for update' });
    }
    const validationError = validateInvestmentPayload(payload, { partial: true });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const investment = await Investment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      payload,
      { new: true, runValidators: true }
    );

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    return res.status(200).json(investment);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update investment', error: error.message });
  }
};

router.put('/:id', updateInvestment);
router.patch('/:id', updateInvestment);

router.delete('/:id', async (req, res) => {
  try {
    const investment = await Investment.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    return res.status(200).json({ message: 'Investment deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete investment', error: error.message });
  }
});

module.exports = router;
