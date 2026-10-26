# Council of AI — MiniMax Code plugin

Independent AI-behaviour measurement for MiniMax Code: the live GSPC board, three-state Ed25519 card
verification, artifact sealing, the Council OS surface, and the local harness census.

**Measurement, never certification.** Verification is free at https://councilof.ai/verify

## Install

```bash
./install.sh          # install + validate
./install.sh --verify # validate what is installed, change nothing
```

The source of truth is this directory. `install.sh` copies it into
`~/.minimax/plugins/council-of-ai/`. It lives here, outside the runtime-managed path, because
**the runtime prunes a package it cannot parse** — a prune must never be able to destroy the work.

## Capabilities

| Kind | Names |
|---|---|
| Skills | `gspc`, `council`, `council-os`, `verify-card`, `sign-artifact`, `pack`, `platform-measure` |
| MCP | `gspc` (streamable-http, https://councilof.ai/mcp) · `csoai-governance` (stdio, npx) |
| Hooks | `SessionStart` (live board context) · `UserPromptSubmit` (outward-gate nudge) · `PreToolUse` bash (deny `--admin` merge and check removal; context for outward commands) · `SessionEnd` (session receipt into `PLUGIN_DATA`) |

## Why `agents` is NOT declared — a runtime defect found by dogfooding

Two subagents ship in `agents/` — `measurement-auditor` and `platform-measurer` — but the manifest
does **not** list them.

Measured on **MiniMax Code 3.1.4 (3.1.4.188)** on 2026-10-24:

- With `agents` declared in `.minimax-plugin/plugin.json`, the runtime **rejects the whole package**
  and **deletes the directory** roughly 50 seconds after install.
- With `agents` omitted, the package loads and stays loaded (observed >2 minutes, and through a
  full rescan).
- The runtime's own bundled reference (`app.asar`) states the behaviour: *"The manifest `agents`
  field and Plugin subagents require a MiniMax Code version that includes Plugin subagent support.
  Clients that predate tolerant manifest parsing reject the unknown field with
  `MANIFEST_SCHEMA_INVALID` and the whole package fails to load."*

The prune is silent: no scan diagnostic is emitted, and the parent directory's mtime is restored to
its pre-install value, so it looks like the package never existed.

**Decision:** the package loads without `agents`. It still ships the two subagent definitions, so
they can be declared the moment the runtime tolerates the field. The skills, MCP servers and hooks
are worth far more than an unloadable package.

**To opt in** on a runtime that supports it, add the field back and re-run `./install.sh`:

```json
"agents": ["agents/measurement-auditor.md", "agents/platform-measurer.md"]
```

If the package disappears within a minute, the runtime does not support it — revert.
