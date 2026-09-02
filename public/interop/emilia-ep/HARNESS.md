# HARNESS — emilia-ep consumer

Digest-only consumer → **unsigned** `eval.delta`. Records **EP ≠ SCITT
inclusion** on the card. Harness authority stays on M4:

```text
~/.grokbot/harness/run.sh measure
```

## Atom

```text
digest pointers (README / example card / built-in pin table)
  → scripts/interop/emilia_ep_consumer.py
  → unsigned card-v0 (surface=eval.delta, sig_ed25519=null)
  → payload.ep_ne_scitt_inclusion.this_card_claims_inclusion = false
```

## Honesty: EP ≠ SCITT inclusion

- **EP** authorization receipt = who approved what (`EP-RECEIPT-v1`)
- **SCITT** inclusion receipt = proof a statement was logged

They may compose (EP statement registered via SCRAPI) but **neither replaces
the other**. Digests on this card are **not** inclusion proofs and **not** a
claim that CSOAI logged anything.

## Run (repo consumer)

```bash
python3 scripts/interop/emilia_ep_consumer.py
python3 scripts/interop/emilia_ep_consumer.py --stdout
```

Default output: `public/interop/emilia-ep/card-unsigned.consumer.json`.

If `card-unsigned.example.json` is present, the consumer prefers its
`ep_receipt_digest.pointers[]` (id + sha256 only). Otherwise it uses the
built-in pin table aligned with `README.md`.

## Measure dept hook (M4)

```bash
~/.grokbot/harness/run.sh measure -- \
  python3 "$REPO/scripts/interop/emilia_ep_consumer.py" \
    --repo-root "$REPO"
```

## Locks

| Lock | Value |
| --- | --- |
| Artifact | Digest pointers only — do not re-host full EP receipts |
| EP vs SCITT | EP ≠ SCITT inclusion (stated on card) |
| Signature | `sig_ed25519` always `null` |
| Board | No `/api/gspc` edits |
| Deploy | Never wrangler |
| Certify | Forbidden |
| TS | CSOAI is **not** a Transparency Service |
| Endorsement | None |

See also: `README.md`, `card-unsigned.example.json`.
