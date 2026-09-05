/**
 * root-conflict-disclosure.test.mjs — a "not yet" that must not outlive the "not yet".
 *
 * On 2026-09-05 a SCITT peer asked for the pinned rule and verifier path that check two things:
 * conflicting roots for the same issuer and epoch, and whether a reader holds the current head.
 * The conflict rule was published the same day (HOW-TO-VERIFY-ROOT.md, ledger C-2026-0905-01) and
 * `find_root_conflicts` landed in scripts/witness_public_root.py at 06:25:32Z.
 *
 * The most recent root run was 04:16:50Z. So the rule was public and the served artifacts had no
 * `conflict` key at all — and a reader fetching the pointer on the strength of that document would
 * find the field missing and reasonably conclude the document lied. The guide now says so in a
 * paragraph beginning "Not yet observable".
 *
 * THAT PARAGRAPH IS ITSELF A CLAIM WITH A SHELF LIFE, which is the exact disease this lane spent a
 * day finding everywhere else: a sentence true at the moment it was written, published as a
 * standing fact, and read later. The moment the next root run publishes a sidecar carrying a
 * `conflict` block, the paragraph becomes false in the other direction — it will tell readers a
 * field is absent that they can see.
 *
 * So this fails as soon as the disclosure is obsolete, and names the edit to make. A retraction
 * nobody is forced to retract is a story about honesty rather than the thing itself.
 *
 * Offline by default. LIVE_ROOT_WITNESS=1 fetches the served sidecar and pointer.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDE = path.join(repo, "public/signed/HOW-TO-VERIFY-ROOT.md");
const SIDECAR = "https://councilof.ai/interop/root-witness-latest.json";
const POINTER = "https://councilof.ai/interop/root-witness-pointer.json";
const DISCLOSURE = "Not yet observable";

const guide = readFileSync(GUIDE, "utf8");

describe("the conflict rule and its not-yet-observable disclosure", () => {
  it("the pinned rule and the verifier path are both named in the published guide", () => {
    assert.match(
      guide,
      /C-2026-0905-01/,
      "the ledger id for the conflict rule is gone from the guide. It is the identifier a peer " +
        "was given in writing on 2026-09-05; it has to keep resolving to something.",
    );
    assert.match(
      guide,
      /find_root_conflicts/,
      "the guide no longer names the verifier function. A rule with no path to the code that " +
        "implements it is a promise, not a procedure.",
    );
    assert.match(
      guide,
      /equal `as_of` and unequal `merkle_root` are a CONFLICT/,
      "the conflict rule itself has changed or gone. It was quoted verbatim to a peer; a " +
        "silent edit makes that quotation wrong rather than making the rule better.",
    );
    assert.match(
      guide,
      /only sees roots this publisher witnessed and kept/,
      "the stated limit is gone. The check cannot catch a publisher that logged two roots and " +
        "kept one sidecar, and the guide saying so is the reason an independent witness was asked for.",
    );
  });

  it("live: the disclosure is retracted once a published artifact carries a conflict block", async () => {
    if (!process.env.LIVE_ROOT_WITNESS) {
      console.log("      (offline: LIVE_ROOT_WITNESS unset — served artifacts NOT fetched)");
      return;
    }
    const carries = [];
    for (const url of [SIDECAR, POINTER]) {
      let doc;
      try {
        const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
        if (!res.ok) continue; // a fetch failure says nothing either way
        doc = await res.json();
      } catch {
        continue;
      }
      if (doc && Object.prototype.hasOwnProperty.call(doc, "conflict")) carries.push(url);
    }
    if (!carries.length) return; // still not observable; the disclosure is still true

    assert.ok(
      !guide.includes(DISCLOSURE),
      `${carries.join(" and ")} now carry a conflict block, so the "${DISCLOSURE}" paragraph in ` +
        `public/signed/HOW-TO-VERIFY-ROOT.md is false. Delete that paragraph — keeping the ` +
        `sentence "Stated limit: this check only sees roots this publisher witnessed and kept." — ` +
        `and tell Iman Schrock (team@emiliaprotocol.ai) that the field he was warned about is live.`,
    );
  });

  it("live: while the disclosure stands, the field really is absent", async () => {
    if (!process.env.LIVE_ROOT_WITNESS) {
      console.log("      (offline: LIVE_ROOT_WITNESS unset — absence NOT verified)");
      return;
    }
    if (!guide.includes(DISCLOSURE)) return; // already retracted; nothing to check
    const res = await fetch(POINTER, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) {
      console.log(`      (pointer HTTP ${res.status} — absence NOT verified)`);
      return;
    }
    const doc = await res.json();
    assert.ok(
      !Object.prototype.hasOwnProperty.call(doc, "conflict"),
      "the served pointer carries a conflict block while the guide still says it does not. " +
        "Retract the disclosure paragraph.",
    );
  });
});
