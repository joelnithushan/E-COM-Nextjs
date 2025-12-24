import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment-specific .env file
// Priority: .env.{NODE_ENV}.local > .env.{NODE_ENV} > .env.local > .env
const envFiles = [
  `.env.${NODE_ENV}.local`,
  `.env.${NODE_ENV}`,
  '.env.local',
  '.env',
];

envFiles.forEach((file) => {
  dotenv.config({ path: path.resolve(__dirname, '../../../', file) });
});

// Validate required environment variables
const requiredEnvVars = {
  development: ['MONGODB_URI', 'JWT_SECRET'],
  staging: ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'],
  production: [
    'MONGODB_URI',
    'JWT_SECRET',
    'FRONTEND_URL',
    'STRIPE_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ],
};

const validateEnv = () => {
  const required = requiredEnvVars[NODE_ENV] || requiredEnvVars.development;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${NODE_ENV}:`);
    missing.forEach((key) => console.error(`   - ${key}`));
    if (NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing with missing variables (not recommended)');
    }
  }
};

// Validate on startup
validateEnv();

/**
 * Application Configuration
 * Centralized configuration with environment-based defaults
 */
const config = {
  // Environment
  env: NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isStaging: NODE_ENV === 'staging',
  isProduction: NODE_ENV === 'production',

  // Server
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiVersion: process.env.API_VERSION || 'v1',
    nodeEnv: NODE_ENV,
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000'],
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
    options: {
      // Mongoose connection options
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2', 10),
      serverSelectionTimeoutMS: parseInt(
        process.env.DB_SERVER_SELECTION_TIMEOUT || '5000',
        10
      ),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000', 10),
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'ecommerce-api',
    audience: process.env.JWT_AUDIENCE || 'ecommerce-client',
  },

  // Cookies
  cookies: {
    secure: process.env.COOKIE_SECURE === 'true' || NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || (NODE_ENV === 'production' ? 'none' : 'lax'),
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
    paymentMax: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '10', 10),
    adminMax: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '200', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDir: process.env.LOG_DIR || './logs',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    passwordMaxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10),
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    maxFiles: parseInt(process.env.MAX_FILES || '10', 10),
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES
      ? process.env.ALLOWED_MIME_TYPES.split(',').map((type) => type.trim())
      : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

// Validate critical production settings
if (config.isProduction) {
  if (config.jwt.secret === 'change-this-in-production' || config.jwt.secret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }

  if (!config.stripe.secretKey || !config.stripe.secretKey.startsWith('sk_live_')) {
    console.error('❌ STRIPE_SECRET_KEY must be a live key in production');
    process.exit(1);
  }

  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    console.error('❌ Cloudinary credentials are required in production');
    process.exit(1);
  }
}

// Export configuration
export default config;

// Export individual config sections for convenience
export const {
  server,
  frontend,
  database,
  jwt,
  cookies,
  stripe,
  cloudinary,
  rateLimit,
  logging,
  security,
  upload,
} = config;

