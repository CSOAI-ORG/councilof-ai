#!/usr/bin/env python3
"""Wrapper - copies build_html.py to make it executable"""
import subprocess, sys
result = subprocess.run([sys.executable, '/Users/nicholas/clawd/sovereign-charters/build_html.py'], capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RC:", result.returncode)
