const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createApp } = require('../src/app');
const Account = require('../src/models/Account');

const originalFind = Account.find;
const originalFindOne = Account.findOne;
const originalCreate = Account.create;
const originalFindOneAndDelete = Account.findOneAndDelete;

const TEST_USER_ID = '507f1f77bcf86cd799439031';

const startTestServer = async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return {
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    baseUrl: `http://127.0.0.1:${port}`,
  };
};

const authHeaders = () => {
  const token = jwt.sign({ userId: TEST_USER_ID }, process.env.JWT_SECRET);
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
};

test.beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
});

test.afterEach(() => {
  Account.find = originalFind;
  Account.findOne = originalFindOne;
  Account.create = originalCreate;
  Account.findOneAndDelete = originalFindOneAndDelete;
});

test('GET /api/accounts returns accounts list', async () => {
  const mockItems = [{ _id: 'a1', name: 'Banque principale', type: 'bank', currentBalance: 250000, currency: 'XOF' }];

  Account.find = () => ({
    sort: async () => mockItems,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts`, { headers: authHeaders() });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].name, 'Banque principale');
  } finally {
    await close();
  }
});

test('GET /api/accounts/summary/totals returns active account totals', async () => {
  Account.find = async () => [
    { _id: 'a1', currentBalance: 100000 },
    { _id: 'a2', currentBalance: 50000 },
  ];

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts/summary/totals`, { headers: authHeaders() });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.totalBalance, 150000);
    assert.equal(body.accountsCount, 2);
  } finally {
    await close();
  }
});

test('POST /api/accounts creates an account and mirrors opening balance', async () => {
  Account.create = async (payload) => ({ _id: 'a1', ...payload });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Orange Money',
        type: 'mobile_money',
        openingBalance: 80000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.name, 'Orange Money');
    assert.equal(body.currentBalance, 80000);
    assert.equal(body.currency, undefined);
  } finally {
    await close();
  }
});

test('POST /api/accounts rejects invalid type', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Compte test',
        type: 'crypto_wallet',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'type must be cash, bank, mobile_money or other');
  } finally {
    await close();
  }
});

test('PATCH /api/accounts/:id updates account name and active status', async () => {
  let saved = false;
  Account.findOne = async () => ({
    _id: 'a1',
    userId: TEST_USER_ID,
    name: 'Banque',
    type: 'bank',
    currency: 'XOF',
    openingBalance: 10000,
    currentBalance: 12000,
    isActive: true,
    save: async function save() {
      saved = true;
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts/a1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Banque salaire',
        isActive: false,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(saved, true);
    assert.equal(body.name, 'Banque salaire');
    assert.equal(body.isActive, false);
  } finally {
    await close();
  }
});

test('PATCH /api/accounts/:id rejects opening balance update that makes current balance negative', async () => {
  Account.findOne = async () => ({
    _id: 'a1',
    userId: TEST_USER_ID,
    name: 'Cash',
    type: 'cash',
    openingBalance: 40000,
    currentBalance: 10000,
    isActive: true,
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts/a1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        openingBalance: 0,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Invalid openingBalance update: resulting currentBalance would be negative');
  } finally {
    await close();
  }
});

test('POST /api/accounts/:id/adjust records movement and new balance', async () => {
  let saved = false;
  Account.findOne = async () => ({
    _id: 'a1',
    userId: TEST_USER_ID,
    currentBalance: 50000,
    movements: [],
    save: async function save() {
      saved = true;
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts/a1/adjust`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: -15000,
        note: 'Retrait test',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(saved, true);
    assert.equal(body.currentBalance, 35000);
    assert.equal(body.movements.length, 1);
    assert.equal(body.movements[0].note, 'Retrait test');
  } finally {
    await close();
  }
});

test('POST /api/accounts/:id/adjust rejects insufficient balance', async () => {
  Account.findOne = async () => ({
    _id: 'a1',
    userId: TEST_USER_ID,
    currentBalance: 5000,
    movements: [],
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts/a1/adjust`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: -6000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Insufficient balance for this adjustment');
  } finally {
    await close();
  }
});

test('DELETE /api/accounts/:id deletes an account', async () => {
  Account.findOneAndDelete = async () => ({ _id: 'a1' });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/accounts/a1`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Account deleted');
  } finally {
    await close();
  }
});
