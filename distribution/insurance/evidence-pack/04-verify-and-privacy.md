# Verify path and privacy contract

## Client-side verification

1. User pastes signed record JSON at https://councilof.ai/gspc-verify or https://councilof.ai/east-west/verify
2. Browser recomputes SHA-256 hash and checks Ed25519 signature against published keys (`did:web:csoai.org`)
3. **No record content leaves the machine** — no server trust required

## Opt-in tally (separate bit)

`POST /api/verify-tally` accepts only `{ "ok": true|false }` after explicit user click.

- Self-reported signal — **not a MEASURED number**
- No identifiers, no IP retention, no record content

## Keys

Published at https://councilof.ai/trust-center and `did:web:csoai.org`

## What verify does not do

- Assert compliance, safety certification, or insurability
- Replace carrier underwriting or legal review
