import request from 'supertest';
import express from 'express';
import { EmbeddedServer } from '../src/server/EmbeddedServer';
import { store } from '../src/store';

describe('EmbeddedServer', () => {
  let server: EmbeddedServer;
  let port: number;

  beforeAll(() => {
    port = 8081; // Use different port for testing
    server = new EmbeddedServer(store, port);
  });

  afterAll(async () => {
    if (server && server.isServerRunning()) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    test('should start server successfully', async () => {
      await expect(server.start()).resolves.toBeUndefined();
      expect(server.isServerRunning()).toBe(true);
      expect(server.getPort()).toBe(port);
    });

    test('should not start server twice', async () => {
      await expect(server.start()).rejects.toThrow('Server is already running');
    });

    test('should stop server successfully', async () => {
      await expect(server.stop()).resolves.toBeUndefined();
      expect(server.isServerRunning()).toBe(false);
    });

    test('should not stop server twice', async () => {
      await expect(server.stop()).rejects.toThrow('Server is not running');
    });
  });

  describe('Health Endpoint', () => {
    beforeAll(async () => {
      await server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    test('GET /health should return server status', async () => {
      const response = await request(`http://localhost:${port}`).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        server: {
          port,
          version: '1.0.0',
        },
      });

      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('appState');
      expect(response.body).toHaveProperty('metrics');
    });
  });

  describe('Documentation Endpoint', () => {
    beforeAll(async () => {
      await server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    test('GET /docs should return API documentation', async () => {
      const response = await request(`http://localhost:${port}`).get('/docs').expect(200);

      expect(response.body).toMatchObject({
        name: 'Mobile API Server',
        version: '1.0.0',
        description: 'Embedded HTTP server for mobile application control',
      });

      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('public');
      expect(response.body.endpoints).toHaveProperty('authentication');
      expect(response.body.endpoints).toHaveProperty('api');
    });
  });

  describe('404 Handler', () => {
    beforeAll(async () => {
      await server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    test('should return 404 for unknown endpoints', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Endpoint not found',
        path: '/unknown-endpoint',
      });

      expect(response.body).toHaveProperty('available_endpoints');
      expect(Array.isArray(response.body.available_endpoints)).toBe(true);
    });
  });
});
