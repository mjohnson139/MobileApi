import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { EmbeddedServer } from './server/EmbeddedServer';
import { store, RootState } from './store';
import TabNavigation from './components/ui/TabNavigation';
import ServerControlPanel from './screens/ServerControlPanel';
import SmartHomeControlPanel from './screens/SmartHomeControlPanel';
import PerformanceMonitor from './components/ui/PerformanceMonitor';

interface ApiCall {
  endpoint: string;
  duration: number;
  timestamp: string;
}

// Main App component
const App: React.FC = () => {
  const [serverStatus, setServerStatus] = React.useState('Stopped');
  const [serverPort] = React.useState(8080);
  const [activeTab, setActiveTab] = React.useState<'server' | 'smarthome'>('smarthome');
  const [apiResponses, setApiResponses] = React.useState<
    Array<{ timestamp: string; message: string }>
  >([]);
  const [apiCalls, setApiCalls] = React.useState<ApiCall[]>([]);
  const [embeddedServer, setEmbeddedServer] = React.useState<EmbeddedServer | null>(null);

  // Get server status from Redux store
  const serverState = useSelector((state: RootState) => state.server);

  React.useEffect(() => {
    // Initialize embedded server
    const server = new EmbeddedServer(store, serverPort);
    setEmbeddedServer(server);

    return () => {
      // Cleanup server on component unmount
      if (server && server.isServerRunning()) {
        server.stop().catch(console.error);
      }
    };
  }, [serverPort]);

  // Sync server status with Redux store
  React.useEffect(() => {
    if (serverState.status) {
      setServerStatus(serverState.status);
    }
  }, [serverState.status]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'server':
        return (
          <ServerControlPanel
            embeddedServer={embeddedServer}
            serverStatus={serverStatus}
            serverPort={serverPort}
            onServerStatusChange={setServerStatus}
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
    backgroundColor: '#F5F5F5',
  },
});

// Wrap App with Redux Provider
const AppWithProvider: React.FC = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default AppWithProvider;
