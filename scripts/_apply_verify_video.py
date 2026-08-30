#!/usr/bin/env python3
from pathlib import Path

p = Path("client/src/components/home/LivingStages.tsx")
text = p.read_text()
old = """          {/* The pipeline explained in motion rather than a cropped panel. */}
          <VideoEmbed
            src=\"/videos/architecture-of-measurement.mp4\"
            poster=\"/videos/architecture-of-measurement.jpg\"
            title=\"How a card is made: grading against frozen provisions, then canonical signing\"
            caption=\"How the card is made before you ever check it — deterministic grading, then canonical Ed25519 signing.\"
            className=\"mt-10\"
          />"""
new = """          {/* Unused on the rest of home — the three films already cover card-making. */}
          <VideoEmbed
            src=\"/videos/proving-ground.mp4\"
            poster=\"/videos/proving-ground.jpg\"
            title=\"The Proving Ground — how we test containment\"
            caption=\"The arena, not the signing bench. Containment is tested here; the card you check on the left is the signed result. Not a certificate.\"
            className=\"mt-10\"
          />"""
if old not in text:
    raise SystemExit("verify-yourself video block not found")
p.write_text(text.replace(old, new, 1))
print("patched LivingStages.tsx")
