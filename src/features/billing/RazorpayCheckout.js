import { useMemo } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_URL } from '@/config';

// Razorpay does not ship an Expo-compatible native module, so checkout runs its web SDK
// (checkout.js) inside a WebView and reports back through postMessage.
const SCHEMES_HANDLED_IN_WEBVIEW = /^(https?:|about:|data:|blob:)/i;

// Scheme + host of the API (URL.origin is not reliable in Hermes).
const API_ORIGIN = API_URL.split('/').slice(0, 3).join('/');

function buildHtml({ keyId, amount, currency, orderId, description, prefill }) {
  // `<` is escaped so no value can close the script tag.
  const config = JSON.stringify({ keyId, amount, currency, orderId, description, prefill }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5;font-family:sans-serif;color:#667781}</style>
</head>
<body>
<div id="msg">Opening secure payment...</div>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var cfg = ${config};
  function post(o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  window.onerror = function (m) { post({ type: 'error', message: String(m) }); };
  window.addEventListener('load', function () {
    if (!window.Razorpay) { post({ type: 'error', message: 'Could not load the payment gateway. Check your connection.' }); return; }
    var rzp = new Razorpay({
      key: cfg.keyId,
      amount: cfg.amount,
      currency: cfg.currency,
      order_id: cfg.orderId,
      name: 'Heltog SocialFlow',
      description: cfg.description,
      prefill: cfg.prefill,
      theme: { color: '#0e7c7b' },
      retry: { enabled: true },
      handler: function (r) { post({ type: 'success', payment: r }); },
      modal: { ondismiss: function () { post({ type: 'dismissed' }); } }
    });
    rzp.on('payment.failed', function (r) { post({ type: 'failed', message: r && r.error && r.error.description }); });
    rzp.open();
  });
</script>
</body>
</html>`;
}

// order: response of POST /billing/order. Calls exactly one of the callbacks per outcome.
export function RazorpayCheckout({ order, planName, billing, onSuccess, onFailed, onDismiss }) {
  const html = useMemo(
    () =>
      buildHtml({
        keyId: order.key_id,
        amount: order.amount,
        currency: order.currency,
        orderId: order.order_id,
        description: `${planName} plan`,
        prefill: { name: billing.name, email: billing.email, contact: billing.phone },
      }),
    [order, planName, billing],
  );

  function onMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'success') onSuccess(msg.payment);
    else if (msg.type === 'failed') onFailed(msg.message || 'The payment failed. You have not been charged.');
    else if (msg.type === 'error') onFailed(msg.message);
    else if (msg.type === 'dismissed') onDismiss();
  }

  // UPI / wallet apps are opened through intents (upi://, intent://, phonepe://...). A WebView cannot
  // follow those itself, so hand them to the system and keep the checkout page where it is.
  function shouldLoad(request) {
    if (SCHEMES_HANDLED_IN_WEBVIEW.test(request.url)) return true;
    Linking.openURL(request.url).catch(() => {});
    return false;
  }

  return (
    <WebView
      source={{ html, baseUrl: API_ORIGIN }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      onMessage={onMessage}
      onShouldStartLoadWithRequest={shouldLoad}
      style={{ flex: 1 }}
    />
  );
}
