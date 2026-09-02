# EAT: Emilia Protocol → card-v0 `eval.delta` (digest-only)

Public Emilia Protocol material welded into the CSOAI atom path as **digest
pointers only**. No vendor tree. No endorsement. Never a GSPC axis fill.

Cite: https://github.com/emiliaprotocol/emilia-protocol

## Hard locks (Owner)

| Lock | Value |
| --- | --- |
| Role | Digest-ore consumer / denser-root leaf — **never** a Transparency Service |
| Artifact shape | `ep_receipt_digest` **pointers** — do not re-host full EP receipts here |
| EP vs SCITT | **EP ≠ SCITT inclusion.** Authorization receipt ≠ transparency / inclusion receipt |
| `/.well-known/scitt-keys` on councilof.ai | **404 by design** |
| Certify / mint receipts / `POST /entries` | **Forbidden** |
| Board | Never a GSPC axis fill; no `/api/gspc` edits; no wrangler |
| Signatures | `sig_ed25519` is always `null` here |
| Endorsement | None — cite only |

## Honesty: EP ≠ SCITT inclusion

Upstream vocabulary (EP-RECEIPT-SCITT-PROFILE-v1):

- **Authorization receipt** = EMILIA (who approved what) — `EP-RECEIPT-v1`
- **Transparency / inclusion receipt** = SCITT (proof a statement was logged)

They compose (EP statement can be registered via SCRAPI) but **neither replaces
the other**. An `ep_receipt_digest` on this card is **not** an inclusion proof
and **not** a claim that CSOAI logged anything.

Identity layers (pin `EP-SCITT-STATEMENT-IDENTITY-v0.1`) stay separate:

| Digest | Meaning |
| --- | --- |
| `statement_entry_digest` | SHA-256 of exact COSE_Sign1 bytes (one envelope / entry) |
| `signing_input_digest` | SHA-256 of RFC 9052 `Sig_structure` |
| `authorization_payload_digest` | SHA-256 of canonical EP receipt payload (authorization claim) |

Entry digest ≠ authorization digest. Neither alone proves transparency
registration on a TS we do not operate.

## Atom

```
upstream pin digests → unsigned card-v0 (surface=eval.delta)
  → (later n≥30 + 4way + keystone) → root → witness root only
```

## What landed

| Path | Role |
| --- | --- |
| `README.md` | This note — digest-only posture + EP≠SCITT honesty |
| `card-unsigned.example.json` | Unsigned `eval.delta` with `ep_receipt_digest` pointer pattern |
| `card-unsigned.consumer.json` | Harness consumer digest-only output (unsigned) |
| `HARNESS.md` | Measure dept wire-up (`run.sh measure`) |

## Pin (consume-only)

- Repo: https://github.com/emiliaprotocol/emilia-protocol
- Commit: `e507acdf8efbe8951cb4294801d4c440f0b86a5a` (short pin `e507acdf`, matches `joinedSpecs`)
- Profile docs: `docs/EP-RECEIPT-SCITT-PROFILE.md`, `docs/trust-receipt-spec.md`
- Conformance: `conformance/composition/scitt-statement-identity-v0.1/`
- Preimage rule (join table): `ep-scitt-statement-identity-v0.1`
- Wire: consume vectors at that SHA; **do not vendor main**

## Gaps (declared in `unmeasured[]`)

- `out-of-band-keys` — receipt / statement issuer keys are not published by CSOAI
- `not-inclusion-proof` — digests here are not SCITT inclusion receipts
- `csoai-not-a-ts`
- Live EP verify run / labelled reproduction numbers
- n≥30, 4way, keystone

## Non-goals / hard stops

- Do **not** invent MEASURED / SIGNED.
- Do **not** merge Emilia into the card signer (separate verifier only).
- Do **not** vendor `emilia-protocol` source into this repo.
- Do **not** claim CSOAI operates a SCITT TS or certifies authorization.
- Do **not** touch `/api/gspc`, wrangler, or fake signatures.
- Do **not** treat `/assess` RAS output as a certificate.

## Harness consumer

See [`HARNESS.md`](./HARNESS.md) and `scripts/interop/emilia_ep_consumer.py` (digest-only → unsigned `eval.delta`; EP≠SCITT on card). Measure dept: `~/.grokbot/harness/run.sh measure`.
