# Attestation Watch — data directory (EP3 / TUI-3)

Public page: `/watch`. Owner lane: TUI-3 (file-ownership map, CSOAI_6_TUI_GOALS_2026-09-11).

| File | Writer | What it is |
|---|---|---|
| `issuer-claims.json` | human/cron, deliberate archival | The claim registry. A claim enters ONLY when actually fetched and archived (`archived_at` + `source_url` + excerpt note). `claim: null` = UNMEASURED — the slot stays visible, never omitted, never invented. |
| `specimen-ledger.json` | human, dated entries | Public predictions archived BEFORE their outcome date, with the measurement plan stated in advance. Entry #1 (CLARITY hype) outcome card due 2026-09-16. |
| `calendar.json` | human | Hard-date rail. A date without a source does not ride. |
| `watch-latest.json` | **machine — `scripts/adapters/watch_gaps.py`** | The snapshot `/watch` renders. Regenerated inside every hourly `public-root.yml` run and committed by that workflow. Never hand-edit. |

Pipeline: `watch_gaps.collect()` → 16 gap leaves + N specimen leaves (surface
`public.notice`, facts not grades) → the hourly public-root publisher signs them
(GHA OIDC, `did:web:csoai.org#board-attestation-1`) and folds them into
`/root.json`. Nothing in this lane ever holds a private key. NO_LAPTOP_SIGN.

Divergence rule: computed only inside one disclosed scope (issuer XRPL-slice
claim vs XRPL observable, issuer's own quoted price on both sides). A
cross-scope pair (issuer all-chain total vs XRPL slice) is recorded as two
facts with the mismatch named; the divergence cell stays empty.
