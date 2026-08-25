# PUSH COUNCIL OS — OWEM/OOWM handoff (feeds Cursor / deploy lane)

The OWEM/OOWM measurement engine + 13-axis real measurement evidence is ready. This is the
deploy-lane handoff so Cursor can push the **branded, polished Council OS** front surface with all
**13 measured axes** in the SOV Signal index.

## What to emit + push (in order)
1. **Sign + publish the 13 per-axis signals** — `scripts/emit_sov_signal.py` (already in the repo,
   signs with `/root/.sovos/city_ed25519`, GX.2 estate key) ingests `/public/signals/*.signed.json`
   into `/public/signals/sov-signal.signed.json` (the SOV Signal index).
   - The estate already emits **8 axes**: gov, prv, care, affect, asi, mach, xr, det.
   - This batch adds the **5 missing**: `harness/owem/axis-signals-missing.json` (agi, art5, mcp,
     oss, swarm) in exact `csoai.axis-signal/0.1` schema, REAL data (MEASURED, real majority_baseline
     + sov_score from the live axis register + free sov-router). Copy each `axes[<ax>]` object to
     `public/signals/<ax>.signed.json`, then re-run the emitter → the index reports **13 measured of 13**.
2. **Verify the index** — `sov-signal.signed.json` should show `measured_axes: 13` + `total_signed_rows >= 13`
   + `not_a_certification: true`. Stranger-recompute the content_id + Ed25519 (estate pubkey).
3. **Board + surfaces** — ensure `/board`, `/api/gspc`, `/signals`, `/os` render the 13-axis signal
   rows + the honest `N measured of M` grammar. Honest UNTESTED jail row + honest zeros.
4. **Signed evidence** — the `harness/owem/axis_clusters.json` register + `card_pipeline.py` output
   (`measurement-card/0.1`) are the signed per-axis evidence; publish the cards under `/signed/` and
   verify via `/verify`.

## GX.2 (bind) — the signing key never travels
Workers produce worker-measurement signals (honest). The **estate** `emit_sov_signal.py` + the
board/index sign with `/root/.sovos/city_ed25519` (one place, node-local). Never move that key to a
worker; never publish a worker-key-signed artifact as estate-signed.

## Doctrine (bind)
JL.5 — a status that cannot be checked cannot say LIVE. UNMEASURED renders honestly. IY Wall 2 —
scenario-measurement, never forecast (SYNTHETIC-SIM labels). Measurement, not certification. Never
the scored. Ouroboros — never clobber a good score with a timeout-None.

## Files in scope (committed on os-production)
- `harness/owem/` — axis_cluster.py, oowm_gateway.py, card_pipeline.py, axis_clusters.json,
  agent-card.json, README.md, **axis-signals-missing.json** (5 axes feeding the index to 13).
- `functions/api/specialists.ts` — specialist-team catalog (13) + `metrics.sov_index_signal`.

Next: run `emit_sov_signal.py` on the build machine → `wrangler pages deploy` (councilof-ai /
csoai-verify). Cursor consumes this monorepo as the source of truth.
