// The server sends the browser back to heltog://google-auth after "Continue with Google". That address is not a screen,
// and Expo Router would show "unmatched route" for it. The sign-in itself is finished by the code that started it
// (features/auth/googleSignIn.js), so the link only needs to land on the login screen.
export function redirectSystemPath({ path }) {
  try {
    if (String(path).includes('google-auth')) return '/login';
    return path;
  } catch {
    return '/login';
  }
}
