import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { Banner, Button, Input, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { useAuth } from '@/features/auth/AuthProvider';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function Login() {
  const { login } = useAuth();
  const { colors, spacing } = useTheme();
  const passwordRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const [googleError, setGoogleError] = useState(null);

  async function submit() {
    const problems = {};
    if (!isValidEmail(email)) problems.email = 'Enter a valid email address.';
    if (!password) problems.password = 'Enter your password.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    setLoading(true);
    try {
      await login(email, password);
      // The root navigator swaps to the app automatically once the session starts.
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }

  return (
    <AuthShell
      hero
      title="Welcome back"
      subtitle="Sign in to your Heltog workspace."
      footer={
        <Text muted>
          New to Heltog?{' '}
          <Link href="/register" style={{ color: colors.accent, fontWeight: '700' }}>Create an account</Link>
        </Text>
      }
    >
      <Banner message={googleError ?? (error && !error.errors?.email ? error.message : null)} />
      <Input
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="you@company.com"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={local.email ?? fieldError(error, 'email')}
      />
      <Input
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        password
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
        placeholder="Your password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={local.password ?? fieldError(error, 'password')}
      />
      <Link href="/forgot-password" style={{ color: colors.primary, fontWeight: '600', alignSelf: 'flex-end', marginTop: -6, marginBottom: spacing.lg }}>
        Forgot password?
      </Link>
      <Button title="Sign in" size="lg" loading={loading} onPress={submit} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text variant="caption" muted>or continue with</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <GoogleButton compact onError={setGoogleError} style={{ flex: 1 }} />
        <Button title="Mobile code" variant="outline" icon="phone-portrait-outline" onPress={() => router.push('/login-otp')} style={{ flex: 1 }} />
      </View>
    </AuthShell>
  );
}
