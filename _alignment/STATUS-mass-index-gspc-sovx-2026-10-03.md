# STATUS — mass index GSPC + SovX — 2026-10-03

## Intent
Owner: "indexing on mass across all for gspc and sovx TODAY". Free discovery indexing for both products on 3 Oct 2026.

## Product identity (confirmed)
- **GSPC** — open AI measurement board (single-product authority).
- **SovX** — wrapped-asset measurements (parity ledger). Public name ruled R-2026-0928-02. Kaggle publish ruled R-2026-0929-05. CAIP-19 index schema `csoai.wrapper-caip19-index/0.1` live: 45 assets · 24 pairs · 17 with archive · 2 unkeyed.

## Executed
1. SovX listing pack: `_alignment/SOVX-SITE-COPY-2026-10-03.md`.
2. Wave 1 free mass-index (both products): `mass-index-gspc-sovx-20261003.py`.
3. Wave 2 remaining free surfaces: `mass-index-gspc-sovx-wave2-20261003.py`.
4. IndexNow dry-run (11 URL LIVE). Real submit **HELD** — no host deploy this session, so `--changed` is not honest.
5. Kaggle/HF/body-grep probes for SovX + GSPC.

## Results (this pass)
INDEXED=29 (sovx 17 · gspc 12) · INSTALLED=9 · DISCOVERED=36 · BLOCKED=6.
Honesty: INDEXED = form filled + submit clicked OR probe body-grep. Never MEASURED. Never paid. Never sold a score/grade.

## Artifacts
- `_alignment/MASS-INDEX-GSPC-SOVX-2026-10-03.json`
- `_alignment/SPRAY-WAVE-LOG-2026-10-03.md`
- `_alignment/SOVX-SITE-COPY-2026-10-03.md`
- `_alignment/N-SITES-CATALOG.md` §P
- `_alignment/REAL-SIGNALS-INDEX-2026-10-01.md` append 2026-10-03

## Not done / held
- IndexNow live submit (needs a real host change + `--changed`).
- Paid directories (Toolify $99 / TAAFT launch / LaunchingNext fast-track) — never without money go.
- MetaMask Snap npm publish (README: HELD for owner).
- CAIP-19 candidate_batch (status HELD / SIGN_PENDING — owner OK to publish issuer-named records).
- Product Hunt 2nd launch remains SCHEDULED Tue 2026-10-06 (do not duplicate).
