# MEOK Home Agent

A browser can't see your home network — so MEOK Guardian's **WiFi / network safety**
scan runs through this tiny local companion. One file, pure Python standard library
(nothing to `pip install`), **localhost-only**, and it **never phones home**.

## Run it

```bash
curl -O https://os.meok.ai/agent/meok-home-agent.py
python3 meok-home-agent.py
```

Then open **Guardian** in MEOK OS and tap **Scan my network**.

- Serves `http://127.0.0.1:7777/scan` (JSON) and `/health`.
- Print one scan without serving: `python3 meok-home-agent.py --once`
- Different port: `python3 meok-home-agent.py --port 8123`
- Skip port-probing (faster, devices only): request `/scan?noprobe`.

## What it does

1. Reads your OS **ARP table** to enumerate devices on the LAN (IP + MAC).
2. Optionally probes a few **risky ports** (Telnet, FTP, RDP, VNC, SMB) on each device.
3. Computes a plain-English **safety score** (100 = no risky exposure found).
4. **Signs** the report (HMAC-SHA256 with a per-install key minted on first run,
   stored `0600` in `.meok_home_agent.key` next to the script).

## Sovereign by design

- Binds to `127.0.0.1` only — not reachable from outside your machine.
- The report stays on your device. MEOK OS reads it from localhost; nothing is
  uploaded unless **you** choose to share it.
- No dependencies, no telemetry, no account. macOS / Linux / Windows.

## Why a local agent (and not the browser)?

Browser sandboxes deliberately can't enumerate LAN devices or open raw sockets — that
boundary protects you. The honest way to give Guardian real network visibility is a
small program you run and control. That's this.
