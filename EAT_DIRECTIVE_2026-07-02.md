# ⚑ EAT DIRECTIVE — 2026-07-02 (overnight worker focus)

**Owner-set. Supersedes prior sprint priorities until changed.** Every autonomous/overnight agent (Claude / Hermes / JEEVES / Kimi / etc.) reads this and steers to it.

## FREEZE (do NOT spend cycles here)
- ❄️ **Defence capability sprints** — no new DEFONEOS *capability* features, no new defence surfaces, no version-N SEAL churn.
- 🚫 **Anything offensive** stays permanently off-limits (swarm/arsenal/targeting/kinetic/ransomware/surveillance) — violates the care-floor and the product reframe. Not "frozen", *forbidden*. See [[defoneos-product-reframe]].
- ❄️ Vanity metric batches (repo counts, "100/100", test-string tallies) — stop inflating; distribution ≫ built.

## FOCUS (the overnight worker's real lanes now)
1. **Governance / assurance** — the signed-assurance stack is the product. Deepen + distribute:
   - `defoneos-sign` MCP (24/24, cross-lib verified): finalize for publish (repo/npm/registry) per PUBLISH.md — *stage it; owner fires the publish*.
   - System Card + OSCAL + verify.html: keep them verify.html-compatible; add worked examples; polish the gap-analysis + £999 collateral in `csoai-launch-pack/`.
   - The JSP 936 / EU-AI-Act / Turing-CETaS wedge is the narrative — reinforce with evidence, not new features.
2. **Cyber** — Gods-Eye CISO self-scan: broaden the OSS scan stack (nmap/Nuclei/ZAP/Prowler/Garak) on the node; keep every finding signed. The security-estate runbook (`csoai-launch-pack/03`) is live work.
3. **Owner-unlock / revenue** — everything that converts to the first £999 sale + first £4,950 gap analysis. Prep, don't block: warm-lead lists, one-pagers, fulfilment scripts.

## RULES (unchanged, load-bearing)
- Honesty register: label illustrative vs live; provenance ≠ truth; assurance ≠ certification. No inflated claims.
- Scoped commits only (never `git add -A` in the shared tree). Tag WIP with your platform name.
- Owner-gated actions (publish, DNS, secrets, money) → **stage + document, never fire.**

## Done today (context for the worker)
- 3306 closed to the world (firewall rule `csoai-mysql-3306` deleted; internal VPC retains access).
- os.csoai.org already live but serving the **CSOAI site**, not the OS — pending an owner decision (don't force-move).
- Signed-assurance stack shipped: System Card + OSCAL (dome + MCP), CoT `.cot`, watch-box alerting, feed provenance/health/freshness, TAK-relay design, launch pack.

> One line to hold: **the biggest lab validated that provenance+reproducibility is the product; DEFONEOS does the sovereign, signed version. Deepen the assurance moat, distribute it, and convert — don't build more defence.**
