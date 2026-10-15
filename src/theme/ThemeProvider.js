import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { getThemePreference, saveThemePreference } from '@/lib/storage';
import { darkColors, darkShadows, fontSize, lightColors, lightShadows, radius, spacing, touch } from './tokens';

const ThemeContext = createContext(null);

// preference: 'system' (follow the phone) | 'light' | 'dark'
// Android's native module rejects null, so "follow the phone" is passed as 'unspecified'.
const apply = (preference) => Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);

export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState('system');

  // Restore the saved choice once; Appearance then drives useColorScheme for the whole app.
  useEffect(() => {
    getThemePreference().then((saved) => {
      setPreferenceState(saved);
      apply(saved);
    });
  }, []);

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    apply(next);
    saveThemePreference(next);
  }, []);

  const value = useMemo(
    () => ({
      isDark: scheme === 'dark',
      colors: scheme === 'dark' ? darkColors : lightColors,
      radius,
      spacing,
      fontSize,
      touch,
      shadows: scheme === 'dark' ? darkShadows : lightShadows,
      preference,
      setPreference,
    }),
    [scheme, preference, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
