import { listCampaigns } from '@/api/campaigns';
import { shareCsv } from '@/lib/exportFile';

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN') : '');
const deliveryPct = (total, delivered) => (total ? `${((delivered / total) * 100).toFixed(2)}%` : '0.00%');

const HEADERS = ['#', 'Campaign', 'Template', 'Status', 'Total numbers', 'Sent', 'Delivered', 'Read', 'Failed', 'Replied', 'Delivery %', 'Created'];

const row = (c, i) => [
  i + 1,
  c.name,
  c.template?.name ?? '',
  c.status,
  c.total_recipients,
  c.sent_count,
  c.delivered_count,
  c.read_count,
  c.failed_count,
  c.replied_count,
  deliveryPct(c.total_recipients, c.delivered_count),
  when(c.created_at),
];

// One campaign's numbers (same columns as the web report).
export const shareCampaignReport = (campaign) => shareCsv(`campaign_${campaign.name}`, HEADERS, [row(campaign, 0)]);

// Every campaign, fetched page by page so the report is complete and not just what is on screen.
export async function shareAllCampaignsReport() {
  const all = [];
  for (let page = 1; ; page += 1) {
    const res = await listCampaigns({ page, perPage: 100 });
    all.push(...res.campaigns);
    if (res.meta.current_page >= res.meta.last_page) break;
  }
  await shareCsv(`campaigns_report_${new Date().toISOString().slice(0, 10)}`, HEADERS, all.map(row));
  return all.length;
}
