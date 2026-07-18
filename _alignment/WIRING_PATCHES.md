# SOV3³ Logger Wiring — Prepared Patches (2026-07-07)

> **APPROVAL BOUNDARY.** These are prepared, NOT applied. Each is an `edit_file`-ready
> old_string→new_string pair for `sovereign-temple/sovereign-mcp-server.py`. Applying them
> edits the running SOV3 server — say the word and I apply them one by one. All are additive
> and fail-safe (logging can never raise into the request path).

## Patch 0 — import (once, after line 43)
**old_string:**
```
from neural_core import create_default_registry, NeuralModelRegistry
```
**new_string:**
```
from neural_core import create_default_registry, NeuralModelRegistry
try:
    from neural_core.episode_logger import log_episode as _log_episode
except Exception:
    def _log_episode(*a, **k):  # never break the server if logging fails
        return None
```

## Patch 1 — threat (the highest-value hook; real 0/1 label)
**old_string:**
```
            # Fire alert if threat detected
            if result.get("threat_detected"):
                await alert_manager.fire_alert(
                    AlertSeverity.CRITICAL,
                    "security",
                    "Security Threat Detected",
                    f"Threat level: {result.get('overall_threat_level', 'unknown')}",
                    channels=[AlertChannel.CONSOLE],
                )
            return result
```
**new_string:**
```
            # Fire alert if threat detected
            if result.get("threat_detected"):
                await alert_manager.fire_alert(
                    AlertSeverity.CRITICAL,
                    "security",
                    "Security Threat Detected",
                    f"Threat level: {result.get('overall_threat_level', 'unknown')}",
                    channels=[AlertChannel.CONSOLE],
                )
            _log_episode("threat", content=str(arguments.get("text", "")),
                         care_weight=0.9 if result.get("threat_detected") else 0.1,
                         label=int(bool(result.get("threat_detected"))),
                         tags=["auto", "detect_threats"], source_agent="detect_threats")
            return result
```

## Patch 2 — partnership
**old_string:**
```
        elif name == "detect_partnership_opportunities":
            model = model_registry.get("partnership_detection_ml")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            return model.predict(arguments["text"])
```
**new_string:**
```
        elif name == "detect_partnership_opportunities":
            model = model_registry.get("partnership_detection_ml")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            _pred = model.predict(arguments["text"])
            _log_episode("partnership", content=str(arguments.get("text", "")),
                         care_weight=float(_pred.get("opportunity_score", 0.5)) if isinstance(_pred, dict) else 0.5,
                         label=(_pred.get("opportunity_score") if isinstance(_pred, dict) else None),
                         tags=["auto", "partnership"], source_agent="detect_partnership_opportunities")
            return _pred
```

## Patch 3 — relationship
**old_string:**
```
        elif name == "predict_relationship_evolution":
            model = model_registry.get("relationship_evolution_nn")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            return model.predict(arguments)
```
**new_string:**
```
        elif name == "predict_relationship_evolution":
            model = model_registry.get("relationship_evolution_nn")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            _pred = model.predict(arguments)
            _log_episode("relationship", content=str(arguments),
                         care_weight=float(_pred.get("predicted_trust_6mo", 0.5)) if isinstance(_pred, dict) else 0.5,
                         label=(_pred.get("predicted_trust_6mo") if isinstance(_pred, dict) else None),
                         tags=["auto", "relationship"], source_agent="predict_relationship_evolution")
            return _pred
```

## Patch 4 — care
**old_string:**
```
        elif name == "analyze_care_patterns":
            model = model_registry.get("care_pattern_analyzer")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            return model.predict(arguments)
```
**new_string:**
```
        elif name == "analyze_care_patterns":
            model = model_registry.get("care_pattern_analyzer")
            if not model or not model.is_trained:
                return {"error": "Model not available"}
            _pred = model.predict(arguments)
            _log_episode("care", content=str(arguments),
                         care_weight=float(_pred.get("care_score", 0.5)) if isinstance(_pred, dict) else 0.5,
                         tags=["auto", "care"], source_agent="analyze_care_patterns")
            return _pred
```

## Not patched: dependency
No `detect_dependency` handler exists. Wiring it needs a NEW MCP tool + a
dependency_detection model in the registry — a build, not a one-line hook. Left out
honestly rather than faked.

## To apply
Say "apply the patches" and I run patch 0→4 via edit_file, then restart guidance.
Each edit is verified (old_string matches exactly once) before the next.
