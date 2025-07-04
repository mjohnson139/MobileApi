# Copilot Instructions for Mobile API Control Pattern

This is a React Native project that embeds an Express.js HTTP server to enable external programmatic control while maintaining native mobile performance. The core concept is dual-interface access: both native mobile UI and HTTP API to the same functionality.

## Code Standards

### Required Before Each Commit
- Run `npm run validate` before committing (includes lint, type-check, test)
- Ensure JWT_SECRET is 32+ characters for security
- Maintain Redux state synchronization between UI and API

### Development Flow
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Type check: `npm run type-check`
- Full validation: `npm run validate`

## Technology Stack
- **Mobile**: React Native 0.74.0 with TypeScript
- **Server**: Express.js 4.18+ with Node.js 18+
- **State**: Redux Toolkit 1.9+
- **Auth**: JWT + Passport.js with bcryptjs
- **Testing**: Jest with supertest for API testing

## Repository Structure
- `src/components/`: Reusable UI components (common, device, server)
- `src/screens/`: Application screens (Home, Settings, DeviceControl)
- `src/server/`: Embedded HTTP server with routes and middleware
- `src/store/`: Redux state management (server, devices, ui slices)
- `src/types/`: TypeScript type definitions
- `__tests__/`: Test files

## Key Guidelines

1. **TypeScript**: Use strict mode, define interfaces for all data structures, prefer `interface` over `type`
2. **React Native**: Use functional components with hooks, implement custom hooks for complex logic
3. **Redux**: Use Redux Toolkit, separate slices for different domains, createAsyncThunk for async operations
4. **API**: Follow RESTful conventions, use proper HTTP status codes, implement JWT authentication
5. **Security**: Validate JWT_SECRET length, implement CORS, use Helmet.js security headers
6. **Testing**: Write unit tests for utilities, integration tests for API endpoints, maintain >80% coverage

## Environment Variables
```bash
JWT_SECRET=your-256-bit-secret-key-here  # Must be 32+ characters
API_PORT=8080
CORS_ORIGIN=http://localhost:*
ENABLE_API_SERVER=true
NODE_ENV=development
```

## Important Notes
- Always maintain state synchronization between native UI and HTTP API
- Use JWT authentication for all API endpoints
- Implement comprehensive error handling
- Write tests for all new functionality
- Keep the dual-interface nature of the application