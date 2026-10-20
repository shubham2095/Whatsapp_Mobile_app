import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '@/api/auth';
import { ActionSheet, Avatar, Banner, Button, Input, Screen, Text } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { pickAvatar } from '@/features/inbox/pickMedia';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { colors, spacing } = useTheme();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '', address: user.address ?? '' });
  const [loading, setLoading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const err = (key) => local[key] ?? fieldError(error, key);

  async function submit() {
    const problems = {};
    if (!form.name.trim()) problems.name = 'Enter your name.';
    if (!isValidEmail(form.email)) problems.email = 'Enter a valid email address.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    setLoading(true);
    try {
      const data = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      });
      setUser(data.user);
      setSaved(true);
      toast.show('Profile updated');
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  // The photo is saved on its own as soon as it is chosen, so it does not wait for "Save changes".
  async function savePhoto(avatarUrl) {
    setPhotoBusy(true);
    setError(null);
    try {
      const data = await updateProfile({ avatar_url: avatarUrl });
      setUser(data.user);
      toast.show(avatarUrl ? 'Photo updated' : 'Photo removed');
    } catch (e) {
      setError(e);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function choosePhoto(source) {
    const result = await pickAvatar(source);
    if (!result) return;
    if (result.error) setLocal((l) => ({ ...l, avatar_url: result.error }));
    else {
      setLocal((l) => ({ ...l, avatar_url: undefined }));
      savePhoto(result.dataUrl);
    }
  }

  const photoActions = [
    { label: 'Take a photo', icon: 'camera-outline', onPress: () => choosePhoto('camera') },
    { label: 'Choose from gallery', icon: 'images-outline', onPress: () => choosePhoto('gallery') },
    ...(user.avatar_url ? [{ label: 'Remove photo', icon: 'trash-outline', danger: true, onPress: () => savePhoto(null) }] : []),
  ];

  const bannerMessage = error && !['name', 'email', 'phone', 'address'].some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll>
      <Banner message={bannerMessage} />
      <Banner tone="success" message={saved ? 'Profile updated.' : null} />

      <View style={{ alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm }}>
        <Pressable onPress={() => setPhotoMenu(true)} disabled={photoBusy} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <View style={{ opacity: photoBusy ? 0.5 : 1 }}>
            <Avatar name={user.name} size={96} uri={user.avatar_url} />
          </View>
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg }}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>
        <Text variant="small" muted>{photoBusy ? 'Saving photo...' : 'Tap to change your photo'}</Text>
        {local.avatar_url ? <Text variant="caption" color={colors.danger}>{local.avatar_url}</Text> : null}
      </View>

      <Input label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={err('email')} />
      <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={err('phone')} />
      <Input
        label="Address"
        value={form.address}
        onChangeText={set('address')}
        multiline
        maxLength={1000}
        autoCapitalize="sentences"
        style={{ minHeight: 80, textAlignVertical: 'top' }}
        error={err('address')}
      />
      <Button title="Save changes" loading={loading} onPress={submit} />
      <Button title="Change password" variant="outline" onPress={() => router.push('/change-password')} style={{ marginTop: 12 }} />
      {user.is_super_admin ? null : (
        <Button title="Delete account" variant="ghost" onPress={() => router.push('/delete-account')} style={{ marginTop: 24 }} />
      )}

      <ActionSheet visible={photoMenu} title="Profile photo" actions={photoActions} onClose={() => setPhotoMenu(false)} />
    </Screen>
  );
}
