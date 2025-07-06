/**
 * Simple server startup script for test automation
 * This starts the embedded server without the demo functionality
 */

const { EmbeddedServer, store } = require('../src/index.ts');

async function startServer() {
  console.log('🚀 Starting Mobile API Server for Test Automation\n');

  const server = new EmbeddedServer(store, 8080);

  try {
    console.log('📡 Starting embedded server...');
    await server.start();
    console.log('✅ Server started on port 8080');
    console.log('🌐 API Base URL: http://localhost:8080');
    console.log('🔍 Health check: http://localhost:8080/health');
    console.log('\n📋 Available endpoints:');
    console.log('   POST /auth/login - Authentication');
    console.log('   GET  /api/state - Get current state');
    console.log('   POST /api/state - Update state');
    console.log('   POST /api/actions/:type - Execute actions');
    console.log('   GET  /api/screenshot - Capture screenshot');
    console.log('   GET  /health - Health check');
    console.log('\n⏹️  Press Ctrl+C to stop the server');

    // Keep the server running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      console.log('✅ Server stopped');
      process.exit(0);
    });

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
