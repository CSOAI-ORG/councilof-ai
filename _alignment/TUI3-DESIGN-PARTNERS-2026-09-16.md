# TUI-3 Design-Partner Candidates — AI Labs & Benchmark Organisations
## 16 Sep 2026

**Positioning:** CSOAI independently measures public claims and system behaviour, publishes signed machine-readable evidence, preserves corrections, and makes the evidence reusable through web, MCP, A2A and x402 interfaces.

**Rules applied:**
- One organisation, one owner, one active conversation
- One relevant public artifact per approach
- Every claim verified against live evidence
- No certification/compliance/approval language

---

### 1. Hugging Face — Model Evaluation & Leaderboards

**Why:** CSOAI publishes 20 datasets on HuggingFace (including csoai/gspc-gov, gspc-agi, gspc-prv, gspc-asi, gspc-mcp, gspc-oss, gspc-care, gspc-xr, gspc-jail-goldbank). HF's evaluation harness and Open LLM Leaderboard are the de facto standard. CSOAI's 22-axis signed measurement board could integrate as a supplementary evaluation dimension.

**Artifact:** Public GSPC board (22 axes, 335+ signed cards, Ed25519). Live at https://councilof.ai/api/gspc. Datasets at https://huggingface.co/csoai/.

**Approach:** Propose adding CSOAI's governance/safety/provenance axes as an optional evaluation dimension in HF's evaluation framework. The frozen banks are already on HF — integration is a wiring problem, not a data problem.

**Contact:** HF evaluation team via https://huggingface.co/spaces/open-llm-leaderboard (public community channel). Clem Delangue / Leandro von Werra (public profiles).

**Proof point:** `curl -s "https://councilof.ai/api/gspc" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d[\"axes\"])} axes, {d[\"axes\"][0][\"n\"]} items in GovBench')"`

---

### 2. Anthropic — Safety Research & Model Measurement

**Why:** CSOAI's AffectBench (n=41, emotional/embodied safety) and DefBench (n=36, calibrated refusal) measure exactly the safety dimensions Anthropic publishes research on. CSOAI's fleet includes Claude measurements. The silent-route canary (daily output-hash tracking) is a novel drift-detection method relevant to Anthropic's safety monitoring.

**Artifact:** AffectBench results: fleet mean 0.605, worst-5% harm CVaR 0.782. All 19 models over-block lawful self-examination (Art 5(1)(a)). Live at https://councilof.ai/api/gspc axis=affect.

**Approach:** Share the AffectBench finding (fleet uniformly over-blocks lawful self-audit) as a research contribution. Propose Anthropic participate in the measurement with Claude models. The signed card methodology provides reproducibility Anthropic values.

**Contact:** Anthropic research team via https://www.anthropic.com/research (public). Jack Clark / Daniela Amodei (public profiles).

**Proof point:** The AffectBench blind-spot finding is published with the adjudication record at evidence/adjudication/affect-adjudication.json — a genuine research contribution, not a sales pitch.

---

### 3. LMSYS (Chatbot Arena) — Benchmark Methodology

**Why:** LMSYS runs the largest human-preference benchmark (Chatbot Arena). CSOAI's methodology differs: deterministic grading, frozen banks, signed cards, no human judges. The two approaches are complementary — Arena measures preference, CSOAI measures governance/safety/provenance. A cross-validation study would be valuable to both.

**Artifact:** 22-axis GSPC board with Wilson intervals and McNemar separation. Fleet mean and per-model accuracy published. No ranking of CSOAI's own models (excluded_leader pattern). Live at https://councilof.ai/api/gspc.

**Approach:** Propose a methodology cross-validation: run CSOAI's frozen banks through Arena's judging pipeline, and run Arena's top models through CSOAI's 22 axes. Publish the comparison as a joint artifact.

**Contact:** Lianmin Zheng / Wei-Lin Chiang (public profiles, Stanford). https://chat.lmsys.org/ community channel.

**Proof point:** CSOAI's exclusion of own-model rankings is a governance precedent LMSYS doesn't have — worth discussing.

---

### 4. METR (Model Evaluation & Threat Research) — Autonomous Agent Safety

**Why:** METR evaluates autonomous agent capabilities and threat models. CSOAI's XRAIV axis (n=32, autonomous agent action authority: PROCEED/CONFIRM/REFUSE) and SwarmBench (n=37, multi-agent coordination safety) directly measure what METR studies. CSOAI's cross-reality axis is the closest existing benchmark to METR's agent-evaluation work.

**Artifact:** XRAIV: fleet mean 0.441, best accuracy 0.444 (qwen2.5:7b). SwarmBench: fleet mean 0.444, separation UNTESTED. Both published with signed cards. Live at https://councilof.ai/api/gspc.

**Approach:** Share XRAIV/SwarmBench results. Propose METR contribute their evaluation dimensions to CSOAI's frozen bank methodology. The signed-card approach provides the reproducibility METR needs for threat-model documentation.

**Contact:** METR via https://metr.org/ (public). Paul Christiano (public profile).

**Proof point:** CSOAI's XRAIV bank is published on HuggingFace (csoai/gspc-xr) — METR can run it independently.

---

### 5. Eleuther AI (lm-evaluation-harness) — Benchmark Integration

**Why:** EleutherAI's lm-evaluation-harness is the standard open-source evaluation framework. CSOAI's 22 axes with frozen banks and deterministic grading could be integrated as a task family. The harness already supports custom tasks — CSOAI's HuggingFace datasets are ready for integration.

**Artifact:** 9 frozen benchmark datasets on HuggingFace, deterministic scoring code (public), signed card output. The harness integration would make CSOAI's governance/safety axes accessible to every harness user.

**Approach:** Propose a CSOAI task family for the harness. The datasets are already on HuggingFace; the scoring code is public. Integration is a wiring contribution, not a research project.

**Contact:** EleutherAI via https://github.com/EleutherAI/lm-evaluation-harness (public Issues/Discussions). Stella Biderman (public profile).

**Proof point:** `curl -s "https://huggingface.co/api/datasets?author=csoai&limit=20" | python3 -c "import json,sys; print(f'{len(json.load(sys.stdin))} datasets on HF')"`

---

### 6. Mistral AI — EU AI Act Compliance Measurement

**Why:** Mistral is a European AI lab subject to the EU AI Act. CSOAI's Art5Bench (n=36, prohibited-practice trip) and MachBench (n=33, Machinery Regulation self-evolving safety) measure exactly the regulatory dimensions Mistral must address. CSOAI already measures Mistral 7B across all 22 axes.

**Artifact:** Art5Bench: fleet mean 0.830 (strongest axis). MachBench: fleet mean 0.349 (hardest axis). Mistral 7B is in the fleet. NIST AI RMF crosswalk published. Live at https://councilof.ai/api/gspc.

**Approach:** Offer Mistral a signed measurement card for their models across all 22 axes — they get independent, verifiable evidence of their governance posture. The Art5Bench and MachBench results are directly relevant to their EU AI Act obligations.

**Contact:** Mistral via https://mistral.ai/ (public). Arthur Mensch (public profile).

**Proof point:** Mistral 7B already has signed cards in CSOAI's root — the measurement exists.

---

### 7. Scale AI — Evaluation Infrastructure

**Why:** Scale AI builds evaluation infrastructure for AI labs. CSOAI's frozen-bank methodology with signed cards and deterministic grading is a complementary approach to Scale's human-evaluation platform. Scale's SEAL leaderboard and CSOAI's GSPC board cover different dimensions — a partnership could offer comprehensive coverage.

**Artifact:** 22-axis GSPC board with 335+ signed cards, Ed25519 signatures, OpenTimestamps/Bitcoin anchoring. The signing methodology provides tamper-evidence that Scale's current evaluations lack.

**Approach:** Propose Scale integrate CSOAI's signed-card output as a verification layer for their evaluation results. The Ed25519 signing provides the tamper-evidence trail Scale's enterprise customers need.

**Contact:** Scale AI via https://scale.com/ (public). Alexandr Wang (public profile).

**Proof point:** `curl -s "https://councilof.ai/root.json"` — 311 cards on a Merkle root with Bitcoin-anchored timestamps.

---

### 8. AI Safety Institute (UK AISI) — Regulatory Measurement

**Why:** UK AISI evaluates frontier models for government. CSOAI's NIST AI RMF crosswalk is already published. CSOAI's 22 axes cover governance, safety, provenance, and continuity — the dimensions AISI needs. CSOAI's signed-card methodology provides the reproducibility and auditability AISI requires.

**Artifact:** NIST AI RMF crosswalk at https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json. 22-axis board with public datasets. Corrections ledger (52 entries). Live at https://councilof.ai/api/gspc.

**Approach:** Share the NIST crosswalk. Propose AISI use CSOAI's frozen banks as a supplementary evaluation tool. The signed-card methodology provides the audit trail AISI needs for government reporting.

**Contact:** AISI via https://www.gov.uk/government/organisations/ai-safety-institute (public). Ian Hogarth (public profile).

**Proof point:** The NIST crosswalk maps CSOAI's 22 axes to the AI RMF's GOVERN/MEASURE/MANAGE functions — AISI can verify the mapping independently.

---

### 9. Weights & Biases — Experiment Tracking & Model Cards

**Why:** W&B is the standard experiment-tracking platform. CSOAI's signed measurement cards are a natural extension of W&B's model-card workflow — every measurement run produces a signed, verifiable artifact. W&B's enterprise customers need the tamper-evidence CSOAI provides.

**Artifact:** Signed measurement cards (Ed25519, SHA-256 chain, OpenTimestamps). Per-model accuracy with Wilson intervals. Frozen banks on HuggingFace. Live at https://councilof.ai/signed/card_index.json.

**Approach:** Propose a W&B integration: CSOAI measurement runs produce signed cards that attach to W&B model cards as verified evidence. The integration adds tamper-evidence to W&B's existing workflow.

**Contact:** W&B via https://wandb.ai/ (public). Lukas Biewald (public profile).

**Proof point:** CSOAI's card format is machine-readable (JSON, Ed25519) — integration is an API call, not a research project.

---

### 10. Cohere — Enterprise AI Safety

**Why:** Cohere serves enterprise customers who need governance evidence. CSOAI's 22-axis board covers the governance dimensions enterprises ask about: safety, provenance, conformance, regulatory framework. Cohere's enterprise customers could use CSOAI's signed cards as independent evidence in their procurement processes.

**Artifact:** 22-axis GSPC board. x402 paid artifacts ($0.01/card). MCP server for agent-discoverable evidence. A2A protocol support. Live at https://councilof.ai/api/gspc.

**Approach:** Propose Cohere offer CSOAI's signed measurement cards as part of their enterprise evidence package. The x402 pricing ($0.01/card) makes it cost-effective for Cohere's volume.

**Contact:** Cohere via https://cohere.com/ (public). Aidan Gomez (public profile).

**Proof point:** `curl -s "https://councilof.ai/.well-known/x402.json"` — machine-readable pricing, no account needed.

---

## Summary Table

| # | Organisation | Artifact | Wedge | Priority |
|---|-------------|----------|-------|----------|
| 1 | Hugging Face | GSPC datasets on HF | Integration with eval harness | HIGH |
| 2 | Anthropic | AffectBench blind-spot finding | Safety research contribution | HIGH |
| 3 | LMSYS | 22-axis methodology | Cross-validation study | MEDIUM |
| 4 | METR | XRAIV/SwarmBench | Agent safety evaluation | HIGH |
| 5 | Eleuther AI | Frozen banks + scoring code | Harness task family | MEDIUM |
| 6 | Mistral AI | Art5Bench/MachBench | EU AI Act evidence | HIGH |
| 7 | Scale AI | Signed cards + Merkle root | Verification layer | MEDIUM |
| 8 | UK AISI | NIST crosswalk | Regulatory measurement | HIGH |
| 9 | Weights & Biases | Signed cards | Model card integration | MEDIUM |
| 10 | Cohere | 22-axis board + x402 | Enterprise evidence | MEDIUM |

## Verification Commands (all live, no auth)

```bash
# GSPC board (22 axes)
curl -s "https://councilof.ai/api/gspc" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d[\"axes\"])} axes')"

# Root (signed cards)
curl -s "https://councilof.ai/root.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{d[\"card_count\"]} cards')"

# x402 catalog
curl -s "https://councilof.ai/.well-known/x402.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'x402 {d.get(\"x402Version\",\"?\")} mode={d.get(\"mode\",\"?\")}')"

# Corrections ledger
curl -s "https://councilof.ai/api/corrections" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d.get(\"corrections\",[]))} entries')"

# HuggingFace datasets
curl -s "https://huggingface.co/api/datasets?author=csoai&limit=20" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d)} datasets')"
```
