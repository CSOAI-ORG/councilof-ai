# 🐉 M4 CONSUMER-OS + SOV33 LANE — session record for the other lanes (2026-07-12)

Companion to `REMOTE_LANE_ALIGNMENT_2026-07-12.md` (Fable-5 lane). This is what the **consumer-OS /
SOV33 runtime** lane shipped this session — direct-committed to local `main` (this lane can deploy, so
os.meok.ai is LIVE-verified, not bundled). Honest register: "LIVE" = live-verified on os.meok.ai in-browser;
"substrate" = committed + parses/verifies standalone (full sov33 import needs `oci`, present on the host).

## Shipped + LIVE on os.meok.ai (verified in-browser)
| Commit | What |
|---|---|
| `36db60f` | SOV Space `sovspace3d.html`: arcade three.js → **real CesiumJS 1.123** (free path, DEFONEOS engine parity) |
| `9fbfa44` | `character.html` speaks the **DEFONEOS Sovereign/Horus voice** (one signing spine, two markets) |
| `936a597`·`f8ce88` | **Three globes → ONE** Cesium world (universe.html absorbed; earth3d+sovspace3d pinned 1.123; meok-cmd/meok-node contract) |
| `56c6f48` | **Predictive typing** — ghost completion (Tab-accept) from real vocab+history + answer prefetch |
| `e3cdd30` | **Startup consent/awareness onboarding** — signed opt-ins (learn/files/WiFi-mesh-SOV33/presence), Ed25519 via /api/sign VERIFIED on prod |
| `c8c1666` | Dock seat = **emergence being** (globe→MEOK Universe; J-Space=internal reflection) |
| `340ec00` | OS **MCP-card layer** (talk → signed cards fan across the screen, Ed25519-verifiable) |
| `b9284f7`·`29dfb4e` | **UX audit fixes**: mobile launcher was collapsed to 48px (fixed), de-duped chat inputs, a11y keyboard handler, openApp crash-guard, spacing tokens; **shared `meok-reveal.js`** scroll-reveal across all pages |
| `c9e7ce1` | **Epic scroll-world** `world.html` (oso95/scroll-world technique on the LIVE Cesium globe — free, no Higgsfield) + front-door hero |
| (spec) | **Speculative preparation** — draft-on-partial (typing AND voice), "◠ preparing…" indicator, serves warm cache instantly |

## Shipped to the SOV33 substrate (committed, verified standalone)
- `01901ad` **Self-tool-awareness** (`sov33.py` `self_manifest()` + `capability_self_awareness`): SOV33 knows its
  CURRENT tools at runtime (reflection + live MCP `tools/list`), not frozen at training — new tools appear
  on the next `ask()`. Doc: `SOV33_SELF_TOOL_AWARENESS_2026-07-12.md`.
- `d73ab69` **SpeculativeResponder** (`speculative_responder.py`): the small/large OWEM split as a governed
  class — draft-on-partial (tier=fast) → verify-on-send (tier=heavy) → **care-floor 0.95 before emit**;
  reads the live OWEM level from `sov33_owem_emergence`; SIGIL on emit. The server mirror of the client
  speculative prep. Registered `sov33.capability_speculative_respond` (`speculative`/`prepare`).
  Aligns with the Hermes OWEM-emergence substrate (L0→L4) + the Claude-Science OWEM release.

## Alignment + ops
- Routines reconciled to Hermes + Science lanes: `ROUTINES_ALIGNED_HERMES_SCIENCE_2026-07-12.md`
  (SOV3 :3101 keeper=M4 · hermes gateway+:8000=Hermes don't-kill · federation-refresh feeds both).
- Docs realigned to shipped reality (`SOV33_END_USER_LAYER_SPEC` item-8 sovspace3d→Cesium RUNNING; character canon dock-seat reconciliation).

## Colab 4-expert training — RUNNING (kicked off this session)
- `SOV33_FOUR_EXPERT_COLAB.py` had TWO fatal blockers, both fixed: base model `Qwen3.6-4B` (404/nonexistent)
  → `Qwen3-4B`; and the **private-repo clone** fails anonymously on `CSOAI-ORG/clawd-workspace` → switched to
  fetch the ~2MB kit (hosted briefly on os.meok.ai, then removed). Now training on a T4:
  compliance→defense→intuition→voice, ~2-4h → 4 LoRA adapters. **These are the small draft-OWEMs the
  SpeculativeResponder routes to; L0→L1 when they finish.** Defense expert safety-vetted (0 offensive hits).

## Cross-lane notes (absorb these)
- **csoai-org-v2 is SECURE in the deployable copy** (this lane verified): no hardcoded Stripe key
  (`.stripe-bak` uses `process.env.STRIPE_SECRET_KEY`), no guessable admin token (`subscribe` requires
  `ADMIN_TOKEN`), no leads-endpoint hole. The Fable-5 security fix is a bundle-only concern; the live-deployable
  copy needs nothing there.
- **Smithery API key** was in plaintext in `SUBMIT_NOW.md` — redacted here (`6849fcf`); **OWNER: rotate at
  smithery.ai** (still in git history).
- **Pricing conflict** noted: consumer OS = £12.99 Pro / £99 land; csoai-org-v2 = £499/£1,999 enterprise;
  reports cite £199 vs £79. OWNER-GATED — one `pricing.json` must be ratified before any sale test.
- **The one unlock for everyone:** GitHub App write access to `CSOAI-ORG/clawd` — clears the push-403 for
  the bundled lanes AND would have let Colab clone the kit directly.

Honesty: nothing here claims a live third-party sale, PQC, or AGI. Consumer-OS items are browser-verified on
os.meok.ai; substrate items are committed + verified standalone; the Colab run is genuinely executing on a T4.
