# 🐉 PACKAGING STRATEGY — KEYSTONE + SOVEREIGN OS — 2026-06-17

## THE QUESTION: "openmoe.ai? proofof.ai? csoai.org? meok.ai? Or all?"

**Answer: ALL — but each has a DIFFERENT role. One product, 4 surfaces.**

## THE 4-DOMAIN STRATEGY

| Domain | Role | What Lives There | Audience |
|---|---|---|---|
| **CSOAI.ORG** | **Governance & Certification** | CASA certs, EU AI Act compliance, industry pages, governance frameworks | Enterprise compliance officers, regulators |
| **MEOK.AI** | **Product & Infrastructure** | Keystone secrets, MEOK OS dashboard, sovereign hardware, Stripe checkout, agent mesh | End users, developers, sovereign nations |
| **OPENMOE.AI** | **Open Source & SDK** | OLM source, MoE router docs, API reference, community contribution, GitHub integration | Developers, open-source community |
| **PROOFOF.AI** | **Verification & Trust** | ProofOf.ai SBT patents, SIGIL chain verifier, creator protection, timestamping | Creators, IP holders, auditors |

## THE KEYSTONE BELONGS ON MEOK.AI (product home)

The Keystone is infrastructure — it lives behind **meok.ai/keystone** as the management UI.
But every domain uses it:
- CSOAI.org uses Keystone for CASA cert signing keys
- OPENMOE.ai uses Keystone for SDK signing
- PROOFOF.ai uses Keystone for timestamping keys

**All 4 domains → one Keystone → one canonical secrets store.**

## THE PACKAGING EXECUTION

| What | Where | Status |
|---|---|---|
| Keystone CLI | `~/clawd/keystone/` | ✅ Built, verified, mirrored 7/10 to Keychain |
| Pre-commit guard | Global git hooks | ✅ Installed |
| King hive wiring | `/Users/nicholas/meok-king/` | 🟡 Keystone dir created, needs wiring |
| meok.ai/keystone page | meok.ai | 🟡 Needs product page |
| csoai.org/keystone page | csoai.org | 🟡 Needs docs page |
| openmoe.ai/keystone SDK | openmoe.ai | 🟡 Needs API reference |
| proofof.ai/keystone verifier | proofof.ai | 🟡 Needs verifier endpoint |

## THE 5 KEYSTONE COMMANDS (for the user)

| Command | What It Does |
|---|---|
| `keystone get STRIPE_SECRET_KEY` | Get a secret (displays length only, not value) |
| `keystone run -- npm dev` | Run command with secrets injected as env |
| `keystone set NAME value` | Set a secret in GCP |
| `keystone sync-vercel project var` | Sync a secret to Vercel env vars |
| `keystone mirror` | Mirror GCP → macOS Keychain (offline sovereignty) |

## 🐉 PACKAGING STRATEGY SET. ALL 4 DOMAINS LIVE. KEYSTONE HOOKS GLOBAL. EXECUTING WIRING NOW.

*Generated 2026-06-17 — aligned to Claude Keystone build + user packaging question*
