Frozen fixtures from the harness router run of 29 Sep 2026 (lanes pod
`/workspace/lanes/harness-router-20260929/fixtures/`, receipts chain head
`25f06d35a571b1311a28acc219932cfc4b040ad9f393cba50e1b7f5fad7e6057`). Copied byte-for-byte:

- `claim_diff.json` sha256 `e5421f9677574db1eda00ab2627664565398f56289c5f9d6b897a4550bea22ea` (26 hand-labelled pairs; lists are multisets at every depth)
- `change_detect.json` sha256 `742df1baf0803a355a4d79889e2020730cafdc958bc6bb041ac5a1944be79849` (61 cases: 36 real reg-watch events + synthetic)

The adopted winners are tested against them in `scripts/reg-watch-policy.test.mjs`,
`scripts/watch/test_provider_watch.py` and `scripts/reg-sources-watch/test_reg_sources_watch.py`.
Do not edit these files; re-run the router instead.
