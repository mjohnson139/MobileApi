import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Store } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import { serverConfig, securityConfig, validateConfig } from '../config';
import { ServerState, RequestMetric, HealthResponse } from '../types';
import authRoutes from './auth/authRoutes';
import { setupAPIRoutes } from './routes/apiRoutes';
import { requestLogger, createRateLimiter } from './middleware/auth';

// Conditionally import compression only in Node.js environments
let compression: any = null;
try {
  // Only import compression if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    compression = require('compression');
  }
} catch {
  // Silently fail in React Native environment
  compression = null;
}

export class EmbeddedServer {
  private app: Express;
  private server: any;
  private store: Store;
  private port: number;
  private isRunning: boolean = false;
  private startTime: number | null = null;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private metrics: RequestMetric[] = [];

  constructor(store: Store, port?: number) {
    // Validate configuration
    validateConfig();

    this.store = store;
    this.port = port || serverConfig.port;
    this.app = express();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy,
      }),
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: securityConfig.cors.origin,
        credentials: securityConfig.cors.credentials,
      }),
    );

    // Compression and parsing (only use compression in Node.js environments)
    if (compression) {
      this.app.use(compression());
    }
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    if (serverConfig.enableRequestLogging) {
      this.app.use(morgan('combined'));
      this.app.use(requestLogger);
    }

    // Rate limiting
    const rateLimiter = createRateLimiter(
      securityConfig.rateLimit.windowMs,
      securityConfig.rateLimit.max,
    );
    this.app.use(rateLimiter);

    // Custom request timing middleware
    this.app.use((req: Request, res: Response, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.recordRequestMetric(req.path, req.method, duration, res.statusCode, req);
      });

      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint (public)
    this.app.get('/health', this.healthCheck.bind(this));

    // Authentication routes
    this.app.use('/auth', authRoutes);

    // API routes (protected)
    this.app.use('/api', setupAPIRoutes(this.store));

    // Legacy routes for backward compatibility
    this.app.get('/state', (_req: Request, res: Response) => {
      res.redirect('/api/state');
    });

    this.app.post('/state', (_req: Request, res: Response) => {
      res.redirect(307, '/api/state');
    });

    this.app.post('/actions/:type', (req: Request, res: Response) => {
      res.redirect(307, `/api/actions/${req.params.type}`);
    });

    // API documentation endpoint
    this.app.get('/docs', (_req: Request, res: Response) => {
      res.json({
        name: 'Mobile API Server',
        version: '1.0.0',
        description: 'Embedded HTTP server for mobile application control',
        endpoints: {
          public: ['GET /health - Server health check', 'GET /docs - API documentation'],
          authentication: [
            'POST /auth/login - User login',
            'POST /auth/validate - Token validation',
            'POST /auth/refresh - Token refresh',
            'GET /auth/me - Current user info',
          ],
          api: [
            'GET /api/state - Get application state',
            'POST /api/state - Update application state',
            'POST /api/actions/:type - Execute actions',
            'GET /api/screenshot - Capture screenshot',
            'GET /api/metrics - Server metrics',
          ],
        },
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', this.notFoundHandler.bind(this));
  }

  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, _next: any) => {
      this.errorCount++;
      console.error('Server error:', err);

      // Update error count in store
      this.store.dispatch({
        type: 'server/recordError',
        payload: {
          error: err.message,
          path: req.path,
          timestamp: Date.now(),
        },
      });

      res.status(500).json({
        error: 'Internal server error',
        message: serverConfig.enableDebugMode ? err.message : 'Server error',
        timestamp: new Date().toISOString(),
      });
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    if (!serverConfig.enableApiServer) {
      throw new Error('API server is disabled in configuration');
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunning = true;
        this.startTime = Date.now();

        // Update server state in store
        this.store.dispatch({
          type: 'server/start',
          payload: {
            port: this.port,
            startTime: this.startTime,
          },
        });

        console.log(`Embedded server started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(err);
        }
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      throw new Error('Server is not running');
    }

    return new Promise((resolve, reject) => {
      this.server.close((err?: Error) => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunning = false;
        this.startTime = null;

        // Update server state in store
        this.store.dispatch({
          type: 'server/stop',
          payload: {},
        });

        console.log('Embedded server stopped');
        resolve();
      });
    });
  }

  public getStatus(): ServerState {
    return {
      isRunning: this.isRunning,
      port: this.port,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      metrics: this.metrics.slice(-100), // Keep last 100 metrics
    };
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }

  public getPort(): number {
    return this.port;
  }

  private healthCheck(_req: Request, res: Response): void {
    try {
      const state = this.store.getState();
      const serverStatus = this.getStatus();

      const response: HealthResponse = {
        status: 'healthy',
        uptime: serverStatus.uptime,
        timestamp: new Date().toISOString(),
        server: {
          port: this.port,
          version: '1.0.0',
        },
        appState: {
          deviceCount: Object.keys(state.devices?.devices || {}).length,
          currentScreen: state.ui?.currentScreen || 'unknown',
        },
        metrics: {
          requestCount: this.requestCount,
          errorCount: this.errorCount,
          averageResponseTime: this.calculateAverageResponseTime(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.originalUrl,
      available_endpoints: [
        'GET /health',
        'GET /docs',
        'POST /auth/login',
        'POST /auth/validate',
        'POST /auth/refresh',
        'GET /auth/me',
        'GET /api/state',
        'POST /api/state',
        'POST /api/actions/:type',
        'GET /api/screenshot',
        'GET /api/metrics',
      ],
      timestamp: new Date().toISOString(),
    });
  }

  private recordRequestMetric(
    path: string,
    method: string,
    duration: number,
    statusCode: number,
    req: Request,
  ): void {
    this.requestCount++;

    const metric: RequestMetric = {
      id: uuidv4(),
      method,
      path,
      statusCode,
      duration,
      timestamp: Date.now(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Dispatch action to update server metrics in Redux store
    this.store.dispatch({
      type: 'server/recordRequest',
      payload: metric,
    });
  }

  private calculateAverageResponseTime(): number {
    if (this.metrics.length === 0) {
      return 0;
    }

    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalTime / this.metrics.length;
  }
}
