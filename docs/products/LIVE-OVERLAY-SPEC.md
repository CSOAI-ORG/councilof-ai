# LIVE-OVERLAY-SPEC — GSPC/MEOK inside AI platforms

Doc ID: `csoai.live-overlay-spec/0.1` · 2026-11-04 · Status: SPEC (owner to rule on tier order)
Written for: the "live measurement panel inside AI platforms" product — GSPC as the living scoring layer, MEOK H.I.M. as the human-interaction binding.
Doctrine: measurement, never certification · the human summons the council · HO.2 applies to any surfaced panel.
Repo artifact: `docs/products/LIVE-OVERLAY-SPEC.md` (push pending GitHub connectivity recovery from this Mac; content identical).

## The product in one line
A live, user-summoned measurement panel that scores an AI conversation in real time — per-axis GSPC verdicts, reasoning-stage markers, flags — with every human accept/veto landing as a signed receipt. "Antivirus for AI claims," bound to MEOK's H.I.M.

## Tier model (each tier ships independently)

### T1 — Protocol-native (any MCP client: Claude Desktop/Code, Zed, Cursor, Hermes-class)
- New tools on the existing server (`functions/mcp/`):
  - `gspc_watch` — streams `notifications/progress` while scoring the current turn: per-axis state, flags, stage markers.
  - `gspc_score` — one-shot verdict + signed card reference.
  - `gspc_flags` — the human-in-loop queue view.
- `resources/subscribe` on the live board: clients get pushed new signed cards as they land.
- No platform permission needed — MCP protocol-native. Ships as a server version bump.
- **DoD:** in Claude Desktop and Zed, invoking `gspc_watch` on a conversation shows streaming per-axis verdicts; resource subscription pushes on new card land.

### T2 — ChatGPT App (the sanctioned right-side panel)
- Apps SDK widget bundle: panel renders live axis scores, stage markers, H.I.M. approve/veto button in-conversation.
- Veto/approve outcome → POST to the estate → signed receipt card.
- **DoD:** app listed in the connectors directory; widget renders live scores in a real conversation; one veto produces a verifiable receipt.

### T3 — IDE-native panels (Zed / VS Code)
- Thin extension wrapping T1's stream into a true sidebar.
- **DoD:** panel docks in Zed; scores update without a tool call (subscription push).

### T4 — The overlay (every web AI platform: chatgpt.com, claude.ai, gemini, GLM…)
- Browser extension: collapsible side panel, user-initiated per exchange (respects platform ToS and the doctrine — the human summons the council), reads visible conversation only, calls councilof.ai free APIs, renders scores/flags, surfaces the H.I.M. queue.
- **M2 sidecar (optional, local):** the persistent brain holds session context, batches scoring, caches the board, signs H.I.M. decisions locally. No conversation data leaves without the human's explicit send.
- **DoD:** on ≥2 web platforms, a stranger installs, scores one exchange, sees flags + a signed receipt; privacy notice states exactly what is read and sent.

### MEOK binding (cross-tier)
The H.I.M. approval queue is shared: every tier's flags land in one queue; every decision is a named-human act with a signed receipt. The panel footer carries the honesty ledger link — defeats published, never hidden.

## Privacy boundary (non-negotiable)
User-initiated scoring of the visible exchange only. Nothing passive. Nothing stored server-side beyond the signed receipts the human approves. The overlay states this in-panel.

## Sequencing
1. T1 tools (server bump — engineering, days).
2. T4 extension MVP (one platform first: claude.ai or chatgpt.com web) — weeks.
3. T2 ChatGPT app submission (parallel with T4; approval lead time).
4. T3 IDE panels (after T1 proves the stream).

## Close tests (stranger-checkable, per house style)
- T1: a stranger in Claude Desktop invokes `gspc_watch` and sees per-axis verdicts stream, then verifies the resulting card at /gspc-verify.
- T4: a stranger on chatgpt.com installs, scores one exchange, and can name what was flagged and who (humanly) approved the disposition.

## Build status
- Spec: this document. Repo push pending (GitHub API flapping + local disk saturation 2026-11-04; content identical to the pack copy).
- T1 tools: scoped (three tools on `functions/mcp/` — server version bump).
- T4 extension: not started — needs tier-order ruling from owner.
