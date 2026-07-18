"""pytest-compatible test_breakthrough.py — runs the existing t01()-t30() functions."""
import sys

sys.path.insert(0, "/Users/nicholas/clawd")
import test_breakthrough as tb

# Wrap each t01-t30 as a pytest test (call the original t* function, not the @spec decorator)
for i in range(1, 31):
    name = f"t{i:02d}"
    fn = getattr(tb, name, None)
    if fn is None:
        continue

    def make_test(n, f):
        def test_func():
            # The original function returns (passed: bool, detail: str)
            result = f()
            if isinstance(result, tuple) and len(result) == 2:
                passed, detail = result
                assert passed, f"{n}: {detail}"
            # If no tuple returned, assume pass (some tests return None)
        test_func.__name__ = f"test_{n}"
        return test_func

    globals()[f"test_{name}"] = make_test(name, fn)
