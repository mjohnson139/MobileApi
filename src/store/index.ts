import { configureStore } from '@reduxjs/toolkit';
import serverReducer from './serverSlice';
import uiReducer from './uiSlice';
import devicesReducer from './devicesSlice';

// Custom middleware to handle state updates by path
const pathUpdateMiddleware = (store: any) => (next: any) => (action: any) => {
  if (action.type === 'UPDATE_STATE_BY_PATH') {
    const { path, value } = action.payload;
    const pathParts = path.split('.');

    // Get current state
    const state = store.getState();

    // Update nested state based on path
    const newState = JSON.parse(JSON.stringify(state));
    let current = newState;

    // Navigate to the parent of the target property
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current[pathParts[i]] === undefined) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }

    // Set the final value
    current[pathParts[pathParts.length - 1]] = value;

    // Determine which slice to update based on path
    if (path.startsWith('ui_state.') || path.startsWith('ui.')) {
      const uiPath = path.replace(/^ui_state\./, '').replace(/^ui\./, '');
      const uiParts = uiPath.split('.');

      if (uiParts[0] === 'controls' && uiParts.length >= 3) {
        // Update specific control
        store.dispatch({
          type: 'ui/updateControl',
          payload: {
            id: uiParts[1],
            updates: { [uiParts.slice(2).join('.')]: value },
          },
        });
      } else if (uiParts[0] === 'currentScreen') {
        store.dispatch({
          type: 'ui/setCurrentScreen',
          payload: value,
        });
      }
    } else if (path.startsWith('device_state.') || path.startsWith('devices.')) {
      const devicePath = path.replace(/^device_state\./, '').replace(/^devices\./, '');
      const deviceParts = devicePath.split('.');

      if (deviceParts[0] === 'devices' && deviceParts.length >= 3) {
        // Update specific device
        store.dispatch({
          type: 'devices/updateDevice',
          payload: {
            id: deviceParts[1],
            updates: { [deviceParts.slice(2).join('.')]: value },
          },
        });
      }
    }

    return next(action);
  }

  return next(action);
};

export const store = configureStore({
  reducer: {
    server: serverReducer,
    ui: uiReducer,
    devices: devicesReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(pathUpdateMiddleware),
  devTools: process.env.NODE_ENV === 'development',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
