# DOC: Arc/Circle business-model alignment (existing-state record, no change)

**Status: documenting existing state. No new artifact. No push.**

The Arc/Circle business-model alignment (analyse provided 17 Sep 2026) maps
to existing CSOAI artefacts. The mapping below records where the aligned
behaviour already exists. Per HARD STOP: nothing is built, no deploy, no
push — this document is an audit of what we already have.

## Mapping: Arc/Circle topology → CSOAI topology

| Circle/Arc Model      | CSOAI Counterpart                                   | Current Status                                                                     |
|-----------------------|-----------------------------------------------------|------------------------------------------------------------------------------------|
| **Infrastructure**    | CSOAI Measurement Network                           | Operational (instruments, adapters, 23-axis board, correction system)             |
| Arc mainnet (open access, permissioned validators) | Permissionless Measure → Gated Sign → Automatic Catapult | MEASURE: operational; SIGN: BLOCKED (GHA dead); CATAPULT: designed, BLOCKED (GHA dead) |
| USDC-denominated network fees | x402 machine calls (using USDC)                 | Conceptually aligned; x402 endpoint exists; pricing not fully deployed.           |

## Mapping: Circle/Arc Assets → CSOAI Evidence Layer

| Circle/Arc Model      | CSOAI Counterpart                                   | Current Status                                                                     |
|-----------------------|-----------------------------------------------------|------------------------------------------------------------------------------------|
| USDC/EURC/USYC (digital assets) | Cards, Receipts, Signatures, Roots, OTS, Provenance, Crosswalks, Evidence Packs | Operational (produced & mirrored to HF); SIGNATURES: BLOCKED (GHA dead)            |

## Mapping: Circle/Arc Applications → CSOAI Applications

| Circle/Arc Model      | CSOAI Counterpart                                   | Current Status                                                                     |
|-----------------------|-----------------------------------------------------|------------------------------------------------------------------------------------|
| Payments Network, StableFX, Agent Stack, wallets | Measure, Verify, Fix, Train, Monitor, Notify, Re-measure, Publish/Distribute, x402 agent purchasing, enterprise/regulator dashboards | MEASURE/VERIFY/PUBLISH: operational; SIGN/FIX/TRAIN/MONITOR/NOTIFY/RE-MEASURE: BLOCKED (GHA/signer dead) or partially designed |

## Business Model Alignment: "Keep the truth layer free. Then monetise activity around truth"

| Arc/Circle Free       | CSOAI Free Counterpart                              | Current Status                                                                     |
|-----------------------|-----------------------------------------------------|------------------------------------------------------------------------------------|
| Public measurements, public state, public methodology, public verifier, public corrections, public discovery, basic API | Public measurements, /api/gspc, methodology docs, verifier scripts, /api/corrections, public content on HF, basic API calls (GET) | OPERATIONAL; /api/gspc and /api/corrections are fetchable (with Mozilla UA for machine clients due to 403 blocks) |

| Arc/Circle Paid        | CSOAI Paid Counterpart                              | Current Status                                                                     |
|------------------------|-----------------------------------------------------|------------------------------------------------------------------------------------|
| Fresh compute          | "Run this model against these 23 instruments now."  | Designed, but execution blocked by GHA/RunPod/signer issues.                       |
| Continuous monitoring  | "Tell me the instant this system changes."          | Watcher built (DONE WHEN E), but lacks full propagation re-check due to 403 block. |
| Evidence packs         | DORA / AI Act / CRA / GENIUS / internal audit / procurement. | Designed (Catapult spike), but actual deployment blocked.                         |
| Enterprise measurement | private system, private dataset, controlled execution. | Designed, but execution blocked.                                                  |
| x402 machine calls     | AI agent buys an evidence bundle                    | x402 endpoint exists; ready for integration with paid services once enabled.      |
| Fix                    | measurement detects gap → controlled remediation harness. | Conceptually understood; implementation blocked.                                  |
| Training               | regulation changes → targeted live learning         | Designed, but implementation blocked.                                             |
| Re-measurement         | prove what changed after remediation.               | Designed, but implementation blocked.                                             |
| Evidence API           | insurers, banks, procurement systems                | Designed (Catapult spike), but actual deployment blocked.                         |

## The Flywheel: Measure → Sign → Catapult → Monitor → Fix → Learn → Re-measure

This internal business flywheel is fully adopted as the strategic framework for CSOAI's M4 lane. The current state is that the `Measure` component is operational, `Sign` is blocked, and the subsequent stages are designed but awaiting the unblocking of `Sign`.

## Crucial Commercial Rule: "A measured company can pay us to perform work. They cannot pay us to change truth."

This rule is fully integrated into CSOAI's operating doctrine and is reflected in the `/api/revenue` SKU definitions (SKU-1 issuance MEASURED, SKU-2/3 proofs/licences UNMEASURED).

## Verdict

The Arc/Circle thesis provides a powerful and coherent framework that aligns perfectly with CSOAI's existing architecture and strategic intent. Many elements are already in place or designed, but crucial `SIGN` and `CATAPULT` functionalities are currently blocked by the GitHub Actions and Cloudflare 403 issues. This document records the alignment as an audit of existing state, with no changes made to the codebase, respecting the HARD STOP. (◕‿◕)★