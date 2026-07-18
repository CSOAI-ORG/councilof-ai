# 📊 DEFONEOS Datasets (the organic data corpus)

**Version:** 1.0 · 2026-06-28
**Author:** CSOAI LTD UK 16939677
**Location:** `35.242.143.249:/data/hive-data/` (UK sovereign)
**License:** OGL-3.0 (UK Open Government Licence) for the source data + MIT for the derived products

---

## The 77 GB organic data corpus (UK sovereign)

DEFONEOS ships with a 77 GB organic data corpus of UK government + EU open data, harvested from 30+ open sources on the VM at 35.242.143.249. All data is **OGL-3.0** or **free-open** licensed. The corpus powers the sovereign-town synthetic world + the 5 BFT scenario tests.

| # | Dataset | Size | Source | License | Use case |
|---|---|---:|---|---|---|
| 1 | **Land Registry price_paid** | 5.1 GB | HM Land Registry | OGL-3.0 | Defence housing (BAH), land ownership for base perimeter |
| 2 | **Companies House basic-company-data** | 3.1 GB | Companies House | OGL-3.0 | Defence supply chain (Babcock, BAE, QinetiQ suppliers) |
| 3 | **OS Open Names** | 2.3 GB | Ordnance Survey | OGL-3.0 | Place names for geoint situational awareness |
| 4 | **DfT Road Traffic Counts** | 1.1 GB | DfT | OGL-3.0 | Convoy route planning |
| 5 | **Companies House PSC** | 6.1 GB | Companies House | OGL-3.0 | Ultimate beneficial owners (UBO) for defence supply chain |
| 6 | **DVSA MOT 2024** | 3.5 GB | DVSA | OGL-3.0 | Defence vehicle fleet maintenance |
| 7 | **FSA Hygiene Ratings** | 138 MB | Food Standards Agency | OGL-3.0 | Defence catering (Babcock dockyard canteens) |
| 8 | **NHS Prescribing** | 61 MB | NHS | OGL-3.0 | Defence medicine (pharmacy stocks) |
| 9 | **EA Flood** | 6 MB | Environment Agency | OGL-3.0 | Base flood risk assessment |
| 10 | **HSE Construction Safety RIDDOR** | 312 KB | HSE | OGL-3.0 | Defence construction safety |
| 11 | **Met Office Station Data** | 2.1 MB | Met Office | OGL-3.0 | Base weather, ammo depot humidity |
| 12 | **DEFRA + OS + EA + Met + NHS + DVSA + HSE + FSA + Land Registry + Companies House + OS + INSPIRE + 19 more** | ~55 GB | UK + EU | OGL-3.0 / free-open | Multiple defence uses |

**Total: 77 GB organic data + 1.8 GB clawd_restore (Asimov V8 + WOLF + HARVI spec data) + 7+ GB synthetic data = ~85 GB sovereign data corpus.**

## The 1.8 GB clawd_restore (Asimov + WOLF + HARVI)

The physical R&D data extracted from the openpatent-hive IP archive:

- `Asimov_V8_CAD_Pack_MEOK.zip` (3.9 MB extracted to 18 MB / 165 files): 80 STL + 80 STEP + 4 docs + 1 README, SHA-256 `640963f6...07a35a`
- `WOLF 14 STLs` (the planetary actuator): 14 STL files for the WOLF-1 + WOLF-2 + WOLF-3 sets
- `HARVI rig spec` (the counter-IED rig): the IED sensor head spec + off-shelf parts list (£240 BOM)

## The sovereign-town synthetic world

A **shard-based** synthetic world built on top of the 77 GB organic data. Each shard is a composable data slice:

- **Babcock Devonport dockyard shard** — Sentinel-2 imagery + OS UK terrain + Copernicus Sentinel-1 SAR + Companies House ownership
- **Babcock Rosyth dockyard shard** — same composition
- **BAE Warton shard** — same composition
- **QinetiQ Boscombe Down shard** — same composition
- **RAF Coningsby shard** — Tempest GCAP + Typhoon + Sentinel-2 + Met Office station data
- **AUKUS Pillar 2 ranges** — Woomera (AU) + Pendine (UK) + Suffield (CA) — synthetic environment

The sovereign-town powers the 5 BFT scenario tests in `whitepapers/03_DEFONEOS_SIMULATION_FRAMEWORK_WHITEPAPER.md`.

## The 7+ GB synthetic data

- **Synthetic-data-factory output:** 532K synthetic records (text + JSON + CSV) for AI agent training
- **PSC synthetic:** 35K samples (Companies House Persons of Significant Control)
- **Synthetic care episodes:** consented, anonymized human-in-the-loop data (per `meok-universe/research/meok_human_research.md`)
- **Sovereign-town shards:** synthetic world compositions for the 5 BFT scenarios

## The licence chain

| Layer | Licence |
|---|---|
| Source UK government data | OGL-3.0 (free reuse with attribution) |
| Source EU open data | free-open + INSPIRE |
| Derived products (synthetic data, sovereign-town shards) | MIT (free reuse) |
| DEFONEOS MCPs | MIT |
| Whitepapers + datasheets | CC-BY-4.0 |
| DEFONEOS-SEAL signed credentials | MIT (verifiable on meok.ai/verify) |

## The data sovereignty story

All data is hosted on the sovereign VM at 35.242.143.249 (UK soil). No CLOUD Act exposure. No US/EU hyperscaler dependency. UK MOD procurement-grade compliance.

## How to access

```bash
# SSH to the VM (UK sovereign)
ssh meok-backend

# Browse the organic data corpus
ls /data/hive-data/

# Browse the clawd_restore (Asimov + WOLF + HARVI)
ls /data/clawd_restore/

# Browse the synthetic data + sovereign-town
ls /data/synth/
ls /data/hive-data/sovereign-town/
```

For UK MOD procurement officers, the data is accessible via the DEFONEOS-SEAL signed endpoint (per the Architecture Whitepaper §2).

---

*— MEOK AI Labs, 2026. The dragon owns the data. The data is sovereign.*

🐉 JEEVES → DEFONEOS.