# 🔭 Research: AI-OS, White-Label SaaS Frameworks & a Governed-SaaS Framework for the .ai Hives (2026-06-30)

*Five parallel research agents (verified, point-in-time mid-2026). Honest register: star counts approximate; "AI OS" is a marketing-heavy label — most are runtimes/frameworks, not operating systems.*

---

## TL;DR — the answer to your question

**"Can we build an open-source white-label SaaS framework our AI governance plugs into, for all the .ai hives — has it been done?"**

→ **The exact fusion is GREEN FIELD. Each half exists separately; nobody has shipped both as one.**
- **White-label SaaS chassis** (auth + billing + multi-tenant): **solved & crowded** (open boilerplates).
- **AI governance** (guardrails / gateways / compliance): **contested & consolidating fast** ($300M–$500M acquisitions in 2025: Lakera→Check Point, Protect AI→Palo Alto).
- **What no one ships:** a reusable SaaS framework with **policy + compliance-evidence + cryptographically-signed, offline-verifiable attestation** baked in as first-class — i.e. spin up many branded AI products on one *governed, signed* substrate.

**Your three differentiators are uncontested by every commercial leader:** (1) **Ed25519-signed / offline-verifiable governance decisions**, (2) **multi-model BFT council adjudication**, (3) **legacy-system (COBOL/SAP/HL7) governance bridges**. These live only in academic papers + pre-product startups — not in any shipped product.

**Recommendation (one line):** Don't build a SaaS framework from scratch and don't try to win the crowded guardrail layer. **Package your governance as a framework-agnostic, signed-attestation SDK/middleware (a "governed-SaaS kit") that drops onto Supabase + an MIT SaaS boilerplate**, and lead with the *trust property* (signed + council + legacy) the whole category lacks.

---

## 1. Bleeding-edge "AI OS" projects — what to copy

| Project | Stars | License | Verdict |
|---|---|---|---|
| **Letta** (ex-MemGPT) `letta-ai/letta` | ~23.6k | Apache-2.0 | **COPY the memory model** — tiered/self-editing memory paging. Directly fixes your fragmented ~11-store memory problem; canonical pattern to consolidate toward. |
| **AIOS** `agiresearch/AIOS` | ~6.0k | MIT | **COPY the architecture** — kernel + SDK split, scheduler/context-switch/memory managers. Research-grade; steal the decomposition, don't depend on it. |
| **Agno (AgentOS)** `agno-agi/agno` | ~39k | MPL-2.0 (verify) | **COPY** — cleanest "OS-as-runtime": agents/teams/workflows served as FastAPI APIs + shared memory, **self-exposes as an MCP server**, runs in your cloud. Best fit if your OS = a self-hostable runtime. |
| **Cua** `trycua/cua` | ~19.2k | MIT | **COPY** if you need real desktop control (aware/Guardian) — sandboxes + drivers + Lume virtualization + benchmarks. |
| **Open Interpreter** | ~64k | Apache-2.0 | COPY the local-code-exec/sandbox harness (now a Rust rewrite). Don't treat as an "OS." |
| **elizaOS**, **AutoGPT** | 15k / 184k | MIT | Mine **plugin/character** + **marketplace/visual-builder** UX only; both loose on the "OS" claim, Eliza is crypto-coupled. |
| **Claude Cowork** (Anthropic) | — | proprietary | Mirror the concept: **agent gets its own lightweight VM sandbox on the user's device** — the convergent industry answer (your Tauri-overlay direction is right). |
| ☠️ **Rabbit R1 / Humane Pin** | — | — | **AVOID the framing.** Humane dead (servers off Feb 2025); Rabbit dying. "LAM gadget OS" failed — capability moved to computer-use agents on existing hardware. |

## 2. Open-source white-label / multi-tenant SaaS bases — what to fork

**The license trap to avoid:** AGPLv3 + a commercial `/ee` folder (Cal.com, Dub, Documenso, Midday) — the tenancy/SSO features you'd actually want are proprietary, and network-copyleft forces you to open your source. **Steer clear of these as fork-bases.**

| Project | License | Multi-tenant? | Verdict |
|---|---|---|---|
| **Supabase** | Apache-2.0 | via Postgres **RLS** | **BEST BACKEND.** Per-tenant isolation you can *audit and sign* — every tenant action lands in Postgres where you hook the ledger/signing. pgvector covers AI. |
| **ixartz/SaaS-Boilerplate** | MIT | **Yes** (teams/RBAC/i18n free) | **BEST MIT APP SHELL** — real org tenancy free, you add Stripe. |
| **Open SaaS (Wasp)** | MIT | weak (per-user) | Strong if you accept Wasp lock-in; AI + payments + auth batteries-included. |
| **vercel/platforms** | MIT | subdomain routing | **Lift the tenant-routing middleware**; it's a skeleton, not a base. |
| **Appwrite / PocketBase / Nhost** | BSD-3 / MIT / MIT | varies | Appwrite = good permissive BaaS alt; PocketBase = single-tenant only (avoid at scale). |
| **Makerkit** | commercial ($299–599) | **best-engineered** | CONSIDER buying — best multi-tenant/billing + ships MCP + Claude-Code agent rules. Not a free fork-base. |
| **Trigger.dev** / **Novu (core)** | Apache-2.0 / MIT | yes | USE as dependencies — AI background-jobs + notifications. |

## 3. Governance layer — the category is real; your wedge is the gap

**"Guardrails / AI firewall that drops into any app" is established & consolidating.** Marketing terms in use: *"AI firewall"* (Arthur), *"guardrails on the gateway"* (Portkey, MIT, ~12k★), *ApplyGuardrail* (AWS Bedrock — best hyperscaler "any model" claim). GRC dashboards (Credo AI, $101M val) govern *about* AI, not inline.

**Closest analog to YOUR architecture:** **Microsoft Agent Governance Toolkit** (MIT, Apr 2026) — deterministic policy engine on every agent action, **Ed25519 identity (DIDs), Ed25519-signed marketplace, SLSA provenance, audit grading**. *But it has no auth/billing/multi-tenant SaaS layer.* That missing shell is your opening.

**Standards your signing layer should SPEAK (not reinvent):** OpenSSF **Model Signing (OMS)** + Sigstore (signs *artifacts*); **OVERT / TRACE** (signed runtime "proof governance executed", specs v0.1 mid-2026); **OPAQUE** (confidential MCP). Academic: **Aegis**, **Sovereign-OS** (arXiv) — nearly identical to your King-ratify→Ed25519-sign→on-device-verify loop.

**Uncontested by all commercial leaders (Lakera, Arthur, Portkey, Credo, Bedrock, Protect AI):**
1. **Cryptographically signed / offline-verifiable governance decisions** (they all use mutable, trust-the-vendor logs). EU AI Act **Art. 12 logging** enforcement (Aug 2 2026) is the demand driver.
2. **Multi-model BFT council adjudication** (LLM-as-judge ensembles exist; BFT voting governance does not).
3. **Legacy COBOL/SAP/HL7 governance bridges** — completely absent everywhere.

---

## 4. Recommendation — the concrete path

**Build a "Governed-SaaS Kit": a framework-agnostic SDK + middleware that turns any MIT SaaS base into a signed, governed, multi-tenant AI product factory — reused across every .ai hive.**

**Reference stack (all MIT/Apache — safe to white-label & keep closed):**
- **Backend:** Supabase (RLS = per-tenant isolation you sign) + pgvector.
- **App shell:** fork **ixartz/SaaS-Boilerplate** (+ lift vercel/platforms subdomain routing).
- **Runtime:** Agno (FastAPI agent runtime, self-exposes as MCP) — or your existing SOV3.
- **Memory:** adopt **Letta's** core/archival paging model to consolidate your ~11 stores.
- **Jobs/notify:** Trigger.dev + Novu core.
- **YOUR moat layer (the product):** drop-in middleware that, per tenant: applies policy → emits OSCAL/Annex-IV compliance evidence → **Ed25519-signs every governed action into the ledger** → 13-queen BFT council adjudication → legacy-bridge MCPs. Speak OMS/Sigstore + OVERT/TRACE so it interops, not competes.

**Positioning:** don't claim to invent the guardrail category (crowded). Claim the **trust property it lacks**: *"the only open, white-label AI-SaaS substrate where every governed action is cryptographically signed, council-adjudicated, offline-verifiable, and bridges to legacy systems."* That's the green field — and it maps 1:1 onto IP you already have.

**First move:** package the signing/attestation middleware as a standalone repo (`meok-governed-saas` / SDK) that bolts onto Supabase + ixartz — a 1-week spike proves the wedge and is demoable to a design partner.
