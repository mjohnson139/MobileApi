# Expo SDK 53 Migration Guide

## Overview

This guide documents the migration from React Native CLI to Expo SDK 53, providing a clean and easy installation process.

## Migration Changes

### 1. Project Structure
- **Added**: `app.json` - Expo configuration file
- **Added**: `metro.config.js` - Metro bundler configuration for Expo
- **Added**: `assets/` directory - App icons and splash screens
- **Modified**: `index.js` - Updated to use Expo's `registerRootComponent`
- **Modified**: `babel.config.js` - Updated to use `babel-preset-expo`

### 2. Dependencies Updated

#### Core Dependencies
- **React Native**: `0.74.0` → `0.79.5`
- **React**: `18.2.0` → `19.0.0`
- **Expo**: Added `~53.0.0`
- **@reduxjs/toolkit**: `^1.9.7` → `^2.2.0`
- **react-redux**: `^8.1.3` → `^9.0.0`
- **@react-native-async-storage/async-storage**: `^1.19.3` → `2.1.2`
- **react-native-get-random-values**: `^1.9.0` → `^1.11.0`

#### Dev Dependencies
- **@babel/core**: `^7.20.0` → `^7.25.0`
- **@babel/runtime**: `^7.20.0` → `^7.25.0`
- **@types/react**: `^18.0.24` → `^19.0.0`
- **@types/react-test-renderer**: `^18.0.0` → `^19.0.0`
- **babel-jest**: `^29.2.1` → `^29.7.0`
- **jest**: `^29.2.1` → `^29.7.0`
- **prettier**: `^2.4.1` → `^3.0.0`
- **react-test-renderer**: `18.2.0` → `19.0.0`
- **typescript**: `^4.8.4` → `^5.3.0`

#### Added Dependencies
- **babel-preset-expo**: `~11.0.0`
- **eslint-config-expo**: For Expo-specific linting
- **@typescript-eslint/eslint-plugin**: TypeScript linting
- **@typescript-eslint/parser**: TypeScript parser
- **metro**: `^0.81.0` - Metro bundler

#### Removed Dependencies
- **@react-native/babel-preset**: Replaced with `babel-preset-expo`
- **@react-native/eslint-config**: Replaced with `eslint-config-expo`
- **@react-native/metro-config**: Replaced with Expo's metro config
- **@react-native/typescript-config**: Replaced with Expo's TypeScript config
- **metro-react-native-babel-preset**: No longer needed

### 3. Scripts Updated

#### Package.json Scripts
```json
{
  "start": "expo start",
  "android": "expo start --android", 
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

#### Previous Scripts (React Native CLI)
```json
{
  "start": "react-native start",
  "android": "react-native run-android",
  "ios": "react-native run-ios"
}
```

### 4. Configuration Files

#### app.json
```json
{
  "expo": {
    "name": "Mobile API Control Panel",
    "slug": "mobile-api-control-panel",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "mobile-api-control-panel",
    "sdkVersion": "53.0.0",
    "platforms": ["ios", "android", "web"]
  }
}
```

#### babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-typescript',
    ],
    plugins: [],
  };
};
```

#### metro.config.js
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
  '@/server': './src/server',
  '@/types': './src/types',
  '@/config': './src/config',
  '@/utils': './src/utils',
};

module.exports = config;
```

#### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "target": "ES2020",
    "module": "esnext",
    "lib": ["ES2020", "DOM"],
    "allowJs": true,
    "jsx": "react-native",
    "moduleResolution": "bundler",
    // ... rest of configuration
  }
}
```

### 5. Code Changes

#### index.js
```javascript
// Before (React Native CLI)
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './package.json';

AppRegistry.registerComponent(appName, () => App);

// After (Expo)
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
export default App;
```

## Installation Instructions

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Clean Installation
```bash
# Clone the repository
git clone <repository-url>
cd MobileApi

# Install dependencies
npm install

# Validate the setup
npm run validate

# Start the development server
npm run start
```

### Running the App

#### Development Server
```bash
# Start Expo development server
npm run start

# Start with specific platform
npm run android   # Android
npm run ios       # iOS  
npm run web       # Web browser
```

#### Production Build
```bash
# Build for production
npx expo build:android
npx expo build:ios
npx expo build:web
```

## Benefits of Expo SDK 53

### 1. Simplified Development
- **No Android Studio/Xcode Required**: Develop without native toolchains
- **Universal Platform**: Single codebase for iOS, Android, and Web
- **Hot Reloading**: Fast development cycles with instant updates

### 2. Enhanced Developer Experience
- **Expo Go App**: Test on physical devices without building
- **Web Support**: Run React Native apps in web browsers
- **TypeScript Support**: First-class TypeScript integration
- **Modern Tooling**: Latest React Native and tooling versions

### 3. Improved Performance
- **Metro Bundler**: Faster bundling and builds
- **Tree Shaking**: Smaller bundle sizes
- **Modern JavaScript**: ES2020+ features and optimizations

### 4. Easy Distribution
- **Expo Application Services (EAS)**: Cloud-based builds
- **Over-the-Air Updates**: Update apps without app store approval
- **Web Deployment**: Deploy to web with a single command

## Migration Benefits

1. **Clean Installation**: Users can simply run `npm install` and `npm start`
2. **Cross-Platform**: Native support for iOS, Android, and Web
3. **Modern Dependencies**: Latest React Native and ecosystem packages
4. **Better Developer Experience**: Expo tooling and development server
5. **Future-Proof**: Aligned with latest React Native and Expo standards

## Compatibility Notes

- **Existing functionality**: All Smart Home Control Panel features preserved
- **API Server**: Embedded Express.js server continues to work
- **Redux State**: State management remains unchanged
- **TypeScript**: Full TypeScript support with improved configuration
- **Testing**: Jest tests continue to work with updated configurations

## Troubleshooting

### Common Issues

1. **Port Conflicts**: If port 8081 is in use, Expo will automatically find another port
2. **Node Version**: Ensure Node.js 18+ is installed
3. **Dependencies**: Run `npm install` if there are missing dependencies
4. **Cache Issues**: Clear cache with `npx expo start --clear`

### Development Commands

```bash
# Clear cache and restart
npx expo start --clear

# Run in tunnel mode (for physical devices)
npx expo start --tunnel

# Check Expo CLI version
npx expo --version

# Install compatible dependencies
npx expo install <package-name>
```

## Next Steps

1. **Test on Multiple Platforms**: Verify iOS, Android, and Web compatibility
2. **Performance Optimization**: Utilize Expo's performance tools
3. **Distribution Setup**: Configure EAS Build for app store releases
4. **Over-the-Air Updates**: Implement live app updates

The migration to Expo SDK 53 provides a robust, modern foundation for the Mobile API Control Panel with improved developer experience and deployment capabilities.