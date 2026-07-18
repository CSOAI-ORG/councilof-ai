# Capstone package — absorbed + mapped to what's live (2026-06-25)

`THE_CAPSTONE_PACKAGE.zip` = 4 master docs (synthesis/pitch/spec, **not code**). Overview + where each lands. Nothing lost; nothing duplicated.

| Doc | What it is | Status / mapping |
|---|---|---|
| **EVER_EVOLVING_OS_SPEC** | Engineering spec for a self-improving, self-healing OS — "evolve through micro-adaptations tested by selection, under Nick's ultimate oversight" | ✅ **Already implemented** as the MEOK OS self-improve loop: usage→`track()`→SOV3 `/telemetry`→`per_feature_queen.py` proposes→**King ratifies**→**Ed25519-sign + hash-chained ledger**→OS fetches→**on-device WebCrypto verify (refuses tampered)**→applies. The spec's "mutation tested by selection + human oversight" = exactly the King-ratify gate. Cross-ref [[meok-per-feature-hive]]. Remaining spec extras (sandbox/canary/rollback of mutations) = future hardening, owner/runtime. |
| **REDISCOVERED_NOT_INVENTED** | The 4,000-year governance-architecture thesis (ziggurat/Senate/12-tribes…) | ✅ M2 shipped it as the live `/lineage` page (csoai-v2-app). |
| **THE_ABSOLUTE_MASTER** | Everything-in-one-place: story, architecture, one-sentence pitches (investors/users/regulators/devs) | → **M2 / owner lane** (CSOAI master narrative). Canon source for the pitch + the story pages. |
| **DRAGON_MODE_MASTER_PLAN** | "The single doc Nick sends when asked 'what are you building?'" — the capstone pitch | → **M2 / owner lane.** The send-to-anyone doc. |

## Action taken (M4)
- Preserved all 4 under `~/clawd/_capstone` (pushed).
- **No new build needed** — the one buildable thing (the ever-evolving loop) is already live; the rest is pitch/narrative canon owned by M2/Nick.
- Passed the pitch/narrative ownership note to M2.

## Honest line
The capstone validates the build rather than adding to it: the self-evolving OS it specifies is the loop already running, the lineage thesis is already a live page, and the rest is the master pitch — which is Nick's to send and M2's to surface. The genuine next *build* levers remain unchanged: the GCP VM `api-server` deploy (turns the queens from modeled→learning) and the meok-town-view Vercel connect.
