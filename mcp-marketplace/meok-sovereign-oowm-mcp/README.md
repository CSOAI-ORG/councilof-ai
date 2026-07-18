# meok-sovereign-oowm-mcp

**SOV3³ Organic World Model MCP — 12 Generals × 3 Council BFT × MOM × MoE.**

The OOWM substrate for the MEOK sovereign empire. Every query routes through:
**General → Council(BFT) → MOM(Multi-modal) → MoE(8 experts) → Sigil**

> *"SOV3 doesn't answer questions — SOV3 FEELS them, deliberates on them, and answers them with the entire substrate behind it."*

---

## Install

```bash
pip install meok-sovereign-oowm-mcp
```

## Architecture

```
SOV3³ OOWM
  ↓
12 Generals (Argus, Scribe, Shield, Builder, Abacus, Lex, Scale, Crow, Gear, Voice, Owl, Dragon)
  ↓ each picks one of 3 BFT council modes
3 BFT Modes (fast=3/5 voters, balanced=5/5 voters, secure=7/5 voters)
  ↓ each council votes through 4 MOM experts
MOM (TextMOM 0.5, VisionMOM 0.25, AudioMOM 0.15, SpatialMOM 0.10)
  ↓ MOM experts dispatch to 8 MoE experts
MoE (Coding, Reasoning, LongCtx, Multilingual, Edge, TTS, Embed, Router)
  ↓ every hop is Ed25519-signed
Sigil → proofof.ai
```

## Tools (7)

| Tool | What |
|---|---|
| `oowm_think` | Route a query through General + Council + MOM + MoE |
| `oowm_council` | Show 12 Generals + 3 BFT modes + 8 MoE experts |
| `oowm_route` | Predict best General for a query (keyword routing) |
| `oowm_score` | Score a General's output against care floor + sovereign |
| `oowm_status` | Full OOWM status |
| `oowm_5d_hive` | 12 Generals × 5D × 1 GCP VM each × QOwm + Sephiroth |
| `oowm_sephiroth` | 10 emanations + 2 auxiliary mapped to Generals |

## The 12 Generals (from hive.yaml)

| # | Name | Role | Brain | Default BFT |
|---|---|---|---|---|
| 1 | Argus | watchdog | man | balanced |
| 2 | Scribe | compliance | man | secure |
| 3 | Shield | safety | quant | secure |
| 4 | Builder | architect | man | balanced |
| 5 | Abacus | quant | quant | fast |
| 6 | Lex | legal | man | secure |
| 7 | Scale | ethics | man | balanced |
| 8 | Crow | risk | man | balanced |
| 9 | Gear | operations | quant | fast |
| 10 | Voice | comms | man | fast |
| 11 | Owl | research | man | secure |
| 12 | Dragon | sovereign | both | secure |

## Usage

```python
from meok_sovereign_oowm_mcp import oowm_think, oowm_route, oowm_council

# Show the full council
print(oowm_council())

# Route a query
route = oowm_route("Audit EU AI Act Article 50 compliance")
print(f"General: {route['predicted_general']['name']} ({route['predicted_general']['role']})")
print(f"BFT: {route['predicted_bft_mode']}")

# Think via the OOWM (full pipeline)
result = oowm_think("Deploy sovereign substrate to production")
print(f"General: {result['general']['name']}")
print(f"BFT mode: {result['bft_mode']} ({result['bft']['voters']} voters, quorum={result['bft']['quorum']})")
print(f"Consensus: {result['consensus']}")
print(f"MOM used: {[m['name'] for m in result['mom_used']]}")
print(f"MoE used: {[m['name'] for m in result['moe_used']]}")
```

## Tests

```
33/33 tests pass in 0.11s
```

- 12 generals counted
- 3 BFT modes defined
- 4 MOM experts sum to 1.0 weight
- 8 MoE experts with correct sizes
- 5D Hive: 12 GCP VMs × 5 dimensions × QOwm + Sephiroth
- Routing: compliance → Scribe, sovereign → Dragon, gibberish → sovereign
- Stakes-override: kill/deploy → secure, monitor/watch → fast
- Every output Ed25519-signed
- Care floor blocks "harm" keyword
- BFT modes have correct voters/quorum (3/2, 5/3, 7/5)

## License

MIT — CSOAI Ltd (UK 16939677)

## Verify

Every output is signed. Check `kid` and `sig` fields at https://proofof.ai