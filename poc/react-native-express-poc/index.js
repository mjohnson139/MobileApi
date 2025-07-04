/**
 * React Native Express PoC
 * Demonstrates embedded Express.js server within React Native app
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);