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

## Run

```bash
# real daily run (records whatever is actually reachable)
python3 scripts/canary/canary_run.py

# demonstration run: no network; synthesizes two fake days and shows
# drift detection firing into drift-dryrun.jsonl
python3 scripts/canary/canary_run.py --dry-run
```

Daily cron one-liner:

```cron
17 6 * * * cd /path/to/councilof-ai && /usr/bin/python3 scripts/canary/canary_run.py >> public/interop/silent-route-canary-2026-09/cron.log 2>&1
```

## Prompt design note

The prompt set is **static across days** (a fixed-token probe replaces the
weekday-named example from the brief). This keeps drift detection sound: with
static prompts, a daily-digest change can only come from the endpoint's output
changing, never from the prompt itself rotating.
