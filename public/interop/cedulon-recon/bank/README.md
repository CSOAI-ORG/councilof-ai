# Bank: Cedulon Abak-00 population-probe conservation fixtures

Frozen as unsigned bank input under `public/interop/cedulon-recon/bank/`.

## source_urls

- https://github.com/dogrucanemek-alt/cedulon/blob/master/interop/abak-00/README.md
- https://github.com/dogrucanemek-alt/cedulon/blob/master/interop/abak-00/population-probe.mjs
- https://raw.githubusercontent.com/dogrucanemek-alt/cedulon/master/interop/abak-00/population-probe.mjs
- https://datatracker.ietf.org/doc/draft-abak-agent-control-delivery-evidence/
- npm: `@cedulon/audit@0.8.0`, `@cedulon/receipts@0.8.0`, `@cedulon/checkpoint@0.8.0`, `@cedulon/x402-adapter@0.8.0`

## Files

- `probe-pin.json` — path + sha256 + npm pins
- `class-counts-expected.json` — Part-1 disposition-class schema + observed counts from pin re-run
- `conservation-fixtures.jsonl` — one JSON object per MCC / Part-4 row (expected class / disposition / gap notes)

## Honesty

- Pin re-run performed 2026-09-02 UTC against published 0.8.0 outside any Cedulon workspace; probe exit 0; sha256 matched learned pin.
- Counts are **probe observations / fixture expectations**, not MEASURED GSPC axis values.
- If a future pin re-run fails (npm/git unavailable), treat observed fields as **UNCHECKABLE** until re-run; schema still stands.
- Never certify. Never axis fill.
