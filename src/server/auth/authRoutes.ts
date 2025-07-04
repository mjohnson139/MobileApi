import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { AuthService } from '../auth/authService';
import { validationConfig } from '../../config';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string()
    .pattern(validationConfig.auth.usernamePattern)
    .required()
    .messages({
      'string.pattern.base': 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .min(validationConfig.auth.minPasswordLength)
    .max(validationConfig.auth.maxPasswordLength)
    .required()
    .messages({
      'string.min': `Password must be at least ${validationConfig.auth.minPasswordLength} characters`,
      'string.max': `Password must be no more than ${validationConfig.auth.maxPasswordLength} characters`,
      'any.required': 'Password is required',
    }),
});

const tokenValidationSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token is required',
  }),
});

/**
 * POST /auth/login
 * Authenticate user credentials and return JWT token
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { username, password } = value;

    // Validate credentials
    const isValid = await AuthService.validateCredentials(username, password);
    if (!isValid) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generate token
    const authToken = AuthService.generateToken(username, ['read', 'write']);

    res.json({
      success: true,
      message: 'Authentication successful',
      token: authToken.token,
      expires_in: authToken.expiresIn,
      token_type: authToken.tokenType,
      scope: authToken.scope.join(' '),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /auth/validate
 * Validate JWT token and return user information
 */
router.post('/validate', (req: Request, res: Response): void => {
  try {
    // Validate request body
    const { error, value } = tokenValidationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { token } = value;

    // First verify token, then check expiry
    try {
      const user = AuthService.verifyToken(token);
      
      // Check if token is expired
      if (AuthService.isTokenExpired(token)) {
        res.status(401).json({
          valid: false,
          error: 'Token expired',
          message: 'Authentication token has expired',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        valid: true,
        user: user.username,
        scope: user.scope,
        issued_at: user.iat,
        expires_at: user.exp,
        timestamp: new Date().toISOString(),
      });
    } catch (verifyError) {
      res.status(401).json({
        valid: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or malformed',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Validation error',
      message: 'Internal server error during token validation',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh an existing valid token (extend expiry)
 */
router.post('/refresh', (req: Request, res: Response): void => {
  try {
    const { error, value } = tokenValidationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { token } = value;

    // Verify current token (must be valid but can be close to expiry)
    const user = AuthService.verifyToken(token);

    // Generate new token with extended expiry
    const newAuthToken = AuthService.generateToken(user.username, user.scope);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAuthToken.token,
      expires_in: newAuthToken.expiresIn,
      token_type: newAuthToken.tokenType,
      scope: newAuthToken.scope.join(' '),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Current token is invalid or expired',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /auth/me
 * Get current user information from token
 */
router.get('/me', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = AuthService.verifyToken(token);

    res.json({
      username: user.username,
      scope: user.scope,
      issued_at: user.iat,
      expires_at: user.exp,
      is_expired: AuthService.isTokenExpired(token),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;