/**
 * GET /.well-known/x402 and /.well-known/x402/ — serve the discovery manifest at 200.
 * Was a 308 to x402.json; strict indexers do not follow redirects (x402scan
 * registerFromOrigin treats a redirect as noDiscovery; the IronBridge validator
 * requires 200 application/json with no redirects). Same payload as x402.json.
 */
export { onRequestGet, onRequestHead } from "./x402.json";
