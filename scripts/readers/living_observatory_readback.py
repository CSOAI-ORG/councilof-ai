"""Read the retained living-source receipt through the existing fleet interface."""
import importlib.util
from pathlib import Path
def read_status():
    root = Path(__file__).resolve().parent / "living-observatory"
    source = root / "living_observatory.py"
    if not source.exists():
        return {"state": "NOT_INSTALLED", "checked_here": False}
    spec = importlib.util.spec_from_file_location("csoai_living_observatory_reader", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.status(root / "state")
