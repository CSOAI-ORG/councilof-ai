# Positioning — CSOAI Benchmark-as-a-Service (BaaS)

**Doc ID:** `csoai-baas-positioning-v1` · **Revision:** 2026-08-23
**Status:** doctrine-clean positioning draft (corrects three claims in the earlier BaaS proposal)
**Surface:** councilof.ai / csoai.org — signed measurement-data business

---

## 0. What this is (and is not)

CSOAI is **not** an API router and does not compete on routing. OpenRouter is a *pipe* that
routes requests to model providers. CSOAI is a **refinery**: it turns a live, continuously
running measurement instrument into **signed, verifiable data** that others license.

One-line positioning:

> **OpenRouter routes inference. CSOAI refines it into signed, continuously-verifiable
> measurement data.**

The product is **data**, not a better model, and not a bigger model list.

---

## 1. The three claims from the earlier proposal that are WRONG

These must never go into public material. Doctrine binds: check-never-assume, never claim
what we did not build this session.

### Claim 1 — "blockchain attestation" (WRONG)
The estate does not use a blockchain for attestation. It uses **Ed25519 signatures + a
`did:web:csoai.org` identity document**, published at `csoai.org/.well-known/did.json`. This
is *better* for regulators (it is a plain, human-auditable signature keyed to a domain the
controller owns) and is the honest label.

- **Correct label:** *signed measurement receipt* (Ed25519 over a canonical body, verifiable
  against the published did:web key).
- **Never say:** "on-chain", "blockchain-attested", "immutable ledger".
- **The one true thing:** a third party can recompute the canonical body → derive `content_id`
  → verify the Ed25519 signature against a key resolved from `did:web:csoai.org` — **without
  trusting us**. That is the trust story.

### Claim 2 — "model vendors pay to enter / staking / F1-style entry fees" (WRONG, violates nobody-ranked-pays)
The estate's binding doctrine is **nobody-ranked-pays**. A design where a ranked party pays to
enter (or pays to be ranked) unacceptably corrupts the measurement and creates a pay-for-place
incentive. This claim must be **dropped entirely** — it is not "future revenue", it is a doctrine
violation.

### Claim 3 — "2.5B gamers as unpaid benchmark runners" + "250Hz fly-brain Feynman-path" (WRONG, unsubstantiated)
Neither has a verified implementation in this session, and the scale figures are ungrounded.
Do not publish either. Do not attach a fabricated capacity figure to the instrument.

---

## 2. The verified moat (what we actually have)

These are live, checked assets — this is the real differentiator:

| Asset | Status | Why it is a moat |
|---|---|---|
| **Live arena data** | `councilof.ai/api/arena/rounds.jsonl` (~3,000 live ELO rounds, KV-backed, DESIGN-lab honest-503 discipline) | Continuously growing, current, non-fakeable signal |
| **Signed deterministic per-domain benchmark data** | 16 GSPC axes, 25 MCP-pack domains | Frozen probes re-run across generations = drift/consistency signal |
| **Non-gameable verified rankings** | Ed25519 receipts, content-addressed | Competitors can fake but cannot *verify*; we publish the verify path |
| **Longitudinal axis corpus** | 10,226 records, 3 clean models, 16 axes, timestamped | The value is the *change across time*, not a single snapshot |

The differentiator competitors cannot replicate: **we already produce verified rankings**
and publish the verification primitive (did:web key + signature format). A routing pipe can
route; it cannot plausibly attest provenance of a measurement.

---

## 3. The doctrine-safe BaaS business model

Four legs. Two are **allowed**, two are **forbidden**. Only build the allowed ones.

| Leg | Allowed? | Why |
|---|---|---|
| Model vendors pay **to enter / to be ranked** | **NO** | Violates nobody-ranked-pays; corrupts measurement |
| Enterprises pay to **license the signed corpus** | **YES** | Data licensing is clean; the buyer is not being ranked |
| Researchers pay for **verified rankings / access** | **YES** | Subscription to verifiable results; clean |
| Regulators/auditors pay for **attestation evidence** | **YES** | Signed evidence as a service; clean (this is *evidence*, not a certification) |

**Pricing only ever appears on the legal surface** (Terms / Pricing page). It never appears
in a measurement artifact, a dataset, or a ranking.

---

## 4. The product to ship first

**`gspc-axis-v0.1.0`** — a signed, licensable GSPC axis benchmark dataset.

- **Content:** 10,226 longitudinal records · 16 axes · 3 clean models
  (`qwen2.5:7b`, `mistral:7b`, `deepseek-r1:7b`) · schema `csoai.gspc-axis-dataset/0.1`.
- **Doctrine flags:** `not_a_certification: true` · `doctrine: measurement-not-certification ·
  nobody-ranked-pays · corrections appended not edited`.
- **Signed:** manifest `content_id` is Ed25519-signed; the signature records the **actual**
  signing pubkey and the verify path. Detached signature in `dataset.sig`.
- **Honesty note:** this is **measurement data**, never a ranking of vendors, and never a
  certification of any model.

### What makes it "signed"
Per the estate canonical form (KEY-CONTINUITY rule 3):

```
canonical  = json.dumps(body, sort_keys=True, separators=(",",":"), ensure_ascii=False)
content_id = sha256(canonical)
sig        = Ed25519(content_id bytes)
```

A licensee verifies by recomputing the canonical body, deriving `content_id`, and checking the
signature with the recorded pubkey.

---

## 5. What we are (and are not) claiming — the honest boundaries

- We measure governance characteristics; we do **not** certify a model is "safe"/"compliant".
  (`not_a_certification: true`.)
- No ranked party pays us; the data buyer is not the ranked party.
- No banned internal codenames appear in any public surface. This document uses none of them.
- The signing key never travels: it lives on the signing node; the public key is published.
- Corrections are appended, never edited. History is append-only.

---

## 6. Next steps (doctrine-aligned)

1. Serve the signed dataset (`dataset.json` + `gspc-axis.jsonl` + `dataset.sig`) from the
   front-end, with a downloadable link and a **verify script**.
2. Add a **data-licensing** entry to the legal surface (Terms / Pricing) — the only place pricing
   lives. No pricing on the dataset itself.
3. (Owner-gated) Reconcile the signing identity — see the finding below.

---

## Flag — signing identity discrepancy (must reconcile before publishing as "estate-signed")

The signing node's current key derives public key `8f9a00a2…`
(`j5oAooz8duNgKf6AXz5CGVj019QsTxFIZZGKEAExORI=`), which matches **neither**:
- the published estate-chain identity referenced in `KEY-CONTINUITY.md` (`33472e02…` `M0cuAmhx2yDNvZnn…`), nor
- any of the four keys currently in the live `did:web:csoai.org` document.

The key file mtime (2026-08-20) is *after* the Aug-16 fleet chain that used the published
identity, so this is most likely an unrecorded key rotation (missing the required
`superseded-by` pointer per KEY-CONTINUITY rule 4). **Action:** do not publicly label the
dataset as signed with the canonical estate-chain identity until this is reconciled. The
dataset above is signed with the **actual** on-pod key and records that key's true pubkey, so
verification is still sound — but it is a **pod identity**, not yet the published estate identity.
