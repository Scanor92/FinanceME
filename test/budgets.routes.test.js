const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createApp } = require('../src/app');
const Budget = require('../src/models/Budget');

const originalFind = Budget.find;
const originalFindOne = Budget.findOne;
const originalCreate = Budget.create;
const originalFindOneAndUpdate = Budget.findOneAndUpdate;
const originalFindOneAndDelete = Budget.findOneAndDelete;

const TEST_USER_ID = '507f1f77bcf86cd799439021';

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
  Budget.find = originalFind;
  Budget.findOne = originalFindOne;
  Budget.create = originalCreate;
  Budget.findOneAndUpdate = originalFindOneAndUpdate;
  Budget.findOneAndDelete = originalFindOneAndDelete;
});

test('POST /api/budgets/:id/adjustments appends adjustment history', async () => {
  Budget.findOne = async () => ({
    _id: 'b-adjust',
    userId: TEST_USER_ID,
    amount: 300,
    adjustments: [],
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b-adjust/adjustments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 50,
        direction: 'increase',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.amount, 350);
    assert.equal(body.adjustments.length, 1);
    assert.equal(body.adjustments[0].direction, 'increase');
    assert.equal(body.adjustments[0].previousAmount, 300);
    assert.equal(body.adjustments[0].nextAmount, 350);
  } finally {
    await close();
  }
});

test('POST /api/budgets/:id/adjustments rejects negative result', async () => {
  Budget.findOne = async () => ({
    _id: 'b-adjust',
    userId: TEST_USER_ID,
    amount: 20,
    adjustments: [],
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b-adjust/adjustments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 50,
        direction: 'decrease',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Budget amount cannot be negative');
  } finally {
    await close();
  }
});

test('GET /api/budgets returns budgets list', async () => {
  const mockItems = [
    { _id: 'b1', name: 'Food', amount: 300, spent: 120, category: 'Essentials', period: 'monthly' },
  ];

  Budget.find = () => ({
    sort: async () => mockItems,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(body), true);
    assert.equal(body.length, 1);
    assert.equal(body[0].name, 'Food');
  } finally {
    await close();
  }
});

test('POST /api/budgets creates a budget', async () => {
  Budget.create = async (payload) => ({
    _id: 'b1',
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Food',
        amount: 300,
        spent: 100,
        category: 'Essentials',
        period: 'monthly',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.name, 'Food');
    assert.equal(body.amount, 300);
    assert.equal(body.userId, TEST_USER_ID);
  } finally {
    await close();
  }
});

test('POST /api/budgets accepts quarterly period', async () => {
  Budget.create = async (payload) => ({
    _id: 'b2',
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Charges fixes',
        amount: 900,
        category: 'Factures',
        period: 'quarterly',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.period, 'quarterly');
  } finally {
    await close();
  }
});

test('POST /api/budgets rejects unsupported period', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Food',
        amount: 300,
        category: 'Essentials',
        period: 'daily',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'period must be weekly, monthly, quarterly, semiannual or annual');
  } finally {
    await close();
  }
});

test('GET /api/budgets/:id returns 404 when budget does not exist', async () => {
  Budget.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/missing-id`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, 'Budget not found');
  } finally {
    await close();
  }
});

test('PUT /api/budgets/:id updates a budget', async () => {
  Budget.findOneAndUpdate = async (_query, payload) => ({
    _id: 'b1',
    ...payload,
    userId: TEST_USER_ID,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Food Updated',
        amount: 350,
        category: 'Essentials',
        period: 'monthly',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.name, 'Food Updated');
    assert.equal(body.amount, 350);
  } finally {
    await close();
  }
});

test('PUT /api/budgets/:id supports partial update', async () => {
  Budget.findOneAndUpdate = async (_query, payload) => ({
    _id: 'b1',
    name: 'Food',
    amount: 300,
    category: 'Essentials',
    userId: TEST_USER_ID,
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        spent: 200,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.spent, 200);
  } finally {
    await close();
  }
});

test('PATCH /api/budgets/:id supports partial update', async () => {
  Budget.findOneAndUpdate = async (_query, payload) => ({
    _id: 'b1',
    name: 'Food',
    amount: 300,
    category: 'Essentials',
    userId: TEST_USER_ID,
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        spent: 220,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.spent, 220);
  } finally {
    await close();
  }
});

test('PUT /api/budgets/:id rejects empty update payload', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'At least one field is required for update');
  } finally {
    await close();
  }
});

test('DELETE /api/budgets/:id deletes a budget', async () => {
  Budget.findOneAndDelete = async () => ({ _id: 'b1' });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/budgets/b1`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Budget deleted');
  } finally {
    await close();
  }
});
