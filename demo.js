#!/usr/bin/env node

/**
 * Demo script to showcase the Core API Server functionality
 * Run with: node demo.js
 */

const { EmbeddedServer } = require('./dist/server/EmbeddedServer');
const { store } = require('./dist/store');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, options = {}) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function runDemo() {
  console.log('🚀 Mobile API Server Demo\n');

  // Create and start server
  const server = new EmbeddedServer(store, 8080);

  try {
    console.log('📡 Starting embedded server...');
    await server.start();
    console.log('✅ Server started on port 8080\n');

    const baseUrl = 'http://localhost:8080';

    // Test health endpoint
    console.log('🔍 Testing health endpoint...');
    const health = await makeRequest(`${baseUrl}/health`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Server Status: ${health.data.status}`);
    console.log(`   Uptime: ${health.data.uptime}ms\n`);

    // Test authentication
    console.log('🔐 Testing authentication...');
    const authResponse = await makeRequest(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'api_user',
        password: 'mobile_api_password',
      }),
    });

    if (authResponse.status === 200) {
      console.log('✅ Authentication successful');
      const token = authResponse.data.token;
      console.log(`   Token: ${token.substring(0, 20)}...`);
      console.log(`   Expires in: ${authResponse.data.expires_in} seconds\n`);

      // Test protected endpoints
      const authHeaders = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Get current state
      console.log('📊 Getting current application state...');
      const stateResponse = await makeRequest(`${baseUrl}/api/state`, {
        headers: authHeaders,
      });

      if (stateResponse.status === 200) {
        console.log('✅ State retrieved successfully');
        console.log(`   UI State: ${Object.keys(stateResponse.data.ui_state).length} properties`);
        console.log(
          `   Device State: ${Object.keys(stateResponse.data.device_state).length} properties`,
        );
        console.log(`   Server Uptime: ${stateResponse.data.server_state.uptime}ms\n`);
      }

      // Update state
      console.log('🔄 Updating application state...');
      const updateResponse = await makeRequest(`${baseUrl}/api/state`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          path: 'ui.controls.living_room_light.state',
          value: 'off',
        }),
      });

      if (updateResponse.status === 200) {
        console.log('✅ State updated successfully');
        console.log(
          `   Updated: ${updateResponse.data.updated.path} = ${updateResponse.data.updated.value}\n`,
        );

      // Execute action
      console.log('⚡ Executing device action...');
      const actionResponse = await makeRequest(`${baseUrl}/api/actions/toggle`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          target: 'bedroom_light',
          payload: {},
        }),
      });

      if (actionResponse.status === 200) {
        console.log('✅ Action executed successfully');
        console.log(
          `   Action: ${actionResponse.data.action.type} on ${actionResponse.data.action.target}\n`,
        );

      // Test screenshot
      console.log('📸 Testing screenshot endpoint...');
      const screenshotResponse = await makeRequest(
        `${baseUrl}/api/screenshot?format=png&quality=0.9`,
        {
          headers: authHeaders,
        },

      if (screenshotResponse.status === 200) {
        console.log('✅ Screenshot captured successfully');
        console.log(`   Format: ${screenshotResponse.data.format}`);
        console.log(
          `   Size: ${screenshotResponse.data.metadata.width}x${screenshotResponse.data.metadata.height}`,
        );
        console.log(`   Data length: ${screenshotResponse.data.imageData.length} characters\n`);
      }

      // Get metrics
      console.log('📈 Getting server metrics...');
      const metricsResponse = await makeRequest(`${baseUrl}/api/metrics`, {
        headers: authHeaders,
      });

      if (metricsResponse.status === 200) {
        console.log('✅ Metrics retrieved successfully');
        console.log(`   Requests handled: ${metricsResponse.data.server_metrics.requests_handled}`);
        console.log(`   Error count: ${metricsResponse.data.server_metrics.error_count}`);
        console.log(
          `   Average response time: ${metricsResponse.data.server_metrics.average_response_time.toFixed(
            2,
          )}ms\n`,
        );

    } else {
      console.log('❌ Authentication failed');
    }

    console.log('🏁 Demo completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    // Stop server
    console.log('\n🛑 Stopping server...');
    await server.stop();
    console.log('✅ Server stopped');
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };
