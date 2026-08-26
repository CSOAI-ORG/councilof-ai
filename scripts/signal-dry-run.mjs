#!/usr/bin/env node
/** NEXT_300 #286 — batch signal dry-run (no publish). */
console.log(JSON.stringify({
  mode: "dry-run",
  publish: false,
  note: "No publish. No MEASURED invention. Custody gate not invoked.",
  would_touch: ["signal-index", "REPORTED contacts"],
}, null, 2));
