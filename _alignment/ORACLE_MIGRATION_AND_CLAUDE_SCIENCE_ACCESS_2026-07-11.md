# 🛰️ Oracle migration + Claude Science access (SSH + browser) — M4, 2026-07-11

Three asks handled honestly. TL;DR: **Oracle heavy-migration is capacity-blocked (nothing to migrate
onto right now); the auto-grab is fixed and armed. SSH access is set up. The browser is account-level —
shareable without handing anything over.**

## 1. "Move all we can to Oracle" — HONEST STATE
**Blocker: OCI London has no A1 capacity, any size.** Verified 2026-07-11: `VM.Standard.A1.Flex` at
**1 OCPU/6 GB, 2/12, AND 4/24 all return "Out of host capacity"** across AD-1/AD-2 (AD-3 not authorized
for this tenancy). There is **no Oracle box available to move heavy workloads onto** right now.

What Oracle actually offers us today:
- **`sov33-owem-a1` (24 GB ARM)** — the real target. **Capacity-blocked.** Auto-retry now FIXED + armed
  (was dead — pointed at a deleted scratchpad venv). Rebuilt durable venv `~/clawd/_oci/venv`, new
  `launch_a1_slice.py` grabs the **smallest slice that lands** (1/6 → 2/12 → 4/24), cron `*/15` runs
  `a1_retry.sh` and self-removes once secured. So the moment London frees capacity, we get the box.
- **`sov33-owem-micro` (145.241.232.16, 1 GB RAM)** — RUNNING but **~full** (106 MB free; `sov33-emergence`
  owns it). Not safe to pile more on without OOMing emergence. Leave it.
- **GCP VMs** — dead (billing closed); nothing to migrate *from* them (down, unreachable). Their services
  get rebuilt on the A1 when it lands, not moved.

**What CANNOT move to Oracle at all** (stays on Mac by nature): anything needing MPS/GPU or the 192 GB
unified memory (local model inference, the J-space torch probe), and SOV3 `:3101` (postgres + NNs) until
there's a ≥8 GB box. **Migration plan when the A1 lands:** SOV3 backend + postgres → A1; lightweight
always-on crons (hermes-* scans, sigil emits) → A1; keep GPU/MPS work on the Mac.

➡️ **Action for Nick (optional, unblocks immediately):** OCI London free-tier ARM is chronically
capacity-starved. Either wait for the armed retry, or (if you want it now) a **paid** A1/GPU shape or a
different home region would provision instantly — that's a billing decision only you can make.

## 2. Claude Science ↔ Oracle over SSH — SET UP ✅
- `~/.ssh/config` now has: **`Host oracle-micro sov33-owem-micro` → 145.241.232.16, user `ubuntu`,
  key `~/.ssh/id_ed25519`**. Verified: `ssh oracle-micro` connects.
- Any Claude lane on **this Mac** (Claude Science included) shares `~/.ssh` → **`ssh oracle-micro` just
  works for it too**, no extra setup.
- When the A1 lands, `launch_a1_slice.py` prints its OCID; add its public IP as `Host oracle-a1` the same way.

## 3. Give Claude Science the browser via MCP — IT'S ACCOUNT-LEVEL (no hand-over needed) ✅
The claude-in-chrome MCP connects to browsers on **your Anthropic account**, not to one chat session.
Confirmed: **"Browser 1"** `deviceId adec2d1f-9f40-4075-a9f9-10c1275cbe91` (macOS, local) is visible
account-wide. So Claude Science does **not** need my connection — it needs, in its own tab:
1. Enable the **Claude-in-Chrome connector** for that session (the one thing only the user can toggle,
   in that tab's connector settings).
2. `list_connected_browsers` → `select_browser` with `adec2d1f-9f40-4075-a9f9-10c1275cbe91`.
3. It now drives the **same Browser 1** — navigate/read_page/computer, same as this lane.
(If a *headless, fully programmatic* browser is wanted instead — no shared Chrome window — stand up a
standalone Playwright MCP server; that's a separate server both lanes add, not a connection transfer.)

## Keystone (shared, for other lanes)
Set: `ORACLE_MICRO_SSH=ubuntu@145.241.232.16`, `ORACLE_SSH_KEY=~/.ssh/id_ed25519`,
`CLAUDE_BROWSER_DEVICE_ID=adec2d1f-9f40-4075-a9f9-10c1275cbe91`, `OCI_A1_RETRY=armed (a1_retry.sh */15)`.
