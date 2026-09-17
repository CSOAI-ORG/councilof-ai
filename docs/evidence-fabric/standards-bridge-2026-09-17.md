# The standards bridge: SCITT and OpenTelemetry

**Written, not built. 17 September 2026.** No deployment, no new server, no new surface.

The point of a bridge is direction. Today the estate holds **305 `.well-known/*.json` documents**,
each mapping our vocabulary onto somebody else's. That is us mapping to everybody. A bridge to two
standards that others already implement reverses it: **they map to us.**

## Our standing, stated exactly

**One** live Internet-Draft: **`draft-templeman-scitt-framing-space-00`**.

Three others were **WITHDRAWN on 13 September 2026** and must never be cited as live. If a document
in this estate lists four drafts, it is stale and the other three are gone.

SCITT is **RFC 9943** (architecture) and **RFC 9942** (terminology).

## Part 1 — our evidence object as a SCITT signed statement

A SCITT **signed statement** is a COSE_Sign1 envelope over a payload, with protected headers naming
the **issuer**, the **subject**, and the payload's content type. A transparency service registers it
and returns a **receipt** — a signed inclusion proof against an append-only log. The receipt, not
the statement, is what a relying party checks.

### What maps cleanly

| SCITT | ours | note |
|---|---|---|
| issuer | `did:web:csoai.org#board-attestation-1` | already a DID; SCITT accepts DID-based issuers |
| subject | `subject` binding of the evidence object | a stable identifier already exists per axis/model |
| payload | the evidence object itself | JSON, canonical, already digest-addressed |
| signature algorithm | Ed25519 | permitted; we already sign with it |

### What does NOT map

1. **We sign JSON, SCITT signs COSE.** Every signature in this estate is raw Ed25519 over a
   canonical JSON preimage, published as hex or base64. A signed statement is COSE_Sign1 with
   protected headers, and **the headers are inside the signature**. Re-encoding an existing card as
   COSE does not carry its existing signature across — the bytes signed are different. So SCITT
   adoption cannot be retrofitted onto the 335 already-signed cards; it applies to new statements
   only, and the old corpus would need supersession rather than conversion.

2. **The COSE key in `~/.csoai-keys` is a different system's key.** It exists, it is COSE, and it is
   the obvious thing to reach for. Using it to sign a CSOAI statement would be forgery. The board
   key signs via the approved signer, which runs inside GitHub Actions, **which is disabled
   account-wide.** No signed statement can be produced today, by any route. This is the binding
   constraint on the whole bridge and it is operational, not technical.

3. **A transparency service is an append-only log — and our root is not one.** The receipt is the
   product, and it proves inclusion in a log with consistency between successive states. Our public
   root is re-derived on every publish: 0 of 27 transitions are append-only, and roughly a quarter
   of leaves are dropped per publish
   (`docs/reconciliation/PUBLIC-ROOT-IS-NOT-A-LOG-2026-09-17.md`). **We cannot be our own
   transparency service** until that changes. We could register statements with someone else's, and
   that is the cheaper first step by a wide margin.

4. **No registration policy exists.** A transparency service publishes what it will and will not
   register. We have never written one. Absent it, "registered with CSOAI" would mean nothing, which
   is precisely the defect the `MEASURED` predicate already has — `n >= 30` and nothing else.

### The honest sequence

Draft the registration policy (needs no signer) → emit the evidence object as a COSE payload
(mechanical) → register with an existing transparency service (needs a working signer) → run our
own (needs an append-only log first). Steps 1 and 2 are available today. Steps 3 and 4 are blocked
on things outside this lane.

## Part 2 — OpenTelemetry for a measurement run

The natural shape: **one trace per run, one span per graded item**, with the run's digests as
resource attributes.

```
resource: csoai.instrument.sha256, csoai.bank.sha256, csoai.items.sha256,
          csoai.model.manifest.digest, service.name=gspc-mill
span (run): csoai.run.id, csoai.axis, csoai.model
  span (item) ×N: csoai.item.id, csoai.graded=true|false,
                  csoai.exclusion.reason=parse_error|transport_error|none
```

### Why this is worth more than telemetry

`n_admitted` and `n_attempted` **stop being separate claims and become the same measurement seen
twice.** Today `n` is a number a producer writes down; the exclusion count is another number a
different part of the producer writes down; nothing reconciles them, and a card that discarded 75.4%
of its attempts published as MEASURED because the rule reads only the numerator. Under spans,
`n_attempted` is the span count and `n_admitted` is the count of spans with
`csoai.exclusion.reason=none`. **A discrepancy becomes arithmetic rather than a matter of trust.**

That is the strongest argument for OTel here and it has nothing to do with dashboards.

### What does NOT fit

1. **OTel spans expire; evidence must not.** Collectors retain for days or weeks. Evidence needs to
   outlive its signature. So the trace is the *derivation*, never the record — the evidence object
   remains the artifact, and it should carry the `trace_id` as a reference, not the spans.
2. **Our runs are not online.** Mill runs happen on pods and in HF Jobs, often without a collector
   reachable. An exporter that drops spans silently would under-count `n_attempted`, which is
   exactly the failure mode being fixed. File-based export and later ingestion is the only safe
   shape.
3. **Span attributes are not signed.** Anyone who can write to the collector can write a span. OTel
   gives reconciliation, not authenticity; SCITT gives authenticity, not reconciliation. Neither
   replaces the other and neither is a substitute for the card.
4. **`service.name` is not an issuer.** Resource attributes are operational identity. The issuer
   stays the DID.

## What this bridge does NOT do

- It does not make anything MEASURED. Both standards carry claims; neither grades one.
- It does not fix the `n >= 30` predicate. It makes the input to that predicate checkable, which is
  what makes fixing it possible.
- It does not add a surface, and it must not. The evidence object is a vocabulary; SCITT and OTel
  are two encodings of it.

## Proving command

There is nothing to run. This is a written spike and the claim it makes is about what would be
required — the falsifiable parts are the four "does not map" items, each of which names the specific
artifact or constraint that blocks it.

The one command that proves the blocking constraint:

```bash
gh workflow run auto-eat-sign.yml   # HTTP 422: Actions has been disabled for this user
```

No signed statement — SCITT or otherwise — can be produced while that is true.
