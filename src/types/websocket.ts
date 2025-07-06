/**
 * WebSocket Message Schema for Mobile API Control Pattern
 * 
 * This file defines the complete message schema for WebSocket communication
 * between the React Native mobile client and the external Node.js backend.
 */

// Base message structure
export interface WebSocketMessage {
  id: string; // Unique message ID for request/response correlation
  type: WebSocketMessageType;
  timestamp: string;
  payload?: any;
}

// Response wrapper for all WebSocket responses
export interface WebSocketResponse<T = any> extends WebSocketMessage {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string; // ID of the original request message
}

// All supported message types
export enum WebSocketMessageType {
  // Connection management
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  
  // Authentication
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGIN_RESPONSE = 'auth_login_response',
  AUTH_VALIDATE = 'auth_validate',
  AUTH_VALIDATE_RESPONSE = 'auth_validate_response',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_LOGOUT_RESPONSE = 'auth_logout_response',
  
  // State management
  GET_STATE = 'get_state',
  GET_STATE_RESPONSE = 'get_state_response',
  UPDATE_STATE = 'update_state',
  UPDATE_STATE_RESPONSE = 'update_state_response',
  STATE_CHANGED = 'state_changed', // Real-time state updates
  
  // Action execution
  EXECUTE_ACTION = 'execute_action',
  EXECUTE_ACTION_RESPONSE = 'execute_action_response',
  
  // Screenshot capture
  CAPTURE_SCREENSHOT = 'capture_screenshot',
  CAPTURE_SCREENSHOT_RESPONSE = 'capture_screenshot_response',
  
  // Health and metrics
  GET_HEALTH = 'get_health',
  GET_HEALTH_RESPONSE = 'get_health_response',
  GET_METRICS = 'get_metrics',
  GET_METRICS_RESPONSE = 'get_metrics_response',
  
  // Real-time events
  SERVER_STATUS_CHANGED = 'server_status_changed',
  METRICS_UPDATE = 'metrics_update',
  
  // Error handling
  ERROR = 'error',
}

// Authentication message payloads
export interface AuthLoginPayload {
  username: string;
  password: string;
}

export interface AuthLoginResponsePayload {
  token: string;
  expiresIn: number;
  tokenType: string;
  scope: string[];
  user: {
    username: string;
  };
}

export interface AuthValidatePayload {
  token: string;
}

export interface AuthValidateResponsePayload {
  valid: boolean;
  user?: {
    username: string;
    scope: string[];
    exp: number;
  };
}

// State management message payloads
export interface GetStatePayload {
  // Optional filters for specific state sections
  sections?: ('ui' | 'devices' | 'server')[];
}

export interface GetStateResponsePayload {
  ui_state: any;
  device_state: any;
  server_state: any;
  timestamp: string;
}

export interface UpdateStatePayload {
  path: string;
  value: any;
}

export interface UpdateStateResponsePayload {
  updated: {
    path: string;
    value: any;
    timestamp: string;
  };
}

export interface StateChangedPayload {
  path: string;
  value: any;
  timestamp: string;
  source: 'api' | 'ui' | 'system';
}

// Action execution message payloads
export interface ExecuteActionPayload {
  type: string;
  target?: string;
  payload?: any;
}

export interface ExecuteActionResponsePayload {
  action: {
    type: string;
    target?: string;
    payload?: any;
    executedAt: string;
  };
  result?: any;
}

// Screenshot capture message payloads
export interface CaptureScreenshotPayload {
  format?: 'png' | 'jpg';
  quality?: number;
  width?: number;
  height?: number;
}

export interface CaptureScreenshotResponsePayload {
  imageData: string;
  format: string;
  capturedAt: string;
  metadata: {
    width: number;
    height: number;
    size: number;
  };
}

// Health and metrics message payloads
export interface GetHealthResponsePayload {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: string;
  server: {
    version: string;
    connections: number;
  };
  appState: {
    deviceCount: number;
    currentScreen: string;
  };
}

export interface GetMetricsResponsePayload {
  connections: {
    total: number;
    active: number;
    authenticated: number;
  };
  messages: {
    total: number;
    successful: number;
    errors: number;
    averageResponseTime: number;
  };
  uptime: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
}

// Real-time event payloads
export interface ServerStatusChangedPayload {
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  details?: string;
  timestamp: string;
}

export interface MetricsUpdatePayload {
  metrics: GetMetricsResponsePayload;
  timestamp: string;
}

// Connection state for WebSocket client
export enum WebSocketConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// WebSocket client configuration
export interface WebSocketClientConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  responseTimeout: number;
  enableAutoReconnect: boolean;
}

// Event handlers for WebSocket client
export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onStateChange?: (state: WebSocketConnectionState) => void;
  onAuthenticated?: () => void;
  onAuthenticationFailed?: (error: string) => void;
}