const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas with seamless fallback to local MongoDB instance
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const localUri = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/exam-sphere';

  if (!uri) {
    console.warn('⚠️  MongoDB Warning: MONGO_URI is not defined. Attempting local connection...');
    try {
      const localConn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
      return localConn;
    } catch (e) {
      console.error(`❌ Local MongoDB connection failed: ${e.message}`);
      return null;
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Primary Connection Error: ${error.message}`);

    // If primary was remote Atlas and failed (e.g. IP not whitelisted or offline), fall back to local MongoDB
    if (uri !== localUri && !uri.includes('127.0.0.1') && !uri.includes('localhost')) {
      console.log('🔄 Attempting fallback connection to local MongoDB (127.0.0.1:27017)...');
      try {
        const localConn = await mongoose.connect(localUri, {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`✅ Local MongoDB Connected (Fallback): ${localConn.connection.host}`);
        console.log('💡 Note: Whitelist your current IP in MongoDB Atlas Security -> Network Access to use Atlas.');
        return localConn;
      } catch (localErr) {
        console.error(`❌ Local MongoDB Fallback also failed: ${localErr.message}`);
      }
    }
    return null;
  }
};

module.exports = connectDB;
