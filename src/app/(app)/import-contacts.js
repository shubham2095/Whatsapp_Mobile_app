import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui';
import { CsvImport } from '@/features/contacts/CsvImport';
import { PhoneImport } from '@/features/contacts/PhoneImport';

// ?source=phone (device contacts) | csv (file picker)
export default function ImportContacts() {
  const { source } = useLocalSearchParams();
  const fromPhone = source === 'phone';
  return (
    <Screen scroll={!fromPhone} edges={['bottom']}>
      <Stack.Screen options={{ title: fromPhone ? 'Import from phone' : 'Import CSV' }} />
      {fromPhone ? <PhoneImport /> : <CsvImport />}
    </Screen>
  );
}
