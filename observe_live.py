#!/usr/bin/env python3
"""
observe_live.py — the orchestrator's real EYES (macOS, no MCP needed).

Captures the screen and reads on-screen text so the orchestrator can detect
idle/awaiting-input windows from your ACTUAL desktop — not the stub. Read-only:
it screenshots + OCRs, it never types. The orchestrator uses this only when
ORCH_LIVE=1 (default off → safe stub).

Pipeline: `screencapture` (built-in) → OCR (pytesseract if available) → segment
into pseudo-windows → return [{window, text}] for classify()/propose_help().

Honest deps: needs `pytesseract` + `tesseract` for OCR. If absent, returns []
and logs why — the orchestrator falls back to the stub, never crashes.
"""
import os, subprocess, tempfile, shutil


def _screencap(path):
    # -x = no sound. Whole screen (per-window capture needs window ids / accessibility).
    try:
        subprocess.run(["screencapture", "-x", path], check=True, timeout=10)
        return os.path.exists(path)
    except Exception:
        return False


def _ocr(path):
    try:
        import pytesseract            # optional
        from PIL import Image
        return pytesseract.image_to_string(Image.open(path))
    except Exception as e:
        return f"__OCR_UNAVAILABLE__:{e}"


# the same routine/judgment signals the orchestrator classifies on
_SIGNALS = ["continue?", "awaiting input", "press enter", "(y/n)", "approve?",
            "publish", "deploy", "ready to", "waiting for", "go on", "y/n"]


def _segment(text):
    """Coarse: split OCR text into lines that look like an agent prompt/state."""
    out = []
    for i, ln in enumerate(text.splitlines()):
        s = ln.strip()
        if s and any(sig in s.lower() for sig in _SIGNALS):
            out.append({"window": f"screen-region-{len(out)+1}", "text": s[:160]})
    return out


def observe_live():
    """Return [{window, text}] from the real screen. [] if OCR unavailable (safe fallback)."""
    if not shutil.which("screencapture"):
        return []
    tmp = os.path.join(tempfile.mkdtemp(), "orch_screen.png")
    if not _screencap(tmp):
        return []
    text = _ocr(tmp)
    try:
        os.remove(tmp)
    except OSError:
        pass
    if text.startswith("__OCR_UNAVAILABLE__"):
        # honest: no OCR → can't read the screen → return nothing (stub takes over)
        return []
    return _segment(text)


def available():
    """Is live observation usable here? (screencapture + OCR present)"""
    has_cap = bool(shutil.which("screencapture"))
    try:
        import pytesseract  # noqa
        has_ocr = bool(shutil.which("tesseract"))
    except Exception:
        has_ocr = False
    return {"screencapture": has_cap, "ocr": has_ocr, "ready": has_cap and has_ocr}


if __name__ == "__main__":
    a = available()
    print("live-observe capability:", a)
    if a["ready"]:
        print("detected on-screen agent states:", observe_live())
    else:
        print("OCR not installed → orchestrator uses the safe stub. To enable real eyes:")
        print("  brew install tesseract && pip install pytesseract pillow")
