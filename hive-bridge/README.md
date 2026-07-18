# hive-bridge — the owned browser the hives drive

**Why this exists.** Almost every recurring blocker in the empire is the same wall: an agent can build anything but can't take the *last* action because it's behind an authenticated web UI it doesn't own. The Kimi WebBridge extension was meant to be that hand, but it disconnects and can't be woken from the CLI. This is our own, always-on replacement — no third-party extension, no flaky session transfer.

**What it is.** A persistent, headed Chrome on a **dedicated profile** (`~/.meok-browser-profile`) that you log into **once** (Lovable, Vercel, Stripe, GitHub, Google). [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) wraps it as an MCP service at `http://127.0.0.1:8931/mcp`. The hives call it like any other SOV3 tool.

**Why a dedicated profile (not your real Chrome).** Chrome 136+ blocks `--remote-debugging-port` on the default profile by design, and sharing the profile causes lock contention. A separate profile is isolated, survives restarts, and — crucially — keeps the **Supabase/Lovable JWT in on-disk localStorage** valid (its refresh loop writes the rotated token back), which is exactly what the cookie-copy approach couldn't do.

## Setup (one time)
```bash
cd ~/clawd/hive-bridge
npm install                      # engine (done)
./login.sh                       # YOU log into Lovable/Vercel/Stripe/GitHub/Google, then close
cp com.meok.hivebridge.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.meok.hivebridge.plist   # always-on
```

## Run manually
```bash
./start.sh                       # singleton-guarded; MCP at http://127.0.0.1:8931/mcp
```

## Wire the hives
```json
{ "mcpServers": { "owned-browser": { "url": "http://127.0.0.1:8931/mcp" } } }
```

## Keep sessions warm (cron, every 4h)
```
0 */4 * * * /Users/nicholas/clawd/hive-bridge/keepalive.sh
```

## What it dissolves (10 of the 30 blockers — the AUTHENTICATED-UI class)
Lovable→GitHub export · Vercel domain reattach + `/api 403` lift + csoai.org alias · Stripe live flip / products / webhook · GitHub repo create · mcp-publisher device-flow login · IndexNow `.well-known` uploads. Once logged in, agents drive all of these.

## Files
- `start.sh` — singleton-guarded launcher (atomic mkdir lock; no restart-storm)
- `login.sh` — one-time headed login to the SaaS
- `keepalive.sh` — session warm-keeper + re-auth alarm
- `com.meok.hivebridge.plist` — launchd KeepAlive supervisor
