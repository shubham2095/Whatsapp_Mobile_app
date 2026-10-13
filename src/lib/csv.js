// Splits one CSV line, honouring "quoted, values" and "" escapes.
function splitLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

const ALIASES = {
  phone: ['phone', 'mobile', 'number', 'whatsapp', 'phone number'],
  name: ['name', 'full name'],
  email: ['email', 'e-mail'],
  company: ['company', 'organization'],
  tags: ['tags', 'tag', 'labels'],
};

/**
 * Same format as the web import: phone, name, email, company, tags. A header row is optional;
 * multiple tags are separated with | ; or , (inside quotes).
 * -> [{ phone, name?, email?, company?, tag_list? }] (phone is raw; normalise before sending)
 */
export function parseContactsCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const first = splitLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = first.some((c) => Object.values(ALIASES).some((names) => names.includes(c)));

  let index = { phone: 0, name: 1, email: 2, company: 3, tags: 4 };
  if (hasHeader) {
    index = {};
    for (const [field, names] of Object.entries(ALIASES)) {
      const i = first.findIndex((c) => names.includes(c));
      if (i >= 0) index[field] = i;
    }
  }

  const pick = (cols, field) => (index[field] !== undefined ? cols[index[field]] || undefined : undefined);

  return (hasHeader ? lines.slice(1) : lines).map((line) => {
    const cols = splitLine(line);
    const tags = (pick(cols, 'tags') ?? '')
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', ');
    return {
      phone: pick(cols, 'phone') ?? '',
      name: pick(cols, 'name'),
      email: pick(cols, 'email'),
      company: pick(cols, 'company'),
      tag_list: tags || undefined,
    };
  });
}
