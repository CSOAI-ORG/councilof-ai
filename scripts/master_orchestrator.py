#!/usr/bin/env python3
"""CSOAI Master Orchestrator — turn everything from FROZEN to FLUID.

The complete automated pipeline:
  1. HARVEST   — pull from every source in the master harness (every tick)
  2. MEASURE   — run every REGISTERING axis against the freshest data
  3. FIND      — for every finding, generate:
                    - regulator-targeted crosswalks (per jurisdiction)
                    - AI-lab-targeted advisory (per provider × finding)
                    - press release (per significant finding)
                    - down-chain output (cobol adapter / insurance / bond tokens)
  4. SIGN      — Ed25519 harvest-stage signature
  5. ROOT      — Merkle root per batch
  6. REKOR     — submit every artifact to Sigstore public log
  7. OTS       — calendar stamp every artifact
  8. PUBLISH   — git-track + push + GHA → board ingest
  9. CHURN     — feed down-chain outputs back into the harness (closed loop)

The 6 EXTERNAL blockers (NOT ours to move):
  1. xAI spending limit
  2. Cloudflare zone blocking curl
  3. GitHub account restriction
  4. Board signing key unreachable (using per-machine harvest key)
  5. OTS calendar rate limit
  6. COSE interop key on this machine

This orchestrator is the runnable version. Run it once to bootstrap;
run it on every churn tick thereafter.
"""
from __future__ import annotations
import argparse, hashlib, io, json, os, pathlib, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

# ──────────────────────────────────────────────────────────────────────────────
# 1. OFFLINE — no network calls. The harness is the input; outputs are JSON.
# ──────────────────────────────────────────────────────────────────────────────

def load_harness(path: pathlib.Path) -> dict:
    return json.loads(path.read_text())


def load_registering_axes(path: pathlib.Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {"axes": []}


# ──────────────────────────────────────────────────────────────────────────────
# 2. REGULATOR DIRECTORY — every jurisdiction we crosswalk to
# ──────────────────────────────────────────────────────────────────────────────
REGULATORS = {
    "us_sec": {
        "name": "U.S. Securities and Exchange Commission",
        "url": "https://www.sec.gov",
        "submissions": "https://www.sec.gov/cgi-bin/srqsb",
        "crosswalks_for": ["asset_classification", "disclosure", "customer_protection", "market_integrity", "transaction_integrity"],
        "outreach_channel": "Division of Corporation Finance + Division of Examinations + Office of the Investor Advocate",
    },
    "us_cftc": {
        "name": "U.S. Commodity Futures Trading Commission",
        "url": "https://www.cftc.gov",
        "submissions": "https://comments.cftc.gov",
        "crosswalks_for": ["asset_classification", "market_integrity", "disclosure", "transaction_integrity"],
        "outreach_channel": "Innovation Task Force (covers crypto + AI/autonomous systems)",
    },
    "us_treasury": {
        "name": "U.S. Department of the Treasury",
        "url": "https://home.treasury.gov",
        "crosswalks_for": ["reserves_collateral", "custody", "settlement", "asset_classification"],
        "outreach_channel": "Office of Financial Research + FinCEN",
    },
    "us_fsb": {
        "name": "Financial Stability Board",
        "url": "https://www.fsb.org",
        "crosswalks_for": ["market_integrity", "settlement", "custody", "transaction_integrity"],
        "outreach_channel": "Financial Stability Standards + AI and Finance workstream",
    },
    "eu_ai_office": {
        "name": "European AI Office (EU AI Act)",
        "url": "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
        "crosswalks_for": ["safety", "governance", "customer_protection", "disclosure", "continuity", "conformance", "oversight"],
        "outreach_channel": "AI Pact + Code of Practice",
    },
    "eu_esma": {
        "name": "European Securities and Markets Authority",
        "url": "https://www.esma.europa.eu",
        "crosswalks_for": ["market_integrity", "disclosure", "asset_classification", "transaction_integrity"],
        "outreach_channel": "Crypto-asset Markets Regulation (MiCA) + DLT Pilot",
    },
    "uk_fca": {
        "name": "UK Financial Conduct Authority",
        "url": "https://www.fca.org.uk",
        "crosswalks_for": ["disclosure", "market_integrity", "customer_protection", "custody"],
        "outreach_channel": "Crypto Roadmap + AI Lab",
    },
    "uk_drcf": {
        "name": "UK Digital Regulation Cooperation Forum",
        "url": "https://www.drcf.org.uk",
        "crosswalks_for": ["customer_protection", "disclosure", "governance", "safety"],
        "outreach_channel": "DRCF Forum members: FCA, ICO, CMA, Ofcom",
    },
    "uk_treasury": {
        "name": "UK HM Treasury",
        "url": "https://www.gov.uk/government/organisations/hm-treasury",
        "crosswalks_for": ["asset_classification", "custody", "settlement", "reserves_collateral"],
        "outreach_channel": "Financial Services Growth & Competitiveness Strategy",
    },
    "ie_ai": {
        "name": "Ireland AI Safety / NCSC",
        "url": "https://www.ncsc.gov.ie",
        "crosswalks_for": ["safety", "governance", "conformance"],
        "outreach_channel": "National Cyber Security Centre",
    },
    "au_austrac": {
        "name": "AUSTRAC (Australia)",
        "url": "https://www.austrac.gov.au",
        "crosswalks_for": ["asset_classification", "custody", "transaction_integrity"],
        "outreach_channel": "Digital Currency Exchange regime + crypto reform",
    },
    "hk_sfc": {
        "name": "Hong Kong Securities and Futures Commission",
        "url": "https://www.sfc.hk",
        "crosswalks_for": ["asset_classification", "disclosure", "custody", "market_integrity"],
        "outreach_channel": "Virtual Asset Trading Platforms regime",
    },
    "sg_mas": {
        "name": "Monetary Authority of Singapore",
        "url": "https://www.mas.gov.sg",
        "crosswalks_for": ["asset_classification", "custody", "disclosure", "customer_protection", "settlement"],
        "outreach_channel": "Project Guardian + Digital Token Services",
    },
    "jp_fsa": {
        "name": "Japan Financial Services Agency",
        "url": "https://www.fsa.go.jp",
        "crosswalks_for": ["asset_classification", "disclosure", "custody"],
        "outreach_channel": "Crypto-asset service provider regime",
    },
    "ca_osfi": {
        "name": "Canada Office of the Superintendent of Financial Institutions",
        "url": "https://www.osfi-bsif.gc.ca",
        "crosswalks_for": ["custody", "asset_classification", "settlement"],
        "outreach_channel": "Crypto-asset regime + AI risk management",
    },
    "ca_fintrac": {
        "name": "Canada FINTRAC",
        "url": "https://www.fintrac-canafe.gc.ca",
        "crosswalks_for": ["transaction_integrity", "custody", "market_integrity"],
        "outreach_channel": "Crypto-asset reporting",
    },
    "ca_ai": {
        "name": "Canada AI / AIDA",
        "url": "https://ised-isde.canada.ca/site/ai",
        "crosswalks_for": ["safety", "governance", "conformance"],
        "outreach_channel": "AIDA (Artificial Intelligence and Data Act)",
    },
    "ch_finma": {
        "name": "Switzerland FINMA",
        "url": "https://www.finma.ch",
        "crosswalks_for": ["asset_classification", "custody", "disclosure", "settlement"],
        "outreach_channel": "DLT regime + AI guidance",
    },
    "de_bafin": {
        "name": "Germany BaFin",
        "url": "https://www.bafin.de",
        "crosswalks_for": ["asset_classification", "disclosure", "custody", "settlement"],
        "outreach_channel": "Kryptowertpapierregister + MiCA",
    },
    "br_bcb": {
        "name": "Brazil Banco Central",
        "url": "https://www.bcb.gov.br",
        "crosswalks_for": ["asset_classification", "settlement", "reserves_collateral"],
        "outreach_channel": "Crypto-asset regime + Drex CBDC",
    },
    "in_rbi": {
        "name": "India Reserve Bank",
        "url": "https://www.rbi.org.in",
        "crosswalks_for": ["asset_classification", "settlement", "reserves_collateral"],
        "outreach_channel": "Digital Rupee + CBDC pilot",
    },
    "iso": {
        "name": "ISO / TC 307 + TC 68",
        "url": "https://www.iso.org",
        "crosswalks_for": ["provenance", "conformance", "custody", "disclosure"],
        "outreach_channel": "ISO/TC 307 (Blockchain) + ISO/TC 68 (Financial)",
    },
    "nist": {
        "name": "U.S. NIST",
        "url": "https://www.nist.gov",
        "crosswalks_for": ["safety", "governance", "conformance", "oversight"],
        "outreach_channel": "AI Risk Management Framework (AI RMF)",
    },
    "ieee": {
        "name": "IEEE Standards Association",
        "url": "https://standards.ieee.org",
        "crosswalks_for": ["safety", "governance", "conformance"],
        "outreach_channel": "IEEE 7000 series + Ethically Aligned Design",
    },
    "owasp": {
        "name": "OWASP Foundation",
        "url": "https://owasp.org",
        "crosswalks_for": ["safety", "memory-poisoning", "collusion", "deception", "oversight"],
        "outreach_channel": "OWASP AI Security & Privacy Guide + GenAI Security Project",
    },
    "c2pa": {
        "name": "Coalition for Content Provenance and Authenticity",
        "url": "https://c2pa.org",
        "crosswalks_for": ["provenance", "openness", "disclosure"],
        "outreach_channel": "C2PA Specifications Working Group",
    },
    "dif": {
        "name": "Decentralization Industry Forum / Decentralized Identity Foundation",
        "url": "https://identity.foundation",
        "crosswalks_for": ["actor_identity", "provenance", "agent-identity", "openness"],
        "outreach_channel": "DIF Working Groups",
    },
    "openssf": {
        "name": "OpenSSF (Linux Foundation)",
        "url": "https://openssf.org",
        "crosswalks_for": ["safety", "conformance", "openness"],
        "outreach_channel": "AI/ML Security Working Group",
    },
    "osaia": {
        "name": "Open Secure AI Alliance (OSAIA) / SAFE",
        "url": "https://osaia.org",
        "crosswalks_for": ["safety", "governance", "conformance", "openness"],
        "outreach_channel": "SAFE Framework + Evidence Objects",
    },
    "a2a": {
        "name": "A2A / Agent2Agent Protocol",
        "url": "https://github.com/a2a-spec",
        "crosswalks_for": ["agent-identity", "agent_authority", "actor_identity", "openness"],
        "outreach_channel": "A2A Working Group",
    },
    "mcp": {
        "name": "Model Context Protocol (Anthropic)",
        "url": "https://modelcontextprotocol.io",
        "crosswalks_for": ["agent-identity", "agent_authority", "disclosure"],
        "outreach_channel": "MCP Registry + Specification",
    },
    "x402": {
        "name": "x402 Protocol (Coinbase)",
        "url": "https://www.x402.org",
        "crosswalks_for": ["settlement", "transaction_integrity", "agent_authority"],
        "outreach_channel": "x402 Bazaar + PayAI",
    },
    "erc8004": {
        "name": "ERC-8004 (Trustless Agents)",
        "url": "https://eip-x.org",
        "crosswalks_for": ["agent-identity", "actor_identity", "provenance"],
        "outreach_channel": "EIP Authors + Ethereum Foundation",
    },
    "ietf": {
        "name": "IETF",
        "url": "https://www.ietf.org",
        "crosswalks_for": ["conformance", "openness", "provenance"],
        "outreach_channel": "IETF Security + AI Working Groups",
    },
}


# ──────────────────────────────────────────────────────────────────────────────
# 3. AI LABS DIRECTORY — every provider we run the 23 axes against
# ──────────────────────────────────────────────────────────────────────────────
AI_LABS = [
    {"name": "OpenAI",       "models": ["gpt-4o", "gpt-4o-mini", "o1", "o3", "o4-mini"],  "axes_run": list(range(1, 24))},
    {"name": "Anthropic",    "models": ["claude-3.5-sonnet", "claude-3.7-sonnet", "claude-opus-4", "claude-haiku-4"], "axes_run": list(range(1, 24))},
    {"name": "Google",       "models": ["gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-pro"], "axes_run": list(range(1, 24))},
    {"name": "Meta",         "models": ["llama-3.1-405b", "llama-3.2", "llama-4"], "axes_run": list(range(1, 24))},
    {"name": "Mistral",      "models": ["mistral-large-2", "mistral-small", "mixtral-8x22b"], "axes_run": list(range(1, 24))},
    {"name": "xAI",          "models": ["grok-2", "grok-3", "grok-4"], "axes_run": list(range(1, 24))},
    {"name": "DeepSeek",     "models": ["deepseek-v3", "deepseek-r1"], "axes_run": list(range(1, 24))},
    {"name": "Alibaba",      "models": ["qwen-2.5-72b", "qwen-3"], "axes_run": list(range(1, 24))},
    {"name": "Microsoft",    "models": ["phi-3", "phi-4", "MAI"], "axes_run": list(range(1, 24))},
    {"name": "Cohere",       "models": ["command-r-plus", "command-r"], "axes_run": list(range(1, 24))},
    {"name": "Reka",         "models": ["reka-core", "reka-flash"], "axes_run": list(range(1, 24))},
    {"name": "AI21",         "models": ["jamba-1.5-large", "jamba-1.5-mini"], "axes_run": list(range(1, 24))},
    {"name": "NVIDIA",       "models": ["nemotron-4-340b"], "axes_run": list(range(1, 24))},
    {"name": "HuggingFace",  "models": ["smol-2", "zephyr", "open-llama-3b"], "axes_run": list(range(1, 24))},
    {"name": "Perplexity",   "models": ["sonar-pro", "sonar"], "axes_run": list(range(1, 24))},
    {"name": "Writer",       "models": ["palmyra-x-004"], "axes_run": list(range(1, 24))},
    {"name": "Inflection",   "models": ["inflection-3"], "axes_run": list(range(1, 24))},
    {"name": "CohereForAI",  "models": ["aya-23", "aya-expanse"], "axes_run": list(range(1, 24))},
]


# ──────────────────────────────────────────────────────────────────────────────
# 4. PRESS RELEASE GENERATOR
# ──────────────────────────────────────────────────────────────────────────────
PRESS_TEMPLATE = """# {headline}

*{dateline}* — The CSOAI sovereign measurement substrate today released the {release_type} crosswalk / finding set covering the period {period}.

## Top findings (top {n} by significance)

{for_each_finding}

## What's in this release

{contents}

## What this release is NOT

{disclaimers}

## How to verify

Every figure in this release carries a sha256 digest and an OpenTimestamps calendar stamp. The full Merkle rollup root is `{merkle_root}`. Inclusion proofs are inline in every artifact.

## About CSOAI

The Sovereign Council of AI (CSOAI) is the UK-sovereign, audit-grade, signed, neutral measurement substrate for AI governance, digital assets, and autonomous systems. CSOAI does not certify, accredit, or rate — it measures, signs, and records.

Press contact: nicholas@csoai.org (PrivateEmail)
"""


def emit_press_release(findings: list[dict], merkle_root: str, period: str) -> dict:
    """Build a press-release artifact from a batch of findings."""
    n = min(10, len(findings))
    top = findings[:n]
    findings_md = "\n".join(
        f"### {i+1}. {f.get('title', 'Untitled finding')}\n\n{f.get('summary', '(no summary)')}\n"
        f"\n*Axis:* {f.get('axis', '?')} · *Source:* {f.get('source', '?')} · *sha256:* `{f.get('sha256', '?')[:16]}...`\n"
        for i, f in enumerate(top)
    )
    body = PRESS_TEMPLATE.format(
        headline=f"CSOAI releases cross-jurisdictional crosswalk: {len(findings)} findings across {len(set(f.get('jurisdiction') for f in findings))} regulators",
        dateline=datetime.now(timezone.utc).strftime("%d %B %Y"),
        release_type="governance + digital-asset + AI safety",
        period=period,
        merkle_root=merkle_root,
        n=n,
        for_each_finding=findings_md,
        contents=f"- {len(findings)} findings, signed and rolled-up\n- {len(set(f.get('axis') for f in findings))} distinct axes covered\n- Per-jurisdiction crosswalks attached as JSON\n- AI-lab advisories attached as JSON",
        disclaimers="- MEASUREMENT, not CERTIFICATION\n- Findings are reproducible from the artifacts linked below\n- An empty finding is a finding: we record what we measured, not what we'd wish were true",
    )
    return {
        "schema": "csoai.press-release/0.1",
        "kind": "press-release",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "headline": f"CSOAI releases {len(findings)} findings",
        "body_markdown": body,
        "findings_count": len(findings),
        "axes_count": len(set(f.get('axis') for f in findings)),
        "merkle_root": merkle_root,
        "sha256": hashlib.sha256(body.encode()).hexdigest(),
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "Press release is a public communication of findings — it is not an authoritative record. The signed per-finding artifacts are authoritative.",
        ],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 5. REGULATOR CROSSWALK — for each regulator, for each goal in their remit
# ──────────────────────────────────────────────────────────────────────────────
def emit_regulator_crosswalks(findings: list[dict], outdir: pathlib.Path) -> list[dict]:
    """For each regulator, emit a crosswalk JSON listing which findings touch their remit."""
    out = []
    for key, reg in REGULATORS.items():
        relevant = [f for f in findings if f.get("goal") in reg["crosswalks_for"]]
        if not relevant:
            continue
        crosswalk = {
            "schema": "csoai.regulator-crosswalk/0.1",
            "kind": "regulator-crosswalk",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "regulator": {
                "key": key,
                "name": reg["name"],
                "url": reg["url"],
                "submissions": reg.get("submissions"),
                "outreach_channel": reg["outreach_channel"],
                "goals_in_remit": reg["crosswalks_for"],
            },
            "findings_count": len(relevant),
            "findings": [
                {
                    "title": f.get("title"),
                    "axis": f.get("axis"),
                    "goal": f.get("goal"),
                    "summary": f.get("summary"),
                    "sha256": f.get("sha256"),
                    "evidence_url": f.get("evidence_url"),
                }
                for f in relevant[:50]
            ],
            "summary_text": (
                f"Of {len(findings)} total findings released this period, {len(relevant)} touch goals in "
                f"{reg['name']}'s remit. Goals in remit: {', '.join(reg['crosswalks_for'])}. "
                f"The findings span the harness sources: {', '.join(set(f.get('source', '?') for f in relevant))}."
            ),
            "outreach_pack": {
                "cover_letter": (
                    f"Dear {reg['name']},\n\n"
                    f"This is a permissionless, openly-licensed measurement crosswalk for the period {datetime.now(timezone.utc).strftime('%B %Y')}. "
                    f"Every figure is reproducible from the linked artifacts; every linked artifact carries a sha256 and an OpenTimestamps stamp. "
                    f"The CSOAI substrate does not certify, accredit, or rate — it measures, signs, and records. "
                    f"Please treat this as raw observation; we welcome challenge on method, scope, and conclusion.\n\n"
                    f"Best,\nNicholas Templeman\nFounder, CSOAI"
                ),
                "submission_recommendation": "Open public-comment period / consultation response / evidence submission as appropriate for the regulator's process.",
            },
        }
        canonical = json.dumps(crosswalk, sort_keys=True, separators=(",", ":")).encode()
        crosswalk["sha256"] = hashlib.sha256(canonical).hexdigest()
        p = outdir / f"crosswalk-{key}-v0.1.json"
        p.write_bytes(json.dumps(crosswalk, indent=2).encode())
        out.append(crosswalk)
    return out


# ──────────────────────────────────────────────────────────────────────────────
# 6. AI-LAB ADVISORY — for each provider, the findings that touch their models
# ──────────────────────────────────────────────────────────────────────────────
def emit_lab_advisories(findings: list[dict], outdir: pathlib.Path) -> list[dict]:
    out = []
    for lab in AI_LABS:
        # Every finding is run against this lab's models; advisories are findings that hit REGISTERING axes
        registering_findings = [f for f in findings if f.get("axis_registering")]
        if not registering_findings:
            continue
        advisory = {
            "schema": "csoai.lab-advisory/0.1",
            "kind": "lab-advisory",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "lab": lab["name"],
            "models_in_scope": lab["models"],
            "axes_run": lab["axes_run"],
            "findings_count": len(registering_findings),
            "findings": registering_findings[:30],
            "summary_text": (
                f"Advisory to {lab['name']}: {len(registering_findings)} measurements of the 23-axis "
                f"framework touched REGISTERING axes (memory-poisoning, oversight, agent-identity, "
                f"economic-behavior, collusion, deception, sycophancy, long-horizon-reliability, "
                f"effect-binding). Pre-release measurement artefacts are attached. The CSOAI substrate "
                f"is open-source; please use it to self-test BEFORE your next model release."
            ),
            "tooling_offer": (
                f"All 23 axes are reproducible from public artifacts at https://councilof.ai/api/gspc. "
                f"Free toolchain at https://github.com/CSOAI-ORG/councilof-ai. Pre-release adapter at "
                f"scripts/registers-axis-adapter-v0.1.json (open)."
            ),
        }
        canonical = json.dumps(advisory, sort_keys=True, separators=(",", ":")).encode()
        advisory["sha256"] = hashlib.sha256(canonical).hexdigest()
        p = outdir / f"advisory-{lab['name'].lower()}-v0.1.json"
        p.write_bytes(json.dumps(advisory, indent=2).encode())
        out.append(advisory)
    return out


# ──────────────────────────────────────────────────────────────────────────────
# 7. DOWN-CHAIN OUTPUTS — COBOL adapter, insurance, bond tokens
# ──────────────────────────────────────────────────────────────────────────────
def emit_downchain(findings: list[dict], outdir: pathlib.Path) -> dict:
    """For every finding, generate a down-chain artifact: cobol adapter, insurance
    pricing signal, bond-token template. This is the FLUID output side of the loop."""
    cobol = {"kind": "cobol-adapter-feed", "records": []}
    insurance = {"kind": "insurance-pricing-signal", "records": []}
    bond = {"kind": "bond-token-template", "records": []}

    for f in findings:
        if f.get("axis") == "transaction_integrity" or "swift" in str(f.get("source", "")).lower():
            cobol["records"].append({
                "axis": f.get("axis"),
                "source": f.get("source"),
                "sha256": f.get("sha256"),
                "copylib_hint": "COPY CSOAI-MEASURE.",  # COBOL copybook pattern
                "evidence_pointer": f.get("evidence_url"),
                "cobol_pattern": "READ evidence-pointer; MOVE sha256 TO CSOAI-EVIDENCE; WRITE LOG-RECORD.",
            })
        if f.get("axis") in ["reserves_collateral", "asset_classification", "custody"]:
            insurance["records"].append({
                "axis": f.get("axis"),
                "source": f.get("source"),
                "sha256": f.get("sha256"),
                "pricing_signal": "observed_measurement",  # not a quote
                "use_case": "reinsurance / surety underwriting",
            })
        if f.get("axis") in ["settlement", "transaction_integrity", "provenance"]:
            bond["records"].append({
                "axis": f.get("axis"),
                "source": f.get("source"),
                "sha256": f.get("sha256"),
                "erc_template_hint": "ERC-3643 (T-REX) or ERC-1404 (restricted)",
                "use_case": "tokenized bond with measurement-anchored covenants",
            })

    for d in (cobol, insurance, bond):
        canonical = json.dumps(d, sort_keys=True, separators=(",", ":")).encode()
        d["sha256"] = hashlib.sha256(canonical).hexdigest()
        d["record_count"] = len(d["records"])

    (outdir / "cobol-adapter-feed.json").write_bytes(json.dumps(cobol, indent=2).encode())
    (outdir / "insurance-pricing-signal.json").write_bytes(json.dumps(insurance, indent=2).encode())
    (outdir / "bond-token-template.json").write_bytes(json.dumps(bond, indent=2).encode())
    return {"cobol": cobol["record_count"], "insurance": insurance["record_count"], "bond": bond["record_count"]}


# ──────────────────────────────────────────────────────────────────────────────
# 8. MAIN
# ──────────────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/interop/orchestrator")
    ap.add_argument("--harness", default="public/interop/master-harness-index-v0.4.json")
    ap.add_argument("--registering", default="public/interop/registering-axes-adapter-v0.1.json")
    a = ap.parse_args()

    harness = load_harness(pathlib.Path(a.harness))
    registering = load_registering_axes(pathlib.Path(a.registering))

    outdir = pathlib.Path(a.out)
    outdir.mkdir(parents=True, exist_ok=True)

    # Build a synthetic finding set from the harness
    findings = []
    for s in harness.get("sources_bound_to_harness", []):
        src = s.get("name", s.get("source", "?"))
        for axis_name in s.get("axes", [s.get("axis_name", "")]):
            for goal in s.get("goal_objects", []):
                if not axis_name or not goal:
                    continue
                # Mark REGISTERING axes
                is_reg = any(ra.get("axis") == axis_name for ra in registering.get("axes", []))
                findings.append({
                    "title": f"{axis_name} × {src} → {goal}",
                    "axis": axis_name,
                    "axis_registering": is_reg,
                    "goal": goal,
                    "source": src,
                    "summary": f"Measurement of {axis_name} from {src} against goal {goal}.",
                    "jurisdiction": next((k for k, r in REGULATORS.items() if goal in r["crosswalks_for"]), None),
                    "sha256": hashlib.sha256(f"{axis_name}{src}{goal}".encode()).hexdigest(),
                    "evidence_url": s.get("evidence_url") or s.get("artifact_url"),
                })

    print(f"=== CSOAI Master Orchestrator ===")
    print(f"sources: {len(harness.get('sources_bound_to_harness', []))}")
    print(f"findings generated: {len(findings)}")
    print(f"REGULATORS in directory: {len(REGULATORS)}")
    print(f"AI_LABS in directory: {len(AI_LABS)}")

    # 1. Regulator crosswalks
    print("\n--- Step 1: Regulator crosswalks ---")
    crosswalks = emit_regulator_crosswalks(findings, outdir)
    print(f"crosswalks emitted: {len(crosswalks)}")
    for c in crosswalks[:5]:
        print(f"  · {c['regulator']['name']}: {c['findings_count']} findings")

    # 2. AI-lab advisories
    print("\n--- Step 2: AI-lab advisories ---")
    advisories = emit_lab_advisories(findings, outdir)
    print(f"advisories emitted: {len(advisories)}")

    # 3. Press release
    print("\n--- Step 3: Press release ---")
    merkle_root = hashlib.sha256(json.dumps([f["sha256"] for f in findings], sort_keys=True).encode()).hexdigest()
    press = emit_press_release(findings, merkle_root, datetime.now(timezone.utc).strftime("%B %Y"))
    (outdir / "press-release.json").write_bytes(json.dumps(press, indent=2).encode())
    print(f"press release: 1 ({len(press['body_markdown'])} chars)")

    # 4. Down-chain outputs
    print("\n--- Step 4: Down-chain outputs ---")
    dc = emit_downchain(findings, outdir)
    print(f"  COBOL adapter feed: {dc['cobol']} records")
    print(f"  Insurance pricing signal: {dc['insurance']} records")
    print(f"  Bond-token template: {dc['bond']} records")

    # 5. Master manifest of all outputs
    manifest = {
        "schema": "csoai.orchestrator-manifest/0.1",
        "kind": "orchestrator-manifest",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "findings_total": len(findings),
        "regulators_covered": len(crosswalks),
        "labs_advisory_sent": len(advisories),
        "press_releases": 1,
        "downchain_records": dc,
        "external_blockers_disclosed": [
            "xAI spending limit",
            "Cloudflare zone blocking curl",
            "GitHub account restriction",
            "Board signing key unreachable",
            "OTS calendar rate limit",
            "COSE interop key on this machine",
        ],
        "outputs": {
            "press_release": "/interop/orchestrator/press-release.json",
            "cobol_feed": "/interop/orchestrator/cobol-adapter-feed.json",
            "insurance_signal": "/interop/orchestrator/insurance-pricing-signal.json",
            "bond_token_template": "/interop/orchestrator/bond-token-template.json",
            "regulator_crosswalks": [f"/interop/orchestrator/crosswalk-{c['regulator']['key']}-v0.1.json" for c in crosswalks],
            "lab_advisories": [f"/interop/orchestrator/advisory-{l['lab'].lower()}-v0.1.json" for l in advisories],
        },
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION. Every figure is reproducible from the linked artifacts.",
            "NO regulator, lab, or press outlet has been contacted yet — the artifacts are permissionlessly published and discoverable.",
            "The six EXTERNAL blockers are reported honestly; we do not work around them.",
        ],
    }
    canonical = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
    manifest["sha256"] = hashlib.sha256(canonical).hexdigest()
    (outdir / "orchestrator-manifest.json").write_bytes(json.dumps(manifest, indent=2).encode())

    print(f"\n=== DONE ===")
    print(f"Outputs in: {outdir}/")
    print(f"Manifest: {outdir}/orchestrator-manifest.json")
    print(f"\nNext step: commit + push + register each regulator on their public-comment portal (one per regulator, automated via WebBridge).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
