import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { securityConfig, validationConfig } from '../../config';
import { AuthToken, AuthUser } from '../../types';

export class AuthService {
  private static readonly validUsers: Record<string, string> = {
    // Default API user - in production, this should come from a secure store
    api_user: '$2a$10$m9tB2.kJ.lEpltg17OtQF.Di3Ra44hKW/hplE2e11sqdoABCU6/Xq', // bcrypt hash of 'mobile_api_password'
    test_user: '$2a$10$AhLdMPtl77p/jeoT1lyiruxiFXLAJmrvOziCj/rD7/dlgXCGBaslK', // bcrypt hash of 'test_password'
  };

  /**
   * Generate JWT token for authenticated user
   */
  public static generateToken(username: string, scope: string[] = ['read', 'write']): AuthToken {
    const payload = {
      sub: username,
      scope: scope.join(' '),
      iat: Math.floor(Date.now() / 1000),
    };

    // Calculate expiry time in seconds first
    const expiresInSeconds = this.parseExpiryTime(securityConfig.jwt.expiresIn);

    const signOptions: SignOptions = {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256',
    };

    const token = jwt.sign(payload, securityConfig.jwt.secret as string, signOptions);

    // Return expiresIn that was calculated above
    const expiresIn = expiresInSeconds;

    return {
      token,
      expiresIn,
      tokenType: 'Bearer',
      scope,
    };
  }

  /**
   * Verify JWT token and return decoded payload
   */
  public static verifyToken(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, securityConfig.jwt.secret as string, {
        algorithms: ['HS256'],
      }) as any;

      return {
        username: decoded.sub,
        scope: decoded.scope ? decoded.scope.split(' ') : [],
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Validate user credentials
   */
  public static async validateCredentials(username: string, password: string): Promise<boolean> {
    if (!username || !password) {
      return false;
    }

    // Validate username format
    if (!validationConfig.auth.usernamePattern.test(username)) {
      return false;
    }

    // Validate password length
    if (
      password.length < validationConfig.auth.minPasswordLength ||
      password.length > validationConfig.auth.maxPasswordLength
    ) {
      return false;
    }

    // Check if user exists
    const hashedPassword = this.validUsers[username];
    if (!hashedPassword) {
      return false;
    }

    // Compare password with hash
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  /**
   * Hash password for storage
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Check if token is expired
   */
  public static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Extract token from Authorization header
   */
  public static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Parse expiry time string to seconds
   */
  private static parseExpiryTime(expiryString: string): number {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  /**
   * Generate a secure random API key for development
   */
  public static generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
