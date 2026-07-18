# 🧠 How SOV33 knows its own tooling — the fix for "AI doesn't know its new tools" (2026-07-12)

**Nick's insight:** most AI, when a new capability ships, has *no idea it exists* — the tool list is
frozen at training time. This very session proved it (I fumbled a "new browser tool"). Here's how SOV33
is built to be different, and what shipped today in `_alignment/sovereign_merge_kit/sov33.py`.

## Why models don't know their new tools
A model's knowledge of "what I can do" comes from **training data + whatever is in its context window**.
A tool added after the cutoff is in *neither* — so the model literally can't know about it. Fine-tuning to
teach each new tool doesn't scale (retrain per tool) and is always behind.

## The fix: the tool-model is DISCOVERED AT RUNTIME, not trained
Three moving parts, all live:

1. **Runtime discovery (reflection + live registry).** `self_manifest()` reflects over the module for every
   `capability_*` function AND queries the running MCP server (`:3101 tools/list`). A capability added
   seconds ago — or an MCP tool registered on the live server — is in the manifest on the **next** `ask()`.
   VERIFIED: add `capability_browser_drive` at runtime → it appears immediately, zero retrain, zero hardcode.
2. **Context injection at inference.** `ask()` now short-circuits any self-query ("what can you do / what
   tools / are you aware of your tools") straight to the **live** manifest — the answer is always current,
   never a stale docstring. (Next step: also prepend a compact manifest into `self.core.process`'s system
   prompt so the *reasoning* — not just the router — is grounded in current tooling.)
3. **Self-description as a first-class capability.** Registered under `self` / `tools` / `capabilities` /
   `what-can-you-do` → `capability_self_awareness()` renders `native_count + mcp_live_count` and the names.

## The principle (portable to any agent, not just SOV33)
> **Never let the tool list live only in weights.** Keep a runtime-introspectable capability registry;
> read it fresh each turn (reflection for local tools, a `tools/list` call for the live server); inject a
> compact form into the model's context. Then "awareness of new tooling" is a property of the *harness*,
> not something you retrain into the model. New tool → known instantly.

## Shipped today
- `sov33.py`: `self_manifest()` + `capability_self_awareness()` + `ask()` self-awareness short-circuit +
  registry entries (`self`/`tools`/`capabilities`/`what-can-you-do`). Parses clean; mechanism verified
  standalone (full import needs `oci`, present on the SOV33 host where `:3101` runs).
- **Remaining (small):** inject the manifest summary into `self.core.process`'s system prompt so the brain
  reasons with current tooling in-context (the deepest form of self-awareness); auto-emit a signed SIGIL
  hop when the toolset changes (a provable "capability diff" ledger).
