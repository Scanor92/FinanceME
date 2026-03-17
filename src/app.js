const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const budgetRoutes = require('./routes/budget.routes');
const transactionRoutes = require('./routes/transaction.routes');
const investmentRoutes = require('./routes/investment.routes');
const savingsRoutes = require('./routes/savings.routes');
const debtRoutes = require('./routes/debt.routes');
const accountRoutes = require('./routes/account.routes');
const errorMiddleware = require('./middleware/error.middleware');
const { createRateLimiter } = require('./middleware/rateLimit.middleware');

const getAllowedOrigins = () =>
  (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const createApp = () => {
  const app = express();
  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts, please try again later.',
  });
  const allowedOrigins = getAllowedOrigins();
  const corsOptions =
    allowedOrigins.length === 0
      ? undefined
      : {
          origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }

            const error = new Error('Origin not allowed');
            error.statusCode = 403;
            return callback(error);
          },
        };

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'FinanceMe API' });
  });

  app.use('/api/auth', authRateLimiter, authRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/investments', investmentRoutes);
  app.use('/api/savings', savingsRoutes);
  app.use('/api/debts', debtRoutes);
  app.use('/api/accounts', accountRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use(errorMiddleware);

  return app;
};

module.exports = { createApp };
