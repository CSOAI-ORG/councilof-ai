#!/usr/bin/env python3.11
"""sov_live_substrate.py — LIVE sovereign substrate simulator (real-time).

Runs continuously, updating:
  - 12 General daemons (using real MCP calls)
  - BFT voting rounds (3/5/7 voters)
  - Care floor (16 probes)
  - Sigil chain (Ed25519 every hop)
  - Hive network (33 hives + 8 BIG BRAIM)
  - Substrate health (4D state)

Writes:
  - /Users/nicholas/clawd/sov_competition/live_substrate_state.json (updated every 2s)
  - /Users/nicholas/clawd/sov_competition/live_substrate.html (HTML viewer)
"""
import os
import sys
import time
import json
import hashlib
import threading
from datetime import datetime, timezone
from pathlib import Path

# Add MCP paths
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace")
for name in ["native", "federation", "planning", "oowm",
             "bft-council", "carefloor", "sigil-chain", "hive-network"]:
    sys.path.insert(0, f"/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-{name}-mcp")

from meok_sovereign_native_mcp import sov_native_iot, sov_native_intuition
from meok_sovereign_federation_mcp import federation_status
from meok_sovereign_bft_council_mcp import bft_thresholds, bft_propose
from meok_sovereign_carefloor_mcp import carefloor_check, carefloor_status
from meok_sovereign_sigil_chain_mcp import sigil_emit, sigil_chain
from meok_sovereign_hive_network_mcp import hive_health, big_braim

OUT = Path("/Users/nicholas/clawd/sov_competition")
JSON = OUT / "live_substrate_state.json"
HTML = OUT / "live_substrate.html"

_state_lock = threading.Lock()


def compute_state():
    """Compute the current sovereign substrate state."""
    state = {"ts": datetime.now(timezone.utc).isoformat() + "Z"}

    # Federation health
    try:
        fed = federation_status(include_health=True)
        state["federation"] = {
            "general_count": fed.get("general_count"),
            "healthy": fed.get("bft_result", {}).get("verdict", "UNKNOWN"),
        }
    except Exception as e:
        state["federation"] = {"error": str(e)}

    # Care floor
    try:
        cf = carefloor_status()
        state["care_floor"] = {
            "total_checks": cf.get("total_checks"),
            "avg_pass_rate": cf.get("avg_pass_rate"),
        }
    except Exception as e:
        state["care_floor"] = {"error": str(e)}

    # Sigil chain
    try:
        sc = sigil_chain()
        state["sigil_chain"] = {
            "length": sc.get("chain_length"),
            "head_hash": sc.get("head_hash", "")[:16] + "...",
        }
    except Exception as e:
        state["sigil_chain"] = {"error": str(e)}

    # BFT thresholds
    try:
        bt = bft_thresholds()
        state["bft_thresholds"] = {
            "fast_voters": bt["thresholds"]["fast"]["voters"],
            "balanced_voters": bt["thresholds"]["balanced"]["voters"],
            "secure_voters": bt["thresholds"]["secure"]["voters"],
        }
    except Exception as e:
        state["bft_thresholds"] = {"error": str(e)}

    # BIG BRAIM
    try:
        bb = big_braim()
        state["big_braim"] = {
            "winners": bb.get("count"),
            "total_size_tb": bb.get("total_size_tb"),
        }
    except Exception as e:
        state["big_braim"] = {"error": str(e)}

    # Hive health
    try:
        hh = hive_health()
        state["hive_network"] = {
            "total_hives": hh.get("total_hives"),
            "by_tier": hh.get("by_tier"),
            "by_general": hh.get("by_general"),
        }
    except Exception as e:
        state["hive_network"] = {"error": str(e)}

    # 16-dim state (Mamba-2 style)
    try:
        state["16d_state"] = sov_native_intuition([0.5] * 16)
    except Exception as e:
        state["16d_state"] = {"error": str(e)}

    # Active proposal
    try:
        state["active_proposal"] = bft_propose(
            f"Maintain substrate {state['ts'][:19]}",
            "Auto-generated from live substrate sim",
            bft_mode="balanced"
        )
    except Exception as e:
        state["active_proposal"] = {"error": str(e)}

    # Emit a sigil
    try:
        sigil = sigil_emit("substrate", "tick", {"ts": state["ts"]})
        state["last_sigil"] = sigil.get("kid")
    except Exception:
        state["last_sigil"] = "n/a"

    return state


def build_html(state):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>LIVE Sovereign Substrate — MEOK OS</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'JetBrains Mono', monospace; background: #000;
         color: #e5e5e5; padding: 1rem; }}
  h1 {{ color: #fbbf24; text-align: center; text-shadow: 0 0 20px #fbbf24; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
           gap: 1rem; max-width: 1200px; margin: 1rem auto; }}
  .card {{ background: #1a1a1a; padding: 1rem; border-radius: 8px;
          border-left: 4px solid #fbbf24; }}
  .card h3 {{ color: #60a5fa; margin: 0 0 0.5rem; font-size: 1rem; }}
  .value {{ font-size: 1.8rem; color: #fbbf24; font-weight: bold; margin: 0.5rem 0; }}
  pre {{ background: #0a0a0a; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem;
         overflow-x: auto; max-height: 200px; }}
  .timestamp {{ text-align: center; color: #fbbf24; font-size: 1.2rem; margin: 1rem 0; }}
  .pulse {{ animation: pulse 2s ease-in-out infinite; display: inline-block; }}
  @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.5; }} }}
</style>
</head>
<body>

<h1>🜏 LIVE Sovereign Substrate</h1>
<p class="timestamp pulse">{state['ts']}</p>

<div class="grid">
  <div class="card">
    <h3>🐉 12 Generals Federation</h3>
    <div class="value">{state.get('federation', {}).get('general_count', '?')}</div>
    <p>BFT: <strong>{state.get('federation', {}).get('healthy', '?')}</strong></p>
  </div>
  <div class="card">
    <h3>🛡️ Care Floor (16 probes)</h3>
    <div class="value">{state.get('care_floor', {}).get('total_checks', 0)}</div>
    <p>Avg pass rate: <strong>{state.get('care_floor', {}).get('avg_pass_rate', 0):.1%}</strong></p>
  </div>
  <div class="card">
    <h3>📜 Sigil Chain</h3>
    <div class="value">{state.get('sigil_chain', {}).get('length', 0)}</div>
    <p>Head: <code>{state.get('sigil_chain', {}).get('head_hash', 'n/a')}</code></p>
  </div>
  <div class="card">
    <h3>🌍 Hive Network</h3>
    <div class="value">{state.get('hive_network', {}).get('total_hives', 0)}</div>
    <p>Tier: {state.get('hive_network', {}).get('by_tier', {}).get('sovereign', 0)} sover / {state.get('hive_network', {}).get('by_tier', {}).get('enterprise', 0)} ent / {state.get('hive_network', {}).get('by_tier', {}).get('smb', 0)} smb</p>
  </div>
  <div class="card">
    <h3>🧠 BIG BRAIM</h3>
    <div class="value">{state.get('big_braim', {}).get('winners', 0)} winners</div>
    <p>{state.get('big_braim', {}).get('total_size_tb', 0)} TB MoE</p>
  </div>
  <div class="card">
    <h3>⚖️ BFT Thresholds</h3>
    <div class="value">3 / 5 / 7</div>
    <p>fast / balanced / secure voters</p>
  </div>
  <div class="card">
    <h3>🌐 16-dim Mamba-2 State</h3>
    <p>L2 norm: <strong>{state.get('16d_state', {}).get('l2_norm', '?')}</strong></p>
    <p>Is alert: <strong>{state.get('16d_state', {}).get('is_alert', '?')}</strong></p>
    <p>Confirmed: <strong>{state.get('16d_state', {}).get('confirmed', '?')}</strong></p>
  </div>
  <div class="card">
    <h3>🪪 Last Sigil</h3>
    <div class="value" style="font-size: 1rem;">{state.get('last_sigil', 'n/a')}</div>
  </div>
</div>

<h2 style="text-align: center; color: #fbbf24; margin-top: 2rem;">📋 Full State (JSON)</h2>
<pre>{json.dumps(state, indent=2, default=str)[:2000]}</pre>

<p style="text-align: center; color: #888; margin-top: 1rem;">
  Auto-refreshes every 2 seconds · Last update: {state['ts']}
</p>

</body>
</html>
"""


def main():
    print("=" * 70)
    print("🜏 LIVE SOVEREIGN SUBSTRATE SIMULATOR")
    print("   Auto-refreshes every 2 seconds")
    print("=" * 70)

    iteration = 0
    try:
        while True:
            state = compute_state()
            with _state_lock:
                JSON.write_text(json.dumps(state, indent=2, default=str))
                HTML.write_text(build_html(state))
            iteration += 1
            print(f"  [tick {iteration}] sigil={state.get('last_sigil', 'n/a')} "
                  f"chain={state.get('sigil_chain', {}).get('length', 0)} "
                  f"federation={state.get('federation', {}).get('general_count', '?')} "
                  f"care_floor={state.get('care_floor', {}).get('total_checks', 0)}")
            time.sleep(2)
    except KeyboardInterrupt:
        print()
        print("Stopped.")


if __name__ == "__main__":
    main()