# 🐉 SOV SPACE — CORRECTED ARCHITECTURE — 28 Jun 2026
## M2 Mac = persistent 24/7 Sov Space node. THIS machine (M4 MacBook Air) = build client.

**Status:** Architecture corrected. Bridge needs to be on M2, not on this M4 MacBook Air.

---

## The correct architecture (per your `Documents/CLAUDE.md`)

| Machine | Role | What runs here |
|---|---|---|
| **M2 Mac** (24/7 node) | Persistent Sov Space | Ollama (14 models) + 13 sovereign MCPs + UE5→SOV3 bridge + flywheel consumer + iOK IoT |
| **MacBook Air M4** (THIS machine) | Main laptop | iOK Farm work, daily ops, SOV3 substrate consumer |
| **M4 MacBook Pro** (workshop, TV) | Dragon Mode heavy compute | Big jobs, training, heavy inference |
| **GCP VM `meok-backend`** | Core hive | SOV3 mesh, keystone, EU gateway, keystone (5 services) |

**TL;DR:** The M2 Mac is the persistent Sov Space runtime. The M4 MacBook Air (this machine) is where I (JEEVES) live. The M4 Pro is for Dragon Mode. The VM is the core hive.

---

## What I built on the wrong machine

When you said "M2 Mac" earlier, I assumed this M4 MacBook Air was the M2. It's not.

The **UE5 → SOV3 bridge** is running on this M4 MacBook Air at `http://localhost:8765` — but production Sov Space wants it on the M2.

**The fix:** the bridge code is portable Python. It can be:
- (a) Copied to M2 via `scp` + run with `nohup`/`supervisord`
- (b) Run as a `LaunchAgent` on M2 (like the 5 sovereign-tunnel + flywheel + d9-pond LaunchAgents already there)
- (c) Deployed via the `m2-bridge` / `m2-vm-bridge` tunnels we already have registered in MEOK WORM

**Best option:** LaunchAgent on M2, restart=KeepAlive, mirrors the 5 other tunnels + d9-pond + flywheel pattern.

---

## The 5 things that need to be on M2 (not M4)

1. **`ue5_to_sov3_bridge.py`** — the bridge that serves the 13 MCPs to UE5
2. **The 13 sovereign MCPs** — `~/clawd/mcp-marketplace/meok-sovereign-*-mcp/`
3. **Ollama sovereign LLM registry** — already on M2 ✓
4. **iOK Farm IoT bridge** — already on M2 (d9-pond-auto plist)
5. **The flywheel consumer** — already on M2 (flywheel_forever daemon, 735+ cycles)

---

## Deployment plan to M2

```bash
# 1. SSH to M2
ssh m2-mac

# 2. Copy bridge
scp ue5_to_sov3_bridge.py m2-mac:~/clawd/ue5_bridge/

# 3. Copy 13 sovereign MCPs
scp -r mcp-marketplace/meok-sovereign-*/ m2-mac:~/clawd/mcp-marketplace/

# 4. Install deps
ssh m2-mac "pip install fastapi httpx uvicorn"

# 5. Create LaunchAgent
cat > ~/Library/LaunchAgents/com.csoai.sov-space-bridge.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key><string>com.csoai.sov-space-bridge</string>
    <key>ProgramArguments</key>
    <array>
      <string>/opt/homebrew/bin/python3.11</string>
      <string>/Users/meok/ue5_bridge/ue5_to_sov3_bridge.py</string>
    </array>
    <key>KeepAlive</key><true/>
    <key>RunAtLoad</key><true/>
    <key>EnvironmentVariables</key>
    <dict>
      <key>PYTHONPATH</key>
      <string>/Users/meok/mcp-marketplace:/Users/meok/mcp-marketplace/meok-sovereign-passport-mcp:...</string>
    </dict>
  </dict>
</plist>
EOF

# 6. Load
launchctl load ~/Library/LaunchAgents/com.csoai.sov-space-bridge.plist

# 7. Verify
curl http://m2-mac:8765/health
```

---

## What stays on M4 (this machine)

- The 13 sovereign MCP source code (the repo)
- The UE5 build client (`SovTown.uproject`)
- SOV3 substrate consumer (the local agent that calls 13 MCPs via the bridge)
- 332 content files (EAT-1 through EAT-7 seals)
- All git history

---

## UE5 → Sov Space (the actual flow)

```
+--------------------+    HTTP    +----------------------+    HTTP    +-------------------+
|  M4 MacBook Air    | ---------> |  M2 Mac              | ---------> |  UE5 client       |
|  (this machine)    |            |  (24/7 Sov Space)    |            |  (Cesium+MetaHuman|
|  SOV3 consumer     |            |  - Ollama (14 models)|            |   in SovTown)     |
|  SBT substrate     |            |  - 13 sovereign MCPs |            |  on M4 Pro        |
+--------------------+            |  - UE5 bridge :8765  |            |  (workshop)       |
                                  |  - iOK IoT           |            +-------------------+
                                  |  - Flywheel consumer |
                                  +----------------------+
                                              |
                                              v
                                  +----------------------+
                                  |  GCP VM meok-backend |
                                  |  - SOV3 mesh :3101   |
                                  |  - keystone :8888    |
                                  |  - EU gateway :8889  |
                                  +----------------------+
```

The **M2 Mac is the persistent Sov Space runtime**. The **M4 MacBook Air is the build + consumer client**. The **M4 Pro is the heavy compute**. The **GCP VM is the core hive**.

---

## The (corrected) SOV SPACE = M2 Mac

**Files I created that should live on M2:**
- `ue5_to_sov3_bridge.py` (the bridge — portable)
- `meok-sovereign-*-mcp/` (the 13 MCPs — portable)
- `restart_with_worm.sh` (the launch script — portable)

**Files that should stay on M4 (this machine):**
- `SovTown.uproject` (UE5 client)
- 332 content files (EAT seals)
- 13 git commits (the source of truth)
- `~/clawd/` workspace

---

## What I can do RIGHT NOW (no human key needed)

✅ Commit the corrected architecture spec
✅ Build a `deploy_to_m2.sh` script that you can run when SSH'd to M2
✅ Add the deploy script + corrected arch doc to the next seal

🚫 **WALL** (still blocked):
- SSH access to M2 (it's the 24/7 node, not always logged in)
- `scp` requires SSH key on M2 authorized for `~/clawd/ue5_bridge/` writes
- LaunchAgent creation on M2

But the architecture is now clear. The bridge can move. The MCPs can move. The doctrine stays.

🐉💎🔥

**The M2 Mac is Sov Space. The M4 MacBook Air is me. The M4 Pro is Dragon Mode. The VM is the hive.**
