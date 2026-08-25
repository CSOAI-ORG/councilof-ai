# RECEIPT-SPEC-0.1 — CSOAI Agent Measurement Card

**Status:** Published · **Issuer:** CSOAI Ltd (UK 16939677) · **Media type:** `csoai.measurement-card/0.1`

**Doctrine:** Measurement, not certification. A receipt attests what was observed on a frozen instrument at a stated time — not conformity, safety, or legal compliance.

## 1. Purpose

Define the public, stranger-verifiable format for AI **measurement receipts** (measurement cards). Whoever publishes the format others adopt owns the field. This spec is grounded in the live councilof.ai estate — not a future promise.

## 2. Media type

```
Content-Type: application/vnd.csoai.measurement-card+json; version=0.1
Schema:       https://councilof.ai/.well-known/schemas/agent-measurement-card.schema.json
SCITT type:   csoai.measurement-card/0.1 (see /.well-known/scitt.json)
```

## 3. Canonical envelope

### 3.1 Size target

~3KB JSON. Small enough to email, attach to a tender, or store in a compliance folder.

### 3.2 Required fields

| Field | Type | Role |
|-------|------|------|
| `schema` | string | Always `csoai.measurement-card/0.1` |
| `content_id` | string | SHA-256 hex of canonical body |
| `signature` | string | Ed25519 over signed payload |
| `signer` | string | `did:web:csoai.org#card-attestation-1` (typical) |
| `issuer` | object | `{ name, did, companies_house }` |
| `measured_on` | ISO-8601 UTC | When the run completed |
| `subject` | object | System under measurement |
| `scores` | array | Per-axis score vector |

### 3.3 Optional fields

`instrument`, `axes_summary`, `prev_chain`, `limitations`, `verify`, `timestamp_authority: "none"`

## 4. Canonicalization (binding)

Identical to the live verifier at `client/src/lib/recordVerify.ts`:

1. Parse JSON.
2. Remove `signature` and `content_id` from the body for hash envelope **B**; for envelope **A**, retain `signature` in body before hash (carder generation).
3. Recursively sort all object keys lexicographically.
4. Serialize with no whitespace: `JSON.stringify` equivalent to Python `json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True)`.
5. `content_id = SHA-256(canonical_bytes)` as lowercase hex.

**Verifiers MUST accept both envelope generations** (A and B) — valid cards may match either.

## 5. Signature

- Algorithm: **Ed25519** (today). ML-DSA-65 is roadmap only — named in did.json when shipped, never silently substituted.
- Keys: published at `https://csoai.org/.well-known/did.json`
- Typical signer: `did:web:csoai.org#card-attestation-1` — 3KB cards, corrections ledger, MANIFEST chain
- Signed bytes: canonical JSON of `{ ...body, content_id }` (see live verifier)

## 6. Score vector & axes

Each `scores[]` entry:

```json
{
  "axis": "governance",
  "status": "MEASURED",
  "accuracy": 0.700,
  "n": 237,
  "interval": [0.639, 0.755],
  "separation": "SEPARATED",
  "separation_p": 0.0086,
  "leader": "council specialist:governance-v3"
}
```

**Axes summary label:** honest count string, e.g. `"13 measured of 14"` — never inflate. Empty cells are `UNMEASURED` with reason, not hidden.

## 7. Three-path verification

| Path | How | Trust model |
|------|-----|-------------|
| **1. Browser** | Paste at https://councilof.ai/gspc-verify | Client-side WebCrypto; record never leaves machine |
| **2. CLI** | Fetch did.json → recompute hash → verify Ed25519 | Stranger walk; no CSOAI account |
| **3. SCITT receipt** | Register statement; receive SCRAPI receipt (planned) | Evidence of registration, not certification |

## 8. Independence doctrine

Per Firewall Charter:

- We **measure**; we never fix what we measure.
- We do **not** certify, accredit, or issue conformity marks.
- Corrections are **appended** to `/api/corrections`, never silently edited.
- `timestamp_authority` is honestly `"none"` until OTS/RFC-3161 is wired.

## 9. Standards alignment

| Standard | Alignment |
|----------|-----------|
| RFC 9943 (SCITT) | Statement + receipt model; profile at `/.well-known/scitt.json` |
| RFC 9942 / WEXP | Web evidence export; verify-walk compatible |
| JCS (RFC 8785) | Canonical JSON style (recursive sort_keys) |
| EU AI Act Art. 50 | Transparency duties — buyer-side evidence, not NB certification |
| SB 315 / state AI laws | Published measurement for deployer due diligence |

## 10. Example (illustrative — not a live card)

```json
{
  "schema": "csoai.measurement-card/0.1",
  "content_id": "abc123…",
  "signature": "…",
  "signer": "did:web:csoai.org#card-attestation-1",
  "issuer": {
    "name": "Council of AI (CSOAI Ltd)",
    "did": "did:web:csoai.org",
    "companies_house": "16939677"
  },
  "measured_on": "2026-08-23T00:00:00Z",
  "subject": { "system_id": "example-system-001" },
  "axes_summary": { "total_slots": 14, "measured": 13, "label": "13 measured of 14" },
  "scores": [{ "axis": "governance", "status": "MEASURED", "n": 237, "accuracy": 0.7 }],
  "timestamp_authority": "none",
  "doctrine": "measurement-not-certification",
  "verify": "https://councilof.ai/gspc-verify"
}
```

## 11. Related surfaces

- JSON Schema: `/.well-known/schemas/agent-measurement-card.schema.json`
- SCITT profile: `/.well-known/scitt.json`
- Live board: `GET /api/gspc`
- Agent runbook: `/agent-runbook`
- Verify walk: `/verify-walk.md`

## 12. XRPL Memo pointer (testnet — frozen v0.1)

**Status:** Frozen for Stage 2 testnet publishers. A Memo is a **hash pointer** to an off-chain signed measurement card — not a token, NFT, ownership claim, or score.

### 12.1 Memo type

```
MemoType: csoai.attest-pointer/0.1
```

### 12.2 MemoData (JSON, UTF-8, keys sorted lexicographically before hash)

| Field | Required | Role |
|-------|----------|------|
| `schema` | yes | Always `csoai.xrpl-memo-pointer/0.1` |
| `content_id` | yes | SHA-256 hex of the signed measurement card body (same as RECEIPT-SPEC §4) |
| `subject` | yes | `{ "chain": "xrpl", "issuer": "<r-address>", "currency?": "<ISO code or hex>" }` — public artifact only |
| `card_uri` | yes | HTTPS URL where the full signed card JSON is fetchable |
| `network` | yes | `testnet` until counsel + custody gates clear for mainnet |
| `register` | yes | `MEASURED` \| `UNMEASURED` \| `REPORTED` — honest state; **never invent scores** |
| `as_of` | yes | ISO-8601 UTC date the pointer was published |
| `doctrine` | yes | `pointer-only` — attestation ≠ tokenization ≠ ownership |

**Forbidden in MemoData:** `measured_score`, `accuracy`, `n`, `interval`, `aum`, `tvl`, or any numeric grade not present on the linked signed card.

### 12.3 Verification

1. Fetch `card_uri` → verify Ed25519 + `content_id` per §§4–5.
2. Confirm `content_id` in MemoData matches the verified card.
3. Treat the Memo as provenance of *our opinion pointer* — not issuer endorsement.

Stage 2 scope: XRPL Devnet / testnet only. Mainnet attach requires custody (`CSOAI_KEY_CUSTODY`) + counsel gates.

## 13. Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-08-23 | Initial public spec — RECEIPT-SPEC-0.1 |
| 0.1.1 | 2026-08-25 | §12 XRPL Memo pointer format frozen (testnet) |
