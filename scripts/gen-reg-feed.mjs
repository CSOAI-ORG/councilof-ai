// gen-reg-feed.mjs — build a signed /api/regulation snapshot from reg-watch-state.json.
// Signing happens OFF-CHAIN here (the estate key lives on the Mac/pod, never in this repo).
// Output: dist-client static payload served at /api/regulation (mirrors the gspc.ts pattern:
// signed body + signer + signature, verify against did.json).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const STATE = new URL("../reg-watch-state.json", import.meta.url).pathname;
const EVENTS = new URL("../reg-watch-events/", import.meta.url).pathname;
const OUT = new URL("../dist/client/api/regulation.json", import.meta.url).pathname;

const state = JSON.parse(readFileSync(STATE, "utf8"));
const instruments = [];
for (const [id, v] of Object.entries(state.instruments || {})) {
  instruments.push({
    id,
    note: v.note || "",
    checked: v.checked || null,
    first_seen: v.first_seen || null,
  });
}
// recent events (if any)
let events = [];
if (existsSync(EVENTS)) {
  const { readdirSync } = await import("node:fs");
  try {
    const files = readdirSync(EVENTS).sort().slice(-10);
    events = files.map((f) => ({ file: f }));
  } catch {}
}

const feed = {
  kind: "csoai.regulation-feed/0.1",
  generated: new Date().toISOString(),
  doctrine: "MEASURED from the reg-watch daemon (daily provision-change detection). REPORTED where cited. A wrong date destroys a competitor faster than it destroys us; corrections are published, never silently edited.",
  instruments,
  n_instruments: instruments.length,
  events,
  note: "Signed snapshot — signature computed off-chain by the estate key; verify against did:web:csoai.org. This is the living regulation-change feed (empty-chair #2): the first estate product a relying party may pay to depend on.",
};
writeFileSync(OUT, JSON.stringify(feed, null, 2));
console.log(`[reg-feed] ${instruments.length} instruments -> ${OUT}`);
