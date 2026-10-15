import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// Inter, loaded once in the root layout. On Android a custom font has one file per weight and `fontWeight` on top
// of it makes the phone fake a bolder face, so the weight is turned into a family name here and `fontWeight` is dropped.
export const fontFiles = { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold };

const FAMILY = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
  800: 'Inter_800ExtraBold',
};

export const fontRegular = FAMILY[400];

// Accepts a style's fontWeight ('bold', '600', 700, undefined...) and returns the matching family.
export function familyFor(weight) {
  if (weight === 'bold') return FAMILY[700];
  const n = Number(weight);
  if (!n || n <= 400) return FAMILY[400];
  if (n <= 500) return FAMILY[500];
  if (n <= 600) return FAMILY[600];
  if (n <= 700) return FAMILY[700];
  return FAMILY[800];
}

// For raw React Native components (header titles, tab labels) that do not go through the shared Text.
export const headerTitleFont = { fontFamily: FAMILY[700], fontWeight: 'normal' };
export const tabLabelFont = { fontFamily: FAMILY[600], fontWeight: 'normal' };
