/**
 * GET / HEAD /interop/x402.json — the estate-level x402 index.
 *
 * WHY THIS FILE EXISTS. Two documents in this repository name `/interop/x402.json` as
 * discovery metadata that is already live:
 *   - docs/interop/CIRCLE-AGENTSTACK-MANIFEST-2026-09-06.md §3 ("Discovery metadata (already
 *     live) … `/interop/x402.json` — estate-level x402 index")
 *   - docs/interop/X402-FOUNDATION-APPLICATION.md §1 ("Discovery metadata shipped as
 *     `/.well-known/x402.json`, OpenAPI, and `interop/x402.json`")
 * Neither route ever existed in this repository (git log --all over functions/ and public/
 * finds no x402.json route, and the /interop/* catch-all only serves `.invalid` archived
 * bytes), so on 2026-10-13 `curl -sI https://councilof.ai/interop/x402.json` answered 404:
 * an agent sent to the index got nothing.
 *
 * FIX SHAPE — serve it FROM THE CATALOG SOURCE, never a copy. This file re-exports the
 * handlers of GET /api/x402 (functions/api/x402.ts), so both URLs answer the same bytes from
 * the same code: no second catalogue to drift, no fixture to refresh. The body is the machine
 * catalog (schema csoai.x402-catalog/0.3) — what each artefact IS and is NEVER, with amounts
 * only inside each door's 402 challenge, never on the index.
 *
 * It is free: the index is discovery metadata, like /.well-known/x402.json and /api/x402.
 * HEAD rides along because every GET route here must answer HEAD
 * (functions/api/_head.coverage.test.ts). Byte parity with /api/x402 is ratcheted by
 * functions/interop/x402-catalog.test.ts.
 */
export { onRequestGet, onRequestHead } from "../api/x402";
