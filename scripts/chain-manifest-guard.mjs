#!/usr/bin/env node
/**
 * chain-manifest-guard — block a build that publishes a /signed/ URL which 404s,
 * or a card chain whose manifest disagrees with the bytes on disk.
 *
 * WHY THIS EXISTS (2026-08-26)
 * public/signed/chain.json was deleted five separate times by five separate lanes,
 * each reading the "do not claim 335" rule in signed-json-guard.mjs — a rule about
 * card_index.json, a CURATED SUBSET — as a blanket ban on the number. It is not:
 * the chain legitimately holds 335 POSITIONS (313 published bodies + 22 withheld),
 * and it verifies. Each deletion left two live defects behind:
 *
 *   1. /api/state kept publishing card_chain.manifest = "/signed/chain.json",
 *      so the estate advertised a manifest URL that returned 404 — on the very
 *      pages arguing that a reader should not have to take our word for anything.
 *   2. chain-facts.json survived as a derived artifact whose input was gone, so
 *      the published counts (313 bodies, 335 positions) could no longer be
 *      re-derived by anyone, including us.
 *
 * Publishing a number nobody can re-derive, and a link that does not resolve, is
 * the exact class of defect /api/corrections exists to record. A comment asking
 * future lanes not to do it again has now failed five times, so this is the same
 * request expressed as a build failure.
 *
 * Estate rule: a component must be STRUCTURALLY UNABLE to report success on a path
 * it did not complete.
 *
 * Run:  node scripts/chain-manifest-guard.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const signedDir = join(root, "public", "signed");
const failures = [];

// ── 1. every /signed/ URL a published surface advertises must actually resolve ──
// These are the files a stranger's tooling reads to find out what exists. A path
// named here and absent on disk is a 404 we published on purpose.
const SURFACES = [
  "functions/api/state.ts",
  "public/interop/surface-catalog.json",
  "public/signed/HOW-TO-VERIFY.md",
  "packages/gspc-card-verifier/README.md",
];
for (const rel of SURFACES) {
  const abs = join(root, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, "utf8");
  // Stops at the first character that cannot be in a path, so a documented
  // placeholder like /signed/cards/<card-id>.json degrades to the directory.
  const urls = new Set(text.match(/\/signed\/[A-Za-z0-9._\/-]+/g) ?? []);
  for (const u of urls) {
    const target = join(root, "public", u.replace(/^\//, ""));
    if (!existsSync(target))
      failures.push(`${rel} publishes ${u} — nothing at public${u}. That URL 404s for every reader who follows it.`);
  }
}

// ── 2. the chain manifest must agree with the bytes it indexes ─────────────────
const chainPath = join(signedDir, "chain.json");
const factsPath = join(signedDir, "chain-facts.json");

if (!existsSync(chainPath)) {
  // A derived artifact outliving its input is how the counts became unre-derivable.
  if (existsSync(factsPath))
    failures.push(
      "public/signed/chain.json is missing while chain-facts.json still publishes counts derived " +
        "from it. Those numbers can no longer be re-derived by anyone. Restore chain.json from git " +
        "history, or withdraw chain-facts.json and the card_chain block in functions/api/state.ts — " +
        "but do not keep publishing a count whose input is gone.",
    );
} else {
  const chain = JSON.parse(readFileSync(chainPath, "utf8"));
  const links = Array.isArray(chain.links) ? chain.links : [];
  const byId = new Map(links.map((l) => [l.id, l]));

  if (byId.size !== links.length)
    failures.push(`chain.json: ${links.length} links but only ${byId.size} distinct ids — a position is duplicated`);
  if (chain.length !== links.length)
    failures.push(`chain.json: header length=${chain.length} but links[] holds ${links.length} — header lie`);

  const published = links.filter((l) => l.body_published !== false);
  const withheld = links.filter((l) => l.body_published === false);
  if (chain.bodies_published !== published.length)
    failures.push(`chain.json: header bodies_published=${chain.bodies_published} but ${published.length} links say so`);
  if (chain.bodies_withheld !== withheld.length)
    failures.push(`chain.json: header bodies_withheld=${chain.bodies_withheld} but ${withheld.length} links say so`);

  // Walk prev from head to genesis. This is the one property the manifest is FOR:
  // it is what shows no position was silently dropped from the middle.
  let cur = chain.head, steps = 0;
  const seen = new Set();
  while (cur && cur !== chain.genesis_prev && steps <= links.length) {
    const l = byId.get(cur);
    if (!l) { failures.push(`chain.json: walk broke — no link for ${cur}`); break; }
    if (seen.has(cur)) { failures.push(`chain.json: walk cycles at ${cur}`); break; }
    seen.add(cur); cur = l.prev; steps++;
  }
  if (cur !== chain.genesis_prev && !failures.some((f) => f.includes("walk")))
    failures.push(`chain.json: walk from head did not terminate at genesis_prev after ${steps} steps`);
  else if (cur === chain.genesis_prev && steps !== links.length)
    failures.push(`chain.json: walk visited ${steps} positions but links[] holds ${links.length} — orphaned links`);

  // Both directions of disk parity.
  const cardsDir = join(signedDir, "cards");
  const onDisk = existsSync(cardsDir)
    ? readdirSync(cardsDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))
    : [];
  const diskSet = new Set(onDisk);
  const missing = published.filter((l) => !diskSet.has(l.id));
  if (missing.length)
    failures.push(`chain.json: ${missing.length} link(s) marked body_published:true have no file under public/signed/cards/ (e.g. ${missing[0].id.slice(0, 16)}…)`);
  const orphans = onDisk.filter((id) => !byId.has(id));
  if (orphans.length)
    failures.push(`public/signed/cards/: ${orphans.length} card file(s) appear in no chain position (e.g. ${orphans[0].slice(0, 16)}…) — the manifest is not a complete index of the store`);

  // A withheld position must stay withheld: no body, or it is not withheld.
  const leaked = withheld.filter((l) => diskSet.has(l.id));
  if (leaked.length)
    failures.push(`chain.json: ${leaked.length} position(s) marked body_published:false HAVE a published body — the disclosure contradicts the bytes`);

  if (existsSync(factsPath)) {
    const facts = JSON.parse(readFileSync(factsPath, "utf8"));
    if (facts?.chain?.positions !== links.length)
      failures.push(`chain-facts.json says ${facts?.chain?.positions} positions; chain.json holds ${links.length}`);
    if (facts?.bodies?.published !== onDisk.length)
      failures.push(`chain-facts.json says ${facts?.bodies?.published} bodies published; ${onDisk.length} files on disk`);
    // The manifest carries no signature of its own, and every surface quoting it
    // says so. If that ever stops being true it must be re-derived, not assumed.
    const actuallySigned = ["sig", "signature", "custody_attestation", "jws"].some((k) => chain[k] !== undefined);
    if (facts?.chain?.manifest_signed !== actuallySigned)
      failures.push(`chain-facts.json says manifest_signed=${facts?.chain?.manifest_signed} but chain.json ${actuallySigned ? "carries" : "carries no"} top-level signature`);
  }
}

if (failures.length) {
  console.error(`✖ chain-manifest-guard: ${failures.length} problem(s) — BUILD BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe /signed/ tree is what we tell strangers to check instead of trusting us. A dead link or an unre-derivable count there is a broken promise, not a cosmetic bug.`);
  process.exit(1);
}
const n = existsSync(chainPath) ? JSON.parse(readFileSync(chainPath, "utf8")).links.length : 0;
console.log(`✓ chain-manifest-guard: ${n} chain positions consistent with the bytes; every published /signed/ URL resolves`);
