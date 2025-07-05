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

module.exports = config;