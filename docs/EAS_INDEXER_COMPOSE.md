# EAS indexer compose — read-only (NEXT_300 #172)

Design for a **read-only** Ethereum Attestation Service (EAS) indexer used as a public-artifact adjacency for RWA Stage 2 — **not** a grade oracle.

## Scope

- Pull attestations by schema UID / recipient from public RPC.
- Store: UID, schema, attester, recipient, time, `data` hash, revocation status.
- Output: REPORTED contact rows for ClaimGuard / corpus — never invent MEASURED scores or AUM.

## Compose sketch

```yaml
# illustrative — not a production deploy claim
services:
  eas-indexer:
    image: node:22-alpine
    command: ["node", "scripts/eas-indexer-readonly.mjs"]
    environment:
      - RPC_URL=  # public RPC only
      - MODE=readonly
    # No private keys. No publish. No Wilson on live churn.
```

## Honesty

- Read-only: no `attest()` from this service.
- Wilson intervals only on **frozen** banks (`docs/WILSON_FROZEN_BANKS.md`).
- Labour/economy indices stay UNMEASURED on OS/DSH.
