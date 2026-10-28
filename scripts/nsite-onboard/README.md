# The N-site hunt — the lane's own code

The hunt lives on the Oracle micro at `~/lanes/nsite-onboard/`. Its code is mirrored here so the
lane is **reproducible from GitHub** and so a failure on a box whose disk is 95% full cannot take
the hunt's ability to restart itself with it.

| file | what it does |
|---|---|
| `onboard_one.py` | reads ONE surface: robots + homepage + search + sitemap, writes a content-addressed evidence bundle, appends a row to `done.jsonl` |
| `build_queue.py` | turns the source records into the ranked work queue |
| `build_registry_surfaces.py` | derives a source record of Layer O surfaces that exist but have never had PRESENCE measured |
| `build_greenfield_surfaces.py` | derives a source record from the sovereign-eater's site universe, so the queue keeps refilling |
| `build_presence_ledger.py` | verifies every evidence bundle against the digest its row pinned, and emits the ledger |
| `nsite_refill.sh` | keeps the queue fed; refuses to clear the stop marker when the rebuild yields nothing |

## The three rules this lane holds

1. **Known is not measured.** A surface in the registry is a place a listing could exist. Only a
   live read says whether CSOAI is on it.
2. **A dead lane says so.** The consumer of the lane's log (`~/.local/bin/nsites-live-pull.sh`)
   computes the remote log's mtime and writes `LANE STALE` when it has not moved for two hours.
   The lane stopped silently on 2026-09-29 and a puller copied the frozen log for 28 days.
3. **Evidence is content-addressed.** A run writes `evidence/<id>.<bundle_sha256>.json` as the
   copy of record. A domain can be onboarded more than once; under a domain-derived path the
   second run overwrote the first run's bytes and the first row's digest resolved to nothing.

## How to run it

    # on the Oracle micro
    python3 build_registry_surfaces.py     # Layer O surfaces never measured for presence
    python3 build_greenfield_surfaces.py   # the sovereign-eater universe
    python3 build_queue.py --registry ~/lanes/layer-o-registry \
        --sources ~/lanes/nsite-onboard/sources --out queue.jsonl
    python3 onboard_one.py                 # one surface; the cron drives it once a minute
    python3 build_presence_ledger.py       # verify every bundle, emit the ledger

The ledger is published to `public/interop/nsite-presence-ledger.json` and to the Busabase base
`nsite-presence` by `tools/sites/nsite_presence_publish.mjs` in this repository.
