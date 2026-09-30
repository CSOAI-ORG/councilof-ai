# Publication bus: every signed record we harvest reaches the public surfaces

Lane `publication-bus-20260925`. Code: `scripts/pubbus/`. The owner asked on 25 Sep 2026 for
"Layer 0 drive-through loops … all public parts, tooling, dashboards, end-user experience
complete". This lane builds four things:

1. **The bus** (`scripts/pubbus/pubbus.mjs`). It turns each signed evidence record into a public
   page, an llms.txt line, a sitemap entry and an IndexNow URL. Nobody types any of it.
2. **The public fleet summary** (`scripts/pubbus/publish-fleet-status.py`) and the `/status`
   rows that read it live.
3. **A gated auto-land/deploy pass** (`scripts/pubbus/auto-land.sh`). It is designed and
   written, but **not enabled**.
4. **A verifier door for these records.** `POST /api/verify` now also reads
   `csoai.signed-run/0.1` (`functions/_lib/signedRunVerify.ts`).

Doctrine the code holds:

- Census and probe records are **evidence linked from the GSPC board, never counted into it**.
  Nothing here reads or writes `/api/gspc` totals.
- UNMEASURED and refused records are published as such.
- No page shows a number its record did not publish.

## 1. The bus

Input, in order:

1. The signed evidence index `csoai/evidence-index` → `index.json`. Its own signature is checked
   first. On 25 Sep this answered HTTP 401: the dataset is not public yet.
2. A local index passed with `--index`.
3. Otherwise the known signed datasets: `mcp-remote-census`, `hf-mcp-spaces-census`,
   `a2a-card-census`, `mcp-contract-parity`, `cross-ledger-supply` and `agent-interop-census`.
   Each is read from the Hub tree at its current revision.

Per record:

1. Verify the `csoai.signed-run/0.1` signature. The key comes from
   `https://csoai.org/.well-known/did.json`. The check covers the payload digest and Ed25519,
   and runs a tamper control that must fail. Any failure → `REFUSED_SIGNATURE`.
2. Fetch the record the signature pins. Its sha256 must match, or → `REFUSED_BINDING`.
3. Read the OpenTimestamps state from the proof **bytes**: a pending tag, or a Bitcoin tag. Any
   `ots-upgraded/*/OTS-UPGRADE.json` receipt is also read.
4. Render `public/evidence/<slug>/<version>/index.html`. The page shows the signed payload
   verbatim (numbers are kept as written, so Python's `3600.0` stays `3600.0`), the limits the
   record states about itself, its identity (sha256 values, signature, pinned revision), its
   timestamp state, and a verify-it-yourself block (`POST /api/verify`, `sha256sum`,
   `ots verify`).
5. **Self-check.** If the page's visible text holds any number not found in the record, its
   signed document, its timestamp sidecar or receipt, or an identifier (version, revision), the
   page is refused (`REFUSED_RENDER`). The first real run caught exactly this: `3600` rendered
   from `3600.0`.
6. `public/evidence/<slug>/index.html` lists every version. The old version is marked
   **SUPERSEDED** with a reason: either a correction, when the new record's `supersedes_sha256`
   names it, or a later dated record. It is never deleted.
7. `public/evidence/published-records.json` is the manifest. `scripts/llms-txt.mjs` reads it
   through `{{EVIDENCE_RECORDS_SECTION}}` in both templates, and `/status` reads it too. Refusals
   are listed in it.
8. `council-os/pubbus/indexnow-pending.txt` accumulates changed URLs. The post-deploy step
   submits them with `node scripts/indexnow-submit.mjs --changed --file …` and then clears the
   file. The bus never submits.
9. `council-os/pubbus/listing-updates.json` holds 402index and Harness X rows for **new** LIVE
   doors in `council-os/capabilities.json`. The first run sets the baseline, and nothing is
   pending relative to it. The bus never calls a registry.

**Idempotent.** A version is keyed by the record's sha256. Re-running with the same inputs
writes nothing, even after the upstream Hub revision moves. The only in-place update is a
timestamp state that changed on the same bytes, such as a pending proof that was upgraded.

**Wiring needs no hand edits.** `scripts/generate-sitemap.mjs` already collects every static
`public/**/index.html` at its trailing-slash URL. `/evidence/<slug>/` needs no `_redirects`
rule, because Pages canonicalises the bare form. `PRIMARY_PATHS` applies only to SPA routes; these
pages are static. The SPA route `/evidence` (ContentReviewNotice) is untouched.

**First run, 25 Sep:** 13 records verified and published across 12 series. `agent-interop-census`
was refused as `REFUSED_UNSIGNED`: its CORRECTION.md and manifest carry no signature. The second
run wrote 0 files.

## 2. The public fleet summary and `/status`

`publish-fleet-status.py` reads `~/fleet/fleet_status.json` and `~/fleet/runpod_funding.json`
and writes one file, `fleet_status.public.json`, to the HF dataset `csoai/fleet-status`. The
output is a **whitelist**:

- per job: `id`, `state` and `last_ok`, which is the job's own signal time when it was last read
  OK;
- funding: GREEN, AMBER or RED, or UNMEASURED when the file is stale or missing.

Nothing else leaves:

- hostnames, commands, log lines, error text, balances, spend and runway;
- jobs on the owner's own workstation;
- jobs named for internal systems.

The publisher also refuses to write if any host string from its input appears in its output.
It uploads only on a change, or at most hourly.

`/status` (`client/src/pages/YieldStatus.tsx` + `client/src/lib/statusFeeds.ts`) adds five
groups, all read live with `cache: "no-store"`:

- **Fleet jobs**: a summary row plus a job table.
- **Funding**: a colour.
- **Evidence records**: one row per current version, plus the refusals.
- **Census as_of**.
- **Timestamps**: the site's `/interop/ots/manifest.json` counts, and each evidence proof's bytes
  read by the browser.

A source that cannot be read shows as **UNMEASURED with no figure**, never a cached one.

## 3. Gated auto-land (`scripts/pubbus/auto-land.sh`): designed, NOT enabled

One pass does the following:

1. Fetch the lane bundles in `~/lanes` that have a `<lane>.READY` marker. The marker is JSON:
   `{branch, head, base, tests[]}`.
2. Merge them **one at a time** onto canonical master. For each one, check that the bundle head
   equals the marker head, then run the lane's own tests. A conflict or a red test rejects that
   lane only.
3. Run the full gates on the merged tree. If any gate is red, nothing is deployed. The gates are:
   - npm ci
   - the custody guard and the bus tests
   - `llms-txt --check`
   - `build:client`
   - prerender (`--wait 900 --min 350`)
   - brand-gate
   - signed-json-guard
   - facts-gate
   - council-runtime-truth-gate
   - sitemap-truth-gate
   - pages-size-guard
4. Deploy with **an API token**, never the OAuth login.
5. Verify live. `/api/health` must answer, and board totals are compared with the values from
   before the pass. The served `published-records.json` must be byte-equal to the build, and the
   pending URLs must answer.
6. Only then push master and submit IndexNow. After that, clear the pending list.

**Where it can run unattended.** It needs at least 8 GB of RAM for build and prerender, and the
script refuses below that. **oracle-micro-2 (1 GB) cannot run it.** It can run on an HF Jobs
`cpu-upgrade` job or on a RunPod CPU pod.

**Owner asks, before `ENABLE_AUTO_LAND=1`:**

1. A Cloudflare API token scoped to **Account › Cloudflare Pages › Edit** for project
   `councilof-ai`, plus the account id. Store them as HF Jobs secrets (or pod secrets):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. The wrangler OAuth login rotates and expires,
   so it cannot deploy unattended.
2. A choice of runner: HF Jobs `cpu-upgrade` (billed per run) or a RunPod CPU pod. The script
   refuses below 8 GB.
3. A write path from that runner to the canonical mirror. Today the mirror is on oracle-micro-2,
   so this means an SSH key for `MASTER_SRC`. This is the landing role's single write, done after
   the site verifies live.
4. Turning it on: `ENABLE_AUTO_LAND=1` in the job's environment.

## 4. Fleet `jobs.yaml` rows (for the fleet supervisor lane to add; this lane installs no cron)

```json
{
 "id": "pubbus",
 "host": "oracle-micro-2",
 "schedule": "40 * * * *",
 "command": "cd $HOME/lanes/pubbus-run && git pull -q --ff-only && flock -n /tmp/pubbus.lock timeout 1500 node scripts/pubbus/pubbus.mjs --no-llms > $HOME/lanes/logs/pubbus.json 2> $HOME/lanes/logs/pubbus.err",
 "health": {"type": "file_mtime", "path": "~/lanes/logs/pubbus.json", "max_age_s": 7800},
 "supervise": "active",
 "cron_match": "scripts/pubbus/pubbus.mjs",
 "max_runtime_s": 1500,
 "outputs": ["public/evidence/**", "council-os/pubbus/indexnow-pending.txt", "council-os/pubbus/listing-updates.json"],
 "failover": [{"type": "hf_job", "name": "hf-cpu-basic", "flavor": "cpu-basic", "secrets": ["HF_TOKEN"]}],
 "failover_cooldown_s": 3600,
 "note": "writes only into its checkout; a lane commit + READY marker hands the pages to auto-land. --no-llms because llms-txt reads the live board and the landing pass regenerates it.",
 "class": "production"
},
{
 "id": "fleet-status-publish",
 "host": "oracle-micro-2",
 "schedule": "*/10 * * * *",
 "command": "sleep 90; flock -n /tmp/fleet-status-publish.lock timeout 300 python3 $HOME/lanes/pubbus/scripts/pubbus/publish-fleet-status.py >> $HOME/lanes/logs/fleet-status-publish.log 2>&1",
 "health": {"type": "hf_repo_fresh", "repo": "csoai/fleet-status", "repo_type": "dataset", "max_age_s": 7800},
 "supervise": "active",
 "cron_match": "publish-fleet-status.py",
 "max_runtime_s": 300,
 "outputs": ["hf://datasets/csoai/fleet-status/fleet_status.public.json"],
 "failover": [],
 "note": "runs 90 s after the supervisor's */10 pass; uploads only on change or hourly",
 "class": "production"
},
{
 "id": "auto-land",
 "host": "hf-jobs:csoai",
 "schedule": "15 */3 * * *",
 "command": "ENABLE_AUTO_LAND=1 bash scripts/pubbus/auto-land.sh",
 "health": {"type": "none"},
 "supervise": "dormant",
 "cron_match": null,
 "max_runtime_s": 5400,
 "outputs": ["https://councilof.ai (deploy)", "~/mirrors/councilof-ai.git master"],
 "failover": [],
 "note": "NOT ENABLED. Needs the owner's Pages:Edit API token + account id as job secrets, a >= 8 GB runner (hf cpu-upgrade or RunPod CPU pod), and a write key for the mirror.",
 "class": "production"
}
```

Cron lines, equivalent (Oracle):

```
40 * * * * cd $HOME/lanes/pubbus-run && git pull -q --ff-only && flock -n /tmp/pubbus.lock timeout 1500 node scripts/pubbus/pubbus.mjs --no-llms > $HOME/lanes/logs/pubbus.json 2> $HOME/lanes/logs/pubbus.err
*/10 * * * * sleep 90; flock -n /tmp/fleet-status-publish.lock timeout 300 python3 $HOME/lanes/pubbus/scripts/pubbus/publish-fleet-status.py >> $HOME/lanes/logs/fleet-status-publish.log 2>&1
```

## Tests

- `node --test scripts/pubbus/pubbus.node-test.mjs` (13). These cover:
  - publishing a verified record, with numbers held to the record;
  - idempotency, including when the upstream revision moves;
  - refusal on a bad signature, on a key that is not in the DID, and on a binding mismatch;
  - supersession;
  - an OTS upgrade applied in place;
  - UNSIGNED datasets;
  - an unreachable DID, which publishes nothing;
  - a template with no digits;
  - number tokens and slugs;
  - listing updates.
- `node --test scripts/custody-wording-guard.node-test.mjs` (7).
- `python3 scripts/pubbus/test_publish_fleet_status.py` (6).
- `vitest run client/src/lib/statusFeeds.test.ts` (8), which includes UNMEASURED with no figure
  when a source is unreachable.
- `vitest run functions/_lib/signedRunVerify.test.ts` (4), run against real committed signed
  records and the pinned key.
