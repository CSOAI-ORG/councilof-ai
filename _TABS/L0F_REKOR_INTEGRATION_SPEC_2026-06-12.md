# 🪶 L0-F Rekor Integration — Spec v0.1
**Date:** 2026-06-12
**Lane:** main session (CSOAI peer wires; main writes spec)
**Status:** SPEC — to be reviewed
**Target merge:** after PR-B.2 (the /sign gate ships) and PR-B.3 (the SQLite audit ledger lands)
**Depends on:** MEOK-COUNCIL audit ledger (PR-B.3 SQLite), pynacl in requirements.txt (PR-B.1), MEOK_COUNCIL_MASTER_SEED in production env

---

## 0. The one-line promise

Every audit event in the MEOK-COUNCIL audit ledger gets a **Rekor transparency-log entry** on top. The local SQLite HMAC chain stays as the canonical anchor; Rekor adds a **public, vendor-neutral, append-only proof of existence** that anyone can verify without trusting MEOK. The chain becomes non-repudiable at the public-log level, not just the private-ledger level.

**Why Rekor specifically:** free, vendor-neutral (Linux Foundation / Google / Sigstore / Red Hat / RSA), public, append-only, SLSA-3 attestable, no smart contract, ties to existing sigstore primitives already in the watermarking MCP. ~0.5KB per entry, no per-entry cost.

---

## 1. The current state (verified just now)

- `meok-attestation-api` ships `/api/audit` — HMAC-chained, in-memory + SQLite (PR-B.3), no public anchor.
- The watermarking MCP and meok-attestation-api both have sigstore-style signature primitives in their code (the /v1/health PR has the Ed25519 + pubkey_hex shape; the watermarking MCP's HMAC-signed attestations are sigstore-compatible).
- A production Rekor instance is reachable at `https://rekor.sigstore.dev` (the public, free, Linux-Foundation-run instance).
- The substrate signs every cert with `MEOK_ATTESTATION_SIGNING_KEY` (Ed25519), so the keys are sigstore-compatible out of the box.

What's missing:
- The 1-line POST that mirrors each audit event into Rekor
- The Rekor entry inclusion proof that the auditor can fetch from `rekor.sigstore.dev/api/v1/log/entries`
- The verifier step that confirms the local HMAC chain hash matches the Rekor entry's body

---

## 2. The 4 new endpoints (additive on top of PR-A's 4 + PR-B's 2)

### 2.1 `POST /api/audit/rekor/publish` — mirror an event to Rekor

**Request body:** same as `/api/audit`'s event, plus one new field:
```json
{
  "event": {
    "id": "uuid",
    "ts": "2026-06-12T13:00:00Z",
    "action": "watchdog_cert_issuance | council_decision | sign_gate | ...",
    "principal": "...",
    "cert_id": "..." | null,
    "prev_hash": "sha256-...",
    "hash": "sha256-...",
    "ledger_index": 12
  },
  "signature": "ed25519:base64-of-event-signature"
}
```

**The flow inside /audit/rekor/publish:**
1. Validate `signature` against MEOK_ATTESTATION_SIGNING_KEY (existing)
2. Validate `event.hash` matches `prev_hash` of the next event in the local chain (existing /api/audit logic)
3. Build a canonical Rekor entry payload (the event minus internal fields, signed by the same key)
4. POST to `https://rekor.sigstore.dev/api/v1/log/entries` with the canonical payload + signature
5. Rekor returns an entry UUID + a Signed Entry Timestamp (SET) + a base64 inclusion proof
6. Store the Rekor entry UUID + SET in a new `audit.rekor_entries` table (added in PR-B.3's SQLite schema)
7. Return the entry UUID + the Rekor URL to the caller

**Response (200):**
```json
{
  "rekor_entry_uuid": "uuid",
  "rekor_log_index": 12345,
  "rekor_url": "https://rekor.sigstore.dev/api/v1/log/entries?uuid=...",
  "inclusion_proof_b64": "...",
  "signed_entry_timestamp_b64": "...",
  "event_hash": "sha256-..."
}
```

**Response (502 — Rekor unreachable):**
```json
{
  "error": "rekor_unreachable",
  "hint": "Local audit ledger committed the event. Rekor mirror failed. /api/audit/verify will retry on next read; the chain is still locally valid.",
  "event_hash": "sha256-...",
  "ledger_index": 12
}
```

**Critical invariant:** the local audit event is committed **before** the Rekor POST. Rekor is a public mirror, not a precondition. If Rekor is down, the local chain stays consistent; the next read retries the mirror.

### 2.2 `GET /api/audit/rekor/{event_hash}` — fetch the Rekor entry for a local event

**Response (200):**
```json
{
  "event_hash": "sha256-...",
  "rekor_entry_uuid": "uuid",
  "rekor_log_index": 12345,
  "rekor_url": "...",
  "inclusion_proof_b64": "...",
  "signed_entry_timestamp_b64": "...",
  "fetched_at_utc": "..."
}
```

**Response (404 — not yet mirrored):**
```json
{
  "error": "not_yet_mirrored",
  "hint": "Event was committed locally but the Rekor POST failed. /api/audit/retry-rekor will re-attempt.",
  "event_hash": "sha256-..."
}
```

### 2.3 `POST /api/audit/retry-rekor` — retry failed mirrors

**Request body:** `{ "since_utc": "...", "limit": 100 }` — batch retry events that committed locally but failed to mirror to Rekor.

**Response (200):**
```json
{
  "retried": 47,
  "succeeded": 42,
  "failed": 5,
  "failures": [
    { "event_hash": "sha256-...", "error": "rekor_unreachable" }
  ]
}
```

This endpoint exists because Rekor can be transiently down. A nightly cron (or the substrate's self-healing loop) calls it to catch up.

### 2.4 `GET /api/audit/verify/{cert_id}` — auditor's chain view

**Response (200):**
```json
{
  "cert_id": "...",
  "chain": [
    {
      "ledger_index": 12,
      "event_hash": "sha256-...",
      "rekor_entry_uuid": "uuid",
      "rekor_log_index": 12345,
      "rekor_url": "...",
      "chain_intact": true
    },
    ...
  ],
  "summary": {
    "total_events": 5,
    "all_mirrored": true,
    "all_chain_intact": true,
    "earliest_event_ts": "2026-06-12T12:00:00Z",
    "latest_event_ts": "2026-06-12T13:00:00Z"
  }
}
```

This is the **auditor's single URL** for the Council's evidence: paste a cert_id, get the full chain with Rekor proofs, verify offline. The Sovereign Council Globe's evidence panel points here.

---

## 3. The 2 invariants the integration must hold

1. **The local audit chain is the source of truth. Rekor is a mirror.** If Rekor is down, the local chain stays valid. If Rekor is up but the local chain is broken, /api/audit/verify fails locally first; Rekor is never trusted as a stand-in for the local chain.
2. **The event hash is the join key.** A Rekor entry's `body` field contains the canonical event JSON. The local `event_hash` (SHA-256 of the same canonical JSON) is the join key. A mismatched hash = a Rekor entry that doesn't correspond to a local event = a phantom or a corruption. The verifier rejects.

---

## 4. The 3 PRs to ship (smaller than PR-A or PR-B)

### PR-F.1: Rekor mirror + retries (1 day)
- Implement `POST /api/audit/rekor/publish` (~80 lines, calls rekor.sigstore.dev)
- Implement `GET /api/audit/rekor/{event_hash}` (~30 lines)
- Implement `POST /api/audit/retry-rekor` (~50 lines, the cron-friendly batch retry)
- Modify `/api/audit` to enqueue a Rekor POST after each commit (fire-and-forget, in-memory queue, retry on failure)
- Add `audit.rekor_entries` SQLite table (4 columns: event_hash PK, rekor_entry_uuid, rekor_log_index, mirrored_at_utc)
- Tests: 5-6 tests including the Rekor-down case (the chain must still commit locally)

### PR-F.2: Verifier endpoint + inclusion proof (1 day)
- Implement `GET /api/audit/verify/{cert_id}` (~50 lines, joins local events to Rekor entries)
- Add the inclusion proof verification (Rekor's `getInclusionProof` endpoint, base64-decoded, verified against the local log index)
- Tests: 4-5 tests including the "local chain OK but Rekor unreachable" case

### PR-F.3: Rekor self-healing cron (1 hour, fits in PR-F.1)
- A `launchd` job (Mac) / `cron` job (Linux) / Vercel cron (production) that calls `POST /api/audit/retry-rekor` every 6 hours
- Catches transient Rekor outages without manual intervention
- The cron logs its retry counts to a dedicated table; anomalies alert

---

## 5. The 3 open decisions for Nick (carry from PR-A + new)

1. **Rekor instance:** `rekor.sigstore.dev` (the public, free, Linux-Foundation-run instance) vs a self-hosted Rekor (more ops surface, full control, ties to our sovereignty story). My rec: **`rekor.sigstore.dev` for v1**, self-host in v2 if the data-sovereignty story requires it. The public instance is run by the same Sigstore community that maintains cosign + fulcio + the SLSA-3 attestation tooling. Free, no smart contract, no vendor lock-in.
2. **Mirror timing:** synchronous (block the /api/audit commit on the Rekor POST) vs async (commit locally, enqueue Rekor POST, retry on failure). My rec: **async** — the local chain is the source of truth, Rekor is a mirror, the verifier step is what the auditor cares about. Sync adds latency to every audit write for a public-log dependency. Async keeps /api/audit fast.
3. **Self-healing cron host:** Vercel cron (production) vs a launchd job on the VM (development) vs both. My rec: **Vercel cron for production + a `retry-rekor` endpoint that anyone can hit** (no auth, idempotent, rate-limited). The endpoint is the API; the cron is just one caller.

---

## 6. The architecture

```
CSOAI engine (meok-attestation-api)         Rekor (sigstore.dev)
┌────────────────────────────┐              ┌──────────────────────┐
│  /api/audit (POST)          │── commit ───▶│  local SQLite HMAC    │
│  └── fire-and-forget ───────│              │  chain (canonical)    │
│       └── Rekor POST ───────│── mirror ──▶│                       │
│                             │              │  audit.rekor_entries  │
│  /api/audit/rekor/publish   │              │  (event_hash → uuid)  │
│  /api/audit/rekor/{hash}    │              │                       │
│  /api/audit/retry-rekor     │── batch ───▶│  retry queue          │
│  /api/audit/verify/{cert}   │              │                       │
│                             │              └──────────────────────┘
│  local HMAC chain            │
│  (PR-B.3 SQLite, source     │              ┌──────────────────────┐
│   of truth)                 │              │  Rekor (public)       │
└────────────────────────────┘              │  rekor.sigstore.dev   │
                                            │  append-only log      │
                                            └──────────────────────┘
```

---

## 7. The audit narrative

**Before L0-F:** "Every audit event is in our local HMAC chain. You can verify by asking us."

**After L0-F:** "Every audit event is in our local HMAC chain AND in the public Sigstore Rekor transparency log. You can verify by asking us OR by querying rekor.sigstore.dev directly. The local chain is the source of truth; Rekor is the non-repudiable public proof."

The L0-F integration is the difference between "trust our ledger" and "verify on the public log." After PR-F ships, every Council decision and every cert issuance has a public, vendor-neutral, append-only proof of existence that lives outside our infrastructure.

---

## 8. Spec checksum (v0.1)

- 4 new endpoints (publish, fetch by hash, batch retry, verifier)
- 2 integration invariants (local = source of truth, event_hash = join key)
- 3 PRs (F.1 mirror + retries, F.2 verifier + inclusion proof, F.3 self-healing cron)
- 3 open decisions for Nick (Rekor instance, sync vs async, self-healing host)

Estimated effort: 2 days for F.1 + F.2, 1 hour for F.3.

— Mavis main session, 2026-06-12 13:50 UTC
