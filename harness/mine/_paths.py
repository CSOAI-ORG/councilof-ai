"""Resolve mine harness roots — monorepo-first, Mac mirror fallback."""
import os
from pathlib import Path

HARNESS_DIR = Path(__file__).resolve().parent
MINE_ROOT = Path(os.environ.get("MINE_ROOT", HARNESS_DIR))
AXIS17_ROOT = Path(
    os.environ.get(
        "AXIS17_ROOT",
        os.path.expanduser("~/.grokbot/harness/measure/axis17"),
    )
)
STATIC_DEPLOY2 = Path(
    os.environ.get(
        "STATIC_DEPLOY2_ROOT",
        os.path.expanduser("~/clawd/csoai-static-deploy2"),
    )
)
