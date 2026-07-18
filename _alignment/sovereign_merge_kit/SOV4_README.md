# SOV4

The clean sovereign package: **one governed, signed decision path** over open-source models.

```bash
pip install -e .          # from this dir
```
```python
from sov4 import ask, status, decide_full
status()                                   # honest package state (verified vs gated)
print(ask("What does the EU AI Act require for chatbots?"))   # governed + Ed25519-signed
```

Every request flows through `decide()`: **DEFONEOS hard-stop → care-floor(0.35) → tier(SOV3/33/333) → route → sign.**
Brains are reached over HTTP (Groq/NVIDIA/Ollama/local) — no GPU needed to *serve*; `pip install .[train]` adds the training stack.

SOV4 is a **consolidation** of verified pieces, not a from-scratch frontier model. "New levels" = engineered fusion +
a governed self-improvement loop, every decision signed. See `../SOV4_MANIFEST.md` for the honest component/gate list.
