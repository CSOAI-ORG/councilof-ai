# Revise + plan — align CSOAI/DEFONEOS with Claude Science · Hermes · GitHub (2026-07-02)

**Source:** 8 dropped files (Tech Insights · MEOK_FULL_AUDIT_MASTER · Ryan's Cyber Playbook · 全景信息搜集 · fork-army · Defoneos-研究 zip · 47-agent-town zip). Read in full: Tech Insights, Audit Master, Ryan's Playbook. **Deliberately NOT mined:** the `DEEP_OFFENSIVE_AI / EW / counter-drone / arsenal / SIGINT` corpus + PLFM radar + RuView through-wall vitals + Panopticone/SOV-EYE surveillance — these violate the care-floor and the current directive (assurance layer, not weapons/surveillance). Flagged, frozen, not absorbed.

## A · WHAT WE MISSED (filtered to governance / assurance / cyber / revenue)

### Assurance = the audit literally proves our thesis
The MEOK_FULL_AUDIT_MASTER scores the *CSOAI platform* 5.1/10 and the gap list is our product's to-do list:
- **Gov not ready (3.5/10):** no **Trust Center**, no Cyber Essentials, no ISO 42001 cert, no algorithmic-transparency page. → **Our signed System Card + OSCAL + verify.html IS the Trust Center primitive.** Build the Trust Center *out of the artifacts we already ship.*
- **Enterprise (5.4/10):** **DORA missing = bank deal-breaker**, SOC 2 unverified, no named case studies. → the £4,950 gap analysis + signed System Card close exactly this; add **DORA** to the framework set in `sovSystemCard`/`sovOscal`/the MCP.
- **Revenue #1 quick win:** the EU AI Act **Risk Classifier has no email capture — 90% of leads vanish.** Add results→email→"free full report." 5× lead volume, hours of work.
- **Underpriced ~49%** → the £999 + £4,950 packets already correct this.

### Cyber = validated wedge + real threats to OUR estate (Ryan's playbook, in-focus)
- **JADEPUFFER** (first agentic ransomware — LLM ran end-to-end via Langflow RCE, secrets sweep, Nacos default JWT). → validates the AI-agent-security wedge. Counter: secrets vaulting/rotation, **runtime behavioural** detection, a JWT-default-key scanner as a signed compliance module.
- **TeamPCP** (dev-tool supply-chain poisoning — Trivy/LiteLLM/KICS/Bitwarden CLI; Nx Console → 3,800 GitHub repos exposed; FBI FLASH). → **directly threatens our GitHub/CI.** Action: SHA-pin every GitHub Action, SBOM, egress-limit runners.
- **Claude Code CVE chain** (2026-35020/21/22 — credential + MEMORY.md exfil). → hygiene note for our own agent setup: secrets out of agent env, sandbox.
- **Ryan's mindset to steal (honestly):** he owns the *narrative*, not the tools — speed-to-intel + **civilian-translation layer**. Steal the translation ("every framework in plain English") and speed-to-brief; **skip the fear/panic-selling** (honesty register). 
- **Defensive OSS to fold into Gods-Eye:** Pipelock (agent firewall), AIMap (exposed-AI-endpoint scan — great for our own `.ai` surface), Strix (vuln validation), Vigolium (scanner modules). Dual-use offensive ones (Sandyaa/Lyrie autonomous-exploit-gen) → **authorized-pentest-only, gated**, never baked into the product.

### Standards tailwind (Tech Insights, verified-in-spirit)
- **MCP is the lingua franca** (Anthropic/OpenAI/Google/Cursor all adopted) → confirms the `defoneos-sign` MCP + federation strategy. **ClawHub poisoned 1,184 skills** (OWASP Agentic **ASI04**) → **signed provenance is the answer to registry poisoning** — our exact primitive. Add OWASP Agentic Top-10 (ASI03/04) + **microVM isolation** as controls in the System Card/OSCAL set.
- **OpenGridWorks "unconnected goldmine"** (120k power plants, 597 cables, satellites) — but the **DEFONEOS dome already renders power/cables/satellites**; the real gap is *governance use-cases* (EU AI Act Art 52 → GPU-cluster/data-centre compliance; DORA → grid resilience). Wire the dome layers to those use-cases, don't re-ingest data.

## B · THE PLAN (aligned to the directive; owner-gated = stage, never fire)

**Lane 1 — Assurance → Trust Center (highest ROI, we already built the parts):**
1. Add **DORA** (+ ISO 27001, SOC 2, Cyber Essentials, OWASP-Agentic) to the framework set in `sovSystemCard` / `sovOscal` / the MCP `signSystemCard`/`signOscal`.
2. Build a **`trust.html`** on defoneos + csoai: live-signed System Card + OSCAL + verify + the SEAL — the "Trust Center" gov/enterprise demand. Uses shipped artifacts.
3. Package the £999 + £4,950 offers on-site (they map 1:1 to the audit's gov/enterprise gaps).

**Lane 2 — Cyber (Gods-Eye + our own estate):**
4. Our estate: **SHA-pin GitHub Actions**, add **CSP + tighten CORS** on csoai sites (audit HIGH bugs, ~1.5h), rotate/vault secrets (already in the security runbook + 3306 already closed).
5. Gods-Eye: fold in **AIMap** (scan our own exposed AI endpoints) + a **JWT-default-key** + **supply-chain SHA-pin** checker as *signed* findings.
6. "Civilian-translation" brief generator (steal Ryan's clarity, not his fear) → feeds the content lane.

**Lane 3 — Distribution / owner-unlock:**
7. Publish `defoneos-sign` MCP (PUBLISH.md, owner-fires) → the registry answer to ClawHub poisoning.
8. Risk-Classifier **email capture** (5× leads) + the two revenue packets.
9. Fix the audit's launch-blockers (8×404, pricing mismatch, privacy-policy company name) on the CSOAI sites.

## C · ALIGNMENT

- **Claude Science:** unchanged and reinforced — DEFONEOS is the **signed-assurance MCP the ecosystem calls into**, not a tenant. The audit's "Trust Center / DORA / provenance" gaps are exactly what the sign-MCP + System Card + OSCAL fill. ClawHub/ASI04 poisoning makes *signed provenance* the headline. See [[defoneos-sign-mcp-assurance-seam]].
- **Hermes (overnight worker):** the `EAT_DIRECTIVE_2026-07-02.md` already points it at governance/assurance/cyber/revenue and freezes defence. This plan is its backlog. Hermes should: add DORA/frameworks, build trust.html, SHA-pin Actions, wire OpenGridWorks use-cases — **stage owner-gated items, never fire**.
- **GitHub:** (a) apply the **TeamPCP** lesson to *us* — SHA-pin all Actions, SBOM, no wildcard; (b) stage the sign-MCP repo/publish; (c) the "535 repos / 0 stars" problem = distribution, not more repos — curate, don't inflate (matches the anti-vanity rule in the directive).

## D · HONESTY / SAFETY LEDGER
- **Frozen/forbidden:** offensive AI, EW/counter-drone/arsenal, air-defence radar, through-wall vitals, phone-camera SIGINT (SOV-EYE/Panopticone). Care-floor hard stop — not absorbed.
- **Gated (authorized-use only):** autonomous-exploit tooling (Sandyaa/Lyrie) — pentest engagements with authorization, never product-baked.
- **Owner-gated (stage, never auto-fire):** npm/registry publish, DNS moves, secret rotation/seed, Stripe, gov applications (Cyber Essentials/G-Cloud).
- **Claims discipline:** assurance ≠ certification · provenance ≠ truth · "illustrative" labelled · no fear-selling. The threat numbers/IOCs above come from the dropped Kimi briefs — **verify before publishing any as fact.**
- **Coverage honesty:** I read 3 of 8 files fully + indexed the rest; the offensive corpus was intentionally skipped, not overlooked.

## Already done this session (context)
3306 closed · signed-assurance stack shipped (System Card + OSCAL, dome + MCP; CoT `.cot`; watch-box alerting; feed provenance/health/freshness; verify round-trip) · TAK-relay design · launch pack (£999 · £4,950 · security runbook · DNS) · EAT directive set.
