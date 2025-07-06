#!/usr/bin/env node

/**
 * Demo script for WebSocket Mobile API Server
 * 
 * This demo starts the WebSocket backend server and demonstrates
 * the mobile API control pattern using WebSocket communication.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WebSocket Mobile API Demo');
console.log('=====================================');

// Start the WebSocket server
const serverPath = path.join(__dirname, 'server');
console.log(`📂 Server path: ${serverPath}`);

console.log('📦 Installing server dependencies...');
const installProcess = spawn('npm', ['install'], {
  cwd: serverPath,
  stdio: 'inherit'
});

installProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to install server dependencies');
    process.exit(1);
  }

  console.log('✅ Server dependencies installed');
  console.log('🌐 Starting WebSocket server...');

  // Start the WebSocket server
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: serverPath,
    stdio: 'inherit'
  });

  serverProcess.on('close', (code) => {
    console.log(`📡 WebSocket server exited with code ${code}`);
  });

  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down WebSocket server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down WebSocket server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
});

installProcess.on('error', (error) => {
  console.error('❌ Error starting demo:', error.message);
  process.exit(1);
});