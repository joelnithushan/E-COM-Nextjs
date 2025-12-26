import app from './src/app.js';
import connectDB from './src/config/database.js';
import logger from './src/config/logging.config.js';
import config from './src/config/index.js';

// Connect to database
connectDB();

// Start server
const { port, host, apiVersion } = config.server;

app.listen(port, host, () => {
  logger.info(`Server running in ${config.env} mode`);
  logger.info(`Server listening on ${host}:${port}`);
  logger.info(`API available at http://${host}:${port}/api/${apiVersion}`);
});

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


