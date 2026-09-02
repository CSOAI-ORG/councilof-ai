# x402 challenge coverage (unsigned)

Live HTTP 402 probe of `GET https://councilof.ai/api/eunomia-data?x402=1` (refreshed 2026-09-02).

- Surface: `cedulon.recon` with `payload.x402.challenge`
- `settlement`: **UNCHECKABLE** until a facilitator receipt exists
- Never a GSPC axis fill
- Never stamp MEASURED / SIGNED here (needs n≥30 + 4way + keystone)
- No payment made in this probe

Atom path: probe → unsigned card-v0 → (gates) → root. Witnesses stay null-honest.

Files:
- `probe-2026-09-02.json` — live curl of own 402 endpoint
- `card-unsigned.example.json` — unsigned card-v0 (`sig_ed25519: null`)
