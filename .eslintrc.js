module.exports = {
  root: true,
  extends: [
    'expo',
    '@react-native',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
  },
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'poc/',
    '*.config.js',
    'metro.config.js',
    'babel.config.js',
    'demo-*.js',
  ],
};