# API Specification

## Overview

The Mobile API Control Pattern provides a RESTful HTTP API for external tools to interact with the mobile application. This API enables real-time state inspection, UI action automation, and comprehensive testing capabilities.

## Base URL

```
http://localhost:8080
```

*Note: Port and host are configurable based on deployment settings.*

## Authentication

The API uses token-based authentication for secure access control.

### Authentication Flow

1. Obtain authentication token via login endpoint
2. Include token in `Authorization` header for subsequent requests
3. Token expires after configured timeout (default: 1 hour)

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

## API Endpoints

### Health Check

Check the API server health and availability.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-04T01:21:46Z",
  "version": "1.0.0"
}
```

**Status Codes**:
- `200 OK` - Server is healthy
- `503 Service Unavailable` - Server is not ready

### Authentication

#### Login

Authenticate and obtain access token.

**Endpoint**: `POST /auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-07-04T02:21:46Z",
  "token_type": "Bearer"
}
```

**Status Codes**:
- `200 OK` - Authentication successful
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded

### State Management

#### Get Current State

Retrieve the current application state.

**Endpoint**: `GET /state`

**Authentication**: Required

**Response**:
```json
{
  "timestamp": "2025-07-04T01:21:46Z",
  "ui_state": {
    "screen": "home",
    "controls": {
      "living_room_light": {
        "type": "switch",
        "state": "on",
        "brightness": 75
      },
      "bedroom_light": {
        "type": "switch",
        "state": "off"
      },
      "thermostat": {
        "type": "temperature",
        "current_temp": 72,
        "target_temp": 70,
        "mode": "heat"
      }
    }
  },
  "server_state": {
    "uptime": 3600,
    "requests_handled": 42,
    "active_connections": 1
  }
}
```

**Status Codes**:
- `200 OK` - State retrieved successfully
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Server error

#### Update State

Update specific parts of the application state.

**Endpoint**: `POST /state`

**Authentication**: Required

**Request Body**:
```json
{
  "ui_state": {
    "controls": {
      "living_room_light": {
        "state": "off"
      },
      "thermostat": {
        "target_temp": 68
      }
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "updated_at": "2025-07-04T01:21:46Z",
  "changes": [
    {
      "path": "ui_state.controls.living_room_light.state",
      "old_value": "on",
      "new_value": "off"
    },
    {
      "path": "ui_state.controls.thermostat.target_temp",
      "old_value": 70,
      "new_value": 68
    }
  ]
}
```

**Status Codes**:
- `200 OK` - State updated successfully
- `400 Bad Request` - Invalid state data
- `401 Unauthorized` - Invalid or missing token
- `422 Unprocessable Entity` - State validation failed
- `500 Internal Server Error` - Server error

### Action Execution

#### Execute UI Action

Trigger specific UI actions programmatically.

**Endpoint**: `POST /actions/{type}`

**Authentication**: Required

**Path Parameters**:
- `type` (string): Action type (`tap`, `swipe`, `scroll`, `input`)

**Request Body**:

For `tap` actions:
```json
{
  "target": "living_room_light",
  "coordinates": {
    "x": 150,
    "y": 200
  }
}
```

For `swipe` actions:
```json
{
  "start": {
    "x": 100,
    "y": 200
  },
  "end": {
    "x": 300,
    "y": 200
  },
  "duration": 500
}
```

For `input` actions:
```json
{
  "target": "temperature_input",
  "text": "75"
}
```

**Response**:
```json
{
  "success": true,
  "action_id": "act_1234567890",
  "executed_at": "2025-07-04T01:21:46Z",
  "result": {
    "state_changes": [
      {
        "path": "ui_state.controls.living_room_light.state",
        "old_value": "off",
        "new_value": "on"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK` - Action executed successfully
- `400 Bad Request` - Invalid action parameters
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Action type not supported
- `422 Unprocessable Entity` - Action validation failed
- `500 Internal Server Error` - Server error

### Screen Capture

#### Capture Screenshot

Capture a screenshot of the current application screen.

**Endpoint**: `GET /screenshot`

**Authentication**: Required

**Query Parameters**:
- `format` (optional): Image format (`png`, `jpg`) - default: `png`
- `quality` (optional): Image quality 1-100 - default: `90`
- `scale` (optional): Image scale factor - default: `1.0`

**Response**:
```json
{
  "image_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "format": "png",
  "dimensions": {
    "width": 375,
    "height": 812
  },
  "captured_at": "2025-07-04T01:21:46Z"
}
```

**Status Codes**:
- `200 OK` - Screenshot captured successfully
- `401 Unauthorized` - Invalid or missing token
- `503 Service Unavailable` - Screenshot capture not available
- `500 Internal Server Error` - Server error

## Error Handling

### Standard Error Response

All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body contains invalid data",
    "details": {
      "field": "ui_state.controls.invalid_control",
      "issue": "Control type not recognized"
    }
  },
  "timestamp": "2025-07-04T01:21:46Z",
  "request_id": "req_1234567890"
}
```

### Common Error Codes

- `INVALID_REQUEST` - Malformed request data
- `UNAUTHORIZED` - Authentication required or invalid
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Data validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair usage:

- **Default Limits**: 100 requests per minute per client
- **Headers**: Rate limit information included in response headers
- **Exceeded Limits**: `429 Too Many Requests` status code

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641234567
```

## WebSocket Support (Future)

Real-time state updates via WebSocket connections:

**Endpoint**: `ws://localhost:8080/ws`

**Authentication**: Token-based via query parameter or header

**Message Format**:
```json
{
  "type": "state_update",
  "data": {
    "path": "ui_state.controls.living_room_light.state",
    "old_value": "off",
    "new_value": "on"
  },
  "timestamp": "2025-07-04T01:21:46Z"
}
```

## SDK and Client Examples

### cURL Examples

**Health Check**:
```bash
curl -X GET http://localhost:8080/health
```

**Login**:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

**Get State**:
```bash
curl -X GET http://localhost:8080/state \
  -H "Authorization: Bearer <token>"
```

**Update State**:
```bash
curl -X POST http://localhost:8080/state \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ui_state":{"controls":{"living_room_light":{"state":"on"}}}}'
```

**Execute Action**:
```bash
curl -X POST http://localhost:8080/actions/tap \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"target":"living_room_light","coordinates":{"x":150,"y":200}}'
```

**Capture Screenshot**:
```bash
curl -X GET http://localhost:8080/screenshot \
  -H "Authorization: Bearer <token>" \
  -o screenshot.png
```

### Python Client Example

```python
import requests
import json

class MobileApiClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.token = None
    
    def login(self, username, password):
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password}
        )
        if response.status_code == 200:
            self.token = response.json()["token"]
        return response
    
    def get_state(self):
        return requests.get(
            f"{self.base_url}/state",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    def update_state(self, state_data):
        return requests.post(
            f"{self.base_url}/state",
            json=state_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    def execute_action(self, action_type, action_data):
        return requests.post(
            f"{self.base_url}/actions/{action_type}",
            json=action_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )

# Usage example
client = MobileApiClient()
client.login("admin", "password")
state = client.get_state()
print(state.json())
```

## Testing and Validation

### API Testing Scenarios

1. **Authentication Flow**
   - Valid login credentials
   - Invalid credentials
   - Token expiration
   - Token refresh

2. **State Management**
   - Get current state
   - Update valid state
   - Update invalid state
   - Partial state updates

3. **Action Execution**
   - Valid UI actions
   - Invalid action types
   - Missing action parameters
   - Action validation

4. **Error Handling**
   - Malformed requests
   - Unauthorized access
   - Server errors
   - Rate limiting

### Integration Testing

- End-to-end workflow testing
- Performance testing under load
- Security testing
- Cross-platform compatibility

## Versioning

The API follows semantic versioning:
- **Major Version**: Breaking changes
- **Minor Version**: New features, backward compatible
- **Patch Version**: Bug fixes, backward compatible

**Version Header**:
```
X-API-Version: 1.0.0
```

## Changelog

### v1.0.0 (Initial Release)
- Basic authentication system
- State management endpoints
- Action execution capabilities
- Screenshot capture functionality
- Health check endpoint
- Error handling and rate limiting