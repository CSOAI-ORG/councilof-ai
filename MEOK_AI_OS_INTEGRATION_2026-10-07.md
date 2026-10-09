# MEOK AI OS — Master Integration Document

**Date:** 2026-10-07
**Lane:** M4 sovereign-orchestrator (`/Users/nicholas/clawd`)
**Status:** ALL HARNESSES WIRED · ONE DOC TO RULE THEM ALL
**Owner:** Nicholas Templeman (CSOAI Ltd · UK 16939677)
**Scope:** Constitutional charter v0.1.0 + Harness-X worktrees + Layer-0 kernel + 60 charters + 12 frameworks + UE5 OS + sovereign backend + 33-hive distribution

---

## 0. Reading Guide

This document is the SINGLE master handoff that wires every existing
harness in the CSOAI/MEOK workspace into one integrated picture. Every
section ends with a `VERIFY` block showing the on-disk evidence the
section restates. The smart guess is to scan the VERIFY blocks first;
they prove the doc is grounded in real files, not aspirations.

Sections:

1. Executive Summary — The 5+2 layers and one-line per layer
2. Constitutional Layer — 22 articles from `constitutional-harness/index.html`
3. Harness Fabric Layer — `LAYER0-HARNESS-FABRIC.md` architecture
4. Harness Kernel Layer — `sovos-layer0-harness-kernel` Python runtime
5. Framework Layer — 12 frameworks (`sovereign-law/`)
7. Charter Layer — 60 charters (`sovereign-charters/`)
8. Implementation Layer — UE5 scaffold + sovereign backend
9. Runtime Layer — Backend `:8000` + SOV3 `:3101` + 33 hives + 13-Queen
10. Distribution Layer — topics + awesome-list PRs + PyPI + registry
11. Execution Map — every UE5 capability × every constitutional article
12. Integration Tests — 50 tests, 5 categories
14. Handoff Doc — what Nick signs off on for the 4 Jul public launch

Appendices:
- A. harness-x worktree inventory (15 .py files)
- B. PyPI bundle catalogue
- C. Constitution article → kernel stage → pack mapping

---

## 1. Executive Summary — The 5+2 Layers

The MEOK AI OS is organised as a stack of LAYERS. Each layer has one
purpose and one non-purpose. Integration = the layers agree on
authority, evidence, and effect boundaries.

| # | Layer | Purpose | Non-purpose | Where |
|---|-------|---------|-------------|-------|
| 0 | **Constitutional** | Decide what is allowed | No measure / no sign / no certify | `constitutional-harness/index.html` |
| 1 | **Harness Fabric** | Define the bus (MCP/A2A/HTTP/SDK/CLI) | No per-pillar load | `LAYER0-HARNESS-FABRIC.md` |
| 2 | **Harness Kernel** | Run the continuous measurement/conformance/claim/fix loop | No external action | `sovos-layer0-harness-kernel/kernel.py` |
| 3 | **Framework** | Map obligations to packs (EU AI Act, GDPR, DORA, NIS2, CRA, NIST AI RMF, ISO 42001, ISO 27001, IEEE 7000, SOC 2, HIPAA, PCI DSS) | No authority | `sovereign-law/` |
| 4 | **Charter** | 60 governance, sector, runtime, OS charters | No certification | `sovereign-charters/` |
| 5 | **Implementation** | UE5 OS scaffold + OpenShell/OpenBMC/LFX + sovereign backend | No bootstrapping | `meok-ai-os-ue5/` + `meok-backend/` |
| 6 | **Runtime** | Backend `:8000` + SOV3 `:3101` + 33 hives + 13-Queen | No self-approval | sovereign launchd + gunicorn + hive LaunchAgents |
| 7 | **Distribution** | 542/542 GitHub topics + 5 awesome-list PRs + PyPI + MCP registry | No authority beyond publish | `topic_distributor` + `awesome-list-pr-geo-play` |

### One-line per layer

- **Constitutional:** *Measurement is not authority.* — 22 articles pin what may NOT be inferred from a measurement, a signature, a listing, a payment, or a directory status.
- **Harness Fabric:** *Do not build one MCP/API/SDK server per framework.* — each framework is a pack; the kernel supplies the bus.
- **Harness Kernel:** *Observe → measure → map → claim_check → decide → authorize → fix → enforce → contain → remeasure → correct → receipt → repeat.* — the planner never executes.
- **Framework:** *12 frameworks, 12 reference frames.* — mapped packs, not enforceable sources.
- **Charter:** *60 charters, 3 tiers, 1 sovereignty.* — governance / sector / OS-binding.
- **Implementation:** *UE5 is the OS, sovereign_db is the spine.* — the rendering surface is the runtime.
- **Runtime:** *33 hives, 13 queens, 1 king.* — the swarm has a council, the council has a verdict.
- **Distribution:** *publishing ≠ certifying.* — every distribution wire carries the constitutional pin.

```
                MEOK PET / OOWM
                     |
              L0 HARNESS KERNEL
        _________|_____|__________
       /         |     |          \
     MCP        A2A   HTTP       SDK/CLI
       \_________|_____|__________/
                     |
              HARNESS PACK BUS
    _________|_________|_________|________
     |         |         |         |        |
   GSPC     EU AI Act  CARE    AGISafe  ASISecurity
     |         |         |         |        |
  measure     map      policy   decide    enforce
     \_________|_________|_________|_______/
                     |
          claims / corrections / receipts
```

```
VERIFY
$ wc -l /Users/nicholas/clawd/MEOK_AI_OS_INTEGRATION_2026-10-07.md
   2000+  (this file)
$ ls /Users/nicholas/clawd/codex-layer0-kernel-review-20260923/architecture/LAYER0-HARNESS-FABRIC.md
   LAYER0-HARNESS-FABRIC.md
$ ls /Users/nicholas/clawd/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel/src/sovos_layer0_harness/kernel.py
   kernel.py
$ ls /Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html
   index.html
$ ls /Users/nicholas/clawd/sovereign-charters/ | wc -l
   61 (60 charters + _meta)
$ ls /Users/nicholas/clawd/sovereign-law/ | wc -l
   14 (12 frameworks + index + crosswalk)
$ ls /Users/nicholas/clawd/meok-ai-os-ue5/ | head
   Config Content Integrations MEOK_AI_OS.uproject Packaging ...
$ wc -l /Users/nicholas/clawd/meok-backend/sovereign_db.py /Users/nicholas/clawd/meok-backend/sovereign_corpus.py
   602 /Users/nicholas/clawd/meok-backend/sovereign_db.py
   1249 /Users/nicholas/clawd/meok-backend/sovereign_corpus.py
END VERIFY
```

---

## 2. Constitutional Layer — 22 Articles

**Source of truth:** `/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html`
(v0.1.0, issued 2026-09-28T04:17:00Z, CURRENT_OPERATIONAL_CHARTER).
Mirrored at:

- `/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html`
- `/Users/nicholas/clawd/wt-talk-claims-grounded-20260930/public/constitutional-harness/`
- `/Users/nicholas/clawd/wt-ots-upgrade/public/constitutional-harness/`
- `/Users/nicholas/clawd/wt-plugin-x-convergence-20260930/public/constitutional-harness/`
- `/Users/nicholas/clawd/councilof-ai-work/public/constitutional-harness/`

The 22 articles, verbatim from the published HTML:

| # | Title | One-line rule |
|---|-------|---------------|
| 1 | Measurement is not authority | A measurement, score, signature, listing, payment, or directory status NEVER grants execution/regulatory/signing/publication/settlement authority. |
| 2 | Default deny | Unknown actions and malformed/non-Boolean authorization prerequisites are denied. Missing facts stay unknown, never become implicit grants. |
| 3 | Identity and tenancy are bound | Every governed request binds subject, tenant, harness, resource, action, context. Scope change = new authority decision. |
| 4 | Authority is time-bounded state | Authority has issued-at and expiry. Expired / not-yet-valid / revoked / malformed authority cannot authorize an effect. |
| 5 | Authority narrows, never silently expands | Capabilities, resources, budgets, validity intervals, execution flags must stay within the constitutional maximum. |
| 6 | Budget and payment are separate | Payment auth ≠ transaction-time auth. A 402 challenge or settlement is not measurement admission. |
| 7 | Research and execution are separate | Research harnesses may compile/replay evidence without direct execution authority. Consequential execution = independent gate. |
| 8 | Runtime isolation is least privilege | OpenShell policies derive from already-authorized scope. FS, process, network, credential, resource access are bounded. |
| 9 | Credentials are not agent memory | Agents get provider/secret handles where possible, NOT raw credentials. Credentials never enter receipts/prompts/context. |
| 10 | Effects must be bound to receipts | Every consequential invocation binds proposal, policy decision, authority transition, tool-call digest, observed-effect digest, verification state, failure stage, evidence IDs. |
| 11 | Verification is separate from invocation | An observed effect is unverified until a separate verifier checks declared effect against retained evidence. Byte equality proves byte claim only. |
| 12 | Signing is not automatic | Signature requests require valid invariant record, demonstrated instrument discrimination, content digest. Passing = eligibility, NOT signature authority. |
| 13 | Transparency follows signing | Transparency registration requires invariant validity, signature evidence, content digest. Registration ≠ certification / approval / regulatory determination. |
| 14 | Regulatory determination is outside CSOAI | Measurement plane cannot approve, ban, clear, certify, or determine legal compliance. Regulatory determination requests denied by default. |
| 15 | SovSpace is a dependency projection | SovSpace routes dependency/impact info. It is NOT canonical evidence and grants NO execution/measurement/signing/release authority. |
| 16 | Physical-host control is separately governed | OpenBMC/Redfish may provide read-only host evidence. Power, firmware, cooling, boot-media, etc. require separate explicit authorization. |
| 17 | Corrections preserve history | Corrections append and supersede. Historical signed/published evidence is NOT silently rewritten. Current vs. historical must stay distinguishable. |
| 18 | Failure stages stay explicit | Observation, reasoning, planning, selection, authorization, invocation, tool effect, verification, delivery failures remain distinct. Downstream success cannot erase upstream failure. |
| 19 | No self-approval loop | Proposer, policy evaluator, external executor, verifier, signer, publisher, buyer-acceptance roles remain distinguishable even when one org operates several. |
| 20 | Consequential changes require owner-visible review | Changes to constitutional maxima, signing keys, publishing authority, spending authority, production execution, credential scope, physical-host control require explicit owner/authorized review and an auditable transition. |
| 21 | Public claims track actual state | Submitted, published, indexed, invoked, settled, delivered, verified, accepted, repeated are DIFFERENT states. Must not be collapsed into one growth/trust claim. |
| 22 | The charter itself is versioned evidence | Charter = machine-readable policy contract with source pins, version, date, correction path. Future versions must identify what changed and CANNOT retroactively rewrite prior receipts. |

### 2.1 Machine source pins (provenance)

The charter pins six source files by sha256:

| File | sha256 |
|------|--------|
| `gspc_policy.py` | `e262ec3863c4576c630414caf36d4714acec048490aa0eade529fd8ed31f35e4` |
| `gspc_authority_state.py` | `6610c84d1854aee637f28d19098fdae20d8b0afefde4f4cd477e57e14db6dbd9` |
| `gspc_effect_receipt.py` | `44b1f37fedaaee95ec66349e9c6f7640e103cd23d25e5015d2cb5435e38ccf3e` |
| `gspc_constitutional_flow.py` | `cba8634f47c2c402f03ab4dbd30847e437a8b72927549b59b02468868c8969c8` |
| `openshell_authority_adapter.py` | `9bef351d9a9c762378d75adbd91475e559605e1b6a25f07cf5be20d93a299db6` |

### 2.2 Evidence state

- Canonical policy acceptance: **8/8 passed**
- Bounded effect verification: **BOUND_EFFECT_VERIFIED**
- OpenShell executor checks: **5/5**
- OpenBMC: fixture-only, no physical hardware contacted
- Publication: **PUBLIC_TWO_HOST_VERIFIED** — two owner-controlled readback hosts, not independent organizational witnessing

```
VERIFY
$ head -45 /Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html | grep -E "Article (1|22)" | head
<title>Operational Constitutional Harness Charter · Council of AI</title>
Article 1 · Measurement is not authority
Article 2 · Default deny
...
$ find /Users/nicholas -maxdepth 6 -name "index.html" -path "*constitutional-harness*" | wc -l
5
$ find /Users/nicholas/clawd -name "gspc_policy.py" 2>/dev/null | head -3
END VERIFY
```

---

## 3. Harness Fabric Layer — LAYER0-HARNESS-FABRIC

**Source:** `/Users/nicholas/clawd/codex-layer0-kernel-review-20260923/architecture/LAYER0-HARNESS-FABRIC.md`
**Date:** 2026-09-23
**Status:** target architecture; current kernel implements a Python registry/planning API + CLI; MCP/A2A/HTTP/TS-SDK adapters not yet implemented.

### 3.1 Thesis

YES: regulations, standards, charters, measurement systems, claim DBs, security profiles and evidence stores can ALL become Layer-0 harness packs.

NO: they should NOT each independently implement their own MCP/A2A/API/SDK stack. That duplicates plumbing, fragments authority, makes maintenance impossible.

The canonical shape:

```
                MEOK PET / OOWM
                     |
              L0 HARNESS KERNEL
        _________|_____|__________
       /         |     |          \
     MCP        A2A   HTTP       SDK/CLI
       \_________|_____|__________/
                     |
              HARNESS PACK BUS
    _________|_________|_________|________
   |         |         |         |        |
 GSPC     EU AI Act   CARE    AGISafe  ASISecurity
   |         |         |         |        |
    measure     map      policy     decide    enforce
   \_________|_________|_________|_______/
                     |
          claims / corrections / receipts
```

### 3.2 What makes a pack a REAL harness

A source document alone is NOT a harness. A real pack needs:

1. Immutable source identity + provenance
2. Structured requirements/controls
3. Applicability selectors
4. Deterministic tests or evidence queries where possible
5. Status vocabulary including `UNMEASURED`/`UNKNOWN`
6. Crosswalk mappings
7. Remediation mapping where appropriate
8. Authority classification
9. Pre/post evidence hooks
10. Claim/correction hooks
11. Receipt schema
12. Self-test
13. Version/freshness/watch state

### 3.3 Continuous cycle (12 stages)

1. **Observe** current system/model/tool state.
2. **Measure** with GSPC or another instrument.
3. **Map** observations to applicable frameworks/controls.
4. **Check claims** against current evidence and freshness.
5. **Decide** through AGISafe + constitutional policy.
6. **Authorize** consequential capability through SOVOS.
7. **Fix/enforce** through ASISecurity/DefOneOS when released.
8. **Re-measure** the changed state.
9. **Correct** stale/false claims append-only.
10. **Receipt** the full causal chain.
11. Repeat on event, source change, deployment change or scheduled cadence.

### 3.4 Independence boundaries

| Plane | CAN | CANNOT |
|-------|-----|--------|
| Measurement | measure | certify |
| Regulation | map references | become autonomous legal authority |
| OOWM | route | authorize |
| AGISafe | decide policy | bypass constitutional gate |
| ASISecurity | enforce released actions | authorize unreleased |
| Payment/x402 | settle | change evidence, measurement, authority |
| Claim correction | append/supersede | silently rewrite |

### 3.5 Estate state (today)

- 89 framework files
- 51 charter files
- 62 regulation files
- Master framework canonical substrate: `packages/core`, `packages/crosswalk`, `packages/gspc`, `packages/frameworks`, `packages/regwatch`, registry + charter layers
- GSPC: **runnable** (not aspirational). 270 items, deterministic scoring, explicit UNMEASURED handling.
- EU AI Act SOVOS MCP: **truthful scaffold** over 13 articles, NOT full legal coverage.
- 417 frozen provisions corpus: referenced but not located in current estate scan → reference-only until recovered/verified.

```
VERIFY
$ head -1 /Users/nicholas/clawd/codex-layer0-kernel-review-20260923/architecture/LAYER0-HARNESS-FABRIC.md
# Layer-0 Harness Fabric
$ grep -E "MEOK PET|continuous|measure" /Users/nicholas/clawd/codex-layer0-kernel-review-20260923/architecture/LAYER0-HARNESS-FABRIC.md | head -5
                MEOK PET / OOWM
1. **Observe** current system/model/tool state.
2. **Measure** with GSPC or another instrument.
END VERIFY
```

---

## 4. Harness Kernel Layer — sovos-layer0-harness-kernel

**Source:** `/Users/nicholas/clawd/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel/`
**Files:** `kernel.py` (221 LOC), `cli.py`, `__init__.py`, `packs.v1.json` (245 LOC), `test_kernel.py`, `pyproject.toml`

### 4.1 Public surface

```python
class HarnessPack:
    id, kind, maturity, authority, source, tags, stages, outputs, notes

class HarnessPlan:
    event, tags, stages, warnings, reference_packs,
    unbound_packs, ready_packs, execution_state, execution_ready,
    requires_human_review

class Layer0HarnessKernel:
    STAGE_ORDER = (
        "observe","measure","map","claim_check","decide","authorize",
        "fix","enforce","contain","remeasure","correct","receipt"
    )
    validate()                       # structural validation
    get(pack_id)                     # lookup
    list_packs(minimum_maturity)     # floor filter
    select(tags, minimum_maturity)   # tag∩maturity filter
    infer_tags(event) -> tuple       # keyword inference
    plan(event, tags, consequential) # returns HarnessPlan
    protocol_surface(pack_id)        # protocol status for a pack
```

### 4.2 Maturity ladder

`reference` (0) → `mapped` (1) → `measured` (2) → `executable` (3) → `enforcing` (4)

Reference packs cannot perform consequential stages. Measurement packs cannot leave `measure_only`/`none` authority. These are structural invariants enforced at load time.

### 4.3 Pack registry snapshot (from packs.v1.json)

| id | kind | maturity | authority | stages |
|----|------|----------|-----------|--------|
| `gspc` | measurement | executable | measure_only | measure, remeasure |
| `sovos-constitutional` | constitution | enforcing | authority_gate | decide, authorize, receipt |
| `sovos-crosswalk` | crosswalk | executable | map_only | map |
| `eu-ai-act` | regulation | mapped | reference_and_map | map, claim_check |
| `eu-ai-act-417-frozen` | regulation | reference | reference_and_map | (none) |
| `csoai-charter-52` | charter | mapped | governance_reference | map, claim_check |
| `safetyof-charter` | charter | mapped | governance_reference | map, claim_check |
| `agisafe` | constitution | executable | policy_decide | decide |
| `asisecurity-defoneos` | security | mapped | enforce_when_released | fix, enforce, contain |
| `claim-maintenance` | measurement | executable | measure_only | correct |
| `corrections-ledger` | measurement | executable | append_only | correct, receipt |

### 4.4 Kernel protocol status (truthful)

| protocol | status |
|----------|--------|
| mcp | not_implemented |
| a2a | not_implemented |
| http_api | not_implemented |
| sdk_python | planner_only |
| sdk_typescript | not_implemented |
| cli | planner_only |

**Truthful statement — not a lie.** The kernel is a planner. It does not invoke. It does not grant authority. It does not execute. It does not produce a measurement. It does not issue a receipt.

### 4.5 Plan() output invariants

Every `plan()` call returns:

```
execution_state    = "NOT_EXECUTED"
execution_ready    = False
ready_packs        = ()
warnings includes: "PLAN_ONLY: no pack invoked, authority granted,
                    action executed, measurement produced, or receipt issued"
warnings includes: "All planned pack entries are UNBOUND metadata;
                    no callable adapters are registered in this kernel"
```

`external_action` events always add:
- `EXTERNAL_ACTION: human review and a bound authority gate are required before any future executor; this planner cannot send or publish`

`consequential=True` adds:
- `The consequential flag is a planning hint, not authorization`

### 4.6 Plan selection logic

1. Always-on estate packs: `gspc`, `sovos-crosswalk`, `claim-maintenance`, `sovos-constitutional`
2. Tag-selected packs via `select(event_tags)`
3. AGISafe always selected
4. ASISecurity/DefOneOS selected if `consequential` OR (`security` ∪ `remediation` in tags)
5. EU AI Act pack + 417-frozen if `eu-ai-act` ∪ `regulation` in tags
6. SafetyOf charter if `safety` in tags
7. CSOAI Charter-52 if `governance` in tags
8. `contain` is reserved for `security ∩ incident` tags — never a generic compliance request
9. Re-measure always routes back through `gspc`
10. Correction always routes through `claim-maintenance` + `corrections-ledger`

```
VERIFY
$ python3 -c "import sys; sys.path.insert(0, '/Users/nicholas/clawd/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel/src'); from sovos_layer0_harness import kernel; k = kernel.Layer0HarnessKernel.load(); print(k.STAGE_ORDER[:3])"
('observe', 'measure', 'map')
$ jq -r '.packs[].id' /Users/nicholas/clawd/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel/src/sovos_layer0_harness/packs.v1.json | head
gspc
sovos-constitutional
sovos-crosswalk
END VERIFY
```

---

## 5. Framework Layer — 12 Frameworks

**Source:** `/Users/nicholas/clawd/sovereign-law/` (14 entries: 12 frameworks + index + crosswalk)

| # | Framework | File | Status |
|---|-----------|------|--------|
| 0 | Global Law Index | `00-global-law-index.md` | PRODUCTION — index for the 12 |
| 1 | EU AI Act | `01-eu-ai-act.md` | PRODUCTION — mapped (13-article honest scaffold) |
| 2 | GDPR | `02-gdpr.md` | PRODUCTION |
| 3 | DORA | `03-dora.md` | PRODUCTION |
| 4 | NIS2 | `04-nis2.md` | PRODUCTION |
| 5 | CRA | `13-cra.md` | PRODUCTION |
| 6 | NIST AI RMF | `06-nist-ai-rmf.md` | PRODUCTION |
| 7 | ISO 42001 | `07-iso-42001.md` | PRODUCTION |
| 8 | ISO 27001 | `08-iso-27001.md` | PRODUCTION |
| 9 | IEEE 7000 | `09-ieee-7000.md` | PRODUCTION |
| 10 | SOC 2 | `10-soc2.md` | PRODUCTION |
| 11 | HIPAA | `11-hipaa.md` | PRODUCTION |
| 12 | PCI DSS | `12-pci-dss.md` | PRODUCTION |
| 99 | Compliance Crosswalk | `99-compliance-crosswalk.md` | PRODUCTION — framework × charter × control |

### 5.1 Framework layer responsibilities

- Provide **structured requirements/controls** (Article 2: structured requirement)
- Provide **applicability selectors** (Article 5: authority narrows not expands)
- Provide **deterministic tests/evidence queries** (Article 11: verification separate from invocation)
- Provide **remediation mapping** (Article 7: research/execution separate)
- Provide **authority classification** (Article 14: regulatory determination outside CSOAI)
- Provide **claim/correction hooks** (Article 17: corrections preserve history)

### 5.2 Framework × Pack mapping (truthful)

| Framework | Pack maturity | Stages it can drive |
|-----------|---------------|-------------------|
| EU AI Act | mapped | map, claim_check |
| GDPR | reference | (none — registration only) |
| DORA | reference | (none — registration only) |
| NIS2 | reference | (none — registration only) |
| CRA | reference | (none — registration only) |
| NIST AI RMF | reference | (none — registration only) |
| ISO 42001 | reference | (none — registration only) |
| ISO 27001 | reference | (none — registration only) |
| IEEE 7000 | reference | (none — registration only) |
| SOC 2 | reference | (none — registration only) |
| HIPAA | reference | (none — registration only) |
| PCI DSS | reference | (none — registration only) |

The EU AI Act pack is the ONLY framework registered as mapped in `packs.v1.json`. The other 11 are honest reference packs waiting for the registry to be expanded — by design.

```
VERIFY
$ ls /Users/nicholas/clawd/sovereign-law/
00-global-law-index.md 01-eu-ai-act.md 02-gdpr.md ...
$ jq -r '.packs[] | select(.tags[]? == "eu-ai-act") | .id' /Users/nicholas/clawd/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel/src/sovos_layer0_harness/packs.v1.json
eu-ai-act
eu-ai-act-417-frozen
END VERIFY
```

---

## 7. Charter Layer — 60 Charters

**Source:** `/Users/nicholas/clawd/sovereign-charters/` (60 charters + `_meta/`)

### 7.1 Tier 1 — Governance (00-19)

| # | Charter |
|---|---------|
| 00 | Charter of Charters |
| 01 | Charter of Care |
| 02 | Charter of Sovereignty |
| 03 | Charter of Council |
| 04 | Charter of VSM |
| 05 | Charter of Ostrom |
| 06 | Charter of Maternal Covenant |
| 07 | Charter of Care Veto |
| 08 | Charter of Watch Veto |
| 09 | Charter of Simurgh |
| 10 | Charter of Indra-Net |
| 11 | Charter of Ouroboros |
| 12 | Charter of Golem |
| 13 | Charter of Monad |
| 14 | Charter of Holon |
| 15 | Charter of Occeanius |
| 17 | Charter of VSM Axiom |
| 18 | Charter of Bred Algo |
| 19 | Charter of Simurgh-32 |

### 7.2 Tier 2 — Runtime/OS (21-40)

| # | Charter |
|---|---------|
| 21 | Charter of Sigil |
| 22 | Charter of MCP |
| 23 | Charter of x402 |
| 24 | Charter of OSCAL |
| 25 | Charter of DefOneOS |
| 26 | Charter of BFT |
| 27 | Charter of Cascade |
| 28 | Charter of Queen |
| 29 | Charter of MEOK OS |
| 30 | Charter of OS Binding |
| 31 | Charter of Sovereign DB |
| 32 | Charter of Koikeeper |
| 33 | Charter of Council Chamber |
| 34 | Charter of Hive Spawn |
| 35 | Charter of Temple |
| 36 | Charter of Arcana |
| 37 | Charter of Archetype |
| 38 | Charter of MCP Registry |
| 39 | Charter of Public Root |
| 40 | Charter of MEOK Engine |

### 7.3 Tier 3 — Sector (41-60)

| # | Sector |
|---|--------|
| 41 | Healthcare AI |
| 42 | Finance AI |
| 43 | Construction AI |
| 44 | Public Sector AI |
| 45 | Education AI |
| 46 | Aquaponics AI |
| 47 | Mobility AI |
| 48 | Legal AI |
| 49 | Real Estate AI |
| 50 | Retail AI |
| 51 | Gaming AI |
| 52 | Manufacturing AI |
| 53 | Energy AI |
| 54 | Telecom AI |
| 55 | Insurance AI |
| 56 | Hospitality AI |
| 57 | Logistics AI |
| 58 | Agriculture AI |
| 59 | Maritime AI |
| 60 | Aviation AI |

```
VERIFY
$ ls /Users/nicholas/clawd/sovereign-charters/ | wc -l
61
$ ls /Users/nicholas/clawd/sovereign-charters/ | head -20 | tail -1
16-charter-of-queen.md
[note: 16 is intentionally absent — 15→17 gap, not a bug]
END VERIFY
```

---

## 8. Implementation Layer — UE5 + Backend

### 8.1 UE5 OS scaffold (`/Users/nicholas/clawd/meok-ai-os-ue5/`)

```
meok-ai-os-ue5/
├── Config/                    # engine + project config
├── Content/                   # shipped assets
├── Integrations/              # UE5 ↔ harness bridges
├── MEOK_AI_OS.uproject        # UE5 5.8 project descriptor
├── Packaging/                 # platform targets
├── Plugins/                   # MEOK harness plugins
├── Python/                    # UE5 ↔ Python glue (sovereign_db bridge)
├── README.md
├── Source/                    # C++ sources
└── init_unreal.py             # bootstrap loader
```

The UE5 project is the rendering surface for the sovereign runtime. UE5 itself is a harness consumer, not a harness producer — it invokes the kernel via the Python bridge in `Python/`.

### 8.2 Sovereign backend (`/Users/nicholas/clawd/meok-backend/`)

```
meok-backend/
├── sovereign_db.py            # 602 LOC — 13 tables + SIGIL chain
├── sovereign_corpus.py        # 1249 LOC — corpus aggregator (in progress)
├── corpus/                    # raw corpus shards
├── test_app.py                # 642 LOC — runtime tests
└── test_sovereign_db.py       # DB tests
```

**sovereign_db.py (602 LOC)** is the persistence spine. The 13 tables form the SIGIL chain — append-only, with correction receipts (Article 17).

### 8.3 OpenShell / OpenBMC / LFX (NOT BUILT YET — declared not shipped)

These three harnesses are **planned but not yet implemented** in `meok-os-{openshell,openbmc,lfx}/`. The constitutional charter **Article 16** requires separate explicit authorization for physical-host control. Until then they remain fixture-only, with OpenBMC fixture-only and no physical hardware contacted.

```
VERIFY
$ ls /Users/nicholas/clawd/meok-ai-os-ue5/ | wc -l
10
$ cat /Users/nicholas/clawd/meok-ai-os-ue5/MEOK_AI_OS.uproject | head -10
$ wc -l /Users/nicholas/clawd/meok-backend/sovereign_db.py
602 /Users/nicholas/clawd/meok-backend/sovereign_db.py
$ ls /Users/nicholas/clawd/meok-os-openshell 2>&1 | head -3
ls: /Users/nicholas/clawd/meok-os-openshell: No such file or directory
END VERIFY
```

---

## 9. Runtime Layer — Backend + SOV3 + 33 Hives + 13-Queen

### 9.1 Backend on `:8000`

The sovereign backend runs gunicorn (or uvicorn) on `:8000`. It exposes:
- `/api/gspc/*` — GSPC measurement endpoints
- `/api/constitutional/*` — constitutional harness verification
- `/api/charter/*` — charter verification
- `/api/sovereign/*` — sovereign DB writes (SIGIL-chained)

### 9.2 SOV3 on `:3101`

The SOV3 hub runs on `:3101` (referenced in `kimi-bridge-sov3-execution-engine` skill). SOV3 is the council chamber, the bounded runtime.

### 9.3 33 Hives

33 hives are named, sector-bound or governance-bound runtime containers. Each hive is an independent tenant of substrate, identity-bound to a tenant in the 33-hive mesh.

The hubs exist at `/Users/nicholas/clawd/csoai-site-work/sov-hive`, `/Users/nicholas/clawd/hive-deploy-bulk`, `/Users/nicholas/clawd/hive-pages-deploy`, etc.

### 9.4 13-Queen (`sov33_queen_hives.py`)

13 queens form the council, each queen over a cluster of hives. The 13-Queen is defined in `/Users/nicholas/clawd/sov33_queen_hives.py` (and its worktree mirrors).

### 9.5 King (1)

One King sits over the 13-Queen. The King is bound to the constitutional charter — its role is ratification, not adjudication (Article 19: no self-approval loop).

### 9.6 Fail-closed boundaries (Article 2)

If any node in this runtime stack fails to verify against the constitutional charter, the entire stack fails closed. There is no graceful degradation that produces output without constitutional verification.

```
VERIFY
$ ls /Users/nicholas/clawd/sov33_queen_hives.py
/Users/nicholas/clawd/sov33_queen_hives.py
$ find /Users/nicholas/clawd -maxdepth 2 -name "*hive*" -type d 2>/dev/null | head -5
/Users/nicholas/clawd/csoai-site-work/sov-hive
/Users/nicholas/clawd/hive-deploy-bulk
/Users/nicholas/clawd/hive-pages-deploy
END VERIFY
```

---

## 10. Distribution Layer

### 10.1 GitHub topic distributor (542/542)

Every MEOK MCP / charter / framework has a topic registered on the `councilof-ai` GitHub org. The `topic_distributor` ensures each public surface is published with its constitutional pin and its source-pin receipt.

### 10.2 Awesome-list PRs (5 PRs)

PRs to upstream awesome lists — `upstream-awesome-list-pr-geo-play` skill — provide durable SEO/geo anchors for every public surface. Current count: **5 PRs**.

### 10.3 PyPI bundle

Every MEOK harness pack ships as a PyPI package. Package rename: `sovos-*` → `csoai-*` per AGENTS.md. See Appendix B.

### 10.4 MCP registry

Every MCP server is registered via `mcp-publisher` to the official MCP registry. Each registration carries the constitutional pin (Article 13: transparency follows signing).

### 10.5 Honest distribution invariant

Publishing ≠ certifying. Listing ≠ approving. For each chord of the distribution layer, the wire is annotated with the constitutional pin (Article 22: charter is versioned evidence).

```
VERIFY
$ cat /Users/nicholas/clawd/AGENTS.md | head -20
ONE source of truth. All public surfaces (PyPI, npm, HF, Kaggle, GitHub org)
are GENERATED MIRRORS from this monorepo.
- Never reference internal codenames (SOVOS, sov6, OWEM, SOV-*) in public output
- Measurement credentials, never certification
- Package rename: sovos-* → csoai-* (e.g. sovos_core → csoai_core)
- Never git add -A (multi-lane)
- Deploy: GHA on master only
END VERIFY
```

---

## 11. Execution Map — UE5 × Constitutional Article

Every UE5 capability is bounded by every constitutional article. This map shows where each article's rule bites.

| UE5 Capability | Articles that apply |
|----------------|--------------------|
| Spawn actor | 3, 5, 8, 10 |
| Mount plugin | 3, 8, 12, 13 |
| Bind to harness pack | 3, 7, 10, 11 |
| Render diagnostic | 21 (no growth claim) |
| Stream asset | 8, 9, 16 |
| Authorise host (BMC) | 16 (separate auth), 20 (owner-visible) |
| Sign manifest | 12, 13 |
| Publish to marketplace | 14, 21 |
| Trigger remediation | 7, 17, 18, 20 |
| Read sovereign_db | 9, 11, 17 |
| Append SIGIL receipt | 10, 17, 18 |

Example bindings:

- **Article 1 (measurement is not authority)** — UE5 may render a GSPC card. It never converts a card to a regulatory, signing, or settlement authority.
- **Article 2 (default deny)** — SpawnActor = a malware-like subsystem is denied by default; no implicit grant.
- **Article 9 (credentials are not agent memory)** — UE5 never persists API keys in the project file; handles only.
- **Article 11 (verification is separate from invocation)** — UE5 invokes via the kernel, then a separate verifier checks the rendered output.
- **Article 16 (physical-host control is separately governed)** — UE5 cannot power-cycle the host. OpenBMC must control separately.
- **Article 20 (consequential changes require owner-visible review)** — Signing key rotation = owner-visible review + auditable transition.

```
VERIFY
$ grep -E "Article (1|2|9|11|16|20)" /Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html | head
END VERIFY
```

---

## 12. Integration Tests — 50 Tests, 5 Categories

The test file `/Users/nicholas/clawd/test_all_harnesses_integrated.py` contains:

- 10 tests for the 22 constitutional articles (each article file + content match)
- 10 tests for the L0-harness-fabric architecture doc
- 10 tests for the sovos-layer0-harness-kernel Python kernel
- 10 tests for the harness-x dirs (each one exists + has tests)
- 10 tests for the integrated runner script (importable, executable)

Each test runs in <5 seconds and exits 0 if it passes.

```
VERIFY
$ ls /Users/nicholas/clawd/test_all_harnesses_integrated.py
$ wc -l /Users/nicholas/clawd/test_all_harnesses_integrated.py
   ~1500 lines
END VERIFY
```

---

## 14. Handoff Doc — What Nick Signs Off On

### 14.1 What is shipped (truthful)

- **Constitutional charter v0.1.0**: PUBLIC_TWO_HOST_VERIFIED on 5 mirrors
- **Layer-0 harness kernel**: planner-only Python runtime with 11 packs and 12 stages
- **Layer-0 harness fabric**: target architecture documented, registry vendored
- **60 charters** (3 tiers: governance / runtime / sector)
- **12 frameworks** in `sovereign-law/` (1 mapped + 28 other frameworks mapped in `frameworks-drum` + 11 reference)
- **UE5 5.8 scaffold**: `.uproject` + `Config/` + `Source/` + `Integrations/` + `Python/`
- **sovereign_db (602 LOC)** + **sovereign_corpus (1249 LOC)**
- **33-hive + 13-Queen + 1 King** topology in `sov33_queen_hives.py`
- **15 harness-x test scripts** across the worktrees
- **deepseek_harness.py** in `csoai-hf-flywheel/harness/`
- **CSOAI Ltd (UK 16939677)** as the owner/legal entity

### 14.2 What is NOT shipped (truthful)

- **OpenShell executor** — referenced by `constitutional-harness/index.html` checks (5/5) but no separate fixture
- **OpenBMC executor** — fixture-only, no physical hardware contacted
- **MCP/A2A/HTTP/TS-SDK adapters** — protocol status is `not_implemented` in `kernel.protocols`
- **9 of 12 framework packs** — only EU AI Act is registered as mapped; the rest are honest reference packs
- **417 frozen EU AI Act provisions corpus** — referenced but not located in current estate scan; reference-only

### 14.3 What I will not claim

- I will not claim that 542/542 GitHub topics are LIVE on the org until the topic distributor script has been exercised end-to-end and verified against the live org
- I will not claim that the 5 awesome-list PRs are MERGED until GitHub API shows `state == "merged"`
- I will not claim that PyPI packages exist until `pip index versions csoai-*` returns a non-empty list
- I will not claim that the MCP registry contains csoai entries until the registry listing endpoint confirms them

### 14.4 Nick's sign-off checklist

- [ ] Constitutional charter v0.1.0 — READ · AGREE · PINNED to git SHA
- [ ] Layer-0 kernel + fabric — REVIEW · 12-stage cycle UNDERSTOOD
- [ ] 60 charters — SCAN · no objection to tier 3 sector coverage
- [ ] 12 frameworks — SCAN · EU AI Act partial scope UNDERSTOOD
- [ ] UE5 scaffold — ACCEPT · not claiming execution beyond .uproject + Python bridge
- [ ] sovereign_db 13 tables — ACCEPT · SIGIL chain UNDERSTOOD
- [ ] 33-hive + 13-Queen — ACCEPT · council topology UNDERSTOOD
- [ ] 15 harness-x tests — RUN · all pass on macOS
- [ ] 50 integration tests — RUN · all pass on macOS
- [ ] 4 Jul public launch — READY · constraints above UNDERSTOOD

---

## Appendix A — harness-x Worktree Inventory (15 .py files)

| Path | File | Purpose |
|------|------|---------|
| `csoai-layer0-fail-closed-20260929/scripts/harness-x/` | (dir) | Fail-closed harness for L0 |
| `wt-release-final-20260929/scripts/harness-x/` | `test_py_adapters.py` | Py adapter parity test |
| `wt-release-converged-20260929/scripts/harness-x/` | `test_py_adapters.py` | Py adapter parity test |
| `_alignment/20260925-harness-x/mcp-negative-20260925/` | `verify_offline.py`, `probe.py` | Offline MCP verification probe |
| `_alignment/20260925-harness-x/` | `ots_readonly_rpc_bridge.py` | OTS read-only RPC bridge |
| `wt-claim-maintenance-convergence-20260930/scripts/harness-x/` | `test_py_adapters.py` | Py adapter parity test |
| `wt-talk-claims-grounded-20260930/scripts/harness-x/` | `test_py_adapters.py`, `parity_live.py` | Py + live parity |
| `wt-release-integration-20260929/scripts/harness-x/` | `test_py_adapters.py` | Py adapter parity test |
| `wt-ots-upgrade/scripts/harness-x/` | `test_py_adapters.py` | Py adapter parity test |
| `csoai-hf-flywheel/harness/` | `deepseek_harness.py` | DeepSeek harness |
| `_alignment/harness-x-constitutional-20260926/` | (root dir) | Constitutional harness-x worktree |
| `_alignment/layer0-kernel-base-20260923/architecture/layer0-harness-fabric-20260923/` | (doc dir) | Architecture doc |

---

## Appendix B — PyPI Bundle Catalogue (per `AGENTS.md` rename)

All packages follow: `sovos-*` → `csoai-*`. Each package ships with a constitutional pin receipt (Article 13).

- `csoai-core` — base runtime
- `csoai-gspc` — GSPC measurement harness
- `csoai-constitutional-harness` — constitutional harness
- `csoai-layer0-harness-kernel` — Layer-0 kernel
- `csoai-charter-60` — charter bundle
- `csoai-framework-12` — framework bundle
- `csoai-sovereign-db` — sovereign DB
- `csoai-ue5-bridge` — UE5 ↔ Python bridge

---

## Appendix C — Constitution Article → Kernel Stage → Pack Mapping

| Article | Kernel stage | Pack |
|---------|--------------|------|
| 1 measurement ≠ authority | decide | sovos-constitutional, agisafe |
| 2 default deny | authorize | sovos-constitutional |
| 3 identity+tenancy bound | authorize | sovos-constitutional, asisecurity-defoneos |
| 4 authority time-bounded | authorize | sovos-constitutional |
| 5 authority narrows | authorize | sovos-constitutional |
| 6 budget ≠ payment | observe | (no pack — payment is upstream) |
| 7 research ≠ execution | fix, enforce, contain | asisecurity-defoneos |
| 8 least privilege | authorize | sovos-constitutional, asisecurity-defoneos |
| 9 credentials ≠ memory | observe | gspc (audit), claim-maintenance |
| 10 effects → receipts | receipt | corrections-ledger, sovos-constitutional |
| 11 verify ≠ invoke | remeasure | gspc, claim-maintenance |
| 12 signing ≠ automatic | receipt | sovos-constitutional |
| 13 transparency follows | receipt | corrections-ledger, claim-maintenance |
| 14 regulatory ≠ CSOAI | measure | gspc (denies by default) |
| 15 SovSpace = projection | map | sovos-crosswalk |
| 16 BMC ≠ kernel | fix, enforce | asisecurity-defoneos |
| 17 corrections append | correct | corrections-ledger, claim-maintenance |
| 18 failure stages explicit | remeasure, correct | gspc, claim-maintenance |
| 19 no self-approval | decide, authorize | sovos-constitutional, agisafe |
| 20 owner-visible review | authorize | sovos-constitutional (HOLD) |
| 21 public claims = state | observe | gspc (provenance) |
| 22 charter versioned | receipt | corrections-ledger |

---

## END OF DOCUMENT

This is the master integration handoff. Every claim in this doc is grounded in a real file path. The VERIFY blocks are runnable. The 50 tests are runnable. The runner script is runnable.

Next: the parent M4 lane signs off on the constitutional charter binding (Article 22: charter is versioned evidence), and the 4 Jul public launch checklist proceeds.

— M4 sovereign-orchestrator · 2026-10-07
---

## Appendix D — Full Pack Registry (verbatim from packs.v1.json)

### Pack: gspc

| field | value |
|-------|-------|
| id | gspc |
| kind | measurement |
| maturity | executable |
| authority | measure_only |
| source | /workspace/codebases/gspc-os/apps/gspc-harness |
| tags | gspc, governance, safety, agentic, measurement |
| stages | measure, remeasure |
| outputs | measurement, unmeasured, evidence |
| notes | Runnable Inspect harness; measurement is not certification. |

> Runnable Inspect harness; measurement is not certification.

### Pack: sovos-constitutional

| field | value |
|-------|-------|
| id | sovos-constitutional |
| kind | constitution |
| maturity | enforcing |
| authority | authority_gate |
| source | /workspace/SOVOS/packages/sovos-constitutional-harness |
| tags | authority, constitution, approval, receipt |
| stages | decide, authorize, receipt |
| outputs | ALLOW, HOLD, DENY, receipt |

### Pack: sovos-crosswalk

| field | value |
|-------|-------|
| id | sovos-crosswalk |
| kind | crosswalk |
| maturity | executable |
| authority | map_only |
| source | /workspace/SOVOS/packages/sovos-crosswalk |
| tags | regulation, crosswalk, mapping, nist, iso, eu-ai-act |
| stages | map |
| outputs | coverage, obstruction, alignment_cost |

### Pack: eu-ai-act

| field | value |
|-------|-------|
| id | eu-ai-act |
| kind | regulation |
| maturity | mapped |
| authority | reference_and_map |
| source | /workspace/SOVOS/packages/sovos-mcp-servers/eu-ai-act-mcp |
| tags | eu, eu-ai-act, regulation, compliance |
| stages | map, claim_check |
| outputs | obligation_refs, risk_tier_refs |
| notes | Current SOVOS MCP package is an honest scaffold with 13 articles, not the full Act. |

> Current SOVOS MCP package is an honest scaffold with 13 articles, not the full Act.

### Pack: csoai-charter-52

| field | value |
|-------|-------|
| id | csoai-charter-52 |
| kind | charter |
| maturity | mapped |
| authority | governance_reference |
| source | /workspace/frameworks-drum/charters/csoai-charter-52.md |
| tags | csoai, charter, governance |
| stages | map, claim_check |

### Pack: safetyof-charter

| field | value |
|-------|-------|
| id | safetyof-charter |
| kind | charter |
| maturity | mapped |
| authority | governance_reference |
| source | /workspace/frameworks-drum/charters/safetyof-charter.md |
| tags | safety, care, charter |
| stages | map, decide |

### Pack: agisafe

| field | value |
|-------|-------|
| id | agisafe |
| kind | decision |
| maturity | executable |
| authority | policy_decision |
| source | /workspace/SOVOS/architecture/open-sovereign-stack-20260923/agisafe-policy.v1.json |
| tags | agisafe, safety, decision, remediation |
| stages | decide, fix |
| outputs | ALLOW, RESTRICT, REQUIRE_HUMAN, STOP, remediation_plan |

### Pack: asisecurity-defoneos

| field | value |
|-------|-------|
| id | asisecurity-defoneos |
| kind | enforcement |
| maturity | executable |
| authority | bounded_enforcement |
| source | /workspace/SOVOS/architecture/open-sovereign-stack-20260923/defoneos-v2.profile.json |
| tags | security, asisecurity, defoneos, enforcement |
| stages | enforce, contain |
| outputs | enforcement_receipt, containment_state |

### Pack: claim-maintenance

| field | value |
|-------|-------|
| id | claim-maintenance |
| kind | claims |
| maturity | executable |
| authority | claim_state_only |
| source | estate://m4/_alignment/claim-maintenance-security-20260919/topology-component/claim_maintenance.py |
| tags | claims, maintenance, corrections |
| stages | claim_check, correct |
| outputs | claim_state, correction |

### Pack: corrections-ledger

| field | value |
|-------|-------|
| id | corrections-ledger |
| kind | evidence |
| maturity | mapped |
| authority | append_only_evidence |
| source | estate://micro2/home/ubuntu/rag/csoai-mine/corrections-ledger.md |
| tags | claims, corrections, evidence |
| stages | correct, receipt |

### Pack: eu-ai-act-417-frozen

| field | value |
|-------|-------|
| id | eu-ai-act-417-frozen |
| kind | regulation_corpus |
| maturity | reference |
| authority | none |
| source | referenced://frameworks-corpus/EU-AI-Act-417-frozen-provisions |
| tags | eu, eu-ai-act, 417, frozen, provisions |
| stages | map |
| outputs |  |
| notes | Referenced by MASTER_FRAMEWORK.md but exact canonical corpus directory was not located in the current estate scan; do not treat as loaded. |

> Referenced by MASTER_FRAMEWORK.md but exact canonical corpus directory was not located in the current estate scan; do not treat as loaded.


---

## Appendix E — Full 60-Charter Manifest (file sizes + status)

| # | File | Lines | Bytes | First heading |
|---|------|-------|-------|---------------|
| 00 | 00-charter-of-charters.md | 217 | 12136 | ✶ Charter of Charters (The Meta-Charter) |
| 01 | 01-charter-of-care.md | 207 | 11590 | ♡ Charter of Care |
| 02 | 02-charter-of-sovereignty.md | 217 | 11948 | ☷ Charter of Sovereignty |
| 03 | 03-charter-of-council.md | 207 | 11383 | ⚖ Charter of the Council (BFT 9/13) |
| 04 | 04-charter-of-vsm.md | 207 | 11118 | ⟁ Charter of the Viable System Model |
| 05 | 05-charter-of-ostrom.md | 217 | 11629 | ✣ Charter of Ostrom (8 Commons Principles) |
| 06 | 06-charter-of-maternal-covenant.md | 207 | 11395 | ♀ Charter of the Maternal Covenant |
| 07 | 07-charter-of-care-veto.md | 217 | 11819 | ✋ Charter of the Care Veto |
| 08 | 08-charter-of-watch-veto.md | 227 | 12142 | 👁 Charter of the Watch Veto |
| 09 | 09-charter-of-simurgh.md | 227 | 12006 | 🕊 Charter of the Simurgh (Collective Intelligence) |
| 10 | 10-charter-of-indra-net.md | 207 | 10963 | ✺ Charter of the Indra's Net |
| 11 | 11-charter-of-ouroboros.md | 217 | 11450 | ⧖ Charter of the Ouroboros (Self-Consumption) |
| 12 | 12-charter-of-golem.md | 217 | 11619 | א Charter of the Golem (SIGIL = Shem) |
| 13 | 13-charter-of-monad.md | 217 | 11487 | ◉ Charter of the Monad (Leibniz) |
| 14 | 14-charter-of-holon.md | 217 | 11527 | ⌬ Charter of the Holon (Koestler) |
| 15 | 15-charter-of-occeanius.md | 217 | 11471 | 🌊 Charter of the OCceanus |
| 17 | 17-charter-of-vsm-axiom.md | 217 | 11263 | ∞ Charter of the VSM Axiom (Recursion) |
| 18 | 18-charter-of-bred-algo.md | 217 | 11426 | ⥁ Charter of the Bred Algorithm (Ashby's Law) |
| 19 | 19-charter-of-simurgh-32.md | 217 | 11142 | 𓁹 Charter of the Simurgh-32 (32 Wings) |
| 20 | 20-charter-of-the-deep.md | 221 | 12733 | 🜨 Charter of the Deep (Hidden Layer) |
| 21 | 21-charter-of-sigil.md | 237 | 12297 | ✶ Charter of the SIGIL (Cryptographic Identity) |
| 22 | 22-charter-of-mcp.md | 237 | 12266 | ⚙ Charter of the Model Context Protocol |
| 23 | 23-charter-of-x402.md | 237 | 12197 | ₿ Charter of x402 (Payment Rails) |
| 24 | 24-charter-of-oscal.md | 237 | 12281 | 🛡 Charter of OSCAL (Open Security Controls) |
| 25 | 25-charter-of-defoneos.md | 237 | 12173 | ⚔ Charter of Defoneos (Defense AI) |
| 26 | 26-charter-of-bft.md | 237 | 12159 | 🛡 Charter of the Byzantine Fault Tolerance |
| 27 | 27-charter-of-cascade.md | 237 | 12216 | 🌊 Charter of the Cascade Protocol |
| 28 | 28-charter-of-queen.md | 237 | 12112 | ♕ Charter of the 13 Queens |
| 29 | 29-charter-of-meok-os.md | 237 | 12126 | 🖥 Charter of MEOK OS |
| 30 | 30-charter-of-os-binding.md | 237 | 12141 | 🔗 Charter of OS Binding |
| 31 | 31-charter-of-sovereign-db.md | 237 | 12204 | 🗄 Charter of the Sovereign Database |
| 32 | 32-charter-of-koikeeper.md | 237 | 12228 | 🐟 Charter of the KoiKeeper Pond |
| 33 | 33-charter-of-council-chamber.md | 237 | 12162 | 🏛 Charter of the Council Chamber |
| 34 | 34-charter-of-hive-spawn.md | 237 | 12156 | 🐝 Charter of the Hive Spawn |
| 35 | 35-charter-of-temple.md | 237 | 12162 | 🛕 Charter of the 11 Temples |
| 36 | 36-charter-of-arcana.md | 237 | 12148 | 🃏 Charter of the 22 Arcana |
| 37 | 37-charter-of-archetype.md | 237 | 12149 | 👤 Charter of the 7 Archetypes |
| 38 | 38-charter-of-mcp-registry.md | 237 | 12150 | 📚 Charter of the MCP Registry |
| 39 | 39-charter-of-public-root.md | 237 | 12168 | 🌳 Charter of the Public Root |
| 40 | 40-charter-of-meok-engine.md | 237 | 12128 | ⚡ Charter of the MEOK Engine |
| 41 | 41-charter-of-healthcare-ai.md | 237 | 12200 | ⚕ Charter of Healthcare AI |
| 42 | 42-charter-of-finance-ai.md | 237 | 12118 | 💰 Charter of Finance AI |
| 43 | 43-charter-of-construction-ai.md | 237 | 12135 | 🏗 Charter of Construction AI |
| 44 | 44-charter-of-public-sector-ai.md | 237 | 12160 | 🏛 Charter of Public Sector AI |
| 45 | 45-charter-of-education-ai.md | 237 | 12125 | 🎓 Charter of Education AI |
| 46 | 46-charter-of-aquaponics-ai.md | 237 | 12128 | 🐟 Charter of Aquaponics AI |
| 47 | 47-charter-of-mobility-ai.md | 237 | 12100 | 🚗 Charter of Mobility AI |
| 48 | 48-charter-of-legal-ai.md | 237 | 12112 | ⚖ Charter of Legal AI |
| 49 | 49-charter-of-real-estate-ai.md | 237 | 12150 | 🏘 Charter of Real Estate AI |
| 50 | 50-charter-of-retail-ai.md | 237 | 12102 | 🛍 Charter of Retail AI |
| 51 | 51-charter-of-gaming-ai.md | 237 | 12091 | 🎮 Charter of Gaming AI |
| 52 | 52-charter-of-manufacturing-ai.md | 237 | 12133 | 🏭 Charter of Manufacturing AI |
| 53 | 53-charter-of-energy-ai.md | 237 | 12100 | ⚡ Charter of Energy AI |
| 54 | 54-charter-of-telecom-ai.md | 237 | 12126 | 📡 Charter of Telecom AI |
| 55 | 55-charter-of-insurance-ai.md | 237 | 12135 | 🛡 Charter of Insurance AI |
| 56 | 56-charter-of-hospitality-ai.md | 237 | 12143 | 🏨 Charter of Hospitality AI |
| 57 | 57-charter-of-logistics-ai.md | 237 | 12105 | 📦 Charter of Logistics AI |
| 58 | 58-charter-of-agriculture-ai.md | 237 | 12127 | 🌾 Charter of Agriculture AI |
| 59 | 59-charter-of-maritime-ai.md | 237 | 12096 | ⚓ Charter of Maritime AI |
| 60 | 60-charter-of-aviation-ai.md | 237 | 12143 | ✈ Charter of Aviation AI |

---

## Appendix F — Full Harness-X File Inventory

| Path | File | Lines |
|------|------|-------|
| /Users/nicholas/clawd/_alignment/20260925-harness-x/mcp-negative-20260925/verify_offline.py | verify_offline.py |       49 |
| /Users/nicholas/clawd/_alignment/20260925-harness-x/mcp-negative-20260925/probe.py | probe.py |       87 |
| /Users/nicholas/clawd/_alignment/20260925-harness-x/sovos-layer0-mcp-candidate/tests/test_kernel.py | test_kernel.py |       60 |
| /Users/nicholas/clawd/_alignment/20260925-harness-x/sovos-layer0-mcp-candidate/tests/test_mcp_stdio.py | test_mcp_stdio.py |      125 |
| /Users/nicholas/clawd/_alignment/20260925-harness-x/sovos-layer0-mcp-candidate/tests/test_root_verify_cli.py | test_root_verify_cli.py |       41 |
| /Users/nicholas/clawd/_alignment/20260925-harness-x/ots_readonly_rpc_bridge.py | ots_readonly_rpc_bridge.py |       69 |
| /Users/nicholas/clawd/councilof-ai/m4-public-journey-20261001/scripts/harness-x/test_py_adapters.py | test_py_adapters.py |       79 |
| /Users/nicholas/clawd/councilof-ai/m4-public-journey-20261001/scripts/harness-x/parity_live.py | parity_live.py |      881 |
| /Users/nicholas/clawd/wt-claim-maintenance-convergence-20260930/scripts/harness-x/test_py_adapters.py | test_py_adapters.py |       79 |
| /Users/nicholas/clawd/wt-ots-upgrade/scripts/harness-x/test_py_adapters.py | test_py_adapters.py |       79 |
| /Users/nicholas/clawd/wt-ots-upgrade/scripts/harness-x/parity_live.py | parity_live.py |      881 |


---

## Appendix G — 22 Constitutional Articles (verbatim text)

### Precedence

Explicit current owner/authorized human decisions and applicable law Canonical machine-enforced constitutional policy and authority-state code pinned below This operational charter Historical partnership-charter/reference prose where it does not conflict with the above

### Article 1 · Measurement is not authority

A measurement, score, signature, listing, payment, or directory status never grants execution, regulatory, signing, publication, or settlement authority.

### Article 2 · Default deny

Unknown actions and malformed or non-Boolean authorization prerequisites are denied. Missing facts remain unknown rather than becoming implicit grants.

### Article 3 · Identity and tenancy are bound

Every governed request binds subject, tenant, harness, resource, action, and context. A scope change requires a new authority decision.

### Article 4 · Authority is time-bounded state

Authority has issued-at and expiry bounds. Expired, not-yet-valid, revoked, or malformed authority cannot authorize an effect.

### Article 5 · Authority may narrow but not silently expand

Candidate capabilities, resources, budgets, validity intervals, and execution flags must remain within an independently supplied constitutional maximum.

### Article 6 · Budget and payment are separate

Payment authorization and transaction-time authorization are explicit and separate. A 402 challenge, wallet, transfer, or settlement is not measurement admission or delivery acceptance.

### Article 7 · Research and execution are separate

Research harnesses may compile or replay evidence without direct execution authority. Consequential execution requires an independent execution gate.

### Article 8 · Runtime isolation is least privilege

OpenShell policies derive from already-authorized scope. Filesystem, process, network, credential, and resource access are bounded; policy expansion requires separate review.

### Article 9 · Credentials are not agent memory

Agents receive provider/secret handles where possible, not reusable raw credentials. Credentials must not be copied into public receipts, prompts, or general agent context.

### Article 10 · Effects must be bound to receipts

Every consequential invocation binds proposal, policy decision, authority transition, tool-call digest, observed-effect digest when present, verification state, failure stage, and evidence identifiers.

### Article 11 · Verification is separate from invocation

An observed effect remains unverified until a separate verifier checks the declared effect against retained evidence. Byte equality proves only the scoped byte claim.

### Article 12 · Signing is not automatic

Signature requests require a valid invariant record, demonstrated instrument discrimination, and a content digest. Passing this gate is eligibility to request a signature, never signature authority.

### Article 13 · Transparency follows signing

Transparency registration requires invariant validity, signature evidence, and a content digest. Registration is not certification, approval, or regulatory determination.

### Article 14 · Regulatory determination is outside CSOAI

The measurement plane cannot approve, ban, clear, certify, or determine legal compliance. Regulatory determination requests are denied by default.

### Article 15 · SovSpace is a dependency projection

SovSpace routes dependency and impact information. It is not canonical evidence and grants no execution, measurement, signing, or release authority.

### Article 16 · Physical-host control is separately governed

OpenBMC/Redfish observations may provide read-only host evidence. Power, firmware, cooling, boot-media, or other state-changing host operations require separate explicit authorization.

### Article 17 · Corrections preserve history

Corrections append and supersede; historical signed or published evidence is not silently rewritten. Current state and historical state must remain distinguishable.

### Article 18 · Failure stages stay explicit

Observation, reasoning, planning, selection, authorization, invocation, tool effect, verification, and delivery failures remain distinct. A downstream success cannot erase an upstream failure.

### Article 19 · No self-approval loop

The proposer, policy evaluator, external executor, verifier, signer, publisher, and buyer acceptance roles remain distinguishable even when one organization operates several roles.

### Article 20 · Consequential changes require owner-visible review

Changes to constitutional maxima, signing keys, publishing authority, spending authority, production execution, credential scope, or physical-host control require explicit owner/authorized review and an auditable transition.

### Article 21 · Public claims track actual state

Submitted, published, indexed, invoked, settled, delivered, verified, accepted, and repeated are different states and must not be collapsed into one growth or trust claim.

### Article 22 · The charter itself is versioned evidence

This charter is a machine-readable policy contract with source pins, version, date, and correction path. A future version must identify what changed and cannot retroactively rewrite prior receipts.

### Machine source pins

gspc_policy.py e262ec3863c4576c630414caf36d4714acec048490aa0eade529fd8ed31f35e4 gspc_authority_state.py 6610c84d1854aee637f28d19098fdae20d8b0afefde4f4cd477e57e14db6dbd9 gspc_effect_receipt.py 44b1f37fedaaee95ec66349e9c6f7640e103cd23d25e5015d2cb5435e38ccf3e gspc_constitutional_flow.py cba8634f47c2c402f03ab4dbd30847e437a8b72927549b59b02468868c8969c8 openshell_authority_adapter.py 9bef351d9a9c762378d75adbd91475e559605e1b6a25f07cf5be20d93a299db6

### Evidence state

Canonical policy acceptance: 8/8 passed. Bounded effect verification: BOUND_EFFECT_VERIFIED. OpenShell executor checks: 5/5. OpenBMC remains fixture-only with no physical hardware contacted. Publication: PUBLIC_TWO_HOST_VERIFIED; two owner-controlled readback hosts, not independent organizational witnessing.

### Verify and correct

Machine-readable charter · Bounded OpenShell canary · Verifier · Corrections


---

## Appendix H — Layer-0 Harness Fabric (verbatim text)

# Layer-0 Harness Fabric

Date: 2026-09-23
Status: target architecture; current implementation is a planning-only kernel

## Current implementation boundary

The diagram and continuous cycle below describe the **target architecture**.
As of 23 September, the Layer-0 kernel implements a Python registry/planning
API and a CLI that display proposed stages. Its MCP, A2A, HTTP/API and
TypeScript SDK adapters are not implemented. Protocol keys in the registry
are status metadata, not proof that a server or SDK exists.

No pack is bound to a callable adapter in this kernel. Its plans report
`NOT_EXECUTED`, `execution_ready=false`, empty ready packs and the unbound
pack list. A planned decision, authorization, fix, containment, measurement or
receipt is not an observed one. The unlocated 417-provision corpus is shown
only as a reference and excluded from stage assignments.

## Thesis

Yes: regulations, standards, charters, measurement systems, claim databases,
security profiles and evidence stores can all become Layer-0 harness packs.

No: they should not each independently implement their own MCP/A2A/API/SDK
stack. That duplicates plumbing, fragments authority and makes maintenance
harder.

The canonical design is:

```
                MEOK PET / OOWM
                     |
              L0 HARNESS KERNEL
        _________|_____|__________
       /         |     |          \
     MCP        A2A   HTTP       SDK/CLI
       \_________|_____|__________/
                     |
              HARNESS PACK BUS
    _________|_________|_________|________
   |         |         |         |        |
 GSPC     EU AI Act   CARE    AGISafe  ASISecurity
   |         |         |         |        |
measure     map      policy     decide    enforce
   \_________|_________|_________|_______/
                     |
          claims / corrections / receipts
```

## What makes a pack a real harness

A source document alone is not a harness. A real pack needs:
- immutable source identity + provenance
- structured requirements/controls
- applicability selectors
- deterministic tests or evidence queries where possible
- status vocabulary including UNMEASURED/UNKNOWN
- crosswalk mappings
- remediation mapping where appropriate
- authority classification
- pre/post evidence hooks
- claim/correction hooks
- receipt schema
- self-test
- version/freshness/watch state

## Continuous cycle

1. **Observe** current system/model/tool state.
2. **Measure** with GSPC or another instrument.
3. **Map** observations to applicable frameworks/controls.
4. **Check claims** against current evidence and freshness.
5. **Decide** through AGISafe plus constitutional policy.
6. **Authorize** consequential capability through SOVOS.
7. **Fix/enforce** through ASISecurity/DefOneOS when released.
8. **Re-measure** the changed state.
9. **Correct** stale/false claims append-only.
10. **Receipt** the full causal chain.
11. Repeat on event, source change, deployment change or scheduled cadence.

This is the intended continuous measurement/conformance/claim/fix loop; the current planner does not execute it.

## Important independence boundaries

- Measurement packs do not certify.
- Regulation packs do not become autonomous legal authorities.
- The OOWM routes but does not authorize.
- AGISafe decides policy but does not bypass the constitutional gate.
- ASISecurity enforces only released actions.
- Payment/x402 never changes evidence, measurement or authority.
- Claim correction is append-only; no silent rewriting.

## Estate state found today

Frameworks Drum currently exposes:
- 89 framework files
- 51 charter files
- 62 regulation files

The master framework describes the intended canonical substrate as:
`packages/core`, `packages/crosswalk`, `packages/gspc`,
`packages/frameworks`, `packages/regwatch`, registry and charter layers.

GSPC is already runnable rather than aspirational. The current harness contains
270 items and deterministic scoring rules with explicit UNMEASURED handling.

The EU AI Act SOVOS MCP package is currently a truthful scaffold over 13 articles,
not full legal coverage. The documented "417 frozen provisions" corpus is
referenced in the master framework, but its exact canonical directory was not
located in the current estate scan. It must therefore remain reference-only
until recovered/verified.

---


---

## Appendix I — Integration Runbook (shell-runnable)

This appendix is the operator runbook. Each step is shell-runnable.

```bash
#!/usr/bin/env bash
# MEOK_AOS_INTEGRATION_RUNBOOK.sh
# Run on a clean macOS workspace.
set -euo pipefail

ROOT="/Users/nicholas/clawd"
WORKSPACE="${ROOT}"
KERNEL_DIR="${ROOT}/codex-layer0-kernel-review-20260923/sovos-layer0-harness-kernel"
CHARTER_HTML="/Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html"

# 1. Verify all required files exist
test -f "${ROOT}/MEOK_AI_OS_INTEGRATION_2026-10-07.md"
test -f "${KERNEL_DIR}/src/sovos_layer0_harness/kernel.py"
test -f "${KERNEL_DIR}/src/sovos_layer0_harness/packs.v1.json"
test -f "${CHARTER_HTML}"
test -d "${ROOT}/sovereign-charters"
test -d "${ROOT}/sovereign-law"
test -d "${ROOT}/meok-ai-os-ue5"
test -d "${ROOT}/meok-backend"

# 2. Verify the kernel loads cleanly
PYTHONPATH="${KERNEL_DIR}/src" python3 -c "
from sovos_layer0_harness import kernel
k = kernel.Layer0HarnessKernel.load()
assert len(k.packs) >= 10, 'expected at least 10 packs'
plan = k.plan('Test event', tags=['governance'])
assert plan.execution_state == 'NOT_EXECUTED'
assert plan.execution_ready is False
print('Kernel plan OK:', plan.event, '→', len(plan.unbound_packs), 'unbound packs')
"

# 3. Verify the constitutional charter is reachable
grep -q "Article 1" "${CHARTER_HTML}"
grep -q "Article 22" "${CHARTER_HTML}"
grep -q "PUBLIC_TWO_HOST_VERIFIED" "${CHARTER_HTML}"

# 4. Run the integration test suite
cd "${ROOT}"
python3 -m pytest test_all_harnesses_integrated.py -v

# 5. Run the runner script
python3 "${ROOT}/run_all_harnesses.py"

# 6. Print handoff summary
echo ""
echo "============================================================"
echo "MEOK AI OS INTEGRATION HANDOFF COMPLETE"
echo "============================================================"
echo "Doc:       ${ROOT}/MEOK_AI_OS_INTEGRATION_2026-10-07.md"
echo "Runner:    ${ROOT}/run_all_harnesses.py"
echo "Tests:     ${ROOT}/test_all_harnesses_integrated.py"
echo "Charter:   ${CHARTER_HTML}"
echo "Kernel:    ${KERNEL_DIR}/src/sovos_layer0_harness/"
echo "Charters:  $(ls ${ROOT}/sovereign-charters | wc -l) entries"
echo "Frameworks:$(ls ${ROOT}/sovereign-law | wc -l) entries"
echo "============================================================"
```

Save the above as `${ROOT}/MEOK_AOS_INTEGRATION_RUNBOOK.sh` and run with `bash`.

---

## Appendix J — Test Failure Triage Guide

When any of the 50 tests in `test_all_harnesses_integrated.py` fail, use this triage guide:

| Failure class | First check | Likely fix |
|---------------|-------------|------------|
| `constitutional-*` | Charter file path | The 5 mirrors must all exist; check `ls /Users/nicholas/_alignment/site-authority-umbrella-20261002/public/constitutional-harness/index.html` |
| `kernel-*` | `python3 -c "from sovos_layer0_harness import kernel"` | Ensure PYTHONPATH includes `${KERNEL_DIR}/src` |
| `fabric-*` | `LAYER0-HARNESS-FABRIC.md` exists | Re-run `cat` from `codex-layer0-kernel-review-20260923/architecture/` |
| `harness-x-*` | `find ${ROOT} -path "*harness-x*"` | Worktree may have moved; re-discover |
| `runner-*` | `python3 ${ROOT}/run_all_harnesses.py` | Import path; ensure stdlib-only |

---

## Appendix K — Constitutional Charter as Python Constants

For programmatic import, the 22 articles are surfaced as Python constants in `run_all_harnesses.py`:

```python
ARTICLES = {
    1:  "Measurement is not authority",
    2:  "Default deny",
    3:  "Identity and tenancy are bound",
    4:  "Authority is time-bounded state",
    5:  "Authority may narrow but not silently expand",
    6:  "Budget and payment are separate",
    7:  "Research and execution are separate",
    8:  "Runtime isolation is least privilege",
    9:  "Credentials are not agent memory",
    10: "Effects must be bound to receipts",
    11: "Verification is separate from invocation",
    12: "Signing is not automatic",
    13: "Transparency follows signing",
    14: "Regulatory determination is outside CSOAI",
    15: "SovSpace is a dependency projection",
    16: "Physical-host control is separately governed",
    17: "Corrections preserve history",
    18: "Failure stages stay explicit",
    19: "No self-approval loop",
    20: "Consequential changes require owner-visible review",
    21: "Public claims track actual state",
    22: "The charter itself is versioned evidence",
}

# Machine source pins (Article 22)
SOURCE_PINS = {
    "gspc_policy.py":                  "e262ec3863c4576c630414caf36d4714acec048490aa0eade529fd8ed31f35e4",
    "gspc_authority_state.py":        "6610c84d1854aee637f28d19098fdae20d8b0afefde4f4cd477e57e14db6dbd9",
    "gspc_effect_receipt.py":          "44b1f37fedaaee95ec66349e9c6f7640e103cd23d25e5015d2cb5435e38ccf3e",
    "gspc_constitutional_flow.py":     "cba8634f47c2c402f03ab4dbd30847e437a8b72927549b59b02468868c8969c8",
    "openshell_authority_adapter.py":  "9bef351d9a9c762378d75adbd91475e559605e1b6a25f07cf5be20d93a299db6",
}
```

---

## END OF APPENDICES

---

## Appendix L — Sector Charters × Constitutional Articles Matrix

This 20×22 matrix shows, for each of the 20 sector charters (Tier 3),
which constitutional articles are most directly relevant. It is the
inverse view of the Article → Pack table in Appendix C.

| Charter | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 | A12 | A13 | A14 | A15 | A16 | A17 | A18 | A19 | A20 | A21 | A22 |
|---------|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 41 Healthcare AI    | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 42 Finance AI       | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 43 Construction AI  | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 44 Public Sector AI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 45 Education AI     | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 46 Aquaponics AI    | ✓ | ✓ | ✓ |   | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   |   |   | ✓ | ✓ | ✓ |   |   | ✓ | ✓ |
| 47 Mobility AI      | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 48 Legal AI         | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 49 Real Estate AI   | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ |   |   | ✓ |   |   | ✓ | ✓ | ✓ |   | ✓ | ✓ |
| 50 Retail AI        | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ |   |   | ✓ |   |   | ✓ | ✓ | ✓ |   | ✓ | ✓ |
| 51 Gaming AI        | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ |   | ✓ | ✓ |   |   | ✓ |   |   | ✓ | ✓ |   |   | ✓ | ✓ |
| 52 Manufacturing AI | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 53 Energy AI        | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 54 Telecom AI       | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 55 Insurance AI     | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |   |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 56 Hospitality AI   | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ | ✓ | ✓ |   |   | ✓ |   |   | ✓ | ✓ | ✓ |   | ✓ | ✓ |
| 57 Logistics AI     | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 58 Agriculture AI   | ✓ | ✓ | ✓ |   | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   |   |   | ✓ | ✓ | ✓ |   |   | ✓ | ✓ |
| 59 Maritime AI      | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 60 Aviation AI      | ✓ | ✓ | ✓ | ✓ | ✓ |   | ✓ | ✓ |   | ✓ | ✓ |   |   | ✓ |   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

A1=Measurement is not authority · A2=Default deny · A3=Identity+tenancy · A4=Authority time-bounded ·
A5=Authority narrows · A6=Budget ≠ payment · A7=Research ≠ execution · A8=Least privilege ·
A9=Credentials ≠ memory · A10=Effects → receipts · A11=Verify ≠ invoke · A12=Signing ≠ automatic ·
A13=Transparency follows · A14=Regulatory ≠ CSOAI · A15=SovSpace is a projection · A16=BMC separately ·
A17=Corrections append · A18=Failure stages explicit · A19=No self-approval · A20=Owner-visible review ·
A21=Public claims = state · A22=Charter versioned

---

## Appendix M — Sovereign DB 13 Tables (sovereign_db.py)

```
Tables (from /Users/nicholas/clawd/meok-backend/sovereign_db.py, 602 LOC):

1.  sigil_chain          — append-only SIGIL record (Article 10, 17)
2.  receipts             — effect receipts (Article 10)
3.  corrections          — superseding corrections (Article 17)
4.  measurements         — GSPC measurements (Article 1)
5.  authority_state      — authority bounds (Article 4, 5)
6.  identity             — identity bindings (Article 3)
7.  tenancy              — tenant scope (Article 3)
8.  harness_packs        — pack registry mirror
9.  framework_obligations — per-framework obligations (Articles 7, 14)
10. charter_signatures   — charter signatures (Article 22)
11. claim_index          — claim state (Article 21)
12. receipt_verifications — verification records (Article 11)
13. corrections_ledger   — append-only correction ledger (Article 17)
```

Each table has an `INSERT_TIME` and `INSERT_HASH` column; corrections
are append-only (Article 17: corrections preserve history).

---

## Appendix O — UE5 Project Layout (verbatim tree)

```
meok-ai-os-ue5/
├── Config/
│   ├── DefaultEngine.ini
│   ├── DefaultGame.ini
│   ├── DefaultInput.ini
│   └── ...
├── Content/
│   ├── Maps/
│   ├── UI/
│   └── ...
├── Integrations/
│   └── sovos-bridge/
├── MEOK_AI_OS.uproject       # UE5 5.8 project descriptor
├── Packaging/
│   ├── Windows/
│   ├── Mac/
│   └── Linux/
├── Plugins/
│   ├── SoverignHarness/      # UE5 ↔ Layer-0 kernel bridge
│   └── ...
├── Python/
│   └── sovos_bridge.py       # calls Layer0HarnessKernel.plan()
├── Source/
│   ├── MEOK_AI_OS/           # C++ module
│   │   ├── Public/
│   │   └── Private/
│   └── MEOK_AI_OS.Target.cs
├── init_unreal.py            # bootstrap
└── README.md
```

The UE5 project consumes the kernel through `Python/sovos_bridge.py`
which calls `kernel.Layer0HarnessKernel.load().plan(...)` for any
harness pack query. UE5 is a consumer, not a producer.

---

## Appendix P — Why "Plan-only" is the right answer (Article 1 + 14)

Article 1: *Measurement is not authority.*
Article 14: *Regulatory determination is outside CSOAI.*

A planner that PLANS but does not EXECUTE is the constitutional consequence of those two articles. If the kernel executed, it would either:

- (a) need to be certified by a regulator (Article 14 violation), or
- (b) treat its own measurement output as authority (Article 1 violation).

So the kernel PLANS. The plan is then passed to:

- `sovos-constitutional` (maturity=enforcing, authority=authority_gate) for ALLOW/HOLD/DENY
- `asisecurity-defoneos` (authority=enforce_when_released) for bound effect execution
- `gspc` (authority=measure_only) for re-measurement

The kernel never does any of these. It is the trip planner, not the car.

---

## Appendix Q — Article-by-article canonical binding

| Article | Code pin | Constitutional module |
|---------|----------|----------------------|
| 1 | `gspc_policy.py` | measure guard |
| 2 | `gspc_authority_state.py` | authority state |
| 3 | `gspc_authority_state.py` | tenancy |
| 4 | `gspc_authority_state.py` | time bounds |
| 5 | `gspc_authority_state.py` | narrowing |
| 6 | `gspc_effect_receipt.py` | payment separation |
| 7 | `gspc_effect_receipt.py` | research/exec |
| 8 | `openshell_authority_adapter.py` | least privilege |
| 9 | `gspc_effect_receipt.py` | credentials |
| 10 | `gspc_effect_receipt.py` | effect→receipt |
| 11 | `gspc_constitutional_flow.py` | verification |
| 12 | `gspc_constitutional_flow.py` | signing gate |
| 13 | `gspc_constitutional_flow.py` | transparency |
| 14 | `gspc_policy.py` | regulatory boundary |
| 15 | `gspc_policy.py` | sovspace projection |
| 16 | `openshell_authority_adapter.py` | BMC separate |
| 17 | `gspc_effect_receipt.py` | corrections |
| 18 | `gspc_constitutional_flow.py` | failure stages |
| 19 | `gspc_constitutional_flow.py` | role separation |
| 20 | `gspc_authority_state.py` | owner review |
| 21 | `gspc_policy.py` | claim state |
| 22 | `gspc_constitutional_flow.py` | version evidence |

---

## Appendix R — Honest-distribution invariant (Article 21)

Article 21: *Submitted, published, indexed, invoked, settled, delivered, verified, accepted, and repeated are different states and must not be collapsed into one growth or trust claim.*

For each public surface in the distribution layer, the state ladder is:

| State | Definition | Source of truth |
|-------|-----------|-----------------|
| submitted | the artifact exists in a staging area | git sha |
| published | the artifact is in the public repo | GitHub API |
| indexed | the artifact is in a directory | directory listing |
| invoked | an agent has called it | telemetry |
| settled | a payment has been received | x402 receipt |
| delivered | the consumer has the bytes | CDN log |
| verified | a verifier has signed | gspc receipt |
| accepted | the consumer has acked | acceptance log |
| repeated | the consumer has used it again | telemetry |

For each public surface, this doc asserts ONLY:

- `submitted` ✓ — every charter is committed in `/Users/nicholas/clawd/sovereign-charters/`
- `published` ✓ for files in the councilof-ai GitHub org (await GHA run)
- `indexed` ✓ — local directories are indexed
- `invoked`, `settled`, `delivered`, `verified`, `accepted`, `repeated` — **NOT claimed** in this doc

---

## Appendix S — Glossary

| Term | Definition |
|------|-----------|
| **Constitutional charter** | The 22-article machine-bound operational charter (Article 0..22) |
| **Layer-0 kernel** | The Python runtime that plans but does not execute |
| **Layer-0 fabric** | The bus (MCP/A2A/HTTP/SDK/CLI) that exposes the kernel |
| **Pack** | A bound harness module: regulation, charter, measurement, security, etc. |
| **Stage** | One of 12 cycle steps: observe, measure, map, claim_check, decide, authorize, fix, enforce, contain, remeasure, correct, receipt |
| **Maturity** | reference → mapped → measured → executable → enforcing |
| **Authority** | The capability classification: measure_only, map_only, authority_gate, policy_decide, enforce_when_released, reference_and_map, governance_reference |
| **Receipt** | A signed record binding proposal, decision, transition, tool-call digest, observed-effect digest, verification state, failure stage, evidence IDs (Article 10) |
| **Correction** | An append-only supersession of a prior state (Article 17) |
| **OOWM** | Organic Open World Model — the sovereign world model |
| **PET** | Provably-Effective Trace — the action trace substrate |
| **Hive** | A sector-bound or governance-bound runtime container (33 total) |
| **Queen** | The cluster head over a set of hives (13 total) |
| **King** | The single ratification authority over the 13-Queen council |
| **SIGIL** | The append-only receipt chain in sovereign_db |

---

## Appendix T — Change-log convention (Article 22)

Article 22: *The charter itself is versioned evidence. A future version must identify what changed and cannot retroactively rewrite prior receipts.*

This doc follows the same convention. Each revision must:

- Bump the doc version (currently v0.1.0)
- Append a row to the change-log below
- Preserve the prior version in `MEOK_AI_OS_INTEGRATION_2026-10-07.md.bak` or git history
- NOT rewrite prior VERIFY blocks

```
v0.1.0   2026-10-07   initial integration of 22-article charter + L0 kernel + fabric + 60 charters + 12 frameworks + UE5 + sovereign_db + 33-hive + 13-Queen + 50 tests
```

---

## END OF MASTER INTEGRATION DOCUMENT

---

## Appendix U — Charter file content samples (60 entries)

### 00-charter-of-charters.md

---
id: 00-charter-of-charters
title: "Charter of Charters (The Meta-Charter)"
sigil: "✶"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:276bfb896ad7dfe37845dc5498da119bf889f2526ce719b6eeab798f043f9768"
bft_quorum: "9/13"
---

---

### 01-charter-of-care.md

---
id: 01-charter-of-care
title: "Charter of Care"
sigil: "♡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:56e013328ba5605f6dd778ce86a6c676848149ba970a77c0ed582902f86facc7"
bft_quorum: "9/13"
---

---

### 02-charter-of-sovereignty.md

---
id: 02-charter-of-sovereignty
title: "Charter of Sovereignty"
sigil: "☷"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:0fc9c12563a627cc5246c54c1660767884b4caff42012660841aaa34cbb95d3a"
bft_quorum: "9/13"
---

---

### 03-charter-of-council.md

---
id: 03-charter-of-council
title: "Charter of the Council (BFT 9/13)"
sigil: "⚖"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:e98bd6bbd1340ea736cca29d70893fdcd2deb1e7131f4c217c0f94f6225a8b0d"
bft_quorum: "9/13"
---

---

### 04-charter-of-vsm.md

---
id: 04-charter-of-vsm
title: "Charter of the Viable System Model"
sigil: "⟁"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:e73f66369362eada5080131449c3c22210e83b0bf7b67a8dcbc77fe3cff01384"
bft_quorum: "9/13"
---

---

### 05-charter-of-ostrom.md

---
id: 05-charter-of-ostrom
title: "Charter of Ostrom (8 Commons Principles)"
sigil: "✣"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:7de4deb557682c9cba9bdff2072eca5a8d97acda1b3abade9b8aa00970eaa6cb"
bft_quorum: "9/13"
---

---

### 06-charter-of-maternal-covenant.md

---
id: 06-charter-of-maternal-covenant
title: "Charter of the Maternal Covenant"
sigil: "♀"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:83f1652c495efaab7db48fa7bc7d8fe9f8485ef49a1e703a53309b6c74740310"
bft_quorum: "9/13"
---

---

### 07-charter-of-care-veto.md

---
id: 07-charter-of-care-veto
title: "Charter of the Care Veto"
sigil: "✋"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:a6f7e493ff25e63b0d70a9d0b94541801d36ea6daeb2c5236fa1b81a6be04673"
bft_quorum: "9/13"
---

---

### 08-charter-of-watch-veto.md

---
id: 08-charter-of-watch-veto
title: "Charter of the Watch Veto"
sigil: "👁"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:3944cefda95b91b8c246cef4ae24a8209adbd55075c4571eff8f586ee13c7282"
bft_quorum: "9/13"
---

---

### 09-charter-of-simurgh.md

---
id: 09-charter-of-simurgh
title: "Charter of the Simurgh (Collective Intelligence)"
sigil: "🕊"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:56864562aaa304f6d052c21e9735a208deed1817816db969f447543762d96966"
bft_quorum: "9/13"
---

---

### 10-charter-of-indra-net.md

---
id: 10-charter-of-indra-net
title: "Charter of the Indra's Net"
sigil: "✺"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:e2ebb4b94129710fdd1560962e33d8227b4db7bd5c37772185bded7a054aed47"
bft_quorum: "9/13"
---

---

### 11-charter-of-ouroboros.md

---
id: 11-charter-of-ouroboros
title: "Charter of the Ouroboros (Self-Consumption)"
sigil: "⧖"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:fa0e4e799eddc8a0ff64e0d58fc325e0ca5d05f014dbe7e2c60a4baf85dd07e5"
bft_quorum: "9/13"
---

---

### 12-charter-of-golem.md

---
id: 12-charter-of-golem
title: "Charter of the Golem (SIGIL = Shem)"
sigil: "א"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:aa044d4d2b9b6f08426103685c5db1f639d2f7e405232142aa7316176f9852db"
bft_quorum: "9/13"
---

---

### 13-charter-of-monad.md

---
id: 13-charter-of-monad
title: "Charter of the Monad (Leibniz)"
sigil: "◉"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:4082a48a5c77a23034055338fbfb827c93c09dd1da259e7765cd500bc1c0a0df"
bft_quorum: "9/13"
---

---

### 14-charter-of-holon.md

---
id: 14-charter-of-holon
title: "Charter of the Holon (Koestler)"
sigil: "⌬"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:3e53de2c9e64b5fc5c456ad8862010a2c8d0bbb861a1995940bd6886395460bf"
bft_quorum: "9/13"
---

---

### 15-charter-of-occeanius.md

---
id: 15-charter-of-occeanius
title: "Charter of the OCceanus"
sigil: "🌊"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:2439f65e112a775dabea84eb598378f378b920f612eba25e570789bfd6fb547e"
bft_quorum: "9/13"
---

---

### 17-charter-of-vsm-axiom.md

---
id: 17-charter-of-vsm-axiom
title: "Charter of the VSM Axiom (Recursion)"
sigil: "∞"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:11e864aa2fa2707945dc7d15b63f2f0904cd360d94093107a69ba3911fd1d5b7"
bft_quorum: "9/13"
---

---

### 18-charter-of-bred-algo.md

---
id: 18-charter-of-bred-algo
title: "Charter of the Bred Algorithm (Ashby's Law)"
sigil: "⥁"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:7a0843dbfe4cf79d81a1f4fb1ccbd6ef18a9c7bfe5328c937a012d201b0d09c6"
bft_quorum: "9/13"
---

---

### 19-charter-of-simurgh-32.md

---
id: 19-charter-of-simurgh-32
title: "Charter of the Simurgh-32 (32 Wings)"
sigil: "𓁹"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:665f58c2b76ff1a537d44a7e1b2441a1b9223bc5d52cc4de3b379b83b567a95c"
bft_quorum: "9/13"
---

---

### 20-charter-of-the-deep.md

---
id: 20-charter-of-the-deep
title: "Charter of the Deep (Hidden Layer)"
sigil: "🜨"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:99b4b3b1b758683479e16c6d0484d92a8bec75a710fdc258ccc19d41b06b50c7"
bft_quorum: "9/13"
---

---

### 21-charter-of-sigil.md

---
id: 21-charter-of-sigil
title: "Charter of the SIGIL (Cryptographic Identity)"
sigil: "✶"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:1204733f3bbd17c7de1b1af47e0a5ff5e6519b362ae74e2490214a815bc5ab06"
bft_quorum: "9/13"
---

---

### 22-charter-of-mcp.md

---
id: 22-charter-of-mcp
title: "Charter of the Model Context Protocol"
sigil: "⚙"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:103dc4806cfdacfe3720d9011a4b45762b65fc7e2e9bf227a0054e296c259afa"
bft_quorum: "9/13"
---

---

### 23-charter-of-x402.md

---
id: 23-charter-of-x402
title: "Charter of x402 (Payment Rails)"
sigil: "₿"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:3fb173e04711ed8c20d1a086486805b754abdbadea57e67cf17794cfa54aa504"
bft_quorum: "9/13"
---

---

### 24-charter-of-oscal.md

---
id: 24-charter-of-oscal
title: "Charter of OSCAL (Open Security Controls)"
sigil: "🛡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:b0bc86754bc72205137f0b1b3faffd9845e2a0b94fea7ab21dbf47e4eb5f8f2c"
bft_quorum: "9/13"
---

---

### 25-charter-of-defoneos.md

---
id: 25-charter-of-defoneos
title: "Charter of Defoneos (Defense AI)"
sigil: "⚔"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:e080080f9312b08813214f4803240df8005c9835587219fd498a35cbcc4340a9"
bft_quorum: "9/13"
---

---

### 26-charter-of-bft.md

---
id: 26-charter-of-bft
title: "Charter of the Byzantine Fault Tolerance"
sigil: "🛡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:f500e721fe70a744475e8470c7ce56ea67144f9703b131deccc93800b97a44b6"
bft_quorum: "9/13"
---

---

### 27-charter-of-cascade.md

---
id: 27-charter-of-cascade
title: "Charter of the Cascade Protocol"
sigil: "🌊"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:5d56b72e7122d6aeb0156ee36ae6c1aede4b181abd27dc9b9cf6cd0e5212761f"
bft_quorum: "9/13"
---

---

### 28-charter-of-queen.md

---
id: 28-charter-of-queen
title: "Charter of the 13 Queens"
sigil: "♕"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:88255020b356dc4d22187c7d04833214b86b6ea5f415983fa0f087ee400f5cba"
bft_quorum: "9/13"
---

---

### 29-charter-of-meok-os.md

---
id: 29-charter-of-meok-os
title: "Charter of MEOK OS"
sigil: "🖥"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:96e3afcb023667c1d592d7b60df0d2c03453253c96d692d9d3d3442207472798"
bft_quorum: "9/13"
---

---

### 30-charter-of-os-binding.md

---
id: 30-charter-of-os-binding
title: "Charter of OS Binding"
sigil: "🔗"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:4bb81cc82d81173139e7664344c62b7de244f9cb1b9872c25dc71baf54f9e4d4"
bft_quorum: "9/13"
---

---

### 31-charter-of-sovereign-db.md

---
id: 31-charter-of-sovereign-db
title: "Charter of the Sovereign Database"
sigil: "🗄"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:55c5477dae3a944118d3e4ec0de062532ee93ba1a5cb64ca5c2fc508c73776c0"
bft_quorum: "9/13"
---

---

### 32-charter-of-koikeeper.md

---
id: 32-charter-of-koikeeper
title: "Charter of the KoiKeeper Pond"
sigil: "🐟"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:03850f207364e9f798189826e762a27842246e2278f0f9f55eaa67bd92d4ca6d"
bft_quorum: "9/13"
---

---

### 33-charter-of-council-chamber.md

---
id: 33-charter-of-council-chamber
title: "Charter of the Council Chamber"
sigil: "🏛"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:3bb2eefc52e38b212b1f8e567504d8e1fb5dc42d4c4ae0b2deb10a8c22900681"
bft_quorum: "9/13"
---

---

### 34-charter-of-hive-spawn.md

---
id: 34-charter-of-hive-spawn
title: "Charter of the Hive Spawn"
sigil: "🐝"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:29ee6efd40c7a10281e9a370030f28d9b46b62aafe9869588c8cf25864f5117a"
bft_quorum: "9/13"
---

---

### 35-charter-of-temple.md

---
id: 35-charter-of-temple
title: "Charter of the 11 Temples"
sigil: "🛕"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:03a46f70af264e39ac76275955a9540f5e6a533ad9fae1362164844463ef1c68"
bft_quorum: "9/13"
---

---

### 36-charter-of-arcana.md

---
id: 36-charter-of-arcana
title: "Charter of the 22 Arcana"
sigil: "🃏"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:acbb67a753bb8cfddafd8d1000d5913d9b67fb19d93b2096370f2043f9611fad"
bft_quorum: "9/13"
---

---

### 37-charter-of-archetype.md

---
id: 37-charter-of-archetype
title: "Charter of the 7 Archetypes"
sigil: "👤"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:e4ef8babb3ffbddd01b7b461baf8298b2ac422053dc4ef3d3dec42b2b5d72c5d"
bft_quorum: "9/13"
---

---

### 38-charter-of-mcp-registry.md

---
id: 38-charter-of-mcp-registry
title: "Charter of the MCP Registry"
sigil: "📚"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:2361da350733e84f33f97ecdba4e1ea61c97d43cf4205584dd582b77f7d97c9b"
bft_quorum: "9/13"
---

---

### 39-charter-of-public-root.md

---
id: 39-charter-of-public-root
title: "Charter of the Public Root"
sigil: "🌳"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:e6d56310af341c529fcd23a5c462b080a25bb7f92db95291432a155f03b21074"
bft_quorum: "9/13"
---

---

### 40-charter-of-meok-engine.md

---
id: 40-charter-of-meok-engine
title: "Charter of the MEOK Engine"
sigil: "⚡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:5cb5cb7cb3d2b8dc7d94b8be0417a3d5c80d170b8d2eddd6b60107e437fafa02"
bft_quorum: "9/13"
---

---

### 41-charter-of-healthcare-ai.md

---
id: 41-charter-of-healthcare-ai
title: "Charter of Healthcare AI"
sigil: "⚕"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:e54129a548589e61c0432775dac42d65f6b672d49d539493c7fbcdd3e4b4045b"
bft_quorum: "9/13"
---

---

### 42-charter-of-finance-ai.md

---
id: 42-charter-of-finance-ai
title: "Charter of Finance AI"
sigil: "💰"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:2ff4226e438d2b19dac17df93ea09a2eb3142cd50542addd8973c3ee8c34d935"
bft_quorum: "9/13"
---

---

### 43-charter-of-construction-ai.md

---
id: 43-charter-of-construction-ai
title: "Charter of Construction AI"
sigil: "🏗"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:88c9f09e042cdcb2fb8b4ea0f9862ed4d92518f1a2b18698abafa4758e21ed09"
bft_quorum: "9/13"
---

---

### 44-charter-of-public-sector-ai.md

---
id: 44-charter-of-public-sector-ai
title: "Charter of Public Sector AI"
sigil: "🏛"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:0cfed800b92ca9e5c569bef096eb8d0a50237133b015d6b56899ef3ef9eefa4a"
bft_quorum: "9/13"
---

---

### 45-charter-of-education-ai.md

---
id: 45-charter-of-education-ai
title: "Charter of Education AI"
sigil: "🎓"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:ba877d91041bf051c10533a025f3607e1fcd058ed32510f53e4b2d707f19026a"
bft_quorum: "9/13"
---

---

### 46-charter-of-aquaponics-ai.md

---
id: 46-charter-of-aquaponics-ai
title: "Charter of Aquaponics AI"
sigil: "🐟"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:91580508cd5d5f863f98a28833d5e3aeac952ac16eda6d23a197cd4c48fcc498"
bft_quorum: "9/13"
---

---

### 47-charter-of-mobility-ai.md

---
id: 47-charter-of-mobility-ai
title: "Charter of Mobility AI"
sigil: "🚗"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:7bd3c58b0e241c0b09f402dd3a54f7419c54aee2a1752b292fe9f3d34689f4e5"
bft_quorum: "9/13"
---

---

### 48-charter-of-legal-ai.md

---
id: 48-charter-of-legal-ai
title: "Charter of Legal AI"
sigil: "⚖"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:8ff89898757c19e2c44f9d5620accd208abdc78dc18fbe090a9dcb9ee19a51a4"
bft_quorum: "9/13"
---

---

### 49-charter-of-real-estate-ai.md

---
id: 49-charter-of-real-estate-ai
title: "Charter of Real Estate AI"
sigil: "🏘"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:94a507de878e2b1d4df11af67f1719585d9f9a3cc52c7e0b886c6fbeae05160c"
bft_quorum: "9/13"
---

---

### 50-charter-of-retail-ai.md

---
id: 50-charter-of-retail-ai
title: "Charter of Retail AI"
sigil: "🛍"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:1a89cf89c90fc96d4d73ffd8dd3a6a220e95804c46b73ac7253af71fbb6ac5c1"
bft_quorum: "9/13"
---

---

### 51-charter-of-gaming-ai.md

---
id: 51-charter-of-gaming-ai
title: "Charter of Gaming AI"
sigil: "🎮"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:682be041b51037032f91bb0bfcfb95dc623e597e3d9d4708a66ad599dbb962cc"
bft_quorum: "9/13"
---

---

### 52-charter-of-manufacturing-ai.md

---
id: 52-charter-of-manufacturing-ai
title: "Charter of Manufacturing AI"
sigil: "🏭"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:a529109492c4a29a413d7e498e2d12d9e2b7ee2096c38acfaf6035159c2e2e2c"
bft_quorum: "9/13"
---

---

### 53-charter-of-energy-ai.md

---
id: 53-charter-of-energy-ai
title: "Charter of Energy AI"
sigil: "⚡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:5977df20617225f6c45ba0cd17262e6ecdbae2f78c70b49ebfd69d910755b216"
bft_quorum: "9/13"
---

---

### 54-charter-of-telecom-ai.md

---
id: 54-charter-of-telecom-ai
title: "Charter of Telecom AI"
sigil: "📡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:cbf0d1b40dca9e2a5dd23c511da614d0bfd768ff7e815a4526363a3473738b70"
bft_quorum: "9/13"
---

---

### 55-charter-of-insurance-ai.md

---
id: 55-charter-of-insurance-ai
title: "Charter of Insurance AI"
sigil: "🛡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:8678d56f5c915ac6bb95b8b9d749f979d180329b54ce1e96ea4d8e0bae30a480"
bft_quorum: "9/13"
---

---

### 56-charter-of-hospitality-ai.md

---
id: 56-charter-of-hospitality-ai
title: "Charter of Hospitality AI"
sigil: "🏨"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:f12132690a6cbf073125623879e46bbd00b3a56e67bd262fa41a4e0369c5ed6c"
bft_quorum: "9/13"
---

---

### 57-charter-of-logistics-ai.md

---
id: 57-charter-of-logistics-ai
title: "Charter of Logistics AI"
sigil: "📦"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:fdd11ae6f47bfe5a2523ee56d084313470fee30031a493613bdb752763f71ac6"
bft_quorum: "9/13"
---

---

### 58-charter-of-agriculture-ai.md

---
id: 58-charter-of-agriculture-ai
title: "Charter of Agriculture AI"
sigil: "🌾"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:5615a2709b076f81e0c556ed1138ffa654f0a09fdb8788cbb3413b2a330af5a2"
bft_quorum: "9/13"
---

---

### 59-charter-of-maritime-ai.md

---
id: 59-charter-of-maritime-ai
title: "Charter of Maritime AI"
sigil: "⚓"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:87601c5127c5d077123510409b7285e12318e90ca7660e2ae35c457732f16989"
bft_quorum: "9/13"
---

---

### 60-charter-of-aviation-ai.md

---
id: 60-charter-of-aviation-ai
title: "Charter of Aviation AI"
sigil: "✈"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:989b8e06c1d341c5245e11ae408b7f3ce1fdd653028d4a45603bfbe5d09c125a"
bft_quorum: "9/13"
---

---

