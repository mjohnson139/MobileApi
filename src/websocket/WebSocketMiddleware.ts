/**
 * WebSocket Redux Middleware for Mobile API Control Pattern
 * 
 * This middleware integrates WebSocket client with Redux store,
 * handling real-time state synchronization and action dispatching.
 */

import { MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';
import { WebSocketClient } from './WebSocketClient';
import { WebSocketConnectionState, WebSocketMessage, WebSocketMessageType } from '../types/websocket';

// Action types for WebSocket operations
export const WEBSOCKET_ACTIONS = {
  CONNECT: 'websocket/connect',
  DISCONNECT: 'websocket/disconnect',
  LOGIN: 'websocket/login',
  LOGOUT: 'websocket/logout',
  GET_STATE: 'websocket/getState',
  UPDATE_STATE: 'websocket/updateState',
  EXECUTE_ACTION: 'websocket/executeAction',
  CAPTURE_SCREENSHOT: 'websocket/captureScreenshot',
  GET_HEALTH: 'websocket/getHealth',
  GET_METRICS: 'websocket/getMetrics',
  
  // Internal actions for state management
  CONNECTION_STATE_CHANGED: 'websocket/connectionStateChanged',
  AUTHENTICATED: 'websocket/authenticated',
  AUTHENTICATION_FAILED: 'websocket/authenticationFailed',
  REAL_TIME_UPDATE: 'websocket/realTimeUpdate',
  ERROR: 'websocket/error',
} as const;

// Action creators
export const websocketActions = {
  connect: (url?: string) => ({
    type: WEBSOCKET_ACTIONS.CONNECT,
    payload: { url },
  }),
  
  disconnect: () => ({
    type: WEBSOCKET_ACTIONS.DISCONNECT,
  }),
  
  login: (username: string, password: string) => ({
    type: WEBSOCKET_ACTIONS.LOGIN,
    payload: { username, password },
  }),
  
  logout: () => ({
    type: WEBSOCKET_ACTIONS.LOGOUT,
  }),
  
  getState: (sections?: string[]) => ({
    type: WEBSOCKET_ACTIONS.GET_STATE,
    payload: { sections },
  }),
  
  updateState: (path: string, value: any) => ({
    type: WEBSOCKET_ACTIONS.UPDATE_STATE,
    payload: { path, value },
  }),
  
  executeAction: (type: string, target?: string, payload?: any) => ({
    type: WEBSOCKET_ACTIONS.EXECUTE_ACTION,
    payload: { type, target, payload },
  }),
  
  captureScreenshot: (options: any = {}) => ({
    type: WEBSOCKET_ACTIONS.CAPTURE_SCREENSHOT,
    payload: options,
  }),
  
  getHealth: () => ({
    type: WEBSOCKET_ACTIONS.GET_HEALTH,
  }),
  
  getMetrics: () => ({
    type: WEBSOCKET_ACTIONS.GET_METRICS,
  }),
  
  // Internal actions
  connectionStateChanged: (state: WebSocketConnectionState) => ({
    type: WEBSOCKET_ACTIONS.CONNECTION_STATE_CHANGED,
    payload: { state },
  }),
  
  authenticated: (authData: any) => ({
    type: WEBSOCKET_ACTIONS.AUTHENTICATED,
    payload: authData,
  }),
  
  authenticationFailed: (error: string) => ({
    type: WEBSOCKET_ACTIONS.AUTHENTICATION_FAILED,
    payload: { error },
  }),
  
  realTimeUpdate: (message: WebSocketMessage) => ({
    type: WEBSOCKET_ACTIONS.REAL_TIME_UPDATE,
    payload: message,
  }),
  
  error: (error: string) => ({
    type: WEBSOCKET_ACTIONS.ERROR,
    payload: { error },
  }),
};

// WebSocket middleware
export const createWebSocketMiddleware = (
  client: WebSocketClient,
  config: { autoConnect?: boolean; url?: string } = {}
) => {
  return (store: MiddlewareAPI) => {
    // Set up WebSocket client event handlers
    client.on('onStateChange', (state: WebSocketConnectionState) => {
      store.dispatch(websocketActions.connectionStateChanged(state));
    });
    
    client.on('onAuthenticated', () => {
      store.dispatch(websocketActions.authenticated({}));
    });
    
    client.on('onAuthenticationFailed', (error: string) => {
      store.dispatch(websocketActions.authenticationFailed(error));
    });
    
    client.on('onMessage', (message: WebSocketMessage) => {
      // Handle real-time messages
      switch (message.type) {
        case WebSocketMessageType.STATE_CHANGED:
          store.dispatch(websocketActions.realTimeUpdate(message));
          
          // Update Redux state based on the change
          if (message.payload?.path && message.payload?.value !== undefined) {
            const { path, value } = message.payload;
            store.dispatch({
              type: 'UPDATE_STATE_BY_PATH',
              payload: { path, value },
            });
          }
          break;
          
        case WebSocketMessageType.METRICS_UPDATE:
          store.dispatch(websocketActions.realTimeUpdate(message));
          break;
          
        case WebSocketMessageType.SERVER_STATUS_CHANGED:
          store.dispatch(websocketActions.realTimeUpdate(message));
          break;
          
        case WebSocketMessageType.ERROR:
          store.dispatch(websocketActions.error(message.payload?.error || 'Unknown WebSocket error'));
          break;
      }
    });
    
    client.on('onError', (error: Event) => {
      store.dispatch(websocketActions.error(error.type || 'WebSocket connection error'));
    });
    
    // Auto-connect if enabled
    if (config.autoConnect) {
      if (config.url) {
        client.connect();
      }
    }
    
    return (next: Dispatch) => (action: AnyAction) => {
      // Handle WebSocket actions
      switch (action.type) {
        case WEBSOCKET_ACTIONS.CONNECT:
          if (action.payload?.url) {
            // Update client config if URL provided
            (client as any).config.url = action.payload.url;
          }
          client.connect().catch((error) => {
            store.dispatch(websocketActions.error(error.message || 'Connection failed'));
          });
          break;
          
        case WEBSOCKET_ACTIONS.DISCONNECT:
          client.disconnect();
          break;
          
        case WEBSOCKET_ACTIONS.LOGIN:
          client.login(action.payload.username, action.payload.password)
            .then((authData) => {
              store.dispatch(websocketActions.authenticated(authData));
            })
            .catch((error) => {
              store.dispatch(websocketActions.authenticationFailed(error.message || 'Login failed'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.LOGOUT:
          client.logout()
            .then(() => {
              // Logout successful
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Logout failed'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.GET_STATE:
          client.getState(action.payload?.sections)
            .then((stateData) => {
              // Update Redux store with fetched state
              if (stateData.ui_state) {
                store.dispatch({
                  type: 'ui/setState',
                  payload: stateData.ui_state,
                });
              }
              if (stateData.device_state) {
                store.dispatch({
                  type: 'devices/setState',
                  payload: stateData.device_state,
                });
              }
              if (stateData.server_state) {
                store.dispatch({
                  type: 'server/setState',
                  payload: stateData.server_state,
                });
              }
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Failed to get state'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.UPDATE_STATE:
          client.updateState(action.payload.path, action.payload.value)
            .then(() => {
              // Local state update will be handled by real-time STATE_CHANGED message
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Failed to update state'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.EXECUTE_ACTION:
          client.executeAction(action.payload.type, action.payload.target, action.payload.payload)
            .then(() => {
              // Action executed successfully
              // State changes will be handled by real-time updates
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Failed to execute action'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.CAPTURE_SCREENSHOT:
          client.captureScreenshot(action.payload)
            .then(() => {
              // Screenshot captured successfully
              // Can dispatch action to store screenshot data if needed
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Failed to capture screenshot'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.GET_HEALTH:
          client.getHealth()
            .then(() => {
              // Health data received
              // Can dispatch action to store health data if needed
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Failed to get health'));
            });
          break;
          
        case WEBSOCKET_ACTIONS.GET_METRICS:
          client.getMetrics()
            .then(() => {
              // Metrics data received
              // Can dispatch action to store metrics data if needed
            })
            .catch((error) => {
              store.dispatch(websocketActions.error(error.message || 'Failed to get metrics'));
            });
          break;
      }
      
      return next(action);
    };
  };
};

// WebSocket slice for Redux store
export interface WebSocketState {
  connectionState: WebSocketConnectionState;
  authenticated: boolean;
  authToken: string | null;
  error: string | null;
  lastMessage: WebSocketMessage | null;
}

export const initialWebSocketState: WebSocketState = {
  connectionState: WebSocketConnectionState.DISCONNECTED,
  authenticated: false,
  authToken: null,
  error: null,
  lastMessage: null,
};

export const websocketReducer = (state = initialWebSocketState, action: AnyAction): WebSocketState => {
  switch (action.type) {
    case WEBSOCKET_ACTIONS.CONNECTION_STATE_CHANGED:
      return {
        ...state,
        connectionState: action.payload.state,
        error: action.payload.state === WebSocketConnectionState.ERROR ? state.error : null,
      };
      
    case WEBSOCKET_ACTIONS.AUTHENTICATED:
      return {
        ...state,
        authenticated: true,
        authToken: action.payload.token || state.authToken,
        error: null,
      };
      
    case WEBSOCKET_ACTIONS.AUTHENTICATION_FAILED:
      return {
        ...state,
        authenticated: false,
        authToken: null,
        error: action.payload.error,
      };
      
    case WEBSOCKET_ACTIONS.REAL_TIME_UPDATE:
      return {
        ...state,
        lastMessage: action.payload,
      };
      
    case WEBSOCKET_ACTIONS.ERROR:
      return {
        ...state,
        error: action.payload.error,
      };
      
    case WEBSOCKET_ACTIONS.LOGOUT:
      return {
        ...state,
        authenticated: false,
        authToken: null,
      };
      
    default:
      return state;
  }
};