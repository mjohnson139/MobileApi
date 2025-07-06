import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState } from './store';
import { webSocketClient } from './websocket/WebSocketClient';
import { websocketActions } from './websocket/WebSocketMiddleware';
import { WebSocketConnectionState } from './types/websocket';
import TabNavigation from './components/ui/TabNavigation';
import ServerControlPanel from './screens/ServerControlPanel';
import SmartHomeControlPanel from './screens/SmartHomeControlPanel';
import PerformanceMonitor from './components/ui/PerformanceMonitor';

import { colors } from './constants/colors';

interface ApiCall {
  endpoint: string;
  duration: number;
  timestamp: string;
}

// Main App component
const App: React.FC = () => {
  const dispatch = useDispatch();
  const [serverPort] = React.useState(8080);
  const [activeTab, setActiveTab] = React.useState<'server' | 'smarthome'>('smarthome');
  const [apiResponses, setApiResponses] = React.useState<
    { timestamp: string; message: string }[]
  >([]);
  const [apiCalls, setApiCalls] = React.useState<ApiCall[]>([]);

  // Get WebSocket status from Redux store
  const websocketState = useSelector((state: RootState) => state.websocket);

  // Derive server status from WebSocket connection state
  const serverStatus = React.useMemo(() => {
    switch (websocketState.connectionState) {
      case WebSocketConnectionState.CONNECTED:
        return websocketState.authenticated ? 'Running (Authenticated)' : 'Connected';
      case WebSocketConnectionState.CONNECTING:
        return 'Connecting';
      case WebSocketConnectionState.RECONNECTING:
        return 'Reconnecting';
      case WebSocketConnectionState.AUTHENTICATED:
        return 'Running (Authenticated)';
      case WebSocketConnectionState.ERROR:
        return 'Error';
      case WebSocketConnectionState.DISCONNECTED:
      default:
        return 'Stopped';
    }
  }, [websocketState.connectionState, websocketState.authenticated]);

  React.useEffect(() => {
    // Set up WebSocket event handlers
    webSocketClient.on('onStateChange', (state: WebSocketConnectionState) => {
      logResponse(`WebSocket state changed: ${state}`);
    });

    webSocketClient.on('onAuthenticated', () => {
      logResponse('Successfully authenticated with WebSocket server');
    });

    webSocketClient.on('onAuthenticationFailed', (error: string) => {
      logResponse(`Authentication failed: ${error}`);
    });

    webSocketClient.on('onMessage', (message: any) => {
      logResponse(`Real-time update: ${message.type}`);
    });

    webSocketClient.on('onError', (error: any) => {
      logResponse(`WebSocket error: ${error.type}`);
    });

    return () => {
      // Cleanup WebSocket connection on component unmount
      if (webSocketClient.isConnected()) {
        webSocketClient.disconnect();
      }
    };
  }, []);

  const handleApiCall = (endpoint: string, duration: number) => {
    const apiCall: ApiCall = {
      endpoint,
      duration,
      timestamp: new Date().toISOString(),
    };

    setApiCalls(prev => [apiCall, ...prev.slice(0, 49)]); // Keep last 50 calls
  };

  const logResponse = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setApiResponses(prev => [
      { timestamp, message },
      ...prev.slice(0, 19), // Keep last 20 responses
    ]);
  };

  const handleServerStart = async () => {
    try {
      logResponse('Connecting to WebSocket server...');
      dispatch(websocketActions.connect(`ws://localhost:${serverPort}`));
    } catch (error) {
      logResponse(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleServerStop = () => {
    logResponse('Disconnecting from WebSocket server...');
    dispatch(websocketActions.disconnect());
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      logResponse(`Logging in as ${username}...`);
      dispatch(websocketActions.login(username, password));
    } catch (error) {
      logResponse(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'server':
        return (
          <ServerControlPanel
            // Pass WebSocket client instead of embedded server
            webSocketClient={webSocketClient}
            serverStatus={serverStatus}
            onServerStart={handleServerStart}
            onServerStop={handleServerStop}
            onLogin={handleLogin}
            onApiCall={handleApiCall}
            apiResponses={apiResponses}
            onLogResponse={logResponse}
          />
        );
      case 'smarthome':
        return <SmartHomeControlPanel onApiCall={handleApiCall} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {renderContent()}

      {/* Performance Monitor - only show on server tab */}
      {activeTab === 'server' && apiCalls.length > 0 && <PerformanceMonitor apiCalls={apiCalls} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
});

// Wrap App with Redux Provider
const AppWithProvider: React.FC = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default AppWithProvider;
