"""Load pinned local source without installing packages or reading home config."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_PACKAGES = ROOT.parent


def load(name, path, package=False):
    if name in sys.modules:
        return sys.modules[name]
    spec = importlib.util.spec_from_file_location(
        name, path, submodule_search_locations=[str(path.parent)] if package else None)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


fabric = load("_csoai_world_fabric", REPO_PACKAGES / "evidence-fabric/event.py")
tempo = load("_csoai_world_tempo", ROOT / "third_party/earth_scale/tempo.py")
swarmchat = load("_csoai_world_chat", ROOT / "third_party/swarmchat/__init__.py", True)
