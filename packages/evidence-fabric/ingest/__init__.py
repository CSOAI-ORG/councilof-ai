# SPDX-License-Identifier: Apache-2.0
"""Ingesters: third-party outputs -> csoai.evidence-event/0.1. They record what a source said; they never
upgrade a declared finding into an observed one."""
import os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import event as E  # noqa: E402,F401
