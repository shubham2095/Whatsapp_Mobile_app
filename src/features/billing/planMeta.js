// Plan display + price helpers (same labels as the web app).

export const LIMIT_LABELS = {
  max_agents: 'Agents',
  max_contacts: 'Contacts',
  max_campaigns: 'Campaigns',
  max_chatbots: 'Chatbots',
  max_templates: 'Templates',
};

export const FEATURE_LABELS = {
  reports: 'Reports',
  advanced_reports: 'Advanced reports',
  export: 'Export',
  social: 'Social publishing',
  chatbot: 'Chatbot',
  automations: 'Automations',
  api_access: 'API access',
};

// A missing or negative limit means "unlimited".
export const showLimit = (v) => (v === undefined || v === null || v < 0 ? 'Unlimited' : Number(v).toLocaleString('en-IN'));

export const enabledFeatures = (plan) => Object.keys(FEATURE_LABELS).filter((k) => plan.features?.[k]);

// Money is stored in paise (minor units).
export function formatMinor(minor, currency = 'INR') {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${(minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Mirrors BillingController::amounts so the screen shows exactly what Razorpay will charge.
export function priceBreakdown(plan, gstRate) {
  const base = Math.round(plan.price * 100);
  const tax = Math.round((base * gstRate) / 100);
  return { base, tax, total: base + tax, rate: gstRate };
}

export const periodLabel = (plan) => (plan.billing_period === 'yearly' ? 'year' : 'month');
