# Implementation Guidelines

## Overview

This document provides comprehensive implementation guidelines for the Mobile API Control Pattern using the validated technology stack. These guidelines are based on the proof-of-concept implementations and performance benchmarks completed in Phase 1.5.

## Technology Stack

### Validated Stack
- **Mobile Platform**: React Native 0.74+
- **HTTP Server**: Express.js 4.18+ with Node.js 18+
- **State Management**: Redux + Redux Toolkit 1.9+
- **Authentication**: JWT + Passport.js
- **Screen Capture**: react-native-view-shot
- **Development Tools**: TypeScript, Jest, React Native Testing Library

## Project Setup

### 1. Environment Prerequisites

#### System Requirements
```bash
# Node.js and npm
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher

# React Native CLI
npm install -g react-native-cli

# iOS Development (macOS only)
xcode-select --install
# Xcode 12.0 or higher

# Android Development
# Android Studio with Android SDK 30+
# Java 11+ (OpenJDK recommended)
```

#### Development Tools
```bash
# Recommended IDE: Visual Studio Code
# Extensions:
# - React Native Tools
# - Redux DevTools
# - ES7+ React/Redux/React-Native snippets
# - Prettier - Code formatter
# - ESLint
```

### 2. Project Initialization

#### Create React Native Project
```bash
# Initialize project with TypeScript template
npx react-native init MobileApiProject --template react-native-template-typescript

cd MobileApiProject

# Clean and install dependencies
npm install
```

#### Install Core Dependencies
```bash
# HTTP Server
npm install express cors helmet compression morgan

# State Management
npm install @reduxjs/toolkit react-redux redux-persist

# Authentication
npm install jsonwebtoken passport passport-jwt bcryptjs

# Utilities
npm install react-native-view-shot
npm install @react-native-async-storage/async-storage
npm install react-native-get-random-values

# Development Dependencies
npm install --save-dev @types/express @types/jsonwebtoken @types/passport-jwt
npm install --save-dev @types/cors @types/compression @types/morgan
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
npm install --save-dev detox # For E2E testing
```

#### Platform Setup
```bash
# iOS setup
cd ios && pod install && cd ..

# Android setup (ensure Android SDK is configured)
npx react-native run-android --version # Verify Android setup
```

## Architecture Implementation

### 1. Project Structure

#### Recommended Directory Structure
```
src/
├── components/              # Reusable UI components
│   ├── common/             # Common components (Button, Input, etc.)
│   ├── device/             # Device-specific components
│   └── server/             # Server status components
├── screens/                # Application screens
│   ├── HomeScreen/
│   ├── SettingsScreen/
│   └── DeviceControlScreen/
├── navigation/             # Navigation configuration
├── store/                  # Redux store and state management
│   ├── slices/            # Redux Toolkit slices
│   ├── middleware/        # Custom middleware
│   └── index.ts           # Store configuration
├── server/                 # Embedded HTTP server
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── auth/              # Authentication logic
│   └── EmbeddedServer.ts  # Main server class
├── services/               # API and business logic services
│   ├── api/               # API client services
│   ├── device/            # Device management services
│   └── auth/              # Authentication services
├── types/                  # TypeScript type definitions
├── utils/                  # Helper functions and utilities
├── constants/              # Application constants
└── __tests__/             # Test files
```

### 2. Core Implementation

#### Embedded Server Implementation
```typescript
// src/server/EmbeddedServer.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Store } from '@reduxjs/toolkit';
import { setupAuthRoutes } from './auth/authRoutes';
import { setupAPIRoutes } from './routes/apiRoutes';

export class EmbeddedServer {
  private app: Express;
  private server: any;
  private store: Store;
  private port: number;
  private isRunning: boolean = false;

  constructor(store: Store, port: number = 8080) {
    this.store = store;
    this.port = port;
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'development' ? true : false,
      credentials: true,
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    this.app.use(morgan('combined'));

    // Custom request timing middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.recordRequestMetric(req.path, req.method, duration, res.statusCode);
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));

    // Authentication routes
    setupAuthRoutes(this.app);

    // API routes (protected)
    setupAPIRoutes(this.app, this.store);

    // 404 handler
    this.app.use('*', this.notFoundHandler);
  }

  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
      });
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunning = true;
        console.log(`Embedded server started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (err: Error) => {
        reject(err);
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
        console.log('Embedded server stopped');
        resolve();
      });
    });
  }

  private healthCheck(req: Request, res: Response): void {
    const state = this.store.getState();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      server: {
        port: this.port,
        version: '1.0.0'
      },
      app_state: {
        device_count: Object.keys(state.devices?.devices || {}).length,
        current_screen: state.ui?.currentScreen || 'unknown'
      }
    });
  }

  private notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.originalUrl,
      available_endpoints: [
        'GET /health',
        'POST /auth/login',
        'GET /api/state',
        'POST /api/state',
        'POST /api/actions/:type',
        'GET /api/screenshot'
      ]
    });
  }

  private recordRequestMetric(path: string, method: string, duration: number, statusCode: number): void {
    // Dispatch action to update server metrics in Redux store
    this.store.dispatch({
      type: 'server/recordRequest',
      payload: { path, method, duration, statusCode, timestamp: Date.now() }
    });
  }
}
```

#### Redux Store Configuration
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import uiSlice from './slices/uiSlice';
import deviceSlice from './slices/deviceSlice';
import serverSlice from './slices/serverSlice';
import authSlice from './slices/authSlice';

// Persistence configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['devices', 'auth'], // Only persist certain slices
  blacklist: ['ui'], // Don't persist UI state
};

const rootReducer = {
  ui: uiSlice,
  devices: persistReducer(persistConfig, deviceSlice),
  server: serverSlice,
  auth: authSlice,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### API Routes Implementation
```typescript
// src/server/routes/apiRoutes.ts
import { Express, Request, Response } from 'express';
import passport from 'passport';
import { Store } from '@reduxjs/toolkit';
import { captureScreen } from 'react-native-view-shot';

export function setupAPIRoutes(app: Express, store: Store): void {
  // Middleware for API authentication
  const authenticateAPI = passport.authenticate('jwt', { session: false });

  // State management endpoints
  app.get('/api/state', authenticateAPI, (req: Request, res: Response) => {
    try {
      const state = store.getState();
      res.json({
        ui_state: state.ui,
        device_state: state.devices,
        server_state: {
          ...state.server,
          // Don't expose sensitive server information
          config: undefined,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve state' });
    }
  });

  app.post('/api/state', authenticateAPI, (req: Request, res: Response) => {
    try {
      const { path, value } = req.body;

      if (!path) {
        return res.status(400).json({ error: 'Missing required field: path' });
      }

      // Dispatch action to update state
      store.dispatch({
        type: 'UPDATE_STATE_BY_PATH',
        payload: { path, value }
      });

      res.json({
        success: true,
        updated: { path, value },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update state' });
    }
  });

  // Action execution endpoint
  app.post('/api/actions/:type', authenticateAPI, (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const { target, payload } = req.body;

      // Dispatch action
      store.dispatch({
        type: `devices/execute${type.charAt(0).toUpperCase() + type.slice(1)}Action`,
        payload: { target, payload }
      });

      res.json({
        success: true,
        action: { type, target, payload },
        executed_at: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute action' });
    }
  });

  // Screenshot endpoint
  app.get('/api/screenshot', authenticateAPI, async (req: Request, res: Response) => {
    try {
      const { format = 'png', quality = 0.9 } = req.query;

      const screenshotUri = await captureScreen({
        format: format as 'png' | 'jpg',
        quality: Number(quality),
      });

      // Convert to base64 and return
      const fs = require('fs');
      const imageData = fs.readFileSync(screenshotUri, 'base64');

      res.json({
        image_data: imageData,
        format,
        captured_at: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to capture screenshot' });
    }
  });

  // Server metrics endpoint
  app.get('/api/metrics', authenticateAPI, (req: Request, res: Response) => {
    try {
      const state = store.getState();
      res.json({
        server_metrics: state.server.metrics,
        performance: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
  });
}
```

## Authentication Implementation

### JWT Configuration
```typescript
// src/server/auth/jwtConfig.ts
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = '1h';

export const jwtConfig = {
  secretOrKey: JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  algorithms: ['HS256'],
};

// JWT Passport strategy
passport.use(new JwtStrategy(jwtConfig, (payload, done) => {
  // In production, validate against user database
  if (payload && payload.sub) {
    return done(null, { id: payload.sub, scope: payload.scope });
  }
  return done(null, false);
}));

export function generateToken(userId: string, scope: string[] = ['read', 'write']): string {
  const payload = {
    sub: userId,
    scope: scope.join(' '),
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Authentication Routes
```typescript
// src/server/auth/authRoutes.ts
import { Express, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from './jwtConfig';

export function setupAuthRoutes(app: Express): void {
  // Login endpoint
  app.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password required' 
        });
      }

      // In production, validate against secure user store
      const validCredentials = await validateCredentials(username, password);
      
      if (!validCredentials) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }

      const token = generateToken(username, ['read', 'write']);

      res.json({
        success: true,
        token,
        expires_in: 3600, // 1 hour
        token_type: 'Bearer',
        scope: 'read write',
      });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Token validation endpoint
  app.post('/auth/validate', (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    try {
      const decoded = verifyToken(token);
      res.json({
        valid: true,
        user: decoded.sub,
        scope: decoded.scope,
        expires_at: decoded.exp,
      });
    } catch (error) {
      res.status(401).json({ 
        valid: false, 
        error: 'Invalid token' 
      });
    }
  });
}

async function validateCredentials(username: string, password: string): Promise<boolean> {
  // In production, implement proper user authentication
  // This is a simplified example for PoC
  const validUsers = {
    'api_user': '$2a$10$...' // bcrypt hash of 'mobile_api_password'
  };

  if (!validUsers[username]) {
    return false;
  }

  return await bcrypt.compare(password, validUsers[username]);
}
```

## Testing Strategy

### 1. Unit Testing

#### Redux State Testing
```typescript
// src/__tests__/store/deviceSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import deviceSlice, { setDeviceState, addDevice } from '../store/slices/deviceSlice';

describe('Device Slice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: { devices: deviceSlice },
    });
  });

  test('should set device state', () => {
    const deviceId = 'test_light';
    const updates = { brightness: 75, power: 'on' };

    store.dispatch(setDeviceState({ deviceId, updates }));

    const state = store.getState().devices;
    expect(state.devices[deviceId].state).toMatchObject(updates);
  });

  test('should add new device', () => {
    const device = {
      id: 'new_device',
      name: 'New Device',
      type: 'switch',
      room: 'test_room',
      state: { power: 'off' },
    };

    store.dispatch(addDevice(device));

    const state = store.getState().devices;
    expect(state.devices[device.id]).toBeDefined();
    expect(state.devices[device.id].name).toBe(device.name);
  });
});
```

#### Server Testing
```typescript
// src/__tests__/server/EmbeddedServer.test.ts
import request from 'supertest';
import { EmbeddedServer } from '../server/EmbeddedServer';
import { store } from '../store';

describe('Embedded Server', () => {
  let server: EmbeddedServer;

  beforeAll(async () => {
    server = new EmbeddedServer(store, 8081);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  test('GET /health should return server status', async () => {
    const response = await request(server.app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body.server.port).toBe(8081);
  });

  test('POST /auth/login should return JWT token', async () => {
    const response = await request(server.app)
      .post('/auth/login')
      .send({ username: 'api_user', password: 'mobile_api_password' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
```

### 2. Integration Testing

#### End-to-End API Testing
```typescript
// src/__tests__/integration/api.test.ts
import { EmbeddedServer } from '../server/EmbeddedServer';
import { store } from '../store';
import { generateToken } from '../server/auth/jwtConfig';

describe('API Integration', () => {
  let server: EmbeddedServer;
  let authToken: string;

  beforeAll(async () => {
    server = new EmbeddedServer(store, 8082);
    await server.start();
    authToken = generateToken('test_user', ['read', 'write']);
  });

  afterAll(async () => {
    await server.stop();
  });

  test('should complete full device control workflow', async () => {
    // 1. Get initial state
    const stateResponse = await request(server.app)
      .get('/api/state')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(stateResponse.body.device_state).toBeDefined();

    // 2. Update device state
    const updateResponse = await request(server.app)
      .post('/api/state')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        path: 'devices.living_room_light.state.brightness',
        value: 85
      })
      .expect(200);

    expect(updateResponse.body.success).toBe(true);

    // 3. Execute device action
    const actionResponse = await request(server.app)
      .post('/api/actions/tap')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        target: 'living_room_light',
        payload: { coordinate: { x: 100, y: 200 } }
      })
      .expect(200);

    expect(actionResponse.body.success).toBe(true);
  });
});
```

## Performance Optimization

### 1. Redux Performance

#### Memoized Selectors
```typescript
// src/store/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Basic selectors
export const selectDevices = (state: RootState) => state.devices.devices;
export const selectRooms = (state: RootState) => state.devices.rooms;
export const selectCurrentScreen = (state: RootState) => state.ui.currentScreen;

// Memoized selectors for performance
export const selectDevicesByRoom = createSelector(
  [selectDevices, selectRooms, (state: RootState, roomId: string) => roomId],
  (devices, rooms, roomId) => {
    const room = rooms[roomId];
    if (!room) return [];
    
    return room.devices.map(deviceId => devices[deviceId]).filter(Boolean);
  }
);

export const selectActiveDevices = createSelector(
  [selectDevices],
  (devices) => Object.values(devices).filter(device => device.online)
);

export const selectDeviceMetrics = createSelector(
  [selectDevices],
  (devices) => ({
    total: Object.keys(devices).length,
    online: Object.values(devices).filter(d => d.online).length,
    offline: Object.values(devices).filter(d => !d.online).length,
  })
);
```

#### Performance Middleware
```typescript
// src/store/middleware/performanceMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';

export const performanceMiddleware: Middleware = (store) => (next) => (action) => {
  const startTime = performance.now();
  const result = next(action);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  
  // Log slow actions in development
  if (__DEV__ && duration > 10) {
    console.warn(`Slow action detected: ${action.type} took ${duration.toFixed(2)}ms`);
  }
  
  // Record performance metrics
  store.dispatch({
    type: 'performance/recordActionDuration',
    payload: { action: action.type, duration }
  });
  
  return result;
};
```

### 2. Server Performance

#### Response Caching
```typescript
// src/server/middleware/cacheMiddleware.ts
import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function cacheMiddleware(ttlSeconds: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlSeconds
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
}
```

#### Request Rate Limiting
```typescript
// src/server/middleware/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit auth attempts
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});
```

## Security Best Practices

### 1. Environment Configuration

#### Environment Variables
```bash
# .env file
NODE_ENV=development
JWT_SECRET=your-256-bit-secret-key-here
API_PORT=8080
CORS_ORIGIN=http://localhost:*
ENABLE_API_SERVER=true
LOG_LEVEL=info

# Production overrides
# NODE_ENV=production
# JWT_SECRET=production-secret-from-secure-storage
# CORS_ORIGIN=false
# ENABLE_API_SERVER=false
```

#### Security Configuration
```typescript
// src/config/security.ts
export const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h',
    algorithm: 'HS256' as const,
  },
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? process.env.CORS_ORIGIN || true 
      : false,
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
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  },
};
```

### 2. Input Validation

#### Request Validation Middleware
```typescript
// src/server/middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Schema definitions
const stateUpdateSchema = z.object({
  path: z.string().min(1),
  value: z.any(),
});

const actionSchema = z.object({
  target: z.string().min(1),
  payload: z.object({}).optional(),
});

export function validateStateUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    stateUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Invalid request body',
      details: error.errors,
    });
  }
}

export function validateAction(req: Request, res: Response, next: NextFunction) {
  try {
    actionSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Invalid action payload',
      details: error.errors,
    });
  }
}
```

## Deployment Guidelines

### 1. Development Build

#### Build Configuration
```bash
# Development build
npm run android:dev
npm run ios:dev

# Enable debugging
npm run start -- --reset-cache

# Run with specific device
npm run android -- --deviceId=emulator-5554
npm run ios -- --simulator="iPhone 14 Pro"
```

### 2. Production Build

#### Production Optimization
```bash
# Production build
npm run android:release
npm run ios:release

# Bundle analysis
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android.bundle.js \
  --assets-dest ./dist/assets
```

#### Security for Production
```typescript
// src/config/production.ts
export const productionConfig = {
  // Disable API server in production builds
  enableAPIServer: false,
  
  // Secure defaults
  jwt: {
    secret: getSecureSecret(), // From secure key management
    expiresIn: '30m', // Shorter expiry for production
  },
  
  // Disable debugging
  enableReduxDevTools: false,
  enableLogging: false,
  
  // Security headers
  enableHSTS: true,
  enableCSP: true,
};
```

## Monitoring and Debugging

### 1. Development Tools

#### Redux DevTools Setup
```typescript
// src/store/devTools.ts
import { composeWithDevTools } from 'redux-devtools-extension';

export const composeEnhancers = 
  __DEV__ && composeWithDevTools ? 
    composeWithDevTools({
      name: 'Mobile API Control',
      trace: true,
      traceLimit: 25,
    }) : 
    compose;
```

#### React Native Debugger Integration
```typescript
// src/utils/debugging.ts
export function setupDebugging() {
  if (__DEV__) {
    // Enable network debugging
    GLOBAL.XMLHttpRequest = GLOBAL.originalXMLHttpRequest || GLOBAL.XMLHttpRequest;
    GLOBAL.FormData = GLOBAL.originalFormData || GLOBAL.FormData;
    
    // Enable Redux debugging
    if (console.tron) {
      console.tron.display({
        name: 'Mobile API Control',
        value: 'Development mode enabled',
        important: true,
      });
    }
  }
}
```

### 2. Performance Monitoring

#### Performance Metrics Collection
```typescript
// src/utils/performanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  getAllMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, any> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageMetric(name),
        count: values.length,
        latest: values[values.length - 1] || 0,
      };
    }
    
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

## Conclusion

These implementation guidelines provide a comprehensive foundation for developing the Mobile API Control Pattern using the validated technology stack. The guidelines cover:

- ✅ **Complete project setup** with all necessary dependencies
- ✅ **Architecture implementation** with proven patterns
- ✅ **Security best practices** with JWT authentication
- ✅ **Performance optimization** strategies
- ✅ **Testing approaches** for reliability
- ✅ **Deployment considerations** for production

Following these guidelines will ensure a robust, secure, and performant implementation of the Mobile API Control Pattern.

**Next Steps**: Begin Phase 2 implementation using these guidelines as the foundation for the core API server development.