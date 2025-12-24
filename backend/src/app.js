import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler, initializeErrorHandlers } from './middleware/error-handler.middleware.js';
import { sanitizeMongo } from './middleware/security.middleware.js';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware.js';
import logger from './config/logging.config.js';
import errorTrackingService from './services/error-tracking.service.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import config from './config/index.js';

const app = express();

// Initialize error tracking (Sentry) - Must be first
errorTrackingService.initializeSentry();

// Initialize error handlers (unhandled rejections, uncaught exceptions)
initializeErrorHandlers();

// Request logging middleware (before routes)
app.use(requestLogger);

// Security middleware with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Cloudinary images
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary resources
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// CORS configuration
const corsOptions = {
  origin: config.frontend.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// IMPORTANT: Webhook routes need raw body for signature verification
// So we handle webhook route BEFORE JSON parser
// The webhook route itself uses express.raw() middleware

// Body parser middleware (applied to all routes except webhooks)
app.use((req, res, next) => {
  // Skip JSON parsing for webhook routes (they use raw body)
  if (req.path.startsWith('/api/v1/payments/webhook')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser with security options
app.use(cookieParser());

// NoSQL injection prevention - MUST be before routes
app.use(sanitizeMongo);

// Rate limiting - General API
app.use('/api/', apiLimiter);

// Stricter rate limiting for auth routes
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// API routes
app.use(`/api/${config.server.apiVersion}`, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API',
    version: config.server.apiVersion,
    environment: config.env,
    docs: `/api/${config.server.apiVersion}/health`,
  });
});

// 404 handler (before error handler)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;

