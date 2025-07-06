// Export WebSocket components
export { WebSocketClient, webSocketClient } from './websocket/WebSocketClient';
export { 
  websocketActions, 
  createWebSocketMiddleware, 
  websocketReducer,
  WEBSOCKET_ACTIONS 
} from './websocket/WebSocketMiddleware';

// Export store
export { store } from './store';

// Export types
export * from './types';

// Export config (keep for compatibility)
export * from './config';
