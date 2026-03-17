const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createApp } = require('../src/app');
const SavingsGoal = require('../src/models/SavingsGoal');

const originalFind = SavingsGoal.find;
const originalFindOne = SavingsGoal.findOne;
const originalCreate = SavingsGoal.create;
const originalFindOneAndUpdate = SavingsGoal.findOneAndUpdate;
const originalFindOneAndDelete = SavingsGoal.findOneAndDelete;

const TEST_USER_ID = '507f1f77bcf86cd799439041';

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
  SavingsGoal.find = originalFind;
  SavingsGoal.findOne = originalFindOne;
  SavingsGoal.create = originalCreate;
  SavingsGoal.findOneAndUpdate = originalFindOneAndUpdate;
  SavingsGoal.findOneAndDelete = originalFindOneAndDelete;
});

test('GET /api/savings returns savings goals list', async () => {
  const mockItems = [
    { _id: 's1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 1500 },
  ];

  SavingsGoal.find = () => ({
    sort: async () => mockItems,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(body), true);
    assert.equal(body.length, 1);
    assert.equal(body[0].name, 'Emergency Fund');
  } finally {
    await close();
  }
});

test('POST /api/savings creates a savings goal', async () => {
  SavingsGoal.create = async (payload) => ({
    _id: 's1',
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 1500,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.name, 'Emergency Fund');
    assert.equal(body.targetAmount, 10000);
    assert.equal(body.userId, TEST_USER_ID);
  } finally {
    await close();
  }
});

test('GET /api/savings/:id returns 404 when goal does not exist', async () => {
  SavingsGoal.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings/missing-id`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, 'Savings goal not found');
  } finally {
    await close();
  }
});

test('PUT /api/savings/:id updates a savings goal', async () => {
  SavingsGoal.findOneAndUpdate = async (_query, payload) => ({
    _id: 's1',
    ...payload,
    userId: TEST_USER_ID,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings/s1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Emergency Fund Updated',
        targetAmount: 12000,
        currentAmount: 2500,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.name, 'Emergency Fund Updated');
    assert.equal(body.targetAmount, 12000);
  } finally {
    await close();
  }
});

test('PUT /api/savings/:id supports partial update', async () => {
  SavingsGoal.findOneAndUpdate = async (_query, payload) => ({
    _id: 's1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 1500,
    userId: TEST_USER_ID,
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings/s1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        currentAmount: 3000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.currentAmount, 3000);
  } finally {
    await close();
  }
});

test('PATCH /api/savings/:id supports partial update', async () => {
  SavingsGoal.findOneAndUpdate = async (_query, payload) => ({
    _id: 's1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 1500,
    userId: TEST_USER_ID,
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings/s1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        currentAmount: 3300,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.currentAmount, 3300);
  } finally {
    await close();
  }
});

test('PUT /api/savings/:id rejects empty update payload', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings/s1`, {
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

test('POST /api/savings rejects invalid targetDate', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Maison',
        targetAmount: 5000000,
        targetDate: 'bad-date',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'targetDate must be a valid date');
  } finally {
    await close();
  }
});

test('DELETE /api/savings/:id deletes a savings goal', async () => {
  SavingsGoal.findOneAndDelete = async () => ({ _id: 's1' });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/savings/s1`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Savings goal deleted');
  } finally {
    await close();
  }
});
