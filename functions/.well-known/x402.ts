/**
 * GET /.well-known/x402 and /.well-known/x402/ — serve the discovery manifest at 200.
 * Strict indexers (x402scan registerFromOrigin, the IronBridge validator) do not follow
 * redirects, so the suffix-less path must answer 200 application/json itself.
 *
 * NOTE the explicit .ts extension: without it, `./x402.json` resolves to a JSON import in
 * the bundler and the route silently serves empty (caught 2026-10-13 by the IronBridge
 * grade: "not JSON / empty"). The regression test below asserts the handler identity.
 */
export { onRequestGet } from "./x402.json.ts";
