---
title: MEOK Hybrid Research Lab
emoji: 🧭
colorFrom: blue
colorTo: green
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: Real process inference and reproducible hybrid tests
---

# MEOK Hybrid Research Lab — v0.2

This replaces the v0.1 invented-output comparator with **actual inference** over the published 980-parameter MEOK process checkpoint. It compares the raw network, its original expiry/simplex constraints, a no-change baseline and a separately implemented exact rule from the known synthetic generator. All public-interface inference runs in the browser. No paid compute, training, weight merging, Cosmos inference or GSPC admission is performed.

## Use it
Load any retained row, inspect the four component outputs, edit the 11 features for an unlabelled custom prediction, run the full 560-row replay, inspect the worst learned error, and export an unsigned hash-bound receipt. Malformed inputs and mismatched artifact hashes are rejected.

The result is deliberately narrow: the exact rule reproduces this known synthetic task to floating-point precision because the generator mechanics and full profile proportions are available. It is not a general world model or proof of real-world predictive performance. Known rules should not be replaced by a less accurate neural approximation.

## Evidence retained in this revision
- `evidence/test-results.json`: 37 functional, integrity, refusal and parity checks.
- `evidence/engine-replay.json`: all 560 features/targets reproduced by the pinned original simulator across 70 episodes.
- `evidence/python-reference.json`: reference Python inference, checked against the JavaScript implementation on every row.
- `evidence/replay.json`: freshly recomputed raw/constrained/persistence/rule metrics, including worst-case failures.
- `evidence/live-mcp.json`: authenticated real tool calls to the **existing** private MEOK MCP runtime. The private runtime was not modified.

These are replays of a previously published test bank, not a new blind evaluation. No statistically independent improvement claim is made.

## Reproduce without training
With Node 22 or later, run `node test.mjs`. To use the interface locally, serve this directory with any static HTTP server, for example `python3 -m http.server 8080`, and open its local address. Vendored assets eliminate model-provider requests. The public HF Space is an online host; inference executes on the visitor's CPU.

## Canonical upstreams
- Model: https://huggingface.co/csoai/meok-process-world-v0 at `90d6aa6c87629b9f4296142ba2019247b51686c4`.
- Dataset: https://huggingface.co/datasets/csoai/meok-process-world-transitions-v0 at `4a522537c9eb1522a3aad1432e9626e72e3a2733`.
- Canonical learned-model source: https://github.com/CSOAI-ORG/councilof-ai/pull/4176; retained source commit is recorded verbatim in `model/SOURCE.json`.
- Generator: `CSOAI-ORG/councilof-ai` at `4070aa6d3140ba10226677840f4873fbedd2467e`, `packages/world-rehearsal/rehearsal/engine.py`.

The original model/dataset LICENSE and NOTICE files are retained in their respective directories. The new browser implementation is MIT licensed.

## MCP and boundaries
See [MCP.md](MCP.md). The existing private Space exposes the pinned predictor and compact evidence-index tool. Authentication belongs in the MCP client's secret store, never this public interface. Adding the Hugging Face discovery plugin does not itself install a private custom server into every AI platform.

The exported records are unsigned. They do not constitute human approval, durable storage, independent observation of a real-world effect, certification, production promotion, or GSPC admission. The failed and nonpromoted Cosmos experiments are unchanged and separate.


## v0.3 research extension

[Open the actual six-checkpoint replay](https://csoai-meok-oowm-hybrid-lab.static.hf.space/research-v03/index.html), [read the new research paper](research-v03/WHITEPAPER.md), or [inspect the evidence](research-v03/ARTIFACTS.json). The added experiment retains an analytically fitted 68-parameter head, two evaluation banks, precision and cache controls, and an eight-question practice pack. It does not change the production model or private MCP runtime. Training ran on the existing authorized M2 CPU; the HF-hosted replay runs on the visitor's CPU. No new paid HF job or GSPC admission.

## 11 November public consolidation

[Open the consolidated release](https://csoai-meok-oowm-hybrid-lab.static.hf.space/release-20261111/index.html) or read [REPORT.md](release-20261111/REPORT.md). This presentation-only improvement clears stale results and guards asynchronous receipt completion. All numerical models, data and research results remain unchanged. The new 18-check actual-UI contract suite passes; the prior exact UI fails its stale-result negative control. Historical reports retain their original scope and dates. Hosted acceptance is recorded separately after publication.
