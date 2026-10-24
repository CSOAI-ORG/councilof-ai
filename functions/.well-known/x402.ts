/**
 * GET/HEAD /.well-known/x402 and /.well-known/x402/ — the suffix-less discovery aliases.
 * Serves the canonical manifest at 200 (strict indexers — x402scan registerFromOrigin, the
 * IronBridge validator — do not follow redirects). Per x402-alias-parity.test.ts: callable
 * onRequestGet + onRequestHead, NO catch-all onRequest. `./x402/index` re-exports from here.
 */
export { onRequestGet, onRequestHead } from "./x402.json";
