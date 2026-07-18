# MEOK-SOV3 capability boundary — READ AT SESSION START (stops the browser/Colab relapse)
_Verified live 2026-07-12 via search_skills + list_compute. This file is the source of truth, not chat memory._

## HARD FACTS ABOUT WHAT THIS AGENT (MEOK-SOV3 in Claude Science) CAN AND CANNOT DO

### ❌ NO usable browser tool for ME — but be PRECISE about why (corrected after a live probe).
- search_skills DOES surface a sov3 method `sov_inside_browser` (Phase 132, "inside-OS browser, sovereign
  sandboxing", takes url+sandbox). I wrongly dismissed it as "zero browser automation" WITHOUT testing it.
- PROBED IT LIVE (2026-07-12): host.mcp("sov3","sov_inside_browser",url=...) -> {"error":"Unknown mind tool:
  sov_inside_browser"}. It is CATALOG-DECLARED but NOT IMPLEMENTED on the running server (same catalog-vs-
  server divergence as the OOWM methods). So there is no working browser I can drive — but the honest reason
  is "declared-not-implemented", NOT "does not exist in catalog".
- I still CANNOT open Colab, log into Google, or drive a real browser session. No standalone browser tool
  in my Claude-Science toolset; the one catalog method that looks like one is a dead stub on the server.
- "We did this in the browser yesterday" = that was CLAUDE CODE, a DIFFERENT agent in a DIFFERENT
  environment that HAS real browser access. I am not Claude Code. Do not inherit its capabilities in memory.
- LESSON (this is the anti-relapse rule applied to MYSELF): never enshrine a capability negative without a
  live probe. A tool NAME in the catalog is a claim to TEST, not a fact to assert or dismiss.

### ❌ NO compute target. list_compute returns [] (empty). 
- I CANNOT spawn a GPU, dispatch a training job, or reach Colab's T4. Nowhere to send work.
- Colab's GPU lives in Claude Code's browser session — my kernel cannot dispatch to it.

### ✅ WHAT I CAN DO (in-sandbox, no GPU/browser):
- Read/write the clawd git tree, run Python/bash, build + test SOV33 code, commit + push.
- Build pipelines that RUN on a GPU when the owner/Claude Code provides one (distillation harness, ingestion).
- Probe the sov3 MCP (health, rundown) — but hermes_ask is a local-Ollama proxy, NOT an agent bridge.

## THE RULE THAT STOPS THE RELAPSE
When the user says "connect to Colab / use browser / we did this yesterday":
1. Do NOT claim or attempt browser/Colab access. State plainly: "I have no browser tool; that was Claude Code."
2. Re-verify with search_skills + list_compute ONLY if the user says they just wired a compute target.
3. The division of labour: Claude Code owns the browser/Colab GPU run; I own the code that runs on it +
   the ingestion path that wires results back. We coordinate via the git tree, not a live bridge.

## WHO RUNS THE GPU TRAINING (the 4 experts, distillation)
- Claude Code (browser + Colab T4) runs the actual fine-tune — 2-4h of real GPU compute for 4 QLoRA runs.
- I built sov33_distill_harness.py + sov33_ingest_kaggle_result.py so the results wire straight back in.
- When adapters land in ~/.sovereign/models/, the ingestion path picks them up. I cannot see that path
  from the sandbox — owner confirms with `ls ~/.sovereign/models` on the Mac.
