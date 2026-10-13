import Constants, { ExecutionEnvironment } from 'expo-constants';

// Expo Go on Android (SDK 53+) throws as soon as `expo-notifications` is imported, so load it
// lazily and only in development / release builds. `Notifications` is null in Expo Go.
export const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const Notifications = IN_EXPO_GO ? null : require('expo-notifications');
