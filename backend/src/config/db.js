const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MongoDB Warning: MONGO_URI is not defined in environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
