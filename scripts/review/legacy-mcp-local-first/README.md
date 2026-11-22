# Legacy calculation MCPs: local-first correction review

4 November 2026. This is an owner-requested, scoped source-remediation kit, not a deployment or a clearance of every legacy package.

## Confirmed defects

The pinned SQL Builder and Music Production sources call a remote meter from their tools while the tool descriptions say no input data is transmitted. The meter sends an API key (including a configured environment key) and an empty tool label, not the calculation arguments. The source also promotes key prefixes without verification, tolerates malformed/failed metering, and offers an unused MAC helper with a shared public default key. The READMEs contain self-issued scores and generic compliance/readiness claims. The documented hyphenated executable differs from each package's declared underscore console entry.

These observations come from the inspected source, not acceptance of every claim in an external directory. They do not establish a personal-data breach, compromise, or malicious intent.

## Implemented candidates

The renderer reproduces four SQL source changes and five Music source changes. It does not change any package version, license, legal policy, live identity, model, payment system or production service.

- Default local mode sends no metering request, even when an API key is supplied or saved in the environment. Existing per-tool process-local limits remain: SQL 50 and Music 30 calls per rolling 86400-second window.
- `MEOK_ENABLE_REMOTE_METERING=1` explicitly enables metadata-only HTTPS metering. All keys are checked; prefixes confer no entitlement. Failures and malformed decisions refuse the calculation. Redirects and implicit environment proxies are disabled, response size and timeout bounded, and errors do not expose keys.
- The unused public-default MAC becomes an explicit-key helper, described as a MAC rather than independent signing or authority. This is a deliberate compatibility change for consumers that call that helper directly.
- All nine tool bodies and the local counter code are unchanged, checked through an AST comparison excluding docstrings and the removed unused duplicate meter helper. Runtime descriptions disclose the actual boundary. Readmes give the real console commands and withdraw unsupported self-scores/readiness/compliance assertions without changing formal legal documents.
- Music's static `detect_tempo.beat_timestamps` schema is corrected from scalar number to an array of numbers. Transport and SDK migration remain separate.

## Reproduce without touching an existing checkout

Use a trusted copy of this directory and trusted snapshots/checkouts of the pinned package revisions in `source-manifest.json`. Each input file is checked before any output directory is created. No network retrieval is performed by the runner.

```sh
python3 -B scripts/review/legacy-mcp-local-first/run_review.py \
  --sql-source /path/to/pinned/sql-builder-ai-mcp \
  --music-source /path/to/pinned/music-production-ai-mcp \
  --output /path/to/new-review-directory
```

Requires Python 3.10 or later. The output must not already exist. It receives candidate files, unified patches, original-source test runs, candidate test logs and a result register. A changed source, symlinked input file, changed kit module or mismatching candidate bytes refuses closure. An existing output is not overwritten. Do not run `build_candidates.py` directly against a working repository.

## Measured acceptance

On the author-operated Linux worker, each candidate passed 31 unittest cases, including all four SQL and all five Music calculation tools. Each unchanged baseline had five passes, 24 assertion failures and two errors for newly introduced interfaces. Those two errors are not claimed as independent behavioural proofs.

Six separate deliberately damaged copies were detected: default-mode bypass, prefix entitlement bypass, and accepting a truthy non-boolean `allowed` value, in each package. The targeted tests fail by assertions, not missing dependencies. A fresh kit replay reproduced every expected candidate byte. Existing destination, source mutation and file-symlink controls were refused before output.

The tests use synthetic inputs, stub MCP registration and mocked HTTPS replies with socket connection attempts blocked. This is NOT native-client, live-meter, freshly installed wheel or complete security qualification. A keyed MAC is not a trusted signature. The two applications share a test specification; do not treat 62 executions as 62 independent security properties.

## Existing work and publishing boundary

Each target package already has PR #1 for a distinct MCP SDK/wire migration. It touches the import in `server.py`, packaging and HTTP wrapper. Preserve that branch; compose and retest the privacy patch at the accepted new revision rather than weakening the source-pin checks.

The connected GitHub integration rejected direct legacy-repository writes with HTTP 403. These reproducible patches are retained in the canonical Council review lane instead. Creating or merging this review kit does not update the target repositories or PyPI. The authorised package owner must adopt the exact changes, resolve the existing migration, run SDK/stdio and built-wheel tests, publish a separately versioned release and verify its registry/install/readback. Do not rename the old released version as repaired or claim an external directory removed its warning.

Two other inspected repositories, AI BOM and Agent Prompt Injection Firewall, have different packaging/fallback/signing paths. They are NOT covered by this patch and must not receive a blind bulk replacement. This is not a fleet-wide safety certification.

Related ongoing Council work was checked before starting: #3840 derives npm release descriptions; #3882 removes typed press counts; #3837 repairs OOWM register queries; #3841 retains the native-host/worker experiment; #3829 is the separate public verifier entry fix; #3889 owns presence publication and retired dataset notices. Those are existing owner lanes, not changes made by this kit.

## Disclosure and next review

Do not publish a rebuttal to a directory until the relevant released artifacts have actually changed and been independently checked. No external messages or review requests were sent in this run. No raw personal prompts, credentials or customer records are part of this kit. No old evidence or user files were deleted.
