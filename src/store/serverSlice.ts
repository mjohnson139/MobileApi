import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ServerState {
  isRunning: boolean;
  port: number;
  startTime: number | null;
  requestCount: number;
  errorCount: number;
  metrics: any[];
}

const initialState: ServerState = {
  isRunning: false,
  port: 8080,
  startTime: null,
  requestCount: 0,
  errorCount: 0,
  metrics: [],
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    start: (state, action: PayloadAction<{ port: number; startTime: number }>) => {
      state.isRunning = true;
      state.port = action.payload.port;
      state.startTime = action.payload.startTime;
    },
    stop: (state) => {
      state.isRunning = false;
      state.startTime = null;
    },
    recordRequest: (state, action: PayloadAction<any>) => {
      state.requestCount += 1;
      state.metrics.push(action.payload);
      // Keep only last 100 metrics
      if (state.metrics.length > 100) {
        state.metrics.shift();
      }
    },
    recordError: (state, _action: PayloadAction<any>) => {
      state.errorCount += 1;
    },
  },
});

export const { start, stop, recordRequest, recordError } = serverSlice.actions;
export default serverSlice.reducer;