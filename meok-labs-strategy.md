# MEOK AI Labs — Revenue Strategy

## Brand Architecture

**MEOK AI Labs** is the parent entity (MEOK AI Ltd, UK registered).
All products, MCP packs, white papers, and consulting sell under MEOK.

CSOAI Ltd remains the governance/research arm. CSGA Research Institute content
gets republished under MEOK Labs branding where commercially valuable.

### Product Lines

#### 1. MEOK MCP Packs (recurring revenue)
- Fresh GitHub org: `github.com/meok-ai-labs/`
- NO SOV3 private data — all servers are clean, standalone
- Sold on MCPize (85% rev share), MCP Marketplace, and meok.ai direct
- Pricing: Free tier (limited calls) → Pro $9/mo → Enterprise $49/mo

**Pack Categories:**
- **Industry Packs** — healthcare-ai, financial-ai, legal-tech-ai, construction-ai, etc.
- **Infrastructure Packs** — postgres-db, k8s, docker, filesystem, playwright-browser
- **Governance Packs** — compliance-audit, csoai-governance, policy-engine, bias-detection
- **Defence & Security** — terranova-defence, threat-intelligence, vulnerability-scanner
- **Specialty** — cobol-bridge, agriculture-ai, space-ai, maritime-ai

**Upsell:** COBOL Bridge Enterprise ($199-1,999/mo) for Fortune 500 mainframe clients

#### 2. White Papers & Research (credibility + grants)
- Care Framework v1.0 (done) → submit to AAAI/FAccT
- Oxford 6-Pack Mapping (done) → publish on meok.ai/research
- New papers fund HARVI robotics research
- Each paper strengthens Innovate UK grant applications

#### 3. EU AI Act Compliance (consulting revenue)
- Template kits on LemonSqueezy ($49-199)
- Consulting assessments (£2k-15k per client)
- White-label for certification bodies (£50k+ partnerships)

#### 4. HARVI Robotics (funded by above)
- Revenue from MCP packs + consulting → funds parts + research
- LeRobot + SO-101 integration via SOV3 care-gated pipeline
- White papers document the methodology → more grants

### Revenue Flow
```
MCP Pack Sales ($500-2k/mo)     ─┐
EU AI Act Consulting (£5-15k)    ├─→ MEOK AI Labs ─→ HARVI Robotics
Innovate UK Grant (£150-250k)    │                 ─→ Humanoid Research
Domain Sales ($5-25k)           ─┘                 ─→ Farm Infrastructure
```

## GitHub Organization: meok-ai-labs

### Repositories (fresh, clean, no SOV3 data)

```
meok-ai-labs/
├── mcp-healthcare-ai/        # 4 tools: patient-risk, drug-interaction, ehr-query, clinical-nlp
├── mcp-financial-ai/         # 3 tools: risk-scoring, fraud-detection, portfolio-analysis
├── mcp-legal-tech-ai/        # 3 tools: contract-review, case-research, compliance-check
├── mcp-construction-ai/      # 3 tools: site-safety, project-estimation, material-optimization
├── mcp-compliance-audit/     # 4 tools: risk-classification, gap-analysis, documentation, reporting
├── mcp-cobol-bridge/         # 5 tools: copybook-parser, cics-bridge, jcl-scanner, vsam-mapper, ebcdic-translator
├── mcp-care-membrane/        # 3 tools: safety-evaluation, adversarial-testing, care-scoring
├── mcp-agent-orchestrator/   # 3 tools: task-delegation, consensus, agent-registry
├── mcp-web-research/         # 3 tools: search, browse, extract
├── mcp-memory-store/         # 3 tools: store, search, consolidate
├── eu-ai-act-kit/            # Compliance templates (LemonSqueezy product)
├── care-framework/           # White paper + Oxford mapping (public research)
├── meok-website/             # meok.ai marketing site
└── docs/                     # API docs, guides, tutorials
```

Each repo is:
- Self-contained (no imports from sovereign-temple)
- Has its own README, LICENSE (MIT or commercial), and package.json
- Includes free tier limits + Pro tier unlock
- Published to npm under @meok-ai-labs scope

## Domain Alignment

| Domain | Points To | Purpose |
|--------|-----------|---------|
| meok.ai | Vercel (meok-website) | Main brand site |
| cobolbridge.ai | Vercel (cobol-bridge) | Enterprise COBOL product |
| csoai.org | Vercel (csoai-org) | Governance research arm |
| councilof.ai | Redirect → csoai.org | Alias |
| safetyof.ai | Vercel (safetyofai) | AI safety content |
| agisafe.ai | Landing page (for sale) | Domain sale |
| grabhire.ai | Landing page (for sale) | Domain sale |

## Immediate Actions

1. Create GitHub org `meok-ai-labs`
2. Build first 3 MCP packs (compliance-audit, care-membrane, cobol-bridge)
3. Publish on MCPize + npm
4. List EU AI Act kit on LemonSqueezy
5. Submit Innovate UK grant by April 29
6. All revenue → MEOK AI Ltd bank account
