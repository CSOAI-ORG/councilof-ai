// Stripe Checkout — DORMANT until configured. Safe by default:
// if STRIPE_SECRET_KEY (use a TEST key first!) + price IDs aren't in env, it returns
// "not configured" and never touches money. No SDK dependency — raw Stripe REST.
//
// To activate (owner/M2, TEST MODE FIRST):
//   1. Stripe test mode → create prices, capture price_… ids.
//   2. In THIS Vercel project env, set: STRIPE_SECRET_KEY=sk_test_… ,
//      MEOK_PRICE_PRO_MO, MEOK_PRICE_PRO_YR, MEOK_PRICE_PAYG.
//   3. Test with a Stripe test card, then swap to live keys.

const PRICE_ENV = { 'pro-mo': 'MEOK_PRICE_PRO_MO', 'pro-yr': 'MEOK_PRICE_PRO_YR', 'payg': 'MEOK_PRICE_PAYG' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(200).json({ ok: false, reason: 'not_configured',
    message: 'Checkout isn’t live yet — add a Stripe TEST key + price IDs to go-live (test mode first).' });

  const plan = String((req.query && req.query.plan) || 'pro-mo');
  const priceId = PRICE_ENV[plan] && process.env[PRICE_ENV[plan]];
  if (!priceId) return res.status(200).json({ ok: false, reason: 'no_price', message: 'No price configured for plan: ' + plan });

  const origin = (req.headers && req.headers.origin) || 'https://os.meok.ai';
  try {
    const body = new URLSearchParams();
    body.set('mode', plan === 'payg' ? 'payment' : 'subscription');
    body.append('line_items[0][price]', priceId);
    body.append('line_items[0][quantity]', '1');
    body.set('success_url', origin + '/?checkout=success');
    body.set('cancel_url', origin + '/pricing.html?checkout=cancel');
    body.set('allow_promotion_codes', 'true');
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const d = await r.json();
    if (d && d.url) return res.status(200).json({ ok: true, url: d.url });
    return res.status(200).json({ ok: false, reason: 'stripe_error', message: (d && d.error && d.error.message) || 'unknown' });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: 'exception', message: String(e) });
  }
}
