# SCITT RFC 9943 Profile for Council of AI signed surfaces

**Status:** Draft v1 — 2026-08-21 · **Author:** JEEVES (P&P lane)
**Doctrine:** measurement-not-certification · signed evidence, never certification
**Corresponds to:** strategic sweep rec #1 (SCITT is now RFC 9943)

## 1. Why this exists

SCITT (Supply Chain Integrity, Transparency, and Trust) became a full IETF
standard: **RFC 9943, "An Architecture for Trustworthy and Transparent Digital
Supply Chains"** (mid-2026). It standardises:

- **Signed statements** (COSE) — any content, cryptographically bound to a signer
- **Transparency-service receipts** — evidence a statement was registered to an
  append-only, verifiable log
- **Append-only verifiable logs** — content-agnostic; regulatory/measurement
  records qualify as "statements"

The Council of AI estate already emits exactly this class of artifact:

| Estate surface | Today | SCITT mapping |
|---|---|---|
| `/api/gspc` board | Ed25519-signed snapshot (board-attestation-1) | SCITT signed statement (COSE envelope) |
| `/api/regulation` feed | Ed25519-signed, 20 deadlines + penalty exposure | SCITT signed statement |
| `/api/corrections` ledger | Ed25519-signed, append-only chain, staleness guard | SCITT append-only log entry |
| 3KB h3k measurement cards | Ed25519-chained, prev-chain, MANIFEST | SCITT statement + receipt |
| `did:web:csoai.org` | 4 keys incl. card-attestation-1 (d4cb0eaa) | SCITT trust anchor / issuer |

**The gap is presence, not substance:** none of the IETF work cites the estate.
RFC 9943 just published; the IETF AUDIT/agentproto effort is pre-charter and
shapeable. This profile is the interoperability + legitimacy unlock.

## 2. Mapping (proposal)

### 2.1 Statement envelope
Each signed estate artifact re-expressed as a SCITT statement:

```
SCITT Statement (RFC 9943)
├─ payload: canonical JSON of the estate artifact
│    (same canonical the estate already signs — Python json.dumps
│     sort_keys=True, separators=(',',':'), ensure_ascii=True)
├─ protected header:
│    alg: Ed25519
│    issuer: did:web:csoai.org#card-attestation-1 | #board-attestation-1
│    content-type: application/csoai.measurement-card+json (new, registered)
│    x5t / kid: d4cb0eaa...
├─ signature: existing Ed25519 (reusable — no re-sign needed, same bytes)
└─ registration policy: append-only, no deletion, no edit
```

Key property: **the estate's existing signatures are already SCITT-compatible**
— same Ed25519, same canonical payload binding (JCS-like). Registration to a
transparency service adds the receipt; it does not change the statement.

### 2.2 Transparency service
Candidate: DNS-anchored SCITT transparency log (the GoDaddy/Scott Courtney
instance was floated on the SCITT list) or a self-hosted SCRAPI endpoint once
draft-ietf-scitt-scrapi lands. Register the board snapshot + regulation feed +
corrections chain on a cadence (e.g., daily anchor).

### 2.3 Trust
`did:web:csoai.org` is the issuer anchor. The 4 published keys map to SCITT
issuer identities. No new key needed.

## 3. Deliverables (this sprint)

1. **This profile document** (done — v1).
2. **Machine-readable mapping file**: `public/.well-known/scitt.json` declaring
   the statement types, issuer keys, canonical form, and registration endpoint
   (once live). New surface — to be built.
3. **IETF engagement**: post to `scitt@ietf.org` (we are subscribed) and
   `agent2agent@ietf.org` referencing the deployed estate: Ed25519, canonical
   payload binding, did:web trust, inspect-signed-receipt pattern. Coordinate
   with the AUDIT pre-charter effort (Kühlewind/Birkholz) and the vaara.receipt
   author (Henri Sirkkavaara) — near-twin format, differentiate on
   credible-neutrality firewall + deterministic predicates.
4. **SCRAPI registration** once the Reference API is near-publication.

## 4. Firewall checks (doctrine)

- No certification claim: SCITT registration is *evidence of registration*, not
  a certificate. The estate's "measurement, not certification" line is
  preserved — a SCITT receipt proves a statement was logged, nothing more.
- No new trust that conflicts: registration to a third-party transparency log
  does not move signing keys. Keys stay on the estate Mac/pod.
- No money from ranked entities: transparency-service fees (if any) come from
  the estate's own operating budget or subscribers — never from a measured
  model vendor.

## 5. Next actions

- [ ] Draft `public/.well-known/scitt.json` mapping (build next)
- [ ] Draft IETF scitt@/agent2agent@ post (coordinate-first, no PR without
      maintainer engagement)
- [ ] Track SCRAPI publication; register board snapshot on first live endpoint
- [ ] Note in llms.txt + agent-card so agents discover the SCITT surface

---

## 6. Verified intel update (2026-08-22 — delegated research, verified against IETF Datatracker)

**SCRAPI is registrable TODAY.** draft-ietf-scitt-scrapi **-11** (2026-08-13) is
IESG-approved for Proposed Standard and in the RFC Editor queue (number TBD, AD
Deb Cooley). No need to wait for the RFC number:
- Reference implementations: `scitt-community/scitt-api-emulator`,
  `scitt-community/py-scrapi` (Python client), `microsoft/scitt-ccf-ledger`
- SAG-CTR is already live-registering against a running SCITT transparency
  service — the pattern is proven in the wild
- **Action:** register COSE_Sign1 statements for /api/gspc + /api/regulation
  snapshots now against the community/MS stack using -11 semantics

**RFC 9943 confirmed:** published June 2026, Standards Track. WG chairs Jon
Geater, Nicole Bates, Christopher Inacio; AD Deb Cooley.

**AUDIT pre-charter is the real window:** the BoF request
(bofreq-kuhlewind-agent-use-of-delegation-and-interaction-traceability-audit)
is **declined** — no BoF at IETF 127. Discussion continues on lists. The
window to contribute before chartering is open NOW.

**IETF 127:** Nov 14–20, 2026, San Francisco (Hilton Union Square, hosted by
Verisign). SCITT session unconfirmed (agenda not yet published). If a SCITT
session is scheduled, prioritize a draft/statement before it.

**vaara.receipt -07** (12 Aug 2026): author Henri Sirkkavaara,
hello@vaara.io — coordination candidate confirmed; differentiate on
credible-neutrality firewall + deterministic predicates.

**Unverified (flagged honestly):** no public DNS-anchored SCITT log confirmed
accepting registrations; SCITT session at IETF 127 unconfirmed; exact future
RFC number for SCRAPI unknown.
