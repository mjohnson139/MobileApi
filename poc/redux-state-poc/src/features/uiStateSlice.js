/**
 * UI State Slice
 * Manages application UI state for the Mobile API Control Pattern
 */

const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');

// Async thunk for API synchronization
const syncUIState = createAsyncThunk(
  'ui/syncState',
  async (payload, { getState, rejectWithValue }) => {
    try {
      // Simulate API call to sync state
      const currentState = getState().ui;
      
      // Mock API response
      return {
        ...currentState,
        lastSynced: Date.now(),
        syncStatus: 'success'
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Current screen/view
  currentScreen: 'home',
  
  // Loading states
  loading: {
    sync: false,
    navigation: false,
  },
  
  // UI component states
  components: {
    header: {
      title: 'Smart Home Control',
      showBackButton: false,
    },
    sidebar: {
      isOpen: false,
      items: [
        { id: 'home', label: 'Home', active: true },
        { id: 'settings', label: 'Settings', active: false },
        { id: 'about', label: 'About', active: false },
      ],
    },
    notifications: {
      visible: false,
      message: '',
      type: 'info', // 'info', 'success', 'warning', 'error'
    },
  },
  
  // API synchronization state
  sync: {
    lastSynced: null,
    syncStatus: 'idle', // 'idle', 'loading', 'success', 'error'
    error: null,
  },
  
  // Performance metrics
  metrics: {
    renderCount: 0,
    stateUpdateCount: 0,
    lastUpdateTime: null,
  },
};

const uiStateSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Screen navigation
    navigateToScreen: (state, action) => {
      state.currentScreen = action.payload;
      state.loading.navigation = false;
      state.metrics.stateUpdateCount += 1;
      state.metrics.lastUpdateTime = Date.now();
    },
    
    setNavigationLoading: (state, action) => {
      state.loading.navigation = action.payload;
    },
    
    // Header management
    updateHeader: (state, action) => {
      state.components.header = { ...state.components.header, ...action.payload };
      state.metrics.stateUpdateCount += 1;
    },
    
    // Sidebar management
    toggleSidebar: (state) => {
      state.components.sidebar.isOpen = !state.components.sidebar.isOpen;
      state.metrics.stateUpdateCount += 1;
    },
    
    setSidebarItem: (state, action) => {
      const { itemId, active } = action.payload;
      state.components.sidebar.items = state.components.sidebar.items.map(item => ({
        ...item,
        active: item.id === itemId ? active : false
      }));
      state.metrics.stateUpdateCount += 1;
    },
    
    // Notifications
    showNotification: (state, action) => {
      const { message, type = 'info' } = action.payload;
      state.components.notifications = {
        visible: true,
        message,
        type,
      };
      state.metrics.stateUpdateCount += 1;
    },
    
    hideNotification: (state) => {
      state.components.notifications.visible = false;
      state.metrics.stateUpdateCount += 1;
    },
    
    // Performance tracking
    incrementRenderCount: (state) => {
      state.metrics.renderCount += 1;
    },
    
    // State reset
    resetUIState: (state) => {
      return { ...initialState, metrics: state.metrics };
    },
    
    // Bulk state update (for API synchronization)
    updateUIState: (state, action) => {
      const updates = action.payload;
      Object.keys(updates).forEach(key => {
        if (state.hasOwnProperty(key)) {
          state[key] = { ...state[key], ...updates[key] };
        }
      });
      state.metrics.stateUpdateCount += 1;
      state.metrics.lastUpdateTime = Date.now();
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(syncUIState.pending, (state) => {
        state.loading.sync = true;
        state.sync.syncStatus = 'loading';
        state.sync.error = null;
      })
      .addCase(syncUIState.fulfilled, (state, action) => {
        state.loading.sync = false;
        state.sync.syncStatus = 'success';
        state.sync.lastSynced = action.payload.lastSynced;
        state.metrics.stateUpdateCount += 1;
      })
      .addCase(syncUIState.rejected, (state, action) => {
        state.loading.sync = false;
        state.sync.syncStatus = 'error';
        state.sync.error = action.payload;
      });
  },
});

module.exports = {
  uiStateSlice,
  syncUIState,
};