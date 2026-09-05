# GSPC spray — the board on every surface, derived, idempotent, daily

`scripts/spray/gspc-spray.py` builds ONE snapshot of the live board from live truth and pushes it, unchanged, to
every distribution surface we hold a credential for. `.github/workflows/gspc-spray.yml` runs it daily (09:40 UTC)
and on demand, choosing surfaces by which secret exists.

**Measurement, not certification.** Every number in the snapshot is derived at run time from
`GET https://councilof.ai/api/gspc`, `https://councilof.ai/root.json` and the frozen banks on the Hub. Nothing is
typed. If `/api/gspc` cannot be read the script refuses (exit 2) — absent is not zero.

## Run it

```bash
pip install huggingface_hub kaggle build twine
python3 scripts/spray/gspc-spray.py --all --report spray-report.json     # every surface
python3 scripts/spray/gspc-spray.py --all --dry-run                       # read, build, decide — push nothing
python3 scripts/spray/gspc-spray.py --build-only --out ./snapshot         # just the snapshot directory
python3 scripts/spray/gspc-spray.py --hf --github                         # a subset
```

Exit 0 = nothing FAILED (UNCHANGED and BLOCKED are not failures). Exit 1 = a surface FAILED. Exit 2 = refused.

## What a snapshot is

| file | what |
|---|---|
| `board.json` | the live GET, byte-for-byte — its `site_attestation` still verifies over exactly these bytes |
| `root.json` | the transparency root, byte-for-byte |
| `SNAPSHOT.json` | `as_of` (root's), `read_at`, sha256 of both, merkle root, card count, counts derived from the axis array, frozen-bank row counts, the `fingerprint` |
| `README.md` | `totals.lid` verbatim as the one-line description · the axes with status/separation/public-leader state · honest counts · how a stranger verifies (gspc-verify, root inclusion, did:web key) |
| `gspc-axes.csv` / `.jsonl` | one row per slot |
| `check-board.sh` | curl + python3 only: recount the totals from the array, recompute the Merkle root from `card_sha256[]` |
| `manifest.jsonl` | file, bytes, sha256 |

`fingerprint = sha256(board_content_sha256 | merkle_root | card_count)` where `board_content_sha256` is the sha256 of
canonical JSON of the board minus `site_attestation`. The root's `as_of` moves every hour (public-root cron); the
fingerprint moves only when the board or the card set changes. A surface that already carries this `as_of`, or this
fingerprint, is left alone (`--force` overrides the fingerprint check, never the `as_of` check).

The README is scanned before any push: the words "certified", "BFT" and "sovereign" refuse the run. No prices anywhere.

## Surfaces and credentials

| surface | where it lands | credential (local) | secret name (Actions) | idempotency key read back from |
|---|---|---|---|---|
| Hugging Face dataset | `csoai/gspc-board` folder `snapshot/` | `hf auth login` (org csoai) | `HF_TOKEN` | `resolve/main/snapshot/SNAPSHOT.json` |
| Hugging Face Space | `csoai/gspc-board` folder `snapshot/` (the one living Space; its index is untouched) | same | `HF_TOKEN` | same |
| Kaggle | `nicktempleman/csoai-gspc-living-board`, new version | `~/.kaggle/kaggle.json` | `KAGGLE_USERNAME` + `KAGGLE_KEY` | subtitle carries `as_of`, description carries `spray-fingerprint:` |
| GitHub mirror | `CSOAI-ORG/gspc-board` main (+ topics) | `gh auth` | `GSPC_BOARD_TOKEN` (fine-grained PAT, contents:write; `GITHUB_TOKEN` cannot push to another repo) | contents API `SNAPSHOT.json` |
| Zenodo | new VERSION under concept DOI `10.5281/zenodo.22293340`, `isDerivedFrom` `10.5281/zenodo.21991104` (the methodology record is only referenced, never written) | `~/.zenodo_token` | `ZENODO_TOKEN` | records API: `version == as_of` or notes carry `spray-fingerprint:` |
| PyPI | `csoai-gspc==0.2.<YYYYMMDD>` — the reader/verifier, with the snapshot bundled as package data and printed by `csoai-gspc snapshot`; every other command still reads the live GET | `~/.pypirc` | `PYPI_API_TOKEN` | project JSON: release exists, or description carries the fingerprint |
| npm | `csoai-gspc-mcp` | **BLOCKED** — WebAuthn account: `--otp` can never work, web login returns EOTP | `NPM_TOKEN` (granular, Bypass 2FA) — owner mints it | — |

The PyPI package source is vendored at `scripts/spray/pypi/csoai-gspc/` (it lived in no repository before 5 Sep 2026;
the 0.1.0 sdist on PyPI was the only copy). The vendored copy reads `totals.lid` live instead of carrying a typed lid.

## Reading the result

Each push prints the live URL and re-reads it until the `as_of` appears there (or says it did not). The table at the
end of a run, and `spray-report.json`, list per surface: `PUBLISHED`, `PUBLISHED-UNCONFIRMED`, `UNCHANGED`, `DRY-RUN`,
`BLOCKED` (no credential / owner action) or `FAILED` (with the error text). The daily workflow writes the same table
to the job summary and keeps the snapshot as an artifact for 30 days.

## Known discrepancies the snapshot reports rather than hides

- `n` on an axis (the graded count the board carries) and `bank rows` (what the frozen `items.jsonl` holds today) need
  not be equal; the README prints both. Jail and the eight fact axes keep their bank in another file (`goldbank_jail.json`,
  `pointers.jsonl`) — shown as `NO_ITEMS_JSONL`, not zero.
- Board data is printed by the payload as `CC-BY-4.0`; the GitHub mirror's LICENSE, the Kaggle listing and the Zenodo
  series say CC0. The spray keeps each surface's existing licence field untouched — reconciling that is an owner ruling.
