# SOV3 — Python 3.11.0rc1 → 3.11.15 (final) upgrade (2026-06-02)

Closes the brittle `sitecustomize.py` torch shim. SOV3 (`sov3.service`, `:3101`, on
**meok-backend**) now runs on a stable interpreter; `get_int_max_str_digits` is native, so the
shim is gone by construction.

## What changed
- Was: `/home/nicholas/sov3/.venv` built on `/usr/bin/python3.11` = **3.11.0rc1**, which lacks
  `get_int_max_str_digits` → torch 2.12 `_dynamo` crashed on import → the shim faked it.
- Why not 3.10: numpy 2.4.6 / scipy 1.17.1 / scikit-learn 1.8.0 now require **Python ≥3.11**, so
  a 3.10 rebuild would force downgrades. Needed 3.11-final; the box only had 3.11.0rc1.
- Fix: used **uv** to fetch a standalone **CPython 3.11.15** (no system-python surgery), built a
  fresh venv, installed the exact 118-pin freeze, verified torch imports clean **without the
  shim**, then stopped→swapped→started (≈30s cold start) with a health-gate.
- Verified: running exe = `~/.local/share/uv/python/cpython-3.11.15-linux-x86_64-gnu/bin/python3.11`,
  `/health` 200, no shim in active venv, no torch errors in journal.

## ⚠️ Operational caveat (important)
The active venv (`/home/nicholas/sov3/.venv`) now **symlinks to the uv-managed interpreter** at
`~/.local/share/uv/python/cpython-3.11.15-…`. Do **not** run `uv python uninstall 3.11` or wipe
the uv cache, or SOV3's `.venv/bin/python` will dangle. (A future hardening: `make altinstall`
a system 3.11/3.12 and rebuild on that to drop the uv dependency.)

## Rollback (if ever needed)
The previous working venv is kept intact:
```
cd /home/nicholas/sov3
sudo systemctl stop sov3
mv .venv .venv-311final && mv .venv-rc1-bak2 .venv
sudo systemctl start sov3   # back on 3.11.0rc1 + shim
```
Once you're confident (a few days), reclaim ~5.5G: `rm -rf /home/nicholas/sov3/.venv-rc1-bak2`.

_Authored by Claude (Opus 4.8). Zero downtime during build; ~30s during the swap._
