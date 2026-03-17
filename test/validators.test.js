const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isNonEmptyString,
  isValidEmail,
  toNonNegativeNumber,
  pickAllowedFields,
} = require('../src/utils/validators');

test('isNonEmptyString validates trimmed non-empty strings', () => {
  assert.equal(isNonEmptyString('hello'), true);
  assert.equal(isNonEmptyString('  hello  '), true);
  assert.equal(isNonEmptyString('   '), false);
  assert.equal(isNonEmptyString(null), false);
});

test('isValidEmail validates common email formats', () => {
  assert.equal(isValidEmail('user@mail.com'), true);
  assert.equal(isValidEmail(' user@mail.com '), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('foo@bar'), false);
});

test('toNonNegativeNumber parses valid values and rejects invalid ones', () => {
  assert.equal(toNonNegativeNumber(10), 10);
  assert.equal(toNonNegativeNumber('15.5'), 15.5);
  assert.equal(toNonNegativeNumber(0), 0);
  assert.equal(toNonNegativeNumber(-1), null);
  assert.equal(toNonNegativeNumber('abc'), null);
});

test('pickAllowedFields only returns whitelisted keys', () => {
  const source = { title: 'Salary', amount: 1000, userId: 'hack' };
  const picked = pickAllowedFields(source, ['title', 'amount']);
  assert.deepEqual(picked, { title: 'Salary', amount: 1000 });
});
