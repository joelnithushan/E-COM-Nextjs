import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { logger } from './utils/logger.util.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Cookie parser
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}`, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API',
    version: API_VERSION,
    docs: `/api/${API_VERSION}/health`,
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

export default app;

