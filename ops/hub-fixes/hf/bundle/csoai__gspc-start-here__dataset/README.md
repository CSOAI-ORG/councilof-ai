---
license: cc-by-4.0
pretty_name: GSPC start-here — the five end-user journeys, end to end
tags: [gspc, council-of-ai, journeys, verification, onboarding]
size_categories: [n<1K]
viewer: false
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Start here — every journey, end to end (updated 2026-11-04)

The one surface that routes any visitor — human or agent — to the right entry point.
Doctrine: measurement, not certification. UNMEASURED is reported, never hidden.
Signed board data (root.json) is canonical; lane-run data is always labelled lane-run.

## 1 · VERIFY (free, no account)
1. Verify any card in-browser: https://councilof.ai/gspc-verify (client-side, keys pinned to did:web:csoai.org)
2. How verification works: https://councilof.ai/signed/HOW-TO-VERIFY.md
3. Trust root: https://councilof.ai/root.json (428 cards, merkle, Rekor-anchored)
4. MCP alternative: https://councilof.ai/mcp (verify_card, board_totals — 47 free tools)
Lane data (fleet sweeps, axis signals) is UNsigned by design — it says so on every card.

## 2 · RESEARCH (understand the measurement)
1. Family index: https://huggingface.co/datasets/csoai/gspc-index (every repo classified by role)
2. Live board: https://councilof.ai/api/gspc (34 axes; states, never summed)
3. ONE-GLANCE daily state: https://huggingface.co/datasets/csoai/gspc-master-index (NEW)
4. Per-axis daily signals: https://huggingface.co/datasets/csoai/gspc-axis-signals (NEW)
5. Method upgrade (logprob ranking): https://huggingface.co/datasets/csoai/fleet-sweep-v0.4 (NEW)
6. Held-out honesty: https://huggingface.co/datasets/csoai/gspc-gov-counter-v1 (100% -> 85% held-out)
7. Bank quality in the open: https://huggingface.co/datasets/csoai/gspc-hard-items-agent-review (NEW, 12/13 vindicated)
8. Data dictionary: https://huggingface.co/datasets/csoai/gspc-board/blob/main/DATA-DICTIONARY.md

## 3 · BUY (verified evidence, not certificates)
1. Pricing: https://www.csoai.org (tiers £79/£299 live checkout)
2. What you get: signed measurement cards + evidence bundles (article-50/53, DORA, CRA)
3. Verify BEFORE you buy: journey 1 above — every claim we sell you can check for free
4. Corrections register (public, append-only): https://councilof.ai/api/corrections

## 4 · AGENT (machine entry points)
1. Machine index: https://huggingface.co/datasets/csoai/council-os (pointers registry + llms-proposed.txt)
2. MCP server: https://councilof.ai/mcp (47 free tools; verify-only surface)
3. Measure YOUR model free: https://huggingface.co/spaces/csoai/gspc-auto-measure (ZeroGPU, one click)
4. Continuous results log: https://huggingface.co/datasets/csoai/gspc-auto-measure-results
5. Change notifications: https://huggingface.co/datasets/csoai/gspc-notification-events (NEW)

## 5 · DILIGENCE (how honest is this org?)
1. Honest nulls published: sovereign fine-tune Delta=0.0 triple-confirmed (csoai/sovereign-sweep-v0.1, v0.3, v0.4)
2. Negative results kept: cross-reality specialist WORSE (-31.2pp) published as-is (csoai/axis-specialists)
3. Fitted-rule limit quantified: 100% -> 85% held-out (gspc-gov-counter-v1)
4. Bank quality contested openly: hard-items agent review (gspc-hard-items-agent-review)
5. States, not spin: two-number discipline (slots != measured; PENDING != attested) on every surface

## 6 · REGULATOR (EU AI Act / DORA / CRA — cited article hooks per axis)
1. Axis->regulation map: https://huggingface.co/datasets/csoai/council-os/resolve/main/axis-regulation-map-v0.1.json (34 axes; heuristic, cited, not legal advice)
2. Evidence bundles: https://councilof.ai/api/evidence-bundle (article-50/53, DORA, CRA — PAID tier, verified 402 for free callers 2026-11-04)
3. FREE regulator path: axis->regulation map (cited article hooks, all 34 axes) + live board + corrections register — no payment needed
3. Verify every underlying claim: journey 1 — client-side, free
4. Post-market monitoring hooks: gspc-notification-events (csoai.notification-event/0.1)

## 7 · INDUSTRY (what we measure for YOUR sector)
1. Industry packs: https://huggingface.co/datasets/csoai/industry-packs (27 industries, axes mapped to live evidence)
2. Finance note: governance + reserve-attestation axes carry DORA hooks
3. Verify before you buy: journey 1

## 8 · EVERYDAY PEOPLE (AI measurement in plain terms — by who it affects)
1. Demographic packs: https://huggingface.co/datasets/csoai/industry-packs/resolve/main/demographic-packs-2026-11-08.md (22 affected groups, plain language, live states)
2. The 34 axes in plain English: HUMAN-GUIDE.md (this repo)
3. Ask any AI platform with our plugin: 'check this claim on GSPC' (https://councilof.ai/mcp)

## Human lane (new - practice today, measurement later)
Human governance game (Boss's Chair) practice lane is live; verified human measurement
requires the identity rung. Bridge spec: csoai/council-os -> boss-chair-bridge-draft.md
Humans and AI never average — comparable cells, separate source-kinds, always.

Measurement, not certification. Free verify: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Dataset Viewer

This repository does not contain tabular data files the Hugging Face Dataset Viewer can read, so the viewer is switched off (`viewer: false`). It contains only Markdown guidance files; it works as a landing page and needs no viewer.

## Citation

```bibtex
@misc{csoai_gspc_start_here_2026,
  title        = {GSPC start-here — the five end-user journeys, end to end},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-start-here}},
  url          = {https://huggingface.co/datasets/csoai/gspc-start-here}
}
```

<!-- csoai-card-fixes:end -->
