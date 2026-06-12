# 🏛️ L0-G PBFT Council Voting — Spec v0.1
**Date:** 2026-06-12
**Lane:** CSOAI engine (main session drafting, CSOAI peer wiring)
**Status:** SPEC — to be reviewed before implementation
**Target merge:** into PR #7's council floor (before Article 50 cliff, 50 days)

---

## 0. The one-line promise

Today, the council is **a real engine in a missing wrapper**. The Python `BFTCouncil` class in `meok/council/bft_council.py` (380 lines, 4 built-in tests) runs full PBFT (care score + SCL hard veto + expertise rings + bridge network + 22/33 threshold). What's missing is the HTTP API to call it from. After this PR, every council decision (Watchdog Certificate issuance, framework classification, cross-jurisdiction handoff) goes through `POST /api/council/vote` → `BFTCouncil.propose_decision()` → `GET /api/council/decisions/{id}` → `POST /sign` (gated on the decision). The substrate becomes externally addressable without losing the engine.

**Discovery (2026-06-12, CSOAI lane probe):** the engine is in `meok/council/bft_council.py`, 33 nodes, 11 domains, 22/33 threshold (f=10, 2f+1=22). The deployed substrate on `meok-api:3200` returns 36 nodes, 12 domains, 22/36 threshold (f=12, 2f+1=25). **Two different councils are live.** This is a real canonical question (§10) and the spec respects both until Nick picks one.

---

## 1. Wrap, don't redesign

The engine already exists in `meok/council/bft_council.py`:
- `class BFTCouncil` with `async def propose_decision(self, proposal: str, requester: str = "claude-code") -> dict`
- 33 hard-coded council nodes with `id`, `domain`, `care_weight` (real, no pubkey yet)
- DECISION_HISTORY_MAX = 1000
- Care veto enabled (auto-reject if care_score < 0.4)
- SCL hard veto: weapon, kill, destroy, attack, harm, exploit, manipulate, deceive, surveillance without consent
- Expertise rings: 132 expertise nodes (4 per council node)
- Bridge network: 55 bridges, conflict detection
- Threshold check: 22/33 (configurable in __init__)
- Returns: `{decision, vote_counts, domain_summary, expertise_summary, bridge_conflicts, average_care_score, consensus_reached, threshold, scl_violation, ...}`
- 4 built-in tests at the bottom: care-aligned proposal, SCL violation, Harvi-architecture proposal, low-care

What's missing:
- The HTTP wrapper (`POST /api/council/vote`, `GET /api/council/proposals`, `GET /api/council/decisions/{id}`, `GET /api/council/history`)
- Per-node Ed25519 signing (engine currently uses text-based care scoring, not crypto sigs — see §4 below for the signature add)
- The /sign gate (a Watchdog /sign only happens if a recent `decision=approved` exists in BFTCouncil.decision_history)

This PR adds the HTTP wrapper and the per-node signing. The engine doesn't move.

---

## 1a. The two-substrate question (the real fork)

| Source | Nodes | Domains | Threshold | Status | Engine |
|--------|-------|---------|-----------|--------|--------|
| `meok/council/bft_council.py` (LOCAL) | 33 | 11 | 22/33 | runs | full PBFT + care + SCL + expertise + bridges |
| `meok-api:3200/api/council/status` (DEPLOYED) | 36 | 12 | 22/36 | returns status only | none — decorative |

**Recommendation (my take):** canonical = `meok/council/bft_council.py`. Reasons:
- It's the engine that actually runs PBFT. Migrating it to meok-api is risk.
- It's tested (4 built-in tests, the care/SCL/harvi/low paths).
- The 11-domain count aligns with the substrate's actual domain structure (ethics, security, research, governance, care, technical, sovereign + 4 Harvi: hydro, biosensing, emergence, substrate).
- The deployed 36-node /api/council/status is a status mirror, not the engine. Pointing it at BFTCouncil is a 1-day refactor.

**Counter-argument:** the 36-node count has been the public face on csoai-platform's /council/* pages and the L0-G spec was written against 36. Reverting to 33 in the public UI is a small retraction that needs a clear note.

**Decision required from Nick** (see §10 Q1): which is canonical? The spec respects both (the threshold/2f+1 math is parameterized) but the implementation has to pick one for PR-A.

---

## 2. The 4 new endpoints

### 2.1 `POST /api/council/vote` — submit a per-node signed ballot

**Request body:**
```json
{
  "round_id": "uuid",
  "node_id": "ethics-alpha",
  "decision": "approve",
  "rationale_hash": "sha256-of-the-rationale-text",
  "ballot_signature": "ed25519:base64-of-the-signature",
  "timestamp_utc": "2026-06-12T11:00:00Z"
}
```

**Response (200):**
```json
{
  "ballot_id": "uuid",
  "round_id": "uuid",
  "node_id": "ethics-alpha",
  "phase": "pre-prepare",
  "received_at_utc": "...",
  "verifier": "ed25519 sig matches council pubkey for this node"
}
```

**Response (400 — duplicate ballot):** 400, body includes the existing ballot_id (idempotency).

**Response (403 — bad sig):** 403, body includes `{error: "ballot_signature does not match council pubkey for node_id"}`. Audit log gets a `chain_intact=true` entry marked "REJECTED" so the auditor sees the attempt.

### 2.2 `GET /api/council/proposals` — current open round

**Response (200):**
```json
{
  "round_id": "uuid",
  "phase": "pre-prepare | prepare | commit | committed | aborted",
  "opened_at_utc": "...",
  "closes_at_utc": "...",
  "subject": {
    "type": "watchdog_cert_issuance | framework_classification | cross_jurisdiction_handoff",
    "ref": "cert_id | framework | handoff_id"
  },
  "ballots_received": 12,
  "ballots_required_for_commit": 25,
  "ballots_approve": 9,
  "ballots_reject": 2,
  "ballots_abstain": 1,
  "participating_nodes": ["ethics-alpha", "ethics-beta", "..."]
}
```

**Response (404):** 404 when no open round. (NB: this means /council/proposals is null when idle, NOT a 500.)

### 2.3 `GET /api/council/decisions/{id}` — per-decision audit trail

**Response (200):**
```json
{
  "decision_id": "uuid",
  "round_id": "uuid",
  "phase": "committed",
  "subject": { "...": "..." },
  "outcome": "approved | rejected | aborted (timeout)",
  "votes": [
    {
      "node_id": "ethics-alpha",
      "decision": "approve",
      "rationale_hash": "sha256-...",
      "ballot_id": "uuid",
      "phase_received": "pre-prepare",
      "received_at_utc": "...",
      "ballot_signature": "ed25519:base64",
      "verifier": "OK"
    },
    ...
  ],
  "final_state": {
    "total_votes": 25,
    "approve": 22,
    "reject": 2,
    "abstain": 1,
    "quorum_reached_at_utc": "...",
    "committed_at_utc": "...",
    "commit_proof": {
      "type": "pbft_commit_set",
      "ballot_ids": ["uuid", "uuid", ...],
      "set_hash": "sha256-of-sorted-ballot-ids"
    }
  },
  "audit_anchor": {
    "audit_ledger_entry_id": "uuid",
    "audit_chain_hash": "sha256",
    "chain_intact": true
  }
}
```

**The `commit_proof` is the load-bearing field for auditors.** It proves that 25 distinct nodes (one of which is the primary) signed the same `set_hash` — that's the PBFT 2f+1 proof.

### 2.4 `GET /api/council/history` — recent decisions (paged, read-only)

**Query params:** `?limit=20&offset=0&since_utc=...&subject_type=...`

**Response (200):** `{decisions: [...], total, next_offset?}`

---

## 3. The 4 PBFT phases (the heart of the spec)

Standard PBFT, adapted to a 36-node substrate with a rotating primary.

### 3.1 `pre-prepare` — primary node proposes

- A primary node (rotated round-robin) opens a round by calling `POST /api/council/vote` with `decision=approve, phase=pre-prepare, node_id=<primary>`.
- The subject is the thing being decided (a cert, a framework classification, etc.).
- The substrate validates: (1) the primary is the correct node for this round, (2) the ballot signature matches the council pubkey for that node, (3) the rationale_hash is well-formed.
- If valid, the round is now in `pre-prepare` phase with the primary's ballot as the proposal. Audit log gets an `OPENED` event.

### 3.2 `prepare` — other nodes back the proposal

- Other council nodes call `POST /api/council/vote` with their own `decision` (approve/reject/abstain).
- Each `prepare` ballot is checked: same round_id, valid sig, distinct node_id from the primary.
- When the substrate has ≥ 2f = 24 prepare ballots, the round advances to `commit` phase.
- Audit log gets a `PREPARED` event with the set of participating node_ids.

### 3.3 `commit` — nodes commit to the decision

- The substrate opens a `commit` window (timeout: 30s default, configurable per round).
- Nodes send `commit` ballots (the same node, but the phase field is now `commit`).
- When 2f+1 = 25 `commit` ballots are received, the round advances to `committed`.
- Audit log gets a `COMMITTED` event with the `commit_proof.set_hash`.

### 3.4 `committed` — outcome is final

- The decision is final. The `commit_proof.set_hash` is appended to the L0-F audit ledger (the existing HMAC chain in `api/_audit_ledger.py`).
- The substrate returns the decision via `GET /api/council/decisions/{id}`.
- The /sign handler for Watchdog Certificates reads from this layer: a cert is only signed if there's a `committed` council decision with `outcome=approved` in the last N minutes (configurable, default 60min).

### 3.5 Aborted — timeout or quorum not reached

- If 2f+1 = 25 votes are not reached within the commit window, the round is `aborted`.
- The substrate returns 408 on subsequent vote submissions for that round.
- A new round can be opened with a new primary.

---

## 4. The 3 invariants the substrate must hold

1. **One round per subject at a time.** No two open rounds for the same `subject.ref`. A new proposal for a cert that's already being decided gets 409.
2. **Primary rotation is deterministic.** Node `i = (round_number mod 33)` is the primary (or `mod 36` if Nick picks 36 as canonical). Auditors can replay history by knowing the round number.
3. **Every vote is signed by a council pubkey, not by the API key of the caller.** The council pubkeys live in the substrate (we'll generate them in PR-A-0, see §6). Anyone can read them; only the nodes can sign. This is what makes the decision "by the council," not "by whoever called the API." The current BFTCouncil engine is text-based; this PR adds the per-node Ed25519 signing layer.

---

## 6. What this PR does NOT do (out of scope)

- No W3C DID method registration (that's a 6mo+ W3C process, separate PR)
- No blockchain anchor (L0-F Rekor integration is a separate PR, 1 week)
- No AIP-spec approval envelopes (IETF AIP draft expires Oct 2026, separate)
- No mobile or UI for council voting (the substrate is the API; UI is the MEOK DOME dashboard, separate)
- No cross-region strictest-wins logic (L0-D, separate)

---

## 7. Implementation order (3 PRs, all small)

### PR-A: substrate + endpoints (this PR's core)
- Add 4 new endpoints to meok-api substrate
- Wire to the existing L0-F audit ledger (append OPENED/PREPARED/COMMITTED/ABORTED events)
- No /sign gate yet
- 4-5 days
- Land in `feat/council-vote` on meok-api.csoai.org (or meok-api, depending on where the substrate lives)

### PR-B: /sign gate
- Modify the Watchdog /sign handler in meok-attestation-api to require a recent (within 60min) council decision with `outcome=approved` for the cert's subject
- If no decision, return 409 with `{error: "no_recent_council_decision", hint: "POST /api/council/proposals to open a round"}`
- 1-2 days
- Land after PR-A

### PR-C: Council voting UI
- MEOK DOME dashboard page: list open rounds, show vote counts, let humans trigger an "open round" with rationale
- Optional for 52-day critical path — the substrate API works without the UI
- 1 week
- Land after PR-B; can be parallel

### PR-A is the only one that blocks Article 50 cliff.

---

## 8. The substrate location — answered

**Answer (per CSOAI peer verification, 2026-06-12 11:10 UTC):**
- The canonical engine lives in the **meok** repo at `meok/council/bft_council.py` (not meok-api, not csoai-org-v2).
- `meok-api :3200` is a status mirror that needs to be either replaced or pointed at the meok substrate.
- The meok repo is private (per `_TABS/INBOX.md` line 47 — `meok/` assigned to MEOK ONE tab).

**PR-A lands in the meok repo, on a new branch `feat/council-vote`.** The CSOAI peer has access; main session (this one) has read access only. The HTTP wrapper goes on top of `BFTCouncil.propose_decision()` — no engine redesign.

---

## 9. Testing strategy (the part most PRs skip)

- **Unit:** Each endpoint's happy path + the 5 failure modes (bad sig, duplicate ballot, wrong primary, wrong round, timeout)
- **Conformance:** A 3-node local substrate with controllable timeouts — can replay every PBFT phase in <5s
- **Integration:** Real round-trip from the CSOAI peer: open round → 25 nodes vote → commit → /sign a cert with that decision. End-to-end <30s.
- **Audit:** A test that asserts every PBFT event has a corresponding entry in the L0-F audit ledger, with `chain_intact=true`. If this fails, the integration is broken.

---

## 10. Open decisions for Nick

1. **Canonical substrate: 33 nodes (meok/council/bft_council.py) or 36 nodes (meok-api:3200)?** My rec: 33, because that's the engine that runs. But the 36 has been the public face. Either pick; the spec is parameterized to handle both (threshold/2f+1 math uses `node_count` and `f = (node_count - 1) // 3`).
2. ~~Substrate repo location:~~ **ANSWERED** — meok repo, branch `feat/council-vote`. The meok repo is private; CSOAI peer has write access, main session has read.
3. ~~Council pubkey registry:~~ **ANSWERED** — NOT on disk. PR-A-0 sub-task: generate Ed25519 keypair per node, store in `meok/council/keys/` (.gitignore'd), seed from a deterministic master seed so rebuilds are reproducible. Add `pubkey_hex` to each node dict. Ship a `/api/council/node/{id}` endpoint.
4. **Timeout for `commit` window:** 30s spec target, 60s substrate default. The substrate's open-round API takes a `timeout_seconds` param that overrides. 30s for high-traffic (Article 50 cliff), 60s default, configurable per-round.
5. **Decision TTL for /sign:** 60min from `/sign` call (not from decision-commit). This way: a stale decision doesn't get reused for a different /sign, but a slow issuance doesn't get cut off mid-flight. Alternative is 24h with re-validation at /sign; default to 60min-from-/sign.

---

## 11. Spec checksum

- 4 new endpoints
- 4 PBFT phases
- 3 substrate invariants
- 2 integration invariants
- 6 things out of scope
- 3 PRs to ship
- 4 open decisions for Nick

Spec is ready for review. The CSOAI peer has the green light to take it.

— Mavis main session, 2026-06-12 11:05 UTC
