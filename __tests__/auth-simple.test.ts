import { AuthService } from '../src/server/auth/authService';

describe('AuthService Basic Tests', () => {
  test('should generate and verify tokens', () => {
    const token = AuthService.generateToken('test_user', ['read']);
    expect(token).toHaveProperty('token');
    expect(token).toHaveProperty('expiresIn');
    expect(token.tokenType).toBe('Bearer');
    expect(token.scope).toEqual(['read']);

    const decoded = AuthService.verifyToken(token.token);
    expect(decoded.username).toBe('test_user');
    expect(decoded.scope).toEqual(['read']);
  });

  test('should extract token from Authorization header', () => {
    const token = AuthService.extractTokenFromHeader('Bearer abc123');
    expect(token).toBe('abc123');

    const noToken = AuthService.extractTokenFromHeader('Invalid header');
    expect(noToken).toBeNull();

    const undefinedHeader = AuthService.extractTokenFromHeader(undefined);
    expect(undefinedHeader).toBeNull();
  });

  test('should validate credentials correctly', async () => {
    const validResult = await AuthService.validateCredentials('api_user', 'mobile_api_password');
    expect(validResult).toBe(true);

    const invalidResult = await AuthService.validateCredentials('api_user', 'wrong_password');
    expect(invalidResult).toBe(false);
  });
});