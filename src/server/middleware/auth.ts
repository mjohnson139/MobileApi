import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/authService';
import { AuthUser } from '../../types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware for protected API routes
 */
export function authenticateAPI(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided. Include Authorization: Bearer <token> header.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token
    const user = AuthService.verifyToken(token);

    // Check if token is expired
    if (AuthService.isTokenExpired(token)) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired. Please login again.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch {
    res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid or malformed.',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Authorization middleware for checking user permissions
 */
export function authorize(requiredScope: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userScopes = req.user.scope || [];
    const required = Array.isArray(requiredScope) ? requiredScope : [requiredScope];

    // Check if user has any of the required scopes
    const hasPermission = required.some(scope => userScopes.includes(scope));

    if (!hasPermission) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required scope: ${required.join(' or ')}. User scopes: ${userScopes.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (token && !AuthService.isTokenExpired(token)) {
      const user = AuthService.verifyToken(token);
      req.user = user;
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.debug('Optional auth failed:', (error as Error).message);
  }

  next();
}

/**
 * Rate limiting middleware
 */
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    // Get or initialize request history for this client
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId)!;

    // Remove old requests outside the window
    const validRequests = clientRequests.filter(timestamp => now - timestamp < windowMs);

    // Check if client has exceeded the limit
    if (validRequests.length >= maxRequests) {
      const resetTime = Math.ceil((validRequests[0] + windowMs - now) / 1000);

      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
        retryAfter: resetTime,
        limit: maxRequests,
        windowMs,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Add current request to history
    validRequests.push(now);
    requests.set(clientId, validRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - validRequests.length);
    res.setHeader('X-RateLimit-Reset', Math.ceil((validRequests[0] + windowMs) / 1000));

    next();
  };
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Override res.end to log when response is sent
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, cb?: any): Response {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[${logData.timestamp}] ${logData.method} ${logData.path} - ${logData.statusCode} - ${duration}ms`,
    );

    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
    return this;
  };

  next();
}
