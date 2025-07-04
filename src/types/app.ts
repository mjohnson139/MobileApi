export interface DeviceState {
  id: string;
  name: string;
  type: 'switch' | 'dimmer' | 'temperature' | 'sensor';
  state: 'on' | 'off' | 'unknown';
  value?: number;
  lastUpdated: string;
  isOnline: boolean;
}

export interface UIState {
  currentScreen: string;
  controls: Record<string, DeviceState>;
  navigation: {
    history: string[];
    currentIndex: number;
  };
  settings: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    enableNotifications: boolean;
  };
}

export interface AppState {
  ui: UIState;
  devices: {
    devices: Record<string, DeviceState>;
    selectedDevice: string | null;
    isLoading: boolean;
    lastSync: string | null;
  };
  server: {
    isRunning: boolean;
    port: number;
    startTime: number | null;
    requestCount: number;
    errorCount: number;
    metrics: any[];
  };
  auth: {
    isAuthenticated: boolean;
    token: string | null;
    user: string | null;
    expiresAt: number | null;
  };
}
