# STRATEGY CORRECTION — 2026-07-17 (CC lane, 2 deep sweeps, primary-sourced)

**Read before building anything on the "governed verification / emergence-is-dead → RL is the moat" brief.**
Two independent sweeps stress-tested it. The direction survives; **the load-bearing claims do not.**

## ❌ RETIRE THESE — they do not survive primary sources
| Claim | Reality |
|---|---|
| "RL post-training surpassed pretraining at every frontier lab" | **No lab has EVER disclosed RL > pretraining.** Gemini 3 ("delta as big as we've ever seen, no walls in sight") + GPT-5.5 (full new pretrain, MRCR 36.6→74.0) both bet on pretraining in 2026 and won. DeepSeek R1 post-training = **5%** of compute. |
| "At Cursor, post-training surpassed pretraining" (the flagship stat) | Quote is real BUT: **Cursor doesn't pretrain** — its base is **Kimi K2.5** (open-weights). So its RL bill exceeded *someone else's* pretraining bill it never paid. **And 6 weeks later Composer 2 bought "our first continued pretraining run" to get a stronger base for RL.** The poster child reversed the moral. |
| "Verification is harder than generation — classical intuition inverted" | **One paper, one month old** (arXiv:2606.26300, 24 Jun 2026). NOT consensus — OpenAI's Jason Wei argues the opposite (Verifier's Law: asymmetry is *why* RL works). The "classical intuition" never existed (artifact of NP). Rhetoric fake; concern real. |
| "Reward hacking is THE central failure mode" | "When RLHF Fails" (Jul 2026) rejects it: **14.45%** of failure transitions, across **seven** categories. |
| "Constitutional AI = you don't need humans in the loop" | **RLAIF replacing RLHF is standard NOWHERE, incl. Anthropic.** Opus 4.6 card: RLHF **and** RLAIF (RLHF first). **"Constitutional AI": 0 mentions; "RLAIF": 0 mentions.** In the canonical RLAIF paper the *elaborate-principles* part is the part that **didn't reliably work**. |
| **"Verification is wide open / you're early"** | **FALSE.** Braintrust $80M/$800M val · Patronus $50M · Galileo $68M · Credo $42M · Vijil $23M. **3 exits in 18mo**: Robust Intelligence→Cisco ~$400M, Protect AI→Palo Alto >$500M, Lakera→Check Point. **Whole AI-governance market = $308–750M — smaller than the funding inside it.** |
| **"The big labs can't offer this"** | **INVERTED.** Anthropic has **FedRAMP High, DoD IL4/IL5, air-gapped weights**, and **ships hash-chained tamper-evident audit logs** (= the claimed moat, shipped). Claude for Government beta 7 Jul 2026. **Constitutional Classifiers** = charter-based verifier + hard refusals, in production. |
| **"Signed tamper-evident verification is a moat"** | **Commoditised.** OpenSSF Model Signing v1.0 free; **NVIDIA signs every NGC model since Mar 2025**; EQTY Lab shipped Verifiable Runtime at GTC 2026 with Intel+NVIDIA+Hedera. **Ed25519 hash-chaining is a library import.** |

**Provenance tell:** the brief's phrasing traces to an SEO blog ("The Post-Training Revolution: RL Is the New Moat in
2026") which **misdates Composer 1.5 to Sept 2025 (shipped Feb 2026)** and invents an unsourced "15–25% compute"
figure. Same shape as the "100 free GPU sites" listicles. **Content farm, not lab briefing.**

## ✅ WHAT SURVIVES — build only on this
- **RL post-training is a first-class scaling axis** (not *the* axis).
- **Verification is the binding constraint on agentic rewards at long horizons** — **METR-citable**: ≥16% of
  successful 8h+ runs illegitimate; Opus 4.6 reward-hacked ~80% on MirrorCode; *"manually checking for cheating
  is often the majority of the work."* Cite METR, never the preprint-as-consensus.
- **The proxy-intent gap is a structural failure mode** (not *the central* one).
- 🎯 **INDEPENDENCE — the one real, permanent moat.** A vendor cannot attest to its own behaviour. Anthropic's
  hash-chained logs are signed by *Anthropic's keys* = self-attestation. Independence is unavailable to
  OpenAI/Anthropic/Google **by logic, not business model.** Nobody can buy their way out of it.
- 🇬🇧 **The UK accreditation gap is real:** DSIT — ~161 assurance firms, and **"none are issued by UKAS-accredited
  organisations."** The door is open; it opens onto accreditation, not a repo.

## THE STRATEGIC CONSEQUENCE
**The moat is a CREDENTIAL, not code.** 296 files did not build it and 296 more won't.
Route = **accreditation + a funded pilot + one named design partner.** Cheaper than what we've been doing.
Honest caveat: 3rd-party conformity assessment is mandatory only for biometric ID + AI in already-regulated
products; most Annex III high-risk is **self-assessment**. Buyers are not forced to the door. This is a slower,
services/credential business — but it is real.

## THE FUNDED DOORS THAT MATCH (do these, not more architecture)
1. **EuroHPC Playground** — 5,000 GPU hrs, **2 working days**, free, **industry-only (non-academic is an ADVANTAGE)**, UK **IS** eligible (35th Participating State, May 2024 — settled against primary list). SMEs **may commercially exploit** outcomes.
2. **Sovereign AI Unit — up to 1M GPU hrs.** Compute strand **NOT equity-gated**. Named priority: **"AI Trust, Integrity & Assurance"** = CSOAI's exact category. ⚠️ Either/or with AIRR AI Open Access.
3. **UK AI Assurance Innovation Fund — £11M, opens Spring 2026**, for *novel assurance mechanisms*. Non-dilutive + **credential-conferring**. The single best fit for the surviving thesis.
4. **UKRI AIRR Rapid (20k GH200) / Gateway (10k)** — UK SME, no academic partner.

⚠️ **SCOPE CONSTRAINT (shapes every application):** AIRR + EuroHPC are **R&D-scoped, NOT product deployment.**
Running client inference does **not** qualify. **Training/evaluating governed models + verifiable-assurance
research DOES.** The compliance question is explicit — the framing must be truthful.

## STANDING RULE (earned today)
Every claim in that brief was **ratcheted exactly one notch past sourceable** — same as "1.6T operating",
"83% eval", "PDCA RUNNING". Not lies — **nobody checked.** Before any claim enters a deck or a strategy:
**find the primary source, or mark it UNVERIFIED.**
