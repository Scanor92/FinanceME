require('dotenv').config();

const { connectDB } = require('./config/db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;
const app = createApp();

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`FinanceMe API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
