# CSOAI GSPC — canonical benchmark naming (2026-08-05)

**One scheme. Ends the three-generations-live problem.** Distinct 3-letter codes under the `GSPC-`
brand — kills the confusable `-OAI` triplet (COAI / POAI / OMAI) that read as duplicates.

| # | Axis | Canonical brand | HF repo | Subdomain (business package) | Supersedes |
|---|---|---|---|---|---|
| 1 | governance  | **GSPC-GOV**  | `csoai/gspc-gov`  | gov.csoai.org  | gspc-govbench · coai-bench |
| 2 | safety      | **GSPC-AGI**  | `csoai/gspc-agi`  | agi.csoai.org  | gspc-defbench · agisafe-bench |
| 3 | provenance  | **GSPC-PRV**  | `csoai/gspc-prv`  | prv.csoai.org  | gspc-provbench · poai-bench |
| 4 | continuity  | **GSPC-ASI**  | `csoai/gspc-asi`  | asi.csoai.org  | gspc-pqcbench · asisec-bench |
| 5 | conformance | **GSPC-MCP**  | `csoai/gspc-mcp`  | mcp.csoai.org  | gspc-mcpbench · mcp-scoreboard |
| 6 | openness    | **GSPC-OSS**  | `csoai/gspc-oss`  | oss.csoai.org  | gspc-ossbench · omai-bench |
| 7 | machinery (DRAFT) | **GSPC-MACH** | `csoai/gspc-mach` | mach.csoai.org | (new — MachBench) |

Master surface: **csoai.org/benchmarks** (the seven-axis board). Papers: `csoai/gspc-papers`.

## Rules
- The **canonical repo holds the frozen items** (from the verified gen-2 `gspc-*bench`, which have the
  correct 90 items). Renames use `move_repo`, which leaves a **307 redirect** at every old name — no
  published URL breaks.
- The gen-3 traffic repos (`coai-bench`, `agisafe-bench`, …) become **results/mirror** repos with a
  card line `→ canonical: csoai/gspc-<code>`; they are **not deleted** (they carry downloads).
- **GSPC-MACH stays DRAFT** — n=16 < usable_n=30, not quotable, 3 disputed items excluded, awaiting
  legal review. It never folds into a headline mean.
- Each subdomain is one sector-agnostic **business package** for that axis (measurement + quest +
  attestation). Subdomains are DNS (owner action on Cloudflare/Namecheap); the repos are ready.

## Still owner-only
- `gspc-swarmbench` is **empty** (no data files) — populate with a real swarm/multi-agent item bank or
  delete. Not fabricated here.
- `gspc-care-battery` must **rename off "CareBench"** (collides with a clinically-validated child-safety
  benchmark) → folds under GSPC-AGI (safety) or its own `gspc-care` with a distinct title.

*Canonical as of 2026-08-05. Where any older map disagrees, this file wins.*
