#!/usr/bin/env node

/**
 * Simple JavaScript WebSocket Backend Server for Mobile API Control Pattern Demo
 */

const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Server configuration
const PORT = process.env.WEBSOCKET_PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'websocket-mobile-api-secret-key-for-testing-purposes-only';

// Mock user database
const USERS = {
  'api_user': '$2a$10$m9tB2.kJ.lEpltg17OtQF.Di3Ra44hKW/hplE2e11sqdoABCU6/Xq', // 'mobile_api_password'
  'test_user': '$2a$10$AhLdMPtl77p/jeoT1lyiruxiFXLAJmrvOziCj/rD7/dlgXCGBaslK', // 'test_password'
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
    },
  },
};

// Connected clients
const clients = new Map();

// Create HTTP server and WebSocket server
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

// Utility functions
function generateToken(username) {
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

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      username: decoded.sub,
      scope: decoded.scope ? decoded.scope.split(' ') : [],
    };
  } catch {
    return null;
  }
}

function sendMessage(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === 1) { // WebSocket.OPEN
    client.ws.send(JSON.stringify(message));
  }
}

function createResponse(requestId, type, success, data, error) {
  return {
    id: uuidv4(),
    type,
    timestamp: new Date().toISOString(),
    requestId,
    success,
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
  };
}

// Message handlers
async function handleAuthLogin(clientId, message) {
  const { username, password } = message.payload;
  
  try {
    const userHash = USERS[username];
    if (!userHash) {
      sendMessage(clientId, createResponse(
        message.id,
        'auth_login_response',
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
        'auth_login_response',
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
    }
    
    const responseData = {
      token,
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: ['read', 'write'],
      user: { username },
    };
    
    sendMessage(clientId, createResponse(
      message.id,
      'auth_login_response',
      true,
      responseData
    ));
    
  } catch {
    sendMessage(clientId, createResponse(
      message.id,
      'auth_login_response',
      false,
      undefined,
      'Authentication failed'
    ));
  }
}

function handleGetState(clientId, message) {
  const client = clients.get(clientId);
  if (!client?.authenticated) {
    sendMessage(clientId, createResponse(
      message.id,
      'get_state_response',
      false,
      undefined,
      'Authentication required'
    ));
    return;
  }
  
  const responseData = {
    ui_state: appState.ui_state,
    device_state: appState.device_state,
    timestamp: new Date().toISOString(),
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    'get_state_response',
    true,
    responseData
  ));
}

function handleGetHealth(clientId, message) {
  const responseData = {
    status: 'healthy',
    uptime: process.uptime() * 1000,
    timestamp: new Date().toISOString(),
    server: {
      version: '2.0.0',
      connections: clients.size,
    },
  };
  
  sendMessage(clientId, createResponse(
    message.id,
    'get_health_response',
    true,
    responseData
  ));
}

// Main message handler
function handleMessage(clientId, data) {
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'auth_login':
        handleAuthLogin(clientId, message);
        break;
      case 'get_state':
        handleGetState(clientId, message);
        break;
      case 'get_health':
        handleGetHealth(clientId, message);
        break;
      case 'ping':
        sendMessage(clientId, {
          id: uuidv4(),
          type: 'pong',
          timestamp: new Date().toISOString(),
          payload: message.payload,
        });
        break;
      default:
        sendMessage(clientId, createResponse(
          message.id,
          'error',
          false,
          undefined,
          `Unknown message type: ${message.type}`
        ));
    }
  } catch (error) {
    const errorMessage = {
      id: uuidv4(),
      type: 'error',
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message || 'Invalid message format',
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
  
  console.log(`Client connected: ${clientId} (${clients.size} active)`);
  
  // Send welcome message
  const welcomeMessage = {
    id: uuidv4(),
    type: 'connect',
    timestamp: new Date().toISOString(),
    payload: {
      clientId,
      serverVersion: '2.0.0',
      supportedFeatures: ['auth', 'state', 'health'],
    },
  };
  
  ws.send(JSON.stringify(welcomeMessage));
  
  ws.on('message', (data) => {
    handleMessage(clientId, data.toString());
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId} (${clients.size} active)`);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket Mobile API Server started on port ${PORT}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log('📋 Supported message types:');
  console.log('   • auth_login - User authentication');
  console.log('   • get_state - Get application state');
  console.log('   • get_health - Server health check');
  console.log('   • ping - Connection test');
  console.log('💡 Test credentials: api_user / mobile_api_password');
  console.log('✅ Ready for connections');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});