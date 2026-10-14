import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// "Report: May/June" -> "Report_May_June"; keeps file names safe on every phone.
export const safeFileName = (name) => String(name).replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'file';

async function shareFile(uri, mimeType, UTI, dialogTitle) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle });
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Writes a CSV file and opens the share sheet (Drive, WhatsApp, email, Files...). */
export async function shareCsv(fileName, headers, rows) {
  // The BOM makes Excel read non-English text correctly.
  const text = `﻿${[headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')}`;
  const file = new File(Paths.cache, `${safeFileName(fileName)}.csv`);
  file.create({ overwrite: true, intermediates: true });
  file.write(text);
  await shareFile(file.uri, 'text/csv', 'public.comma-separated-values-text', 'Share report');
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Renders HTML to a PDF named `fileName.pdf` and opens the share sheet. */
export async function sharePdf(fileName, html) {
  const printed = await Print.printToFileAsync({ html, base64: true });
  let uri = printed.uri;
  try {
    // printToFileAsync picks a random file name, so re-save the PDF under a readable one.
    const named = new File(Paths.cache, `${safeFileName(fileName)}.pdf`);
    named.create({ overwrite: true, intermediates: true });
    named.write(base64ToBytes(printed.base64));
    uri = named.uri;
  } catch {
    // Keep the generated file if renaming fails; it is the same PDF.
  }
  await shareFile(uri, 'application/pdf', 'com.adobe.pdf', 'Share invoice');
}
