#!/usr/bin/env python3
"""
MEOK Hive Triage — rule-based assignment of 419 repos to 10 master hives.

Reads:
  - /Users/nicholas/clawd/_TABS/_inventory/GITHUB_INVENTORY_2026-06-07.md (canonical inventory)
  - /Users/nicholas/clawd/MCP_DEPLOYMENT_MANIFEST.json (208 servers with metadata)

Writes:
  - /Users/nicholas/clawd/_TABS/_inventory/hive_assignment_2026-06-14.json

The 10 hives (in order of sovereign precedence):
  1. meok-keystone              — OLM core + keystone signer
  2. meok-governance-engine     — CSOAI governance + attestation
  3. meok-compliance-gateway    — MCP Fleet compliance (regulations)
  4. meok-api-gateway           — MCP Fleet utility/A2A
  5. meok-distribution          — SDKs, CLIs, apps
  6. meok-consumer              — MEOK ONE consumer OS
  7. meok-verticals             — trade/industry vertical products
  8. meok-aquaculture           — fish/koi/aqua care
  9. meok-research              — frontier research
 10. meok-templeman-opticians   — opticians family business

Special: meok-gaming-hive is the 11th (already exists, not absorbed here).
Special: 4 SEVERED (CSGA/Terranova) repos are NEVER touched.
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from datetime import datetime, timezone

INVENTORY_PATH = Path("/Users/nicholas/clawd/_TABS/_inventory/GITHUB_INVENTORY_2026-06-07.md")
MANIFEST_PATH = Path("/Users/nicholas/clawd/MCP_DEPLOYMENT_MANIFEST.json")
OUT_PATH = Path("/Users/nicholas/clawd/_TABS/_inventory/hive_assignment_2026-06-14.json")

HIVES = [
    "meok-keystone",
    "meok-governance-engine",
    "meok-compliance-gateway",
    "meok-api-gateway",
    "meok-distribution",
    "meok-consumer",
    "meok-verticals",
    "meok-aquaculture",
    "meok-research",
    "meok-templeman-opticians",
]

# Repos that are EXPLICITLY assigned (no rule needed)
EXPLICIT = {
    # Keystones (root substrate)
    "meok-attestation-api": "meok-keystone",
    "meok-attestation-verify": "meok-keystone",
    "sovereign-temple": "meok-keystone",
    "meok-ai": "meok-keystone",
    "OPENMOE": "meok-keystone",
    "clawd-workspace": "meok-keystone",
    "bft-progress-council-mcp": "meok-keystone",
    "consciousness-engine-mcp": "meok-keystone",
    "creativity-engine-mcp": "meok-keystone",
    "gods-eye-geospatial-mcp": "meok-keystone",
    "gods-eye": "meok-keystone",
    "meok-agent-zero": "meok-keystone",
    "meok-neural-learning": "meok-keystone",
    "homebrew-meokclaw": "meok-keystone",
    "templeman-opticians-site": "meok-templeman-opticians",
    # Gaming (already exists)
    "blizzard-wow-mcp": "meok-gaming-hive",
    "mmoagent-mcp": "meok-gaming-hive",
    "evergame-hive-mcp": "meok-gaming-hive",
    "gaming-ai": "meok-consumer",  # the AI-companion MCP, not the data hive
    # Consumer
    "invoice-generator-ai-mcp": "meok-consumer",
    "oneos-education": "meok-consumer",
    "voice-audio-mcp": "meok-consumer",
    # Aquaculture
    "fishkeeper": "meok-aquaculture",
    "koikeeper": "meok-aquaculture",
    "test-fishkeeper": "meok-aquaculture",
    "fishkeeper-ai": "meok-aquaculture",
    # Verticals
    "industrial-domains": "meok-verticals",
    "industrial-hire-ai": "meok-verticals",
    "wcr-grab-hire": "meok-verticals",
    "pokerhud": "meok-verticals",
    "diyhelp": "meok-verticals",
    "suicidestop": "meok-verticals",
    "asisecurity-portal": "meok-verticals",
    "bmcc-cyber": "meok-verticals",
    "loopfactory": "meok-verticals",
    # Opticians family business
    "templeman-opticians": "meok-templeman-opticians",
    "family-guardian": "meok-templeman-opticians",
    "maternal-covenant": "meok-templeman-opticians",
    "families": "meok-templeman-opticians",
    "care-homes": "meok-templeman-opticians",
    "faith": "meok-templeman-opticians",
    "compassion": "meok-templeman-opticians",
    "character-factory": "meok-templeman-opticians",
    "characters": "meok-templeman-opticians",
    "companions": "meok-templeman-opticians",
    "birth": "meok-templeman-opticians",
    "birth-ceremony": "meok-templeman-opticians",
    "family": "meok-templeman-opticians",
    "for-families": "meok-templeman-opticians",
    "maternal": "meok-templeman-opticians",
}

# Severed — NEVER touch
SEVERED = {
    "CSGA-CORP", "csga-platform", "terranova-platform", "Terranova"
}

# Rule-based triage (longest-pattern wins)
TRIAGE_RULES = [
    # Keystones (high priority)
    (r"meok-attestation", "meok-keystone"),
    (r"sovereign-temple", "meok-keystone"),
    (r"consciousness", "meok-keystone"),
    (r"creativity-engine", "meok-keystone"),
    (r"bft-progress", "meok-keystone"),
    (r"neural-learning", "meok-keystone"),
    (r"agent-zero", "meok-keystone"),
    (r"gods?-eye", "meok-keystone"),
    (r"meokclaw", "meok-keystone"),
    (r"meok-ai\b", "meok-keystone"),
    (r"^OPENMOE$", "meok-keystone"),
    (r"clawd-workspace", "meok-keystone"),
    (r"^clawd$", "meok-keystone"),

    # Governance (CSOAI + attestation + audit + policy)
    (r"csoai", "meok-governance-engine"),
    (r"councilof", "meok-governance-engine"),
    (r"charter", "meok-governance-engine"),
    (r"policy-eng", "meok-governance-engine"),
    (r"audit-log", "meok-governance-engine"),
    (r"a2a-govern", "meok-governance-engine"),
    (r"agent-handoff", "meok-governance-engine"),
    (r"agent-policy", "meok-governance-engine"),
    (r"agent-rate-limit", "meok-governance-engine"),
    (r"agent-data-residency", "meok-governance-engine"),
    (r"ca3o", "meok-governance-engine"),
    (r"casa-", "meok-governance-engine"),
    (r"^meok-attest", "meok-governance-engine"),
    (r"ai-self-audit", "meok-governance-engine"),
    (r"drone-airspace", "meok-governance-engine"),
    (r"ceasai", "meok-governance-engine"),
    (r"ca3o", "meok-governance-engine"),
    (r"sbom-", "meok-compliance-gateway"),
    (r"cra-annex", "meok-compliance-gateway"),
    (r"cra-art14", "meok-compliance-gateway"),
    (r"omnibus-tracker", "meok-compliance-gateway"),
    (r"watermark-attest", "meok-compliance-gateway"),
    (r"ap2-mandate", "meok-compliance-gateway"),
    (r"x402-receipt", "meok-compliance-gateway"),

    # Compliance fleet (regulations)
    (r"eu-ai-act", "meok-compliance-gateway"),
    (r"meok-eu-ai", "meok-compliance-gateway"),
    (r"\bdora\b", "meok-compliance-gateway"),
    (r"nis2", "meok-compliance-gateway"),
    (r"\bcra\b", "meok-compliance-gateway"),
    (r"gdpr", "meok-compliance-gateway"),
    (r"uk-gdpr", "meok-compliance-gateway"),
    (r"ccpa", "meok-compliance-gateway"),
    (r"cpra", "meok-compliance-gateway"),
    (r"lgpd", "meok-compliance-gateway"),
    (r"pipeda", "meok-compliance-gateway"),
    (r"popia", "meok-compliance-gateway"),
    (r"dpdpa", "meok-compliance-gateway"),
    (r"australia-privacy", "meok-compliance-gateway"),
    (r"hipaa", "meok-compliance-gateway"),
    (r"fda", "meok-compliance-gateway"),
    (r"mdr", "meok-compliance-gateway"),
    (r"mhra", "meok-compliance-gateway"),
    (r"samd", "meok-compliance-gateway"),
    (r"pci-dss", "meok-compliance-gateway"),
    (r"pci-", "meok-compliance-gateway"),
    (r"iso-42001", "meok-compliance-gateway"),
    (r"iso-42005", "meok-compliance-gateway"),
    (r"iso-27001", "meok-compliance-gateway"),
    (r"iso-9001", "meok-compliance-gateway"),
    (r"iso-13485", "meok-compliance-gateway"),
    (r"soc2", "meok-compliance-gateway"),
    (r"^soc-", "meok-compliance-gateway"),
    (r"cobol", "meok-compliance-gateway"),
    (r"nrswa", "meok-compliance-gateway"),
    (r"agent-content-watermark", "meok-compliance-gateway"),
    (r"agent-incident", "meok-compliance-gateway"),
    (r"airspace-monitor", "meok-compliance-gateway"),
    (r"agriculture-robotics", "meok-compliance-gateway"),
    (r"ai-incident", "meok-compliance-gateway"),
    (r"clinical-trials", "meok-compliance-gateway"),
    (r"contract-review", "meok-compliance-gateway"),
    (r"healthcare-ai-governance", "meok-compliance-gateway"),
    (r"healthcare-fhir", "meok-compliance-gateway"),
    (r"patient-safety", "meok-compliance-gateway"),
    (r"6amld", "meok-compliance-gateway"),
    (r"aml-", "meok-compliance-gateway"),
    (r"pci-", "meok-compliance-gateway"),
    (r"data-classification", "meok-compliance-gateway"),
    (r"yaml-ai-mcp", "meok-compliance-gateway"),
    (r"^healthcare-", "meok-compliance-gateway"),
    (r"^healthcare$", "meok-compliance-gateway"),
    (r"data-privacy", "meok-compliance-gateway"),
    (r"accountability", "meok-compliance-gateway"),
    (r"safetyof", "meok-compliance-gateway"),
    (r"accountabilityof", "meok-compliance-gateway"),
    (r"dataprivacyof", "meok-compliance-gateway"),
    (r"ethicalgovernanceof", "meok-compliance-gateway"),
    (r"openmoe\.ai", "meok-compliance-gateway"),
    (r"openmore", "meok-compliance-gateway"),

    # Domain-vertical compliance (where the vertical IS the compliance story)
    (r"energy-ai", "meok-compliance-gateway"),
    (r"energy$", "meok-compliance-gateway"),
    (r"maritime", "meok-compliance-gateway"),
    (r"mining", "meok-compliance-gateway"),
    (r"space-ai", "meok-compliance-gateway"),
    (r"smart-cities", "meok-compliance-gateway"),
    (r"sports-analytics", "meok-compliance-gateway"),
    (r"telecom", "meok-compliance-gateway"),
    (r"real-estate", "meok-compliance-gateway"),
    (r"insurance-ai", "meok-compliance-gateway"),
    (r"construction-ai", "meok-compliance-gateway"),
    (r"employment-ai", "meok-compliance-gateway"),
    (r"^employment", "meok-compliance-gateway"),
    (r"legal-?tech", "meok-compliance-gateway"),
    (r"^legal-tech", "meok-compliance-gateway"),
    (r"financial-ai", "meok-compliance-gateway"),
    (r"^financial", "meok-compliance-gateway"),
    (r"media-ads", "meok-compliance-gateway"),
    (r"media-advertising", "meok-compliance-gateway"),
    (r"media$", "meok-compliance-gateway"),
    (r"law-enforcement", "meok-compliance-gateway"),
    (r"biometrics", "meok-compliance-gateway"),
    (r"retail-ai", "meok-compliance-gateway"),
    (r"^retail", "meok-compliance-gateway"),
    (r"travel-hospitality", "meok-compliance-gateway"),
    (r"threat-intelligence", "meok-compliance-gateway"),
    (r"red-team", "meok-compliance-gateway"),
    (r"vulnerability-scan", "meok-compliance-gateway"),
    (r"secure-comms", "meok-compliance-gateway"),
    (r"dsrb-defence", "meok-compliance-gateway"),
    (r"quantranet", "meok-compliance-gateway"),

    # Aquaculture
    (r"fishkeeper", "meok-aquaculture"),
    (r"koikeeper", "meok-aquaculture"),
    (r"aqua", "meok-aquaculture"),

    # Verticals (trade/industry)
    (r"industrial", "meok-verticals"),
    (r"grab.?hire", "meok-verticals"),
    (r"wcr", "meok-verticals"),
    (r"muckaway", "meok-verticals"),
    (r"pokerhud", "meok-verticals"),
    (r"diyhelp", "meok-verticals"),
    (r"suicidestop", "meok-verticals"),
    (r"asisecurity", "meok-verticals"),
    (r"bmcc-cyber", "meok-verticals"),
    (r"loopfactory", "meok-verticals"),

    # Consumer
    (r"invoice", "meok-consumer"),
    (r"oneos-education", "meok-consumer"),
    (r"^education", "meok-consumer"),
    (r"voice-audio", "meok-consumer"),
    (r"^voice", "meok-consumer"),
    (r"pet-care", "meok-consumer"),
    (r"sleep-tracker", "meok-consumer"),
    (r"qidi-printer", "meok-consumer"),
    (r"music-production", "meok-consumer"),

    # Family/Opticians
    (r"family-guardian", "meok-templeman-opticians"),
    (r"maternal-covenant", "meok-templeman-opticians"),
    (r"^family", "meok-templeman-opticians"),
    (r"^families", "meok-templeman-opticians"),
    (r"for-families", "meok-templeman-opticians"),
    (r"care-homes", "meok-templeman-opticians"),
    (r"^care-", "meok-templeman-opticians"),
    (r"^care$", "meok-templeman-opticians"),
    (r"^faith", "meok-templeman-opticians"),
    (r"^birth", "meok-templeman-opticians"),
    (r"companion", "meok-templeman-opticians"),
    (r"character", "meok-templeman-opticians"),
    (r"compassion", "meok-templeman-opticians"),
    (r"templeman", "meok-templeman-opticians"),
    (r"optician", "meok-templeman-opticians"),
    (r"domiciliary", "meok-templeman-opticians"),

    # Gaming (the data moat)
    (r"mmo", "meok-gaming-hive"),
    (r"\bwow\b", "meok-gaming-hive"),
    (r"ffxiv", "meok-gaming-hive"),
    (r"\beve\b", "meok-gaming-hive"),
    (r"osrs", "meok-gaming-hive"),
    (r"poe-", "meok-gaming-hive"),
    (r"diablo", "meok-gaming-hive"),
    (r"minecraft", "meok-gaming-hive"),
    (r"steam", "meok-gaming-hive"),
    (r"twitch", "meok-gaming-hive"),
    (r"blizzard", "meok-gaming-hive"),
    (r"wowmcp", "meok-gaming-hive"),
    (r"^hive-mmo", "meok-gaming-hive"),

    # Research / frontier
    (r"mavis", "meok-research"),
    (r"oasf", "meok-research"),
    (r"autonomous-vehicles", "meok-research"),
    (r"^autonomous", "meok-research"),
    (r"drone", "meok-research"),
    (r"airspace", "meok-research"),
    (r"qidi", "meok-research"),
    (r"3d-?print", "meok-research"),
    (r"llama", "meok-research"),
    (r"^context7", "meok-research"),
    (r"digital-human", "meok-research"),
    (r"homebrew", "meok-research"),
    (r"ai-economy", "meok-research"),
    (r"ai-economy-infra", "meok-research"),
    (r"agriculture-ai", "meok-research"),
    (r"aws-cloud", "meok-research"),
    (r"^aws$", "meok-research"),
    (r"kubernetes", "meok-research"),
    (r"^k8s$", "meok-research"),
    (r"^ai-act-cliff", "meok-research"),

    # Distribution (SDKs, CLIs, frameworks)
    (r"meok-sdk", "meok-distribution"),
    (r"meok-cli", "meok-distribution"),
    (r"meok-integrations", "meok-distribution"),
    (r"meok-skills", "meok-distribution"),
    (r"meok-setup", "meok-distribution"),
    (r"meok-fleet", "meok-distribution"),
    (r"lib2b", "meok-distribution"),
    (r"openmcp", "meok-distribution"),
    (r"mcp-distributor", "meok-distribution"),
    (r"mcp-servers", "meok-distribution"),
    (r"pmcp-gateway", "meok-distribution"),
    (r"mcp-stack", "meok-distribution"),
    (r"meok-compliance-gateway", "meok-compliance-gateway"),
    (r"^meok-attest", "meok-distribution"),
    (r"web-research", "meok-distribution"),
    (r"clipboard-ai", "meok-distribution"),
    (r"cli-builder", "meok-distribution"),
    (r"github-api", "meok-distribution"),
    (r"gitlab-api", "meok-distribution"),
    (r"notion-workspace", "meok-distribution"),
    (r"linear-issues", "meok-distribution"),
    (r"google-drive", "meok-distribution"),
    (r"slack-messaging", "meok-distribution"),
    (r"meok-slack", "meok-distribution"),
    (r"meok-teams", "meok-distribution"),
    (r"meok-vscode", "meok-distribution"),

    # Utility/A2A (default for tool-y things)
    (r"ascii-art", "meok-api-gateway"),
    (r"blockchain-ai", "meok-api-gateway"),
    (r"code-executor", "meok-api-gateway"),
    (r"code-review", "meok-api-gateway"),
    (r"csv-analytics", "meok-api-gateway"),
    (r"fetch-http", "meok-api-gateway"),
    (r"filesystem-ops", "meok-api-gateway"),
    (r"json-transformer", "meok-api-gateway"),
    (r"jwt-ai", "meok-api-gateway"),
    (r"keyword-extractor", "meok-api-gateway"),
    (r"langfuse", "meok-api-gateway"),
    (r"openchronicle", "meok-api-gateway"),
    (r"password-ai", "meok-api-gateway"),
    (r"plagarism", "meok-api-gateway"),
    (r"proofof-ai", "meok-api-gateway"),
    (r"rag-knowledge", "meok-api-gateway"),
    (r"regex-ai", "meok-api-gateway"),
    (r"resume-parser", "meok-api-gateway"),
    (r"sql-builder", "meok-api-gateway"),
    (r"survey-builder", "meok-api-gateway"),
    (r"agent-prompt-injection", "meok-api-gateway"),
    (r"agent-cost", "meok-api-gateway"),
    (r"agent-commerce", "meok-api-gateway"),
    (r"ad-copy", "meok-api-gateway"),
    (r"ad-copy-ai", "meok-api-gateway"),
    (r"accessibility", "meok-api-gateway"),
    (r"accounting", "meok-api-gateway"),
    (r"config-validator", "meok-api-gateway"),
    (r"data-snap", "meok-api-gateway"),
    (r"data-snapshot", "meok-api-gateway"),
    (r"docs-?", "meok-api-gateway"),
    (r"n8n", "meok-api-gateway"),
    (r"explainability", "meok-api-gateway"),
    (r"git-operations", "meok-api-gateway"),
    (r"^git$", "meok-api-gateway"),
    (r"^docker", "meok-api-gateway"),
    (r"docker-compose", "meok-api-gateway"),
    (r"self-healing", "meok-api-gateway"),
    (r"sentry", "meok-api-gateway"),
    (r"pgvector", "meok-api-gateway"),
    (r"postgres", "meok-api-gateway"),
    (r"sqlite", "meok-api-gateway"),
    (r"redis", "meok-api-gateway"),
    (r"mcp-ensemble", "meok-api-gateway"),
    (r"playwright", "meok-api-gateway"),
    (r"puppeteer", "meok-api-gateway"),
    (r"brave-search", "meok-api-gateway"),
    (r"sequential-thinking", "meok-api-gateway"),
    (r"time-zones", "meok-api-gateway"),
    (r"vercel-deploy", "meok-api-gateway"),
    (r"vercel$", "meok-api-gateway"),
    (r"^api$", "meok-api-gateway"),
    (r"awesome-meok", "meok-api-gateway"),
    (r"^token", "meok-api-gateway"),
    (r"^kubernetes", "meok-api-gateway"),
    (r"^ollama", "meok-api-gateway"),
    (r"abci-bridge", "meok-api-gateway"),
    (r"^anthropic", "meok-api-gateway"),
    (r"^open$", "meok-api-gateway"),
    (r"^github$", "meok-api-gateway"),
    (r"^meok-fleet", "meok-api-gateway"),
    (r"mcp-dashboard", "meok-api-gateway"),
    (r"mcp-registry", "meok-api-gateway"),
    (r"memory-graph", "meok-api-gateway"),
    (r"meok-shared-infrastructure", "meok-api-gateway"),
    (r"^meok-", "meok-api-gateway"),  # default catch-all for meok-* (utility/ai)
    (r"^-mcp$", "meok-api-gateway"),
    (r"-mcp$", "meok-api-gateway"),
    (r"-ai-mcp$", "meok-api-gateway"),
    (r"-ai$", "meok-api-gateway"),
    (r"^ai-", "meok-api-gateway"),
    (r"^CSOAI$", "meok-api-gateway"),
    (r"^MEOK-LABS$", "meok-api-gateway"),
    (r"^Open$", "meok-api-gateway"),
    (r"^.github$", "meok-api-gateway"),
    (r"^domain-sales", "meok-api-gateway"),
    (r"^github-api$", "meok-api-gateway"),
    (r"anthropic-registry", "meok-api-gateway"),
    (r"^registry", "meok-api-gateway"),
    (r"^anthropic-cookbook", "meok-api-gateway"),
]


def parse_inventory():
    """Parse the inventory file into (section_title, repo_name) tuples."""
    content = INVENTORY_PATH.read_text()
    sections = re.split(r'\n## ', content)
    repos = []
    for s in sections[1:]:
        lines = s.split('\n', 1)
        title = lines[0].strip()
        body = lines[1] if len(lines) > 1 else ''
        if 'SEVERED' in title:
            continue
        names = re.findall(r'\*\*([^*]+)\*\*', body)
        for n in names:
            repos.append((title, n))
    return repos


def triage(repo_name: str) -> str:
    """Assign a repo to a hive using explicit overrides, then rule-based triage."""
    if repo_name in SEVERED:
        return None  # never touched
    if repo_name in EXPLICIT:
        return EXPLICIT[repo_name]
    # Try rules in order — first match wins
    # Sort by pattern length (longest first) so more specific matches win
    for pattern, hive in sorted(TRIAGE_RULES, key=lambda x: -len(x[0])):
        if re.search(pattern, repo_name, re.IGNORECASE):
            return hive
    # Default: api-gateway (most general utility/A2A hive)
    return "meok-api-gateway"


def main():
    repos = parse_inventory()
    print(f"Parsed {len(repos)} repos from inventory")

    # Build assignment
    assignments = []
    hive_counts = Counter()
    rule_hits = Counter()
    explicit_hits = 0
    fallback_hits = 0

    for section, name in repos:
        if name in SEVERED:
            continue
        if name in EXPLICIT:
            hive = EXPLICIT[name]
            explicit_hits += 1
        else:
            matched = False
            for pattern, hive in sorted(TRIAGE_RULES, key=lambda x: -len(x[0])):
                if re.search(pattern, name, re.IGNORECASE):
                    rule_hits[pattern] += 1
                    matched = True
                    break
            if not matched:
                hive = "meok-api-gateway"
                fallback_hits += 1
        assignments.append({
            "repo": name,
            "section": section,
            "hive": hive,
        })
        hive_counts[hive] += 1

    # Read the manifest for cross-reference
    manifest = json.loads(MANIFEST_PATH.read_text())
    manifest_names = {s["name"]: s for s in manifest["deployable_servers"]}

    # Cross-link: mark which manifest entries match which inventory repos
    for a in assignments:
        a["in_manifest"] = a["repo"] in manifest_names
        if a["in_manifest"]:
            a["manifest_hive"] = manifest_names[a["repo"]].get("hive", "none")
            a["manifest_language"] = manifest_names[a["repo"]].get("language", "?")

    # Stats
    print(f"\n=== Triage stats ===")
    print(f"  total repos triaged: {len(assignments)}")
    print(f"  explicit assignments: {explicit_hits}")
    print(f"  rule-based assignments: {sum(rule_hits.values())}")
    print(f"  fallback (api-gateway): {fallback_hits}")
    print(f"  in MCP manifest: {sum(1 for a in assignments if a['in_manifest'])}")
    print(f"\n=== Hive distribution ===")
    for hive, count in hive_counts.most_common():
        print(f"  {hive}: {count}")

    # Output
    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": "hive_triage.py",
        "source_inventory": str(INVENTORY_PATH),
        "source_manifest": str(MANIFEST_PATH),
        "total_repos": len(assignments),
        "hive_count": len(HIVES),
        "hives": HIVES,
        "explicit_assignments": EXPLICIT,
        "severed_repos_never_touched": list(SEVERED),
        "rule_hits": dict(rule_hits),
        "hive_distribution": dict(hive_counts),
        "fallback_count": fallback_hits,
        "manifest_present": sum(1 for a in assignments if a["in_manifest"]),
        "assignments": assignments,
    }
    OUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"\nWrote {OUT_PATH}")
    print(f"  size: {OUT_PATH.stat().st_size} bytes")


if __name__ == "__main__":
    main()
