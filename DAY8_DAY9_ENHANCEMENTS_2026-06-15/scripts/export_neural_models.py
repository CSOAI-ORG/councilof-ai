#!/usr/bin/env python3
"""export_neural_models.py — bundle 3 sovereign neural models as PyPI packages.

Target models (pre-trained .pkl artifacts in models/):
  - care_validation_nn
  - threat_detection_nn
  - partnership_detection_ml
"""
import shutil, os
from pathlib import Path

SRC = Path("/Users/nicholas/clawd/sovereign-temple/models")
DST = Path("/Users/nicholas/clawd/DAY8_DAY9_ENHANCEMENTS_2026-06-15/pypi")
DST.mkdir(parents=True, exist_ok=True)

models = [
    ("care_validation_nn", "sovereign-care-validation-nn", "Sovereign care validation neural network"),
    ("threat_detection_nn", "sovereign-threat-detection-nn", "Sovereign threat detection (Morris-II) NN"),
    ("partnership_detection_ml", "sovereign-partnership-detection-ml", "Sovereign partnership detection ML"),
]

for src_name, pkg_name, desc in models:
    src_file = SRC / f"{src_name}.pkl"
    if not src_file.exists():
        print(f"  SKIP: {src_file} not found")
        continue
    pkg_dir = DST / pkg_name
    pkg_dir.mkdir(exist_ok=True)
    # Copy .pkl + write pyproject.toml
    shutil.copy2(src_file, pkg_dir / f"{src_name}.pkl")
    pyproject = f"""[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "{pkg_name}"
version = "0.1.0"
description = "{desc} - Sovereign Substrate SOV3"
readme = "README.md"
requires-python = ">=3.9"
license = {{text = "CC0-1.0"}}
authors = [{{name = "Nicholas Templeman"}}]
keywords = ["meok", "sov3", "sovereign", "neural", "compliance"]

[tool.setuptools]
packages = ["{pkg_name}"]
"""
    (pkg_dir / "pyproject.toml").write_text(pyproject)
    (pkg_dir / pkg_name / "__init__.py").mkdir(parents=True, exist_ok=True)
    init_path = pkg_dir / pkg_name / "__init__.py"
    init_path.write_text(f'"""{desc}"""\n__version__ = "0.1.0"\n')
    (pkg_dir / "README.md").write_text(f"# {pkg_name}\n\n{desc}\n\nMEOK Sovereign Substrate SOV3\n")
    print(f"  PACKAGED: {pkg_name} ({src_file.stat().st_size} bytes)")

print(f"\nDONE: {len(models)} PyPI packages staged at {DST}")
