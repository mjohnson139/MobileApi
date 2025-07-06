#!/usr/bin/env node

/**
 * External WebSocket Backend Server for Mobile API Control Pattern
 * 
 * This replaces the embedded Express.js server and provides WebSocket-based
 * communication for testing and automation scenarios.
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  WebSocketMessage,
  WebSocketResponse,
  WebSocketMessageType,
  AuthLoginPayload,
  AuthLoginResponsePayload,
  AuthValidatePayload,
  AuthValidateResponsePayload,
  UpdateStatePayload,
  UpdateStateResponsePayload,
  ExecuteActionPayload,
  ExecuteActionResponsePayload,
  CaptureScreenshotPayload,
  CaptureScreenshotResponsePayload,
  GetHealthResponsePayload,
  GetMetricsResponsePayload,
  StateChangedPayload,
  MetricsUpdatePayload,
} from '../src/types/websocket';

// Server configuration
const PORT = process.env.WEBSOCKET_PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'websocket-mobile-api-secret-key-for-testing-purposes-only';
const PING_INTERVAL = 30000; // 30 seconds
const METRICS_UPDATE_INTERVAL = 5000; // 5 seconds

// Mock user database (in production, this would be a proper database)
const USERS = {
  'api_user': '$2a$10$m9tB2.kJ.lEpltg17OtQF.Di3Ra44hKW/hplE2e11sqdoABCU6/Xq', // bcrypt hash of 'mobile_api_password'
  'test_user': '$2a$10$AhLdMPtl77p/jeoT1lyiruxiFXLAJmrvOziCj/rD7/dlgXCGBaslK', // bcrypt hash of 'test_password'
};

// Application state storage
let appState = {
  ui_state: {
    currentScreen: 'home',
    controls: {
      living_room_light: {
        id: 'living_room_light',
        type: 'switch',
        state: { power: 'off', brightness: 75 },
        label: 'Living Room Light',
      },
      bedroom_light: {
        id: 'bedroom_light',
        type: 'switch',
        state: { power: 'off', brightness: 50 },
        label: 'Bedroom Light',
      },
      smart_lock: {
        id: 'smart_lock',
        type: 'lock',
        state: { locked: true },
        label: 'Front Door Lock',
      },
    },
  },
  device_state: {
    devices: {
      living_room_light: {
        id: 'living_room_light',
        name: 'Living Room Light',
        type: 'switch',
        state: { power: 'off', brightness: 75 },
        capabilities: ['power', 'brightness'],
        online: true,
      },
      bedroom_light: {
        id: 'bedroom_light',
        name: 'Bedroom Light',
        type: 'switch',
        state: { power: 'off', brightness: 50 },
        capabilities: ['power', 'brightness'],
        online: true,
      },
      smart_lock: {
        id: 'smart_lock',
        name: 'Front Door Lock',
        type: 'lock',
        state: { locked: true },
        capabilities: ['lock'],
        online: true,
      },
    },
  },
  server_state: {
    isRunning: true,
    startTime: Date.now(),
    port: PORT,
    connections: 0,
    authenticated: 0,
  },
};

// Server metrics
let serverMetrics = {
  connections: {
    total: 0,
    active: 0,
    authenticated: 0,
  },
  messages: {
    total: 0,
    successful: 0,
    errors: 0,
    averageResponseTime: 0,
  },
  uptime: 0,
  memoryUsage: {
    used: 0,
    total: 0,
  },
};

// Connected clients
const clients = new Map<string, {
  ws: any;
  id: string;
  authenticated: boolean;
  user?: string;
  connectedAt: number;
}>();

// Create HTTP server and WebSocket server
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

// Utility functions
function generateToken(username: string): string {
  return jwt.sign(
    { 
      sub: username, 
      scope: 'read write',
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '1h', algorithm: 'HS256' }
  );
}

function verifyToken(token: string): { username: string; scope: string[] } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      username: decoded.sub,
      scope: decoded.scope ? decoded.scope.split(' ') : [],
    };
  } catch {
    return null;
  }
}

function sendMessage(clientId: string, message: WebSocketMessage | WebSocketResponse): void {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === 1) { // WebSocket.OPEN
    client.ws.send(JSON.stringify(message));
  }
}

function broadcastMessage(message: WebSocketMessage, excludeClient?: string): void {
  clients.forEach((client, clientId) => {
    if (clientId !== excludeClient && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function createResponse<T>(
  requestId: string,
  type: WebSocketMessageType,
  success: boolean,
  data?: T,
  error?: string
): WebSocketResponse<T> {
  return {
    id: uuidv4(),
    type,
    timestamp: new Date().toISOString(),
    requestId,
    success,
    data,
    error,
  };
}

function updateStateByPath(path: string, value: any): void {
  const pathParts = path.split('.');
  let current = appState as any;
  
  // Navigate to the parent of the target property
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (current[pathParts[i]] === undefined) {
      current[pathParts[i]] = {};
    }
    current = current[pathParts[i]];
  }
  
  // Set the final value
  current[pathParts[pathParts.length - 1]] = value;
}

// Message handlers
async function handleAuthLogin(clientId: string, message: WebSocketMessage): Promise<void> {
  const { username, password } = message.payload as AuthLoginPayload;
  
  try {
    const userHash = USERS[username as keyof typeof USERS];
    if (!userHash) {
      sendMessage(clientId, createResponse(
        message.id,
        WebSocketMessageType.AUTH_LOGIN_RESPONSE,
        false,
        undefined,
        'Invalid credentials'
      ));
      return;
    }
    
    const isValid = await bcrypt.compare(password, userHash);
    if (!isValid) {
      sendMessage(clientId, createResponse(
        message.id,
        WebSocketMessageType.AUTH_LOGIN_RESPONSE,
        false,
        undefined,
        'Invalid credentials'
      ));
      return;
    }
    
    const token = generateToken(username);
    const client = clients.get(clientId);
    if (client) {
      client.authenticated = true;
      client.user = username;
      serverMetrics.connections.authenticated++;
    }
    
    const responseData: AuthLoginResponsePayload = {
      token,
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: ['read', 'write'],
      user: { username },
    };
    
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.AUTH_LOGIN_RESPONSE,
      true,
      responseData
    ));
    
  } catch {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.AUTH_LOGIN_RESPONSE,
      false,
      undefined,
      'Authentication failed'
    ));
  }
}

function handleAuthValidate(clientId: string, message: WebSocketMessage): void {
  const { token } = message.payload as AuthValidatePayload;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.AUTH_VALIDATE_RESPONSE,
      false,
      undefined,
      'Invalid token'
    ));
    return;
  }
  
  const responseData: AuthValidateResponsePayload = {
    valid: true,
    user: {
      username: decoded.username,
      scope: decoded.scope,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    WebSocketMessageType.AUTH_VALIDATE_RESPONSE,
    true,
    responseData
  ));
}

function handleGetState(clientId: string, message: WebSocketMessage): void {
  const client = clients.get(clientId);
  if (!client?.authenticated) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.GET_STATE_RESPONSE,
      false,
      undefined,
      'Authentication required'
    ));
    return;
  }
  
  const responseData = {
    ui_state: appState.ui_state,
    device_state: appState.device_state,
    server_state: {
      ...appState.server_state,
      uptime: Date.now() - appState.server_state.startTime,
    },
    timestamp: new Date().toISOString(),
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    WebSocketMessageType.GET_STATE_RESPONSE,
    true,
    responseData
  ));
}

function handleUpdateState(clientId: string, message: WebSocketMessage): void {
  const client = clients.get(clientId);
  if (!client?.authenticated) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.UPDATE_STATE_RESPONSE,
      false,
      undefined,
      'Authentication required'
    ));
    return;
  }
  
  const { path, value } = message.payload as UpdateStatePayload;
  
  try {
    updateStateByPath(path, value);
    
    const responseData: UpdateStateResponsePayload = {
      updated: {
        path,
        value,
        timestamp: new Date().toISOString(),
      },
    };
    
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.UPDATE_STATE_RESPONSE,
      true,
      responseData
    ));
    
    // Broadcast state change to other clients
    const stateChangeEvent: WebSocketMessage = {
      id: uuidv4(),
      type: WebSocketMessageType.STATE_CHANGED,
      timestamp: new Date().toISOString(),
      payload: {
        path,
        value,
        timestamp: new Date().toISOString(),
        source: 'api',
      } as StateChangedPayload,
    };
    
    broadcastMessage(stateChangeEvent, clientId);
    
  } catch {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.UPDATE_STATE_RESPONSE,
      false,
      undefined,
      'Failed to update state'
    ));
  }
}

function handleExecuteAction(clientId: string, message: WebSocketMessage): void {
  const client = clients.get(clientId);
  if (!client?.authenticated) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.EXECUTE_ACTION_RESPONSE,
      false,
      undefined,
      'Authentication required'
    ));
    return;
  }
  
  const { type, target, payload } = message.payload as ExecuteActionPayload;
  
  try {
    // Simulate action execution
    let result: any = null;
    
    switch (type) {
      case 'device_control':
        if (target && appState.device_state.devices[target]) {
          Object.assign(appState.device_state.devices[target].state, payload);
          result = { updated: appState.device_state.devices[target] };
        }
        break;
      case 'ui_interaction':
        if (target && appState.ui_state.controls[target]) {
          Object.assign(appState.ui_state.controls[target].state, payload);
          result = { updated: appState.ui_state.controls[target] };
        }
        break;
      case 'navigate':
        appState.ui_state.currentScreen = payload?.screen || 'home';
        result = { screen: appState.ui_state.currentScreen };
        break;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
    
    const responseData: ExecuteActionResponsePayload = {
      action: {
        type,
        target,
        payload,
        executedAt: new Date().toISOString(),
      },
      result,
    };
    
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.EXECUTE_ACTION_RESPONSE,
      true,
      responseData
    ));
    
  } catch (error) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.EXECUTE_ACTION_RESPONSE,
      false,
      undefined,
      error instanceof Error ? error.message : 'Action execution failed'
    ));
  }
}

function handleCaptureScreenshot(clientId: string, message: WebSocketMessage): void {
  const client = clients.get(clientId);
  if (!client?.authenticated) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.CAPTURE_SCREENSHOT_RESPONSE,
      false,
      undefined,
      'Authentication required'
    ));
    return;
  }
  
  const { format = 'png' } = message.payload as CaptureScreenshotPayload || {};
  
  // Mock screenshot data (in real implementation, this would capture the actual screen)
  const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA6fO3jAAAAABJRU5ErkJggg==';
  
  const responseData: CaptureScreenshotResponsePayload = {
    imageData: mockImageData,
    format,
    capturedAt: new Date().toISOString(),
    metadata: {
      width: 390,
      height: 844,
      size: mockImageData.length,
    },
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    WebSocketMessageType.CAPTURE_SCREENSHOT_RESPONSE,
    true,
    responseData
  ));
}

function handleGetHealth(clientId: string, message: WebSocketMessage): void {
  const responseData: GetHealthResponsePayload = {
    status: 'healthy',
    uptime: Date.now() - appState.server_state.startTime,
    timestamp: new Date().toISOString(),
    server: {
      version: '2.0.0',
      connections: serverMetrics.connections.active,
    },
    appState: {
      deviceCount: Object.keys(appState.device_state.devices).length,
      currentScreen: appState.ui_state.currentScreen,
    },
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    WebSocketMessageType.GET_HEALTH_RESPONSE,
    true,
    responseData
  ));
}

function handleGetMetrics(clientId: string, message: WebSocketMessage): void {
  const client = clients.get(clientId);
  if (!client?.authenticated) {
    sendMessage(clientId, createResponse(
      message.id,
      WebSocketMessageType.GET_METRICS_RESPONSE,
      false,
      undefined,
      'Authentication required'
    ));
    return;
  }
  
  const memUsage = process.memoryUsage();
  const responseData: GetMetricsResponsePayload = {
    connections: serverMetrics.connections,
    messages: serverMetrics.messages,
    uptime: Date.now() - appState.server_state.startTime,
    memoryUsage: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
    },
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    WebSocketMessageType.GET_METRICS_RESPONSE,
    true,
    responseData
  ));
}

function handlePing(clientId: string, message: WebSocketMessage): void {
  const pongMessage: WebSocketMessage = {
    id: uuidv4(),
    type: WebSocketMessageType.PONG,
    timestamp: new Date().toISOString(),
    payload: message.payload,
  };
  
  sendMessage(clientId, pongMessage);
}

// Main message handler
function handleMessage(clientId: string, data: string): void {
  const startTime = Date.now();
  
  try {
    const message: WebSocketMessage = JSON.parse(data);
    serverMetrics.messages.total++;
    
    switch (message.type) {
      case WebSocketMessageType.AUTH_LOGIN:
        handleAuthLogin(clientId, message);
        break;
      case WebSocketMessageType.AUTH_VALIDATE:
        handleAuthValidate(clientId, message);
        break;
      case WebSocketMessageType.GET_STATE:
        handleGetState(clientId, message);
        break;
      case WebSocketMessageType.UPDATE_STATE:
        handleUpdateState(clientId, message);
        break;
      case WebSocketMessageType.EXECUTE_ACTION:
        handleExecuteAction(clientId, message);
        break;
      case WebSocketMessageType.CAPTURE_SCREENSHOT:
        handleCaptureScreenshot(clientId, message);
        break;
      case WebSocketMessageType.GET_HEALTH:
        handleGetHealth(clientId, message);
        break;
      case WebSocketMessageType.GET_METRICS:
        handleGetMetrics(clientId, message);
        break;
      case WebSocketMessageType.PING:
        handlePing(clientId, message);
        break;
      default:
        sendMessage(clientId, createResponse(
          message.id,
          WebSocketMessageType.ERROR,
          false,
          undefined,
          `Unknown message type: ${message.type}`
        ));
    }
    
    // Update metrics
    const duration = Date.now() - startTime;
    serverMetrics.messages.successful++;
    serverMetrics.messages.averageResponseTime = 
      (serverMetrics.messages.averageResponseTime * (serverMetrics.messages.successful - 1) + duration) / 
      serverMetrics.messages.successful;
    
  } catch (error) {
    serverMetrics.messages.errors++;
    const errorMessage: WebSocketResponse = {
      id: uuidv4(),
      type: WebSocketMessageType.ERROR,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Invalid message format',
    };
    
    sendMessage(clientId, errorMessage);
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  
  clients.set(clientId, {
    ws,
    id: clientId,
    authenticated: false,
    connectedAt: Date.now(),
  });
  
  serverMetrics.connections.total++;
  serverMetrics.connections.active++;
  
  console.log(`Client connected: ${clientId} (${serverMetrics.connections.active} active)`);
  
  // Send welcome message
  const welcomeMessage: WebSocketMessage = {
    id: uuidv4(),
    type: WebSocketMessageType.CONNECT,
    timestamp: new Date().toISOString(),
    payload: {
      clientId,
      serverVersion: '2.0.0',
      supportedFeatures: ['auth', 'state', 'actions', 'screenshots', 'realtime'],
    },
  };
  
  ws.send(JSON.stringify(welcomeMessage));
  
  ws.on('message', (data) => {
    handleMessage(clientId, data.toString());
  });
  
  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client?.authenticated) {
      serverMetrics.connections.authenticated--;
    }
    
    clients.delete(clientId);
    serverMetrics.connections.active--;
    
    console.log(`Client disconnected: ${clientId} (${serverMetrics.connections.active} active)`);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
  
  // Set up ping interval for this client
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      const pingMessage: WebSocketMessage = {
        id: uuidv4(),
        type: WebSocketMessageType.PING,
        timestamp: new Date().toISOString(),
      };
      
      ws.send(JSON.stringify(pingMessage));
    } else {
      clearInterval(pingInterval);
    }
  }, PING_INTERVAL);
});

// Periodic metrics broadcast
setInterval(() => {
  const metricsUpdate: WebSocketMessage = {
    id: uuidv4(),
    type: WebSocketMessageType.METRICS_UPDATE,
    timestamp: new Date().toISOString(),
    payload: {
      metrics: {
        connections: serverMetrics.connections,
        messages: serverMetrics.messages,
        uptime: Date.now() - appState.server_state.startTime,
        memoryUsage: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
        },
      },
      timestamp: new Date().toISOString(),
    } as MetricsUpdatePayload,
  };
  
  broadcastMessage(metricsUpdate);
}, METRICS_UPDATE_INTERVAL);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`WebSocket Mobile API Server started on port ${PORT}`);
  console.log(`JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log('Ready for connections');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});