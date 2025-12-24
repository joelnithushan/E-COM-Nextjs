import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { logger } from './src/utils/logger.util.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
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

