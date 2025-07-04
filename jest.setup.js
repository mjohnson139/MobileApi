// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-32-characters-minimum-length-required';
process.env.NODE_ENV = 'test';
process.env.API_PORT = '8081';
process.env.ENABLE_API_SERVER = 'true';

// Mock react-native for testing
jest.mock('react-native', () => ({
  AppRegistry: {
    registerComponent: jest.fn(),
  },
  StyleSheet: {
    create: styles => styles,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock redux provider
jest.mock('react-redux', () => ({
  Provider: ({ children }) => children,
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Set test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  // Suppress console logs during tests
  if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Clean up any test artifacts
});
