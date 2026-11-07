#!/usr/bin/env node
/**
 * scripts/check-evidence-bundle-freshness.mjs
 *
 * E3 Bundle freshness gate (LANE-NEXT-WEEK-2026-11-09.md):
 *   Reads each obligation's selected signed cards (article-50, article-53, dora, cra)
 *   from public/cards-bundle.json and verifies that the newest card's `as_of`
 *   timestamp is <= maxAgeDays (default 14 days) relative to reference time.
 *
 * Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

export const OBLIGATION_KEYWORDS = {
  "article-50": [
    "article 50",
    "art50",
    "art 50",
    "provenance",
    "c2pa",
    "watermark",
    "synthetic",
    "marking",
    "agent.disclosure",
  ],
  "article-53": [
    "gpai",
    "article 53",
    "art53",
    "art 53",
    "system-card",
    "model card",
    "model",
    "provider",
    "behaviour",
    "frontier",
    "training",
    "copyright",
  ],
  dora: [
    "vendor",
    "system-card",
    "model",
    "provider",
    "behaviour",
    "dora",
    "ict",
    "third-party",
    "gemini",
    "claude",
    "gpt",
    "frontier",
    "fedramp",
  ],
  cra: [
    "vendor",
    "system-card",
    "model",
    "vulnerability",
    "drift",
    "behaviour",
    "cra",
    "digital element",
    "product",
    "frontier",
  ],
};

export function checkBundleFreshness(bundleObj, { nowIso = new Date().toISOString(), maxAgeDays = 14 } = {}) {
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(nowMs)) {
    throw new Error(`Invalid nowIso timestamp: ${nowIso}`);
  }
  const maxAgeMs = maxAgeDays * 86_400_000;
  const rawCards = bundleObj?.cards && typeof bundleObj.cards === "object" ? bundleObj.cards : {};
  const signedEntries = Object.entries(rawCards).filter(
    ([, w]) => w && w.card && w.card.sha256 && w.card.sig_ed25519,
  );

  const obligations = [];
  for (const [obId, keywords] of Object.entries(OBLIGATION_KEYWORDS)) {
    const matching = signedEntries.filter(([, w]) => {
      const c = w.card;
      const hay = `${c.subject || ""} ${c.surface || ""} ${Array.isArray(c.tags) ? c.tags.join(" ") : ""}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    });
    const newestAsOf =
      matching
        .map(([, w]) => String(w.card.as_of || ""))
        .filter(Boolean)
        .sort()
        .at(-1) || null;
    const newestMs = newestAsOf ? Date.parse(newestAsOf) : NaN;
    const ageDays = Number.isFinite(newestMs)
      ? Math.max(0, (nowMs - newestMs) / 86_400_000)
      : Infinity;
    const fresh = matching.length > 0 && Number.isFinite(newestMs) && nowMs - newestMs <= maxAgeMs;
    obligations.push({
      obligation: obId,
      card_count: matching.length,
      newest_as_of: newestAsOf,
      age_days: Number.isFinite(ageDays) ? Number(ageDays.toFixed(2)) : null,
      max_age_days: maxAgeDays,
      status: fresh ? "FRESH" : "STALE",
    });
  }

  return {
    ok: obligations.every((o) => o.status === "FRESH"),
    checked_at: nowIso,
    max_age_days: maxAgeDays,
    obligations,
  };
}

function main() {
  const args = process.argv.slice(2);
  let maxAgeDays = 14;
  let bundlePath = path.join(REPO_ROOT, "public", "cards-bundle.json");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max-age-days" && args[i + 1]) {
      maxAgeDays = Number(args[++i]);
    } else if (args[i] === "--bundle" && args[i + 1]) {
      bundlePath = path.resolve(args[++i]);
    }
  }
  const bundleObj = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const res = checkBundleFreshness(bundleObj, { maxAgeDays });
  for (const ob of res.obligations) {
    console.log(
      `[${ob.status}] obligation=${ob.obligation} cards=${ob.card_count} newest_as_of=${ob.newest_as_of} age_days=${ob.age_days}/${ob.max_age_days}`,
    );
  }
  if (!res.ok) {
    console.error("Evidence bundle freshness check failed: one or more bundles exceed max_age_days.");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
