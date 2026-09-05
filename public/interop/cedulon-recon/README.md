# EAT: Cedulon / Abak → card-v0 `cedulon.recon`

Public peer code eaten into the CSOAI atom path as **unsigned bank input**.
No outreach. No endorsement of Cedulon. Never a GSPC axis fill.

## Atom

`probe / bank → unsigned card-v0 (surface=cedulon.recon) → (later n≥30 + 4way + keystone) → root → witness root only`

- `sig_ed25519` is always `null` here.
- `unmeasured[]` stays honest.
- Settlement / x402 stays **UNCHECKABLE** until a facilitator receipt exists.
- We are not a Transparency Service (`/.well-known/scitt-keys` remains absent on purpose).

## What landed

| Path | Role |
| --- | --- |
| `bank/README.md` | Bank freeze notes + pin / source_urls |
| `bank/class-counts-expected.json` | Part-1 class_counts schema + pin-rerun observation |
| `bank/conservation-fixtures.jsonl` | Parts 3–4 MCC / exclusion fixture rows |
| `bank/probe-pin.json` | Repo path + sha256 + npm pins |
| `card-unsigned.example.json` | Unsigned example card, surface `cedulon.recon` |
| `bank-cedulon-abak-00-stub.json` | Earlier stub (superseded by `bank/`; kept for history) |
| `card-cedulon-recon-abak-unsigned.json` | Earlier stub card (zeroed counts; superseded by example) |

## Pin (learned + re-run 2026-09-02)

- Peer: https://github.com/dogrucanemek-alt/cedulon
- Probe: `interop/abak-00/population-probe.mjs`
- sha256: `031f84fda2054b1427a510baa45f880d379ea60dced408a4a74028da12b1fceb`
- npm: `@cedulon/audit@0.8.0` (+ receipts / checkpoint / x402-adapter @0.8.0)
- Run instruction (from peer README): copy probe **outside** the Cedulon workspace, then `npm i` the pins and `node population-probe.mjs`.

## Non-goals / hard stops

- Do **not** invent MEASURED.
- Do **not** touch `/api/gspc` axis roster.
- Do **not** claim Cedulon endorsement, SCITT Transparency Service status, or settlement.
- Do **not** wrangler / fake signatures / on-list outreach.
- Conservation fixtures freeze **expected** MCC dispositions + reported open defects; they do not certify the peer.

## Gaps (declared)

- Closing-boundary unmatched receipt may drop silent (peer README / probe Part 4b).
- Aborted receipt invisible in some recon paths (Part 4c).
- Report publishes findings + aggregate, not Section 6.4 class counts (peer).
- n≥30, 4way, keystone, facilitator receipt: still `unmeasured[]`.
