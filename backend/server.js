import app from './src/app.js';
import connectDB from './src/config/database.js';
import logger from './src/config/logging.config.js';
import config from './src/config/index.js';

// Start server
const { port, host, apiVersion } = config.server;

// Connect to database and start server
async function startServer() {
  try {
    // Attempt to connect to database
    await connectDB();
    
    // Start server only after database connection attempt
    app.listen(port, host, () => {
      logger.info(`Server running in ${config.env} mode`);
      logger.info(`Server listening on ${host}:${port}`);
      logger.info(`API available at http://${host}:${port}/api/${apiVersion}`);
    });
  } catch (error) {
    // If database connection fails in production, exit
    if (config.isProduction) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    } else {
      // In development, start server even if DB connection fails
      logger.warn('Starting server without database connection (development mode)');
      app.listen(port, host, () => {
        logger.info(`Server running in ${config.env} mode`);
        logger.info(`Server listening on ${host}:${port}`);
        logger.info(`API available at http://${host}:${port}/api/${apiVersion}`);
        logger.warn('⚠️  Database operations will fail until MongoDB is connected');
      });
    }
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});


