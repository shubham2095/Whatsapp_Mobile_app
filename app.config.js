// Expo reads app.json first and hands it to this function, so everything stays in app.json.
// Only the Sentry build plugin is decided here: it uploads source maps (readable crash stack traces)
// and needs SENTRY_ORG and SENTRY_PROJECT (plus SENTRY_AUTH_TOKEN as an EAS secret) at build time.
module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];
  if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
    plugins.push([
      '@sentry/react-native/expo',
      {
        url: process.env.SENTRY_URL || 'https://sentry.io/',
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ]);
  }
  return { ...config, plugins };
};
