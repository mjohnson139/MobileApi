/**
 * Redux Store Configuration
 * Demonstrates centralized state management for Mobile API Control Pattern
 */

const { configureStore } = require('@reduxjs/toolkit');
const { uiStateSlice } = require('../features/uiStateSlice');
const { deviceControlSlice } = require('../features/deviceControlSlice');
const { serverStateSlice } = require('../features/serverStateSlice');

// Configure the Redux store
const store = configureStore({
  reducer: {
    ui: uiStateSlice.reducer,
    devices: deviceControlSlice.reducer,
    server: serverStateSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript support (would be used in actual implementation)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

module.exports = {
  store,
  // Action creators
  uiActions: uiStateSlice.actions,
  deviceActions: deviceControlSlice.actions,
  serverActions: serverStateSlice.actions,
};
