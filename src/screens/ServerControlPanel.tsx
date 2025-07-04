import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { EmbeddedServer } from '../server/EmbeddedServer';

interface ServerControlPanelProps {
  embeddedServer: EmbeddedServer | null;
  serverStatus: string;
  serverPort: number;
  onServerStatusChange: (status: string) => void;
  onApiCall: (endpoint: string, duration: number) => void;
  apiResponses: Array<{ timestamp: string; message: string }>;
  onLogResponse: (message: string) => void;
}

const ServerControlPanel: React.FC<ServerControlPanelProps> = ({
  embeddedServer,
  serverStatus,
  serverPort,
  onServerStatusChange,
  onApiCall,
  apiResponses,
  onLogResponse,
}) => {
  const trackApiCall = async (apiCall: () => Promise<any>, endpoint: string) => {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      onApiCall(endpoint, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      onApiCall(endpoint, duration);
      throw error;
    }
  };

  const startServer = async () => {
    if (!embeddedServer) {
      return;
    }

    try {
      onServerStatusChange('Starting...');
      await embeddedServer.start();
      onServerStatusChange(`Running on port ${serverPort}`);
      onLogResponse('Server started successfully');
    } catch (error) {
      onServerStatusChange('Failed to start');
      Alert.alert('Error', `Failed to start server: ${(error as Error).message}`);
    }
  };

  const stopServer = async () => {
    if (!embeddedServer) {
      return;
    }

    try {
      onServerStatusChange('Stopping...');
      await embeddedServer.stop();
      onServerStatusChange('Stopped');
      onLogResponse('Server stopped');
    } catch (error) {
      Alert.alert('Error', `Failed to stop server: ${(error as Error).message}`);
    }
  };

  const testHealthEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        const response = await fetch(`http://localhost:${serverPort}/health`);
        return response.json();
      }, '/health');

      onLogResponse(`Health check: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`Health check failed: ${(error as Error).message}`);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        const response = await fetch(`http://localhost:${serverPort}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'api_user',
            password: 'mobile_api_password',
          }),
        });
        return response.json();
      }, '/auth/login');

      onLogResponse(`Auth test: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`Auth test failed: ${(error as Error).message}`);
    }
  };

  const testStateEndpoint = async () => {
    try {
      // First login to get token
      const authData = await trackApiCall(async () => {
        const authResponse = await fetch(`http://localhost:${serverPort}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'api_user',
            password: 'mobile_api_password',
          }),
        });

        if (!authResponse.ok) {
          throw new Error('Authentication failed');
        }

        return authResponse.json();
      }, '/auth/login');

      const token = authData.token;

      // Now test state endpoint
      const data = await trackApiCall(async () => {
        const response = await fetch(`http://localhost:${serverPort}/api/state`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.json();
      }, '/api/state');

      onLogResponse(`State: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`State request failed: ${(error as Error).message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Server Control</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Server Status:</Text>
        <Text
          style={[
            styles.statusText,
            { color: serverStatus.includes('Running') ? '#4CAF50' : '#FF5722' },
          ]}
        >
          {serverStatus}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={startServer}
          disabled={serverStatus.includes('Running')}
        >
          <Text style={styles.buttonText}>Start Server</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={stopServer}
          disabled={!serverStatus.includes('Running')}
        >
          <Text style={styles.buttonText}>Stop Server</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testHealthEndpoint}
          disabled={!serverStatus.includes('Running')}
        >
          <Text style={styles.buttonText}>Test /health</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testAuthEndpoint}
          disabled={!serverStatus.includes('Running')}
        >
          <Text style={styles.buttonText}>Test /auth</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testStateEndpoint}
          disabled={!serverStatus.includes('Running')}
        >
          <Text style={styles.buttonText}>Test /api/state</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.responseTitle}>API Responses:</Text>
      <ScrollView style={styles.responseContainer}>
        {apiResponses.map((response, index) => (
          <View key={index} style={styles.responseItem}>
            <Text style={styles.responseTime}>{response.timestamp}</Text>
            <Text style={styles.responseMessage}>{response.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF5722',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  responseContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  responseTime: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  responseMessage: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

export default ServerControlPanel;
