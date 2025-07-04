/**
 * Server State Slice
 * Manages embedded HTTP server state and API synchronization
 */

const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');

// Async thunks for server operations
const startServer = createAsyncThunk(
  'server/start',
  async ({ port = 8080 }, { rejectWithValue }) => {
    try {
      // Simulate server startup
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate startup time
      
      return {
        port,
        startupTime: Date.now() - startTime,
        startedAt: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const stopServer = createAsyncThunk(
  'server/stop',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate server shutdown
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        stoppedAt: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const syncWithAPI = createAsyncThunk(
  'server/syncWithAPI',
  async ({ endpoint, data }, { getState, rejectWithValue }) => {
    try {
      // Simulate API synchronization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        endpoint,
        data,
        syncedAt: Date.now(),
        success: true,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Server status
  isRunning: false,
  port: 8080,
  startedAt: null,
  uptime: 0,
  
  // Server configuration
  config: {
    cors: {
      enabled: true,
      origins: ['*'],
    },
    security: {
      helmet: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
      },
    },
    logging: {
      enabled: true,
      level: 'info',
    },
  },
  
  // API endpoints status
  endpoints: {
    '/health': { active: true, lastAccessed: null, requestCount: 0 },
    '/state': { active: true, lastAccessed: null, requestCount: 0 },
    '/actions/:type': { active: true, lastAccessed: null, requestCount: 0 },
    '/screenshot': { active: false, lastAccessed: null, requestCount: 0 },
    '/auth/login': { active: false, lastAccessed: null, requestCount: 0 },
    '/metrics': { active: true, lastAccessed: null, requestCount: 0 },
  },
  
  // Request tracking
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    recentRequests: [], // Last 20 requests
  },
  
  // API synchronization state
  sync: {
    lastSyncTime: null,
    syncStatus: 'idle', // 'idle', 'syncing', 'success', 'error'
    pendingOperations: [],
    failedOperations: [],
  },
  
  // Loading states
  loading: {
    starting: false,
    stopping: false,
    syncing: false,
  },
  
  // Error states
  errors: {
    server: null,
    sync: null,
  },
  
  // Performance metrics
  metrics: {
    memoryUsage: {
      baseline: 0,
      current: 0,
      peak: 0,
    },
    performance: {
      startupTime: null,
      averageResponseTime: 0,
      requestsPerSecond: 0,
    },
    health: {
      status: 'unknown', // 'healthy', 'degraded', 'unhealthy'
      lastCheck: null,
      checks: {
        memory: 'ok',
        cpu: 'ok',
        network: 'ok',
      },
    },
  },
};

const serverStateSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    // Server configuration updates
    updateServerConfig: (state, action) => {
      const { section, updates } = action.payload;
      
      if (state.config[section]) {
        state.config[section] = { ...state.config[section], ...updates };
      }
    },
    
    // Port configuration
    setServerPort: (state, action) => {
      if (!state.isRunning) {
        state.port = action.payload;
      }
    },
    
    // Endpoint management
    enableEndpoint: (state, action) => {
      const endpoint = action.payload;
      if (state.endpoints[endpoint]) {
        state.endpoints[endpoint].active = true;
      }
    },
    
    disableEndpoint: (state, action) => {
      const endpoint = action.payload;
      if (state.endpoints[endpoint]) {
        state.endpoints[endpoint].active = false;
      }
    },
    
    // Request tracking
    recordRequest: (state, action) => {
      const { endpoint, method, responseTime, statusCode } = action.payload;
      
      // Update endpoint stats
      if (state.endpoints[endpoint]) {
        state.endpoints[endpoint].lastAccessed = Date.now();
        state.endpoints[endpoint].requestCount += 1;
      }
      
      // Update overall request stats
      state.requests.total += 1;
      if (statusCode < 400) {
        state.requests.successful += 1;
      } else {
        state.requests.failed += 1;
      }
      
      // Update average response time
      const currentAvg = state.requests.averageResponseTime;
      const total = state.requests.total;
      state.requests.averageResponseTime = ((currentAvg * (total - 1)) + responseTime) / total;
      
      // Add to recent requests
      state.requests.recentRequests.unshift({
        endpoint,
        method,
        responseTime,
        statusCode,
        timestamp: Date.now(),
      });
      
      // Keep only last 20 requests
      if (state.requests.recentRequests.length > 20) {
        state.requests.recentRequests = state.requests.recentRequests.slice(0, 20);
      }
    },
    
    // Update server uptime
    updateUptime: (state) => {
      if (state.isRunning && state.startedAt) {
        state.uptime = Date.now() - state.startedAt;
      }
    },
    
    // Health check updates
    updateHealthStatus: (state, action) => {
      const { status, checks } = action.payload;
      
      state.metrics.health.status = status;
      state.metrics.health.lastCheck = Date.now();
      
      if (checks) {
        state.metrics.health.checks = { ...state.metrics.health.checks, ...checks };
      }
    },
    
    // Performance metrics updates
    updatePerformanceMetrics: (state, action) => {
      const { memoryUsage, performance } = action.payload;
      
      if (memoryUsage) {
        state.metrics.memoryUsage = { ...state.metrics.memoryUsage, ...memoryUsage };
      }
      
      if (performance) {
        state.metrics.performance = { ...state.metrics.performance, ...performance };
      }
    },
    
    // Clear server errors
    clearServerError: (state) => {
      state.errors.server = null;
    },
    
    clearSyncError: (state) => {
      state.errors.sync = null;
    },
    
    // Add pending sync operation
    addPendingSync: (state, action) => {
      state.sync.pendingOperations.push({
        id: Date.now(),
        operation: action.payload,
        timestamp: Date.now(),
      });
    },
    
    // Remove pending sync operation
    removePendingSync: (state, action) => {
      const id = action.payload;
      state.sync.pendingOperations = state.sync.pendingOperations.filter(op => op.id !== id);
    },
    
    // Reset server state
    resetServerState: () => initialState,
  },
  
  extraReducers: (builder) => {
    builder
      // Start server
      .addCase(startServer.pending, (state) => {
        state.loading.starting = true;
        state.errors.server = null;
      })
      .addCase(startServer.fulfilled, (state, action) => {
        const { port, startupTime, startedAt } = action.payload;
        
        state.loading.starting = false;
        state.isRunning = true;
        state.port = port;
        state.startedAt = startedAt;
        state.uptime = 0;
        state.metrics.performance.startupTime = startupTime;
        
        // Reset request counts
        state.requests.total = 0;
        state.requests.successful = 0;
        state.requests.failed = 0;
        state.requests.recentRequests = [];
      })
      .addCase(startServer.rejected, (state, action) => {
        state.loading.starting = false;
        state.errors.server = action.payload;
      })
      
      // Stop server
      .addCase(stopServer.pending, (state) => {
        state.loading.stopping = true;
        state.errors.server = null;
      })
      .addCase(stopServer.fulfilled, (state, action) => {
        state.loading.stopping = false;
        state.isRunning = false;
        state.startedAt = null;
        state.uptime = 0;
        
        // Reset endpoint access times
        Object.keys(state.endpoints).forEach(endpoint => {
          state.endpoints[endpoint].lastAccessed = null;
        });
      })
      .addCase(stopServer.rejected, (state, action) => {
        state.loading.stopping = false;
        state.errors.server = action.payload;
      })
      
      // Sync with API
      .addCase(syncWithAPI.pending, (state) => {
        state.loading.syncing = true;
        state.sync.syncStatus = 'syncing';
        state.errors.sync = null;
      })
      .addCase(syncWithAPI.fulfilled, (state, action) => {
        const { endpoint, data, syncedAt } = action.payload;
        
        state.loading.syncing = false;
        state.sync.syncStatus = 'success';
        state.sync.lastSyncTime = syncedAt;
        
        // Remove any related pending operations
        state.sync.pendingOperations = state.sync.pendingOperations.filter(
          op => op.operation.endpoint !== endpoint
        );
      })
      .addCase(syncWithAPI.rejected, (state, action) => {
        state.loading.syncing = false;
        state.sync.syncStatus = 'error';
        state.errors.sync = action.payload;
        
        // Move failed operation to failed list
        state.sync.failedOperations.push({
          error: action.payload,
          timestamp: Date.now(),
          operation: action.meta.arg,
        });
      });
  },
});

module.exports = {
  serverStateSlice,
  startServer,
  stopServer,
  syncWithAPI,
};