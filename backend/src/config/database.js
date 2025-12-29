import mongoose from 'mongoose';
import config from './index.js';
import logger from './logging.config.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, {
      ...config.database.options,
      // Enable buffering in development to handle MongoDB not being immediately available
      // In production, disable buffering for immediate error feedback
      bufferCommands: config.isDevelopment,
      // Set buffer timeout (default is 10000ms, but we'll keep it reasonable)
      bufferMaxEntries: config.isDevelopment ? 100 : 0,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Set mongoose options for performance
    mongoose.set('strictQuery', true); // Deprecation warning fix
    mongoose.set('debug', config.isDevelopment); // Only debug in development

    // Connection event handlers
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    // Performance monitoring (development only)
    if (config.isDevelopment) {
      mongoose.connection.on('commandStarted', (event) => {
        logger.debug(`MongoDB Command: ${event.commandName}`);
      });
    }
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    if (config.isProduction) {
      // Exit in production if DB connection fails
      process.exit(1);
    } else {
      // In development, log error but allow server to continue
      logger.warn('Server will continue without database connection (development mode)');
      logger.warn('Some features requiring database will not work until MongoDB is connected');
    }
  }
};

export default connectDB;
