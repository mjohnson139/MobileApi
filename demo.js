#!/usr/bin/env node

/**
 * Simple demo script to start a mock API server for test automation
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const JWT_SECRET = process.env.JWT_SECRET || 'mobile-api-secret-key-for-testing-purposes-only';
const PORT = process.env.API_PORT || 8080;

function createServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime() * 1000,
      timestamp: new Date().toISOString()
    });
  });
  
  // Authentication
  app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'api_user' && password === 'mobile_api_password') {
      const token = jwt.sign(
        { username, exp: Math.floor(Date.now() / 1000) + 3600 },
        JWT_SECRET
      );
      
      res.json({
        success: true,
        token,
        expires_in: 3600,
        user: { username }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  });
  
  // Middleware to verify token
  function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  // Mock app state
  let appState = {
    ui: {
      controls: {
        living_room_light: { state: 'off', brightness: 50, color: '#FFFFFF' },
        bedroom_light: { state: 'off', brightness: 100, color: '#FFFFFF' },
        kitchen_light: { state: 'off', brightness: 75, color: '#FFFFFF' }
      },
      scenes: {
        current: 'normal',
        available: ['normal', 'movie-night', 'bright', 'evening']
      }
    }
  };
  
  // Get current state
  app.get('/api/state', verifyToken, (req, res) => {
    res.json({
      success: true,
      ...appState
    });
  });
  
  // Update state
  app.post('/api/state', verifyToken, (req, res) => {
    const { path, value } = req.body;
    
    if (path && value !== undefined) {
      // Simple path update (e.g., "ui.controls.living_room_light.state")
      const pathParts = path.split('.');
      let current = appState;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      
      res.json({
        success: true,
        path,
        value,
        message: 'State updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid path or value'
      });
    }
  });
  
  // Execute actions
  app.post('/api/actions/toggle', verifyToken, (req, res) => {
    const { target, payload } = req.body;
    
    if (target && appState.ui.controls[target]) {
      const device = appState.ui.controls[target];
      device.state = device.state === 'on' ? 'off' : 'on';
      
      res.json({
        success: true,
        action: {
          type: 'toggle',
          target,
          payload: payload || {}
        },
        new_state: device.state
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid target device'
      });
    }
  });
  
  app.post('/api/actions/trigger', verifyToken, (req, res) => {
    const { target, payload } = req.body;
    
    if (target === 'movie-night-scene') {
      appState.ui.scenes.current = 'movie-night';
      appState.ui.controls.living_room_light = { state: 'on', brightness: 25, color: '#FF6B35' };
      appState.ui.controls.bedroom_light = { state: 'off', brightness: 0, color: '#FFFFFF' };
    } else if (target === 'bright-scene') {
      appState.ui.scenes.current = 'bright';
      Object.keys(appState.ui.controls).forEach(light => {
        appState.ui.controls[light] = { state: 'on', brightness: 100, color: '#FFFFFF' };
      });
    }
    
    res.json({
      success: true,
      action: {
        type: 'trigger_scene',
        target,
        payload: payload || {}
      },
      current_scene: appState.ui.scenes.current
    });
  });
  
  // Screenshot endpoint
  app.get('/api/screenshot', verifyToken, (req, res) => {
    const format = req.query.format || 'png';
    const quality = parseFloat(req.query.quality) || 0.9;
    
    // Mock base64 image data (small transparent PNG)
    const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    res.json({
      success: true,
      format,
      quality,
      imageData: mockImageData,
      metadata: {
        width: 390,
        height: 844,
        timestamp: new Date().toISOString(),
        device: 'Mobile API Demo'
      }
    });
  });
  
  // Metrics endpoint
  app.get('/api/metrics', verifyToken, (req, res) => {
    res.json({
      success: true,
      server_metrics: {
        requests_handled: Math.floor(Math.random() * 1000),
        error_count: Math.floor(Math.random() * 10),
        average_response_time: Math.random() * 100 + 50,
        uptime: process.uptime() * 1000
      }
    });
  });
  
  return app;
}

async function runDemo() {
  console.log('🚀 Mobile API Demo Server\n');
  
  const app = createServer();
  
  const server = app.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Login endpoint: http://localhost:${PORT}/auth/login`);
    console.log('\n🎯 Ready for test automation...\n');
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping server...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });
  
  return server;
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo, createServer };