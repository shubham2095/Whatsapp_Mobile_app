import * as Sentry from '@sentry/react-native';

// Crash reporting is off until EXPO_PUBLIC_SENTRY_DSN is set (and always off while developing),
// so nothing is sent anywhere by default.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const monitoringEnabled = !!dsn && !__DEV__;

// URLs in network breadcrumbs can carry what people typed into a search box (names, phone numbers).
// Keep the path and the status, drop the query string.
function cleanBreadcrumb(breadcrumb) {
  if ((breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') && typeof breadcrumb.data?.url === 'string') {
    return { ...breadcrumb, data: { ...breadcrumb.data, url: breadcrumb.data.url.split('?')[0] } };
  }
  return breadcrumb;
}

if (monitoringEnabled) {
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'production',
    sendDefaultPii: false, // no IP address, cookies or request bodies
    tracesSampleRate: 0.1,
    beforeBreadcrumb: cleanBreadcrumb,
  });
}

// Wraps the root component so Sentry can track screens and touches. A no-op while monitoring is off.
export const withMonitoring = (Component) => (monitoringEnabled ? Sentry.wrap(Component) : Component);

export function captureError(error, context) {
  if (monitoringEnabled) Sentry.captureException(error, context ? { extra: context } : undefined);
}

// Only the internal user id is attached to reports: no name, email or phone.
export function setMonitoringUser(id) {
  if (monitoringEnabled) Sentry.setUser(id ? { id: String(id) } : null);
}
