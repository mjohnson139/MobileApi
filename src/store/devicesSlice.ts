import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DeviceState {
  id: string;
  name: string;
  type: 'switch' | 'dimmer' | 'temperature' | 'sensor';
  state: 'on' | 'off' | 'unknown';
  value?: number;
  lastUpdated: string;
  isOnline: boolean;
}

export interface DevicesState {
  devices: Record<string, DeviceState>;
  selectedDevice: string | null;
  isLoading: boolean;
  lastSync: string | null;
}

const initialState: DevicesState = {
  devices: {
    living_room_light: {
      id: 'living_room_light',
      name: 'Living Room Light',
      type: 'switch',
      state: 'on',
      value: 75,
      lastUpdated: new Date().toISOString(),
      isOnline: true,
    },
    bedroom_light: {
      id: 'bedroom_light',
      name: 'Bedroom Light',
      type: 'switch',
      state: 'off',
      lastUpdated: new Date().toISOString(),
      isOnline: true,
    },
    thermostat: {
      id: 'thermostat',
      name: 'Home Thermostat',
      type: 'temperature',
      state: 'on',
      value: 72,
      lastUpdated: new Date().toISOString(),
      isOnline: true,
    },
  },
  selectedDevice: null,
  isLoading: false,
  lastSync: new Date().toISOString(),
};

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    updateDevice: (state, action: PayloadAction<{ id: string; updates: Partial<DeviceState> }>) => {
      const { id, updates } = action.payload;
      if (state.devices[id]) {
        state.devices[id] = {
          ...state.devices[id],
          ...updates,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    executeToggleAction: (state, action: PayloadAction<{ target: string; payload?: any }>) => {
      const { target } = action.payload;
      if (state.devices[target]) {
        const device = state.devices[target];
        device.state = device.state === 'on' ? 'off' : 'on';
        device.lastUpdated = new Date().toISOString();
      }
    },
    executeSetAction: (state, action: PayloadAction<{ target: string; payload: any }>) => {
      const { target, payload } = action.payload;
      if (state.devices[target]) {
        const device = state.devices[target];
        Object.assign(device, payload);
        device.lastUpdated = new Date().toISOString();
      }
    },
    executeTriggerAction: (state, action: PayloadAction<{ target: string; payload?: any }>) => {
      const { target } = action.payload;
      if (state.devices[target]) {
        state.devices[target].lastUpdated = new Date().toISOString();
      }
    },
    executeUpdateAction: (state, action: PayloadAction<{ target: string; payload: any }>) => {
      const { target, payload } = action.payload;
      if (state.devices[target]) {
        const device = state.devices[target];
        Object.assign(device, payload);
        device.lastUpdated = new Date().toISOString();
      }
    },
    setSelectedDevice: (state, action: PayloadAction<string | null>) => {
      state.selectedDevice = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    sync: (state) => {
      state.lastSync = new Date().toISOString();
    },
  },
});

export const {
  updateDevice,
  executeToggleAction,
  executeSetAction,
  executeTriggerAction,
  executeUpdateAction,
  setSelectedDevice,
  setLoading,
  sync,
} = devicesSlice.actions;

export default devicesSlice.reducer;