"""Perception → SIGIL → SOV3 memory loop (run on the VM as the meok user)."""
import sys, re, hashlib
sys.path.insert(0, "/opt/meok-one")
from meok_one import sigil, memory

# 1) PERCEIVE: capture content (scan a file)
path = "/opt/meok-one/meok_one/sigil.py"
txt = open(path).read()
syms = re.findall(r"^def (\w+)", txt, re.M)[:6]

# 2) TRANSFORM: file content -> compact SIGIL F (frame) line
F = sigil.encode({"op": "F",
                  "scene": "file sigil.py (%dB, %d lines)" % (len(txt), txt.count("\n") + 1),
                  "objects": syms,
                  "ref": "sha_" + hashlib.sha256(txt.encode()).hexdigest()[:8]})
print("PERCEIVED:", F)
print("GLOSS    :", sigil.gloss(F))

# 3) STORE into MEOK/SOV3's own memory
mb = memory.bridge()
rec = mb.record("sigil-perception", F, platform="hud-vision")
print("RECORDED :", str(rec)[:170])

# 4) RECALL it back
rcl = mb.recall("sigil-perception", "file sigil objects", limit=3)
print("RECALLED :", str(rcl)[:240])
