/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';

LogBox.ignoreLogs([
  'Attempted to import the module',
  'ReactNativeFeatureFlags'
]);
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
