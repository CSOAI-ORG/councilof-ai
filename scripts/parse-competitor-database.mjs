#!/usr/bin/env node
/**
 * Parse COMPETITOR-DATABASE markdown YAML blocks → client/src/data/competitorDatabase.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";

const src =
  process.argv[2] ||
  "/home/ubuntu/.cursor/projects/workspace/uploads/COMPETITOR-DATABASE-2026-08-24_1a1a.md";
const raw = readFileSync(src, "utf8");
const blocks = [...raw.matchAll(/```yaml\n([\s\S]*?)```/g)].map((m) => m[1].trim());

const records = [];
for (const block of blocks) {
  if (!block.includes("player_class:")) continue;
  try {
    records.push(parseYaml(block));
  } catch (e) {
    console.error("parse fail", e.message);
  }
}

const out = {
  schema: "csoai.competitor-database/0.1",
  generatedAt: "2026-08-24",
  doctrine:
    "52/52 signing_state = unsigned measurement. Measurement ≠ certification. Scores never sold. GV.2: Vals AI NEVER-PARTNER.",
  eatRules: [
    "Public artifacts only — no ToS violations",
    "Licence-sweep before reuse",
    "Measurement-not-accusation grammar",
    "Corrections register symmetric fairness",
    "GV.2 Vals never-partner, no echo without re-measurement",
    "JL.5 statuses checkable with source + date",
    "INTEROP/DISTRIBUTION = complement, never competition",
    "EAT play never sells a score",
  ],
  classCounts: records.reduce((acc, r) => {
    acc[r.player_class] = (acc[r.player_class] || 0) + 1;
    return acc;
  }, {}),
  records,
};

writeFileSync(
  "client/src/data/competitorDatabase.json",
  JSON.stringify(out, null, 2),
);
console.log("records", records.length, "classes", out.classCounts);
