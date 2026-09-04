#!/usr/bin/env node

/**
 * Freeze the executable GSPC quest bank into independently hashable instruments.
 *
 * The game page remains the renderer. This manifest is the evidence boundary:
 * candidate observations name one immutable instrument digest instead of
 * pretending that a score or a mutable HTML page identifies the test that ran.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const sourcePath = resolve(ROOT, "public/gspc-quests.html");
const outputPath = resolve(ROOT, "public/signed/gspc-quest-instruments.json");
const VERSION = "gspc-quest-pack/2026-09-04";
const SCORE_ID = "csoai.gspc-quest-score/1";
const SCORE_VERSION = "1";

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`missing marker: ${startMarker}`);
  const contentStart = start + startMarker.length;
  const end = text.indexOf(endMarker, contentStart);
  if (end < 0) throw new Error(`missing marker: ${endMarker}`);
  return text.slice(contentStart, end);
}

const html = readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
const pack = JSON.parse(between(html, "const PACK = ", ";\nconst $ ="));
const scoreSource = between(
  html,
  "function extractLabel(p, text){",
  "\nfunction worstHalf(n)",
);
const scoringRule = {
  id: SCORE_ID,
  version: SCORE_VERSION,
  code_sha256: sha256(`function extractLabel(p, text){${scoreSource}`),
  unparsed_policy: "null predictions are counted unparsed and incorrect",
  metrics: ["accuracy", "macro-F1"],
  usable_n: 30,
};

const instruments = pack.map((entry) => {
  const manifest = {
    key: entry.key,
    axis: entry.axis,
    dataset: entry.dataset,
    dataset_url: entry.dataset_url || null,
    labels: entry.labels,
    inputCol: entry.inputCol || null,
    tokenRe: entry.tokenRe,
    n: entry.n,
    bankN: entry.bankN || null,
    items: entry.items.map(({ q, a, anchor }) => ({
      q,
      a,
      anchor: anchor || "",
    })),
    compare: entry.compare,
    subsetNote: entry.subsetNote || null,
    retired: entry.retired || null,
    counselNote: entry.counselNote || null,
    scoring_rule: {
      id: scoringRule.id,
      version: scoringRule.version,
      code_sha256: scoringRule.code_sha256,
    },
  };
  return {
    key: entry.key,
    axis: entry.axis,
    id: `${entry.dataset}#quest:${entry.key}`,
    version: VERSION,
    digest: sha256(canonical(manifest)),
    manifest,
  };
});

const output = `${JSON.stringify(
  {
    schema: "csoai.quest-instrument-set/0.1",
    version: VERSION,
    source: "/gspc-quests.html",
    generated_at: "2026-09-04",
    scoring_rule: scoringRule,
    instruments,
  },
  null,
  2,
)}\n`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(outputPath, "utf8");
  } catch {
    // Report the same deterministic drift message for an absent output.
  }
  if (current !== output) {
    console.error(
      "GSPC quest instrument manifest is stale; run npm run quest:instruments.",
    );
    process.exitCode = 1;
  } else {
    console.log(`GSPC quest instruments: ${instruments.length} current`);
  }
} else {
  writeFileSync(outputPath, output);
  console.log(
    `Wrote ${instruments.length} frozen quest instruments to ${outputPath}`,
  );
}
