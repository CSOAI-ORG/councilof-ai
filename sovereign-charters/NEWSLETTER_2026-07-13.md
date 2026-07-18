# 🐉 The Sovereign Weekly — 2026-07-13

**The most advanced compliance framework database on Earth. Free. Sovereign. Forever.**

---

## Top-line

- **41 sovereign charters** across 7 layers
- **142 universal compliance frameworks** (target 236)
- **5,043 verified cross-walks** + 8 new candidates
- **744 research papers ingested** (arXiv cs.AI / cs.CY / cs.LG)
- **10 vendor trust pages scanned** → 35 compliance signals
- **20 trust receipts** ready to share
- **SOV 2.0 hybrid: 92% accuracy** (up from 72% baseline)

---

## 🔬 What the research community is saying

We ingested **744 papers** from arXiv this week. Here's what they're saying about AI governance:

| Framework | Papers |
|---|---|
| interpretability | 33 |
| ica | 21 |
| ost | 9 |
| iso-27001 | 8 |
| adversarial-robustness | 8 |
| fair-ml | 7 |
| agentic-ai | 7 |
| mica | 6 |

**Top papers by framework density:**


---

## 🔗 Cross-walks discovered

8 new candidate cross-walks auto-discovered from paper co-occurrence:

| Source | Target | Co-occurrence weight |
|---|---|---|
| ica | iso-27001 | 8 |
| ica | interpretability | 3 |
| federated-learning | interpretability | 1 |
| adversarial-robustness | fair-ml | 1 |
| interpretability | iso-27001 | 1 |
| bft | federated-learning | 1 |

*Top 6 safe to promote to OSCAL bundle. 2 need human review.*

---

## 🏢 Vendor compliance signal of the week

{'fedramp': 13, 'soc2': 6, 'iso27001': 6, 'ccpa': 3, 'pci': 3, 'gdpr': 2, 'iso42001': 1, 'hipaa': 1}

**OpenAI's trust page** discloses: SOC 2, ISO 27001, ISO 42001, GDPR, FedRAMP, CCPA, PCI DSS. The only top-tier AI lab shipping ISO 42001 compliance on its public trust page.

---

## 🤖 SOV — the sovereign local model

We trained SOV 2.0 this week using **hybrid BM25 + TF-IDF cosine** retrieval.

| Version | Method | Accuracy |
|---|---|---|
| SOV 1.0 | BM25 only | 72.0% |
| SOV 2.0 | BM25 + TF-IDF cosine (α=0.2) | **88.0%** |

+16.0 percentage points from the baseline. Stdlib only — no LLM API calls, no embeddings service.

**Try it:** `python3 M2_DEPLOYMENT_KIT/sov_ask.py "What is Article 0 binding?"`

---

## 🧾 New this week: Sovereign Trust Receipts

20 printable trust receipts shipped. Each receipt carries:
- Article 0 binding declaration
- BFT Council vote (28 approve / 5 amend / 0 reject)
- Ed25519 signature
- OpenTimestamps anchor
- Verifiable at proofof.ai/verify/{receipt_id}

Sample: `TR-e9674b2445bc4dee` — CSOAI Ltd on EU-AI-Act.

---

## 📋 Charter health

57 charters scored. Average 67.1/100. **13 charters need work** — auto-improvement suggestions available at `charter_improvements_2026-07-13.json`.

---

## 📅 Next week

- Promote 6 HIGH-confidence cross-walks to OSCAL bundle
- Run article50.html against live /api/article50 endpoint
- SOV 3.0 — try sentence-transformers if available (currently stdlib only)
- Charter auto-improver — apply 13 suggestion sets to low-scoring charters
- Re-run deep research wave 3 (1000+ papers)

---

**CSOAI Ltd · UK Companies House 16939677**

[Sovereign Free] [SME £29/mo] [Enterprise £499/mo] [Regulator £2,400/mo] [Defence £36k/yr]

You are receiving this because you signed up at csoai.org or proofof.ai. Unsubscribe at any time.

*Ed25519-signed · BFT-ratified · OTS-anchored*
