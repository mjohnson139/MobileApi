import request from 'supertest';
import { EmbeddedServer } from '../src/server/EmbeddedServer';
import { store } from '../src/store';

describe('API Endpoints', () => {
  let server: EmbeddedServer;
  let port: number;
  let authToken: string;

  beforeAll(async () => {
    port = 8083; // Use different port for testing
    server = new EmbeddedServer(store, port);
    await server.start();

    // Get auth token for protected endpoints
    const authResponse = await request(`http://localhost:${port}`).post('/auth/login').send({
      username: 'api_user',
      password: 'mobile_api_password',
    });

    authToken = authResponse.body.token;
  });

  afterAll(async () => {
    if (server && server.isServerRunning()) {
      await server.stop();
    }
  });

  describe('GET /api/state', () => {
    test('should return application state with valid token', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/state')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('ui_state');
      expect(response.body).toHaveProperty('device_state');
      expect(response.body).toHaveProperty('server_state');
    });

    test('should reject request without token', async () => {
      const response = await request(`http://localhost:${port}`).get('/api/state').expect(401);

      expect(response.body).toMatchObject({
        error: 'Access denied',
      });
    });
  });

  describe('POST /api/state', () => {
    test('should update state with valid token and data', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          path: 'ui.controls.living_room_light.state',
          value: 'off',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        updated: {
          path: 'ui.controls.living_room_light.state',
          value: 'off',
        },
      });

      expect(response.body.updated).toHaveProperty('timestamp');
    });

    test('should validate required fields', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // missing path
          value: 'some_value',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      });
    });

    test('should reject request without token', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/state')
        .send({
          path: 'ui.controls.test',
          value: 'test',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access denied',
      });
    });
  });

  describe('POST /api/actions/:type', () => {
    test('should execute toggle action', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/actions/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target: 'living_room_light',
          payload: {},
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        action: {
          type: 'toggle',
          target: 'living_room_light',
          payload: {},
        },
      });

      expect(response.body.action).toHaveProperty('executedAt');
    });

    test('should reject invalid action types', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/actions/invalid_action')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target: 'test_device',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid action type',
      });
    });

    test('should reject request without token', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/actions/toggle')
        .send({
          target: 'test_device',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Access denied',
      });
    });
  });

  describe('GET /api/screenshot', () => {
    test('should return mock screenshot data', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/screenshot')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        format: 'png',
      });

      expect(response.body).toHaveProperty('imageData');
      expect(response.body).toHaveProperty('capturedAt');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('width');
      expect(response.body.metadata).toHaveProperty('height');
      expect(response.body.metadata).toHaveProperty('size');
    });

    test('should accept format parameter', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/screenshot?format=jpg&quality=0.8')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.format).toBe('jpg');
    });

    test('should reject request without token', async () => {
      const response = await request(`http://localhost:${port}`).get('/api/screenshot').expect(401);

      expect(response.body).toMatchObject({
        error: 'Access denied',
      });
    });
  });

  describe('GET /api/metrics', () => {
    test('should return server metrics', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('server_metrics');
      expect(response.body).toHaveProperty('performance');
      expect(response.body.server_metrics).toHaveProperty('uptime');
      expect(response.body.server_metrics).toHaveProperty('requests_handled');
    });

    test('should reject request without token', async () => {
      const response = await request(`http://localhost:${port}`).get('/api/metrics').expect(401);

      expect(response.body).toMatchObject({
        error: 'Access denied',
      });
    });
  });
});
