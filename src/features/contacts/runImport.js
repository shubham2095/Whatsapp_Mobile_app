import { importContacts } from '@/api/contacts';
import { isDialable, normalizePhone } from '@/lib/phone';

const CHUNK = 500; // the backend accepts up to 5000 per call; smaller batches keep requests fast on mobile data

/**
 * rows: [{ phone (raw), name?, email?, company?, tag_list? }]
 * Normalises numbers, drops unusable/duplicate ones, uploads in chunks.
 * -> { created, updated, skipped, total }  (skipped includes rows dropped here)
 */
export async function runImport(rows, { defaultCode, onProgress } = {}) {
  const unique = new Map();
  let dropped = 0;
  for (const row of rows) {
    const phone = normalizePhone(row.phone, defaultCode);
    if (!isDialable(phone) || unique.has(phone)) {
      dropped += 1;
      continue;
    }
    unique.set(phone, { ...row, phone });
  }

  const list = [...unique.values()];
  const totals = { created: 0, updated: 0, skipped: dropped, total: rows.length };
  for (let i = 0; i < list.length; i += CHUNK) {
    const res = await importContacts(list.slice(i, i + CHUNK));
    totals.created += res.created;
    totals.updated += res.updated;
    totals.skipped += res.skipped;
    onProgress?.(Math.min(i + CHUNK, list.length), list.length);
  }
  return totals;
}
