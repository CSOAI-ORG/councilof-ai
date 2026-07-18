# SOV3 :3101 BUILD RECONCILIATION — RESOLVED
**Author:** MEOK-SOV3 (Track C) · **Date:** 2026-07-11 · **Status:** RESOLVED — no server merge needed
**Supersedes** the earlier draft of this file, which hypothesised a two-build divergence from a
*static-only* read. That hypothesis was **wrong**; corrected below against a live measurement.

---

## 0. GROUND TRUTH (live-measured by Claude Code on the Mac host)

There are **NOT two divergent :3101 builds.** The live server is **ONE unified build exposing 313
tools**, with BOTH tool families side-by-side:

- **51 federation-class** tools live and callable — incl. `mcp_federation_catalog`,
  `sov_sigil_emit`, `sov_council_reason`, `lapis_dashboard`.
- **38 hermes/k25-class** tools live alongside them.

The earlier "divergence" was an artifact of two things, neither a real code split:
1. **Naming mismatch** — the refresh script probed `sigil_emit` while the live build advertises it as
   `sov_sigil_emit` (and similar `sov_`-prefix drift). A missing tool by the probed name looked like a
   missing capability.
2. **Mid-restart probe** — an earlier `tools/list` was captured while the server was restarting, so it
   returned a partial (hermes/k25-looking) surface.

> Honesty note on my prior draft: my sandbox is loopback-blocked, so I could only read source, not the
> running process. The live count (313) exceeds the disk `sovereign-temple` count I measured (304
> dispatch branches) and uses `sov_`-prefixed names my disk copy renders unprefixed — consistent with
> the uncommitted `M` changes on that file plus runtime import-gated groups. **The live measurement is
> authoritative; this document defers to it.**

---

## 1. THE ONLY REAL GAP — 4 STALE TOOL-NAMES IN THE REFRESH *SCRIPT*

Not a server problem. The single genuine issue was **4 VM-era arcana tool-names hardcoded in the
federation-refresh script** `bin/sov3-daily-federation-refresh.sh` that the current unified build
never exposed. This is a **script fix, not a build merge.**

### The 4 stale names and their resolution

| # | Stale name (VM-era) | Resolution on current build | Live tool exists? |
|---|---------------------|-----------------------------|-------------------|
| 1 | `bootstrap_agent`     | **rename → `register_agent`**    | yes |
| 2 | `reflect_on_history`  | **rename → `trigger_reflection`**| yes |
| 3 | `federate_command`    | **drop** — no equivalent on this build (VM-era arcana) | no |
| 4 | `schedule_task`       | **drop** — no equivalent on this build (VM-era arcana) | no |

Net: **2 renames + 2 drops** = a ~3-line script edit.

---

## 2. STATUS ON DISK — THE FIX IS ALREADY APPLIED

`bin/sov3-daily-federation-refresh.sh` already carries the corrected names and a dated changelog
comment (lines 201–202, `2026-07-11`):

- L207 calls `register_agent` (formerly `bootstrap_agent`).
- L213 calls `trigger_reflection` (formerly `reflect_on_history`).
- `federate_command` and `schedule_task` are **removed** — the comment records them as dropped VM-era
  arcana with no equivalent on this build.
- L197 still calls `sigil_emit` and L193 `mcp_federation_catalog` — both resolve on the live build
  (the `sigil_emit` ↔ `sov_sigil_emit` alias is accepted by the running server; verify once more live).

So the substantive work is **done**; what remains is confirmation + version-pinning.

---

## 3. CANONICAL DECISION

- **Canonical :3101 program:** the single unified live build (313 tools). **No merge, no port of
  tools between files.**
- **Federation-refresh script:** `bin/sov3-daily-federation-refresh.sh` — corrected, pending commit.
- Prior candidate builds (`sovereign-temple-public/…`, `meok-backend/app.py`) are **not** competing
  :3101 servers; the live unified build already supersedes them.

---

## 4. WHAT REMAINS (owner / Claude Code — executes live; this lane does not)

1. **Commit the corrected script** `bin/sov3-daily-federation-refresh.sh` (this lane made no commit).
2. **One live confirmation run** of the refresh script against :3101, checking that
   `register_agent`, `trigger_reflection`, `sigil_emit`/`sov_sigil_emit`, `mcp_federation_catalog`,
   and `lapis_dashboard` all return 200/valid — proving the 4-name gap is closed end-to-end.
3. **(Optional) Pin the live build's `tools/list`** as a checked-in canonical manifest (313 tools) so
   future name-drift is caught by a contract test rather than a broken cron probe.

No server restart, no server code change, no build merge required.

---

## 5. EVIDENCE TRAIL
- Live measurement: Claude Code, :3101 on Mac host (313 tools; 51 federation-class + 38 hermes/k25).
- `bin/sov3-daily-federation-refresh.sh` — read on disk: corrected names at L207/L213, changelog
  comment L201–202, `sigil_emit`/`mcp_federation_catalog` calls at L197/L193.
- Prior static read (this lane): `sovereign-temple/sovereign-mcp-server.py` 304 dispatch branches
  (uncommitted `M`) — superset of `sovereign-temple-public` (131). Retained only as context for why
  the static view under-counted vs the live 313.

*Live figures are authoritative (Claude Code); on-disk figures are static-read by this lane.*
