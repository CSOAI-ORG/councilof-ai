# CSOAI business observations

Runs on the existing mill using Python's standard library and no inference calls.
Every 15 minutes it observes the canonical revenue, GSPC, root, hub-card and x402
catalogue APIs, plus loopback worker health, available Ollama models and workspace
free space. Five official regulatory sources refresh every six hours. The curated
calendar covers 12–26 September 2026; refresh it after that window.

It is a private operating report, not a public score, legal determination, independent
chain audit or investor traction claim. The existing evidence admission and public
publication pipelines remain authoritative. HTTP 200 does not establish freshness,
index inclusion, card validity or paid delivery. Source text changes are review
candidates only; dynamic page text can produce false positives.

Missing observations remain null. Failed source requests retain a dated last-good
hash, explicitly separate from the failed current attempt. Revenue uses the endpoint's
non-listed-wallet, nonzero aggregates and exact six-decimal USDC unit. A wallet absent
from the configured self-wallet list is not proof of an independent organic customer.
Repeat payers, ARR, retention and margin remain unmeasured. Snapshots retain at most 1,440 observations;
raw responses keep only the latest attempt and are capped at 4 MiB per endpoint.

## Run and validate

```sh
python3 -m unittest discover -s scripts/business-operations -p 'test_*.py' -v
python3 scripts/business-operations/observe.py --state /tmp/csoai-observations
# On the existing pod, include the mill's loopback diagnostics:
python3 scripts/business-operations/observe.py --mill --state /workspace/csoai-operations/state
```

Inspect `latest.json`, `DASHBOARD.md`, `sources.json`, and `raw/`. `observed_at`
older than 30 minutes is a missed heartbeat even if the last report was green.
The snapshot's status and alerts report operational failures; the process exits
successfully when it has written an observation, including an unavailable observation.
Unexpected execution failures exit nonzero and leave the prior timestamp unchanged.
The cron discards stdout/stderr, so use freshness and a manual invocation for diagnostics.

## Installation and recovery

Copy this directory to a staging directory on the existing pod, then run
`python3 install.py` to inspect the proposed crontab. `--apply` installs the exact
hashed files under `/workspace/csoai-operations/releases/<hash>/` and adds a single
15-minute job. Tests run before crontab mutation. Reinstallation is idempotent.
Unrelated jobs remain intact. `--retire-command` comments out only an exact matching
cron command; pass each explicitly after auditing it. `--watchdog /path/to/watchdog.sh`
adds `OLLAMA_MODELS=/workspace/ollama-models` to that existing cron invocation,
without changing or restarting the watchdog or worker.

The installer saves the previous crontab and installation receipt. To roll back,
review the current crontab and remove the tagged observer line, restore only the
retired lines you intend to restore, and remove the added watchdog environment
assignment if appropriate. Do not blindly restore an old complete crontab over
other operators' later changes. `/workspace` keeps files across pod replacement;
cron itself belongs to the container and must be reinstalled after replacement.
No pod start command, image, GPU allocation, public endpoint, secrets or signing
boundary is changed. Monitoring the pod from outside remains necessary to detect
pod or scheduler downtime.

`indexes.py` reuses the monorepo's `scripts/interop/x402-bazaar-audit.py` reader,
shipped with the installed release and included in its hash manifest. It walks
both PayAI and Coinbase CDP through their advertised totals, comparing observed
entries with the live x402 catalogue. Multi-page offset reads are mutable and do
not prove absence; unseen routes stay indeterminate. An hourly cron checks whether a daily scan is due;
failed scans retry no more than once per six hours, retain last-good results as
historical, and have a 15-minute process timeout. No challenge, purchase, listing
submission or upload is made. `indexes.json` records attempts and last-good
observation separately. This does not classify index metadata as current or stale.

Source-change flags remain pending across later unchanged or failed reads. After
reviewing the changed official text, an operator can clear that source's `changed`
flag in `sources.json` while holding `observer.lock`; preserve the last-good hash
and record the review separately. The observer does not silently clear a review item.
