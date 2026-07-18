# CSOAI/MEOK — 13-Day Launch One-Pager → 4 Jul 2026
**Author:** Claude · **Date:** 2026-06-22 · **Status:** decision-ready synthesis of 4 Dragon-Mode docs + live verification
**Companion:** a deep-research report (video GTM / tech hardening / positioning / Series-A) is running and will deepen §5.

---

## 1. The 4 verified truths that OVERRIDE the Dragon docs
These were checked live this morning. Where a Dragon doc conflicts, this wins.

| # | Truth | Source-verified | Consequence |
|---|---|---|---|
| 1 | **EU AI Act high-risk obligations POSTPONED** → Annex III ~2 Dec 2027, Annex I ~2 Aug 2028 (Digital Omnibus) | Gibson Dunn, Latham | ❌ Kill the "Aug 2 2026 / 6-week countdown." Sell **readiness**, not a moved deadline. |
| 2 | **Fable 5 / Mythos 5 export-control-suspended (Jun 12)** | Anthropic, Fortune, Al Jazeera | ✅ Real, and it **proves the multi-model BFT thesis**. Strongest now-verifiable pitch line. |
| 3 | **FreeLLMAPI = "personal experimentation only"** + free tiers ban commercial pooling | the repo itself | ❌ Never route the moat, customer data, or the ledger through it. Sovereign $0 path = **local Ollama** (already running) / cheap dedicated GPU. |
| 4 | **King-hive ledger was 43% non-attestable noise** (judge maxing both sides → silent default-A) | live 463-row audit | ✅ **FIXED today** — re-judge ties → DRAW + `attestable` flag. Any moat claim must filter `attestable=True`. |

## 2. Keep / Cut / Fix — across all 4 Dragon docs
**KEEP (verified-good):**
- Dormancy / tiered-activation scaling (~1,000 active agents at peak, rest = DB state). Real game-engine practice.
- Batched "hive-mind" call (1 LLM call → all 47 agents). Real 47× call reduction; use for background towns only.
- Stay **lightweight/2D for the sprint**, defer UE5/MetaHuman. Matches our own architecture rule (heavy engines = optional decoupled layers).
- $0 cost goal — but via **our existing local Ollama**, not pooled free keys.
- SubQ 1.1 is **real** (subq.ai) — but as a *model to adopt*, not a drop-in attention patch. Park as "watch," candidate for the judge upgrade.

**CUT (landmines):**
- FreeLLMAPI as production/showcase backbone (truth #3).
- "Aug 2 / countdown" framing (truth #1).
- Newsjacking the AI-safety-stripping tool + hacktivist news for views — off-register for a regulator/enterprise brand.
- Quantum *threat* framing off a 9-atom reservoir computer (does NOT threaten Ed25519). Keep PQC as sober forward-looking only.
- `gpt-4o`-on-free-tier, real-region→governance-style+color mapping (reputational risk), inflated TAM / self-assigned "$12.5M IP".

**FIX (improve what exists) — now research-backed:**
- **Judge:** replace the single falcon3 judge with a **heterogeneous local jury** (falcon + llama/gemma + qwen/mistral — disjoint families), majority/avg pooling. Diverse panels beat a single large judge AND are ~7× cheaper ([PoLL, arXiv 2404.18796](https://arxiv.org/html/2404.18796v2)). Headcount ≠ quality — correlated judges give ~2 effective votes and can *lose* to the best single ([Nine Judges, 2605.29800](https://arxiv.org/html/2605.29800)); prioritize family diversity + strength. Then layer **judge-time compute** (verification→debate→aggregation) via open-source **Verdict** ([github.com/haizelabs/verdict](https://arxiv.org/pdf/2502.18018)) to squeeze discrimination out of weak local models at ~$0. Add **swap-consistency** (position-swapped re-judge) — position bias is systematic and worst exactly at near-ties ([2406.07791](https://arxiv.org/abs/2406.07791)), which validates the tie-rejudge fix and is the next step past it.
- **Ledger — self-attestation gap: ✅ PROTOTYPE BUILT (Day22).** `sigil_anchor.py` on the VM: Merkle-roots the `attestable=True` verdicts → manifest + inclusion proofs → **OpenTimestamps Bitcoin anchor**. First anchor live (`anchor_0000`, 5 verdicts, root `d656…29b2`); verifier confirms root + live-ledger match + inclusion proof; Bitcoin confirmation pending (~hours, then `ots upgrade`). Anyone can now verify a governed-vs-ungoverned verdict existed at a provable time **without trusting CSOAI** — the wedge no competitor (MS HMAC / Asqav cloud) can match. NEXT: auto re-anchor (cron), publish manifests+proofs publicly.
- Promote local Ollama to the backbone; demote FreeLLMAPI to throwaway dev only.

## 3. The moat discipline — SHARPENED by research
**"We have an attested ledger" is NOT the moat — it's table-stakes.** Microsoft's Agent Governance Toolkit (MIT, ~4.4k stars, v4.1.0) already ships Merkle tamper-evident per-decision audit *and* sub-ms runtime policy enforcement; Asqav already ships ML-DSA-65 (post-quantum) signed hash-chained trails. **CSOAI's genuine, defensible wedge is narrower and real: sovereign, self-hostable, OFFLINE-verifiable, third-party-verifiable asymmetric local signing + no-single-model/vendor-dependency** — vs Microsoft's symmetric HMAC (not third-party-verifiable) and Asqav's *server-side/cloud* signing (not sovereign). Lead with **"governance no one has to trust us — or any single vendor — to verify,"** not "we have an audit log." (Honest weaknesses to close: no runtime enforcement yet; no PQC yet — see §2 Fix.)

**The attested ledger underpins the moat; the agent town is the Policy Lab — a compliance experiment engine, not a showroom.** Each town = a control-vs-treatment experiment (automated vs manual compliance); results signed on-chain; proven policies auto-scale. This makes the town *earn its place* by generating the attested ledger, instead of being eye candy. Lead every artifact with the cryptographically-signed governed-vs-ungoverned result — that's the thing no competitor (Credo AI / Vanta = static checklists) has.

**Two non-negotiables for the Policy Lab (honesty register):**
- **Earn the numbers.** Every metric must come from an experiment that *actually ran* and was *signed to the ledger*. NEVER put a fabricated detection rate (e.g. "98.3%") on a regulator-facing dashboard — for a compliance vendor that is fraud-adjacent and detonates the moat. Real simulated results, honestly labeled, are still a killer demo.
- **Label in-simulation scope.** Every dashboard figure reads "N=47 agents, in-simulation, not real-world-validated." That label is a credibility *feature*, not a weakness.

**Compliance hook = IN-FORCE frameworks (verified).** Lead with **DORA** (in force since 17 Jan 2025; critical ICT providers designated Nov 2025) and **NIS2** (transposition deadline Oct 2024, active EU enforcement) and GDPR — NOT the EU AI Act high-risk (moved to 2027). Those are the frameworks that actually bite this quarter; that's your honest near-term urgency.

## 4. 13-day plan — ledger-first, sovereign, segmented video
> Sequence: prove the engine → make it watchable → cut video per audience → soft launch. Video "blast" happens only once you're happy (your call).

- **Days 1–3 — Engine PoC = first Policy Lab experiment (the moat):** clean King-hive ledger on local Ollama running ONE real control-vs-treatment experiment — **automated vs manual DORA compliance** (in-force framework), Finance hive, `attestable=True` verdicts at volume. Stronger judge (pairwise + jury) from the research. **Deliverable: a public, verifiable SIGIL result with REAL simulated numbers, labeled in-sim scope.**
- **Days 4–6 — Make the experiment watchable:** 2D Policy Lab view over the *real* ledger (not a mock) — control town vs treatment town, live metrics, "watch 30 sim-days in 30s." 1 capital, 47 agents, dormancy tiering. The dashboard reads the attested chain; every figure labeled in-simulation.
- **Days 7–9 — Proof assets:** 1–2 white papers grounded in the ledger data; the 60-sec "watch AI agents govern themselves, cryptographically signed" demo. This is the single proof base.
- **Days 10–11 — Segmented video cuts** (one proof, three edits):
  - *Regulators/B2B (LinkedIn/X):* "governance by design, cryptographic audit trail" — measured, proof-first.
  - *Broad/viral (TikTok/Shorts/Reels):* "I built a country run by AI — and it signs every law" — hook-first, no newsjacking.
  - *Investors (X/DMs):* velocity + the attestable ledger as the defensible asset.
- **Days 12–13 — Soft launch:** waitlist/demo page live, outreach to the 7 enterprise prospects + design-partner conversations. Blast video when YOU'RE happy.

## 5. The 4 gaps that need YOU (not auto-fireable)
1. **Stripe live-flip** (real money decision)
2. **`keystone sync-vercel STRIPE_SECRET_KEY`** (needs your keystone session)
3. **Migrate pages to Next.js apex** (shared-tree code review)
4. **Approve competitor logos on /switch** (legal/brand call)
> Fastest is #2 (keystone Stripe sync). Highest-leverage *content* is the 60-sec ledger demo.

## 6. Fundraise + video reality — RESEARCH-VERIFIED (primary sources)
**The single biggest re-weight:** what actually unlocks a 2026 raise is **a design partner using the product in production who will take a reference call** — not a standalone tech demo. Named sitting GPs on record (Work-Bench, Wing VC): "customers using it in real day-to-day operations, willing to take reference calls"; "revenue without narrative is a feature; narrative without traction is vaporware — you need both" ([TechCrunch](https://techcrunch.com/2025/12/29/vcs-predict-strong-enterprise-ai-adoption-next-year-again/)). **So the 13-day artifact should be: ONE design partner running the attested Policy Lab on THEIR compliance question, willing to vouch.** That outranks the demo.

**Raise comps (real, named, dated — use these, in this order):**
- **Vijil** — $17M Nov 2025 (BrightMind/Mayfield/Gradient/Alphabet), agent trust/safety/resiliency. *Freshest + most on-point — lead with it.* ([SiliconANGLE](https://siliconangle.com/2025/11/25/agentic-resiliency-startup-vijil-raises-17m-continuously-safeguard-ai-agents/))
- **Braintrust** — $36M A (a16z, 2024) → $80M B at $800M post (ICONIQ, Feb 2026). Eval/observability.
- **Credo AI** — $12.8M A (Sands Capital, 2022). Closest *pure* AI-governance comp (dated).
- ⚠️ **Axiom Quant** ($200M / $1.6B, Mar 2026) — REAL but a **trap comp** (formal code-proving, star-founder megaround). Use only as "verifiable AI is hot" signal; **NEVER cite the $1.6B for sizing.**
- **Sizing envelope (Carta/CRV, primary):** seed median ~$4.0M / 19–20% dilution / ~$20M post; Series A $5–15M / ~17.9% dilution / **$1–2M ARR baseline** (→ $2–5M competitive); **AI carries a verified +38% Series-A valuation premium**.

**Video reality — HONEST NEGATIVE:** there is **no audited proof** that short-form video reliably converts for technical B2B founders (the "50% of pipeline" / "20× shares" / "74% leads" claims were all refuted). → Treat the blast as **top-of-funnel awareness only**, measure ONLY first-party outcomes (waitlist / demo / investor inbound) via **UTM-tagged links**, ignore view counts. The segmented-cuts plan (§4) stands; just don't promise yourself conversion you can't source.

## 7. Cross-jurisdictional embodied-AI governance — RESEARCH-VERIFIED
**MVP slice (build *after* the DORA MVP proves the pattern):** a **Unitree humanoid (China) → UK** under **ISO 13482** (personal-care robots), with a machine-readable **Policy Card** on the agent + a **P2T** rule, run in a permissive simulator, governed-vs-ungoverned outcome **Merkle+OTS attested**. One scenario, one sector, signed = the cross-border demo.

**Eat-and-integrate (license-checked):**
- ✅ **Apollo** (Apache-2.0, ships Dreamview sim) · **LeRobot** (Apache-2.0, code) · **EASA** EU drone reg as structured **XML** (Reg 2019/947+945) · **LCFI** standards catalog (CC-BY data) · **NIST AIRC crosswalks** (incl. Korea TTA / Japan AISI / Singapore AI Verify) · **Policy Cards** + **P2T** (policy-as-code, preprints).
- ❌ **TRAPS — do NOT ship:** GR00T-N1.5-3B (non-commercial), Waymax (non-commercial); LCFI *code* is AGPL-3.0 (copyleft).

**East-first (real):** China's MIIT Humanoid Robot Standardization Committee + ~90% of 2025 humanoid output (~12,800 units) — genuinely ahead on humanoid standards. Narrative: *"the East is writing the rules first; the West has no crosswalk — we built it, signed."*

**The white space (your wedge):** WP.29/1958 type-approval (e.g. UN R157) is the *only* working multi-jurisdiction mutual-recognition template — and **no binding instrument harmonizes civilian autonomous-systems rules across jurisdictions.** That gap = your cross-jurisdictional attested testbed has **no incumbent.** Adopt **policy-as-code** (Policy Cards/P2T) as the machine-readable regulation layer — it's the "what's missing" piece I flagged, and it now has real tooling.

## 8. AI-welfare / consciousness governance — RESEARCH-VERIFIED
**The framing the literature itself endorses:** *"we simulate and GOVERN the open question; we do NOT claim consciousness."* McClelland 2025 ("Agnosticism about Artificial Consciousness") argues even an AI meeting ALL indicators wouldn't warrant a consciousness verdict — so your stance is the *academic* position, not a dodge.
- **Adopt verbatim:** the Butlin/Long/Bengio/Chalmers/Birch **"indicator properties"** framework (arXiv 2308.08708; peer-reviewed *Trends in Cognitive Sciences* 2025) — operationalizes 5 mainstream theories into checkable indicators, scored as **credences not verdicts**, and concludes *no current AI is conscious*. Use as the assessment axis.
- **Ready-made governance checklists:** "Taking AI Welfare Seriously" (Long/Sebo 2024) + Butlin & Lappas "Principles for Responsible AI Consciousness Research" (2025). Institutional cover: Eleos AI, NYU Center for Mind Ethics & Policy, Anthropic model-welfare.
- **Buildable, permissive:** CTM-AI (Apache-2.0) → "agents built on a CTM-style architecture," zero consciousness claim.
- **White space:** nobody runs an *attested, cross-jurisdictional* consciousness-assessment / AI-welfare governance sim. The papers exist; the attestation+crosswalk layer doesn't.

## 9. Training-as-product (Phase-2 revenue) — RESEARCH-VERIFIED
- **First buyers:** regulated **finance (BFSI, ~17.5% of 2025 compliance-training demand) + healthcare** (fastest-growing ~9.6% CAGR). **Treat headline serious-games TAM as HYPE** — analysts disagree wildly ($13B–$71B); one figure was refuted. No unsourced TAM in a deck.
- **Efficacy — modest & conditional (say it honestly):** sim/games beat *passive* content (+9–14% retention; g≈0.33) but can *lose* to actively-engaging methods, with publication bias (Sitzmann 2011; Clark 2016). Frame as *"better than passive content, when well-designed"* — never "transformative."
- **The wedge is NOT AI-roleplay** (ICA already ships AI-roleplay compliance training, ~£765) — it's **attested, verifiable completion/competency records** via **Open Badges 3.0 on W3C Verifiable Credentials**, reusing your existing Ed25519/Merkle infra. Genuine, early-stage, uncommoditized.
- **Discipline:** issue *attested completion records*, NOT "accredited certification" (real accreditation bar). Free tier = consented data + reach; paid = credentials + enterprise analytics.

## 10. MSPB `sim_params` — integration note
The **Master Simulation Parameter Builder** (`meok_simulation_params.docx`) is the **parameterization layer** for the cross-border Policy Lab (§7): 12 civilization→jurisdiction mappings with real regulatory profiles + per-sector safety thresholds (GDPR 0.95, UN R157 0.90, NIS2, MRLs…), 102 OCEAN+2 agent archetypes, 40 cross-border event types, 37 metrics, BFT voting patterns, pheromone taxonomy.
- **Integrate as the config** for the DORA MVP (§4 D1–3) and the Unitree-China→UK MVP (§7) — the thresholds/archetypes become the sim's tunable parameters; no rebuild, it's the param spec.
- **⚠️ REQUIRED REVISION before use:** §6.4/6.6 base the token budget on **FreeLLMAPI** → replace with **local Ollama** (standing landmine; sovereign + $0). Otherwise the spec is sound.
- **In-sim scope:** every threshold/score is a *simulation parameter*, not a regulatory determination — label accordingly.

---
*Honesty register: REAL vs HYPE labeled throughout; counts/valuations from internal docs are unverified until checked. The only "done & verified" claim here is the King-hive ledger fix (§1.4).*
