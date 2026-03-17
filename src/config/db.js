const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Atlas connected');
  } catch (error) {
    console.error('MongoDB connection error', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
