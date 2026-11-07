/** Paddle Billing ts/h1 verification of timestamp:rawBody. Fixture tests need no provider secrets.
 * Contract: https://developer.paddle.com/webhooks/about/signature-verification/
 */
export async function verifyPaddleSignature(secret: string, rawBody: string, header: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!secret || header.length > 4096 || !Number.isSafeInteger(nowSeconds)) return false;
  const parts = header.split(';').map(p => p.trim());
  const times = parts.filter(p => p.startsWith('ts=')).map(p => p.slice(3));
  const signatures = parts.filter(p => p.startsWith('h1=')).map(p => p.slice(3));
  if (times.length !== 1 || !/^\d{1,12}$/.test(times[0]) || signatures.length < 1 || signatures.length > 5) return false;
  const timestamp = Number(times[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 5) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const payload = encoder.encode(`${times[0]}:${rawBody}`);
  // A destination can carry multiple h1 values during key rotation.
  for (const hex of signatures) {
    if (!/^[a-fA-F0-9]{64}$/.test(hex)) continue;
    const sig = Uint8Array.from(hex.match(/../g)!, v => parseInt(v, 16));
    if (await crypto.subtle.verify('HMAC', key, sig, payload)) return true;
  }
  return false;
}
