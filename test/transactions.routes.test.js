const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { createApp } = require('../src/app');
const Transaction = require('../src/models/Transaction');
const Account = require('../src/models/Account');

const originalFind = Transaction.find;
const originalCountDocuments = Transaction.countDocuments;
const originalFindOne = Transaction.findOne;
const originalCreate = Transaction.create;
const originalDeleteOne = Transaction.deleteOne;
const originalAccountFindOne = Account.findOne;

const TEST_USER_ID = '507f1f77bcf86cd799439011';
const TEST_ACCOUNT_ID = '507f1f77bcf86cd799439099';

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
  Transaction.find = originalFind;
  Transaction.countDocuments = originalCountDocuments;
  Transaction.findOne = originalFindOne;
  Transaction.create = originalCreate;
  Transaction.deleteOne = originalDeleteOne;
  Account.findOne = originalAccountFindOne;
});

test('GET /api/transactions returns paginated transactions', async () => {
  const mockItems = [
    { _id: '1', title: 'Salary', amount: 1000, type: 'income', category: 'Job', userId: TEST_USER_ID },
  ];

  Transaction.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          populate: async () => mockItems,
        }),
      }),
    }),
  });
  Transaction.countDocuments = async () => 1;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions?page=1&limit=10`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.pagination.page, 1);
    assert.equal(body.pagination.limit, 10);
    assert.equal(body.pagination.total, 1);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].title, 'Salary');
  } finally {
    await close();
  }
});

test('GET /api/transactions supports limit=all', async () => {
  const mockItems = [
    { _id: '1', title: 'Groceries', amount: 30, type: 'expense', category: 'Food', userId: TEST_USER_ID },
    { _id: '2', title: 'Transport', amount: 12, type: 'expense', category: 'Transport', userId: TEST_USER_ID },
  ];

  Transaction.find = () => ({
    sort: () => ({
      populate: async () => mockItems,
    }),
  });
  Transaction.countDocuments = async () => 2;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions?limit=all&type=expense`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.pagination.limit, 'all');
    assert.equal(body.pagination.total, 2);
    assert.equal(body.pagination.totalPages, 1);
    assert.equal(body.data.length, 2);
  } finally {
    await close();
  }
});

test('POST /api/transactions creates a transaction', async () => {
  Account.findOne = async () => ({
    _id: TEST_ACCOUNT_ID,
    userId: TEST_USER_ID,
    currentBalance: 1000,
    movements: [],
    save: async function save() {
      return this;
    },
  });
  Transaction.create = async (payload) => ({
    _id: 'tx1',
    ...payload,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Groceries',
        amount: 85.5,
        type: 'expense',
        category: 'Food',
        accountId: TEST_ACCOUNT_ID,
        note: 'Weekly shopping',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.title, 'Groceries');
    assert.equal(body.amount, 85.5);
    assert.equal(body.userId, TEST_USER_ID);
  } finally {
    await close();
  }
});

test('GET /api/transactions/:id returns 404 when transaction does not exist', async () => {
  Transaction.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions/unknown-id`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, 'Transaction not found');
  } finally {
    await close();
  }
});

test('PUT /api/transactions/:id updates a transaction', async () => {
  const accountState = {
    [TEST_ACCOUNT_ID]: { _id: TEST_ACCOUNT_ID, userId: TEST_USER_ID, currentBalance: 1000, movements: [] },
  };
  Account.findOne = async (query) => {
    const account = accountState[query._id];
    if (!account) return null;
    return {
      ...account,
      save: async function save() {
        accountState[query._id] = this;
        return this;
      },
    };
  };

  Transaction.findOne = async () => ({
    _id: 'tx1',
    title: 'Groceries',
    amount: 85.5,
    type: 'expense',
    category: 'Food',
    accountId: TEST_ACCOUNT_ID,
    userId: TEST_USER_ID,
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions/tx1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Updated Groceries',
        amount: 95,
        type: 'expense',
        category: 'Food',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.title, 'Updated Groceries');
    assert.equal(body.amount, 95);
  } finally {
    await close();
  }
});

test('PUT /api/transactions/:id supports partial update', async () => {
  const accountState = {
    [TEST_ACCOUNT_ID]: { _id: TEST_ACCOUNT_ID, userId: TEST_USER_ID, currentBalance: 1000, movements: [] },
  };
  Account.findOne = async (query) => {
    const account = accountState[query._id];
    if (!account) return null;
    return {
      ...account,
      save: async function save() {
        accountState[query._id] = this;
        return this;
      },
    };
  };

  Transaction.findOne = async () => ({
    _id: 'tx1',
    title: 'Groceries',
    amount: 85.5,
    type: 'expense',
    category: 'Food',
    accountId: TEST_ACCOUNT_ID,
    userId: TEST_USER_ID,
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions/tx1`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 99,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.amount, 99);
  } finally {
    await close();
  }
});

test('PATCH /api/transactions/:id supports partial update', async () => {
  const accountState = {
    [TEST_ACCOUNT_ID]: { _id: TEST_ACCOUNT_ID, userId: TEST_USER_ID, currentBalance: 1000, movements: [] },
  };
  Account.findOne = async (query) => {
    const account = accountState[query._id];
    if (!account) return null;
    return {
      ...account,
      save: async function save() {
        accountState[query._id] = this;
        return this;
      },
    };
  };

  Transaction.findOne = async () => ({
    _id: 'tx1',
    title: 'Groceries',
    amount: 85.5,
    type: 'expense',
    category: 'Food',
    accountId: TEST_ACCOUNT_ID,
    userId: TEST_USER_ID,
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions/tx1`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 110,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.amount, 110);
  } finally {
    await close();
  }
});

test('PUT /api/transactions/:id rejects empty update payload', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions/tx1`, {
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

test('DELETE /api/transactions/:id deletes a transaction', async () => {
  Account.findOne = async () => ({
    _id: TEST_ACCOUNT_ID,
    userId: TEST_USER_ID,
    currentBalance: 1000,
    movements: [],
    save: async function save() {
      return this;
    },
  });
  Transaction.findOne = async () => ({
    _id: 'tx1',
    amount: 20,
    type: 'expense',
    accountId: TEST_ACCOUNT_ID,
  });
  Transaction.deleteOne = async () => ({ deletedCount: 1 });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/transactions/tx1`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Transaction deleted');
  } finally {
    await close();
  }
});
