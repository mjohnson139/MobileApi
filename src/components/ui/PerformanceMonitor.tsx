import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface ApiCall {
  endpoint: string;
  duration: number;
  timestamp: string;
}

interface PerformanceMonitorProps {
  apiCalls: ApiCall[];
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ apiCalls }) => {
  const averageResponseTime =
    apiCalls.length > 0
      ? Math.round(apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length)
      : 0;

  const slowCalls = apiCalls.filter(call => call.duration > 1000);
  const recentCalls = apiCalls.slice(-10);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Monitor</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{apiCalls.length}</Text>
          <Text style={styles.metricLabel}>Total Calls</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricValue}>{averageResponseTime}ms</Text>
          <Text style={styles.metricLabel}>Avg Response</Text>
        </View>

        <View style={styles.metric}>
          <Text
            style={[styles.metricValue, { color: slowCalls.length > 0 ? '#FF5722' : '#4CAF50' }]}
          >
            {slowCalls.length}
          </Text>
          <Text style={styles.metricLabel}>Slow Calls</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent API Calls</Text>
      <ScrollView style={styles.callsList}>
        {recentCalls.map((call, index) => (
          <View key={index} style={styles.callItem}>
            <View style={styles.callHeader}>
              <Text style={styles.endpoint}>{call.endpoint}</Text>
              <Text
                style={[styles.duration, { color: call.duration > 1000 ? '#FF5722' : '#4CAF50' }]}
              >
                {call.duration}ms
              </Text>
            </View>
            <Text style={styles.timestamp}>{new Date(call.timestamp).toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  callsList: {
    maxHeight: 200,
  },
  callItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpoint: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default PerformanceMonitor;
