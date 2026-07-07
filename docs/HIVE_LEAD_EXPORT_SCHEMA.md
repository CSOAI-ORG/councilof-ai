# Hive Lead-Export Schema — the contract that feeds the outreach gate

> **For M4 / JEEVES.** This is the exact JSON shape `scripts/hive-recon.mjs` ingests. Export the
> ~2000-lead universe in this schema and run the gate — every account gets scored, played, and
> demo-tailored *before* any outreach (Nick's hard rule). **Internal file — never commit to `public/`.**

## Run it
```bash
HIVE_ACCOUNTS=/path/to/leads.json npm run hive:recon
# → prints coverage summary + writes docs/hive-recon-report.json (internal)
# → does NOT touch public/ when HIVE_ACCOUNTS is set (boundary guard)
```

## Format
A JSON **array** of account objects, or `{ "accounts": [ ... ] }`. One object per **organisation**
(never a private individual — org-level only, per DISTRIBUTION_HIVE §7).

## Fields
| Field | Type | Req | Notes / how scoring uses it |
|---|---|---|---|
| `id` | string | ✅ | unique slug, e.g. `"jpmorgan"` |
| `name` | string | ✅ | display name |
| `type` | enum | ✅ | `regulator` \| `government` \| `fortune100` \| `fortune500` \| `global2000` \| `sector`. `regulator`/`government` → **authority** (play=align, not a target). |
| `region` | string | ✅ | e.g. `EU`, `US`, `APAC` |
| `country` | string | ✅ | display |
| `hq` | `[lng, lat]` | ✅* | globe pin. *Required to appear on the coverage overlay; rows without it still score. |
| `jurisdictions` | string[] | ✅ | keys → in-scope regimes. Supported: `eu, us, uk, sg, kr, cn, ca`. |
| `sector` | enum | ⬜ | drives framework derivation for enterprise rows. Supported: `banking, insurance, finance, health, pharma, defence, ai-lab, telecom, energy, publicsector`. |
| `frameworks` | string[] | ⬜ | explicit in-scope regimes. If omitted, derived from `jurisdictions` + `sector`. |
| `posture` | enum | ✅ | `none` \| `emerging` \| `mature` \| `unknown` \| `sets-rules` (authorities). Sets the modeled current-state when no known vendor. |
| `currentVendor` | string | ✅ | lowercase. Known competitors: `vanta, drata, credo-ai, onetrust, internal`. Anything else / `unknown` / `n/a` → treated as unknown. |
| `source` | string | ✅ | public citation (their domain / trust page / filing). Every row must cite. |

## How the play is decided (deterministic)
- `type` regulator/government **or** `posture: sets-rules` → **align** (we implement their regime).
- `currentVendor` is a **known** competitor → **displace** (scored vs that vendor's cited battlecard).
- else `posture: none` → **absorb**; else → **integrate**.
- **confidence**: `verified` (known vendor) · `authority` · else `modeled` (flagged — needs recon).

## Honesty rules (enforced as gates — the run fails if violated)
1. **`displace` requires a known real vendor.** Never label an account as displacing a competitor unless `currentVendor` is a cited public fact. The harness rejects `displace` without a known vendor.
2. **`currentVendor` / `posture` must be cited-public**, else leave `unknown` → the row scores as `modeled` and is flagged for per-account recon before it's contacted.
3. Every row needs `source`. No invented facts.
4. All axis scores 0–3; every account resolves ≥1 in-scope framework; scoring is deterministic.

## Worked example
```json
[
  {
    "id": "jpmorgan", "name": "JPMorgan Chase", "type": "global2000",
    "region": "US", "country": "USA", "hq": [-73.98, 40.75],
    "jurisdictions": ["us", "eu"], "sector": "banking",
    "frameworks": [], "posture": "mature", "currentVendor": "unknown",
    "source": "jpmorganchase.com/about/governance"
  },
  {
    "id": "example-saas", "name": "Example SaaS Ltd", "type": "sector",
    "region": "EU", "country": "Germany", "hq": [13.4, 52.5],
    "jurisdictions": ["eu"], "sector": "finance",
    "frameworks": [], "posture": "emerging", "currentVendor": "vanta",
    "source": "example.com/trust"
  }
]
```
Row 1 → derives `dora, eu-ai-act, basel-ai, nis2` (+ US) from banking+jurisdiction; posture mature, no vendor → **integrate (modeled)**.
Row 2 → on Vanta → **displace (verified)**, scored vs Vanta's cited weak axes (agentic / verifiable-proof / sovereignty).

## After the run
- Review `docs/hive-recon-report.json` → `summary.byConfidence`. **`modeled` rows need per-account recon** (fill `currentVendor`+`posture` with cited facts) before outreach.
- Only then does outreach begin — every account already scored and demo-tailored.
