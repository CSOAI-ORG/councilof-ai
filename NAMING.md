# CSOAI GSPC — the 12-benchmark suite, canonical naming (2026-08-05)

**One scheme, 12 benchmarks.** Distinct 3-letter codes under the `GSPC-` brand — ends the confusable
`-OAI` triplet (COAI/POAI/OMAI). Every benchmark is tagged **MEASURED / DRAFT / SPEC / PLANNED** so the
suite is 12-strong *and* nothing overclaims.

| # | Benchmark | Canonical | HF repo | Subdomain | Status | n / note |
|---|---|---|---|---|---|---|
| 1 | governance — EU AI Act risk-tier | **GSPC-GOV** | `csoai/gspc-gov` | gov.csoai.org | 🟢 MEASURED | n=24 |
| 2 | safety — calibrated refusal | **GSPC-AGI** | `csoai/gspc-agi` | agi.csoai.org | 🟢 MEASURED | n=14 |
| 3 | provenance — Art 50 marking survival | **GSPC-PRV** | `csoai/gspc-prv` | prv.csoai.org | 🟢 MEASURED | n=15 |
| 4 | continuity — post-quantum signing | **GSPC-ASI** | `csoai/gspc-asi` | asi.csoai.org | 🟢 MEASURED | n=13 |
| 5 | conformance — MCP tool honesty | **GSPC-MCP** | `csoai/gspc-mcp` | mcp.csoai.org | 🟢 MEASURED | n=11 |
| 6 | openness — licence vs intended use | **GSPC-OSS** | `csoai/gspc-oss` | oss.csoai.org | 🟢 MEASURED | n=13 |
| 7 | machinery — self-evolving safety fn | **GSPC-MACH** | `csoai/gspc-mach` | mach.csoai.org | 🟠 DRAFT | n=16, 14 Jan 2027 |
| 8 | care — care-cost / conduct | **GSPC-CARE** | `csoai/gspc-care` | care.csoai.org | 🟠 DRAFT | from conduct-bench + care-battery |
| 9 | cross-reality — XRAIV agent-vs-law | **GSPC-XR** | `csoai/gspc-xr` | xr.csoai.org | 🟠 DRAFT | harness built; sov34 run 0/8 |
| 10 | detector-interop — watermark matrix | **GSPC-DET** | `csoai/gspc-det` | det.csoai.org | 🔵 SPEC | 2 Feb 2027, ~190 signatories |
| 11 | Art 5 safeguard — NCII/CSAM effect. | **GSPC-ART5** | `csoai/gspc-art5` | art5.csoai.org | 🔵 SPEC | 2 Dec 2026, partner-gated corpus |
| 12 | swarm — multi-agent coordination | **GSPC-SWARM** | `csoai/gspc-swarm` | swarm.csoai.org | ⚪ PLANNED | empty repo — needs item bank |

**6 measured · 3 draft · 2 spec · 1 planned.** Master board: **csoai.org/benchmarks**. Papers: `csoai/gspc-papers`.

## Rules
- Canonical repo holds the **frozen items** (from the verified gen-2 `gspc-*bench`). Renames use
  `move_repo` → a **307 redirect** stays at every old name; no published URL breaks.
- Gen-3 traffic repos (`coai-bench`, `agisafe-bench`, …) become **results/mirror** repos carrying a
  `→ canonical: csoai/gspc-<code>` line; **not deleted** (they hold downloads).
- **Only MEASURED benchmarks quote a score.** DRAFT/SPEC/PLANNED are shown, named, and dated, but
  never fold into a headline mean and never publish an interval. `usable_n ≥ 30` still gates quoting.
- Each subdomain = one business package for that benchmark (measurement + quest + signed attestation).
  Subdomains are DNS (owner action, Cloudflare/Namecheap). Repos + endpoint are ready.

## Owner-only
- **`gspc-care-battery` rename off "CareBench"** (clinical child-safety collision) → folds into GSPC-CARE.
- **GSPC-SWARM** needs a real item bank (not fabricated here) or stays PLANNED.
- HF renames are **staged in `apply_canonical_names.py`** — fire once the HF token is restored to `.env`
  (it was reaped mid-session).

*Canonical as of 2026-08-05. Where any older map disagrees, this file wins.*
