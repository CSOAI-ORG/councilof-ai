# 🐉 Sovereign-AI Estate — Phased Improvement Roadmap (2026-07-14)
_Evidence base: deep-research run wf_784e45dc — 106 agents, 24 sources fetched, 107 claims extracted,
25 adversarially verified (22 confirmed / 3 refuted). Honesty register is load-bearing: every claim
tagged [V]=externally verified · [V-run]=verified by our own run this session · [P]=projection ·
[✗]=REFUTED, do not use._

## The thesis the evidence supports
The binding constraint is **distribution, not capability**. Our own numbers are modestly honest
(GSM8K 0.43 raw / 0.71–0.84 solver [V-run]) and free-GPU QLoRA lowers cost but **does not manufacture
frontier IQ**. The leverage is the two things we already have that the market is only now standardising
around: **(1) a signed, offline-verifiable audit layer** — which as of Apr 2025 maps onto a real emerging
standard (OpenSSF Model Signing) — and **(2) a large already-built MCP fleet** into a distribution surface
that just standardised (official MCP Registry, Sept 2025). Sequence everything by leverage-per-effort.

## ⚠️ REFUTED — struck from every pitch/surface (research killed these 3)
- **✗ "All Qwen3 is Apache-2.0."** (0-3) License varies per variant — verify each model individually before use.
- **✗ UK AI-assurance TAM figures** (£1.01bn/£18.8bn/$276bn). (1-2) Failed verification — **do not cite any market-size number.**
- **✗ "Uncontested gap / no mechanism to certify third-party assurance."** (1-2) The *demand* is real (JSP 936 evidence-shortfall; "marking own homework") but competitors **Advai, Frazer-Nash** operate here. Lead on *signed + offline-verifiable* differentiation, never on "uncontested."

---

## PHASE 0 — Quick wins (days · low/no cost · highest leverage-per-effort)

**0.1 — One-canonical MCP publish → free fleet-wide distribution.** [V]
Publish the fleet once to the official **MCP Registry** (registry.modelcontextprotocol.io, launched preview 8 Sep 2025 — "primary source of truth that sub-registries build upon"). It auto-propagates into the **GitHub MCP Registry** (one-click VS Code install, ranked by GitHub stars) and downstream sub-registries (Smithery/Glama/MCP.so/PulseMCP). Highest distribution ROI in the estate: publish once, reach everywhere.
· Owner-gated: PyPI / registry publish token. · Caveat: GitHub adds a curation layer — "eligible," not instant.
· Sources: blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview · github.blog/…/meet-the-github-mcp-registry

**0.2 — Speak OMS: standards-conformant signing (positioning win, ~no engineering).** [V]
**OpenSSF Model Signing (OMS) v1.0** shipped 4 Apr 2025 (Google/NVIDIA/HiddenLayer, Sigstore keyless). Google's headline doctrine — *"sign the model when you train it and verify it every time you use it,"* with a tamperproof transparency-log audit trail — is **exactly the SIGIL sign-at-emit + on-device-verify architecture we already run.** Reframe DEFONEOS/Layer-0 in OMS vocabulary; emit OMS-compatible **detached signatures** alongside SIGIL (OMS is PKI-agnostic → our sovereign Ed25519 keys coexist). Turns a bespoke scheme into "standards-conformant," lowering buyer risk for free.
· Sources: github.com/ossf/model-signing-spec · blog.sigstore.dev/model-transparency-v1.0 · openssf.org/blog/2025/07/23/case-study-google-secures-machine-learning-models-with-sigstore

**0.3 — Real sovereign weights on free GPU — ✅ FIRST WEIGHTS DONE (Fable-verified).** [V-run]
The sibling lane trained **3 real QLoRA adapters on Qwen3-0.6B** (Fable-verified on disk at `~/.sovereign/models/`: sov3-small-fast 8.8MB r8 · sov33-large-world 18MB r16 · sov333-ultra-fast 18MB r16, with checkpoints). **Honest read:** these are *style-adapters*, not "world models" in the technical sense — and their own benchmark is blunt: **1/9 (11%) on raw facts, they learn voice not truth.** That is not a failure — it *independently confirms this roadmap's thesis*: raw model IQ isn't the lever; **RAG grounding (1.1) is the production path (sibling measured 42/57 = 74%).** Scaling path: Unsloth QLoRA also fits **Qwen3-14B on a free T4** and **Qwen3-30B-A3B (MoE) in 17.5 GB** — our Colab-T4 pipeline now works end-to-end (`HF_HUB_DISABLE_XET=1` + GitHub-jsonl + `return_dict=False`).
· Owner-gated: HF token for larger bases. · Caveat: QLoRA ≠ full FT; small 0.6B base ⇒ facts must come from RAG, not weights.
· Sources: unsloth.ai/docs/models/tutorials/qwen3-how-to-run-and-fine-tune · qwen.readthedocs.io/en/latest/training/unsloth · arXiv:2505.09388

**0.4 — Repo hygiene → automatic directory inclusion.** [V]
AI-curated self-updating directories (e.g. awesome-mcp-registry) score trust partly on **OpenSSF Scorecard** — which our bridges already run. Passing Scorecard across the fleet feeds those trust scores automatically. Secondary amplifier, not a traffic source — treat as signal-quality reinforcement.
· Source: github.com/sunnamed434/awesome-mcp-registry

**0.5 — Proof one-pager — DONE this session.** [V-run]
Honest, self-auditing design-partner page (verified 3.4× vs 1.0× robustness front-and-centre). Private Artifact; share when ready.

---

## PHASE 1 — Prove it works (1–2 weeks)

**1.0 — Governed-RAG POC vertical slice — ✅ BUILT & RUNS (Fable-verified this session).** [V-run]
`sovereign_merge_kit/sov33_governed_rag_poc.py` runs end-to-end, offline: question → dense retrieval (all-MiniLM-L6-v2) → **care-floor gate (abstains below 0.28)** → local sovereign model (`qwen3-precise` via Ollama) answers ONLY from grounded sources with citations → **Ed25519-signed receipt** (canonical `Ed25519Sigil`). Verified live: 2 governance Qs answered + cited from EU-AI-Act-Art.50 / GDPR-Art.9; 1 nonsense Q correctly ABSTAINED; all receipts verify; forged sig rejected; tamper breaks the chain. **This is the design-partner-runnable proof.** Next: swap MiniLM→BGE-M3 (1.1), expand KB, wrap a 1-page UI.

**1.1 — BGE-M3 hybrid RAG for factual grounding.** [V]
**BGE-M3 (MIT-licensed)** does dense + sparse/lexical + multi-vector retrieval in one model — hybrid retrieval to cut hallucination, no legal blocker in a sovereign/commercial stack. Wire it as the grounding layer under the council/dock so answers cite retrieved sources.
· Sources: huggingface.co/BAAI/bge-m3 · ACL 2024 Findings (Chen et al.)

**1.2 — Productize the signed System Card against JSP 936.** [V]
**JSP 936 Part 1, para 198** (GOV.UK, verbatim): externally-acquired AI "must attract the same level of confidence… MOD teams may have to stand up additional assurance capabilities to address evidence shortfalls." Turing/Accenture's own Sept-2025 deliverable is *"an example assurance workflow and system card."* → Ship DEFONEOS's **signed, offline-verifiable System Card** as the exact instrument their anchoring doc calls for. Map card fields to OMS attributes (0.2) + OSCAL.
· Sources: JSP936_Part1.pdf (assets.publishing.service.gov.uk) · turing.ac.uk/…/defence_ai_assurance.pdf · cetas.turing.ac.uk/publications/growing-uks-ai-assurance-market

**1.3 — Claim bootstrapped compute credits (zero-equity routes exist).** [V]
- **Azure Founders Hub: $5k** ($1k instant + $4k after business verification), **zero equity, self-serve.**
- **AWS Activate: $1k self-serve** (no VC needed); up to $100k only via accelerator.
- Google for Startups: comparable self-serve tier.
Enough to move real training off free-T4 constraints for specific runs.
· Owner-gated: sign-ups (your identity). · Sources: cloudkompas.com/blog/microsoft-for-startups-2026 · creditforstartups.com/programs/cloud

---

## PHASE 2 — Open the door (weeks · convert built → first paying partners)

**2.1 — Design-partner outreach, timed to the funding window.** [V + timing-risk]
A **£11M DSIT AI Assurance Innovation Fund** opens **Spring 2026** for "innovative and novel AI assurance mechanisms"; Turing Rec 6 urges **mandated contractual compliance clauses** forcing vendor transparency — the precise job a signed System Card does. Send the 3 drafted outreach emails (finance/health/defence) with the proof one-pager, aligned to this window. **⚠️ Re-check the fund is actually open before acting — forward commitments slip.**
· Sources: gov.uk/…/trusted-third-party-ai-assurance-roadmap · cetas.turing.ac.uk/…

**2.2 — Stripe live + credit-card trial for the assurance tier (B2B wedge, not consumer).** [V]
OSS free-to-paid converts at only **0.5–3%** (Elastic ~1%); **credit-card-gated trials convert ~30% vs ~8% no-card.** Implication: the paying door is the **B2B assurance tier**, not the £12.99 consumer OS. Turn on Stripe for a card-gated assurance-SaaS trial; keep the consumer OS as top-of-funnel/credibility, not the revenue bet.
· Owner-gated: Stripe key. · Sources: SaaS-conversion fetch (OSS-SaaS + ChartMogul benchmarks)

---

## PHASE 3 — Strategic bets (months · higher risk/reward)

**3.1 — Sovereign MoE weights.** [V feasibility] Train/serve **Qwen3-30B-A3B (17.5 GB)** as the "large tier" sovereign brain once credits (1.3) land — a real capability step, still governance-first.
**3.2 — Defence-assurance certification play.** [P, contested] Pursue the assurance-provider position — but honestly **contested** (Advai, Frazer-Nash). Win on *signed + offline-verifiable + reaches-legacy (22 bridges)*, never on "uncontested." Certification is a multi-quarter relationship play, not a quick win.

---

## Owner-gated dependencies (nothing below is faked as done)
| Lever | Unlocks | Phase |
|---|---|---|
| PyPI / registry publish token | 0.1 fleet distribution | 0 |
| HF token | 0.3 real weights | 0 |
| Azure/AWS/Google sign-ups | 1.3 compute credits | 1 |
| Stripe key | 2.2 paying door | 2 |
| Send outreach / share Artifact publicly | 2.1 first partners | 2 |
| GitHub gist re-push | corrected combined-cell recipe | 0 |

## Open questions research did NOT resolve (next research pass)
1. **EU hooks** — DORA/NIS2/AI-Act GPAI Code of Practice + ISO 42001: which create *offline-verifiable audit* obligations a signed card serves, vs incumbent GRC tooling? (no surviving verified claim)
2. **Competitor sizing** — Advai / Frazer-Nash: how contested is the System-Card niche *in practice*? Right-size the wedge before heavy outreach.
3. **World-models / MoE-serving repos** — which permissive 2025-26 repos are genuinely worth absorbing vs aspirational? (unverified here)
4. **Consumer→paid activation** — is the paying path really the B2B assurance wedge over the consumer OS? (no external verified claim; 2.2 is the current best inference)
