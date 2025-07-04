# Test Automation for Mobile API Control Pattern

This directory contains comprehensive test automation scripts that demonstrate the Mobile API Control Pattern by controlling the mobile app through its embedded API server and capturing visual evidence of state changes.

## 🚀 Quick Start

### Run Full Test Suite (with server startup)
```bash
npm run test:automation:full
```

### Run Tests Against Running Server
```bash
npm run test:automation
```

### Get cURL Examples
```bash
npm run test:automation:curl
```

## 📁 Files Overview

### Core Scripts
- **`test-automation.js`** - Main Node.js test automation script
- **`test-automation.sh`** - Bash wrapper with server management
- **`test-automation.config`** - Configuration file with test parameters

### Generated Output
- **`../test-screenshots/`** - Directory containing before/after screenshots
- **`../test-reports/`** - Directory containing HTML test reports

## 🧪 Test Scenarios

The automation script runs through these comprehensive test scenarios:

### 1. Authentication Flow
- 📸 Capture initial app state
- 🔐 POST `/auth/login` with credentials
- 📸 Capture authenticated state
- ✅ Validate JWT token received

### 2. Light Control Tests
- 📸 Capture current lighting state
- 💡 Turn on living room light via `/api/state`
- 📸 Capture light turned on
- 🔆 Adjust brightness to 75%
- 📸 Capture dimmed state
- 🎨 Change color to blue
- 📸 Capture blue light state

### 3. Scene Control Tests
- 📸 Capture current scene
- 🎬 Activate "Movie Night" scene via `/api/actions/scene`
- 📸 Capture movie night scene
- ☀️ Activate "Bright" scene
- 📸 Capture bright scene

### 4. Multiple Light Control
- 📸 Capture all lights current state
- 💡 Turn on all lights via `/api/actions/toggle`
- 📸 Capture all lights on
- 🌙 Turn off all lights
- 📸 Capture all lights off

### 5. Health and State Verification
- ❤️ GET `/health` to verify server status
- 📊 GET `/api/state` to retrieve current app state
- ✅ Validate JSON response matches UI state

## 🛠️ Configuration Options

### Environment Variables
```bash
API_BASE_URL=http://localhost:8080    # API server URL
USERNAME=api_user                     # API username
PASSWORD=mobile_api_password          # API password
SCREENSHOT_DIR=./test-screenshots     # Screenshot output directory
REPORT_DIR=./test-reports            # Report output directory
```

### Command Line Options
```bash
./scripts/test-automation.sh [OPTIONS]

OPTIONS:
    -h, --help              Show help message
    -u, --url URL           API base URL
    -c, --config FILE       Configuration file path
    -s, --start-server      Start embedded server before tests
    -k, --kill-server       Kill existing server before starting
    -w, --wait SECONDS      Wait time for server startup
    -o, --output DIR        Output directory for results
    -f, --format FORMAT     Screenshot format (png, jpg)
    -q, --quality QUALITY   Screenshot quality (0.1-1.0)
    -v, --verbose           Enable verbose logging
    -d, --dry-run           Show configuration without running
```

## 📊 Report Features

The generated HTML report includes:

### Visual Summary Dashboard
- 📈 Total tests executed
- ✅ Success/failure counts
- ⏱️ Average response times
- 📊 Success rate percentage
- ⏰ Total execution duration

### Detailed Test Results
- 🧪 Individual test status (PASS/FAIL)
- 📝 HTTP method and endpoint
- 📤 Request data sent
- 📥 Response data received
- ⏱️ Response time metrics
- 🕐 Timestamp for each test

### Screenshot Gallery
- 📸 Before/after state comparisons
- 🏷️ Descriptive filenames with timestamps
- 📁 Organized by test scenario

### Performance Metrics
- ⚡ Response time analysis
- 📊 Performance threshold validation
- 🎯 API reliability metrics

## 🔧 Manual cURL Examples

### Authentication
```bash
# Login to get JWT token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"api_user","password":"mobile_api_password"}'
```

### State Management
```bash
# Get current state
curl -X GET http://localhost:8080/api/state \
  -H "Authorization: Bearer <token>"

# Update light state
curl -X POST http://localhost:8080/api/state \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"path":"ui.controls.living_room_light.state","value":"on"}'
```

### Action Execution
```bash
# Toggle light
curl -X POST http://localhost:8080/api/actions/toggle \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target":"living_room_light","payload":{"state":"on"}}'

# Activate scene
curl -X POST http://localhost:8080/api/actions/scene \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target":"movie-night","payload":{"sceneId":"movie-night"}}'
```

### Screenshot Capture
```bash
# Capture screenshot
curl -X GET http://localhost:8080/api/screenshot \
  -H "Authorization: Bearer <token>" \
  --output screenshot.png
```

### Health Check
```bash
# Server health status
curl -X GET http://localhost:8080/health
```

## 🏗️ Technical Implementation

### Architecture
- **Node.js** - Core automation logic with fetch API
- **Bash** - Server management and process orchestration
- **JWT Authentication** - Secure API access
- **REST API** - Standard HTTP endpoints
- **Base64 Images** - Screenshot data transfer
- **HTML Reports** - Rich visual reporting

### Dependencies
- Node.js 18+
- npm (Node Package Manager)
- curl (HTTP client)
- lsof (Process management)

### Error Handling
- ⏰ Timeout protection for all requests
- 🔄 Automatic retry logic for server startup
- 🧹 Graceful cleanup on script termination
- 📝 Detailed error logging and reporting
- 🛡️ Fallback handling for screenshot failures

## 🎯 Success Criteria

The test automation validates:

✅ **API Functionality**
- All endpoints respond correctly
- Authentication works properly
- State changes are reflected
- Actions execute successfully

✅ **Performance**
- Response times under 500ms
- No memory leaks or crashes
- Consistent behavior across runs

✅ **Visual Evidence**
- Screenshots capture state changes
- Before/after comparisons are clear
- UI updates match API commands

✅ **Reliability**
- 100% test pass rate expected
- Graceful error handling
- Repeatable test execution

## 🚨 Troubleshooting

### Common Issues

**Server Won't Start**
```bash
# Kill existing processes
./scripts/test-automation.sh -k

# Start with verbose logging
./scripts/test-automation.sh -s -v
```

**Authentication Fails**
- Check username/password in config
- Verify JWT_SECRET is set properly
- Ensure server is running on correct port

**Screenshots Missing**
- Verify API screenshot endpoint works
- Check file permissions on output directory
- Review network connectivity to server

**Tests Timeout**
- Increase timeout in config file
- Check server performance
- Verify network latency

### Debug Mode
```bash
# Run with verbose output
./scripts/test-automation.sh -v

# Dry run to check configuration
./scripts/test-automation.sh -d

# Manual server startup
node demo.js
```

## 📈 Extending the Tests

### Adding New Test Scenarios
1. Add scenario function to `test-automation.js`
2. Call from `runTestScenarios()`
3. Update configuration options
4. Add documentation

### Custom API Endpoints
1. Implement new endpoints in server
2. Add test commands to automation script
3. Update validation logic
4. Include in report generation

### Additional Screenshot Points
1. Call `captureScreenshot()` with descriptive name
2. Screenshots automatically included in report
3. Filenames use timestamp + description format

---

*This test automation demonstrates the power of the Mobile API Control Pattern by providing external programmatic control with visual validation of mobile app behavior.*