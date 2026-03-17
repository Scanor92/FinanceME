const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());

const toNonNegativeNumber = (value) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const pickAllowedFields = (source, allowedFields) =>
  allowedFields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      acc[key] = source[key];
    }
    return acc;
  }, {});

module.exports = {
  isNonEmptyString,
  isValidEmail,
  toNonNegativeNumber,
  pickAllowedFields,
};
