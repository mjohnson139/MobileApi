# Mobile API Control Pattern

A proof of concept project demonstrating an embedded HTTP server pattern within mobile applications for automated testing and quality assurance.

## Overview

This project implements a novel approach to mobile app testing by embedding an HTTP API server directly within the mobile application. This pattern enables external QA tools and test runners to interact with the app programmatically, providing real-time state inspection, UI action automation, and comprehensive testing capabilities.

## 📱 Live Demonstrations

### App Interface Screenshots
**[View App Screenshots](screenshots/README.md)**

See the complete Smart Home Control Panel interface:
- **Smart Home Tab**: Consumer-facing device controls with touch-optimized interface
- **Server Control Tab**: API server management and testing tools
- **Performance Monitoring**: Real-time API metrics and response tracking

### Technical Proof of Concept
**[View Technical PoC Screenshots](poc/POC_SCREENSHOTS.md)**

Technical demonstrations showing:
- React Native app with embedded Express.js server running
- Real-time API responses and state management
- Redux state visualization with performance metrics
- Complete integration flow from UI to API

## Key Features

- **Embedded HTTP Server**: Lightweight API server running within the mobile app
- **RESTful API**: Clean, intuitive endpoints for state management and action control
- **Real-time State Access**: Live inspection and modification of application state
- **UI Action Automation**: Programmatic control of user interface interactions
- **Smart Home Demo**: Interactive control panel with device management and monitoring
- **Performance Monitoring**: Real-time API call tracking and performance metrics
- **Dual Interface**: Both API server control and consumer smart home interfaces
- **Token-based Security**: Secure API access with enable/disable capabilities

## Architecture

The system follows an embedded server pattern with the following core components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   QA Tool/      │    │  Mobile App     │    │   App UI        │
│   Test Runner   │◄──►│  API Server     │◄──►│   Components    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  State Manager  │
                       │  & Command      │
                       │  Processor      │
                       └─────────────────┘
```

## API Endpoints

- `GET /state` - Retrieve current application state
- `POST /state` - Update application state
- `POST /actions/{type}` - Execute UI actions
- `GET /screenshot` - Capture current screen
- `POST /auth/login` - Authenticate API access
- `GET /health` - Server health check

## Documentation

### Core Documentation
- [Architecture Design](ARCHITECTURE.md) - Comprehensive system architecture with detailed diagrams
- [API Specification](API.md) - Complete API reference and examples
- [Security Design](SECURITY.md) - Comprehensive security architecture and considerations
- [Technology Stack](TECHNOLOGY_STACK.md) - Technology selection matrix and decisions
- [Project Plan](PROJECT_PLAN.md) - Development phases and project organization

### Additional Resources
- [Getting Started Guide](docs/getting-started.md) - Development workflow and setup guide

### Phase 1 Deliverables ✅
- [x] **Architecture Diagrams** - Comprehensive system and component diagrams
- [x] **API Specification Document** - Complete REST API documentation
- [x] **Security Design Document** - Detailed security architecture and threat model
- [x] **Technology Stack Decision Matrix** - Comprehensive technology evaluation
- [x] **Component Interaction Diagrams** - Detailed component interaction flows
- [x] **State Management Flow Charts** - Redux state management diagrams

## Development Status

**Phase 1: Architecture Design and Documentation** ✅ Complete  
**Phase 1.5: Technology Stack Selection and Evaluation** ✅ Complete  

### Current Progress
- ✅ System architecture and API design completed
- ✅ Technology stack evaluation and validation completed  
- ✅ Proof-of-concept implementations with performance benchmarks
- ✅ Implementation guidelines established
- ✅ Core API server implementation completed
- ✅ **Smart Home Control Panel** - Phase 4 mobile app integration completed
- 🚧 Ready for production deployment and testing

### Key Achievements
- **Technology Validation**: React Native + Express.js + Redux stack confirmed
- **Performance Benchmarks**: All technical requirements met or exceeded
- **Security Implementation**: JWT authentication and security framework established
- **Implementation Readiness**: Comprehensive guidelines and patterns documented
- **Mobile Integration**: Complete Smart Home Control Panel with dual-interface access
- **Performance Monitoring**: Real-time API call tracking and metrics

See the [Project Plan](PROJECT_PLAN.md) for detailed development phases and roadmap.

## Smart Home Control Panel

The mobile app now includes a comprehensive Smart Home Control Panel demonstrating the Mobile API Control Pattern in action.

### Features
- **Device Management**: Interactive controls for lights, dimmers, and thermostats
- **Real-time Synchronization**: UI updates synchronized with API server state
- **Performance Monitoring**: Track API call response times and success rates
- **Dual Interface**: Switch between server control and smart home panels
- **Quick Actions**: Bulk device operations (all lights on/off)
- **Error Handling**: Graceful fallback when API server is unavailable

### Usage
1. **Smart Home Tab**: Consumer-facing device control interface
2. **Server Control Tab**: API server management and testing tools
3. **Performance Monitor**: Real-time API metrics and call history

See [Smart Home Control Panel Documentation](docs/smart-home-control-panel.md) for detailed usage and architecture information.

## Getting Started

### Quick Start with Expo SDK 53

This project now uses **Expo SDK 53** for a clean and easy installation process.

#### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

#### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd MobileApi

# Install dependencies
npm install

# Validate the setup (lint, type-check, test)
npm run validate

# Start the development server
npm run start
```

#### Platform-Specific Commands

```bash
# Start for Android
npm run android

# Start for iOS  
npm run ios

# Start for Web
npm run web
```

#### Development Tools

```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Full validation
npm run validate
```

### Migration to Expo SDK 53

This project has been upgraded from React Native CLI to **Expo SDK 53**. See the [Expo SDK 53 Migration Guide](docs/expo-sdk-53-migration.md) for detailed information about:

- Updated dependencies and configuration
- New development workflow
- Platform support improvements
- Performance enhancements

### Features Available

- **Cross-Platform**: Native support for iOS, Android, and Web
- **Smart Home Control Panel**: Complete device management interface
- **Embedded API Server**: Express.js server for external automation
- **Performance Monitoring**: Real-time API metrics and tracking
- **Redux State Management**: Centralized state with dual-interface sync

## Contributing

This is a proof of concept project. Please refer to the project issues for current development tasks and opportunities to contribute.

## License

*License information will be added as the project develops.*