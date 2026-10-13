import { useState } from 'react';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Banner, Button, Card, Text } from '@/components/ui';
import { DEFAULT_COUNTRY_CODE } from '@/config';
import { parseContactsCsv } from '@/lib/csv';
import { displayPhone, isDialable, normalizePhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';
import { CountryCodeField } from './CountryCodeField';
import { ImportResult } from './ImportResult';
import { runImport } from './runImport';

const MAX_BYTES = 5 * 1024 * 1024;

export function CsvImport() {
  const { spacing } = useTheme();
  const [fileName, setFileName] = useState(null);
  const [rows, setRows] = useState([]);
  const [code, setCode] = useState(DEFAULT_COUNTRY_CODE);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function pick() {
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    if (asset.size && asset.size > MAX_BYTES) {
      setError('That file is larger than 5 MB. Split it into smaller files.');
      return;
    }
    try {
      const parsed = parseContactsCsv(await new File(asset.uri).text());
      setFileName(asset.name);
      setRows(parsed);
      if (parsed.length === 0) setError('No rows found. Expected columns: phone, name, email, company, tags.');
    } catch {
      setError('Could not read that file. Pick a .csv or plain text file.');
    }
  }

  const effectiveCode = code || DEFAULT_COUNTRY_CODE;
  const valid = rows.filter((r) => isDialable(normalizePhone(r.phone, effectiveCode)));

  async function submit() {
    setError(null);
    setProgress({ done: 0, total: valid.length });
    try {
      setResult(await runImport(rows, { defaultCode: effectiveCode, onProgress: (done, total) => setProgress({ done, total }) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setProgress(null);
    }
  }

  if (result) return <ImportResult result={result} />;

  return (
    <View style={{ gap: spacing.sm }}>
      <Card style={{ gap: spacing.xs }}>
        <Text style={{ fontWeight: '600' }}>CSV format</Text>
        <Text variant="small" muted>One contact per line: phone, name, email, company, tags. A header row is optional. Separate several tags with | .</Text>
        <Text variant="caption" muted selectable style={{ fontFamily: 'monospace', marginTop: 4 }}>
          {'phone,name,email,company,tags\n919876543210,Rahul Sharma,rahul@example.com,Acme Inc,vip|delhi'}
        </Text>
      </Card>

      <CountryCodeField value={code} onChange={setCode} />
      <Banner message={error} />
      <Button title={fileName ? 'Choose a different file' : 'Choose CSV file'} variant="outline" onPress={pick} />

      {rows.length > 0 ? (
        <Card style={{ gap: spacing.xs }}>
          <Text style={{ fontWeight: '600' }}>{fileName}</Text>
          <Text variant="small">{valid.length} valid numbers · {rows.length - valid.length} will be skipped</Text>
          {valid.slice(0, 5).map((r, i) => (
            <Text key={i} variant="small" muted numberOfLines={1}>
              {r.name ? `${r.name} · ` : ''}{displayPhone(normalizePhone(r.phone, effectiveCode))}
            </Text>
          ))}
          {valid.length > 5 ? <Text variant="caption" muted>and {valid.length - 5} more</Text> : null}
        </Card>
      ) : null}

      <Button
        title={progress ? `Importing ${progress.done}/${progress.total}` : `Import ${valid.length} contacts`}
        disabled={valid.length === 0}
        loading={!!progress}
        onPress={submit}
      />
    </View>
  );
}
