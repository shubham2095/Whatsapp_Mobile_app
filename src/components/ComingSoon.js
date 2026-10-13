import { EmptyState, Screen } from '@/components/ui';

export function ComingSoon({ title, phase, icon = 'construct-outline' }) {
  return (
    <Screen>
      <EmptyState icon={icon} title={title} message={`This screen arrives in Phase ${phase}.`} />
    </Screen>
  );
}
