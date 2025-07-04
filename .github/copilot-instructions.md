# Copilot Instructions for Mobile API Control Pattern

## Project Overview

This project implements the **Mobile API Control Pattern** - a novel approach that embeds an HTTP server within a mobile application to enable external programmatic control while maintaining native mobile performance and user experience.

### Core Concept
The application runs a lightweight Express.js server internally, exposing RESTful APIs that allow external tools (testing frameworks, automation scripts, CI/CD pipelines) to interact with the mobile app programmatically, while users can still interact with the native UI.

### Key Features
- **Embedded HTTP Server**: Express.js server running within React Native app
- **Dual Interface**: Both native mobile UI and HTTP API access to same functionality
- **State Synchronization**: Centralized Redux state management
- **JWT Authentication**: Secure API access with token-based authentication
- **Screen Capture**: Programmatic screenshot capabilities
- **Smart Home Demo**: Interactive control panel for lights, switches, and controls

## Technology Stack

### Core Technologies
- **Mobile Framework**: React Native 0.74.0 with TypeScript
- **HTTP Server**: Express.js 4.18+ with Node.js 18+
- **State Management**: Redux Toolkit 1.9+
- **Authentication**: JWT + Passport.js with bcryptjs
- **Screen Capture**: react-native-view-shot
- **Development Tools**: TypeScript, ESLint, Prettier, Jest

### Architecture Patterns
- **Embedded Server Pattern**: HTTP server within mobile app
- **MVVM Architecture**: Model-View-ViewModel with Redux
- **RESTful API Design**: Standard HTTP methods and status codes
- **Middleware Pattern**: Express.js middleware for auth, logging, validation
- **Observer Pattern**: Redux for state change notifications

## Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── common/             # Common components (Button, Input, etc.)
│   ├── device/             # Device-specific components  
│   └── server/             # Server status components
├── screens/                # Application screens
│   ├── HomeScreen/
│   ├── SettingsScreen/
│   └── DeviceControlScreen/
├── server/                 # Embedded HTTP server
│   ├── EmbeddedServer.ts   # Main server class
│   ├── routes/             # API route handlers
│   │   ├── apiRoutes.ts    # Protected API endpoints
│   │   └── authRoutes.ts   # Authentication endpoints
│   ├── middleware/         # Express middleware
│   │   └── auth.ts         # JWT authentication middleware
│   └── auth/               # Authentication services
├── store/                  # Redux state management
│   ├── index.ts           # Store configuration
│   ├── serverSlice.ts     # Server state slice
│   ├── devicesSlice.ts    # Device state slice
│   └── uiSlice.ts         # UI state slice
├── config/                 # Configuration files
│   └── index.ts           # Environment and security config
├── types/                  # TypeScript type definitions
├── utils/                  # Helper functions and utilities
└── constants/              # Application constants
```

## Coding Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Prefer `interface` over `type` for object shapes
- Use generic types for reusable components

```typescript
// Good: Well-typed interface
interface DeviceState {
  id: string;
  name: string;
  type: 'light' | 'switch' | 'dimmer' | 'thermostat';
  enabled: boolean;
  value: number;
  properties: Record<string, any>;
}

// Good: Generic type for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

### React Native Patterns
- Use functional components with hooks
- Implement custom hooks for complex logic
- Use StyleSheet for component styling
- Follow React Native performance best practices

```typescript
// Good: Functional component with proper typing
const DeviceControl: React.FC<DeviceControlProps> = ({ device, onUpdate }) => {
  const [localValue, setLocalValue] = useState(device.value);
  
  const handleValueChange = useCallback((value: number) => {
    setLocalValue(value);
    onUpdate(device.id, { value });
  }, [device.id, onUpdate]);
  
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};
```

### Redux Patterns
- Use Redux Toolkit for all state management
- Create separate slices for different domains
- Use createAsyncThunk for async operations
- Implement proper error handling

```typescript
// Good: Redux slice with proper typing
const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    updateDevice: (state, action: PayloadAction<{ id: string; updates: Partial<DeviceState> }>) => {
      const { id, updates } = action.payload;
      const device = state.devices.find(d => d.id === id);
      if (device) {
        Object.assign(device, updates);
      }
    },
  },
});
```

### API Design Standards
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement consistent error responses
- Include request/response validation

```typescript
// Good: API endpoint with proper structure
app.get('/api/devices/:id', authenticateAPI, async (req, res) => {
  try {
    const { id } = req.params;
    const device = store.getState().devices.devices.find(d => d.id === id);
    
    if (!device) {
      return res.status(404).json({ 
        error: 'Device not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: device,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});
```

## Security Considerations

### Authentication
- Use JWT tokens for API authentication
- Implement proper token validation
- Use secure password hashing with bcryptjs
- Environment-based JWT secret management

### API Security
- Implement rate limiting
- Use CORS configuration
- Apply Helmet.js security headers
- Validate all input data

### Environment Configuration
```typescript
// Required environment variables
JWT_SECRET=your-256-bit-secret-key-here  // Must be 32+ characters
API_PORT=8080
CORS_ORIGIN=http://localhost:*
ENABLE_API_SERVER=true
NODE_ENV=development
```

## Testing Requirements

### Unit Testing
- Test all utility functions
- Test Redux reducers and actions
- Test API route handlers
- Maintain >80% code coverage

### Integration Testing
- Test API endpoints with supertest
- Test Redux store integration
- Test server lifecycle

### Testing Patterns
```typescript
// Good: Comprehensive API test
describe('API Endpoints', () => {
  beforeEach(async () => {
    server = new EmbeddedServer(store);
    await server.start();
    
    // Login and get token
    const loginResponse = await request(server.app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    
    authToken = loginResponse.body.token;
  });
  
  test('GET /api/devices should return device list', async () => {
    const response = await request(server.app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

## Development Workflow

### Setup Commands
```bash
# Install dependencies
npm install

# Start development server
npm run start

# Run on platforms
npm run android
npm run ios

# Development checks
npm run lint
npm run type-check
npm run test
npm run build
```

### Git Workflow
- Use feature branches for development
- Write descriptive commit messages
- Run tests before committing
- Use conventional commit format

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode
- Jest for testing

## Common Tasks

### Adding New Device Types
1. Update `DeviceState` interface in types
2. Add device creation logic in `devicesSlice`
3. Create UI components for device control
4. Add API endpoints for device management
5. Write tests for new functionality

### Adding New API Endpoints
1. Define route in appropriate route file
2. Add authentication middleware
3. Implement input validation
4. Add error handling
5. Write comprehensive tests

### State Management Changes
1. Update Redux slice definitions
2. Add new actions and reducers
3. Update TypeScript types
4. Test state changes
5. Update components using state

## Performance Optimization

### React Native Performance
- Use FlatList for large datasets
- Implement proper key props
- Optimize re-renders with useMemo/useCallback
- Use native modules for heavy operations

### Server Performance
- Implement response compression
- Use efficient data structures
- Cache frequently accessed data
- Monitor memory usage

## Error Handling

### API Error Patterns
```typescript
// Consistent error response format
interface ApiError {
  error: string;
  details?: string;
  timestamp: string;
}

// Error handling middleware
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
};
```

## Debugging Guidelines

### Development Tools
- Use React Native Debugger for UI debugging
- Use Redux DevTools for state inspection
- Use Chrome DevTools for JavaScript debugging
- Use Postman/curl for API testing

### Logging
- Use structured logging with appropriate levels
- Log API requests and responses
- Log state changes for debugging
- Never log sensitive information

## Documentation Standards

### Code Documentation
- Use JSDoc for function documentation
- Document complex algorithms
- Explain non-obvious business logic
- Keep comments up-to-date

### API Documentation
- Document all endpoints with examples
- Include request/response schemas
- Document authentication requirements
- Provide usage examples

## Deployment Considerations

### Environment Configuration
- Use environment variables for configuration
- Separate development/production settings
- Secure sensitive configuration values
- Validate configuration on startup

### Build Process
- TypeScript compilation
- Bundle optimization
- Asset optimization
- Testing in CI/CD pipeline

## Important Notes for Copilot

1. **Always validate JWT_SECRET**: Ensure it's 32+ characters for security
2. **State Synchronization**: Keep Redux state in sync between UI and API
3. **Error Handling**: Implement comprehensive error handling for all operations
4. **Security First**: Always consider security implications of changes
5. **Performance**: Monitor server performance and memory usage
6. **Testing**: Write tests for all new functionality
7. **Documentation**: Update documentation for any API changes

This project represents a novel architectural pattern that bridges mobile and web development paradigms. Focus on maintaining the dual-interface nature while ensuring security and performance.