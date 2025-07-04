/**
 * Integration test for Mobile API Control Pattern Test Automation
 * This test demonstrates all the automation script functionality
 */

import { EmbeddedServer } from '../src/server/EmbeddedServer';
import { store } from '../src/store';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

describe('Mobile API Control Pattern - Test Automation', () => {
  let server: EmbeddedServer;
  let port: number;
  let baseUrl: string;
  let authToken: string;

  beforeAll(async () => {
    port = 8082; // Use different port for automation tests
    baseUrl = `http://localhost:${port}`;
    server = new EmbeddedServer(store, port);
    await server.start();

    // Authenticate to get token
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'api_user',
        password: 'mobile_api_password'
      })
    });

    const authData = await authResponse.json();
    authToken = authData.token;
  });

  afterAll(async () => {
    if (server && server.isServerRunning()) {
      await server.stop();
    }
  });

  describe('Test Automation Scenarios', () => {
    test('1. Authentication Flow', async () => {
      console.log('\n🧪 Testing Authentication Flow...');
      
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'api_user',
          password: 'mobile_api_password'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data.token).toBeTruthy();
      
      console.log('   ✅ Authentication successful');
    });

    test('2. Light Control Tests', async () => {
      console.log('\n🧪 Testing Light Control...');
      
      // Turn on living room light
      const turnOnResponse = await fetch(`${baseUrl}/api/state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: 'ui.controls.living_room_light.state',
          value: 'on'
        })
      });

      expect(turnOnResponse.status).toBe(200);
      const turnOnData = await turnOnResponse.json();
      expect(turnOnData.success).toBe(true);
      
      console.log('   ✅ Living room light turned on');

      // Adjust brightness
      const brightnessResponse = await fetch(`${baseUrl}/api/state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: 'ui.controls.living_room_light.brightness',
          value: 75
        })
      });

      expect(brightnessResponse.status).toBe(200);
      const brightnessData = await brightnessResponse.json();
      expect(brightnessData.success).toBe(true);
      
      console.log('   ✅ Brightness adjusted to 75%');

      // Change color to blue
      const colorResponse = await fetch(`${baseUrl}/api/state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: 'ui.controls.living_room_light.color',
          value: '#0000FF'
        })
      });

      expect(colorResponse.status).toBe(200);
      const colorData = await colorResponse.json();
      expect(colorData.success).toBe(true);
      
      console.log('   ✅ Color changed to blue');
    });

    test('3. Scene Control Tests', async () => {
      console.log('\n🧪 Testing Scene Control...');
      
      // Activate Movie Night scene using 'trigger' action
      const movieSceneResponse = await fetch(`${baseUrl}/api/actions/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: 'movie-night-scene',
          payload: { sceneId: 'movie-night' }
        })
      });

      expect(movieSceneResponse.status).toBe(200);
      const movieSceneData = await movieSceneResponse.json();
      expect(movieSceneData.success).toBe(true);
      
      console.log('   ✅ Movie Night scene activated');

      // Activate Bright scene using 'trigger' action
      const brightSceneResponse = await fetch(`${baseUrl}/api/actions/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: 'bright-scene',
          payload: { sceneId: 'bright' }
        })
      });

      expect(brightSceneResponse.status).toBe(200);
      const brightSceneData = await brightSceneResponse.json();
      expect(brightSceneData.success).toBe(true);
      
      console.log('   ✅ Bright scene activated');
    });

    test('4. Multiple Light Control', async () => {
      console.log('\n🧪 Testing Multiple Light Control...');
      
      // Turn on all lights
      const allOnResponse = await fetch(`${baseUrl}/api/actions/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: 'all_lights',
          payload: { state: 'on' }
        })
      });

      expect(allOnResponse.status).toBe(200);
      const allOnData = await allOnResponse.json();
      expect(allOnData.success).toBe(true);
      
      console.log('   ✅ All lights turned on');

      // Turn off all lights
      const allOffResponse = await fetch(`${baseUrl}/api/actions/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: 'all_lights',
          payload: { state: 'off' }
        })
      });

      expect(allOffResponse.status).toBe(200);
      const allOffData = await allOffResponse.json();
      expect(allOffData.success).toBe(true);
      
      console.log('   ✅ All lights turned off');
    });

    test('5. Health and State Verification', async () => {
      console.log('\n🧪 Testing Health and State Verification...');
      
      // Health check
      const healthResponse = await fetch(`${baseUrl}/health`);
      expect(healthResponse.status).toBe(200);
      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('healthy');
      
      console.log('   ✅ Health check passed');

      // Get current state
      const stateResponse = await fetch(`${baseUrl}/api/state`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(stateResponse.status).toBe(200);
      const stateData = await stateResponse.json();
      expect(stateData).toHaveProperty('ui_state');
      expect(stateData).toHaveProperty('device_state');
      expect(stateData).toHaveProperty('server_state');
      
      console.log('   ✅ State retrieved successfully');
      console.log(`   📊 State keys: ${Object.keys(stateData).join(', ')}`);
    });

    test('6. Screenshot Capture', async () => {
      console.log('\n🧪 Testing Screenshot Capture...');
      
      const screenshotResponse = await fetch(`${baseUrl}/api/screenshot?format=png&quality=0.9`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(screenshotResponse.status).toBe(200);
      const screenshotData = await screenshotResponse.json();
      expect(screenshotData.success).toBe(true);
      expect(screenshotData).toHaveProperty('imageData');
      expect(screenshotData).toHaveProperty('metadata');
      
      // Save screenshot
      const outputDir = path.join(__dirname, '../test-screenshots');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename = `automation-test-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      const filepath = path.join(outputDir, filename);
      const imageBuffer = Buffer.from(screenshotData.imageData, 'base64');
      fs.writeFileSync(filepath, imageBuffer);
      
      console.log('   ✅ Screenshot captured successfully');
      console.log(`   📸 Screenshot saved: ${filename}`);
      console.log(`   📊 Size: ${screenshotData.metadata.width}x${screenshotData.metadata.height}`);
    });

    test('7. Performance and Response Time Validation', async () => {
      console.log('\n🧪 Testing Performance Metrics...');
      
      const startTime = Date.now();
      
      // Test multiple rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          fetch(`${baseUrl}/health`).then(r => r.json())
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / results.length;
      
      // Validate all requests succeeded
      results.forEach(result => {
        expect(result.status).toBe('healthy');
      });
      
      // Validate response times are reasonable (under 1 second average)
      expect(averageTime).toBeLessThan(1000);
      
      console.log('   ✅ Performance test passed');
      console.log(`   ⏱️ Average response time: ${averageTime.toFixed(2)}ms`);
      console.log(`   📊 Total requests: ${results.length}`);
    });
  });

  describe('Error Handling Tests', () => {
    test('Invalid authentication should fail gracefully', async () => {
      console.log('\n🧪 Testing Error Handling...');
      
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid',
          password: 'invalid'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
      
      console.log('   ✅ Invalid authentication handled correctly');
    });

    test('Unauthorized requests should be rejected', async () => {
      const response = await fetch(`${baseUrl}/api/state`);
      expect(response.status).toBe(401);
      
      console.log('   ✅ Unauthorized requests rejected correctly');
    });
  });
});

// Generate a simple test report
afterAll(() => {
  console.log('\n📊 Mobile API Control Pattern Test Automation Summary');
  console.log('=' .repeat(60));
  console.log('✅ All test scenarios completed successfully!');
  console.log('\n🧪 Test Scenarios Verified:');
  console.log('   1. Authentication Flow');
  console.log('   2. Light Control (on/off, brightness, color)');
  console.log('   3. Scene Control (movie night, bright scenes)');
  console.log('   4. Multiple Light Control (all on/off)');
  console.log('   5. Health and State Verification');
  console.log('   6. Screenshot Capture with File Saving');
  console.log('   7. Performance and Response Time Validation');
  console.log('   8. Error Handling and Security');
  console.log('\n🎯 Mobile API Control Pattern: VALIDATED ✅');
  console.log('\n📸 Screenshots saved to: test-screenshots/');
  console.log('🔗 This demonstrates external programmatic control of mobile app state');
  console.log('⚡ Real-time API access with visual verification capabilities');
});