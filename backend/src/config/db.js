/**
 * Database Configuration
 * Connects to MongoDB using Mongoose with sensible defaults and error handling.
 * Includes graceful in-memory fallback for local development when Atlas IP whitelist blocks connection.
 */
const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async (customUri = null) => {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/pageturner';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Primary connection error: ${error.message}`);

    // If not in a test runner and in dev/local mode, try memory-server fallback
    if (process.env.NODE_ENV !== 'test') {
      try {
        console.log('[MongoDB] Attempting fallback to in-memory MongoDB server for local development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Fallback active: Connected to in-memory MongoDB at ${memUri}`);
        console.log('[MongoDB] NOTE: To connect to MongoDB Atlas, ensure your current IP is whitelisted in Atlas Network Access.');
        return conn;
      } catch (memError) {
        console.error(`[MongoDB] In-memory fallback failed: ${memError.message}`);
        process.exit(1);
      }
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error(`[MongoDB] Error closing connection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
