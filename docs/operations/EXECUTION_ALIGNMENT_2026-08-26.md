# EXECUTION ALIGNMENT — ARC/Ndea Catapult + Benchmark/Competition Playbook (2026-08-26)

Maps the two new playbooks into the estate and carries the three funded actions
(grants dossier, competition entry kit, x402 metering). For: K3 execution + Claude lane.

## A. CATAPULT ALIGNMENT (ARC/Ndea dual structure → CSOAI)
- **Structure (deferred gate):** CSOAI **Foundation** (neutral signed-measurement standard,
  corrections ledger, free trust engine) + CSOAI **LTD** (metered assurance/data/subs).
  Per the playbook + the earlier dual-structure ruling: stand up the Foundation **only when
  ≥1 grant lands or revenue ≥£50K** (not now; the LTD carries the doctrine today).
- **The moat (what we have that NONE of the comparables have):** Ed25519-signed SHA-256
  attestation cards + **append-only corrections ledger** + standalone offline verifier.
  Vals AI ($40M/$400M — a16z "every market needs an independent scorekeeper") and Arena
  Intelligence ($150M/$1.7B) validated the market... without our verifiable layer. Our
  wedge = **the signed/verifiable layer** (already live: 14-of-14 board, scorecard #780,
  verify action repo, EAS rail #782).
- **Revenue engines (doctrine-safe, per playbook):** subscriptions/licensing (MSCI 53.5%
  op margin template), neutral-consortium dues (MLCommons model), data licensing — all
  compatible with "we measure, we sign, we re-attest." Off-doctrine: issuer-pays ratings,
  certification marks, ANY token.
- **Prize/competition economics:** the open-source-to-win mechanism converts prize money
  into public goods AND wins standard-setting authority (ARC's NIST/CAISI endgame). CSOAI
  enters competitions as measurer/competitor — never certifier (playbook rule).

## B. THE THREE ACTIONS

### B1. GRANTS DOSSIER (time-sensitive: NLnet opens 2026-09-03, deadline 2026-11-03)
**NLnet/NGI Zero one-pager (draft, doctrine-clean, EUR):**
> Project: **Council of AI — signed, stranger-verifiable AI measurement infrastructure**
> (open-source: offline verifier `verify_signed.py` + GitHub Action, GSPC board, MCP
> security-scorecard, append-only corrections ledger). Purpose: trust infrastructure for
> AI evaluation — every measurement is an Ed25519-signed, recomputable artifact; public
> corrections ledger makes re-attestation auditable. FOSS outputs (MIT-0/CC0-4.0 for
> artifacts per test policy), no token, no certification, no issuer-pays. European
> dimension: UK-based CSOAI Ltd (Companies House 16939677); EU regulator-adjacent work
> (AI Act Art 50 machine-readability), pan-EU benchmark corpus. Verify UK-entity
> eligibility against the European Dimension requirement before submitting.

**EF ESP inquiry (doctrine-positive: ESP explicitly disqualifies governance-token hints —
our no-token doctrine is the rare positive signal):** request for small grant up to $30K
for the attribution/verification tooling (offline verifier + attestation schema).
**Manifund project description:** 3-line pitch (regrantor-seeded $5K–$50K, for-profit OK).
**Eligibility matrix:** NLnet (verify UK "European Dimension") · EF ESP ✓ · Manifund ✓ ·
Longview (for-profits explicitly welcome; watch for the next RFP window) · Coefficient/
OpenPhil evals RFP (CLOSED — monitor) · SFF 2026 round (Apr 22 deadline passed; nonprofit
lean) · Crypto grants (OP/XRP/ETH = token-denominated receipt → treasury/messaging
surface; require explicit flagging per doctrine — not ours to take without owner sign-off).

### B2. COMPETITION ENTRY KIT (all CASH, all open-source-to-win — doctrine-clean)
| Competition | Pool | Entry via | Our angle | Gate |
|---|---|---|---|---|
| ARC Prize 2026 (ARC-AGI-3 + final AGI-2 + paper) | >$2M | Kaggle/API | paper track: significance-gated ties + anti-gaming event core | paper = agent-doable |
| AIMO3 | $2,207,152 | Kaggle | measurement methodology | needs model fleet |
| HackAPrompt 2.0 | $100K+ | public | prompt-injection measurement | needs fleet |
| Gray Swan Safeguards (UK AISI/OpenAI/Anthropic) | $140K | platform | jailbreak/evals harness | needs fleet |
| Mozilla 0din → Anthropic/OpenAI bounties | $200–$100K | HackerOne | DeepSeek guardrail harness | needs fleet + accounts |
**Execution gate (honest):** ARC paper track = WRITE NOW (agent-doable, no model calls).
Fleet-dependent entries need the 3090's model store restored (ollama binary + base pulls
— earlier discovered /var/extra gone; reinstall + pull ~15GB documented) OR a frontier
API key (owner). Schedule: paper draft this week; fleet restore queued.

### B3. x402 METERED ENDPOINTS (trust engine free; workflow/scale metered)
- Rail already live: `POST /api/checkout {provider:"meta"}` (HTTP 402 + signed invoice)
  + `GET /api/fulfill` (Ed25519 receipt verify → artifact URLs + email queue) (#674).
- Metered surfaces to gate: bulk/replay endpoints (`/api/gspc` bulk, corpus downloads,
  scorecard bulk, index feeds) — same x402 pattern as eunomia-data.
- Gate state: settlement needs owner `RECEIPT_PUBKEY_HEX`; free tier stays free; metered
  tier = workflow/scale only. PERMISSIONLESS + doctrine-clean (USDC-on-Base as payment =
  not tokenization; eunomia precedent).

## C. FOR CLAUDE LANE (execution pointers from the playbooks)
1. Rate-the-raters target list (playbook §5) → publish the comparisons with Vals/Arena
   framing: "signed/verifiable layer" (their miss = our wedge) — cite, never disparage.
2. EU timing: AI Act Digital Omnibus force 2026-07-27; **Art 50 live 2026-08-02**;
   **machine-readable watermarking deadline 2026-12-02** — our Article 50 detector line
   is directly timed; surface `/api/detect` + Art 50(2) readiness.
3. Absorption shortlist (MIT/Apache: Inspect AI 200+ evals, HELM, lm-eval-harness, garak,
   PyRIT, promptfoo, HarmBench/JailbreakBench/WMDP, AILuminate CC-BY) → strengthen axes;
   AVOID Llama Community License weights + gated GAIA-v1.
4. Community benchmark authority: ARC-Prize-style free-forever public measurement = the
   standard-setting flywheel; corrections ledger = the citable moat.
