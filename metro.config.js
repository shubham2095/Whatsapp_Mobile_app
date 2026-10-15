// Sentry adds debug IDs to the bundle so crash stack traces can be matched with uploaded source maps.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
