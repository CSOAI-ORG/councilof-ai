# REVISED PHASES — 2026-07-17 (after the day that killed five theses)

**Everything below survived primary sourcing. Nothing here is aspirational.**

## What we stopped building (and why it stays stopped)
| Retired | Killed by |
|---|---|
| **Emergence** | 5 independent nulls (weight-merge ×2 lenses, naive MoA 1/3, diverse-MoA + 120B aggregator 4/15) |
| **"RL is the new moat / pretraining is dead"** | No lab ever disclosed RL>pretraining. Gemini 3 + GPT-5.5 both won on pretraining. Cursor doesn't pretrain and **bought** it 6 weeks later. Source traced to an SEO blog. |
| **"Verification is wide open, you're early"** | Braintrust $80M/$800M · 3 exits · **market ($308–750M) is smaller than the funding inside it** · Anthropic already ships hash-chained tamper-evident logs + Constitutional Classifiers |
| **"Signed attestation is a moat"** | Ed25519 hash-chaining is **a library import**. OpenSSF Model Signing free; NVIDIA signs every NGC model. |
| **"Compliant datasets = Series A"** | Protege took **a16z's $30M for this exact thesis** (Jan 2026). Human Native (UK, same plan) **acquired by Cloudflare** (Jan 2026). Fairly Trained **dormant since Aug 2024**. Common Pile = **8TB free and better**. **ISO 17021: you cannot certify what you produce.** |
| **Leaderboards / Kaggle** | Wrong domain, wrong odds, and a win **doesn't compound into the moat** |

## What survived — build only on this
1. **INDEPENDENCE** — a vendor cannot attest to its own behaviour. Unavailable to Anthropic/OpenAI/Google **by logic**, not business model. Permanent.
2. **The UK accreditation gap** — DSIT: ~161 assurance firms, **none UKAS-accredited**.
3. **"We sign evidence. We do not certify intent."** — already in the passport MCP. **This is the licence to operate.** It's why we can attest without ISO 17021 accreditation, and it's what killed Fairly Trained. **Never edit this line out.**
4. **The moat is a CREDENTIAL, not code.**

---

# THE PHASES

## PHASE 1 — THE ARTICLE 53 DOOR ⏰ *deadline 2 Aug 2026 (16 days)*
**The only thing with a statutory trigger. This is the business.**
- **Why it works:** providers **must** publish a training-data summary (Art 53, fines €15M/3%), they **don't know** what's in their pile, and **66% of HF licence metadata is miscategorised** (MIT Data Provenance Initiative, Nature MI).
- **Why us:** the rails exist — `meok-sovereign-aiact-passport-mcp` (Art 6 + Annex IV signed passport, 5 MCP tools, **built for this exact deadline**) + the OSCAL generator + Ed25519 signing.
- **The gap:** Art 53 has **zero tooling** — prose only in playbooks.
- [ ] **1.1** Build the Art 53 issuer on passport rails: data pile → Commission-template narrative summary + **licence-error report** → signed, offline-verifiable
- [ ] **1.2** Keep the honesty register verbatim ("sign evidence, not intent")
- [ ] **1.3** Ship before 2 Aug — the deadline IS the go-to-market
- **Honest size: low-hundreds of UK/EU buyers @ £5–25k. A living, not a Series A. Say so.**

## PHASE 2 — THE CREDENTIAL LADDER (owner-gated, ~10 min each)
Not a leaderboard — **arenas where almost nobody competes and winning compounds.**
- [ ] **2.1 UKRI AIRR Rapid** — 20,000 GH200 hrs. **Only gate = Companies House no. (16939677). Draft written.** 🔴 **NICK**
- [ ] **2.2 EuroHPC Playground** — 5,000 hrs, **2 working days**, industry-only (non-academic is an ADVANTAGE). Email drafted. 🔴 **NICK**
- [ ] **2.3 Sovereign AI Unit** — 1M hrs; **"AI Trust, Integrity & Assurance" is a NAMED priority**. Either/or with AIRR open call. 🔴 **NICK**
- [ ] **2.4 £11M AI Assurance Innovation Fund** (Spring 2026) — **the only thing on the 93-entry registry that pays CASH**, and it funds exactly the surviving moat.
- [ ] **2.5** Self-serve credits: AWS Activate $5k + MS Founders $5k + Google $2k + NVIDIA Inception. ~$12k, bootstrapped-eligible.

## PHASE 3 — EVIDENCE (this is the product, not the demo)
An independent's asset is **proof**, and proof is what the fund/accreditation run on.
- [ ] **3.1 Verify SOVBENCH's 15 citations** against primary sources → then it's publishable. **Currently 🔴 unpublishable — unverified citations would destroy the credential it exists to build.**
- [ ] **3.2 Run the rainbow team** (`sovbench/sov4_rainbow_team.py`) — 6 risk categories × 8 attack styles. **Finding holes IS the point.**
- [ ] **3.3 Fix what it finds**, re-run, publish the map. **A map of where your own gate fails is the artefact a vendor cannot produce about itself.**

## PHASE 4 — THE DEMO (done today, hold it there)
- [x] **MEOK OS live + governed** — pre-model hard-stop deployed to os.meok.ai, **verified by live curl** (sarin→`governance-veto`; "follow this person on instagram"→passes clean)
- [x] Compute solved: **free 550B (nemotron-3-ultra) + free 120B (gpt-oss)**, both verified answering
- [ ] **4.1 STOP EXPANDING MEOK.** 55 `meok-*` dirs is the symptom, not the achievement. **One business, one demo, one doctrine.**

## HONEST LIMITS TO CARRY FORWARD
- MEOK's gate is **literal-substring and brittle** — *"building a bomb"* (gerund) passes it; CARE_FLOOR is the backup. Claim **"refuses the worst before any model sees them"**, never "jailbreak-proof."
- SOVBENCH's 27% score is **not official** — citations unverified, scorer is strict.
- Capabilities = **98 unique**, not 108/109.
- Trinity = 0.5B/1.5B/3B, ours, trained — **modest capability**, not frontier.

## THE STANDING RULE (earned five times today)
Every dead claim was **ratcheted exactly one notch past sourceable** — including four of CC's own ("MEOK isn't governed", "jackpot free 550B" → 401 dead key).
**Nobody lied. Nobody checked.**
> **Primary source, or mark UNVERIFIED. A clean 0/N sweep is a bug, never a result.**
