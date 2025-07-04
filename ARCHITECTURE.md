# System Architecture

## Overview

The Mobile API Control Pattern implements an embedded HTTP server pattern within mobile applications, enabling external tools to interact with the app programmatically for testing, automation, and quality assurance purposes.

## Architectural Pattern

### Embedded API Server Pattern

The core architectural pattern involves embedding a lightweight HTTP server directly within the mobile application. This server provides RESTful endpoints that expose the application's internal state and allow external systems to trigger actions.

**Key Benefits:**
- Real-time access to application state
- Programmatic control of UI interactions
- Seamless integration with existing QA workflows
- No need for external testing frameworks or complicated setup

## System Components

### High-Level Architecture

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

### Detailed System Architecture

```
External QA Tools                     Mobile Application
┌─────────────────┐                   ┌─────────────────────────────────────┐
│                 │                   │                                     │
│  Test Scripts   │                   │  ┌─────────────────────────────────┐ │
│  Automation     │◄─────────────────►│  │        API Server               │ │
│  Tools          │  HTTP/REST        │  │  ┌─────────────────────────────┐ │ │
│  CI/CD Pipeline │  (Port 8080)      │  │  │      Express.js             │ │ │
│                 │                   │  │  │   ┌─────────────────────┐   │ │ │
└─────────────────┘                   │  │  │   │  Authentication     │   │ │ │
                                      │  │  │   │     (JWT + Auth)    │   │ │ │
┌─────────────────┐                   │  │  │   └─────────────────────┘   │ │ │
│                 │                   │  │  │   ┌─────────────────────┐   │ │ │
│  Manual Testing │                   │  │  │   │    API Routes       │   │ │ │
│  Tools          │◄─────────────────►│  │  │   │  /state /actions    │   │ │ │
│  (Postman, etc) │                   │  │  │   │  /screenshot /auth  │   │ │ │
│                 │                   │  │  │   └─────────────────────┘   │ │ │
└─────────────────┘                   │  │  └─────────────────────────────┘ │ │
                                      │  └─────────────────────────────────┘ │
                                      │              │                        │
                                      │              ▼                        │
                                      │  ┌─────────────────────────────────┐ │
                                      │  │      State Manager              │ │
                                      │  │  ┌─────────────────────────────┐ │ │
                                      │  │  │    Redux Store              │ │ │
                                      │  │  │  ┌─────────────────────┐   │ │ │
                                      │  │  │  │   UI State          │   │ │ │
                                      │  │  │  │   Server State      │   │ │ │
                                      │  │  │  │   Config State      │   │ │ │
                                      │  │  │  └─────────────────────┘   │ │ │
                                      │  │  └─────────────────────────────┘ │ │
                                      │  │  ┌─────────────────────────────┐ │ │
                                      │  │  │   Command Processor         │ │ │
                                      │  │  │   Action Dispatcher         │ │ │
                                      │  │  └─────────────────────────────┘ │ │
                                      │  └─────────────────────────────────┘ │
                                      │              │                        │
                                      │              ▼                        │
                                      │  ┌─────────────────────────────────┐ │
                                      │  │       UI Components             │ │
                                      │  │  ┌─────────────────────────────┐ │ │
                                      │  │  │  Smart Home Control Panel  │ │ │
                                      │  │  │  ┌─────────────────────┐   │ │ │
                                      │  │  │  │  Light Controls     │   │ │ │
                                      │  │  │  │  Switch Components  │   │ │ │
                                      │  │  │  │  Dimmer Sliders     │   │ │ │
                                      │  │  │  │  Temperature Panel  │   │ │ │
                                      │  │  │  └─────────────────────┘   │ │ │
                                      │  │  └─────────────────────────────┘ │ │
                                      │  │  ┌─────────────────────────────┐ │ │
                                      │  │  │   Screen Capture Module     │ │ │
                                      │  │  │   (react-native-view-shot)  │ │ │
                                      │  │  └─────────────────────────────┘ │ │
                                      │  └─────────────────────────────────┘ │
                                      │                                     │
                                      └─────────────────────────────────────┘
```

### Network Communication Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│  External QA    │                    │  Mobile Device  │
│  Tool           │                    │  (localhost)    │
│                 │                    │                 │
│  ┌─────────────┐│                    │┌─────────────┐  │
│  │ HTTP Client ││ ──── TCP/HTTP ───► ││HTTP Server  │  │
│  │             ││    (Port 8080)     ││(Express.js) │  │
│  └─────────────┘│                    │└─────────────┘  │
│                 │                    │                 │
│  ┌─────────────┐│                    │┌─────────────┐  │
│  │Auth Headers ││ ── Authorization ──││JWT Validator│  │
│  │Bearer Token ││                    ││& Middleware │  │
│  └─────────────┘│                    │└─────────────┘  │
│                 │                    │                 │
│  ┌─────────────┐│                    │┌─────────────┐  │
│  │JSON Request ││ ──── API Calls ───►││Route Handler│  │
│  │/Response    ││                    ││Controllers  │  │
│  └─────────────┘│                    │└─────────────┘  │
└─────────────────┘                    └─────────────────┘

Security Layers:
1. Network: Local network only (no external exposure)
2. Authentication: JWT token validation
3. Authorization: Role-based access control
4. Rate Limiting: Request throttling per client
5. Input Validation: Request payload validation
```

### Component Details

#### 1. Mobile App API Server
- **Purpose**: Embedded HTTP server running within the mobile application
- **Technology**: Lightweight HTTP server (implementation TBD)
- **Port**: Configurable port (default: 8080)
- **Security**: Token-based authentication with enable/disable capability

#### 2. App UI Components
- **Purpose**: Standard mobile app user interface
- **Integration**: Connected to state manager for real-time updates
- **Demo Concept**: Smart Home Control Panel with interactive elements
  - Light switches (on/off states)
  - Dimmer controls
  - Temperature controls
  - Status indicators

#### 3. State Manager & Command Processor
- **Purpose**: Central hub for application state and command execution
- **Responsibilities**:
  - Maintain current application state
  - Process incoming API commands
  - Update UI components based on state changes
  - Execute UI actions programmatically

#### 4. QA Tool/Test Runner
- **Purpose**: External testing and automation tools
- **Communication**: HTTP REST API calls to embedded server
- **Capabilities**:
  - Query current application state
  - Trigger UI actions
  - Capture screenshots
  - Automate test scenarios

## Key Architectural Decisions

### 1. Pattern Selection: Embedded HTTP Server
**Decision**: Embed HTTP server within mobile app rather than using external testing frameworks

**Rationale**:
- Direct access to application internals
- Real-time state synchronization
- Simplified setup and integration
- Platform-agnostic approach

**Trade-offs**:
- Additional resource usage in production
- Security considerations for API access
- Need for proper server lifecycle management

### 2. API Design: RESTful Architecture
**Decision**: Use RESTful HTTP endpoints for API interface

**Rationale**:
- Industry standard approach
- Easy integration with existing tools
- Language and platform agnostic
- Well-understood patterns and conventions

### 3. Authentication: Token-based Security
**Decision**: Implement token-based authentication with enable/disable capability

**Rationale**:
- Secure API access control
- Ability to disable in production builds
- Simple implementation and integration
- Flexible authorization schemes

### 4. State Management: Centralized Store
**Decision**: Use centralized state management pattern

**Rationale**:
- Single source of truth for application state
- Simplified state synchronization between UI and API
- Easier testing and debugging
- Consistent state updates across components

### 5. UI Concept: Smart Home Control Panel
**Decision**: Implement smart home control panel as demo application

**Rationale**:
- Rich interactive elements for testing
- Clear visual feedback for state changes
- Realistic use case demonstration
- Variety of control types (switches, sliders, etc.)

## Data Flow

### 1. State Query Flow
```
QA Tool → GET /state → API Server → State Manager → JSON Response
```

### 2. State Update Flow
```
QA Tool → POST /state → API Server → State Manager → UI Update
```

### 3. Action Execution Flow
```
QA Tool → POST /actions/{type} → API Server → Command Processor → UI Action → State Update
```

### 4. Screenshot Capture Flow
```
QA Tool → GET /screenshot → API Server → Screen Capture → Image Response
```

## Component Interaction Diagrams

### Detailed API Request Flow

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ QA Tool     │   │ HTTP Server │   │ Auth        │   │ Route       │   │ State       │
│             │   │ (Express)   │   │ Middleware  │   │ Handler     │   │ Manager     │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
       │                   │                   │                   │                   │
       │ 1. HTTP Request   │                   │                   │                   │
       │ + Bearer Token    │                   │                   │                   │
       ├──────────────────►│                   │                   │                   │
       │                   │ 2. Validate JWT   │                   │                   │
       │                   ├──────────────────►│                   │                   │
       │                   │ 3. Auth Success   │                   │                   │
       │                   │◄──────────────────┤                   │                   │
       │                   │ 4. Route to       │                   │                   │
       │                   │    Handler        │                   │                   │
       │                   ├──────────────────────────────────────►│                   │
       │                   │                   │ 5. Process Request│                   │
       │                   │                   │                   ├──────────────────►│
       │                   │                   │                   │ 6. State Operation│
       │                   │                   │                   │◄──────────────────┤
       │                   │ 7. HTTP Response  │                   │                   │
       │◄──────────────────┤                   │                   │                   │
       │                   │                   │                   │                   │
```

### State Synchronization Flow

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Redux Store │   │ Command     │   │ UI          │   │ API         │
│             │   │ Processor   │   │ Components  │   │ Endpoint    │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
       │                   │                   │                   │
       │ 1. State Change   │                   │                   │
       │   Notification    │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │ 2. Dispatch UI    │                   │
       │                   │    Updates        │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │ 3. Re-render      │
       │                   │                   │    Components     │
       │                   │                   │                   │
       │ 4. External API   │                   │                   │
       │    State Request  │                   │                   │
       │◄─────────────────────────────────────────────────────────┤
       │ 5. Current State  │                   │                   │
       │    Response       │                   │                   │
       ├─────────────────────────────────────────────────────────►│
       │                   │                   │                   │
```

### Action Execution Sequence

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ External    │   │ API Server  │   │ Action      │   │ Redux       │   │ UI          │
│ QA Tool     │   │             │   │ Dispatcher  │   │ Store       │   │ Component   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
       │                   │                   │                   │                   │
       │ 1. POST /actions/ │                   │                   │                   │
       │    {type:"tap",   │                   │                   │                   │
       │     target:"btn"} │                   │                   │                   │
       ├──────────────────►│                   │                   │                   │
       │                   │ 2. Validate       │                   │                   │
       │                   │    Action         │                   │                   │
       │                   ├──────────────────►│                   │                   │
       │                   │                   │ 3. Dispatch       │                   │
       │                   │                   │    Redux Action   │                   │
       │                   │                   ├──────────────────►│                   │
       │                   │                   │                   │ 4. State Update  │
       │                   │                   │                   ├──────────────────►│
       │                   │                   │                   │ 5. Component      │
       │                   │                   │                   │    Re-render      │
       │                   │                   │                   │                   │
       │ 6. Action Success │                   │                   │                   │
       │    Response       │                   │                   │                   │
       │◄──────────────────┤                   │                   │                   │
       │                   │                   │                   │                   │
```

### Error Handling Flow

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ QA Tool     │   │ API Server  │   │ Error       │   │ Logger      │
│             │   │             │   │ Handler     │   │ Service     │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
       │                   │                   │                   │
       │ 1. Invalid        │                   │                   │
       │    Request        │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │ 2. Validation     │                   │
       │                   │    Failure        │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │ 3. Log Error      │
       │                   │                   ├──────────────────►│
       │                   │ 4. Error Response │                   │
       │                   │    (400/401/500)  │                   │
       │◄──────────────────┤                   │                   │
       │                   │                   │                   │
```

## State Management Flow Charts

### Redux State Structure

```
App State (Redux Store)
├── ui_state
│   ├── screen: "home" | "settings" | "about"
│   ├── controls
│   │   ├── living_room_light
│   │   │   ├── type: "switch"
│   │   │   ├── state: "on" | "off"
│   │   │   └── brightness: 0-100
│   │   ├── bedroom_light
│   │   │   ├── type: "switch"
│   │   │   └── state: "on" | "off"
│   │   └── thermostat
│   │       ├── type: "temperature"
│   │       ├── current_temp: number
│   │       ├── target_temp: number
│   │       └── mode: "heat" | "cool" | "auto"
│   └── loading_states
│       ├── screenshot_capturing: boolean
│       └── action_executing: boolean
├── server_state
│   ├── uptime: number (seconds)
│   ├── requests_handled: number
│   ├── active_connections: number
│   ├── last_request_at: timestamp
│   └── server_enabled: boolean
├── auth_state
│   ├── authenticated: boolean
│   ├── token: string | null
│   ├── expires_at: timestamp | null
│   └── rate_limit_remaining: number
└── config_state
    ├── server_port: number
    ├── log_level: "debug" | "info" | "warn" | "error"
    ├── screenshot_quality: number (1-100)
    └── api_enabled: boolean
```

### State Update Flow Chart

```
                    ┌─────────────────┐
                    │   External      │
                    │   API Request   │
                    │   (POST /state) │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Validate      │
                    │   Request       │
                    │   Payload       │
                    └─────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐
          │   Validation    │ │   Validation    │
          │     Passed      │ │     Failed      │
          └─────────────────┘ └─────────────────┘
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐
          │   Dispatch      │ │   Return Error  │
          │   Redux Action  │ │   Response      │
          │   UPDATE_STATE  │ │   (400/422)     │
          └─────────────────┘ └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Redux Store   │
          │   Updates State │
          └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   UI Components │
          │   Re-render     │
          │   with New State│
          └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Return        │
          │   Success       │
          │   Response      │
          └─────────────────┘
```

### Action Processing Flow Chart

```
                    ┌─────────────────┐
                    │   External      │
                    │   Action Request│
                    │   (POST /actions│
                    │   /{type})      │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Action Type   │
                    │   Router        │
                    └─────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │    TAP      │   │   SWIPE     │   │    TYPE     │
  │   Action    │   │   Action    │   │   Action    │
  └─────────────┘   └─────────────┘   └─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │  Validate   │   │  Validate   │   │  Validate   │
  │  Target     │   │  Coordinates│   │  Text Input │
  │  Element    │   │  & Direction│   │  & Target   │
  └─────────────┘   └─────────────┘   └─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Dispatch      │
                    │   UI Action     │
                    │   to Component  │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Component     │
                    │   Executes      │
                    │   Action        │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   State Update  │
                    │   Triggered     │
                    │   (if applicable)│
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Return Action │
                    │   Success       │
                    │   Response      │
                    └─────────────────┘
```

### Authentication Flow Chart

```
                    ┌─────────────────┐
                    │   Client        │
                    │   Requests      │
                    │   Authentication│
                    │   (POST /auth/  │
                    │   login)        │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Validate      │
                    │   Credentials   │
                    │   (username/    │
                    │   password)     │
                    └─────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐
          │   Credentials   │ │   Credentials   │
          │     Valid       │ │    Invalid      │
          └─────────────────┘ └─────────────────┘
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐
          │   Generate      │ │   Return        │
          │   JWT Token     │ │   401 Error     │
          │   (expires 1hr) │ │   Response      │
          └─────────────────┘ └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Store Token   │
          │   in Client     │
          │   Auth State    │
          └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Return Token  │
          │   and Expiry    │
          │   to Client     │
          └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Subsequent    │
          │   Requests use  │
          │   Bearer Token  │
          │   in Header     │
          └─────────────────┘
```

## Security Considerations

### Authentication & Authorization
- Token-based API access control
- Configurable enable/disable for production builds
- Secure token generation and validation
- Rate limiting for API endpoints

### Network Security
- Local network access only (no external exposure)
- HTTPS support for encrypted communication
- Configurable network interfaces and ports

### Data Protection
- No sensitive data exposure through API
- Audit logging for API access
- State sanitization for external access

## Performance Considerations

### Resource Usage
- Minimal impact on app performance
- Lightweight HTTP server implementation
- Efficient state serialization
- Configurable server lifecycle

### Scalability
- Single-threaded server model
- Connection pooling for multiple clients
- Asynchronous request handling where possible

## Technology Stack

### Core Technologies
- **Mobile Platform**: To be determined (iOS/Android/Cross-platform)
- **HTTP Server**: Lightweight embedded server library
- **State Management**: Platform-specific state management solution
- **Authentication**: JWT or similar token-based system

### Integration Technologies
- **REST API**: Standard HTTP/JSON communication
- **Screenshot Capture**: Platform-specific screen capture APIs
- **Network Communication**: Standard HTTP client libraries

## Future Considerations

### Extensibility
- Plugin architecture for custom endpoints
- Configurable action types and handlers
- Custom state serialization formats

### Platform Support
- Multi-platform implementation strategy
- Platform-specific optimizations
- Shared core architecture across platforms

### Advanced Features
- Real-time state streaming via WebSockets
- Video recording capabilities
- Advanced debugging and profiling endpoints
- Integration with CI/CD pipelines

## Implementation Phases

This architecture will be implemented in phases as outlined in the [Project Plan](PROJECT_PLAN.md), starting with core server functionality and basic state management, then adding advanced features and platform-specific optimizations.