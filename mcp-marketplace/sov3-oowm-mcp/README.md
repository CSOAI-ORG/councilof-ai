# SOV3 OOWM MCP — Organic Open World Model

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-9%2F9-brightgreen)]()

**The world model as a governed, queryable MCP service.**

## What This Is

The SOV3 OOWM MCP exposes a 5-layer world model architecture as tools that any AI agent can query:

| Layer | Name | Tools | Backend |
|-------|------|-------|---------|
| L1 | Perception | `register_sensor`, `ingest_sensor_data` | Multi-modal (RuView/radar/camera/thermal) |
| L2 | World Representation | `update_spatial_map`, `query_spatial` | 3DGS / NeRF spatial memory |
| L3 | World Model | `predict_future` | V-JEPA / Cosmos (pluggable) |
| L4 | Action Model | `learn_skill`, `recall_skill`, `execute_skill` | Voyager-style skill library |
| L5 | Action | `plan_and_act` | VLA action planning |

## What This Is NOT (Honest)

This MCP is the **governance and query interface**. It does NOT load heavy ML models (V-JEPA, Cosmos, OpenVLA). Those require CUDA GPUs. This MCP provides:
- The API surface for the OOWM
- Ed25519-signed governance on every action
- Voyager-style eternal skill library
- Spatial memory and prediction (simplified physics)
- Pluggable backends — swap in real ML models when GPU is available

## Install

```bash
pip install sov3-oowm-mcp
```

## Quick Start

```python
from sov3_oowm_mcp.server import register_sensor, learn_skill, plan_and_act

# Register a sensor
register_sensor("ruview-1", "wifi_sensing", {"lat": 51.5, "lon": -0.1}, ["presence", "breathing"])

# Learn a skill (Voyager-style eternal library)
learn_skill("open_gate", "def open_gate(id): return {'gate': id, 'action': 'open'}", "Opens a farm gate")

# Plan and act
plan = plan_and_act("Navigate to the barn and scan for intruders")
print(f"{len(plan['plan'])}-step plan generated")
```

## Governance

Every OOWM action is:
- **Ed25519-signed** and hash-chained on the SIGIL ledger
- **Care-floor enforced** — no action crosses ethical bounds
- **BFT-governed** — decisions validated by consensus
- **Offline-verifiable** — prove the world model's actions without our infrastructure

**MEOK AI Labs (CSOAI LTD)** — Sovereign. Organic. Governed.
