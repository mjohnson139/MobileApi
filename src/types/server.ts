export interface ServerConfig {
  port: number;
  host: string;
  enableApiServer: boolean;
  corsOrigin: string | boolean;
  jwtSecret: string;
  jwtExpiry: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableRequestLogging: boolean;
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableReduxDevTools: boolean;
  enableDebugMode: boolean;
}

export interface ServerState {
  isRunning: boolean;
  port: number;
  startTime: number | null;
  uptime: number;
  requestCount: number;
  errorCount: number;
  metrics: RequestMetric[];
}

export interface RequestMetric {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
  tokenType: string;
  scope: string[];
}

export interface AuthUser {
  username: string;
  scope: string[];
  iat: number;
  exp: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface StateUpdateRequest {
  path: string;
  value: any;
}

export interface StateUpdateResponse {
  success: boolean;
  updated: {
    path: string;
    value: any;
    timestamp: string;
  };
}

export interface ActionRequest {
  type: string;
  target?: string;
  payload?: any;
}

export interface ActionResponse {
  success: boolean;
  action: {
    type: string;
    target?: string | undefined;
    payload?: any;
    executedAt: string;
  };
}

export interface ScreenshotRequest {
  format?: 'png' | 'jpg';
  quality?: number;
  width?: number;
  height?: number;
}

export interface ScreenshotResponse {
  success: boolean;
  imageData: string;
  format: string;
  capturedAt: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: string;
  server: {
    port: number;
    version: string;
  };
  appState: {
    deviceCount: number;
    currentScreen: string;
  };
  metrics: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
  };
}
