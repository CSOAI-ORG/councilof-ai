# NATS Server Setup — Nick Clicks (10 min)

NATS is the message broker used by SOV3 + MCP bridge for agent-to-agent async tasks. If it's not running, SOV3 falls back to synchronous calls (slower) or in-process only.

## Quick start (already-installed)

```bash
# Check if NATS is installed
which nats-server || brew install nats-server

# Start in foreground (logs visible)
nats-server -p 4222 -m 8222

# Or daemon mode (background, logs to file)
nats-server -p 4222 -m 8222 \
  --log /tmp/nats-server.log \
  --pid /tmp/nats-server.pid \
  -DV &
```

Verify:
```bash
curl http://localhost:8222/varz | python3 -m json.tool | head -10
nats-server --version
```

Both should return successfully. The `-m 8222` flag enables the HTTP monitoring endpoint.

## Production-style launchd (Mac, auto-start on login)

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/io.nats.server.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.nats.server</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/nats-server</string>
    <string>-p</string><string>4222</string>
    <string>-m</string><string>8222</string>
    <string>-DV</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key>
  <string>/tmp/nats-server.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/nats-server.err</string>
</dict>
</plist>
PLIST

launchctl unload ~/Library/LaunchAgents/io.nats.server.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/io.nats.server.plist

# Verify it's running
launchctl list | grep nats
```

## SOV3 + NATS connection

SOV3 reads `NATS_URL` env var (defaults to `nats://localhost:4222`). After NATS is up:

```bash
# In SOV3 .env or shell
export NATS_URL=nats://localhost:4222

# Restart SOV3 to pick it up
cd ~/clawd/sovereign-temple && ./run-local.sh stop && ./run-local.sh
```

## Smoke test (proves NATS + SOV3 are talking)

```bash
# Subscribe to all subjects in another terminal
nats-server --version  # quick sanity
nats sub ">"  # if nats CLI installed (brew install nats-io/nats-tools/nats)

# In SOV3, trigger an event that should publish to NATS
curl http://localhost:3101/health  # SOV3 alive
# Then check NATS for messages
curl http://localhost:8222/connz | python3 -m json.tool | head -20
```

If `total_connections` > 0 → SOV3 is connected to NATS.

## Why this matters for revenue

NATS isn't directly revenue-critical, but it unblocks:
1. **Async agent workflows** in SOV3 (better customer-demo for £499 Defence tier)
2. **MCP bridge fan-out** — running multiple compliance MCPs in parallel for one assessment
3. **Real-time webhook event publishing** — when a Stripe `checkout.session.completed` fires, the welcome-email handler can also publish to NATS so other systems (CRM, Slack notifier) can react

Order of priority: this is medium-not-high. Get NATS running this week but it won't block first £1 of revenue.

## Time budget

- Install: 1 min
- Start (launchd): 5 min
- SOV3 env + restart: 2 min
- Smoke test: 2 min

**Total: 10 min Nick clicks**
