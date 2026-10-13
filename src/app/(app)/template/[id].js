import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, Screen, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useDeleteTemplate, useTemplate } from '@/features/templates/hooks';
import { CATEGORY_LABEL, CATEGORY_TONE, STATUS_TONE } from '@/features/templates/meta';
import { TemplatePreview, previewPropsFrom } from '@/features/templates/TemplatePreview';
import { formatListTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

function Info({ label, children }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <Text variant="small" muted>{label}</Text>
      {children}
    </View>
  );
}

export default function TemplateDetail() {
  const { id } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useTemplate(id);
  const remove = useDeleteTemplate();

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <Screen>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </Screen>
    );
  }

  const t = data.template;

  function confirmDelete() {
    Alert.alert('Delete template', `"${t.name}" will be removed from Heltog and from Meta. Messages already sent are not affected.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(t.id, { onSuccess: () => router.back(), onError: (e) => Alert.alert('Could not delete', e.message) }),
      },
    ]);
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={{ gap: spacing.md }}>
        <Text variant="heading" style={{ fontFamily: 'monospace' }} selectable>{t.name}</Text>

        {t.status === 'REJECTED' && t.rejection_reason ? <Banner message={`Rejected by Meta: ${t.rejection_reason}`} /> : null}

        <TemplatePreview {...previewPropsFrom(t.components)} />

        <Card>
          <Info label="Status"><Badge tone={STATUS_TONE[t.status] ?? 'neutral'} label={t.status} /></Info>
          <Info label="Category"><Badge tone={CATEGORY_TONE[t.category] ?? 'neutral'} label={CATEGORY_LABEL[t.category] ?? t.category} /></Info>
          <Info label="Language"><Text variant="small">{t.language}</Text></Info>
          {t.quality_score ? <Info label="Quality"><Text variant="small">{t.quality_score}</Text></Info> : null}
          {t.waba?.name ? <Info label="Account"><Text variant="small">{t.waba.name}</Text></Info> : null}
          {t.last_synced_at ? <Info label="Last synced"><Text variant="small">{formatListTime(t.last_synced_at)}</Text></Info> : null}
        </Card>

        {can(user, 'templates.delete') ? <Button title="Delete template" variant="danger" loading={remove.isPending} onPress={confirmDelete} /> : null}
      </View>
    </Screen>
  );
}
