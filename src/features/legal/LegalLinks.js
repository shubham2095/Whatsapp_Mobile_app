import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { LEGAL_URLS } from '@/config';
import { openWeb } from './openLegal';

// "By continuing you agree to the Terms and Privacy Policy" with tappable links.
// `color` is for the text colour (the auth screens sit on a dark teal backdrop).
export function LegalLinks({ color, linkColor, prefix = 'By continuing you agree to our' }) {
  const link = { color: linkColor ?? color, fontWeight: '700', textDecorationLine: 'underline' };
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text variant="caption" color={color} style={{ textAlign: 'center' }}>{prefix}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable onPress={() => openWeb(LEGAL_URLS.terms)} accessibilityRole="link" hitSlop={8}>
          <Text variant="caption" style={link}>Terms and Conditions</Text>
        </Pressable>
        <Text variant="caption" color={color}>and</Text>
        <Pressable onPress={() => openWeb(LEGAL_URLS.privacy)} accessibilityRole="link" hitSlop={8}>
          <Text variant="caption" style={link}>Privacy Policy</Text>
        </Pressable>
      </View>
    </View>
  );
}
