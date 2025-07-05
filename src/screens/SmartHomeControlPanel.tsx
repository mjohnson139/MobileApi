import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { executeToggleAction, executeSetAction, DeviceState } from '../store/devicesSlice';
import DeviceCard from '../components/device/DeviceCard';
import { colors } from '../constants/colors';

interface SmartHomeControlPanelProps {
  onApiCall?: (endpoint: string, duration: number) => void;
}

const SmartHomeControlPanel: React.FC<SmartHomeControlPanelProps> = ({ onApiCall }) => {
  const dispatch = useDispatch();
  const devices = useSelector((state: RootState) => state.devices.devices);
  const serverStatus = useSelector((state: RootState) => state.server.status);

  // Performance monitoring
  const trackApiCall = async (apiCall: () => Promise<any>, endpoint: string) => {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      onApiCall?.(endpoint, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      onApiCall?.(endpoint, duration);
      throw error;
    }
  };

  const handleDeviceToggle = async (deviceId: string) => {
    try {
      // Update local state immediately for responsive UI
      dispatch(executeToggleAction({ target: deviceId }));

      // If server is running, sync with API
      if (serverStatus === 'running') {
        await trackApiCall(async () => {
          const response = await fetch('http://localhost:8080/api/actions/toggle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
            body: JSON.stringify({
              target: deviceId,
              payload: {},
            }),
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
          }

          return response.json();
        }, '/api/actions/toggle');
      }
    } catch (error) {
      // Revert local state on API failure
      dispatch(executeToggleAction({ target: deviceId }));
      Alert.alert('Error', `Failed to toggle device: ${(error as Error).message}`);
    }
  };

  const handleTemperatureChange = async (deviceId: string, newValue: number) => {
    try {
      // Update local state
      dispatch(
        executeSetAction({
          target: deviceId,
          payload: { value: newValue },
        }),
      );

      // Sync with API if server is running
      if (serverStatus === 'running') {
        await trackApiCall(async () => {
          const response = await fetch('http://localhost:8080/api/actions/set', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
            body: JSON.stringify({
              target: deviceId,
              payload: { value: newValue },
            }),
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
          }

          return response.json();
        }, '/api/actions/set');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to update temperature: ${(error as Error).message}`);
    }
  };

  // Helper function to get auth token (simplified)
  const getAuthToken = async (): Promise<string> => {
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'api_user',
          password: 'mobile_api_password',
        }),
      });
      const data = await response.json();
      return data.token || '';
    } catch {
      return '';
    }
  };

  const deviceList: DeviceState[] = Object.values(devices);
  const lightDevices = deviceList.filter(d => d.type === 'switch' || d.type === 'dimmer');
  const temperatureDevices = deviceList.filter(d => d.type === 'temperature');
  const otherDevices = deviceList.filter(
    d => !['switch', 'dimmer', 'temperature'].includes(d.type),
  );

  const onlineDevices = deviceList.filter(d => d.isOnline).length;
  const activeDevices = deviceList.filter(d => d.state === 'on').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Home Control</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {onlineDevices}/{deviceList.length} Online • {activeDevices} Active
          </Text>
          <View
            style={[
              styles.serverIndicator,
              serverStatus === 'running' ? styles.serverRunning : styles.serverStopped,
            ]}
          />
        </View>
      </View>

      {/* Lighting Section */}
      {lightDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lighting</Text>
          <View style={styles.deviceGrid}>
            {lightDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onToggle={() => handleDeviceToggle(device.id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Climate Section */}
      {temperatureDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Climate</Text>
          <View style={styles.deviceGrid}>
            {temperatureDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onValueChange={(value: number) => handleTemperatureChange(device.id, value)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Other Devices */}
      {otherDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Devices</Text>
          <View style={styles.deviceGrid}>
            {otherDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onToggle={() => handleDeviceToggle(device.id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              lightDevices.forEach(device => {
                if (device.state === 'on') {
                  handleDeviceToggle(device.id);
                }
              });
            }}
          >
            <Text style={styles.quickActionText}>All Lights Off</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              lightDevices.forEach(device => {
                if (device.state === 'off') {
                  handleDeviceToggle(device.id);
                }
              });
            }}
          >
            <Text style={styles.quickActionText}>All Lights On</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    padding: 20,
    paddingTop: 60,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  serverIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serverRunning: {
    backgroundColor: colors.success,
  },
  serverStopped: {
    backgroundColor: colors.error,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.darkGray,
    marginLeft: 16,
    marginBottom: 12,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SmartHomeControlPanel;
