/**
 * PageTurner Server Entry Point
 * Loads environment variables, connects to MongoDB, and starts listening.
 */
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const Product = require('./models/Product');
const { sampleBooks } = require('./data/seed');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Ensure database connection succeeds before listening
    console.log('[Server] Connecting to MongoDB...');
    await connectDB();

    // 2. Auto-seed catalog if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('[Server] Catalog empty: auto-seeding sample books...');
      await Product.insertMany(sampleBooks);
      console.log(`[Server] Seeded ${sampleBooks.length} books successfully.`);
    }

    // 3. Start HTTP server listener
    const server = app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  PageTurner E-Commerce Backend`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Server listening on: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=================================================`);
    });

    // Graceful shutdown handlers
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Start server execution
startServer();
