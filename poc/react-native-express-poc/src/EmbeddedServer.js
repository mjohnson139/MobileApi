/**
 * Embedded Express.js Server
 * Proof of concept implementation for mobile API server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

export class EmbeddedServer {
  constructor(port = 8080) {
    this.port = port;
    this.app = null;
    this.server = null;
    this.isRunning = false;
    this.startTime = null;

    this.initializeApp();
  }

  initializeApp() {
    this.app = express();

    // Security middleware
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
      }),

    // CORS configuration for mobile testing
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      }),

    // JSON parsing middleware
    this.app.use(express.json());

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });

    this.setupRoutes();
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const uptime = this.startTime ? Date.now() - this.startTime : 0;
      res.json({
        status: 'healthy',
        uptime,
        timestamp: new Date().toISOString(),
        port: this.port,
        version: '1.0.0-poc',
      });
    });

    // State management endpoint
    this.app.get('/state', (req, res) => {
      const mockState = {
        ui_state: {
          screen: 'home',
          controls: {
            living_room_light: {
              type: 'switch',
              state: 'on',
              brightness: 75,
            },
            bedroom_light: {
              type: 'switch',
              state: 'off',
            },
            thermostat: {
              type: 'temperature',
              current_temp: 72,
              target_temp: 70,
              mode: 'cool',
            }
          },
        },
        server_info: {
          uptime: this.startTime ? Date.now() - this.startTime : 0,
          memory_usage: this.getMemoryUsage(),
          timestamp: new Date().toISOString(),
        }
      };

      res.json(mockState);
    });

    // State update endpoint
    this.app.post('/state', (req, res) => {
      const { path, value } = req.body;

      if (!path) {
        return res.status(400).json({
          error: 'Missing required field: path',
        });
      }

      // Mock state update response
      res.json({
        success: true,
        updated: {
          path,
          value,
          timestamp: new Date().toISOString(),
        }
      });
    });

    // Action execution endpoint
    this.app.post('/actions/:type', (req, res) => {
      const { type } = req.params;
      const { target, payload } = req.body;

      // Mock action execution
      res.json({
        success: true,
        action: {
          type,
          target,
          payload,
          executed_at: new Date().toISOString(),
        }
      });
    });

    // Performance metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        server: {
          uptime: this.startTime ? Date.now() - this.startTime : 0,
          memory: this.getMemoryUsage(),
          port: this.port,
        },
        performance: {
          startup_time: this.startTime ? 'Measured on start()' : null,
          response_times: 'Available in benchmarks',
          memory_overhead: 'Available in benchmarks',
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        available_endpoints: [
          'GET /health',
          'GET /state',
          'POST /state',
          'POST /actions/:type',
          'GET /metrics',
        ]
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.server = this.app.listen(this.port, err => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunning = true;
        this.startTime = Date.now();
        const actualStartupTime = this.startTime - startTime;

        console.log(`Embedded server started on port ${this.port} in ${actualStartupTime}ms`);
        resolve({
          port: this.port,
          startup_time: actualStartupTime,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle server errors
      this.server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(err);
        }
      });
    });
  }

  async stop() {
    if (!this.isRunning || !this.server) {
      throw new Error('Server is not running');
    }

    return new Promise((resolve, reject) => {
      this.server.close(err => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunning = false;
        this.server = null;
        console.log('Embedded server stopped');
        resolve();
      });
    });
  }

  getMemoryUsage() {
    // Note: In React Native, process.memoryUsage() may not be available
    // This is a mock implementation for the PoC
    return {
      rss: '~25MB (estimated)',
      heapUsed: '~15MB (estimated)',
      heapTotal: '~20MB (estimated)',
      external: '~2MB (estimated)',
      note: 'Actual memory monitoring requires platform-specific implementation',
    };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      startTime: this.startTime,
    };
  }
}
