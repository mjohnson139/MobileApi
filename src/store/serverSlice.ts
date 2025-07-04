import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ServerState {
  isRunning: boolean;
  status: string;
  port: number;
  startTime: number | null;
  requestCount: number;
  errorCount: number;
  metrics: any[];
}

const initialState: ServerState = {
  isRunning: false,
  status: 'stopped',
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
      state.status = 'running';
      state.port = action.payload.port;
      state.startTime = action.payload.startTime;
    },
    stop: state => {
      state.isRunning = false;
      state.status = 'stopped';
      state.startTime = null;
    },
    setStatus: (state, action: PayloadAction<string>) => {
      state.status = action.payload;
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

export const { start, stop, setStatus, recordRequest, recordError } = serverSlice.actions;
export default serverSlice.reducer;
