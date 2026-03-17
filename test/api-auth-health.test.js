const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../src/app');
const User = require('../src/models/User');
const emailService = require('../src/services/email.service');

const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalHasMailConfig = emailService.hasMailConfig;
const originalSendPasswordResetEmail = emailService.sendPasswordResetEmail;

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

test.afterEach(() => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
  emailService.hasMailConfig = originalHasMailConfig;
  emailService.sendPasswordResetEmail = originalSendPasswordResetEmail;
  delete process.env.CORS_ALLOWED_ORIGINS;
  delete process.env.PASSWORD_RESET_DEBUG;
});

test('GET /api/health returns API health status', async () => {
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: 'ok', service: 'FinanceMe API' });
  } finally {
    await close();
  }
});

test('GET /api/health allows configured browser origin', async () => {
  process.env.CORS_ALLOWED_ORIGINS = 'https://finaceme.app,https://admin.finaceme.app';
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'https://finaceme.app',
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://finaceme.app');
  } finally {
    await close();
  }
});

test('GET /api/health rejects unknown browser origin when CORS is restricted', async () => {
  process.env.CORS_ALLOWED_ORIGINS = 'https://finaceme.app';
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'https://evil.example',
      },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.message, 'Origin not allowed');
  } finally {
    await close();
  }
});

test('POST /api/auth/register creates a user and returns a token', async () => {
  process.env.JWT_SECRET = 'test-secret';
  User.findOne = async () => null;
  User.create = async ({ name, email }) => ({
    _id: '507f1f77bcf86cd799439011',
    name,
    email,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(typeof body.token, 'string');
    assert.equal(body.user.name, 'Alice');
    assert.equal(body.user.email, 'alice@example.com');
  } finally {
    await close();
  }
});

test('POST /api/auth/login rejects invalid credentials', async () => {
  process.env.JWT_SECRET = 'test-secret';
  User.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'unknown@example.com',
        password: 'password123',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.message, 'Invalid credentials');
  } finally {
    await close();
  }
});

test('POST /api/auth/login returns token for valid credentials', async () => {
  process.env.JWT_SECRET = 'test-secret';
  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439012',
    name: 'Alice',
    email: 'alice@example.com',
    comparePassword: async () => true,
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'password123',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof body.token, 'string');
    assert.equal(body.user.email, 'alice@example.com');
  } finally {
    await close();
  }
});

test('POST /api/auth/request-password-reset generates a token for existing user', async () => {
  let savedUser = null;
  let emailPayload = null;

  process.env.JWT_SECRET = 'test-secret';
  emailService.hasMailConfig = () => true;
  emailService.sendPasswordResetEmail = async (payload) => {
    emailPayload = payload;
  };
  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439012',
    email: 'alice@example.com',
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    save: async function save() {
      savedUser = this;
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'If the account exists, a reset token has been generated.');
    assert.equal(body.resetToken, undefined);
    assert.equal(typeof savedUser.passwordResetTokenHash, 'string');
    assert.equal(savedUser.passwordResetTokenHash.length > 20, true);
    assert.equal(savedUser.passwordResetExpiresAt instanceof Date, true);
    assert.equal(emailPayload.to, 'alice@example.com');
    assert.equal(typeof emailPayload.resetToken, 'string');
    assert.equal(emailPayload.resetToken.length > 20, true);
  } finally {
    await close();
  }
});

test('POST /api/auth/request-password-reset returns debug token when debug mode is enabled', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PASSWORD_RESET_DEBUG = 'true';
  emailService.hasMailConfig = () => false;
  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439012',
    email: 'alice@example.com',
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof body.resetToken, 'string');
    assert.equal(body.resetToken.length > 20, true);
  } finally {
    await close();
  }
});

test('POST /api/auth/request-password-reset is silent when user does not exist', async () => {
  process.env.JWT_SECRET = 'test-secret';
  emailService.hasMailConfig = () => true;
  User.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'unknown@example.com',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'If the account exists, a reset token has been generated.');
  } finally {
    await close();
  }
});

test('POST /api/auth/request-password-reset requires smtp or debug mode', async () => {
  process.env.JWT_SECRET = 'test-secret';
  emailService.hasMailConfig = () => false;
  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439012',
    email: 'alice@example.com',
    save: async function save() {
      return this;
    },
  });

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.message, 'Password reset email is not configured on the server');
  } finally {
    await close();
  }
});

test('POST /api/auth/reset-password updates password when token is valid', async () => {
  let savedUser = null;

  process.env.JWT_SECRET = 'test-secret';
  User.findOne = async (query) => {
    if (query.passwordResetTokenHash) {
      return {
        _id: '507f1f77bcf86cd799439012',
        email: 'alice@example.com',
        password: 'old-password',
        passwordResetTokenHash: query.passwordResetTokenHash,
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
        save: async function save() {
          savedUser = this;
          return this;
        },
      };
    }

    return null;
  };

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-reset-token',
        newPassword: 'newpass123',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Password reset successful');
    assert.equal(savedUser.password, 'newpass123');
    assert.equal(savedUser.passwordResetTokenHash, null);
    assert.equal(savedUser.passwordResetExpiresAt, null);
  } finally {
    await close();
  }
});

test('POST /api/auth/reset-password rejects invalid token', async () => {
  process.env.JWT_SECRET = 'test-secret';
  User.findOne = async () => null;

  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-token',
        newPassword: 'newpass123',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Invalid or expired reset token');
  } finally {
    await close();
  }
});
