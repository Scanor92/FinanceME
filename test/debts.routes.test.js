const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createApp } = require('../src/app');
const Debt = require('../src/models/Debt');

const originalFind = Debt.find;
const originalFindOne = Debt.findOne;
const originalCreate = Debt.create;
const originalFindOneAndDelete = Debt.findOneAndDelete;

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
  Debt.find = originalFind;
  Debt.findOne = originalFindOne;
  Debt.create = originalCreate;
  Debt.findOneAndDelete = originalFindOneAndDelete;
});

test('GET /api/debts returns debts list', async () => {
  const mockItems = [{ _id: 'd1', personName: 'Ali', type: 'payable', principalAmount: 50000, remainingAmount: 25000, status: 'open' }];

  Debt.find = () => ({
    sort: async () => mockItems,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts`, { headers: authHeaders() });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].personName, 'Ali');
  } finally {
    await close();
  }
});

test('GET /api/debts/summary/totals returns debt summary', async () => {
  Debt.find = async () => [
    { type: 'payable', remainingAmount: 40000, status: 'open' },
    { type: 'receivable', remainingAmount: 60000, status: 'open' },
    { type: 'payable', remainingAmount: 0, status: 'paid' },
  ];

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts/summary/totals`, { headers: authHeaders() });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.iOwe, 40000);
    assert.equal(body.owedToMe, 60000);
    assert.equal(body.net, 20000);
  } finally {
    await close();
  }
});

test('POST /api/debts creates a debt', async () => {
  Debt.create = async (payload) => ({ _id: 'd1', ...payload });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        personName: 'Moussa',
        type: 'receivable',
        principalAmount: 100000,
        note: 'Pret famille',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.personName, 'Moussa');
    assert.equal(body.remainingAmount, 100000);
    assert.equal(body.status, 'open');
  } finally {
    await close();
  }
});

test('POST /api/debts rejects invalid type', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        personName: 'Test',
        type: 'loan',
        principalAmount: 1000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'type must be payable or receivable');
  } finally {
    await close();
  }
});

test('PATCH /api/debts/:id updates principal and recomputes remaining amount', async () => {
  let saved = false;
  Debt.findOne = async () => ({
    _id: 'd1',
    userId: TEST_USER_ID,
    personName: 'Issa',
    type: 'payable',
    principalAmount: 100000,
    remainingAmount: 40000,
    status: 'open',
    save: async function save() {
      saved = true;
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts/d1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        principalAmount: 120000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(saved, true);
    assert.equal(body.principalAmount, 120000);
    assert.equal(body.remainingAmount, 60000);
  } finally {
    await close();
  }
});

test('PATCH /api/debts/:id rejects principal lower than already paid amount', async () => {
  Debt.findOne = async () => ({
    _id: 'd1',
    userId: TEST_USER_ID,
    personName: 'Issa',
    type: 'payable',
    principalAmount: 100000,
    remainingAmount: 30000,
    status: 'open',
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts/d1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        principalAmount: 60000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'principalAmount cannot be lower than amount already paid');
  } finally {
    await close();
  }
});

test('POST /api/debts/:id/payments registers payment', async () => {
  let saved = false;
  Debt.findOne = async () => ({
    _id: 'd1',
    userId: TEST_USER_ID,
    remainingAmount: 50000,
    status: 'open',
    payments: [],
    save: async function save() {
      saved = true;
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts/d1/payments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 15000,
        note: 'Versement partiel',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(saved, true);
    assert.equal(body.remainingAmount, 35000);
    assert.equal(body.payments.length, 1);
  } finally {
    await close();
  }
});

test('POST /api/debts/:id/payments rejects payment above remaining amount', async () => {
  Debt.findOne = async () => ({
    _id: 'd1',
    userId: TEST_USER_ID,
    remainingAmount: 5000,
    status: 'open',
    payments: [],
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts/d1/payments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 6000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Payment amount exceeds remaining amount');
  } finally {
    await close();
  }
});

test('DELETE /api/debts/:id deletes a debt', async () => {
  Debt.findOneAndDelete = async () => ({ _id: 'd1' });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/debts/d1`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Debt deleted');
  } finally {
    await close();
  }
});
