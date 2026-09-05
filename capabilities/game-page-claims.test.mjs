/**
 * game-page-claims.test.mjs — a page with no game may not claim to emit signed cards.
 *
 * WHAT HAPPENED, 2026-09-05. Nine static game pages landed on master carrying three claims:
 *
 *   "one of the 15 games wired to the 33-agent BFT council"
 *   "Every turn emits a signed card."
 *   "Every interaction emits a 3KB signed card. Anchored to OTS + Sigstore Rekor + EAS on Base."
 *
 * Each page is ~1.7KB of static HTML with zero <script>, zero <canvas> and zero <button>.
 * There is no turn, no interaction and nothing to sign. The pages also contradicted the
 * estate's own play surface, which states that nothing in the gallery is a measurement and
 * nothing in it is signed.
 *
 * "BFT" is worse than wrong, it is RETRACTED. scripts/brand-gate.mjs carries the ruling:
 * retracted 2026-07-29, "Byzantine/BFT/fault-tolerant asserts the withdrawn claim
 * (n_eff about 1.21/3)". brand-gate exited 1 on eight files, which means step 3 of the
 * four-step deploy pipeline in CLAUDE.md was failing and master could not ship at all.
 *
 * WHY THIS TEST EXISTS ANYWAY. brand-gate already catches the retracted vocabulary, and it
 * caught it here. It does NOT catch "every turn emits a signed card" on a page with no turn,
 * because that is not a banned string — it is a true-sounding sentence that happens to be
 * false. That is the gap this file covers: a claim about signing, anchoring or emitting is
 * checked against whether the page can do anything at all.
 *
 * The rule is deliberately narrow. A page may describe an intended game. It may not say it
 * emits, signs or anchors anything unless it carries the machinery to do so.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const PUBLIC = path.join(repo, "public");

/** Claims that assert this page does something. Present tense, about THIS surface. */
const ACTIVE_CLAIMS = [
  /\bevery turn emits\b/i,
  /\bevery interaction emits\b/i,
  /\bemits a (?:3KB )?signed card\b/i,
  /\bwired to the .{0,24}\bBFT\b/i,
];

/** Evidence the page can actually do something. */
function isInteractive(html) {
  return /<script\b/i.test(html) || /<canvas\b/i.test(html) || /<button\b/i.test(html);
}

function htmlFiles(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      // Skip vendored//generated trees that are not our authored pages.
      if (["interop", "signed", "cards", "proofs", "receipts", "assets"].includes(e)) continue;
      htmlFiles(p, out);
    } else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

describe("static pages do not claim capabilities they lack", () => {
  it("finds pages at all (guards against the walk silently matching nothing)", () => {
    const files = htmlFiles(PUBLIC);
    assert.ok(files.length > 20, `only ${files.length} html files found under public/`);
  });

  it("no page claims to emit, sign or anchor without the machinery to do it", () => {
    const offenders = [];
    for (const f of htmlFiles(PUBLIC)) {
      const html = readFileSync(f, "utf8");
      if (isInteractive(html)) continue; // it may genuinely do something; not this test's job
      const hit = ACTIVE_CLAIMS.find((re) => re.test(html));
      if (hit) offenders.push(`${path.relative(repo, f)} (${hit})`);
    }
    assert.deepEqual(
      offenders,
      [],
      `these pages carry no script, canvas or button — they cannot take a turn or emit ` +
        `anything — yet they claim to: ${offenders.join("; ")}. Describe the intended game ` +
        `instead, or ship the machinery. A page that says "every turn emits a signed card" ` +
        `while containing no game is the faked completed fix in a different costume.`,
    );
  });

  it("the retracted fault-tolerance vocabulary stays out of authored pages", () => {
    // brand-gate enforces this on the BUILD — but NOT everywhere, and that is why this
    // assertion is not redundant.
    //
    // scripts/brand-gate.mjs exempts the retraction-history pages by FILENAME:
    //
    //     allowOn: /refut|retract|ledger|counter-?canon|charter|methodolog|quorum/i
    //
    // The intent is right: the refutation ledger and the Firewall Charter must be able to
    // NAME the retracted claim. But it matches a filename substring, so any page whose name
    // happens to contain one of those words inherits the exemption. `public/games-charter.html`
    // did exactly that — a game page, nothing to do with the retraction history, publishing
    // "wired to the 33-agent BFT council" and passing the gate. Verified 2026-09-05: brand-gate
    // flags tournament.html and passes games-charter.html on the identical sentence.
    //
    // This assertion has no allowlist, so it closes that hole.
    const offenders = [];
    for (const f of htmlFiles(PUBLIC)) {
      if (/\bBFT\b|\bByzantine\b/i.test(readFileSync(f, "utf8"))) {
        offenders.push(path.relative(repo, f));
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `RETRACTED 2026-07-29. "Byzantine/BFT/fault-tolerant" asserts the withdrawn claim ` +
        `(n_eff about 1.21/3). Use "designed 33-agent council" + "23/33 threshold". ` +
        `Found in: ${offenders.join(", ")}. On most pages this also fails brand-gate and stops ` +
        `the whole estate shipping. On a page whose FILENAME contains charter, ledger, quorum, ` +
        `methodolog, retract, refut or counter-canon, brand-gate exempts it and it ships ` +
        `SILENTLY — which is worse. Fix the page; do not rely on the deploy gate to catch it.`,
    );
  });
});
