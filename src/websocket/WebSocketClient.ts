/**
 * WebSocket Client for React Native Mobile API Control Pattern
 * 
 * This client connects to the external WebSocket backend server and provides
 * the same functionality as the previous embedded Express.js server.
 */

import { 
  WebSocketMessage, 
  WebSocketResponse, 
  WebSocketMessageType, 
  WebSocketConnectionState,
  WebSocketClientConfig,
  WebSocketEventHandlers,
  AuthLoginPayload,
  AuthValidatePayload,
  UpdateStatePayload,
  ExecuteActionPayload,
  CaptureScreenshotPayload,
} from '../types/websocket';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private state: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private authToken: string | null = null;
  private clientId: string | null = null;

  constructor(config: Partial<WebSocketClientConfig> = {}) {
    this.config = {
      url: config.url || 'ws://localhost:8080',
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      pingInterval: config.pingInterval || 30000,
      responseTimeout: config.responseTimeout || 30000,
      enableAutoReconnect: config.enableAutoReconnect ?? true,
    };
  }

  // Event handler management
  public on(event: keyof WebSocketEventHandlers, handler: Function): void {
    this.eventHandlers[event] = handler as any;
  }

  public off(event: keyof WebSocketEventHandlers): void {
    delete this.eventHandlers[event];
  }

  // Connection management
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === WebSocketConnectionState.CONNECTED || 
          this.state === WebSocketConnectionState.CONNECTING) {
        resolve();
        return;
      }

      this.setState(WebSocketConnectionState.CONNECTING);
      
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.setState(WebSocketConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.startPingTimer();
          this.eventHandlers.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.cleanup();
          this.setState(WebSocketConnectionState.DISCONNECTED);
          this.eventHandlers.onClose?.(event);
          
          if (this.config.enableAutoReconnect && 
              this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.setState(WebSocketConnectionState.ERROR);
          this.eventHandlers.onError?.(error);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.setState(WebSocketConnectionState.ERROR);
        reject(error as Error);
      }
    });
  }

  public disconnect(): void {
    this.config.enableAutoReconnect = false;
    this.cleanup();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setState(WebSocketConnectionState.DISCONNECTED);
  }

  public getConnectionState(): WebSocketConnectionState {
    return this.state;
  }

  public isConnected(): boolean {
    return this.state === WebSocketConnectionState.CONNECTED;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public isAuthenticated(): boolean {
    return this.state === WebSocketConnectionState.AUTHENTICATED;
  }

  // Authentication methods
  public async login(username: string, password: string): Promise<any> {
    const payload: AuthLoginPayload = { username, password };
    
    try {
      const response = await this.sendMessage(WebSocketMessageType.AUTH_LOGIN, payload);
      
      if (response.success && response.data) {
        this.authToken = response.data.token;
        console.log('Authentication successful, token stored');
        this.setState(WebSocketConnectionState.AUTHENTICATED);
        this.eventHandlers.onAuthenticated?.();
        return response.data;
      } else {
        this.eventHandlers.onAuthenticationFailed?.(response.error || 'Authentication failed');
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      this.eventHandlers.onAuthenticationFailed?.(error instanceof Error ? error.message : 'Authentication failed');
      throw error;
    }
  }

  public async validateToken(token: string): Promise<any> {
    const payload: AuthValidatePayload = { token };
    const response = await this.sendMessage(WebSocketMessageType.AUTH_VALIDATE, payload);
    
    if (response.success && response.data?.valid) {
      this.authToken = token;
      console.log('Token validation successful');
      this.setState(WebSocketConnectionState.AUTHENTICATED);
      this.eventHandlers.onAuthenticated?.();
      return response.data;
    } else {
      throw new Error(response.error || 'Token validation failed');
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.sendMessage(WebSocketMessageType.AUTH_LOGOUT, {});
    } catch (error) {
      // Ignore logout errors
    } finally {
      this.authToken = null;
      console.log('Logged out, token cleared');
      this.setState(WebSocketConnectionState.CONNECTED);
    }
  }

  // State management methods
  public async getState(sections?: string[]): Promise<any> {
    const payload = sections ? { sections } : {};
    const response = await this.sendMessage(WebSocketMessageType.GET_STATE, payload);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to get state');
    }
  }

  public async updateState(path: string, value: any): Promise<any> {
    const payload: UpdateStatePayload = { path, value };
    const response = await this.sendMessage(WebSocketMessageType.UPDATE_STATE, payload);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to update state');
    }
  }

  // Action execution methods
  public async executeAction(type: string, target?: string, payload?: any): Promise<any> {
    const actionPayload: ExecuteActionPayload = { 
      type, 
      ...(target !== undefined && { target }),
      ...(payload !== undefined && { payload }),
    };
    const response = await this.sendMessage(WebSocketMessageType.EXECUTE_ACTION, actionPayload);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to execute action');
    }
  }

  // Screenshot capture methods
  public async captureScreenshot(options: CaptureScreenshotPayload = {}): Promise<any> {
    const response = await this.sendMessage(WebSocketMessageType.CAPTURE_SCREENSHOT, options);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to capture screenshot');
    }
  }

  // Health and metrics methods
  public async getHealth(): Promise<any> {
    const response = await this.sendMessage(WebSocketMessageType.GET_HEALTH, {});
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to get health');
    }
  }

  public async getMetrics(): Promise<any> {
    const response = await this.sendMessage(WebSocketMessageType.GET_METRICS, {});
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to get metrics');
    }
  }

  // Core messaging methods
  private async sendMessage(type: WebSocketMessageType, payload: any): Promise<WebSocketResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const message: WebSocketMessage = {
        id: uuidv4(),
        type,
        timestamp: new Date().toISOString(),
        payload,
      };

      // Set up response timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error('Request timeout'));
      }, this.config.responseTimeout);

      // Store pending request
      this.pendingRequests.set(message.id, {
        resolve,
        reject,
        timeout,
      });

      // Send message
      try {
        this.ws?.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(message.id);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage | WebSocketResponse = JSON.parse(data);
      
      // Handle responses to pending requests
      if ('requestId' in message && message.requestId) {
        const pendingRequest = this.pendingRequests.get(message.requestId);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeout);
          this.pendingRequests.delete(message.requestId);
          pendingRequest.resolve(message);
          return;
        }
      }

      // Handle real-time events and server-initiated messages
      switch (message.type) {
        case WebSocketMessageType.CONNECT:
          this.clientId = message.payload?.clientId;
          console.log('WebSocket connected with client ID:', this.clientId);
          break;
          
        case WebSocketMessageType.PING:
          this.sendPong(message.payload);
          break;
          
        case WebSocketMessageType.PONG:
          // Handle pong response
          break;
          
        case WebSocketMessageType.STATE_CHANGED:
          this.eventHandlers.onMessage?.(message);
          break;
          
        case WebSocketMessageType.METRICS_UPDATE:
          this.eventHandlers.onMessage?.(message);
          break;
          
        case WebSocketMessageType.SERVER_STATUS_CHANGED:
          this.eventHandlers.onMessage?.(message);
          break;
          
        case WebSocketMessageType.ERROR:
          console.error('WebSocket error:', message.payload);
          this.eventHandlers.onMessage?.(message);
          break;
          
        default:
          this.eventHandlers.onMessage?.(message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private sendPong(payload: any): void {
    if (this.isConnected()) {
      const pongMessage: WebSocketMessage = {
        id: uuidv4(),
        type: WebSocketMessageType.PONG,
        timestamp: new Date().toISOString(),
        payload,
      };
      
      this.ws?.send(JSON.stringify(pongMessage));
    }
  }

  private setState(newState: WebSocketConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.eventHandlers.onStateChange?.(newState);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    this.setState(WebSocketConnectionState.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.setState(WebSocketConnectionState.ERROR);
        }
      });
    }, this.config.reconnectInterval);
  }

  private startPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        const pingMessage: WebSocketMessage = {
          id: uuidv4(),
          type: WebSocketMessageType.PING,
          timestamp: new Date().toISOString(),
        };
        
        this.ws?.send(JSON.stringify(pingMessage));
      }
    }, this.config.pingInterval);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    // Reject all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }
}

// Export a singleton instance for easy use
export const webSocketClient = new WebSocketClient();