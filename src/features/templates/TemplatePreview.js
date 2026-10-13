import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { BUTTON_TYPES, fillVariables } from './meta';

const FORMAT_ICON = { IMAGE: 'image-outline', VIDEO: 'videocam-outline', DOCUMENT: 'document-text-outline' };

// WhatsApp-style bubble. `header`: { format, text }, `buttons`: [{ type, text }], `samples`: { 1: 'Rahul' }.
export function TemplatePreview({ header, body, footer, buttons = [], samples }) {
  const { colors, radius, spacing } = useTheme();
  const headerMedia = header && FORMAT_ICON[header.format];

  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ backgroundColor: colors.bubbleIn, borderRadius: radius.md, padding: spacing.sm + 2, gap: 6, maxWidth: '92%', alignSelf: 'flex-start' }}>
        {headerMedia ? (
          <View style={{ height: 110, borderRadius: radius.sm, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={FORMAT_ICON[header.format]} size={34} color={colors.primary} />
            <Text variant="caption" muted>{header.format.toLowerCase()} header</Text>
          </View>
        ) : null}
        {header?.format === 'TEXT' && header.text ? <Text style={{ fontWeight: '700' }}>{fillVariables(header.text, samples)}</Text> : null}
        <Text>{fillVariables(body || '', samples)}</Text>
        {footer ? <Text variant="small" muted>{footer}</Text> : null}
      </View>
      {buttons.length > 0 ? (
        <View style={{ marginTop: 6, gap: 4, maxWidth: '92%' }}>
          {buttons.map((b, i) => {
            const meta = BUTTON_TYPES.find((t) => t.value === b.type);
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.bubbleIn, borderRadius: radius.md, paddingVertical: 8 }}>
                <Ionicons name={meta?.icon ?? 'ellipse-outline'} size={16} color={colors.primary} />
                <Text variant="small" color={colors.primary} style={{ fontWeight: '600' }}>{b.text || 'Button text'}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// Builds preview props from the API's `components` array.
export function previewPropsFrom(components = []) {
  const find = (type) => components.find((c) => String(c.type).toUpperCase() === type);
  const header = find('HEADER');
  return {
    header: header ? { format: String(header.format ?? 'TEXT').toUpperCase(), text: header.text } : null,
    body: find('BODY')?.text ?? '',
    footer: find('FOOTER')?.text ?? '',
    buttons: find('BUTTONS')?.buttons ?? [],
  };
}
