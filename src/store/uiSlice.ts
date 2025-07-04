import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  currentScreen: string;
  controls: Record<string, any>;
  navigation: {
    history: string[];
    currentIndex: number;
  };
  settings: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    enableNotifications: boolean;
  };
}

const initialState: UIState = {
  currentScreen: 'home',
  controls: {
    living_room_light: {
      type: 'switch',
      state: 'on',
      brightness: 75,
    },
    bedroom_light: {
      type: 'switch',
      state: 'off',
    },
    thermostat: {
      type: 'temperature',
      current_temp: 72,
      target_temp: 70,
      mode: 'cool',
    },
  },
  navigation: {
    history: ['home'],
    currentIndex: 0,
  },
  settings: {
    theme: 'light',
    language: 'en',
    enableNotifications: true,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      state.currentScreen = action.payload;
      state.navigation.history.push(action.payload);
      state.navigation.currentIndex = state.navigation.history.length - 1;
    },
    updateControl: (state, action: PayloadAction<{ id: string; updates: any }>) => {
      const { id, updates } = action.payload;
      if (state.controls[id]) {
        state.controls[id] = { ...state.controls[id], ...updates };
      }
    },
    updateSettings: (state, action: PayloadAction<Partial<UIState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const { setCurrentScreen, updateControl, updateSettings } = uiSlice.actions;
export default uiSlice.reducer;
