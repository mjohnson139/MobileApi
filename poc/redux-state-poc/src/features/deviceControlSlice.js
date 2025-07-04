/**
 * Device Control Slice
 * Manages smart home device states for the Mobile API Control Pattern demo
 */

const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');

// Async thunks for device control
const updateDeviceState = createAsyncThunk(
  'devices/updateState',
  async ({ deviceId, updates }, { getState, rejectWithValue }) => {
    try {
      // Simulate API call to update device
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      return { deviceId, updates, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const executeDeviceAction = createAsyncThunk(
  'devices/executeAction',
  async ({ deviceId, action, payload }, { getState, rejectWithValue }) => {
    try {
      // Simulate API call to execute device action
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return { 
        deviceId, 
        action, 
        payload, 
        executedAt: Date.now(),
        success: true 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Device registry
  devices: {
    living_room_light: {
      id: 'living_room_light',
      name: 'Living Room Light',
      type: 'switch',
      room: 'living_room',
      state: {
        power: 'on',
        brightness: 75,
        color: '#ffffff',
      },
      capabilities: ['power', 'brightness', 'color'],
      lastUpdated: Date.now(),
      online: true,
    },
    bedroom_light: {
      id: 'bedroom_light',
      name: 'Bedroom Light',
      type: 'switch',
      room: 'bedroom',
      state: {
        power: 'off',
        brightness: 50,
      },
      capabilities: ['power', 'brightness'],
      lastUpdated: Date.now(),
      online: true,
    },
    thermostat: {
      id: 'thermostat',
      name: 'Main Thermostat',
      type: 'temperature',
      room: 'living_room',
      state: {
        current_temp: 72,
        target_temp: 70,
        mode: 'cool', // 'heat', 'cool', 'auto', 'off'
        fan: 'auto',
      },
      capabilities: ['temperature', 'mode', 'fan'],
      lastUpdated: Date.now(),
      online: true,
    },
    smart_lock: {
      id: 'smart_lock',
      name: 'Front Door Lock',
      type: 'lock',
      room: 'entrance',
      state: {
        locked: true,
        battery_level: 85,
      },
      capabilities: ['lock', 'battery'],
      lastUpdated: Date.now(),
      online: true,
    },
  },
  
  // Room organization
  rooms: {
    living_room: {
      id: 'living_room',
      name: 'Living Room',
      devices: ['living_room_light', 'thermostat'],
    },
    bedroom: {
      id: 'bedroom',
      name: 'Bedroom',
      devices: ['bedroom_light'],
    },
    entrance: {
      id: 'entrance',
      name: 'Entrance',
      devices: ['smart_lock'],
    },
  },
  
  // Operation states
  loading: {
    deviceUpdates: {},
    deviceActions: {},
  },
  
  // Recent actions history
  actionHistory: [],
  
  // Error states
  errors: {},
  
  // Performance metrics
  metrics: {
    totalStateUpdates: 0,
    totalActionsExecuted: 0,
    averageResponseTime: 0,
    lastActionTime: null,
  },
};

const deviceControlSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    // Direct device state updates (for UI interactions)
    setDeviceState: (state, action) => {
      const { deviceId, updates } = action.payload;
      
      if (state.devices[deviceId]) {
        state.devices[deviceId].state = {
          ...state.devices[deviceId].state,
          ...updates,
        };
        state.devices[deviceId].lastUpdated = Date.now();
        state.metrics.totalStateUpdates += 1;
      }
    },
    
    // Device online/offline status
    setDeviceOnline: (state, action) => {
      const { deviceId, online } = action.payload;
      
      if (state.devices[deviceId]) {
        state.devices[deviceId].online = online;
        state.devices[deviceId].lastUpdated = Date.now();
      }
    },
    
    // Add new device
    addDevice: (state, action) => {
      const device = action.payload;
      state.devices[device.id] = {
        ...device,
        lastUpdated: Date.now(),
        online: true,
      };
      
      // Add to room if specified
      if (device.room && state.rooms[device.room]) {
        state.rooms[device.room].devices.push(device.id);
      }
    },
    
    // Remove device
    removeDevice: (state, action) => {
      const deviceId = action.payload;
      
      // Remove from devices
      delete state.devices[deviceId];
      
      // Remove from rooms
      Object.values(state.rooms).forEach(room => {
        room.devices = room.devices.filter(id => id !== deviceId);
      });
      
      // Clear any loading states
      delete state.loading.deviceUpdates[deviceId];
      delete state.loading.deviceActions[deviceId];
      delete state.errors[deviceId];
    },
    
    // Clear device errors
    clearDeviceError: (state, action) => {
      const deviceId = action.payload;
      delete state.errors[deviceId];
    },
    
    // Add action to history
    addActionToHistory: (state, action) => {
      const actionRecord = {
        ...action.payload,
        timestamp: Date.now(),
      };
      
      state.actionHistory.unshift(actionRecord);
      
      // Keep only last 50 actions
      if (state.actionHistory.length > 50) {
        state.actionHistory = state.actionHistory.slice(0, 50);
      }
      
      state.metrics.totalActionsExecuted += 1;
      state.metrics.lastActionTime = Date.now();
    },
    
    // Bulk state update for API synchronization
    syncDeviceStates: (state, action) => {
      const { devices, timestamp } = action.payload;
      
      Object.keys(devices).forEach(deviceId => {
        if (state.devices[deviceId]) {
          state.devices[deviceId].state = devices[deviceId].state;
          state.devices[deviceId].lastUpdated = timestamp;
        }
      });
    },
    
    // Reset all devices to initial state
    resetDevices: () => initialState,
  },
  
  extraReducers: (builder) => {
    builder
      // Update device state async
      .addCase(updateDeviceState.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.loading.deviceUpdates[deviceId] = true;
        delete state.errors[deviceId];
      })
      .addCase(updateDeviceState.fulfilled, (state, action) => {
        const { deviceId, updates, timestamp } = action.payload;
        
        state.loading.deviceUpdates[deviceId] = false;
        
        if (state.devices[deviceId]) {
          state.devices[deviceId].state = {
            ...state.devices[deviceId].state,
            ...updates,
          };
          state.devices[deviceId].lastUpdated = timestamp;
        }
        
        state.metrics.totalStateUpdates += 1;
      })
      .addCase(updateDeviceState.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.loading.deviceUpdates[deviceId] = false;
        state.errors[deviceId] = action.payload;
      })
      
      // Execute device action async
      .addCase(executeDeviceAction.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.loading.deviceActions[deviceId] = true;
        delete state.errors[deviceId];
      })
      .addCase(executeDeviceAction.fulfilled, (state, action) => {
        const { deviceId, action: actionType, payload, executedAt } = action.payload;
        
        state.loading.deviceActions[deviceId] = false;
        
        // Add to action history
        state.actionHistory.unshift({
          deviceId,
          action: actionType,
          payload,
          executedAt,
          success: true,
        });
        
        // Keep only last 50 actions
        if (state.actionHistory.length > 50) {
          state.actionHistory = state.actionHistory.slice(0, 50);
        }
        
        state.metrics.totalActionsExecuted += 1;
        state.metrics.lastActionTime = executedAt;
      })
      .addCase(executeDeviceAction.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.loading.deviceActions[deviceId] = false;
        state.errors[deviceId] = action.payload;
      });
  },
});

module.exports = {
  deviceControlSlice,
  updateDeviceState,
  executeDeviceAction,
};