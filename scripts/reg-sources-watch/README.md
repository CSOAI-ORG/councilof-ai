# reg-sources-watch: regulatory dockets and standards bodies as watched sources

Reaction-loop slice 4. It reads the machine-readable endpoints of the dockets and standards bodies that our dated
claims depend on (a comment deadline, a draft revision, a bill's outcome). When one of them changes, it records the
change as a `csoai.claim-watch-event/0.1` event.

It is **off by default**. It detects changes and does nothing else: it interprets nothing, files nothing, contacts
nobody and publishes nothing.

| File | What it is |
|---|---|
| `sources.json` | The source list: 47 endpoints, each with its family, parser, class (`record` or `feed`), our relation to it, and a human URL. |
| `reg_sources_watch.py` | The watcher. It uses the Python standard library only. Subcommands: `run`, `show`, `ca-outcomes`, `selftest`. |
| `run.sh` | The Oracle wrapper. It writes one log line per run and **exits DISABLED unless an `ENABLED` file sits next to it**. |
| `test_reg_sources_watch.py` | A pytest wrapper around the offline selftest. |

## Sources (as of 2026-09-28; `python3 reg_sources_watch.py show --sources sources.json` prints the full table)

| Family | Endpoints | Our relation |
|---|---|---|
| US Federal Register API (no key) | Treasury GENIUS Act NPRM 2026-16796 and docket TREAS-DO-2026-0496; FDIC OMB 3064-0225 notice 2026-14589 and any follow-up; CFTC compute-derivatives RFC 2026-17163 and RIN 3038-AF77; NIST NVD RFI 2026-16371; the 20 newest NIST AI documents | Treasury and CFTC: `MAY_COMMENT` (the owner decides). FDIC: `DRAFTED_FILING_UNVERIFIED` |
| regulations.gov API v4 | Dockets TREAS-DO-2026-0496 and CFTC-2026-1850, plus their posted-comment counts | as above |
| NIST | The NIST AI 200-2 ipd (TEVV-Athlon) page, for its stated comment period and PDF links, and the PDF itself, read by a 1 KiB ranged GET | `COMMENTED` (sent by email on 2026-09-26) |
| EU AI Office | The AI Office policy page's own "Last update" date, and the digital-strategy RSS filtered to AI items | `WATCH_ONLY` |
| UK | GOV.UK search and organisation APIs for the AI Security Institute and the data-protection regulator, and the aisi.gov.uk sitemap | `WATCH_ONLY` |
| IETF Datatracker | Every document named `*templeman*`, and the `doc.json` for draft-templeman-scitt-framing-space and draft-templeman-scitt-measurement-capsule | `OUR_DOCUMENT` |
| W3C | The Agent Conformance and Benchmarking CG: its group record (api.w3.org), blog feed and list-archive feed. Only links are kept, never names or addresses. | `LIST_CONTRIBUTOR` |
| California leginfo | The full history of 21 AI bills listed by three secondary sources; the Governor's action is read from the record's own words. Kept until 2026-10-15. | `WATCH_ONLY` |

These sources are **not repeated here**: EUR-Lex instruments and the legislation.gov.uk changes feed, including the
Data (Use and Access) Act 2025 changes. `scripts/reg-watch.mjs` already watches them.

## What a run writes

Everything goes under `DATA/<sealed_id>/`. This is the same store layout `claim_watch.py` uses, so
`scripts/claims/claim_events_export.py` reads it unchanged.

- `atom/atoms.jsonl`: one line per run holding every atom of every source that answered. `phase` is `primary`, or
  `partial` for an `--only`/`--family` run.
- `history/events.jsonl`: append-only and hash-linked (`prev_sha256`, `seq`). It gets one run event (`claim_id "*"`)
  every run, plus one event per source that is first seen, changes, becomes unreachable, or recovers.
- `history/review-queue.jsonl`: one line per change, for a human to read. It is separate from the correction
  `candidate-queue.jsonl`, because a docket moving is not a correction.
- `history/pin.json`: the atoms last observed.
- `observation/raw/<run_id>/`: the bytes of changed sources only, capped at 512 KiB each.

| Situation | object_state | change_state |
|---|---|---|
| First seen | OBSERVED | null |
| `record` source changed (for example a close date, a draft revision or a bill's last action) | OBSERVED | QUARANTINED: any claim read from it is held for review |
| `feed` source changed (new items) | OBSERVED | null, with `new_items` listed |
| Unreachable | UNCHECKABLE | null. This is never a change, and the pin is kept. |
| Recovered with the same atoms | OBSERVED | CONFIRMED |

Exit codes: 0 means no change, 2 means at least one change was recorded, 1 means the run failed.

## Keys

regulations.gov needs an api.data.gov key. The watcher reads it from `$REGS_GOV_API_KEY`, or from the file named by
`$REGS_GOV_API_KEY_FILE` (default `~/.secrets/regs_gov_api_key`). Without a key it uses `DEMO_KEY`, which allows
about 10 requests an hour; one run needs 4. A key never reaches a log, an atom, an event or an error string, and the
selftest checks this.

## Verified 2026-09-28 (Oracle)

- `selftest` PASS (offline). It covers the chain verifying the way the exporter verifies it, plus first-seen,
  unreachable, recovered, record change, feed change, no change, and key redaction.
- A live run of all 47 sources: 46 answered. The NIST PDF refused HEAD, so the parser was switched to a ranged GET,
  and it then answered 206.
- `claim_events_export.py export` (lane claim-events-feed) was run over the verification store: `ok: true`, 52 lines,
  all SEALED, every state accepted.

## Enabling (owner decision; HELD)

```
touch ~/lanes/regulatory-watch-20260928/ENABLED
( crontab -l; echo '40 7 * * * flock -n /tmp/reg-sources-watch.lock env FLOOR_ROOT_M=512 $HOME/lanes/bin/disk-floor.sh reg-sources-watch $HOME/lanes/logs/reg-sources-watch.log bash $HOME/lanes/regulatory-watch-20260928/run.sh >/dev/null 2>&1   # reaction-loop slice 4: regulatory dockets + standards; rc=2 = read history/review-queue.jsonl' ) | crontab -
```

The store defaults to `/evac-bulk/reg-sources-watch`. That keeps it out of the claim-events feed until the owner
decides otherwise; setting `REG_SOURCES_WATCH_DATA=/evac-bulk/claim-watch` joins the feed as a SEALED subject.
