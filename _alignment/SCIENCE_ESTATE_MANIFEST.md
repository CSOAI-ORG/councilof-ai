# SCIENCE ESTATE MANIFEST — the one map to EVERYTHING (Layer-0 · MCPs · bridges · compute · kit)

Purpose: connect Claude Science to the **whole** sovereign estate, not just the merge-kit. Grounded in a
live 3-sweep inventory (2026-07-15), including the honest gaps. Clone `clawd-workspace` to get ~all of it;
a few pieces need CSOAI-ORG **org** access (flagged). Counts are the *verifiable* ones, not headlines.

## 0. Access model (read first)
- **`clawd-workspace`** (`github.com/CSOAI-ORG/clawd-workspace`, branch `m4-handoff-2026-06-24`) = the one clone
  that carries the kit, Layer-0 defs, the signed OSCAL generator, the sigil, the compute pool, the catalogs,
  the bridge index, and the 6 rescued orphan MCPs. **Start here.**
- **CSOAI-ORG org access** is needed for the ~334 *nested* `*-mcp` repos inside `mcp-marketplace/` (incl. the 22
  bridges) — those are separate private repos; cloning clawd-workspace does NOT bring them. Authorize GitHub for
  the whole `CSOAI-ORG` org and you can clone any of them by name.
- A couple of sigil variants live in `CSOAI-ORG/sovereign-temple` and `CSOAI-ORG/meok-one`.

## 1. The 8-protocol Layer-0 (authoritative: CSOAI_LAYER0_SCORECARD_2026-06-29.md)
| # | Protocol | Where |
|---|---|---|
| P1 | MCP federation | `layer0_federation.py`, `csoai-mcp-catalog.json` |
| P2 | Legacy bridges (22) | `CSOAI_BRIDGE_FAMILY_INDEX.md` → nested `*-bridge-mcp` repos |
| P3 | A2A substrate (20 MCPs) | catalog cluster `a2a-substrate`; `sov333_bridge.py` |
| P4 | x402 payments | mcp-marketplace x402 MCP |
| P5 | SIGIL attestation (Ed25519 hash-chain) | `sovereign_merge_kit/sov33_ed25519_sigil.py`, `meok-sigil/` |
| P6 | OSCAL / FedRAMP (97-component signed pkg) | `mcp-marketplace/oscal-generator-mcp/gen_layer0_package.py` (+ built-in verify) |
| P7 | BFT council | `sovereign_merge_kit/sov33_bft*.py`, `sov33_sac_council.py` |
| P8 | Compliance Passport | `meok-sovereign-aiact-passport-mcp/` |

Key Layer-0 files: `MEOK_LAYER0_TRUE_ONE_2026-06-24.md` (canonical map), `_alignment/MEOK_OS_LAYER0_REGISTRY.json`
(machine registry), `layer0_protocol_catalog.json`, `e2e_layer0_conformance.py` (conformance harness).
**Turn any sandbox into a signed Layer-0 node:** `sovereign_merge_kit/layer0_sandbox_bootstrap.py` (own ephemeral
key, never sees the root key — "the moat travels to the compute").

## 2. Signed OSCAL package (P6) — the assurance artifact
- Generator: `mcp-marketplace/oscal-generator-mcp/gen_layer0_package.py` → builds one OSCAL 1.1.2 Component
  Definition over the fleet, **Ed25519-signs it**, writes `.sig.json` sidecar, then **verifies its own signature**.
- Output: `.../oscal-generator-mcp/layer0_protocol.oscal.json`. SSPs per legacy framework in `.../ssp/`.
- Honest flag: packages **verify offline but are NOT yet externally anchored** (no public Rekor/anchor). Don't
  overclaim "publicly verifiable" — say "offline-verifiable, signed."

## 3. MCP fleet (verifiable numbers)
- Catalog: `csoai-mcp-catalog.json` → **377 entries / 2,129 tools**, clustered (domain-ai 146, other 124,
  framework-regulation 39, bridges 23, a2a-substrate 20, crypto-attestation 13, physical-ot 6, safety-assurance 6).
- Physical fleet: `mcp-marketplace/` (~369 `*-mcp` dirs). Scan: `CSOAI_MCP_ESTATE_SCAN_2026-06-26.md`.
- **Honest count:** ~**369 dirs / 2,129 tools** is the verifiable figure. (352 remote repos, 531 is a headline — don't cite 531 as fact.)
- Registry submission (top 30 → registry.modelcontextprotocol.io): `mcp-marketplace/MCP_REGISTRY_SUBMISSION.json`.

## 4. Legacy bridges (P2) — 22
Index: `CSOAI_BRIDGE_FAMILY_INDEX.md`. The 22: cobol, iso20022, hl7-fhir, as400, sap, oracle, scada, edi, fix,
cics, mqtt, acord, nacha, iso8583, sip, tax, gs1, mismo, dlms, a2a-governance, meok-abci, meok-haulage. Each is
its own `CSOAI-ORG/<name>-bridge-mcp` repo (private except cobol). Pattern: parse→validate→map→govern→attest(Ed25519).
**Rescued this pass:** 6 previously-no-git dirs now in clawd-workspace (meok-sovereign-{,mimo,osint,owem,ue5}-bridge-mcp, optical-care-home-bridge-mcp).

## 5. Compute pool (what Science can actually run on)
- Router: `_compute/sov33_compute.py` — `infer()`/`census()` over **4 backends**: `groq` (70B default; tiers for
  120B/32B), `oci70b` (OCI GenAI, signed via ~/.oci), `ollama` (local small), `mps` (M4 GPU, training only).
- Reality docs: `_compute/COMPUTE_CENSUS_2026-07-11.md`, `_compute/GPU_ACCESS_REALITY_FOR_CLAUDE_SCIENCE_2026-07-11.md`.
- **Always-on shared brain (new):** `sovereign_merge_kit/sov_hermes_service.py` LIVE on the Oracle VM — HTTP `/ask`,
  cloud-routed (NVIDIA 405B → Groq 70B), Ed25519-signed. Reach via SSH tunnel (`HERMES_SHARED_BRAIN.md`).
- Census note: Modal is now AUTHED (the 2026-07-11 doc marking it "dead" is stale).

## 6. The kit + the pre-built Science bundle
- Kit: `_alignment/sovereign_merge_kit/` — **296 .py** (routing/RAG/signing/trinity/distill/train/bridge/service/
  MLX/care-floor/BFT/topology/benchmarks). Entry points in **SCIENCE_CONNECT.md**.
- Pre-assembled handoff: `sovereign_merge_kit/claude_science_bundle_2026-07-14/` + `CLAUDE_SCIENCE_BUNDLE_2026-07-14.md`.

## 7. Master maps (don't re-discover)
`MEOK_MESH_INDEX.md` (whole estate, ~75 dirs, ★canonical per cluster) · `CSOAI_LAYER0_SCORECARD_2026-06-29.md`
(8-protocol truth) · `SOVEREIGN_CONSOLIDATION_MAP_2026-06-25.md` · `MEOK_SESSION_MASTER_2026-06-25.md`.

## 8. Known gaps (honest)
1. ~334 nested `*-mcp` repos need CSOAI-ORG **org** GitHub access (not in clawd-workspace clone).
2. Untracked (not clonable yet): `sovereign_merge_kit/models/sov3_student_adapter/` (trained weights),
   `split_sweep_results.json`. If Science needs the trained adapter, it must be pushed to a weights host (HF) — git isn't the place for weights.
3. OSCAL packages are offline-verifiable but **not externally anchored** yet — the last mile for "publicly provable."

## For T (build our own model)
Serving ≠ building. Serve via §5 (call the brain). **Build** = teacher (405B/70B) writes data → `sovereign_distill.py`
→ QLoRA on free GPU via `sov33_gpu_fire.py` (Colab/Modal). The 113 distilled pairs are the current seed.
