# MEOK LAW MCP ⚖️

**Region-aware AI governance for any agent, humanoid, robotics company, or business** — built
on the real CSOAI crosswalks (12 frameworks, with CSOAI's 52-article Partnership Charter as the
hub). Connect from your own stack and get three honest answers.

> Informational governance mapping, **not legal advice**. The authoritative, SIGIL-hash-chained
> registration lives at **https://meok.ai/law** — this MCP issues self-attested certificates.

## Tools

| tool | what it answers |
|------|-----------------|
| `law_overview()` | the capability map — frameworks covered, regions, honest coverage |
| `law_applicable(region, entity)` | **which rules apply to me, here** + the obligations they trigger |
| `law_crosswalk(from_region, to_region)` | **what changes when an agent crosses a border** — charter obligations re-projected via shared articles |
| `law_social_contract(entity, region)` | the portable, charter-bound "AI social contract" an agent carries |
| `law_register(name, type, region, operator)` | bind + track an agent/fleet/company → a certificate |

`region` ∈ `EU · UK · US · CA · APAC · GLOBAL`  ·  `entity`/`type` ∈ `ai_agent · humanoid · robotics_company · business`

## Why it exists
Agents and humanoids increasingly cross jurisdictions. EU AI Act, NIST AI RMF, the UK's
regulator-led approach, Singapore's agentic guidance — they don't line up 1:1. MEOK LAW uses the
CSOAI charter as a **pivot**: an agent governed to the charter can be mapped to whichever
framework a region demands, and re-mapped when it crosses a border. Example — **EU → US** shares
**22 charter articles** (EU AI Act ↦ NIST AI RMF) with 6 new obligation areas on entry.

The charter binding travels with the agent; only the framework projection changes. That's the
"AI social contract."

## Install / run
```bash
pip install meok-law-mcp
meok_law_mcp          # runs the MCP over stdio
```
Or point your MCP client at the `meok_law_mcp` entrypoint.

## Honest scope
- Coverage today: **23 framework crosswalks across 9 regions + 4 domain crosswalk MCPs**
  (DORA↔NIS2, DRCF-agent, ASC↔RSPCA, CSOAI-governance) — growing, not "every law on Earth."
  Frameworks: EU AI Act, GDPR, NIST AI RMF, UK AISI, ISO/IEC 42001, ISO/IEC 27001, SOC 2,
  HIPAA, FDA AI/ML SaMD, Basel III (AI overlay), Canada AIDA, Brazil LGPD, India DPDPA,
  Australia AI Ethics, Singapore Agentic-AI, OECD, UNESCO, G7/G20, IEEE, Montreal, Asilomar,
  Anthropic Constitutional AI, OpenAI Model Spec.
- The 11 newest crosswalks are **AI-generated structural mappings to each framework's real
  architecture, then AI peer-reviewed** — accurate and citable, but flagged "pending human
  counsel sign-off." (2 defence crosswalks are held in a private namespace.)
- `law_register` here is **self-attested** (sha256 cert). For a tamper-evident, hash-chained,
  tracked registration, use the live MEOK LAW service.
- Registration **never grants powers** and never touches money, credentials, or deletion — the
  Sovereign Gate holds those for a human.

Built by **MEOK AI Labs** · https://meok.ai · Council for the Safety of AI · https://csoai.org
