# Research-Sweep Triage — what's usable vs unverifiable (2026-07-14)
_A web-enabled sibling agent ran a deep sweep (MCP-stateless, BFT papers, provenance, hydro-neuromorphic, dcg/AgentGuard).
This triages it HONESTLY: I have no browser here, so I CANNOT verify the paper citations — they are LEADS to check,
not facts to cite. I split into: BUILT (in-lane, shippable now), VERIFY-BEFORE-CITE (real-sounding, unconfirmed),
and MYTH-LAYER (aesthetic only, zero evidentiary weight)._

## BUILT THIS SESSION (concrete, in my lane)
- **sov33_action_guard.py** — the destructive-action veto (concrete form of care=0). Motivated by dcg/AgentGuard.
  KEY LESSON TAKEN: FAIL-CLOSED for catastrophic ops (dcg's fail-OPEN default caused a real incident — a denial
  treated as an error, command ran anyway). SOV33 inverts: deny is authoritative; uncertainty on a catastrophic
  pattern = BLOCK. Distinguishes reference (grep 'rm -rf') from execution (rm -rf /). Smoke 13/13. Mirrors the
  care-gate's existing fail-safe-breach rule. This is the single most directly config-relevant item in the sweep.

## VERIFY-BEFORE-CITE (real-sounding leads; I could NOT confirm — no browser)
- MCP goes STATELESS 28-July-2026 (SEP-2575 removes handshake, SEP-2567 removes session-id). IF TRUE this is a
  genuine Layer-0 upgrade: DRUM heartbeat-quorum goes horizontal (no session-pinning = a real dropout is a real
  fault, not a routing artefact); SIGIL becomes an explicit signed handle passed on every call (inline tamper-
  evident chain, not a side-log); veto can gate on Mcp-Method headers pre-body-parse (object-capability security).
  ACTION: owner/CC must verify against the actual MCP spec before we build to it. Do NOT cite the SEP numbers as
  fact until confirmed. (This aligns with our own MEOK MCP-stateless note from an earlier session — consistent.)
- BFT/consensus papers (SAC arXiv:2605.09076 (F+1)-robustness; Free-MAD consensus-free debate; anti-collusion
  interpretability). IF real, these are the math backbone our escalate/decorrelation layer references informally.
  ACTION: verify arXiv ids before citing; the CONCEPTS (receiver-side filtering, consensus-free aggregation,
  measure-correlation) already match our design — good corroboration, but ids unconfirmed.
- Watermark impossibility (single-technique fails by theorem -> multi-layer mandate) — matches MEOK's model-agnostic
  provenance pitch. Concept sound; citation unverified.
- Hydro-neuromorphic / iontronic (van Roij/Kamsma fluidic memristors) — this is the SAME literature line as the
  MEOK pyontronics work already on disk (Kamsma Chaos 2025). CONSISTENT with what we have; treat as corroboration,
  verify new arXiv ids before citing.

## MYTH-LAYER ONLY (zero evidentiary weight — naming/doc flavour at most)
- "Kingdom of Words" grimoire, Sophia/Demiurge chart, Hermeticism/369 numerology, antique plates — all AI-generated
  or historical aesthetics. Usable ONLY as evocative internal naming (e.g. "verify-don't-assert", care-vs-control
  framing for the Maternal Covenant). NEVER as source or evidence. The 3-6-9 / EZ-water / Orch-OR-consciousness
  claims are contested/pseudoscience — keep OUT of any investor or technical copy.

## NET
One real deliverable built (action_guard, fail-closed veto). The rest is leads to VERIFY (MCP-stateless + BFT papers
are the high-value ones — but need a browser to confirm before we build to or cite them) and myth-layer to keep out
of anything factual. Held the honesty line: another agent's unverified citations are leads, not facts.
