#!/usr/bin/env python3
"""Build the SEVERED_BRAND_AUDIT_SEAL_2026-06-27.md with SHA-256 hashes."""
import hashlib
import os
from pathlib import Path

CLAWD = Path("/Users/nicholas/clawd")
AUDIT_DIR = CLAWD / "_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27"

# Map file → category (from the audit)
CATEGORIES = {
    "STATUS_2026-06-19_RALPH.md": "ARCHIVAL",
    "_TABS/ALIGNMENT_2026-06-08.md": "ARCHIVAL",
    "_TABS/_inventory/hive_assignment_2026-06-14.json": "ARCHIVAL",
    "_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl": "ARCHIVAL",
    "_TABS/_inventory/scripts/hive_triage.py": "ARCHIVAL",
    "_m4-handoff/MEOK_OS_index.html": "ARCHIVAL",
    "_TABS/_inventory/LOCAL_INVENTORY_2026-06-07.md": "ARCHIVAL",
    "sovereign-temple-public/training_data/care_episodes.json": "ARCHIVAL",
    "sovereign-temple-public/training_data/relationship_episodes.json": "ARCHIVAL",
    "_TABS/_inventory/csoai_org_repos.json": "ARCHIVAL",
    "sovereign-temple-public/data/finetune_jarvis.jsonl": "ARCHIVAL",
    "sovereign-temple-public/data/train_split.jsonl": "ARCHIVAL",
    "sovereign-temple-public/data/router_model.json": "ARCHIVAL",
    "sovereign-temple-public/sov3_ingest_research.py": "ARCHIVAL",
    "_TABS/_inventory/FULL_FLEET_RUNDOWN.jsonl": "ARCHIVAL",
    "_TABS/VERCEL_AUDIT_FULL_2026-06-10.md": "ARCHIVAL",
    "sovereign-temple-public/data/training_curated_2026-05-27.jsonl": "ARCHIVAL",
    "sovereign-temple-public/data/train.jsonl": "ARCHIVAL",
    "MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md": "RULE-DEFINING",
    "_intake/30_HIVE_ABSORPTION_DRAFT.md": "RULE-DEFINING",
    "_alignment/FULL_CONSOLIDATION_CHECKLIST_3JUL.md": "ARCHIVAL",
    "MEOK_33_WEEKS_2026-06-10.md": "ARCHIVAL",
    "_intake/SWARM_VALIDATION_D12.md": "ARCHIVAL",
    "_RESEARCH_REVIEW/github_repos_index/CSOAI-ORG_repos.md": "ARCHIVAL",
    "meok-labs-strategy.md": "ARCHIVAL",
    "docs/intelligence_partnership_strategy.md": "CONTAMINATION #4",
    "revenue/SESSION_2026-04-27_SHIPPED.md": "RULE-DEFINING (cleanup actions)",
    "revenue/COBOL_DOMINANCE_PLAN_2026-05-21.md": "ARCHIVAL",
    "revenue/OUTREACH_2026-05-28_AAIF_ANTHROPIC.md": "CONTAMINATION #11 (LOW)",
    "revenue/AUDIT_2026-04-27_MASTER.md": "RULE-DEFINING (cleanup actions)",
    "revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md": "CONTAMINATION #5",
    "revenue/BLOCKERS_2026-04-27.md": "RULE-DEFINING (cleanup actions)",
    "deliverables/snowflake-marketplace/provider_application.md": "CONTAMINATION #1 (CRITICAL)",
    "revenue/SCAN_OVERVIEW_2026-06-06.md": "ARCHIVAL (prior sweep)",
    "SOV3_REVENUE_EMPIRE.md": "CONTAMINATION #6",
    "sdk/unity/README.md": "CONTAMINATION #2 (CRITICAL)",
    "SITES-FIX-PLAN.md": "CONTAMINATION #9",
    "MEOK_MASTER_2026-06-23.md": "ARCHIVAL",
    "_archive/MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md": "RULE-DEFINING (archived)",
    "SOV3_ECOSYSTEM_REVENUE_STRATEGY.md": "CONTAMINATION #7",
    "VERCEL_CENSUS_2026-06-19.csv": "ARCHIVAL (data)",
    "scripts/smithery_rebase_audit.py": "CONTAMINATION #10 (LOW)",
    "_archive/DAY13-16/STATUS_DAY16.md": "ARCHIVAL",
    "CRITICAL_SYSTEM_FIXES.md": "CONTAMINATION #8",
    "scripts/deploy_verticals.py": "CONTAMINATION #3 (HIGH)",
    "MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md": "RULE-DEFINING (CANONICAL v2.0)",
    "_findings/CSOAI_MASTER_ABSORB_PLAN_2026-06-16.md": "ARCHIVAL",
    "_findings/csoai_reconstruct_tool.py": "ARCHIVAL",
}


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


# Build Section A table
lines = [
    "# 🐉 Severed-Brand Audit Seal — 2026-06-27",
    "",
    "**Date:** 2026-06-27",
    "**Authority:** Companion to SEVERED_BRAND_AUDIT_REPORT.md (this directory)",
    "**Seal method:** SHA-256 hash of every file scanned in the audit, before any fix applied",
    "**Purpose:** Tamper-evident record of file contents at audit time. After fix execution, compare SHA-256(after) values to confirm only intended files changed.",
    "",
    "---",
    "",
    "## Section A — /Users/nicholas/clawd/ (48 files)",
    "",
    "| SHA-256(before) | File | Category |",
    "|---|---|---|",
]

contam_count = 0
rule_count = 0
archival_count = 0
missing_count = 0

for f, cat in CATEGORIES.items():
    path = CLAWD / f
    if path.exists():
        h = sha256_of(path)
        lines.append(f"| `{h}` | `{f}` | {cat} |")
        if cat.startswith("CONTAMINATION"):
            contam_count += 1
        elif cat.startswith("RULE-DEFINING"):
            rule_count += 1
        elif cat.startswith("ARCHIVAL"):
            archival_count += 1
    else:
        lines.append(f"| `MISSING` | `{f}` | {cat} |")
        missing_count += 1

lines += [
    "",
    "---",
    "",
    "## Section B — /Users/nicholas/meok-sovereign-memory/ (79 files)",
    "",
    "All 79 files in this subtree are classified as ARCHIVAL (Gemini chat logs, Claude session transcripts, handoffs, training data) or RULE-DEFINING (`feedback_no_csga.md` + `NPM_ABUSE_REPORT_csga_global.md` + `MEMORY_main.md` reference the rule). Full SHA-256 manifest in `MEKOM_HASHES.txt`.",
    "",
    "## Section C — /Users/nicholas/meok-ai/ (3 files, all RULE-DEFINING)",
    "",
    "| SHA-256(before) | File | Status |",
    "|---|---|---|",
]

meok_ai_files = [
    "/Users/nicholas/meok-ai/ui/public/meok-os-v3/team-v3.html",
    "/Users/nicholas/meok-ai/ui/public/meok-os-v3/about-v3.html",
    "/Users/nicholas/meok-ai/ui/src/app/methodology/page.tsx",
]
for f in meok_ai_files:
    p = Path(f)
    if p.exists():
        h = sha256_of(p)
        lines.append(f"| `{h}` | `{f}` | RULE-DEFINING (KEEP) |")
    else:
        lines.append(f"| `MISSING` | `{f}` | RULE-DEFINING (KEEP) |")

lines += [
    "",
    "## Section D — csga-global GitHub org (WHOLE-ORG CONTAMINATION, pending Nick sign-off)",
    "",
    "| SHA-256 | Repo | Decision |",
    "|---|---|---|",
    "| private (no SHA-256 available publicly) | `CSGA-GLOBAL/COBOLBRIDGE` | Recommended: Option D (repurpose to `meok-defoneos-cobol-bridge-mcp`) + Option B (archive original) |",
    "| private (no SHA-256 available publicly) | `CSGA-GLOBAL/COBOLBRIDGEAI` | Recommended: Option B (archive) |",
    "",
    "---",
    "",
    "## AUDIT TOTALS",
    "",
    f"- **48 files** in /Users/nicholas/clawd/ classified → **{contam_count} CONTAMINATION + {rule_count} RULE-DEFINING + {archival_count} ARCHIVAL + {missing_count} MISSING**",
    "- **79 files** in /Users/nicholas/meok-sovereign-memory/ classified → **2 RULE-DEFINING + 77 ARCHIVAL**",
    "- **3 files** in /Users/nicholas/meok-ai/ classified → **3 RULE-DEFINING**",
    "- **2 repos** in csga-global org → **WHOLE-ORG CONTAMINATION** (decision pending Nick sign-off)",
    "",
    f"**TOTAL FORWARD-FACING CONTAMINATION SITES: {contam_count} file-level (clawd/) + 2 whole-org (csga-global).**",
    "",
    "## Sigil-ready footer",
    "",
    "Sealed: 2026-06-27 by Hermes subagent, working dir `/Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/`",
    "",
    "Pair this seal with the fix script's manifest: `/Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/FIX_MANIFEST.json` (generated by `contamination_fix_script.py --execute` after Nick sign-off).",
    "",
    "End of seal.",
]

(AUDIT_DIR / "SEVERED_BRAND_AUDIT_SEAL_2026-06-27.md").write_text("\n".join(lines))
print(f"Wrote seal: {AUDIT_DIR / 'SEVERED_BRAND_AUDIT_SEAL_2026-06-27.md'}")
print(f"Counts: {contam_count} contam + {rule_count} rule + {archival_count} archival + {missing_count} missing")
