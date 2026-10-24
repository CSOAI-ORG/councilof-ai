# SILENT-ROUTE CANARY (brief G3.6) — THIN

A fixed set of canary prompts is sent to each major model endpoint once a day.
Each exact response body text is sha256-hashed (one hash per prompt); the
endpoint's **daily digest** is the sha256 of the sorted prompt-hash
concatenation. When an endpoint's daily digest changes versus its most recent
prior HASHED day, a **drift dry-run record** is appended.

Primary watch: **DeepSeek** — the post-2026-09-14 absorption watch. The canary
exists so that if a silent route/model swap happens, the output hash change is
observed the same day.

## What drift means — and does not mean

Drift is exactly one fact: **"the canary output hash changed."** Nothing more.
The harness never asserts that a model was "absorbed", "swapped", or "changed"
as a fact — interpretation stays human.

## Why THIN (doctrine lock)

All outputs are **unsigned observations**. Every row carries `label: "THIN"`.
THIN means:

- **never signed** — no Ed25519, no sigils, no JWS, no anchoring;
- **never publisher-wired** — nothing here is imported by or referenced from
  `scripts/publish_public_root.py` or any publisher path;
- promotion to a signed drift card requires the **7-day baseline** plus a
  **doctrine review**. Until then, drift records are explicitly marked
  `"dry run — drift cards are not signed or published in v0"`.

This is measurement, not certification.

## Layout

- `canary_config.json` — endpoint list (id, base_url, model, env_key, style)
  and the fixed canary prompt set. Endpoints without credentials are recorded
  as `UNAVAILABLE — credential not present`; results are never faked.
- `canary_run.py` — the harness. Stdlib only. Never raises on endpoint
  failure; errors are recorded as `ERROR` rows.
- `test_canary.py` — plain-python checks (config validity, digest determinism,
  drift fires on change, drift silent on same hash, UNAVAILABLE path, THIN on
  every artifact row, no signing/publisher imports).
- Artifacts: `public/interop/silent-route-canary-2026-09/baseline.jsonl`
  (one row per endpoint-day) and `drift-dryrun.jsonl` (drift dry-run records).

## Error records

Provider failures retain the existing status labels and a fixed diagnostic
category in `error.category`. HTTP failures may also carry a validated integer
`error.http_status`. Error response bodies, URLs, headers, exception messages
and dynamic exception names are discarded before either JSONL persistence or
console output. There is no raw-detail fallback.

Failed or unavailable calls keep `daily_digest: null` and never enter drift
comparisons as completed measurements. A partial run may retain hashes for
completed prompts, but its status remains an error. Successful hashes and
daily digest calculations are unchanged.

The regression suite uses synthetic errors, temporary output paths and a
blocked default network transport. It covers both stored rows and printed
output, including malformed JSON and credential-like text in provider errors:

```bash
python3 -B scripts/canary/test_canary.py
```

## Safe capture retention and PR proposal

The daily workflow retains a separate receipt from only the current invocation's
in-memory rows. Its explicit projection keeps configured endpoint/prompt IDs,
typed status/timing fields and validated hashes. It excludes model labels,
notes, bodies, URLs, headers and arbitrary error messages. Historical baseline
rows are never copied into this receipt.

Counts distinguish all endpoints hashed, partial capture and no hashed
endpoints. These are unsigned THIN observations. A retained file does not mean
successful measurement, publication, a protected merge or deployment.

The workflow uploads that single file for seven days before proposing the data.
Collector failure, missing output, failed upload or absent artifact ID blocks
the proposal step. The safe receipt survives a later drift-analysis or
publication failure without changing that failure into a successful job.

The delivery helper uses the existing normal branch push and one pull request.
It checks the configured remote and staged file scope; no force push is used.
Command output is private on failure: only a static stage and integer exit code
are retained. A rejected push stops before PR creation. A PR creation failure
fails the job. An existing PR must match repository, base, head branch and
exact commit, remain open, and have no automatic merge enabled.
The workflow also retains the safe delivery status for seven days.

The regression uses synthetic errors corresponding to the 23 October push
rejection, plus missing-retention and failed-publication controls. It does not
read failed provider logs/artifacts, use real credentials, rewrite historical
baseline data or bypass GitHub secret protection. Historical exposure review
remains with the credential owner.

Offline checks:

    python3 -B scripts/canary/test_canary.py
    python3 -B scripts/canary/test_canary_delivery.py

## Run

```bash
# real daily run (records whatever is actually reachable)
python3 scripts/canary/canary_run.py

# demonstration run: no network; synthesizes two fake days and shows
# drift detection firing into drift-dryrun.jsonl
python3 scripts/canary/canary_run.py --dry-run
```

The existing `canary-daily.yml` schedule remains daily at 03:17 UTC.

## Prompt design note

The prompt set is **static across days** (a fixed-token probe replaces the
weekday-named example from the brief). This keeps drift detection sound: with
static prompts, a daily-digest change can only come from the endpoint's output
changing, never from the prompt itself rotating.
