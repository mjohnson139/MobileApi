import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DeviceState } from '../../store/devicesSlice';

interface DeviceCardProps {
  device: DeviceState;
  onToggle?: () => void;
  onValueChange?: (value: number) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onToggle }) => {
  const getStatusColor = () => {
    if (!device.isOnline) {
      return '#999';
    }
    return device.state === 'on' ? '#4CAF50' : '#666';
  };

  const renderDeviceControl = () => {
    switch (device.type) {
      case 'switch':
        return (
          <TouchableOpacity
            style={[
              styles.switchButton,
              { backgroundColor: device.state === 'on' ? '#4CAF50' : '#ccc' },
            ]}
            onPress={onToggle}
            disabled={!device.isOnline}
          >
            <Text style={styles.switchText}>{device.state === 'on' ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        );

      case 'dimmer':
        return (
          <View style={styles.dimmerContainer}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                { backgroundColor: device.state === 'on' ? '#4CAF50' : '#ccc' },
              ]}
              onPress={onToggle}
              disabled={!device.isOnline}
            >
              <Text style={styles.switchText}>{device.state === 'on' ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
            {device.state === 'on' && <Text style={styles.dimmerValue}>{device.value || 0}%</Text>}
          </View>
        );

      case 'temperature':
        return (
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperatureValue}>{device.value || 0}°F</Text>
            <Text style={styles.temperatureLabel}>Current</Text>
          </View>
        );

      default:
        return <Text style={styles.unknownType}>Unknown Device</Text>;
    }
  };

  return (
    <View style={[styles.container, !device.isOnline && styles.offline]}>
      <View style={styles.header}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
      </View>

      <Text style={styles.deviceType}>{device.type.toUpperCase()}</Text>

      <View style={styles.controlArea}>{renderDeviceControl()}</View>

      <Text style={styles.lastUpdated}>
        Updated: {new Date(device.lastUpdated).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offline: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  controlArea: {
    alignItems: 'center',
    marginBottom: 12,
  },
  switchButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  switchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dimmerContainer: {
    alignItems: 'center',
  },
  dimmerValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
  temperatureContainer: {
    alignItems: 'center',
  },
  temperatureValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  temperatureLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  unknownType: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});

export default DeviceCard;
