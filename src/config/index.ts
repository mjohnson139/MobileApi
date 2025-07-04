import dotenv from 'dotenv';
import { ServerConfig } from '../types';

// Load environment variables
dotenv.config();

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.API_HOST || 'localhost',
  enableApiServer: process.env.ENABLE_API_SERVER === 'true',
  corsOrigin: process.env.NODE_ENV === 'development' 
    ? (process.env.CORS_ORIGIN || true) 
    : false,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '1h',
  logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  enableReduxDevTools: process.env.ENABLE_REDUX_DEVTOOLS === 'true',
  enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true',
};

export const securityConfig = {
  jwt: {
    secret: serverConfig.jwtSecret,
    expiresIn: serverConfig.jwtExpiry,
    algorithm: 'HS256' as 'HS256',
  },
  cors: {
    origin: serverConfig.corsOrigin,
    credentials: true,
  },
  helmet: {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
  },
  rateLimit: {
    windowMs: serverConfig.rateLimitWindowMs,
    max: serverConfig.rateLimitMaxRequests,
  },
};

export const validationConfig = {
  auth: {
    minPasswordLength: 8,
    maxPasswordLength: 128,
    usernamePattern: /^[a-zA-Z0-9_]{3,30}$/,
  },
  api: {
    maxRequestSize: '10mb',
    maxPathDepth: 10,
    allowedActionTypes: ['toggle', 'set', 'trigger', 'update'],
  },
};

// Validate critical configuration
export function validateConfig(): void {
  if (!serverConfig.jwtSecret || serverConfig.jwtSecret === 'fallback-secret-key') {
    console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET environment variable.');
  }

  if (serverConfig.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (serverConfig.port < 1024 || serverConfig.port > 65535) {
    throw new Error('PORT must be between 1024 and 65535');
  }

  if (serverConfig.bcryptRounds < 8 || serverConfig.bcryptRounds > 15) {
    throw new Error('BCRYPT_ROUNDS must be between 8 and 15');
  }
}

// Export environment helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';