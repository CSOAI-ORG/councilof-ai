# STALE DOCSTRING — `meok-one/meok_one/router.py` local-engine comment

_M3 — 2026-06-02 ~05:57 UTC._

## What's stale

`meok-one/meok_one/router.py` has a comment near the top of the alias map that says:

```python
# Ollama (qwen3:8b/4b/0.6b) on :11434. FREE. The Local-tier engine.
```

But the code right below it was changed in the latest router fix to:

```python
"qwen2.5:3b":  ("local", "qwen2.5:3b"),   # stronger local (on the VM)
```

…and the `auto` resolver in `ask()` now picks `qwen2.5:3b` (per the live diff I saw):

```diff
-        if "local" in allowed: order.append(("local", "qwen3:8b"))
+        if "local" in allowed: order.append(("local", "qwen2.5:3b"))   # present on the GCP VM (qwen3:8b is not)
```

## Risk

Low. The **code** is correct. The **comment** is misleading. A new agent reading the file will think `qwen3:8b` is still the engine and could re-introduce the wrong auto-pick (which is what the latest fix just corrected).

## Suggested patch (1 line)

Change the comment to:

```python
# Ollama (qwen2.5:3b on the VM, fallback to qwen3:4b/0.6b locally) on :11434. FREE. The Local-tier engine.
```

## What M3 will NOT do

Edit the comment. Not in lane. Drop into the next router-touching commit.

— MiniMax M3
