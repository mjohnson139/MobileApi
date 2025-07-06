import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { WebSocketClient } from '../websocket/WebSocketClient';
import { colors } from '../constants/colors';

interface ServerControlPanelProps {
  webSocketClient: WebSocketClient;
  serverStatus: string;
  onServerStart: () => Promise<void>;
  onServerStop: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onApiCall: (endpoint: string, duration: number) => void;
  apiResponses: { timestamp: string; message: string }[];
  onLogResponse: (message: string) => void;
}

const ServerControlPanel: React.FC<ServerControlPanelProps> = ({
  webSocketClient,
  serverStatus,
  onServerStart,
  onServerStop,
  onLogin,
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
    try {
      await onServerStart();
    } catch (error) {
      Alert.alert('Error', `Failed to connect to server: ${(error as Error).message}`);
    }
  };

  const stopServer = async () => {
    try {
      onServerStop();
    } catch (error) {
      Alert.alert('Error', `Failed to disconnect: ${(error as Error).message}`);
    }
  };

  const loginToServer = async () => {
    try {
      await onLogin('api_user', 'mobile_api_password');
    } catch (error) {
      Alert.alert('Login Error', `Failed to login: ${(error as Error).message}`);
    }
  };

  const testHealthEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.getHealth();
      }, 'health');

      onLogResponse(`Health check: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`Health check failed: ${(error as Error).message}`);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.login('test_user', 'test_password');
      }, 'auth/login');

      onLogResponse(`Auth test: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`Auth test failed: ${(error as Error).message}`);
    }
  };

  const testStateEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.getState();
      }, 'state');

      onLogResponse(`State: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`State request failed: ${(error as Error).message}`);
    }
  };

  const testUpdateStateEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.updateState('ui_state.controls.living_room_light.state.power', 'on');
      }, 'updateState');

      onLogResponse(`State update: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`State update failed: ${(error as Error).message}`);
    }
  };

  const testActionEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.executeAction('device_control', 'living_room_light', { power: 'on' });
      }, 'executeAction');

      onLogResponse(`Action executed: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`Action failed: ${(error as Error).message}`);
    }
  };

  const testScreenshotEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.captureScreenshot({ format: 'png', quality: 0.8 });
      }, 'screenshot');

      onLogResponse(`Screenshot captured: ${data.format} (${data.metadata.size} bytes)`);
    } catch (error) {
      onLogResponse(`Screenshot failed: ${(error as Error).message}`);
    }
  };

  const testMetricsEndpoint = async () => {
    try {
      const data = await trackApiCall(async () => {
        return await webSocketClient.getMetrics();
      }, 'metrics');

      onLogResponse(`Metrics: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      onLogResponse(`Metrics request failed: ${(error as Error).message}`);
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
            serverStatus.includes('Running') ? styles.statusRunning : styles.statusStopped,
          ]}
        >
          {serverStatus}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={startServer}
          disabled={serverStatus.includes('Running') || serverStatus.includes('Connected')}
        >
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={stopServer}
          disabled={serverStatus === 'Stopped'}
        >
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.authButton]}
          onPress={loginToServer}
          disabled={!webSocketClient.isConnected() || webSocketClient.isAuthenticated()}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testHealthEndpoint}
          disabled={!webSocketClient.isConnected()}
        >
          <Text style={styles.buttonText}>Test Health</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testAuthEndpoint}
          disabled={!webSocketClient.isConnected()}
        >
          <Text style={styles.buttonText}>Test Auth</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testStateEndpoint}
          disabled={!webSocketClient.isAuthenticated()}
        >
          <Text style={styles.buttonText}>Get State</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testUpdateStateEndpoint}
          disabled={!webSocketClient.isAuthenticated()}
        >
          <Text style={styles.buttonText}>Update State</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testActionEndpoint}
          disabled={!webSocketClient.isAuthenticated()}
        >
          <Text style={styles.buttonText}>Execute Action</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testScreenshotEndpoint}
          disabled={!webSocketClient.isAuthenticated()}
        >
          <Text style={styles.buttonText}>Screenshot</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testMetricsEndpoint}
          disabled={!webSocketClient.isAuthenticated()}
        >
          <Text style={styles.buttonText}>Get Metrics</Text>
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
    backgroundColor: colors.lightGray,
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: colors.darkGray,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusRunning: {
    color: colors.success,
  },
  statusStopped: {
    color: colors.error,
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
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  authButton: {
    backgroundColor: colors.warning,
  },
  testButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: colors.darkGray,
  },
  responseContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  responseTime: {
    fontSize: 12,
    color: colors.mediumGray,
    fontFamily: 'monospace',
  },
  responseMessage: {
    fontSize: 14,
    color: colors.darkGray,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

export default ServerControlPanel;
