# DEFONEOS HIVE — P0 SIGIL
## 5 Actions for This Week (W1: 27 Jun – 3 Jul 2026)

**Owner:** Nicholas Templeman · CSOAI Ltd UK 16939677
**Companion:** `02_DEFONEOS_HIVE_CANONICAL_SPEC.md`, `03_DEFONEOS_12_WEEK_ROADMAP.md`
**Currency:** estimated hours, blocking-vs-parallel flags
**Hard rule (from `~/clawd/AGENTS.md`):** commit ONLY your own files, in scoped commits. Never `git add -A`. Never `git checkout .` or `git reset --hard` on the shared `~/clawd` tree.

---

## The 5 P0 Actions

### ① CREATE the `defoneos-mcp` hub scaffold (BLOCKING — must finish before ② ③ ④)

**What:** A new Python/FastMCP package at `/Users/nicholas/clawd/mcp-marketplace/defoneos-mcp/` that, on install, registers with the SOV3 bridge and exposes the 12 defence-relevant MCPs as one hub.

**How (concrete steps):**

```bash
# Step 1: Scaffold the new MCP repo on disk
mkdir -p /Users/nicholas/clawd/mcp-marketplace/defoneos-mcp
cd /Users/nicholas/clawd/mcp-marketplace/defoneos-mcp
git init
# Copy the template from an existing MCP (e.g. meok-sovereign-passport-mcp)
cp -r ../meok-sovereign-passport-mcp/{.gitignore,.cursorrules,CODEOWNERS,CODE_OF_CONDUCT.md,CONTRIBUTING.md,CHANGELOG.md,LICENSE,pyproject.toml,server.py,README.md,Dockerfile,dist/,.github,.well-known} .
# Edit package name in pyproject.toml: defoneos-mcp
# Edit server.py: load the 12 MCPs as sub-servers + care-membrane pre-gate
```

**Step 2: Add the care-membrane pre-gate.** Use the existing Dagon refusal patterns (in `~/clawd/_private_dagon/dagon-geospatial-intel/`) as the source — copy the refusal list into `defoneos-mcp/care_membrane_policy.yml` (the public, defence-safe subset: no kinetic targeting, no personal surveillance, no face recognition). **Do NOT link Dagon publicly.** Strip any Dagon-specific wording; keep only the refusal patterns + audit-format spec.

**Step 3: Wire the 12 MCPs as sub-servers.** Each of these is already on-disk and on PyPI — just add them as Python imports in `server.py`:
- `airspace_monitor_mcp` (airspace-monitor-mcp)
- `drone_airspace_governance_mcp` (drone-airspace-governance-mcp)
- `firmware_attestation_mcp` (firmware-attestation-mcp)
- `agent_prompt_injection_firewall_mcp` (agent-prompt-injection-firewall-mcp)
- `owasp_agentic_mcp` (owasp-agentic-mcp)
- `cybersecurity_ai_mcp` (cybersecurity-ai-mcp)
- `agent_identity_trust_mcp` (agent-identity-trust-mcp)
- `bft_progress_council_mcp` (bft-progress-council-mcp)
- `ai_incident_reporting_mcp` (ai-incident-reporting-mcp)
- `meok_supply_chain_attestation_mcp` (meok-supply-chain-attestation-mcp)
- `meok_uas_commercial_drone_mcp` (meok-uas-commercial-drone-mcp)
- `meok_tacho_airspace_link_mcp` (meok-tacho-airspace-link-mcp — verify if real or planned)

**Step 4: SOV3 bridge registration.** Reuse the pattern from `~/clawd/openpatent-hive/services/sov3-hive/register.py` — at startup, POST a manifest to `http://35.242.143.249:3101/hives/register` with `hive=defoneos, owner=csoai, surface=meok-defoneos`.

**Step 5: Verify install.**

```bash
cd /Users/nicholas/clawd/mcp-marketplace/defoneos-mcp
pip install -e .
python -c "from defoneos_mcp import hub; print(hub.list_tools())"
# Expect 12 MCPs × ~5 tools each = ~60 tools exposed, all care-membrane-gated.
```

**Estimated hours:** 30h.
**Blocking?** YES — blocks ② (Care Membrane v1.0 publish), ③ (csoai-defoneos site), ④ (procurement 1-pager). All W2-W3 work depends on ①.
**Risk:** Low — pattern is identical to the existing 12 meok-sovereign-* MCPs. Most of the work is import + glue.

---

### ② PUBLISH Care Membrane v1.0 (defence-public) as YAML (parallel with ③ ④)

**What:** A machine-readable YAML file at `defoneos-mcp/care_membrane_policy.yml` (created in ①) that documents the 30-or-so refusal patterns + audit-format spec for the DEFONEOS public defence surface. **Public-distribution-safe — no Dagon references.**

**How (concrete steps):**

**Step 1:** Read `~/clawd/_private_dagon/dagon-geospatial-intel/README.md` for the Dagon refusal list (strike package / find-fix-finish / target elimination / bounty / lethal / personal surveillance / face recognition). Keep the same PATTERNS but reword as a public care-membrane spec.

**Step 2:** Write `defoneos-mcp/care_membrane_policy.yml`:

```yaml
# DEFONEOS Care Membrane v1.0 — defence-public, sovereign, MIT-licensed.
# Inherits refusal-pattern architecture from the private CSOAI defence compartment.
# Distribution: open source, no NDA required.
# Version: 1.0
# Effective: 2026-06-27

care_membrane:
  version: "1.0"
  owner: "CSOAI Ltd UK 16939677"
  license: "MIT"
  inherits_from: "CSOAI Care Membrane architecture (publicly published)"
  audit_chain: "openpatent.ai 6-layer cryptographic proof"

refusal_patterns:
  - id: "KM-01"
    pattern: "(?i)(strike\\s+package|kinetic\\s+strike|kill\\s+zone)"
    reason: "kinetic targeting"
  - id: "KM-02"
    pattern: "(?i)(find[- ]fix[- ]finish|target\\s+elimination)"
    reason: "lethal targeting chain"
  - id: "KM-03"
    pattern: "(?i)(bounty|assassination|execute\\s+order)"
    reason: "kinetic targeting by individual"
  - id: "KM-04"
    pattern: "(?i)(lethal\\s+autonomous|offensive\\s+autonomous)"
    reason: "offensive autonomy without human-in-the-loop"
  - id: "PS-01"
    pattern: "(?i)(surveil\\s+individual|track\\s+person|targeted\\s+surveillance)"
    reason: "personal surveillance (UK GDPR + ECHR)"
  - id: "PS-02"
    pattern: "(?i)(face\\s+recognition|biometric\\s+identification\\s+of\\s+individual)"
    reason: "individual biometric identification without lawful basis"
  - id: "DM-01"
    pattern: "(?i)(disinformation\\s+at\\s+scale|narrative\\s+manipulation)"
    reason: "hostile information operations against civilians"
  - id: "EX-01"
    pattern: "(?i)(export\\s+controlled\\s+to\\s+sanctioned\\s+jurisdiction)"
    reason: "UK Strategic Export Control"

audit_format:
  on_refusal:
    payload: "{refusal_id, reason, query_hash, timestamp, agent_id}"
    signature: "ed25519"
    anchor: "openpatent.ai/verify/{refusal_id}"
  on_allow:
    payload: "{care_floor_validated, scope, provenance, timestamp, agent_id}"
    signature: "ed25519"
    anchor: "openpatent.ai/verify/{allow_id}"

maternal_covenant:
  floor: "non-kinetic, non-personal, non-deceptive, non-export-controlled"
  ratification: "33-agent BFT council, ≥22/33 supermajority required for changes"

# End Care Membrane v1.0
```

**Step 3:** Add a unit test `tests/test_care_membrane.py` that loads the YAML, runs it against 50 test queries (10 from each defence domain), and asserts every refusal pattern fires correctly.

**Estimated hours:** 8h.
**Blocking?** YES for ② (procurement 1-pager must cite the Care Membrane version); parallel-friendly with ③ + ④ (those can draft while ② is being written).
**Risk:** Very low — pure documentation work.

---

### ③ DEPLOY the `csoai-defoneos` site on Vercel (parallel with ② ④)

**What:** A 5-page static Next.js site at the `csoai-defoneos` path under meok.ai (since meok.ai is already live on Vercel). Five routes:
- `/` — landing
- `/standards` — Care Membrane v1.0 + AUKUS Pillar 2 assurance spec + JSP 936 alignment
- `/council` — 33-agent BFT council structure (config-only stubs for now)
- `/procurement` — UK MOD / DSTL / DAIC / DASA briefing pack download
- `/contact` — `nicholas@csoai.org` (the Dagon-canonical address) + Signal/Matrix mention

**How (concrete steps):**

**Step 1:** In the existing meok.ai Next.js app (`ui/src/app/`), create a route group `(defoneos)` with the 5 routes.

```bash
cd /Users/nicholas/clawd/meok.ai/ui/src/app/
mkdir -p "(defoneos)"/{standards,council,procurement,contact}
# Each page is a server component — no Clerk imports (per `MEOK_EAT_PUSH_2026-06-14.md` learnings)
```

**Step 2:** Page content. Use the procurement 1-pager (action ④) as the source for `/procurement`. Use the Care Membrane v1.0 YAML (action ②) as the source for `/standards`. **Do NOT link or reference Dagon, even in private repo files. Public artefacts only.**

**Step 3:** Add a vercel.json rewrite (per the 138 rewrites pattern in `MEOK_EAT_PUSH_2026-06-14.md`):

```json
{
  "rewrites": [
    { "source": "/defoneos", "destination": "/(defoneus)" },
    { "source": "/defoneos/standards", "destination": "/(defoneos)/standards" },
    ...
  ]
}
```

**Step 4:** Verify all 5 pages return 200.

```bash
gh repo view meok-ai --json url  # confirm visibility
curl -I https://meok.ai/defoneos
curl -I https://meok.ai/defoneos/standards
curl -I https://meok.ai/defoneos/council
curl -I https://meok.ai/defoneos/procurement
curl -I https://meok.ai/defoneos/contact
```

**Estimated hours:** 12h.
**Blocking?** NO (parallel-friendly with ② and ④).
**Risk:** Low — pattern identical to the 5 industry-hub pages shipped 2026-06-14 (`medtech`, `fintech`, `cybersec`, `kidsai`, `edtech`).

---

### ④ WRITE the procurement-grade 1-pager + EMAIL DAIC + DSTL + AWE + NCSC + DASA mailing lists (parallel with ② ③)

**What:** A4 PDF + 4 emails — first outbound to the actual UK defence buyer set. This is the W1-3 wedge from the roadmap; without these emails, W10 DSTL contract is wishful thinking.

**How (concrete steps):**

**Step 1:** Write `csoai-defoneos/DEFONEOS_PROCUREMENT_1_PAGER.pdf` (1 page, A4). Sections:

```
DEFONEOS — UK Sovereign AI for Defence
────────────────────────────────────────
CSOAI Ltd UK 16939677 | meok.ai | csoai.org/defoneos

The 28th hive of meok.ai. Open-source. MIT-licensed.
Sovereign. UK-registered. AUKUS Pillar 2 compatible.

What it is:
- 12 MCP servers bundled as one pip install (defoneos-mcp)
- Care Membrane v1.0 refusal framework (public, machine-readable)
- 33-agent BFT council for procurement-grade attestation
- AUKUS Pillar 2 assurance spec v0.5 (Five Eyes audit chain)
- harvi-evaluation-mcp for structured JSP 936 safety-case artefacts
- MEOK Labs physical R&D: WOLF planetary actuator + Asimov humanoid (sim) + HARVI rig + Qidi Max4 field-print farm at iokfarm.co.uk (6.5 acres, outdoor testbed)

Procurement alignment:
- UK MOD AI Strategy 2030 (£4-6bn cumulative, E)
- DAIC (Defence AI Centre) AI Challenge Fund
- DSTL AI and Autonomous Systems Challenge
- DASA themed-calls (AI assurance, autonomy, counter-UAS, cyber)
- JSP 936 safety-case framework
- UK AISI Inspect framework alignment

Why DEFONEOS:
- Only UK SME with sovereign-AI compliance substrate as a product
- Only MCP-native defence-AI stack (open-source)
- Only physical-AI evaluation facility (iokfarm.co.uk) outside defence primes
- Care Membrane blocks kinetic targeting, personal surveillance, face recognition

Engagement tiers (per csoai-docs/dstl_application.md):
- Tier 1 Facility access: day-rate basis
- Tier 2 Evaluation: £25-75k per system
- Tier 3 Joint research: £500k-£2M over 24 months

Contact:
nicholas@csoai.org | nicholas@meok.ai
Signal/Matrix available on request
CSOAI Ltd UK 16939677
```

**Step 2:** Email DAIC. From `~/clawd/csoai-docs/inventory.yml` find the DAIC contact (or the public DAIC general inbox). Subject: "DEFONEOS: open-source sovereign-AI compliance substrate for DAIC AI Challenge Fund — 1-pager attached".

**Step 3:** Email DSTL. Re-use `~/clawd/csoai-docs/dstl_application.md` as the long-form backing doc. Subject: "DEFONEOS update — iokfarm.co.uk testbed reactivated + defoneos-mcp released; refresh of Tier 2 evaluation proposal".

**Step 4:** Email AWE, NCSC, DASA mailing lists. Same 1-pager. Tailor the subject line per recipient.

**Step 5:** Log all 5 sends in `csoai-docs/DEFONEOS_W1_OUTREACH_LOG.md` (date, recipient, subject, ack-status).

**Estimated hours:** 12h.
**Blocking?** NO (parallel-friendly with ② ③).
**Risk:** Medium — UK defence procurement inboxes are slow and security-gated. Do NOT expect a reply in W1. The 1-pager + log entry is the deliverable.

---

### ⑤ RUN the 50-query care-membrane test suite against Dagon patterns (parallel; can be done by any agent)

**What:** A reproducible pytest suite that loads the new `care_membrane_policy.yml` (from ②) and runs it against 50 test queries (10 each from airspace, drone, firmware, agentic, cyber, identity, bft, incident, supply-chain, uas-drone domains). Asserts every refusal pattern fires correctly. Documents the test results in `csoai-docs/DEFONEOS_W1_CARE_MEMBRANE_TEST.md`.

**How (concrete steps):**

**Step 1:** Create `defoneos-mcp/tests/test_care_membrane.py`:

```python
import pytest, yaml
from pathlib import Path

POLICY = yaml.safe_load(Path(__file__).parent.parent.joinpath("care_membrane_policy.yml").read_text())

REFS = {r["id"]: r for r in POLICY["care_membrane"]["refusal_patterns"]}

DOMAINS = ["airspace", "drone", "firmware", "agentic", "cyber", "identity", "bft", "incident", "supply-chain", "uas-drone"]
PER_DOMAIN = 10

# 50 test queries, mixed safe + unsafe, per domain.
TEST_QUERIES = [
    # airspace
    ("airspace", "What's the NOTAM for EGKK today?", False),
    ("airspace", "List restricted zones over Manchester", False),
    ...
    # drone
    ("drone", "Plan a BVLOS flight under 150m AGL", False),
    ("drone", "Plan a strike package over London", True),  # KM-01
    ...
]
# ... etc.
```

**Step 2:** Run the suite. Expect 100% pass.

```bash
cd /Users/nicholas/clawd/mcp-marketplace/defoneos-mcp
pip install -e ".[test]"
pytest tests/test_care_membrane.py -v
```

**Step 3:** Document results in `csoai-docs/DEFONEOS_W1_CARE_MEMBRANE_TEST.md` — 50 rows, query / domain / expected / actual / pass-fail.

**Estimated hours:** 6h.
**Blocking?** NO (parallel-friendly). Can be done by any agent with read access to defoneos-mcp + csoai-docs.
**Risk:** Very low — pure testing work.

---

## Summary — P0 SIGIL burndown

| # | Action | Hours | Blocking? | Parallel? | Done when |
|---|---|---|---|---|---|
| ① | Create `defoneos-mcp` hub scaffold | 30h | YES (blocks ② ③ ④) | No — must finish first | `pip install defoneos-mcp` works; 12 MCPs loaded; care-membrane pre-gate wired |
| ② | Publish Care Membrane v1.0 YAML | 8h | YES for ④ (1-pager cites it) | Parallel with ③ ④ ⑤ | `care_membrane_policy.yml` committed + `tests/test_care_membrane.py` 100% pass |
| ③ | Deploy `csoai-defoneos` site on Vercel | 12h | NO | Parallel with ② ④ ⑤ | All 5 routes return 200 on meok.ai/defoneos/* |
| ④ | Procurement 1-pager + 5 emails | 12h | NO | Parallel with ② ③ ⑤ | 1-pager PDF committed; 5 emails sent; outreach log written |
| ⑤ | 50-query care-membrane test suite | 6h | NO | Parallel with ② ③ ④ | Test results doc committed |

**Total W1 effort: ~68h Nick-time + ~6h parallel-agent help = 74h.** (Nick's budget per `~/clawd/AGENTS.md`: ~40h/wk main + 10h evenings + ad-hoc bursts. Slightly over budget — defer ⑤ to a parallel agent if needed.)

**W1 exit gate:** `pip install defoneos-mcp` works; meok.ai/defoneos/* returns 200; 5 procurement emails sent; care-membrane test suite passes; outreach log written.

**W1→W2 transition:** Once ① lands, W2 = polish defoneos-mcp + first internal pilot (3 friendly testers per roadmap).

---

## Hand-off rules

1. **Commit ONLY your own files, in scoped commits.** (`git add defoneos-mcp/`, NOT `git add -A`.)
2. **Never `git checkout .` or `git reset --hard` on the shared tree.**
3. **Claim on AGENTS.md board** before editing shared files.
4. **Dagon compartment is private.** No public artefact references it. Strip any Dagon-specific wording from ②.
5. **Asimov humanoid on disk doesn't exist.** Don't claim a printed robot. The 28th hive sits on WOLF + HARVI + LeRobot, not Asimov.
6. **CSOAI-ORG profile has 0 stars.** Don't pretend otherwise. The credibility gap closes via real artefacts (W1-12).

---

## Companion documents

- `01_UK_DEFENCE_AI_MARKET_BRIEF.md` — the market wedge
- `02_DEFONEOS_HIVE_CANONICAL_SPEC.md` — the architecture
- `03_DEFONEOS_12_WEEK_ROADMAP.md` — the 12-week plan
- `DEFONEOS_RESEARCH_SEAL_2026-06-27.md` — the final summary

**Author:** Hermes/JEEVES, MEOK M3, 2026-06-27.