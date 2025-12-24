/**
 * Simple logger utility
 * In production, consider using Winston or Pino
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
};

