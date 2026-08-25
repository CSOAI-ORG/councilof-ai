# RECEIPT_INTEROP — mapping the signed-receipt moat into the standards stack

**Doc ID:** `csoai-receipt-interop-v1` · **Revision:** 2026-08-23
**Status:** interop mapping — the signed receipt, mapped into in-toto/DSSE/Sigstore/C2PA so we are
*the measurement predicate* in the standard stack, not a proprietary island. Doctrine: nothing
below claims a capability we have not verified; attestations are measurement evidence, never a
certification; no banned codenames; free access honest.

---

## 0. Why interop is the real threat/moat

New entrants (in-toto, Sigstore, C2PA, and fresh ones like the supply-chain attestation work) are
**standardising** the attestation layer. If our signed receipt only verifies against `did:web:csoai.org`
in our own tooling, we become a proprietary island that a standards-riding market ignores. The
move: keep our Ed25519 + did:web spine, but **express the same measurement as a standard predicate**
(in-toto Statement, DSSE envelope, C2PA claim) so standard tooling can consume + verify it.

The thesis: **the measurement content is ours (the live GSPC board score — cite totals.public_count; 14 quotable slots); the envelope is standard.**

---

## 1. Our current signed receipt (verified this session)

Canonical form (estate KEY-CONTINUITY rule 3):
```
canonical  = json.dumps(body, sort_keys=True, separators=(",",":"), ensure_ascii=False)
content_id = sha256(canonical)
sig        = Ed25519(content_id bytes)   # key: did:web:csoai.org#<method>, pubkey published
```
A verifier recomputes the canonical body, derives `content_id`, and checks the Ed25519 signature
against a key resolved from `did:web:csoai.org`. **Verified E2E** on the live signed per-axis Elo
leaderboard (content_id matches + signature verifies).

## 2. The four standard envelopes (mapping)

| Standard | Envelope | Our mapping | Verification |
|---|---|---|---|
| **in-toto Statement** | `{"_type":"https://in-toto.io/Statement/v1","subject":[...],"predicateType":..., "predicate":{...}}` | `subject` = the measured artifact (model / dataset content_id); `predicateType` = `csoai.gspc-measurement/0.1`; `predicate` = the per-axis Elo/score + CI (our measurement) | in-toto tooling + our did:web key as the signer |
| **DSSE** | `{"payloadType":..., "payload":b64(canonical), "signatures":[{"keyid","sig"}]}` | `payload` = our canonical body; `payloadType` = `application/vnd.csoai.measurement+json`; `signatures` = the Ed25519 sig + keyid (did:web method) | `dsse-verify` with the did:web pubkey |
| **Sigstore** (COSIGN) | `cosign attest` envelope (DSSE-based) | use our measurement as the attestation payload with the estate key | `cosign verify-attestation` (or a signed bundle) |
| **C2PA** | JUMBF claim with `ed25519` signer | embed our measurement predicate as a C2PA claim; verify via the C2PA manifest | C2PA tooling (c2patool) |

### The honest boundary
- We **do not** claim our Ed25519 key is a C2PA/CAI-registered trust anchor (that is owner-gated).
- We **do** claim: the same measurement body + Ed25519 signature, expressed in a standard envelope,
  verifiable with standard tooling against our published did:web key.
- The **measurement** (14-slot GSPC board; cite live public_count) is ours and is not a certification; the **envelope** is standard.

## 3. The predicate (what we actually measure — our value)

`csoai.gspc-measurement/0.1` predicate carries:
- `axes`: the GSPC axis registry (gov, care, jail, … — 14 quotable board slots; cite live public_count; do not invent 22 axes)
- `per_axis`: { axis: { score, n, ci, separation } } — every score with n + CI
- `register`: "MEASURED" (deterministic) or "REPORTED" (third-party context, cited) — never a
  certification
- `provenance`: the signed per-axis Elo reference `content_id` + the live round feed source
- `not_a_certification`: true

This is the **measurement predicate**: standard tooling can carry it, but the value (per-domain,
non-gameable, reproducible, n + CI on every score) is uniquely ours.

## 4. Reference implementation plan (what to build next)

1. `emit_dsse.py` — wrap a measurement body in a DSSE envelope, sign with the estate key, verify
   with the did:web pubkey (pure python, `dsse` + `cryptography`; no infra).
2. `emit_intoto.py` — wrap the same measurement as an in-toto Statement (subject = content_id).
3. README: one page showing "same measurement, four envelopes, same key" — the interop evidence.
4. (Owner-gated) register the estate key as a Sigstore/C2PA signer identity; CAI/C2PA trust list.

## 5. What we do NOT claim (doctrine lines)

- No certification powers; measurement evidence only.
- No fake registry/KV bound (if a feature needs one and isn't bound, it says so — the Article 50
  endpoint's honest `stored: false` discipline).
- `proofof.ai` dead endpoint (Vercel billing block) is never linked — verify URL points at the live
  domain only.
- No banned codenames; no fabricated capability.
