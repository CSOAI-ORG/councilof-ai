"""MEOK API entrypoint — re-exports the full meok-sovereign-api application.

Launch contract (from .hive/config.yaml + ai.csoai.meok-api.plist):
  cd /Users/nicholas/clawd/meok && python -m uvicorn api.server:app --port 3200
"""
import sys
from pathlib import Path

# Prefer the full sovereign API restored from RunPod/git.
_SOV = Path(__file__).resolve().parents[2] / "meok-sovereign-api"
if str(_SOV) not in sys.path:
    sys.path.insert(0, str(_SOV))

from app.main import app  # noqa: E402,F401

__all__ = ["app"]
