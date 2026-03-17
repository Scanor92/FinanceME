const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createApp } = require('../src/app');
const Investment = require('../src/models/Investment');

const originalFind = Investment.find;
const originalFindOne = Investment.findOne;
const originalCreate = Investment.create;
const originalFindOneAndUpdate = Investment.findOneAndUpdate;
const originalFindOneAndDelete = Investment.findOneAndDelete;

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
  Investment.find = originalFind;
  Investment.findOne = originalFindOne;
  Investment.create = originalCreate;
  Investment.findOneAndUpdate = originalFindOneAndUpdate;
  Investment.findOneAndDelete = originalFindOneAndDelete;
});

test('GET /api/investments returns investments list', async () => {
  const mockItems = [
    { _id: 'i1', assetName: 'Apple', symbol: 'AAPL', quantity: 2, averageBuyPrice: 180, assetType: 'stock' },
  ];

  Investment.find = () => ({
    sort: async () => mockItems,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(body), true);
    assert.equal(body.length, 1);
    assert.equal(body[0].symbol, 'AAPL');
  } finally {
    await close();
  }
});

test('POST /api/investments creates an investment', async () => {
  Investment.create = async (payload) => ({
    _id: 'i1',
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Terrain periurbain',
        quantity: 1,
        averageBuyPrice: 2500000,
        assetType: 'land',
        status: 'active',
        currency: 'xof',
        location: 'Niamey - Kourteye',
        area: 400,
        purchaseDate: '2025-01-15',
        estimatedCurrentValue: 3200000,
        expectedAnnualReturnRate: 12,
        maturityDate: '2026-01-15',
        notes: 'Terrain cloture proche de la route',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.assetName, 'Terrain periurbain');
    assert.equal(body.symbol, undefined);
    assert.equal(body.currency, 'XOF');
    assert.equal(body.location, 'Niamey - Kourteye');
    assert.equal(body.area, 400);
    assert.equal(body.expectedAnnualReturnRate, 12);
    assert.equal(body.status, 'active');
    assert.equal(body.userId, TEST_USER_ID);
  } finally {
    await close();
  }
});

test('POST /api/investments rejects unsupported currency', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Dollar Position',
        quantity: 100,
        averageBuyPrice: 1,
        assetType: 'crypto',
        currency: 'NGN',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'currency must be XOF, USD or EUR');
  } finally {
    await close();
  }
});

test('GET /api/investments/:id returns 404 when investment does not exist', async () => {
  Investment.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments/missing-id`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, 'Investment not found');
  } finally {
    await close();
  }
});

test('PUT /api/investments/:id updates an investment', async () => {
  Investment.findOneAndUpdate = async (_query, payload) => ({
    _id: 'i1',
    ...payload,
    userId: TEST_USER_ID,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments/i1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Bitcoin Updated',
        symbol: 'BTC',
        quantity: 0.3,
        averageBuyPrice: 61000,
        assetType: 'crypto',
        status: 'sold',
        estimatedCurrentValue: 75000,
        expectedAnnualReturnRate: 18,
        exitDate: '2026-03-10',
        exitValue: 79000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.assetName, 'Bitcoin Updated');
    assert.equal(body.quantity, 0.3);
    assert.equal(body.estimatedCurrentValue, 75000);
    assert.equal(body.expectedAnnualReturnRate, 18);
    assert.equal(body.status, 'sold');
    assert.equal(body.exitValue, 79000);
  } finally {
    await close();
  }
});

test('POST /api/investments rejects unsupported status', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Terrain Ayorou',
        quantity: 1,
        averageBuyPrice: 900000,
        assetType: 'land',
        status: 'archived',
        currency: 'XOF',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'status must be active, completed, sold or pending');
  } finally {
    await close();
  }
});

test('POST /api/investments rejects invalid purchaseDate', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Commerce detail',
        quantity: 1,
        averageBuyPrice: 1500000,
        assetType: 'trade',
        currency: 'XOF',
        purchaseDate: 'not-a-date',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'purchaseDate must be a valid date');
  } finally {
    await close();
  }
});

test('POST /api/investments rejects invalid maturityDate', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Depot a terme',
        quantity: 1,
        averageBuyPrice: 1500000,
        assetType: 'fixed_deposit',
        currency: 'XOF',
        maturityDate: 'bad-date',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'maturityDate must be a valid date');
  } finally {
    await close();
  }
});

test('POST /api/investments rejects invalid expectedAnnualReturnRate', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Cooperative agricole',
        quantity: 1,
        averageBuyPrice: 800000,
        assetType: 'cooperative',
        currency: 'XOF',
        expectedAnnualReturnRate: -3,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'expectedAnnualReturnRate must be a number greater than or equal to 0');
  } finally {
    await close();
  }
});

test('POST /api/investments rejects invalid exitDate', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Parcelle revendue',
        quantity: 1,
        averageBuyPrice: 1200000,
        assetType: 'land',
        status: 'sold',
        currency: 'XOF',
        exitDate: 'bad-date',
        exitValue: 1500000,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'exitDate must be a valid date');
  } finally {
    await close();
  }
});

test('POST /api/investments requires exit data for sold status', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        assetName: 'Commerce liquide',
        quantity: 1,
        averageBuyPrice: 600000,
        assetType: 'trade',
        status: 'sold',
        currency: 'XOF',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'exitDate is required when status is sold or completed');
  } finally {
    await close();
  }
});

test('PUT /api/investments/:id supports partial update', async () => {
  Investment.findOneAndUpdate = async (_query, payload) => ({
    _id: 'i1',
    assetName: 'Bitcoin',
    symbol: 'BTC',
    quantity: 0.25,
    averageBuyPrice: 60000,
    userId: TEST_USER_ID,
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments/i1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        quantity: 0.5,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.quantity, 0.5);
  } finally {
    await close();
  }
});

test('PATCH /api/investments/:id supports partial update', async () => {
  Investment.findOneAndUpdate = async (_query, payload) => ({
    _id: 'i1',
    assetName: 'Bitcoin',
    symbol: 'BTC',
    quantity: 0.25,
    averageBuyPrice: 60000,
    userId: TEST_USER_ID,
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments/i1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        quantity: 0.55,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.quantity, 0.55);
  } finally {
    await close();
  }
});

test('PUT /api/investments/:id rejects empty update payload', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments/i1`, {
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

test('DELETE /api/investments/:id deletes an investment', async () => {
  Investment.findOneAndDelete = async () => ({ _id: 'i1' });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/investments/i1`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Investment deleted');
  } finally {
    await close();
  }
});
