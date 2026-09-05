# Attestations pane fixtures

Bytes fetched from the live estate on 2026-09-02 (curl, no edits except the two `-head`
files, which are truncated and say so in `_fixture_note`):

- `root.json` — `GET https://councilof.ai/root.json`
- `root-witness-latest.json` — `GET https://councilof.ai/interop/root-witness-latest.json`
- `root-witness-pointer.json` — `GET https://councilof.ai/interop/root-witness-pointer.json`
- `proof-index0.json`, `proof-index49.json` — `GET https://councilof.ai/api/proof?sha=<leaf>`
- `did.json` — `GET https://csoai.org/.well-known/did.json`
- `corrections-head.json` — `GET https://councilof.ai/api/corrections` (first 6 entries)
- `card_index-head.json` — `GET https://councilof.ai/signed/card_index.json` (first 8 rows)

`interop/eas-root-attestations.json` returned HTTP 404 on that date; the pane reads the
EAS state from the witness sidecar (`witnesses.eas_base.status: NOT_YET`) and says so.
