const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript paths if needed
config.resolver.alias = {
  '@': './src',
  '@/server': './src/server',
  '@/types': './src/types',
  '@/config': './src/config',
  '@/utils': './src/utils',
};

// Exclude Node.js-specific modules from React Native bundle
config.resolver.blockList = [
  /node_modules\/compression\/.*/,
];

module.exports = config;