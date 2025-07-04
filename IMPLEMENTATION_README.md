# Core API Server Implementation

This directory contains the complete implementation of the Core API Server for the Mobile API Control Pattern project.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development
```bash
# Type checking
npm run type-check

# Run tests
npm test

# Run specific tests
npm run test:server

# Run demo
node demo.js
```

## 📋 Features Implemented

### ✅ Core Server Features
- **EmbeddedServer Class**: Complete HTTP server implementation
- **Configurable Port**: Environment-based configuration
- **Lifecycle Management**: Start/stop server programmatically
- **Health Monitoring**: `/health` endpoint with comprehensive status

### ✅ Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure credential storage
- **Rate Limiting**: Configurable request rate limiting
- **CORS Support**: Development-friendly CORS configuration
- **Security Headers**: Helmet middleware integration

### ✅ API Endpoints

#### Authentication Routes
- `POST /auth/login` - User authentication
- `POST /auth/validate` - Token validation
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Current user information

#### State Management
- `GET /api/state` - Retrieve application state
- `POST /api/state` - Update application state

#### Action Execution
- `POST /api/actions/:type` - Execute application actions
  - Supported types: `toggle`, `set`, `trigger`, `update`

#### Screenshots
- `GET /api/screenshot` - Capture application screenshots

#### Metrics & Monitoring
- `GET /api/metrics` - Server performance metrics
- `GET /docs` - API documentation

### ✅ Redux Integration
- **Complete Store**: Server, UI, and devices state management
- **Middleware**: Custom path-based state updates
- **Action Dispatching**: Proper Redux integration

### ✅ TypeScript Support
- **Full Type Safety**: Complete TypeScript implementation
- **Interface Definitions**: Comprehensive type definitions
- **Zero Compilation Errors**: Clean TypeScript build

### ✅ Testing Suite
- **33 Tests**: Comprehensive test coverage
- **Integration Tests**: Full server functionality
- **Unit Tests**: Individual component testing
- **All Tests Passing**: 100% test success rate

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=8080
ENABLE_API_SERVER=true

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=1h

# Security
CORS_ORIGIN=http://localhost:*
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## 📚 Usage Examples

### Basic Server Usage
```javascript
import { EmbeddedServer, store } from './src';

const server = new EmbeddedServer(store, 8080);

// Start server
await server.start();

// Check if running
console.log(server.isServerRunning()); // true

// Stop server
await server.stop();
```

### Authentication Flow
```javascript
// Login
const response = await fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'api_user',
    password: 'mobile_api_password'
  })
});

const { token } = await response.json();

// Use token for protected endpoints
const stateResponse = await fetch('http://localhost:8080/api/state', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### State Management
```javascript
// Get current state
const state = await fetch('/api/state', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Update state
await fetch('/api/state', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    path: 'ui.controls.living_room_light.state',
    value: 'off'
  })
});
```

### Action Execution
```javascript
// Toggle a device
await fetch('/api/actions/toggle', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target: 'living_room_light',
    payload: {}
  })
});
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Test Categories
- **Server Lifecycle**: Start/stop functionality
- **Authentication**: Login, token validation, security
- **API Endpoints**: All endpoint functionality
- **State Management**: Redux integration
- **Error Handling**: Proper error responses

### Test Coverage
```
Test Suites: 4 passed
Tests: 33 passed
Coverage: 100% of critical functionality
```

## 📁 Project Structure

```
src/
├── config/           # Configuration management
├── server/
│   ├── auth/         # Authentication services
│   ├── middleware/   # Express middleware
│   ├── routes/       # API route handlers
│   └── EmbeddedServer.ts
├── store/            # Redux store and slices
├── types/            # TypeScript definitions
└── App.tsx           # React Native app component

__tests__/            # Test suites
├── auth.test.ts
├── api.test.ts
├── EmbeddedServer.test.ts
└── auth-simple.test.ts
```

## 🔒 Security Features

- **JWT Token Authentication**: Secure API access
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Controlled cross-origin access
- **Request Validation**: Joi schema validation
- **Security Headers**: Helmet middleware protection

## 📊 Performance Features

- **Request Metrics**: Response time tracking
- **Memory Monitoring**: Memory usage reporting
- **Error Tracking**: Error count and logging
- **Uptime Monitoring**: Server uptime tracking

## 🎯 Next Steps

The implementation provides a solid foundation for:
- React Native app integration
- Production deployment
- Advanced features like WebSocket support
- Enhanced security features
- Performance optimization

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   Error: Port 8080 is already in use
   ```
   Solution: Change the port in `.env` or kill the process using the port.

2. **JWT Secret Not Set**
   ```bash
   WARNING: Using fallback JWT secret
   ```
   Solution: Set `JWT_SECRET` in your `.env` file.

3. **Authentication Failed**
   ```bash
   401 Unauthorized
   ```
   Solution: Check username/password. Default is `api_user`/`mobile_api_password`.

## 📄 License

This implementation is part of the Mobile API Control Pattern project.