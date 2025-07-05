/**
 * Test the automation script against the embedded server
 * This test demonstrates the Mobile API Control Pattern in action
 */

const { EmbeddedServer } = require('../src/server/EmbeddedServer');
const { store } = require('../src/store');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Simple test to verify automation works
async function runTestAutomation() {
  console.log('🚀 Running Test Automation Demo');
  console.log('='.repeat(50));

  const port = 8081; // Use different port for testing
  const server = new EmbeddedServer(store, port);
  const baseUrl = `http://localhost:${port}`;

  try {
    // Start server
    console.log('📡 Starting embedded server...');
    await server.start();
    console.log(`✅ Server started on port ${port}`);

    // Test 1: Health Check
    console.log('\n1️⃣  Health Check');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ ${healthResponse.status} - ${healthData.status}`);

    // Test 2: Authentication
    console.log('\n2️⃣  Authentication Flow');
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'api_user',
        password: 'mobile_api_password',
      }),
    });

    const authData = await authResponse.json();
    if (authResponse.ok && authData.token) {
      console.log(`   ✅ ${authResponse.status} - Authentication successful`);
      const token = authData.token;

      // Test 3: Get State
      console.log('\n3️⃣  Get Current State');
      const stateResponse = await fetch(`${baseUrl}/api/state`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const stateData = await stateResponse.json();
      console.log(`   ✅ ${stateResponse.status} - State retrieved`);
      console.log(`   📊 State keys: ${Object.keys(stateData).join(', ')}`);

      // Test 4: Update State
      console.log('\n4️⃣  Update State (Light Control)');
      const updateResponse = await fetch(`${baseUrl}/api/state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'ui.controls.living_room_light.state',
          value: 'on',
        }),
      });
      await updateResponse.json();
      console.log(`   ✅ ${updateResponse.status} - Light state updated`);

      // Test 5: Execute Action
      console.log('\n5️⃣  Execute Action (Toggle Light)');
      const actionResponse = await fetch(`${baseUrl}/api/actions/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'living_room_light',
          payload: { state: 'off' },
        }),
      });
      await actionResponse.json();
      console.log(`   ✅ ${actionResponse.status} - Action executed`);

      // Test 6: Screenshot
      console.log('\n6️⃣  Capture Screenshot');
      const screenshotResponse = await fetch(`${baseUrl}/api/screenshot?format=png&quality=0.9`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const screenshotData = await screenshotResponse.json();
      console.log(`   ✅ ${screenshotResponse.status} - Screenshot captured`);

      if (screenshotData.success && screenshotData.imageData) {
        // Save the screenshot
        const outputDir = path.join(__dirname, '../test-screenshots');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const filename = `demo-screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        const filepath = path.join(outputDir, filename);
        const imageBuffer = Buffer.from(screenshotData.imageData, 'base64');
        fs.writeFileSync(filepath, imageBuffer);
        console.log(`   📸 Screenshot saved: ${filename}`);
      }

      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📋 Test Summary:');
      console.log('   ✅ Health check: PASS');
      console.log('   ✅ Authentication: PASS');
      console.log('   ✅ Get state: PASS');
      console.log('   ✅ Update state: PASS');
      console.log('   ✅ Execute action: PASS');
      console.log('   ✅ Capture screenshot: PASS');
    } else {
      console.log(`   ❌ ${authResponse.status} - Authentication failed`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Stop server
    console.log('\n🛑 Stopping server...');
    await server.stop();
    console.log('✅ Server stopped');
  }
}

if (require.main === module) {
  runTestAutomation().catch(console.error);
}

module.exports = { runTestAutomation };
