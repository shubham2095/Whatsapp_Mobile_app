import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { deleteAccount } from '@/api/auth';
import { Banner, Button, Card, Input, Screen, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { openWeb } from '@/features/legal/openLegal';
import { LEGAL_URLS } from '@/config';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// Permanent account deletion, started from inside the app (Google Play requires this).
export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const { colors, spacing } = useTheme();
  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!user) return null;

  const isOwner = user.roles.includes('tenant-owner');
  const company = user.tenant?.company_name ?? user.tenant?.name ?? 'your company';
  const ready = password.length > 0 && (!isOwner || typed.trim().toUpperCase() === 'DELETE');
  // 404/405: the server was not updated with the delete endpoint yet.
  const unsupported = error && (error.status === 404 || error.status === 405);

  function confirm() {
    Alert.alert(
      isOwner ? 'Delete company and account?' : 'Delete your account?',
      isOwner ? `This permanently deletes ${company} and everyone's access. It cannot be undone.` : 'You will be signed out and cannot sign in again. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete permanently', style: 'destructive', onPress: run },
      ],
    );
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount({ password, deleteCompany: isOwner });
      // The server has removed the account; clear this phone and return to the login screen.
      await logout();
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  function askSupport() {
    router.push({
      pathname: '/support-form',
      params: {
        subject: 'Account deletion request',
        description: `Please delete my Heltog account (${user.email}).${isOwner ? ` I am the owner, so please also delete the company "${company}".` : ''}`,
        category: 'account',
      },
    });
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={{ gap: spacing.md }}>
        <Text variant="heading">Delete account</Text>

        {isOwner ? (
          <Banner message={`You are the owner of ${company}. Deleting your account also deletes the whole company workspace: chats, contacts, templates, campaigns and every team member's access.`} />
        ) : (
          <Banner tone="warning" message="Your login is deleted. Chats and contacts you worked on stay with your company." />
        )}

        <Card style={{ gap: spacing.xs }}>
          <Text style={{ fontWeight: '600' }}>What happens</Text>
          <Text variant="small" muted>- You are signed out on every phone and cannot sign in again.</Text>
          <Text variant="small" muted>- Your name, email, phone number and saved device tokens are removed.</Text>
          {isOwner ? <Text variant="small" muted>- Your plan is cancelled and not refunded. See the Cancellation and Refund Policy.</Text> : null}
          <Text variant="small" muted>- Invoices and payment records may be kept for the period tax law requires.</Text>
        </Card>

        {unsupported ? (
          <>
            <Banner tone="warning" message="Instant deletion is not switched on for this server yet. Send us a deletion request and we will remove your account for you." />
            <Button title="Send deletion request" onPress={askSupport} />
          </>
        ) : (
          <>
            {error ? <Banner message={error.message} /> : null}
            <Input
              label="Your password"
              password
              value={password}
              onChangeText={setPassword}
              autoComplete="current-password"
              error={fieldError(error, 'password')}
            />
            {isOwner ? (
              <Input
                label="Type DELETE to confirm"
                value={typed}
                onChangeText={setTyped}
                autoCapitalize="characters"
                autoCorrect={false}
                error={fieldError(error, 'delete_company')}
              />
            ) : null}
            <Button title="Delete my account" variant="danger" disabled={!ready} loading={busy} onPress={confirm} />
          </>
        )}

        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        <Text variant="caption" muted style={{ textAlign: 'center' }} onPress={() => openWeb(LEGAL_URLS.privacy)}>
          Read how we handle your data: <Text variant="caption" color={colors.primary} style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
        </Text>
      </View>
    </Screen>
  );
}
