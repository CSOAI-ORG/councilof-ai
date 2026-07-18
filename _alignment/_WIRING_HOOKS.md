# SOV3³ Logger Wiring — Hook Map (2026-07-07)

All hooks are in `sovereign-temple/sovereign-mcp-server.py`. Each is an MCP tool handler
that receives real user input AND the model's prediction — the ideal place to log a
labelled episode. Insertions are ADDITIVE (one call after the prediction, before return).

| # | NN | Handler | Line | Input available | Real label available |
|---|---|---|---|---|---|
| 1 | **threat** | `detect_threats` | 3662–3688 | `arguments["text"]` | `result["threat_detected"]` (bool) + `overall_threat_level` |
| 2 | **partnership** | `detect_partnership_opportunities` | 3656–3660 | `arguments["text"]` | `result["opportunity_score"]` |
| 3 | **relationship** | `predict_relationship_evolution` | 3690–3694 | `arguments` | `result["predicted_trust_6mo"]` |
| 4 | **care** | `analyze_care_patterns` | 3696–3700 | `arguments` | `result` care score |
| 5 | **dependency** | (no handler yet) | — | — | needs a new tool or a hook in the relationship monitor |

## Best hook: `detect_threats` (line 3662)
This is the highest-value wiring — it's the only handler with a clean boolean label
(`threat_detected`) already computed. Logging here turns every live threat classification
into a training episode with a real 0/1 label, directly feeding the broken threat NN.

## Secondary hooks: partnership (3656), relationship (3690), care (3696)
Each returns a score usable as `care_weight`/`label`. Log after `.predict()`, before return.

## Gap: dependency (no live classifier)
There is no `detect_dependency` handler and no dependency_detection model wired into the
server's predict path. Dependency episodes can't be auto-logged until either a classifier
tool is added or a hook is placed in the relationship/over-reliance monitor. Honest gap.

## Insertion pattern (additive, non-breaking)
Add near the top of the handler module (once):
```python
try:
    from neural_core.episode_logger import log_episode
except Exception:
    def log_episode(*a, **k): pass   # never break the server if logging fails
```
Then after each prediction, before `return`:
```python
# threat handler:
log_episode("threat", content=arguments["text"],
            care_weight=0.9 if result.get("threat_detected") else 0.1,
            label=int(bool(result.get("threat_detected"))),
            tags=["auto","gate"], source_agent="detect_threats")
```
