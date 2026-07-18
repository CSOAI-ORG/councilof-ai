# MEOK · per-hive embodied policies (free-GPU training)

`meok_hive_mjx_colab.ipynb` — open in **Google Colab** (or Kaggle), set runtime to **GPU (T4)**, hit ▶.
Trains one **MuJoCo Playground (MJX + Brax PPO)** control policy **per hive** and exports
`meok_hive_policies.json` — ready for the King to Ed25519-sign into the ledger.

## Honest scope
- This is the **embodied / robotics** arm — locomotion/control policies. It is **NOT** the
  `sovereign-town` society sim that produces the flywheel's governed-vs-ungoverned `A_crimes`/`B_crimes`.
  It adds a **separate** signed record type (`hive_policy`).
- Free Colab/Kaggle GPU only — **cannot be run from the build host** (no GPU; needs your browser/login).
- `governed=True` hives keep the env safety/energy penalties on (the "sovereign" constraint);
  baseline hives relax them — that contrast is what MEOK Earth would surface as a new "Policies" layer.
- Playground's API moves fast; if a cell errors, cross-check the repo's `learning/` notebooks for the
  installed version. The per-hive harness + signed-export are the durable parts.

## Pipeline
1. Colab: train → download `meok_hive_policies.json`
2. King host: sign into ledger (`sign_lib.py`, prev + canonical json)
3. `meok-town-view`: extend `scripts/export-ledger.mjs` to merge `hive_policy` rows → `public/ledger-snapshot.json`
4. MEOK Earth: add a "Policies" layer (per-hive reward, governed vs baseline)
