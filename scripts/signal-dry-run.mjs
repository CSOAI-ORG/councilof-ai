#!/usr/bin/env node
/**
 * NEXT_300 #286 — batch signal dry-run (no publish).
 * Prints what a hive signal batch would touch. Never writes.
 */
const payload = {
  mode: "dry-run",
  publish: false,
  as_of: new Date().toISOString().slice(0, 10),
  note: "No publish. No MEASURED invention. Custody gate not invoked. GPU not used.",
  would_touch: [
    "signal-index (REPORTED contacts)",
    "docs/CONTACT_AXIS_RWA_INDEX_MATRIX.md",
    "GET /api/rwa-attestation (unsigned catalog)",
  ],
  refused: [
    "mainnet signed RWA cards",
    "Wilson on UNMEASURED labour indices",
    "invented AUM as MEASURED",
  ],
};

console.log(JSON.stringify(payload, null, 2));
