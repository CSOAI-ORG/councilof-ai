# SOV33³ END-USER LAYER — SPEC
**What the person actually touches, mapped to the real component underneath, each tagged honestly.**
_Written 2026-07-11. Ground, not invention. Every RUNNING tag below was VERIFIED BY RUNNING this session (stdout in §Appendix) or by a live MCP call logged in SOV33_STATE_CONSOLIDATION_2026-07-11.md._

Tag legend (binding honesty register):
- **RUNNING** — executed in-window with matching stdout, or returned by a live server call.
- **DESIGNED** — code/asset exists on disk, NOT wired to a live server (spec, deployable, not verified live here).
- **STUB** — placeholder / hardcoded / transparent heuristic; NOT the trained or signed real thing.
- **CATALOG-ONLY** — advertised in the capability catalog / `--list` help, NOT a served endpoint.

---

## Headline (the only sanctioned pitch)
> **A sovereign, governed AI OS where your companion is yours — compliant, auditable.**

NOT "AI economy solved". NOT AGI. NOT consciousness-literal. Intelligence is borrowed from base
models; the estate governs, routes, signs, and remembers — it does not "think for itself".

---

## Component map

| # | End-user surface | 1-line what-it-is | Real underlying component | Tag |
|---|------------------|-------------------|---------------------------|-----|
| 1 | **Hatch** (onboarding) | Drop one signed line into any site/host and it gains a portable, self-owned AI-OS | `meok-os-deploy/api/hatch.js` + `hatch-demo.html` (A2A card + MCP endpoint + Letta `.af` + Layer-0 Ed25519 sig) | **DESIGNED** (edge artifact + demo page on disk; live `os.meok.ai` deploy not verified from here) |
| 2 | **AI character** (companion) | Pick one of 24 companions; it greets you, has a care style and a lifecycle stage | `meok/core/character_catalog.py` (24 companions) + `character_emergence.py` (6-stage), wired by `sov33_companion_layer.py` | Catalog **DESIGNED** (not server-wired) → now reachable via the **RUNNING** governed adapter `sov33_companion_layer.py` |
| 3 | **MCP cards** | Each estate tool shown as a tappable card (name, args, run) | Live MCP surface on `:3101` (catalog figure ~313 methods); toolmap verifies a subset live | Method surface **RUNNING** (subset verified); the **card UX is DESIGNED** |
| 4 | **AI passport** | An agent gets a registered, verifiable identity | `register_agent` MCP method | **RUNNING** — LIVE, needs `name` + `capabilities`; the **Ed25519 attestation is catalog-described, NOT tested** this session |
| 5 | **Human passport** | You get a cryptographic tier (founder-build vs public-sandbox) — never biometric | `sov33_identity.py` | **RUNNING** (verified: founder=build, public=sandbox, biometric=False) |
| 6 | **Compliance passport** | An Article-50 (EU AI Act) transparency passport for a deployment | `issue_article50_passport` | **CATALOG-ONLY** — advertised, not a served endpoint |
| 7 | **User-memory** | Your companion remembers across sessions/surfaces | `get_memory_stats` MCP method (**17,088 episodes**) | **RUNNING** (returned by live MCP call) |
| 8 | **SovSpace inner/outer** | A 3D sovereign digital-twin world you move through | `meok-os-deploy/sovspace3d.html` (Three.js `three@0.160.0`); Cesium 3D-tiles + UE5.4 view | **DESIGNED** — the on-disk 3D file is Three.js-only (no Cesium found in it); Cesium + UE = spec |
| 9 | **Free / paid tier** | Free = works offline & sovereign; Paid = online federation | Tier model (§5 of state-consolidation) | Model defined; free=**OFFLINE-SOVEREIGN**, paid=**ONLINE-FEDERATION** |

---

## Per-component detail

### 1. Hatch (onboarding) — **DESIGNED**
- **What the user does:** pastes one line (`hatch: 'https://os.meok.ai/api/hatch?name=Aria&archetype=owl'`); the page fetches a signed JSON artifact and mounts an AI-OS (dock, memory namespaced to the Hatch fingerprint).
- **Real component:** `meok-os-deploy/api/hatch.js` — a Vercel-style handler that fuses four things that live apart today into ONE offline-verifiable signed artifact: an A2A Agent Card (identity), an MCP endpoint (tools), a Letta `.af` state (persona+memory), and the MEOK Layer-0 Ed25519 sovereign signature (the differentiator vs Sigstore/AGNTCY keyless CA).
- **Honest limits:** **weights are NOT embedded** — "AI inside the container" means the *mind* (persona/memory/policy/identity/tool-contract) is inside; the *model* is any pluggable body (host model via MCP, or on-device Ollama/llamafile). The ArkForge live trust score is **env-gated** — with `MEOK_AI_URL` unset it degrades to `tier: unverified` locally, and the identity is still Ed25519-signed. On-disk code and demo page exist; the live `os.meok.ai` deployment is **not verified from this session** — hence DESIGNED, not RUNNING.

### 2. AI character / companion — catalog **DESIGNED**, adapter **RUNNING**
- **What the user does:** chooses a companion (e.g. River, supporter care-style); it responds and advances through a 6-stage lifecycle (🐣 Hatching → …).
- **Real component:** `meok/core/character_catalog.py` holds **24 companions** (confirmed, with VAD/CPM/RAG markers); `character_emergence.py` holds the 6-stage lifecycle. On their own these are **DESIGNED** (not wired to a live server).
- **Now wired:** `sov33_companion_layer.py` is a **RUNNING** governed adapter — every companion turn flows **identity-tier → care-floor (0.95) → SIGIL** before any reply. Verified this session: a benign turn passed (care=0.97, stage "🐣 Hatching", SIGIL emitted); a manipulative input was **care-floor VETOed** (care=0.07 < 0.95).
- **Honest STUBs inside the adapter:** `care_score()` is a **transparent heuristic, NOT the trained care scorer**; the `care_pattern` governance planet is consulted for its reliability (strong, conf 0.80, `needs_engineered_features`) but no NN score is fabricated. SIGIL here is a **sha256 hash-chain, NOT the Ed25519 L5 chain** (that lives in `sov33.py`, which needs `oci`). Any sensing is **VAD/PAD geometry, never biometric identity** — the biometric surface (`jarvis_emotional`, `mirror_mode`) is **quarantined OFF by default** (verified: blocked at `CONSENT_REQUIRED=False`, runs only with explicit consent).

### 3. MCP cards — surface **RUNNING**, card UX **DESIGNED**
- **What the user would do:** browse estate tools as tappable cards.
- **Real component:** the live MCP surface on `:3101`. The catalog advertises a large method count (~313 in catalog copy — treat count as catalog-figure, not a verified live total). The verified toolmap (2026-07-11) shows **4 methods ran clean** (`sovereign_health_check`, `sovereign_rundown`, `sovereign_ingest_run*`, `vault_stats`), **8 real-but-need-args**, and 7 advertised names not resolvable under the guessed name.
- **Honest limit:** the **card UX** (rendering each method as a user-facing card) is **DESIGNED**. Method names in the catalog do not always match the server — probe schema, never call a mutating method with no args to "test" it.

### 4. AI passport — **RUNNING** (Ed25519 NOT tested)
- **What it is:** an agent registers and gets a verifiable identity.
- **Real component:** `register_agent` — **LIVE** via MCP; requires `name` + `capabilities`.
- **Honest limit:** the doc describes Ed25519 registration, but the **Ed25519 signature path was NOT tested** this session — treat the crypto as catalog-described until a live signed registration is verified.

### 5. Human passport — **RUNNING**
- **What it is:** a person is placed in a cryptographic tier — `SOV33_FOUNDER_BUILD` (authenticated, full authority) or `SOV3_PUBLIC_SANDBOX` (public, no build).
- **Real component:** `sov33_identity.py`. Verified: correct founder secret → `build=True`; wrong secret / no secret → public sandbox, `build=False`.
- **Legal line (binding):** identity is **CRYPTOGRAPHIC (secret + device), NEVER biometric** — no face/voice matching (EU AI Act Art.9 / GDPR special-category is out of scope by design). The founder secret is verified by **constant-time hash compare**; only a salted SHA-256 digest lives on disk, raw secret never stored/logged/committed. Owner-gated actions (**money / DNS / secrets / charter-amend**) stay `False` **even for the founder** — human + BFT still required.

### 6. Compliance passport — **CATALOG-ONLY**
- **What it would be:** an EU AI Act **Article 50** transparency passport issued for a deployment.
- **Real component:** `issue_article50_passport` — appears in the capability catalog / `sov33 --list` help but is **NOT a served endpoint**. (`sov33.py` also exposes an `article50` *audit* capability that shells to `bin/article50_compliance.py` — that is an audit run, not the passport-issuing service.) Do not present passport issuance as available.

### 7. User-memory — **RUNNING**
- **What it is:** persistent memory so a companion recalls prior interactions across surfaces.
- **Real component:** `get_memory_stats` — **RUNNING** via live MCP call, reporting **17,088 episodes**. Memory is namespaced to the Hatch fingerprint (per hatch-demo).

### 8. SovSpace inner/outer — **DESIGNED**
- **What it would be:** a 3D sovereign digital-twin world (inner "J-Space" / outer "World" / "Agents" faces) the user moves through — the world-simulation layer SOV33³ governs.
- **Real component:** `meok-os-deploy/sovspace3d.html` — a browser 3D scene using **Three.js (`three@0.160.0`)**. **Honest correction:** no Cesium reference was found in that file (it is Three.js-only); the **Cesium 3D-tiles geospatial view and the UE5.4 (Lumen/Nanite) render are DESIGNED**, not built here.
- **Honest limit:** SovSpace scale/coverage figures (region %, treasury £, MCP/test counts, 24/7 network) are **aspirational/marketing** unless verified against the live tree — apply the same RUNNING-vs-DESIGNED split.

### 9. Free / paid tier — model defined
- **FREE = OFFLINE-SOVEREIGN** — the offline half of the sovereign sandwich: local base models, SIGIL-signed, works with no network.
- **PAID = ONLINE-FEDERATION** — the online half: cloud ensemble + the MCP mesh (federation).
- Maps to the identity tiers in §5: public users get the sovereign sandbox; the federation is the paid, online surface.

---

## Governance beneath the surface (why "governed" is honest, not decoration)
Every end-user action rides the estate's routing + trust math:
- **Small model wins its LANE (local + cost); open-ended escalates to the large center.** A cheap local checker handles what it is reliable at; genuinely open-ended or divergent cases escalate upward — this is a **cost + reliability** routing rule, NOT a capability-multiplier claim.
- **Defer-to-escalate, not majority-vote.** `sov33_escalate.py` (live cloud path DESIGNED here — `oci` SDK unavailable) runs a cheap checker + a strong checker: **agree → trust cheap; disagree → escalate to strong, never average correlated votes.**
- **Effective-independent-votes** (`sov33_effective_votes.py`, **RUNNING**): agreement is discounted by measured error-correlation ρ=0.76 via `N_eff = N/(1+(N−1)ρ)` plus `agreement_confidence`. Verified: at ρ=0.76, ~5 raw agreeing checkers ≈ ~1.3 effective votes → escalate; the fix is **diverse lineages, not more judges**.
- **Queen → sub-hive topology** (`sov33_queen_hives.py`, **RUNNING** demo): a **governance topology (hierarchical consensus), NOT a hive-mind and NOT a consciousness claim.** The Queen arbitrates on evidence quality (N_eff), does not re-decide substance; every cross-hive ruling is SIGIL-signed.
- **The 3-OWEM triangle is a GOVERNANCE TOPOLOGY — NOT 3× capability and NOT 3× tokens.**

---

## Authority note (BINDING — do not violate in any user-facing copy)
- **ALLOWED:** "interoperable-with", "compliant-with", "rides the open standards (A2A, MCP, Letta `.af`, AGNTCY/OASF)".
- **FORBIDDEN:** anything that **implies backing, endorsement, partnership, Series-A, or investment** by any named party. Interoperability and compliance are claims about *standards conformance*, never about *who backs us*.
- Keep out of investor copy: "Bitcoin anchor", "consciousness 0.775", "AI economy solved", any AGI framing. These are labels/mythos, not literal capabilities.

---

## Appendix — verification this session (VERIFY BY RUNNING)
Run env: `export SOV33_SIGIL_DIR=$TMPDIR/sov33_sigil`, `sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')`.
- `sov33_identity.py` → founder build=True / public sandbox=False, biometric=False. **RUNS.**
- `sov33_effective_votes.py` → ρ=0.76 table, all WEAK_ESCALATE up to N=20; ρ=0.2 → TRUST from N=3. **RUNS.**
- `sov33_companion_layer.py` → 24 companions; benign turn allowed (care=0.97), manipulative VETOed (care=0.07), biometric blocked at consent=OFF then runs with consent. **RUNS.**
- `sov33_queen_hives.py` → 10 sub-hives, local BFT + cross-hive SIGIL-signed arbitration (ruling POOL_B, N_eff=2.667). **RUNS.**
- `sov33_escalate.py` → **NOT runnable here** (`oci` SDK missing) — live cloud defer-to-escalate path is DESIGNED/env-blocked; its trust math is the RUNNING `effective_votes`.
- Live-MCP-verified (prior session, per state-consolidation): `register_agent`, `get_memory_stats` (17,088 episodes), `sovereign_health_check`, `vault_stats`.
