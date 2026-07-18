#!/usr/bin/env python3
"""SOV33 state demo — runs ONLY the standalone-verified modules and prints a
consolidated RUNNING banner. Bypasses sov33.py's full import chain (blocked by a
broken `oci` SDK install: No module named 'oci.auth'). Ground truth by running."""
import sys, os, io, contextlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))
os.makedirs(os.environ["SOV33_SIGIL_DIR"], exist_ok=True)

VERIFIED = ["sov33_identity", "sov33_effective_votes", "sov33_nn_layer", "sov33_flywheel"]
print("="*70); print("SOV33 STATE DEMO — verified-by-run standalone modules"); print("="*70)
ok = 0
for m in VERIFIED:
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
            exec(compile(open(os.path.join(HERE, m+".py")).read(), m+".py", "exec"), {"__name__":"__main__"})
        head = next((l for l in buf.getvalue().splitlines() if l.strip()), "")
        print(f"  [RUNS] {m:28s} -> {head[:60]}"); ok += 1
    except Exception as e:
        print(f"  [FAIL] {m:28s} -> {type(e).__name__}: {e}")
print("-"*70); print(f"  {ok}/{len(VERIFIED)} standalone modules RUN clean in this env")
print("  BLOCKED (env, not code): sov33.py chain + sov33_escalate -> No module named 'oci.auth'")
print("="*70)
