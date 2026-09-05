/**
 * A /.well-known door may not claim a mapping it does not carry.
 *
 * On 2026-09-04, 77 published discovery documents each asserted "<Standard> mapped to CSOAI
 * measurement axes" and not one contained a mapping. They were generated from a template with the
 * standard's name substituted in. The deploy being broken is the only reason they were not public.
 *
 * This guard makes that class of claim impossible to ship again: if a door says it maps, it must
 * name an axis. Run over public/.well-known.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const SELFTEST = args.includes("--selftest");
const DIR = args.find((a) => !a.startsWith("--")) ?? "public/.well-known";
const AXES = ["provenance-controls","reserve-attestation","regulatory-framework","distribution-integrity",
              "custody-disclosure","ai-adoption-components","labour-components","humanoid-labour-index"];
const CLAIMS = [/mapped to .*measurement axes/i, /\bmaps? to (the )?CSOAI\b/i, /axes covered/i];

// Selftest first: a guard that cannot fail enforces nothing, and it must not need the tree to run.
if (SELFTEST) {
  const sample = '{"notes":["X mapped to CSOAI measurement axes"]}';
  const detected = CLAIMS.some((r) => r.test(sample)) && !AXES.some((a) => sample.includes(a));
  const clean = '{"notes":["mapped to CSOAI measurement axes: provenance-controls"]}';
  const passes = AXES.some((a) => clean.includes(a));
  if (!detected || !passes) { console.error("\u2716 well-known-claim-guard selftest FAILED"); process.exit(1); }
  console.log("\u2713 well-known-claim-guard selftest: unbacked claim caught, backed claim allowed");
  process.exit(0);
}

const bad = [];
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const raw = readFileSync(join(DIR, f), "utf8");
  if (!CLAIMS.some((r) => r.test(raw))) continue;
  const namesAnAxis = AXES.some((a) => raw.includes(a)) || /"axes"\s*:\s*\[/.test(raw);
  if (!namesAnAxis) bad.push(f);
}


if (bad.length) {
  console.error(`✖ well-known-claim-guard: ${bad.length} door(s) claim an axis mapping they do not carry:\n`);
  for (const f of bad) console.error(`   ${f}`);
  console.error("\n  Either name the axes the mapping covers, or state that no mapping is published.");
  process.exit(1);
}
console.log(`✓ well-known-claim-guard: no door claims a mapping it does not carry (${readdirSync(DIR).length} scanned)`);
