import mongoose from 'mongoose';
import config from './index.js';
import logger from './logging.config.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, {
      ...config.database.options,
      // Performance optimizations
      bufferCommands: false, // Disable mongoose buffering
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
    process.exit(1);
  }
};

export default connectDB;
