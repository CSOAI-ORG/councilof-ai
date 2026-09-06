# Incident registries (F50/F51) and the settlement-census line — 6 September 2026

Two things, both ending in "not yet, and here is the exact trigger".

---

## The settlement-census line: NOT ADDED, and why

**Instruction:** every grant/partner pack gets one line naming the settlement census as a measured
artefact — **once its dataset exists, not before.**

**It does not exist. The line is not added.**

| Check | Result |
|---|---|
| `X402-PLAYBOOK-06Sep2026.md` row **B3** | *"Move B: settlement census … → `csoai/x402-settlement-census`"* — **NOT RUN** |
| `docs/product/x402-settlement-census*` | **ABSENT** |
| `docs/product/SETTLED-DOORS-2026-09-06.md` (row B2) | **ABSENT** |
| `/api/revenue` → `settled_usdc` | **`null`, UNMEASURED** — nothing has settled |

**A note on how not to check this.** `huggingface.co/api/datasets/csoai/x402-settlement-census`
returns **401**, which looks like evidence of absence and is not. The control —
`csoai/csoai-control-dataset-that-cannot-exist-9f3a2b` — **also returns 401**. The HF API cannot
distinguish *absent* from *private* unauthenticated, so the 401 proves nothing in either direction.
The conclusion above rests on the playbook's own status row and on `settled_usdc` being null, not
on that status code.

**The trigger, so the line goes in the moment it is earned.** Add it when **all three** hold:

1. `/api/revenue` → `settled_usdc.count` is an **integer**, not `null`;
2. `csoai/x402-settlement-census` resolves **200 with rows** (authenticated check, or public);
3. `docs/product/x402-settlement-census.md` exists carrying the run's own numbers.

Until then a settlement census is a **plan**, and naming a plan as a measured artefact in a funding
document is the precise failure the estate's doctrine exists to prevent. `settled_usdc` is `null`
rather than `0` for the same reason: null says nothing settled *and nothing was measured*; zero
would assert a measured count of no sales.

**Suggested line, ready to paste the moment the trigger fires** (not before):

> A signed settlement census of the public x402 host set — N hosts probed, M conformant, published
> as `csoai/x402-settlement-census` with the per-host result and the date of each probe.

---

## F50 — AIAAIC repository

Free, permissionless submission, live (`aiaaic.org/aiaaic-repository` → 200), no estate slug records
it.

**The submission worth making is our own incident, not someone else's.** The obvious move is to
submit a third-party AI failure. The far more interesting one, and the only one consistent with
this estate's doctrine, is **C-2026-0905-02**: 26 of our own cards were published with a digest in
the `sig_ed25519` field — a signature field carrying something that was not a signature. We caught
it, corrected it, moved the cards to UNSIGNED and staged, and the correction is public.

Almost nobody submits their own governance failure to an incident registry. Doing so is:

- **consistent** — we publish a corrections ledger with 46 entries; this is one of them;
- **verifiable** — the correction id, the cards and the ledger are all public;
- **not a claim about anyone else**, so it carries no risk of characterising a third party.

**Draft, owner sends. Facts only:**

> **Title.** Signature field populated with a non-signature digest in 26 published measurement cards
> **Date.** Discovered and corrected 2026-09-05.
> **System.** Council of AI (CSOAI Ltd, UK 16939677) GSPC measurement cards.
> **What happened.** 26 cards relating to SWIFT message types were published with a SHA-256 digest
> placed in the `sig_ed25519` field. The field name asserts an Ed25519 signature; the value was not
> one. No card was altered and no measurement was affected, but any verifier checking those 26
> cards would have failed them, and a reader trusting the field name would have believed them signed.
> **Correction.** Recorded publicly as C-2026-0905-02. The affected cards were moved to UNSIGNED and
> staged rather than silently re-signed.
> **Reported by.** The issuer, about itself.
> **Sources.** `https://councilof.ai/api/corrections` · `https://councilof.ai/signed/card_index.json`

## F51 — MITRE ATLAS: **poor fit, and saying so is the finding**

ATLAS catalogues **adversarial** threats to AI systems — attacker tactics and techniques. Live
(`atlas.mitre.org` → 200), no `atlas` slug in our 302 doors, submission is a permissionless PR to
`atlas-data` in STIX 2.1.

**We have nothing that belongs there.** Our corrections are self-inflicted integrity defects, not
adversary behaviour. The canonicalisation trap (CPython `1.0` vs JavaScript `1`, 117 of 335 cards)
is a serialisation incompatibility, not an attack. Submitting either would be padding a threat
catalogue with material that is not a threat, and it would be noticed.

**Recorded as NOT-A-FIT rather than left open**, so the row stops being re-proposed every sweep.
The honest ATLAS-shaped artefact would be a *demonstrated* attack on a measurement chain — for
example a card forged past a verifier that trusts the card's own embedded `pubkey` instead of
pinning the DID. `HOW-TO-VERIFY.md` §1 already warns about exactly that failure mode. If someone
demonstrates it against a real verifier, **that** is an ATLAS submission. Nothing we hold today is.

---

_Both rows probed 2026-09-06. Two of the three checks in this file returned a status code that
looked conclusive and was not; the control is recorded beside each._
