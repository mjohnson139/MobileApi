import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';

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
            style={[
              styles.metricValue,
              slowCalls.length > 0 ? styles.slowCallsText : styles.fastCallsText,
            ]}
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
                style={[
                  styles.duration,
                  call.duration > 1000 ? styles.slowCallsText : styles.fastCallsText,
                ]}
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
    backgroundColor: colors.white,
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
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
    color: colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 12,
  },
  callsList: {
    maxHeight: 200,
  },
  callItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpoint: {
    fontSize: 14,
    color: colors.darkGray,
    fontFamily: 'monospace',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
  },
  slowCallsText: {
    color: colors.error,
  },
  fastCallsText: {
    color: colors.success,
  },
  timestamp: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 2,
  },
});

export default PerformanceMonitor;
