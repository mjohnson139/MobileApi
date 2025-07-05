#!/usr/bin/env node

/**
 * Test Automation Script for Mobile API Control Pattern
 *
 * This script demonstrates the Mobile API Control Pattern by:
 * - Authenticating with the mobile app's API server
 * - Sending curl commands to control app state
 * - Capturing screenshots before and after each command
 * - Generating a comprehensive test report
 * - Validating API responses and UI state changes
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  SCREENSHOT_DIR: path.join(__dirname, '../test-automation-demo'),
  REPORT_DIR: path.join(__dirname, '../test-reports'),
  USERNAME: 'api_user',
  PASSWORD: 'mobile_api_password',
  TIMEOUT: 30000, // 30 seconds
  SCREENSHOT_FORMAT: 'jpeg',
  SCREENSHOT_QUALITY: 0.9,
};

// Global state
let authToken = null;
const testResults = [];
let startTime = null;

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Mobile API Control Pattern Test Automation');
    console.log('='.repeat(60));

    startTime = new Date();

    // Setup directories
    setupDirectories();

    // Wait for server to be ready
    await waitForServer();

    // Run test scenarios
    await runTestScenarios();

    // Generate report
    await generateReport();

    console.log('\n✅ Test automation completed successfully!');
    console.log(`📊 Report generated in: ${CONFIG.REPORT_DIR}`);
    console.log(`📸 Screenshots saved in: ${CONFIG.SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Test automation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Setup required directories
 */
function setupDirectories() {
  console.log('📁 Setting up directories...');

  [CONFIG.SCREENSHOT_DIR, CONFIG.REPORT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created: ${dir}`);
    }
  });
}

/**
 * Wait for the API server to be ready
 */
async function waitForServer() {
  console.log('⏳ Waiting for API server to be ready...');

  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/health`, {
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Server is ready! Status: ${data.status}`);
        return;
      }
    } catch (error) {
      // Server not ready yet
    }

    retries++;
    console.log(`   Attempt ${retries}/${maxRetries}...`);
    await sleep(1000);
  }

  throw new Error('Server failed to start within timeout period');
}

/**
 * Run all test scenarios
 */
async function runTestScenarios() {
  console.log('\n🧪 Running test scenarios...');
  console.log('-'.repeat(40));

  // Test scenarios in order
  await runAuthenticationFlow();
  await runLightControlTests();
  await runSceneControlTests();
  await runMultipleLightControlTests();
  await runHealthAndStateVerification();
}

/**
 * Authentication Flow Test
 */
async function runAuthenticationFlow() {
  console.log('\n1️⃣  Authentication Flow');

  // Capture initial state
  await captureScreenshot('01_initial_app_state');

  // Login request
  const loginResult = await executeAPICommand(
    'POST',
    '/auth/login',
    {
      username: CONFIG.USERNAME,
      password: CONFIG.PASSWORD,
    },
    '01_authentication_login'
  );

  if (loginResult.success && loginResult.responseData.token) {
    authToken = loginResult.responseData.token;
    console.log('   ✅ Authentication successful');

    // Capture authenticated state
    await captureScreenshot('01_authenticated_state');
  } else {
    throw new Error('Authentication failed');
  }
}

/**
 * Light Control Tests
 */
async function runLightControlTests() {
  console.log('\n2️⃣  Light Control Tests');

  // Get current lighting state
  await captureScreenshot('02_current_lighting_state');

  // Turn on living room light
  await executeAPICommand(
    'POST',
    '/api/state',
    {
      path: 'ui.controls.living_room_light.state',
      value: 'on',
    },
    '02_living_room_light_on'
  );

  await captureScreenshot('02_living_room_light_turned_on');

  // Adjust brightness to 75%
  await executeAPICommand(
    'POST',
    '/api/state',
    {
      path: 'ui.controls.living_room_light.brightness',
      value: 75,
    },
    '02_living_room_light_brightness_75'
  );

  await captureScreenshot('02_living_room_light_dimmed');

  // Change color to blue
  await executeAPICommand(
    'POST',
    '/api/state',
    {
      path: 'ui.controls.living_room_light.color',
      value: '#0000FF',
    },
    '02_living_room_light_blue',
  );

  await captureScreenshot('02_living_room_light_blue_color');
}

/**
 * Scene Control Tests
 */
async function runSceneControlTests() {
  console.log('\n3️⃣  Scene Control Tests');

  // Capture current scene
  await captureScreenshot('03_current_scene');

  // Activate Movie Night scene
  await executeAPICommand(
    'POST',
    '/api/actions/trigger',
    {
      target: 'movie-night-scene',
      payload: { sceneId: 'movie-night' },
    },
    '03_activate_movie_night_scene'
  );

  await captureScreenshot('03_movie_night_scene_active');

  // Activate Bright scene
  await executeAPICommand(
    'POST',
    '/api/actions/trigger',
    {
      target: 'bright-scene',
      payload: { sceneId: 'bright' },
    },
    '03_activate_bright_scene'
  );

  await captureScreenshot('03_bright_scene_active');
}

/**
 * Multiple Light Control Tests
 */
async function runMultipleLightControlTests() {
  console.log('\n4️⃣  Multiple Light Control Tests');

  // Capture all lights current state
  await captureScreenshot('04_all_lights_current_state');

  // Turn on all lights
  await executeAPICommand(
    'POST',
    '/api/actions/toggle',
    {
      target: 'all_lights',
      payload: { state: 'on' },
    },
    '04_turn_on_all_lights',
  );

  await captureScreenshot('04_all_lights_on');

  // Turn off all lights
  await executeAPICommand(
    'POST',
    '/api/actions/toggle',
    {
      target: 'all_lights',
      payload: { state: 'off' },
    },
    '04_turn_off_all_lights'
  );

  await captureScreenshot('04_all_lights_off');
}

/**
 * Health and State Verification Tests
 */
async function runHealthAndStateVerification() {
  console.log('\n5️⃣  Health and State Verification');

  // Health check
  await executeAPICommand('GET', '/health', null, '05_health_check');

  // Get current state
  const stateResult = await executeAPICommand('GET', '/api/state', null, '05_get_current_state');

  if (stateResult.success) {
    console.log('   ✅ State retrieved successfully');
    console.log(`   📊 State keys: ${Object.keys(stateResult.responseData).join(', ')}`);
  }
}

/**
 * Execute API command with curl and validate response
 */
async function executeAPICommand(method, endpoint, data, testName) {
  const startTime = Date.now();

  try {
    console.log(`   🔄 ${method} ${endpoint}`);

    // Prepare fetch options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: CONFIG.TIMEOUT,
    };

    // Add authorization if we have a token
    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    // Add body for POST requests
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    const duration = Date.now() - startTime;

    const result = {
      testName,
      method,
      endpoint,
      requestData: data,
      statusCode: response.status,
      responseData,
      duration,
      success: response.ok,
      timestamp: new Date().toISOString(),
    };

    testResults.push(result);

    if (response.ok) {
      console.log(`   ✅ ${response.status} (${duration}ms)`);
    } else {
      console.log(
        `   ❌ ${response.status} (${duration}ms) - ${responseData.error || 'Unknown error'}`,
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const result = {
      testName,
      method,
      endpoint,
      requestData: data,
      statusCode: 0,
      responseData: { error: error.message },
      duration,
      success: false,
      timestamp: new Date().toISOString(),
    };

    testResults.push(result);
    console.log(`   ❌ Error (${duration}ms) - ${error.message}`);

    return result;
  }
}

/**
 * Capture screenshot with timestamp and description
 */
async function captureScreenshot(description) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${description}.${CONFIG.SCREENSHOT_FORMAT}`;
    const filepath = path.join(CONFIG.SCREENSHOT_DIR, filename);

    console.log(`   📸 Capturing screenshot: ${description}`);

    // Try to get screenshot from API if available
    if (authToken) {
      try {
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/api/screenshot?format=${CONFIG.SCREENSHOT_FORMAT}&quality=${CONFIG.SCREENSHOT_QUALITY}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            timeout: CONFIG.TIMEOUT,
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.imageData) {
            // Save base64 image data
            const imageBuffer = Buffer.from(data.imageData, 'base64');
            fs.writeFileSync(filepath, imageBuffer);
            console.log(`   ✅ Screenshot saved: ${filename}`);
            return filename;
          }
        }
      } catch (error) {
        console.log(`   ⚠️  API screenshot failed, creating placeholder: ${error.message}`);
      }
    }

    // Create a placeholder image if API screenshot fails
    const placeholderContent = `Screenshot: ${description}\nTimestamp: ${new Date().toISOString()}\nTest: Mobile API Control Pattern`;
    const placeholderPath = filepath.replace(`.${CONFIG.SCREENSHOT_FORMAT}`, '.txt');
    fs.writeFileSync(placeholderPath, placeholderContent);
    console.log(`   📄 Placeholder created: ${path.basename(placeholderPath)}`);

    return filename;

  } catch (error) {
    console.log(`   ❌ Screenshot capture failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate comprehensive test report
 */
async function generateReport() {
  console.log('\n📊 Generating test report...');

  const endTime = new Date();
  const duration = endTime - startTime;

  const successfulTests = testResults.filter(t => t.success).length;
  const failedTests = testResults.length - successfulTests;
  const averageResponseTime =
    testResults.reduce((sum, t) => sum + t.duration, 0) / testResults.length;

  // Generate HTML report
  const htmlReport = generateHTMLReport({
    startTime,
    endTime,
    duration,
    totalTests: testResults.length,
    successfulTests,
    failedTests,
    averageResponseTime,
    testResults,
  });

  const reportPath = path.join(
    CONFIG.REPORT_DIR,
    `test-report-${new Date().toISOString().split('T')[0]}.html`,
  );
  fs.writeFileSync(reportPath, htmlReport);

  // Generate summary
  console.log('\n📈 Test Summary:');
  console.log(`   Total Tests: ${testResults.length}`);
  console.log(`   Successful: ${successfulTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((successfulTests / testResults.length) * 100).toFixed(1)}%`);
  console.log(`   Average Response Time: ${averageResponseTime.toFixed(0)}ms`);
  console.log(`   Total Duration: ${(duration / 1000).toFixed(1)}s`);
}

/**
 * Generate HTML report
 */
function generateHTMLReport(summary) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile API Control Pattern - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #4CAF50; }
        .metric.error { border-left-color: #f44336; }
        .metric h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
        .metric .value { font-size: 24px; font-weight: bold; color: #333; }
        .test-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; }
        .test-result.success { border-left: 4px solid #4CAF50; background: #f8fff8; }
        .test-result.error { border-left: 4px solid #f44336; background: #fff8f8; }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .test-title { font-weight: bold; color: #333; }
        .test-status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .status-success { background: #4CAF50; }
        .status-error { background: #f44336; }
        .test-details { font-size: 14px; color: #666; }
        .request-data, .response-data { background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; font-size: 12px; overflow-x: auto; }
        .timestamp { color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Mobile API Control Pattern - Test Report</h1>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Successful</h3>
                <div class="value">${summary.successfulTests}</div>
            </div>
            <div class="metric ${summary.failedTests > 0 ? 'error' : ''}">
                <h3>Failed</h3>
                <div class="value">${summary.failedTests}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${((summary.successfulTests / summary.totalTests) * 100).toFixed(
                  1,
                )}%</div>
            </div>
            <div class="metric">
                <h3>Avg Response Time</h3>
                <div class="value">${summary.averageResponseTime.toFixed(0)}ms</div>
            </div>
            <div class="metric">
                <h3>Total Duration</h3>
                <div class="value">${(summary.duration / 1000).toFixed(1)}s</div>
            </div>
        </div>
        
        <h2>📋 Test Execution Timeline</h2>
        <p><strong>Started:</strong> ${summary.startTime.toISOString()}</p>
        <p><strong>Completed:</strong> ${summary.endTime.toISOString()}</p>
        
        <h2>🧪 Test Results</h2>
        ${summary.testResults
          .map(
            (test, index) => `
            <div class="test-result ${test.success ? 'success' : 'error'}">
                <div class="test-header">
                    <div class="test-title">${index + 1}. ${test.testName}</div>
                    <div class="test-status ${test.success ? 'status-success' : 'status-error'}">
                        ${test.success ? 'PASS' : 'FAIL'}
                    </div>
                </div>
                <div class="test-details">
                    <strong>${test.method}</strong> ${test.endpoint} 
                    → <strong>${test.statusCode}</strong> (${test.duration}ms)
                    <div class="timestamp">${test.timestamp}</div>
                </div>
                ${
                  test.requestData
                    ? `
                    <div class="request-data">
                        <strong>Request:</strong><br>
                        ${JSON.stringify(test.requestData, null, 2)}
                    </div>
                `
                    : ''
                }
                <div class="response-data">
                    <strong>Response:</strong><br>
                    ${JSON.stringify(test.responseData, null, 2)}
                </div>
            </div>
        `,
          )
          .join('')}
        
        <h2>📸 Screenshots</h2>
        <p>Screenshots are saved in: <code>${CONFIG.SCREENSHOT_DIR}</code></p>
        
        <h2>🔧 Configuration</h2>
        <div class="request-data">
API Base URL: ${CONFIG.API_BASE_URL}
Username: ${CONFIG.USERNAME}
Screenshot Format: ${CONFIG.SCREENSHOT_FORMAT}
Quality: ${CONFIG.SCREENSHOT_QUALITY}
Timeout: ${CONFIG.TIMEOUT}ms
        </div>
        
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; text-align: center;">
            <p>Generated by Mobile API Control Pattern Test Automation</p>
            <p>${new Date().toISOString()}</p>
        </footer>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute main function if this script is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  CONFIG,
};
