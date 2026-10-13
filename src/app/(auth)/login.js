import { useRef, useState } from 'react';
import { Link } from 'expo-router';
import { Banner, Button, Input, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function Login() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const passwordRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

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
      title="Welcome back"
      subtitle="Sign in to your Heltog workspace."
      footer={
        <Text style={{ color: '#fff' }}>
          New to Heltog?{' '}
          <Link href="/register" style={{ color: colors.accent, fontWeight: '700' }}>Create an account</Link>
        </Text>
      }
    >
      <Banner message={error && !error.errors?.email ? error.message : null} />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={local.email ?? fieldError(error, 'email')}
      />
      <Input
        ref={passwordRef}
        label="Password"
        password
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={local.password ?? fieldError(error, 'password')}
      />
      <Link href="/forgot-password" style={{ color: colors.primary, fontWeight: '600', alignSelf: 'flex-end', marginBottom: 16 }}>
        Forgot password?
      </Link>
      <Button title="Sign in" loading={loading} onPress={submit} />
    </AuthShell>
  );
}
