# Council City × AgentSociety — Experimental Design Binding Plan

**Date:** 15 August 2026 · Council of AI monorepo
**Status:** DESIGN — for review before implementation

---

## 1. Why this binding

Council City today runs live arena rounds and signs them (board.json + chain.jsonl).
What it cannot yet prove is the **signed-vs-unsigned difference**: whether the signing
spine changes measurable behaviour. AgentSociety v2 (`~/clawd/agentsociety`, Apache-2.0,
commercial folder excluded) is purpose-built for controlled social-science experiments:
SQLite replay, experiment manifests, MCP tool support.

The binding goal: run **controlled experiments** where one arm emits signed
measurement cards and the other arm does not, then measure the difference —
Wilson intervals and McNemar on discordant pairs, the same statistics the
experiment MCP already applies.

## 2. Architecture

```
AgentSociety experiment (Python, SQLite replay)
        │  one city simulation per arm
        ├── Arm A: SIGNED   — each turn wrapped by sigil_inspect.SigilScorer
        │                        → ~/.sovereign/sigil_chain.jsonl
        └── Arm B: UNSIGNED — identical run, no signing hook
        │
        ▼
outcome records (usable n, blocked n, unparsed) per arm
        │
        ▼
meok-sovereign-experiment-mcp  (Wilson 95% CI + McNemar exact)
        │
        ▼
signed analysis JSON (gnn_synthesis.py style, sigil-chained)
```

## 3. What stays firewall-clean

- The experiment measures **the signing layer's behavioural effect** — it does not
  rank or certify any model.
- Arm data feeds analysis only; the estate never trains a champion model on it.
- AgentSociety's `packages/agentsociety/commercial` subtree is NOT imported.

## 4. Implementation steps (sequenced)

1. **Read AgentSociety v2 experiment API** — `agentsociety2` experiment manifest +
   `ExpConfig`; identify the per-turn hook where a SigilScorer can wrap the step.
2. **Write `binding/city_signed_arm.py`** — one experiment, two arms, signing toggle
   passed via env (`SIGN_ARM=1|0`). SQLite replay enabled on both.
3. **Wire outcome records** into the same `{usable_n, blocked, unparsed}` shape the
   Council City board consumes, so results land in the existing arena pipeline.
4. **Run a paired pilot** (e.g. 2×100 turns) on sov-brain-2 (RTX 3090), then read the
   results through the experiment MCP's McNemar tool.
5. **Publish** the signed analysis + honest readout on /experiments.html, following
   the existing "91% fleet agreement + 9% human dissent = measured reality" pattern.

## 5. Honest acceptance gate

The pilot is a success when the experiment MCP returns a McNemar p-value and both
arms' unparsed rates are reported — regardless of which direction the difference
points. A null result (signing changes nothing measurable) is a publishable result;
it would justify keeping the spine as pure rails with zero behavioural tax.

## 6. Dependencies

- `~/clawd/agentsociety` (cloned, Apache-2.0, commercial folder flagged)
- `council-os/sigil_inspect.py` (built + smoke-tested)
- `meok-sovereign-experiment-mcp` (built, 11/11 tests on sov-brain-2)
- GPU lane: sov-brain-2 (RTX 3090) — Mac stays editor-only per estate rule
