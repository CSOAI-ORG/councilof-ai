# 🔏 L0-G PBFT /sign Gate — Spec v0.1 (PR-B)
**Date:** 2026-06-12
**Lane:** CSOAI engine (main session drafting, CSOAI peer wiring)
**Status:** SPEC — to be reviewed before implementation
**Target merge:** after PR-A + pynacl requirements.txt follow-up
**Depends on:** PR-A (commit `07e018d` on meok main), MEOK_COUNCIL_MASTER_SEED in env, pynacl in meok-attestation-api requirements.txt

---

## 0. The one-line promise

Today, `meok-attestation-api` `/sign` issues a SIGIL signature for **any caller with a valid API key**. After this PR, `/sign` requires a **recent, approved council decision** (PBFT 22-of-36) before the signature fires. The substrate becomes the bottleneck for issuance; the API key becomes the bottleneck for identity; together they produce **PBFT-mediated, individually-verifiable** Watchdog Certificates.

**The non-repudiation upgrade:** every cert issued after this PR proves (1) the issuer was an authenticated agent (API key check, unchanged) AND (2) a 22-of-36 council majority approved the issuance (PBFT gate, new). The auditor can verify both with no extra trust.

---

## 1. The current state (verified just now)

- `meok-attestation-api` ships `POST /sign` (Ed25519 SIGIL) and `GET /v/{id}` (public verify) — both live.
- `meok-attestation-api` ships `api/_audit_ledger.py` — HMAC-chained, in-memory, no persistence.
- `MEOK_ATTESTATION_SIGNING_KEY` is the env var that backs `/sign`.
- The `/sign` handler validates the API key, signs the payload, returns the cert, and writes an event to `/api/audit` (in-memory).
- **No council gate.** A valid API key is sufficient.

What's missing:
- The 22-of-36 council gate (the PR-A substrate is the new check)
- The persistence of `/api/audit` events (in-memory → Postgres/SQLite/LMDB)
- The public verify surface that doesn't require an API key (already exists at `/v/{id}`, just needs the audit chain to be queryable)

---

## 2. The 3 new endpoints (additive on top of PR-A's 4)

### 2.1 `POST /api/council/round/open` (already in PR-A, repeated here for clarity)

- Opens a new PBFT round for a cert issuance
- `subject: { type: "watchdog_cert_issuance", ref: "<cert_id>" }` — the cert_id is the round's identity
- `primary` is auto-assigned (deterministic: `i = (round_number mod 36)`)
- Returns `{round_id, primary_node_id, opened_at_utc, closes_at_utc, subject}`

### 2.2 `POST /api/council/vote` (PR-A — substrate)

- 22-of-36 nodes send their signed ballots
- Substrate runs the 4-phase PBFT (pre-prepare → prepare → commit → committed)
- Returns the standard PR-A ballot response

### 2.3 `GET /api/council/decisions/{id}` (PR-A — substrate)

- Returns the final decision with `commit_proof.set_hash`
- **This is the gate the /sign handler reads from.**

### 2.4 NEW: `POST /sign_gate` — PBFT-mediated issuance (the load-bearing one)

**Request body:** same as the existing `POST /sign`, plus one new field:
```json
{
  "payload": { "...": "..." },
  "signature": "ed25519:base64-of-caller-signature",
  "principal": "did:web:csoai.org:users:<user_id>",
  "expected_decision_id": "<round_id_from_council_vote>",
  "tier": "free" | "pro" | "team" | "enterprise"
}
```

**The flow inside /sign_gate:**
1. Validate `signature` against `principal`'s pubkey (existing)
2. Validate `tier` against the principal's billing state (existing)
3. **NEW: validate `expected_decision_id`** by reading from BFTCouncil.decision_history:
   - Decision must exist
   - `outcome == "approved"`
   - `subject.type == "watchdog_cert_issuance"`
   - `subject.ref == expected_cert_id` (or matches a pattern the caller is authorized for)
   - `committed_at_utc` is within the last 60 minutes (the 60min-from-/sign TTL from the L0G spec)
   - `commit_proof.set_hash` is present and well-formed
4. **NEW: validate the 22-of-36 proof** — verify that at least 22 of the 36 commit_proof.ballot_ids have valid per-node Ed25519 signatures
5. **NEW: anchor the cert to the council decision** — the cert's `payload.council_decision_id` field is set to `expected_decision_id`; the cert's `payload.council_commit_proof` is a copy of the decision's commit_proof
6. **NEW: append a /sign event to the persistent audit ledger** — distinct from the in-memory `/api/audit`, this is the Postgres/SQLite/LMDB-backed ledger that survives restarts
7. Sign the cert with `MEOK_ATTESTATION_SIGNING_KEY` (existing)
8. Return the cert with the council decision anchored in it

**Response (200):** the same shape as existing `/sign`, plus:
```json
{
  "cert": {
    "payload": { "...", "council_decision_id": "...", "council_commit_proof": {...} },
    "signature": "...",
    "council_anchor": {
      "decision_id": "...",
      "commit_proof": { "ballot_ids": [...], "set_hash": "..." },
      "approved_at_utc": "..."
    }
  }
}
```

**Response (409 — no decision or expired):**
```json
{
  "error": "no_recent_council_decision",
  "expected_decision_id": "...",
  "hint": "Open a council round with POST /api/council/round/open and reach 22-of-36 commit before retrying. Decisions expire 60min after /sign call."
}
```

**Response (403 — bad sig or tier):** existing behavior.

**Response (503 — substrate unreachable):** existing behavior + new hint:
```json
{
  "error": "substrate_unreachable",
  "hint": "BFTCouncil.propose_decision() could not be invoked. Council gate cannot be evaluated. Try again when substrate is back."
}
```

### 2.5 NEW: `GET /api/council/decisions` (PR-A — history endpoint)

- Lists recent decisions (paged, read-only, no auth)
- The auditor-facing endpoint that proves the council is real and decisions are happening
- This is the "trust anchor" surface for anyone checking the substrate's liveness

### 2.6 NEW: `GET /sign/{cert_id}/chain` — auditor view

- Returns the full chain from the cert to the council decision to the per-node ballots
- The "single URL proves everything" surface for the Sovereign Council Globe's evidence panel
- This is what makes a Watchdog Certificate actually mean something: anyone can follow the chain from a cert to the 22 nodes that approved its issuance

---

## 3. The 2 invariants the integration must hold

1. **The /sign gate is not bypassable.** Every code path that produces a signed cert must go through /sign_gate. The existing /sign endpoint becomes a thin alias for /sign_gate (so existing callers don't break, but every cert still goes through the gate). A grep at PR review time: `grep -r "sign_attestation" meok-attestation-api/api/` — there should be exactly one definition, in /sign_gate.

2. **The /api/audit ledger and the /sign_gate ledger share the hash chain.** When a cert is signed via /sign_gate, the audit event written to /api/audit (the in-memory chain) and the persistent ledger entry (Postgres/SQLite/LMDB) carry the same chain hash. The 60min TTL on the council decision is anchored to the same hash. One chain, one source of truth.

---

## 4. The 3 PRs to ship PR-B (smaller than PR-A)

### PR-B.1: pynacl in requirements.txt (5 min, do first)
- Add `pynacl>=1.5.0` to `meok-attestation-api/requirements.txt`
- Verify: `pip install -r requirements.txt && python -c "from nacl.signing import SigningKey; print('OK')"`
- This is the prerequisite for PR-A's hard-fail-at-module-load to actually pass on Vercel

### PR-B.2: /sign_gate + council anchor (1-2 days)
- Implement /sign_gate in `meok-attestation-api/api/index.py` (additive on /sign, <100 lines)
- Add the 22-of-36 proof verification (calls into PR-A's BFTCouncil.decision_history)
- Add the audit ledger append (still in-memory, but with the new event type `council_anchored_sign`)
- Make /sign a thin alias for /sign_gate (so existing callers don't break)
- Tests in `meok-attestation-api/tests/test_sign_gate.py` — 7-8 tests:
  - Happy path: 22-of-36 council decision, /sign_gate returns cert with council_anchor
  - 21-of-36: rejected (below 2f+1)
  - 22-of-36 but outcome=rejected: rejected
  - No decision_id provided: rejected with 409 + no_recent_council_decision
  - Expired decision (>60min old): rejected
  - Wrong subject.ref: rejected (decision was for a different cert)
  - Substrate unreachable: rejected with 503 + substrate_unreachable
  - The auditor chain: GET /sign/{cert_id}/chain returns the full path

### PR-B.3: audit ledger persistence (1 day, smaller scope than it sounds)
- Add a SQLite-backed ledger adapter in `meok-attestation-api/api/_audit_ledger.py`
- Keep the in-memory HMAC chain as the canonical anchor (SQLite just persists it)
- Migration: in-memory events get flushed to SQLite on shutdown
- The follow-up to LMDB/Postgres is a 2027 effort, SQLite is the v1 floor

---

## 5. The 2 carry-over items from PR-A (not in this PR)

- **Inner+outer packaging dedupe** — outer `meok/council/` + inner `meok/meok/council/` are separate physical copies. 1-day follow-up.
- **Vercel routes config** — MEOK ONE owns. Once PR-B.2 lands, the /sign_gate endpoint needs to be exposed in the meok-attestation-api vercel.json. MEOK ONE will do it.

---

## 6. The 4 open decisions for Nick (carry from PR-A + new)

1. **Audit ledger storage:** SQLite (peer rec, my rec) vs Postgres (overkill for v1, justified for scale) vs LMDB (fastest, less tooling). My rec: **SQLite** — single file, restart-safe, no external service. Postgres in 2027 if scale demands.
2. **pynacl hard-fail location:** module-top import (per PR-A's pattern) — should this be at /sign_gate import time, at /sign call time, or at server boot? My rec: **server boot** — fails fast, doesn't add latency to /sign.
3. **/sign vs /sign_gate deprecation:** keep both (alias), deprecate /sign in favor of /sign_gate (warn log), or hard-rename? My rec: **keep /sign as alias, log a deprecation warning on every call.** Existing callers don't break; new callers see /sign_gate in docs.
4. **/sign_gate auth model:** Same as /sign (API key) or stricter (Pro/Team only)? My rec: **same as /sign** — the council gate is the new strictness layer, no need to add a tier gate on top. Free tier gets council-mediated certs, which is the whole point.

---

## 7. Spec checksum (v0.1)

- 1 new endpoint (/sign_gate) + 2 new endpoints pulled from PR-A (decisions + decisions history) + 1 new auditor endpoint (/sign/{cert_id}/chain)
- 8-step /sign_gate flow (5 NEW + 3 existing reused)
- 2 integration invariants
- 3 PRs (B.1, B.2, B.3)
- 4 open decisions for Nick

Estimated effort: 1-2 days for PR-B.2 (the main work), 5 min for B.1, 1 day for B.3.

---

## 8. The audit narrative

**Before PR-B:** "We sign certs with an Ed25519 key. Anyone with the pubkey can verify."

**After PR-B:** "We sign certs with an Ed25519 key. The cert contains a `council_decision_id` and `council_commit_proof.set_hash`. Anyone can call `GET /api/council/decisions/{id}` to see the 22-of-36 PBFT decision. Anyone can call `GET /sign/{cert_id}/chain` to see the full path from cert to decision to per-node ballot. The substrate is the bottleneck for issuance; the API key is the bottleneck for identity; the chain is the trust anchor."

The /sign gate is the difference between "we sign certs" and "we sign certs that the council approved." The post-PR-B pitch is the post-PR-B pitch.

— Mavis main session, 2026-06-12 13:00 UTC
