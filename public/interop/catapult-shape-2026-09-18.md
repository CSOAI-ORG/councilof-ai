# DOC: Catapult spike — what each of the 15+ surfaces receives (written only; nothing deployed)

**Per M4 GOAL MODE 18 Sep 2026 + the previous round's Catapult thesis:**
"Once something genuinely reaches PUBLISHED, don't merely put it on a webpage. Catapult it.
One evidence object should automatically become: Council board, REST / OpenAPI, MCP, A2A,
AG-UI, x402, RSS / Atom, Hugging Face, research dataset, machine indexes, regulator crosswalk,
evidence pack, correction/supersession graph, public verification URL."

**HARD STOP in force.** No push, merge, dispatch, signing, or editing of published bytes.
This document is the SHAPE of the catapult, with the **gate that fails closed** until the
board signer is reachable. Nothing on disk today does any catapulting. The shape is
described so the next implementation has the gate to fail closed against.

## The gate

A measurement is eligible to be catapulted only if ALL of the following are true:

  1. Source artifact carries `status: PUBLISHED` AND a `sha256` content address.
  2. The artifact has been OTS-stamped by the board signer (did:web:csoai.org#board-attestation-1).
  3. The signer is the ONLY key allowed to write the catapult manifest. The harvest-stage
     Ed25519 key in ~/.csoai/keys/ is NEVER used to sign a catapult entry.
  4. The catapult manifest records: source_sha256, signed_at, signer_did, catapult_targets[]
     (one entry per surface), failure_mode_on_partial (NEVER partial = "all or nothing"),
     readback_required (true for HF and CSOAI surface; false for outbound-only surfaces).

If ANY condition fails, the catapult returns the state of its source and a reason. It does
NOT publish partial catapults.

## What each surface receives

For one evidence object with sha256=X, as_of=Y, signed_by=did:web:csoai.org#board-attestation-1:

| # | Surface | What it gets | Format | Readback |
|---|---------|--------------|--------|----------|
| 1 | Council board | One row in /api/gspc; carries sha256, signed_by, as_of, corrections pointer | JSON | GET /api/gspc |
| 2 | REST / OpenAPI | GET /api/measurements/{sha256} returns the canonical evidence object | JSON | anonymous GET |
| 3 | MCP | tools/call list_measurements; tools/call verify_measurement(sha256) | JSON-RPC | MCP stdio |
| 4 | A2A | The measurement is an AgentSkill in /a2a/skills/measurements/{sha256} | JSON-LD | anonymous GET |
| 5 | AG-UI | The artifact is exposed via /ag-ui/{sha256}; rendered in an iframe-able card | JSON-LD | browser iframe |
| 6 | x402 | POST /x402/measure/{sha256} returns 402 with price; payment returns a signed receipt | JSON | anonymous 402 challenge |
| 7 | RSS / Atom | One entry in /feed/measurements.atom with sha256, title, signed_at, links to /api/gspc | Atom | GET feed; re-parse |
| 8 | Hugging Face | Upload to csoai/<repo>/measurements/<sha256>.json (gate: HF token has csoai/* org-write) | JSON | anonymous GET to HF |
| 9 | Research dataset | Mirror the canonical JSON to /datasets/csoai/measurements-YYYY-MM-DD.jsonl | JSONL | HEAD + GET first line |
| 10 | Machine indexes | Submission to web indexes (Google, Bing) via /sitemap-measurements.xml | XML | re-fetch sitemap |
| 11 | Regulator crosswalk | Append to /crosswalks/<axis>.json linking the artifact to CLARITY/GENIUS/EU AI Act provisions | JSON | anonymous GET |
| 12 | Evidence pack | Build a self-contained evidence pack at /packs/<sha256>.zip (canonical + verification script) | ZIP | anonymous download + hash |
| 13 | Correction/supersession graph | Append edge at /corrections/{new_id} pointing to {sha256} as the corrected-from artifact | JSON | anonymous GET |
| 14 | Public verification URL | Stable URL /verify/{sha256} that re-derives the digest from a fresh machine | HTML | anonymous GET |
| 15 | Audit log | Append a single cat-step entry at /audit/catapult/{sha256} with timestamp, target list, sig | JSONL | anonymous GET |
| 16 | LLM retrievable | /llms.txt entry per artifact with the sha256, summary, citations | Markdown | GET |
| 17 | Press one-pager | /press/{sha256}.md auto-generated from the artifact's headline field | Markdown | GET |

That is 17 surfaces (one more than the brief's 15-30 estimate; this is a starting point).

## Failure modes the gate must catch

Per M4 brief's "traps paid for already":

| Trap | Catapult-specific defence |
|------|--------------------------|
| `dict.get(key, {})` silently drops present-and-null values | Catapult walks the source artifact's `value` field and refuses to publish a surface record that does not include the same sha256 it was stamped with |
| snapshot_download reports success while delivering 1,596 of 8,114 files | Catapult verifies every target has the expected byte size AND the expected sha256 of the surface record before publishing the manifest |
| A test that never enters main() tests nothing | The gate script has a known-shape test that exercises every fail-closed branch |
| A guard that cannot fire is decoration | Every failure mode above has an explicit code path that emits `catapult_failed: <reason>` and exits non-zero |
| A count in prose and a count in a field must be the same count | The catapult manifest records `targets_attempted = N` and `targets_published = M`; the difference is named, not zero-filled |
| Background process inferred dead from short output | The catapult loop has a `bg_state` heartbeat that records pgrep + timestamp; absence = NOT_DEAD_INFERRED, presence = CONFIRMED_LIVE |

## What gets deferred until the signer is back

The catapult FAILS CLOSED on:

- The board signer (OIDC inside Actions) being unreachable — Day-1 owner blocker, ticket #4720908.
- HF org-write scope — Day-1 owner blocker #7.
- Cloudflare zone browser-integrity bypassing councilof.ai for non-browser clients — Day-1 owner blocker #6.

Until each of these is resolved, the catapult manifest records:

```json
{
  "state": "GATE_BLOCKED",
  "blocked_by": ["signer_unreachable", "hf_no_org_write", "cloudflare_blocking_machine_clients"],
  "rule": "Per M4 brief, never sign with anything but the board key. Catapult does not publish partial outputs."
}
```

A gate-blocked catapult is **not** a cat, it is a no-op with the reason recorded. This is the
correct state, not a defect.

## Open work

1. **Subject set for catapult dry-run.** I need 3 evidence objects that have actually been
   board-signed, so the catapult can be exercised end-to-end without inventing signers.
   Today, zero of the 7,973 catalogued entries are board-signed — the singer is
   unreachable. Therefore the dry-run itself cannot be run. That is the real state.

2. **Two test artifacts.** When the signer returns, the next round should land two
   signable artifacts (e.g. one legal-measure, one financial-measure) so the catapult
   has something to actually deploy against. Until then, the catapult description is
   the artefact of record.

3. **What "Catapult" does to a partial-deploy.** Per brief: "Something changes? NO →
   HOLD; YES → FIX → LEARN → RE-MEASURE → SIGN → CATAPULT." The catapult entry on a
   re-measurement is `superseded_by` the new sha256, not a new entry. The graph stores
   the line, not the point.

## Verdict

The catapult shape is described. The gate fails closed. Nothing is deployed today. The
HARD STOP is in force. The next implementation cannot start until the signer is back;
until then, this document is the artefact that records the design intent and the
fail-closed guarantees. (◕‿◕)★
