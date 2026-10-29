# ONDO evidence-intake pack — rerun instructions

Subject: `issuer:ondo` · State: `CANDIDATE_UNMEASURED` · As of: 2026-09-20
Doctrine: measurement credentials, never certification. Read-only by construction —
no wallet, transaction, purchase, token transfer, signing, or publishing anywhere
in this pack.

## Contents

| File | Role |
|---|---|
| `ondo-source-manifest.json` | `csoai.ondo-source-manifest/0.1` — 25 first-pass sources, each with locator, retrieval time, bytes, sha256, content-addressed raw path |
| `ondo-attestation-manifest.json` | `csoai.ondo-attestation-manifest/0.1` — 5 second-pass attestation surfaces (GAP-01 follow-up), same pinning |
| `ondo-attestation-inventory.json` | `csoai.ondo-attestation-inventory/0.1` — third pass: full per-file sha256 inventory of both Dropbox zip exports (744 daily + 36 monthly), earliest/latest byte-pinned, key fields extracted, continuity analysis |
| `ondo-app-manifest.json` | `csoai.ondo-app-manifest/0.1` — fourth pass: official app shell pin (GAP-08/GAP-09 hunt; series existence confirmed, URLs runtime-loaded) |
| `ondo-evidence-raw/<sha256>.bin` | Raw served bytes, content-addressed (filename = sha256), shared by both passes |
| `ondo-frozen-inputs.jsonl` | `csoai.ondo-frozen-input/0.1` — 47 claim rows, one JSON object per line |
| `ondo-gaps-rejections.json` | `csoai.ondo-gaps-rejections/0.1` — 9 gaps (GAP-01/08/09 advanced), 7 rejections, uncheckable list |
| `ondo-instrument-proposal.json` | `csoai.ondo-instrument-proposal/0.1` — 5 candidate instruments + 1 blocked (ADR-003 draft axis) |
| `ondo-candidate-register.json` | `csoai.ondo-candidate-register/0.1` — subject state and stop rule |

## Verify this pack (offline, no network)

```bash
python3 tools/validate_ondo_evidence.py
```

Expected output:

```
PASS: 36 sources re-hashed across 3 manifests; 47 frozen rows reconcile; all excerpts found in raw bytes; all 10 categories covered; no invented axes; no certification language
```

(PDF rows are excerpt-checked against `pdftotext -layout` output of the
byte-pinned document; `pdftotext` must be on PATH. Pinned document samples and
the inventory are re-hashed from the local register on every run.)

The validator re-hashes every raw file, checks every frozen row against the
manifest, confirms every quoted excerpt appears in the pinned bytes (after a
documented normalization: strip HTML tags, unescape entities, collapse
whitespace), enforces the claim-class/category/state enums, restricts
`gspc_axes` to the live 23-slot board, and rejects certification language.

## Re-collect from live sources (network, read-only)

```bash
python3 tools/collect_ondo_evidence.py
```

Expected output (2026-09-20 run):

```json
{"observed": 25, "uncheckable": []}
```
Second pass (attestation surfaces; separate manifest, never overwrites the first):

```bash
python3 tools/collect_ondo_attestations.py
```

Expected output (2026-09-20 run): all five surfaces `OBSERVED_NOT_YET_ACCEPTED`.
Note what the second pass established: both Dropbox landings are JavaScript
shells (no extractable file listing) and the Google Drive folder redirects
anonymous fetches to a sign-in page.

Third pass (attestation document inventory; uses the Dropbox `?dl=1` zip
export — the read-only extraction path that worked when the web listing did
not):

```bash
python3 tools/collect_ondo_attestation_documents.py            # downloads fresh zips
python3 tools/collect_ondo_attestation_documents.py \
    --daily-zip /tmp/ondo-usdy-daily.zip --monthly-zip /tmp/ondo-usdy-monthly.zip
```

Expected output (2026-09-20 run):

```json
{"business_day_gaps": 31, "daily_files": 744, "daily_span": ["2023-09-28", "2026-09-15"], "monthly_files": 36, "samples_pinned": ["daily_earliest", "daily_latest", "monthly_earliest", "monthly_latest"]}
```

The zip exports are time-variant (reports are added; Dropbox zip-build
metadata varies), so zip-level hashes may differ on re-run — the per-file
sha256 inventory is the stable artifact. 29 of the 31 business-day gaps are
US market holidays; 2025-08-29 and 2026-03-31 are recorded as unexplained
single-day absences (ONDO-EV-044), not failures.

Fourth pass (official app surface):

```bash
python3 tools/collect_ondo_app_surface.py
```

Expected output (2026-09-20 run): `{"app-root": "OBSERVED_NOT_YET_ACCEPTED"}`.
This pass confirmed from official bytes that four attestation series exist
(USDY LLC daily/monthly + GM BVI daily/monthly, ONDO-EV-045) and pinned the
USDY product-state banners (ONDO-EV-046). The series URLs are runtime-loaded:
the app root HTML, all 50 static JS chunks, and the public assets API were
searched and carry no report URLs — GAP-08/GAP-09 stay open with that explicit
boundary.

WARNING: re-collection overwrites `ondo-source-manifest.json` and adds new
content-addressed raw files. Live pages change — OUSG/USDY portfolio figures,
audit lists and docs text are time-variant, so hashes WILL differ on a later
run. A re-run is a new observation, not a failure of the frozen pack; diff the
manifests and treat changed rows as new evidence requiring new frozen rows.
The frozen JSONL is NOT rewritten by the collector; row hashes then refer to
the previous manifest, so validate BEFORE re-collecting, or validate against a
checked-out copy of the frozen manifest.

Read-only RPC calls used (state reads only, via https://ethereum.publicnode.com):
`eth_chainId`, `eth_getCode`, `eth_call` with selectors `name()` 0x06fdde03,
`symbol()` 0x95d89b41, `decimals()` 0x313ce567, `totalSupply()` 0x18160ddd —
all against the docs-claimed OUSG address 0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92.
Any independent Ethereum endpoint can replay them.

## Boundary

- Pack state is `CANDIDATE_UNMEASURED`; the 2026-09-19 canary `token:ondo`
  `BLOCKED_IDENTITY_PIN` is unchanged (no ONDO governance-token address asserted).
- Promotion requires: pinned instrument + deterministic grader + complete
  denominator + run output + signed card, all reconciling. None of these exist
  for this subject yet.
