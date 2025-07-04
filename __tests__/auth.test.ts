import request from 'supertest';
import { EmbeddedServer } from '../src/server/EmbeddedServer';
import { AuthService } from '../src/server/auth/authService';
import { store } from '../src/store';

describe('Authentication', () => {
  let server: EmbeddedServer;
  let port: number;
  let authToken: string;

  beforeAll(async () => {
    port = 8082; // Use different port for testing
    server = new EmbeddedServer(store, port);
    await server.start();
  });

  afterAll(async () => {
    if (server && server.isServerRunning()) {
      await server.stop();
    }
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/auth/login')
        .send({
          username: 'api_user',
          password: 'mobile_api_password',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Authentication successful',
        token_type: 'Bearer',
        scope: 'read write',
      });

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expires_in');
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.expires_in).toBe('number');

      // Store token for other tests
      authToken = response.body.token;
    });

    test('should reject invalid credentials', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/auth/login')
        .send({
          username: 'invalid_user',
          password: 'wrong_password',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect',
      });
    });

    test('should validate required fields', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/auth/login')
        .send({
          username: 'api_user',
          // missing password
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
      });
    });
  });

  describe('POST /auth/validate', () => {
    test('should validate valid token', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/auth/validate')
        .send({
          token: authToken,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        user: 'api_user',
        scope: ['read', 'write'],
      });

      expect(response.body).toHaveProperty('issued_at');
      expect(response.body).toHaveProperty('expires_at');
    });

    test('should reject invalid token', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/auth/validate')
        .send({
          token: 'invalid_token',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        valid: false,
        error: 'Invalid token',
      });
    });
  });

  describe('GET /auth/me', () => {
    test('should return user info with valid token', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        username: 'api_user',
        scope: ['read', 'write'],
        is_expired: false,
      });
    });

    test('should reject request without token', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access denied',
        message: 'No token provided',
      });
    });
  });

  describe('AuthService', () => {
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

    test('should validate credentials correctly', async () => {
      const validResult = await AuthService.validateCredentials('api_user', 'mobile_api_password');
      expect(validResult).toBe(true);

      const invalidResult = await AuthService.validateCredentials('api_user', 'wrong_password');
      expect(invalidResult).toBe(false);
    });

    test('should extract token from Authorization header', () => {
      const token = AuthService.extractTokenFromHeader('Bearer abc123');
      expect(token).toBe('abc123');

      const noToken = AuthService.extractTokenFromHeader('Invalid header');
      expect(noToken).toBeNull();

      const undefined_header = AuthService.extractTokenFromHeader(undefined);
      expect(undefined_header).toBeNull();
    });
  });
});