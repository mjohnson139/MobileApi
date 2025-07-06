/**
 * Test for WebSocket Server functionality
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { WebSocketMessageType, WebSocketMessage } from '../src/types/websocket';
import { v4 as uuidv4 } from 'uuid';

describe('WebSocket Server', () => {
  let server: any;
  let wss: WebSocketServer;
  let wsClient: any;
  
  const PORT = 8081; // Use different port to avoid conflicts

  beforeAll(async () => {
    // Start a simple test WebSocket server
    server = createServer();
    wss = new WebSocketServer({ server });
    
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        // Echo back ping as pong
        if (message.type === WebSocketMessageType.PING) {
          ws.send(JSON.stringify({
            id: uuidv4(),
            type: WebSocketMessageType.PONG,
            timestamp: new Date().toISOString(),
            payload: message.payload,
          }));
        }
        
        // Send welcome on connect
        if (message.type === WebSocketMessageType.CONNECT) {
          ws.send(JSON.stringify({
            id: uuidv4(),
            type: WebSocketMessageType.CONNECT,
            timestamp: new Date().toISOString(),
            payload: { clientId: 'test-client' },
          }));
        }
      });
    });
    
    await new Promise<void>((resolve) => {
      server.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    if (wsClient) {
      wsClient.close();
    }
    
    wss.close();
    server.close();
    
    // Wait for server to close
    await new Promise<void>((resolve) => {
      server.on('close', resolve);
    });
  });

  test('should accept WebSocket connections', (done) => {
    // Use Node.js WebSocket for testing since we're in Node environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebSocket = require('ws');
    wsClient = new WebSocket(`ws://localhost:${PORT}`);
    
    wsClient.on('open', () => {
      expect(wsClient.readyState).toBe(WebSocket.OPEN);
      done();
    });
    
    wsClient.on('error', (error: Error) => {
      done(error);
    });
  });

  test('should handle ping/pong messages', (done) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebSocket = require('ws');
    const client = new WebSocket(`ws://localhost:${PORT}`);
    
    client.on('open', () => {
      const pingMessage: WebSocketMessage = {
        id: uuidv4(),
        type: WebSocketMessageType.PING,
        timestamp: new Date().toISOString(),
        payload: { test: true },
      };
      
      client.send(JSON.stringify(pingMessage));
    });
    
    client.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === WebSocketMessageType.PONG) {
        expect(message.payload.test).toBe(true);
        client.close();
        done();
      }
    });
    
    client.on('error', (error: Error) => {
      done(error);
    });
  });

  test('WebSocket message types should be correctly defined', () => {
    expect(WebSocketMessageType.CONNECT).toBe('connect');
    expect(WebSocketMessageType.PING).toBe('ping');
    expect(WebSocketMessageType.PONG).toBe('pong');
    expect(WebSocketMessageType.AUTH_LOGIN).toBe('auth_login');
    expect(WebSocketMessageType.GET_STATE).toBe('get_state');
    expect(WebSocketMessageType.UPDATE_STATE).toBe('update_state');
    expect(WebSocketMessageType.EXECUTE_ACTION).toBe('execute_action');
    expect(WebSocketMessageType.CAPTURE_SCREENSHOT).toBe('capture_screenshot');
  });
});