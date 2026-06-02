# SOV3 outage + fix — 2026-06-02 (the rc1-python torch landmine)

## What happened
Restarting `sov3.service` (during task #59, to bind :3101 to localhost) took SOV3 down.
The HOST change was NOT the cause — the restart exposed a latent landmine.

## Root cause
- The VM's `/usr/bin/python3.11` is **3.11.0rc1** (a release CANDIDATE), which lacks
  `sys.get_int_max_str_digits` / `set_int_max_str_digits` (added in 3.11.0 **final**).
- torch 2.12.0+cu130's `_dynamo` polyfills require those functions (with exact signatures)
  at import → import crashed → SOV3 couldn't bind :3101.
- SOV3 had run for ages only because the OLD process held a working torch in memory; ANY
  restart was a landmine. (Likely an overnight retrain's pip touched torch.)

## Fix (applied, live)
A tiny reversible shim — `sovereign-temple/sov3_sitecustomize_shim.py` → installed as
`/home/nicholas/sov3/.venv/lib/python3.11/site-packages/sitecustomize.py`. It injects the two
missing `sys` functions with the EXACT signatures torch checks. Auto-loads on every venv-python
start, so future restarts are safe. Verified: `import torch._dynamo` OK, sov3 health 200.

## Proper long-term fix (do in a maintenance window)
Upgrade the interpreter off rc1 — either install python3.11-final / 3.12 and rebuild the venv,
or rebuild the venv on `python3.10` (3.10.12, already on the box, already has the functions).
Then the shim can be removed. Venv is 5.5GB / 122 pkgs — plan ~30 min.

## Lesson
SOV3 was "do-not-restart" until this. Now restart-safe via the shim. meok-one (the product)
stayed UP throughout (cloud-backed); only SOV3-backed memory/private-brain degraded during the gap.
