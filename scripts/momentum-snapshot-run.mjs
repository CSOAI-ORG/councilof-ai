// Child of scripts/momentum-snapshot.mjs; runs under --experimental-strip-types.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dist, origin] = process.argv.slice(2);
const m = await import("../functions/api/_momentum.ts");
const payload = await m.buildMomentum({ fetch: globalThis.fetch, origin, now: () => new Date() });
if (!payload.figures.length) {
  console.log("momentum-snapshot: every source failed; no snapshot written");
  process.exit(0);
}
mkdirSync(join(dist, "interop"), { recursive: true });
writeFileSync(join(dist, "interop", "momentum-snapshot.json"), JSON.stringify({ ...payload, snapshot_of: `${origin}/api/momentum` }, null, 2) + "\n");
console.log(
  `momentum-snapshot: ${payload.figures.length} figures, ${payload.listings.length} listings, ${payload.omitted.length} omitted -> ${join(dist, "interop", "momentum-snapshot.json")}`,
);
for (const o of payload.omitted) console.log(`  omitted ${o.id}: ${o.reason}`);
