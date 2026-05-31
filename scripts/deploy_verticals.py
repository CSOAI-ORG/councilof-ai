#!/usr/bin/env python3
"""
CSOAI Vertical Mass Deployment Script
Generates MCP tools, A2A agent cards, and frontend integration for N verticals.
Usage: python3 deploy_verticals.py
"""
import os
import json
import shutil
from pathlib import Path

BASE = Path("/Users/nicholas")
MEOK = BASE / "meok-ai"
CLAWD = BASE / "clawd"

VERTICALS = [
    {
        "id": "pokerhud",
        "name": "pokerhud.ai",
        "domain": "Poker Analytics & GTO Solver",
        "agent_name": "Poker Intelligence Agent",
        "description": "Real-time GTO analysis, player profiling, leak detection, and EV optimization for professional poker players.",
        "tools": [
            ("analyze_hand", "Analyze poker hand history for GTO deviations and EV loss", [
                ("hand_history", "string", "Poker hand history text or JSON"),
                ("game_type", "string", "nlh, plo, mixed"),
            ]),
            ("profile_player", "Build behavioral profile from session data", [
                ("session_data", "string", "JSON array of hands played by target"),
                ("player_id", "string", "Player identifier"),
            ]),
            ("detect_leaks", "Identify strategic leaks in player's game", [
                ("player_stats", "string", "Aggregated stats JSON (VPIP, PFR, 3B, etc.)"),
                ("stakes", "string", "Micro, Low, Mid, High"),
            ]),
            ("calculate_ev", "Calculate expected value for a decision tree", [
                ("decision_tree", "string", "JSON decision tree with ranges"),
                ("board", "string", "Board cards (e.g., AsKdQh)"),
            ]),
            ("solver_query", "Query GTO solver database for spot solutions", [
                ("spot", "string", "Spot description (e.g., 'BTN vs BB SRP 100bb')"),
                ("action", "string", "Action to evaluate: c-bet, check-raise, etc."),
            ]),
        ],
        "skills": [
            {"id": "hand-analysis", "name": "Hand Analysis", "tags": ["gto", "ev", "poker"], "examples": ["Analyze this river bluff spot"]},
            {"id": "player-profiling", "name": "Player Profiling", "tags": ["stats", "behavior", "exploit"], "examples": ["Profile this reg's 3-bet tendencies"]},
            {"id": "leak-detection", "name": "Leak Detection", "tags": ["coaching", "improvement"], "examples": ["Where am I losing EV in 3-bet pots?"]},
        ],
    },
    {
        "id": "suicidestop",
        "name": "suicidestop.ai",
        "domain": "Mental Health & Crisis Prevention",
        "agent_name": "Crisis Guardian Agent",
        "description": "AI-powered crisis detection, sentiment monitoring, and helpline routing for suicide prevention and mental health support.",
        "tools": [
            ("assess_risk", "Assess suicide risk level from text or conversation", [
                ("content", "string", "Text content to analyze"),
                ("context", "string", "chat, social_post, call_transcript"),
            ]),
            ("route_crisis", "Route high-risk individual to appropriate helpline", [
                ("risk_level", "string", "low, medium, high, imminent"),
                ("location", "string", "ISO country code or city"),
                ("language", "string", "Preferred language"),
            ]),
            ("monitor_sentiment", "Continuous sentiment trend analysis", [
                ("user_id", "string", "Anonymous user identifier"),
                ("history", "string", "JSON array of past sentiment scores"),
            ]),
            ("generate_safety_plan", "Generate personalized safety plan", [
                ("risk_factors", "string", "JSON array of identified risk factors"),
                ("protective_factors", "string", "JSON array of protective factors"),
            ]),
        ],
        "skills": [
            {"id": "risk-assessment", "name": "Risk Assessment", "tags": ["crisis", "mental-health"], "examples": ["Assess the risk in this message"]},
            {"id": "helpline-routing", "name": "Helpline Routing", "tags": ["emergency", "support"], "examples": ["Route this user to the nearest crisis center"]},
            {"id": "sentiment-monitoring", "name": "Sentiment Monitoring", "tags": ["trends", "alerts"], "examples": ["Monitor this user's mood over time"]},
        ],
    },
    {
        "id": "diyhelp",
        "name": "diyhelp.ai",
        "domain": "Home Improvement & Construction",
        "agent_name": "DIY Compliance Agent",
        "description": "Permit compliance, safety code verification, contractor vetting, and project cost estimation for home improvement.",
        "tools": [
            ("check_permits", "Check required permits for a project", [
                ("project_type", "string", "renovation, addition, electrical, plumbing"),
                ("location", "string", "City or postal code"),
                ("project_value", "number", "Estimated project value in local currency"),
            ]),
            ("verify_contractor", "Verify contractor license and insurance", [
                ("contractor_name", "string", "Business name or license number"),
                ("location", "string", "Jurisdiction"),
            ]),
            ("check_safety_codes", "Check project against local safety/building codes", [
                ("project_plan", "string", "Description or blueprint summary"),
                ("code_standard", "string", "IRC, NEC, IPC, local"),
            ]),
            ("estimate_cost", "Estimate project cost with material breakdown", [
                ("project_scope", "string", "Detailed project description"),
                ("location", "string", "City for local pricing"),
            ]),
        ],
        "skills": [
            {"id": "permit-check", "name": "Permit Checker", "tags": ["compliance", "permits"], "examples": ["Do I need a permit for this deck?"]},
            {"id": "contractor-vetting", "name": "Contractor Vetting", "tags": ["safety", "verification"], "examples": ["Is this contractor licensed?"]},
            {"id": "cost-estimation", "name": "Cost Estimation", "tags": ["budget", "planning"], "examples": ["How much will this kitchen reno cost?"]},
        ],
    },
    {
        "id": "fishkeeper",
        "name": "fishkeeper-ai",
        "domain": "Aquaculture & Fisheries",
        "agent_name": "Aquaculture Health Agent",
        "description": "Water quality monitoring, disease detection, breeding genetics, and feed optimization for fish farming and aquariums.",
        "tools": [
            ("analyze_water_quality", "Analyze water parameters for optimal conditions", [
                ("parameters", "string", "JSON: {ph, ammonia, nitrite, nitrate, temp, dissolved_o2}"),
                ("species", "string", "Target species"),
            ]),
            ("detect_disease", "Detect disease from symptoms or images", [
                ("symptoms", "string", "Observed symptoms description"),
                ("species", "string", "Affected species"),
            ]),
            ("optimize_feed", "Calculate optimal feed ratios", [
                ("biomass", "number", "Total fish biomass in kg"),
                ("species", "string", "Species being farmed"),
                ("growth_stage", "string", "fry, juvenile, grower, broodstock"),
            ]),
            ("breeding_recommendation", "Recommend breeding pairs based on genetics", [
                ("pedigree_data", "string", "JSON pedigree records"),
                ("trait_goals", "string", "growth_rate, disease_resistance, color"),
            ]),
        ],
        "skills": [
            {"id": "water-analysis", "name": "Water Analysis", "tags": ["quality", "monitoring"], "examples": ["Are my water parameters safe for tilapia?"]},
            {"id": "disease-diagnosis", "name": "Disease Diagnosis", "tags": ["health", "veterinary"], "examples": ["My fish have white spots — what is it?"]},
            {"id": "breeding-optimization", "name": "Breeding Optimization", "tags": ["genetics", "hatchery"], "examples": ["Which koi should I pair for best color?"]},
        ],
    },
    {
        "id": "koikeeper",
        "name": "koikeeper-ai",
        "domain": "Koi & Ornamental Fish",
        "agent_name": "Koi Master Agent",
        "description": "Koi color grading, health scoring, pedigree tracking, and show preparation for koi enthusiasts and breeders.",
        "tools": [
            ("grade_koi", "Grade koi color and pattern quality", [
                ("image_data", "string", "Base64 image or image URL"),
                ("variety", "string", "Kohaku, Sanke, Showa, Utsuri, etc."),
            ]),
            ("health_score", "Calculate health score from observations", [
                ("observations", "string", "JSON: body_shape, skin_texture, fin_condition, behavior"),
            ]),
            ("track_pedigree", "Track and query koi pedigree", [
                ("koi_id", "string", "Unique koi identifier"),
                ("depth", "number", "Generations to trace (1-5)"),
            ]),
            ("show_readiness", "Assess show readiness and suggest improvements", [
                ("koi_data", "string", "JSON with grade, health_score, age"),
                ("show_date", "string", "Target show date"),
            ]),
        ],
        "skills": [
            {"id": "color-grading", "name": "Color Grading", "tags": ["show", "quality"], "examples": ["Grade this Kohaku's pattern"]},
            {"id": "health-scoring", "name": "Health Scoring", "tags": ["wellness", "care"], "examples": ["Is my koi healthy enough for breeding?"]},
            {"id": "pedigree-tracking", "name": "Pedigree Tracking", "tags": ["lineage", "genetics"], "examples": ["Trace this koi's bloodline"]},
        ],
    },
    {
        "id": "loopfactory",
        "name": "loopfactory.ai",
        "domain": "Manufacturing & Industry 4.0",
        "agent_name": "Factory Optimizer Agent",
        "description": "Predictive maintenance, defect detection, ISO compliance, and OEE optimization for smart manufacturing.",
        "tools": [
            ("predict_maintenance", "Predict equipment failure and recommend maintenance", [
                ("equipment_id", "string", "Machine or sensor identifier"),
                ("sensor_data", "string", "JSON time-series of vibration, temp, current"),
                ("horizon_days", "number", "Prediction horizon"),
            ]),
            ("detect_defect", "Detect product defects from images or sensor data", [
                ("inspection_data", "string", "Base64 image or sensor readings JSON"),
                ("product_line", "string", "Product line identifier"),
            ]),
            ("check_iso_compliance", "Check manufacturing process against ISO standards", [
                ("process_data", "string", "Process parameters JSON"),
                ("standard", "string", "iso-9001, iso-14001, iso-45001"),
            ]),
            ("optimize_oee", "Calculate and optimize Overall Equipment Effectiveness", [
                ("oee_data", "string", "JSON: availability, performance, quality metrics"),
            ]),
        ],
        "skills": [
            {"id": "predictive-maintenance", "name": "Predictive Maintenance", "tags": ["iot", "sensors"], "examples": ["When will this CNC machine fail?"]},
            {"id": "defect-detection", "name": "Defect Detection", "tags": ["quality", "vision"], "examples": ["Inspect this batch for scratches"]},
            {"id": "oee-optimization", "name": "OEE Optimization", "tags": ["efficiency", "lean"], "examples": ["How can I improve line 3's OEE?"]},
        ],
    },
    {
        "id": "industrial-domains",
        "name": "industrial-domains",
        "domain": "Industrial B2B & Supply Chain",
        "agent_name": "Supply Chain Risk Agent",
        "description": "Supply chain risk assessment, ESG scoring, vendor auditing, and compliance tracking for industrial procurement.",
        "tools": [
            ("assess_supplier_risk", "Assess supplier risk across financial, operational, geopolitical dimensions", [
                ("supplier_id", "string", "Supplier identifier"),
                ("risk_dimensions", "string", "JSON array: financial, operational, geopolitical, climate"),
            ]),
            ("calculate_esg_score", "Calculate ESG score for a supplier or product", [
                ("entity_id", "string", "Supplier or product identifier"),
                ("framework", "string", "gri, sasb, tcfd, csrd"),
            ]),
            ("audit_vendor", "Run vendor compliance audit", [
                ("vendor_id", "string", "Vendor identifier"),
                ("audit_type", "string", "financial, quality, ethical, environmental"),
            ]),
            ("track_compliance", "Track regulatory compliance across supply chain", [
                ("regulation", "string", "reach, rohs, conflict-minerals, modern-slavery"),
                ("scope", "string", "tier-1, tier-2, full-chain"),
            ]),
        ],
        "skills": [
            {"id": "supplier-risk", "name": "Supplier Risk Assessment", "tags": ["risk", "procurement"], "examples": ["Assess risk for this Chinese supplier"]},
            {"id": "esg-scoring", "name": "ESG Scoring", "tags": ["sustainability", "reporting"], "examples": ["What's this vendor's carbon score?"]},
            {"id": "vendor-audit", "name": "Vendor Audit", "tags": ["compliance", "due-diligence"], "examples": ["Audit this supplier for modern slavery compliance"]},
        ],
    },
    {
        "id": "industrial-hire",
        "name": "industrial-hire-ai",
        "domain": "Recruitment & HR Tech",
        "agent_name": "Fair Hire Agent",
        "description": "Bias-free hiring, skills matching, interview coaching, and compliance (GDPR, EEOC) for industrial recruitment.",
        "tools": [
            ("screen_cv", "Screen CV for skills match with bias mitigation", [
                ("cv_text", "string", "CV text content"),
                ("job_description", "string", "Job description text"),
                ("blind_fields", "string", "JSON array of fields to anonymize: name, gender, age, photo"),
            ]),
            ("assess_interview", "Assess interview transcript for structured scoring", [
                ("transcript", "string", "Interview transcript"),
                ("competencies", "string", "JSON array of competencies to score"),
            ]),
            ("check_hiring_bias", "Check hiring pipeline for demographic bias", [
                ("pipeline_data", "string", "JSON: applicants_by_stage with demographics"),
                ("protected_class", "string", "gender, race, age, disability"),
            ]),
            ("match_skills", "Match candidate skills to job requirements with gap analysis", [
                ("candidate_skills", "string", "JSON array of skills"),
                ("required_skills", "string", "JSON array of required skills"),
            ]),
        ],
        "skills": [
            {"id": "cv-screening", "name": "CV Screening", "tags": ["hiring", "bias-free"], "examples": ["Screen this CV for the engineering role"]},
            {"id": "interview-assessment", "name": "Interview Assessment", "tags": ["structured", "scoring"], "examples": ["Score this interview on leadership competencies"]},
            {"id": "bias-audit", "name": "Hiring Bias Audit", "tags": ["compliance", "eeoc"], "examples": ["Is our pipeline biased against women?"]},
        ],
    },
    {
        "id": "councilofai",
        "name": "councilof-ai",
        "domain": "AI Governance & Policy",
        "agent_name": "Policy Simulator Agent",
        "description": "AI policy simulation, voting analysis, constitutional AI drafting, and regulatory impact assessment.",
        "tools": [
            ("simulate_policy", "Simulate outcomes of an AI policy proposal", [
                ("policy_text", "string", "Policy proposal text"),
                ("stakeholders", "string", "JSON array of affected stakeholder groups"),
                ("time_horizon", "string", "1-year, 5-year, 10-year"),
            ]),
            ("analyze_voting", "Analyze voting patterns on AI governance proposals", [
                ("votes", "string", "JSON array of votes with voter metadata"),
                ("proposal_id", "string", "Proposal identifier"),
            ]),
            ("draft_constitution", "Draft constitutional AI principles for an organization", [
                ("organization_type", "string", "corporate, non-profit, government, research"),
                ("values", "string", "JSON array of core values"),
            ]),
            ("assess_regulatory_impact", "Assess regulatory impact of AI deployment", [
                ("ai_system_description", "string", "Description of the AI system"),
                ("jurisdiction", "string", "eu, us, uk, singapore, global"),
            ]),
        ],
        "skills": [
            {"id": "policy-simulation", "name": "Policy Simulation", "tags": ["governance", "forecasting"], "examples": ["Simulate the impact of this AI liability law"]},
            {"id": "voting-analysis", "name": "Voting Analysis", "tags": ["democracy", "consensus"], "examples": ["Analyze council voting on Article 10"]},
            {"id": "constitutional-drafting", "name": "Constitutional Drafting", "tags": ["principles", "ethics"], "examples": ["Draft our lab's AI constitution"]},
        ],
    },
    {
        "id": "asisecurity",
        "name": "asisecurity-portal",
        "domain": "Cybersecurity & Threat Intelligence",
        "agent_name": "Threat Hunter Agent",
        "description": "Threat intelligence aggregation, vulnerability scanning, incident response automation, and SOC analysis.",
        "tools": [
            ("analyze_threat_intel", "Analyze and correlate threat intelligence feeds", [
                ("ioc_list", "string", "JSON array of indicators of compromise"),
                ("feed_sources", "string", "mitre, otx, virustotal, custom"),
            ]),
            ("scan_vulnerabilities", "Scan infrastructure for known vulnerabilities", [
                ("target", "string", "IP, domain, or asset identifier"),
                ("scan_type", "string", "network, web, cloud, container"),
            ]),
            ("respond_incident", "Generate incident response playbook", [
                ("alert_data", "string", "JSON SIEM alert"),
                ("severity", "string", "low, medium, high, critical"),
            ]),
            ("generate_soc_report", "Generate SOC analyst report from logs", [
                ("log_data", "string", "JSON log entries"),
                ("time_range", "string", "last-1h, last-24h, last-7d"),
            ]),
        ],
        "skills": [
            {"id": "threat-intel", "name": "Threat Intelligence", "tags": ["ioc", "correlation"], "examples": ["Correlate these IPs with known APT groups"]},
            {"id": "vulnerability-scan", "name": "Vulnerability Scan", "tags": ["security", "cve"], "examples": ["Scan our web app for OWASP Top 10"]},
            {"id": "incident-response", "name": "Incident Response", "tags": ["soc", "automation"], "examples": ["Generate response playbook for this ransomware alert"]},
        ],
    },
]


def generate_mcp_tools(vertical: dict) -> str:
    """Generate meok-ai/mcp/tools/<vertical>.py"""
    lines = [
        f'"""',
        f'{vertical["domain"]} — MCP Tools for {vertical["name"]}',
        f'Generated by deploy_verticals.py',
        f'"""',
        f'import json',
        f'from typing import Dict, Any',
        f'from datetime import datetime',
        f'',
        f'from meok.mcp.state import ServiceState',
        f'',
    ]

    tool_defs = []
    for name, desc, params in vertical["tools"]:
        schema_props = []
        required = []
        for p_name, p_type, p_desc in params:
            schema_props.append(f'                "{p_name}": {{"type": "{p_type}", "description": "{p_desc}"}}')
            required.append(f'"{p_name}"')
        req_str = f',\n                "required": [{", ".join(required)}]' if required else ''
        tool_defs.append(
            f'    {{\n'
            f'        "name": "{vertical["id"]}_{name}",\n'
            f'        "description": "{desc}",\n'
            f'        "inputSchema": {{\n'
            f'            "type": "object",\n'
            f'            "properties": {{\n'
            f'{",\n".join(schema_props)}\n'
            f'            }}{req_str},\n'
            f'        }},\n'
            f'    }}'
        )

    lines.append(f'{vertical["id"].upper()}_TOOLS = [')
    lines.append(",\n".join(tool_defs))
    lines.append(']')
    lines.append('')
    lines.append('')
    lines.append(f'async def handle_{vertical["id"]}_tool(name: str, arguments: Dict[str, Any], state: ServiceState) -> Dict[str, Any]:')
    lines.append(f'    """Dispatch {vertical["domain"]} tools."""')
    lines.append(f'    ts = datetime.utcnow().isoformat()')
    lines.append(f'    model_id = arguments.get("model_id") or arguments.get("equipment_id") or arguments.get("supplier_id") or "unknown"')
    lines.append(f'')

    for name, desc, params in vertical["tools"]:
        lines.append(f'    if name == "{vertical["id"]}_{name}":')
        lines.append(f'        return {{')
        lines.append(f'            "tool": "{name}",')
        lines.append(f'            "vertical": "{vertical["id"]}",')
        lines.append(f'            "status": "completed",')
        lines.append(f'            "executed_at": ts,')
        lines.append(f'            "arguments": arguments,')
        lines.append(f'            "result": {{"note": "Domain-specific implementation placeholder for {name}"}},')
        lines.append(f'        }}')
        lines.append(f'')

    lines.append(f'    return {{"error": f"Unknown {vertical["id"]} tool: {{name}}"}}')
    lines.append('')
    return "\n".join(lines)


def patch_a2a_gateway(vertical: dict):
    """Add agent card to meok-ai/a2a/gateway.py"""
    path = MEOK / "a2a" / "gateway.py"
    content = path.read_text()
    marker = '# Additional verticals registered dynamically or via config'
    if marker not in content:
        marker = '"safetyofai": {'

    skills_json = json.dumps(vertical["skills"], indent=12)
    # Fix JSON to Python dict syntax
    skills_py = skills_json.replace('"', '"').replace('true', 'True').replace('false', 'False').replace('null', 'None')

    agent_card = f'''    "{vertical["id"]}": {{
        "name": "{vertical["agent_name"]}",
        "description": "{vertical["description"]}",
        "url": "https://{vertical["name"]}/a2a",
        "provider": {{"organization": "CSOAI Global", "url": "https://csoai.org"}},
        "version": "1.0.0",
        "authentication": {{"schemes": ["a2a-jwt", "api-key"]}},
        "defaultInputModes": ["text", "file"],
        "defaultOutputModes": ["text", "sbt-verification", "file"],
        "capabilities": {{"streaming": True, "pushNotifications": False}},
        "skills": {skills_py},
    }},'''

    # Insert before the closing of VERTICAL_AGENTS or after safetyofai
    if f'"{vertical["id"]}":' in content:
        print(f'  [A2A] {vertical["id"]} already registered, skipping')
        return

    # Find the line after safetyofai's closing brace + comma
    insert_after = '    },\n    # Additional verticals registered dynamically or via config'
    if insert_after in content:
        content = content.replace(insert_after, agent_card + '\n' + insert_after)
    else:
        # Fallback: find end of VERTICAL_AGENTS dict
        content = content.replace(
            '# Additional verticals registered dynamically or via config',
            agent_card + '\n    # Additional verticals registered dynamically or via config'
        )
    path.write_text(content)
    print(f'  [A2A] Registered {vertical["id"]} agent card')


def patch_mcp_init(vertical: dict):
    """Register tools in meok-ai/mcp/tools/__init__.py"""
    path = MEOK / "mcp" / "tools" / "__init__.py"
    content = path.read_text()

    import_line = f'from meok.mcp.tools.{vertical["id"]} import {vertical["id"].upper()}_TOOLS, handle_{vertical["id"]}_tool'
    all_tools_line = f'    + {vertical["id"].upper()}_TOOLS'
    handler_line = f'for _tool in {vertical["id"].upper()}_TOOLS:\n    _TOOL_NAME_TO_HANDLER[_tool["name"]] = handle_{vertical["id"]}_tool'

    if import_line in content:
        print(f'  [MCP] {vertical["id"]} already in __init__, skipping')
        return

    # Add import
    content = content.replace(
        'from meok.mcp.tools.faith import FAITH_TOOLS, handle_faith_tool',
        f'from meok.mcp.tools.faith import FAITH_TOOLS, handle_faith_tool\n{import_line}'
    )

    # Add to ALL_TOOLS
    content = content.replace(
        '    + FAITH_TOOLS',
        f'    + FAITH_TOOLS\n{all_tools_line}'
    )

    # Add handler loop
    content = content.replace(
        'for _tool in FAITH_TOOLS:\n    _TOOL_NAME_TO_HANDLER[_tool["name"]] = handle_faith_tool',
        f'for _tool in FAITH_TOOLS:\n    _TOOL_NAME_TO_HANDLER[_tool["name"]] = handle_faith_tool\n{handler_line}'
    )

    path.write_text(content)
    print(f'  [MCP] Registered {vertical["id"]} tools')


def generate_frontend_lib(vertical: dict) -> str:
    return f'''/**
 * CSOAI Client — {vertical["name"]} Vertical Integration
 */
import {{ CSOAI }} from '@csgaglobal/ai-sdk';

const API_BASE = process.env.NEXT_PUBLIC_CSOAI_API_URL || 'https://api.csoai.org';

export const csoai = CSOAI.create({{
  baseUrl: API_BASE,
  vertical: '{vertical["id"]}',
  enableP2P: false,
  timeouts: {{ api: 30000, mcp: 60000, a2a: 45000, p2p: 30000 }},
}});

/** Ask the {vertical["agent_name"]} via A2A */
export async function askAgent(question: string) {{
  const agentUrl = `${{API_BASE}}/a2a/{vertical["id"]}`;
  return csoai.askAgent(agentUrl, question);
}}

/** Fetch protocol health */
export async function fetchProtocolHealth() {{
  const res = await csoai.api.get('/health');
  return res.data;
}}
'''


def deploy_vertical(vertical: dict):
    print(f'\\n🚀 Deploying {vertical["name"]}...')

    # 1. Backend MCP tools
    tool_path = MEOK / "mcp" / "tools" / f"{vertical['id']}.py"
    tool_path.write_text(generate_mcp_tools(vertical))
    print(f'  [MCP] Wrote {tool_path}')

    # 2. Register in __init__.py
    patch_mcp_init(vertical)

    # 3. A2A agent card
    patch_a2a_gateway(vertical)

    # 4. Frontend lib
    vert_dir = BASE / vertical["name"]
    if vert_dir.exists():
        lib_dir = vert_dir / "src" / "lib"
        lib_dir.mkdir(parents=True, exist_ok=True)
        (lib_dir / "csoai.ts").write_text(generate_frontend_lib(vertical))
        print(f'  [FE] Wrote {lib_dir}/csoai.ts')

        # Copy shared components
        comp_dir = vert_dir / "src" / "components"
        comp_dir.mkdir(parents=True, exist_ok=True)
        safety_comp = BASE / "safetyofai" / "src" / "components"
        for comp in ["ProtocolStatus.tsx"]:
            src = safety_comp / comp
            dst = comp_dir / comp
            if src.exists():
                shutil.copy2(src, dst)
                print(f'  [FE] Copied {comp}')

        # Create protocols page
        protocols_dir = vert_dir / "src" / "app" / "protocols"
        protocols_dir.mkdir(parents=True, exist_ok=True)
        page_content = f'''import type {{ Metadata }} from 'next';
import ProtocolStatus from '@/components/ProtocolStatus';

export const metadata: Metadata = {{
  title: 'Protocols — {vertical["name"]}',
  description: 'Live protocol integration: MCP, A2A, ACP, libp2p, ABCI, and unified API.',
}};

export default function ProtocolsPage() {{
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Protocol Nexus</h1>
        <p className="text-muted-foreground max-w-2xl">
          {vertical["name"]} is powered by the CSOAI Protocol Nexus — unified backend exposing
          MCP for tool execution, A2A for agent delegation, ACP for real-time messaging,
          libp2p for peer-to-peer communication, and ABCI for on-chain trust registry.
        </p>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-4">Protocol Health</h2>
        <ProtocolStatus />
      </section>
    </div>
  );
}}
'''
        (protocols_dir / "page.tsx").write_text(page_content)
        print(f'  [FE] Wrote protocols/page.tsx')
    else:
        print(f'  [FE] WARN: {vert_dir} not found, skipping frontend')

    print(f'  ✅ {vertical["name"]} deployed')


def main():
    print("=" * 60)
    print("CSOAI VERTICAL MASS DEPLOYMENT")
    print("=" * 60)

    for vertical in VERTICALS:
        deploy_vertical(vertical)

    print("\\n" + "=" * 60)
    print("DEPLOYMENT COMPLETE")
    print("=" * 60)
    print(f"\\nTotal verticals deployed: {len(VERTICALS)}")
    print("Next steps:")
    print("  1. Review generated MCP tools in meok-ai/mcp/tools/")
    print("  2. Install SDK in each vertical: npm install")
    print("  3. Add /protocols link to each layout.tsx navigation")
    print("  4. Build and deploy")


if __name__ == "__main__":
    main()
