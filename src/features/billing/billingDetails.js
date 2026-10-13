import * as SecureStore from 'expo-secure-store';

// Invoice details (company name, address, GSTIN, ...) are remembered between purchases so renewals are one tap.
const KEY = 'heltog_billing_details';

export async function loadBillingDetails() {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveBillingDetails(details) {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(details));
  } catch {}
}

export async function clearBillingDetails() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {}
}
