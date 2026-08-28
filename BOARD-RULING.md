# Board card-index ruling — LIVE 2026-08-27

## Current ruling (supersedes 2026-08-26 freeze)

**OWNER RULING 2026-08-27**: The index lists EVERY verifying published GSPC card — today
**313** — enriched with sig/pubkey/card_url; chain.json is published; the cross-border card
is a SEPARATE schema counted separately, never folded into the GSPC count. No agent may
clamp the index to any constant.

Live state (cite by field, not by number):
- **GET /api/gspc** → 22 axis · 15 measured · 893 items. `totals.public_count` is the live sentence.
- **public/signed/card_index.json** → 313 cards (n_cards and cards[].length)
- **150 of those 313** verify against `did:web:csoai.org#card-attestation-1`
- **living_stamp verification_state** = UNVERIFIABLE (do not call it a signed freeze)
- Measurement credential, never certification. Verification is free and loginless.

Rules:
1. **signed-json-guard** remains the sole structural gate (header count == array length).
2. **No constant clamps.** Do not rollback to 150 or any other floor. The index grows with
   verified cards.
3. **GHA on master only.** Deploy is via `deploy.yml` on push to master; direct wrangler is
   owner-only and forbidden for agents per DEPLOY-LOCK.md.

---

## Historical record: the 150 freeze era (SUPERSEDED 2026-08-27)

The section below is preserved as history. It was correct at its time but is no longer the
governing ruling. Do NOT follow these instructions.

### What I got wrong (and am correcting) — 2026-08-26
On 2026-08-26 I ruled the 150↔335 dispute as "150 ⊂ 335, union = 335" and restored the
335 index. That was **structurally** true but **not a measurement of the 185 extra cards**:
- `"signed": true` in each card entry is a **boolean flag, not a signature**.
- Neither the core 150 nor the extra 185 have backing card files in this repo — every
  `card` value is a content-hash that only verifies against the external card store
  (the harness / HF), which this repo cannot see.
- The extra 185 are all **benchmark/candidate axes** (arc-30, mmlu-30, gsm8k-30,
  swarm-candidates, jail-escape-detection, care-refusal-*, duplicated gspc-* names).

So I could not, and did not, verify the 185 are real measured cards. Claiming 335 on that
basis is exactly the overclaim this estate exists to refuse. **UNMEASURED before measured.**

### The 150 freeze ruling (SUPERSEDED)
1. Board card-index was frozen at 150 until the 185 candidate cards were verified.
2. Auto-restoring board workflows were removed.
3. `signed-json-guard` remained the only gate.

**This freeze was lifted by OWNER RULING 2026-08-27** when the 313-card index was verified
against the live card store with sig/pubkey/card_url enrichment. The index is now dynamic:
it lists every verifying card, not a frozen floor.
