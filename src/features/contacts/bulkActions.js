import { addToBlacklist } from '@/api/blacklist';
import { deleteContact, updateContact } from '@/api/contacts';

// There is no bulk endpoint on the backend, so each contact is one request. A few run at a time
// (fast enough, and kind to the server), and one failure never stops the rest.
async function runAll(items, worker, concurrency = 4) {
  let next = 0;
  const failures = [];
  async function lane() {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      try {
        await worker(item);
      } catch (e) {
        failures.push({ item, message: e?.message || 'Failed' });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return { total: items.length, done: items.length - failures.length, failures };
}

// "vip, Delhi" + "VIP; lead" -> "vip, Delhi, lead" (no duplicates, any case)
export function mergeTags(existing, added) {
  const seen = new Set();
  const out = [];
  for (const raw of `${existing ?? ''},${added ?? ''}`.split(/[,;|]/)) {
    const tag = raw.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      out.push(tag);
    }
  }
  return out.join(', ').slice(0, 500);
}

export const bulkActions = {
  setBlocked: (contacts, blocked) => runAll(contacts, (c) => updateContact(c.id, { is_blocked: blocked })),
  setOptedOut: (contacts, optedOut) => runAll(contacts, (c) => updateContact(c.id, { opted_out: optedOut })),
  addTags: (contacts, tags) => runAll(contacts, (c) => updateContact(c.id, { tag_list: mergeTags(c.tag_list, tags) })),
  blacklist: (contacts) => runAll(contacts, (c) => addToBlacklist({ phone: c.wa_id, name: c.name || undefined, reason: 'Added from contacts' })),
  remove: (contacts) => runAll(contacts, (c) => deleteContact(c.id)),
};
