import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TabNavigationProps {
  activeTab: 'server' | 'smarthome';
  onTabChange: (tab: 'server' | 'smarthome') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'server' && styles.activeTab]}
        onPress={() => onTabChange('server')}
      >
        <Text style={[styles.tabText, activeTab === 'server' && styles.activeTabText]}>
          Server Control
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'smarthome' && styles.activeTab]}
        onPress={() => onTabChange('smarthome')}
      >
        <Text style={[styles.tabText, activeTab === 'smarthome' && styles.activeTabText]}>
          Smart Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default TabNavigation;
