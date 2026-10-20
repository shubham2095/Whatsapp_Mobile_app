import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// Shows `uri` (a web address or data URL) when there is one, otherwise the person's initials.
export function Avatar({ name = '', size = 44, uri = null }) {
  const { colors } = useTheme();
  const initials = name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  if (uri) {
    return <Image source={{ uri }} contentFit="cover" accessibilityLabel={name ? `${name}'s photo` : 'Profile photo'} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.chipBg }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}
