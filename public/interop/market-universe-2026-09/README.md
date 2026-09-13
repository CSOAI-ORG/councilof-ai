# Market-universe coverage map

This release separates the size of the available public market-data universe
from what CSOAI has actually measured.

`index.json` freezes a compact directory snapshot from public DefiLlama
endpoints, hashes each response, and compares those discovery counts with the
evidence already in this monorepo. Upstream directory rows are `INDEXED`, not
independent measurements. They are not signed, rooted, anchored, scored, or
certified by their presence in this file.

The first release exposes 24 missing measurement families. The highest-yield
first wave is DeFi protocols, DEXs, lending, yield pools, perpetuals, and
bridges. Each family must move through the same state ladder:

`DISCOVERED → INDEXED → OBSERVED → MEASURED → SIGNED → ROOTED → ANCHORED`

The map deliberately records zero for missing local readers. It does not turn
an upstream aggregate, directory listing, payment, or source claim into a
CSOAI measurement.

Rebuild from the current public endpoints:

```sh
python3 scripts/build_market_universe_gap_map.py
```

The generated `snapshot_sha256` covers the JSON body before that field is
added. Each source entry separately records the SHA-256 of the exact response
bytes observed during the run.
