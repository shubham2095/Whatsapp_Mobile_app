import { request } from './client';

// -> { subscription: { id, status, plan, trial_ends_at, current_period_start, current_period_end, cancelled_at } | null,
//      wallet: { balance, balance_minor, reserved, currency, auto_recharge }, tenant: { status, trial_ends_at } }
export const overview = () => request('/billing');

// -> { plans: [{ id, name, description, billing_period, price, price_display, currency, trial_days,
//                features: { reports: true, ... }, limits: { max_contacts: 1000 | -1 (unlimited), ... } }], gst_rate }
export const plans = () => request('/billing/plans');

// -> { wallet, transactions: [{ id, type, amount, amount_minor, balance_after, description, created_at }] }
export const wallet = () => request('/billing/wallet');

// -> { invoices: [{ id, number, status, subtotal, tax, total, *_minor, currency, line_items, meta, issued_at, paid_at }], meta }
export const invoices = ({ page = 1, perPage = 25 } = {}) => request('/billing/invoices', { params: { page, per_page: perPage } });

// billing: { name, email, phone, address, gstin? } (all but gstin are required by the backend).
// Free plan -> { free: true, subscription, invoice }.
// Paid plan -> { free: false, order_id, amount, subtotal, tax, gst_rate, currency, key_id, plan }  (amounts in paise)
export const createOrder = ({ planId, billing }) => request('/billing/order', { method: 'POST', body: { plan_id: planId, billing } });

// After Razorpay reports success. Backend checks the HMAC signature, then activates the plan.
// -> { message, subscription, invoice }
export const verifyPayment = ({ planId, billing, razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
  request('/billing/verify', {
    method: 'POST',
    body: { plan_id: planId, billing, razorpay_order_id, razorpay_payment_id, razorpay_signature },
  });
