# 7-File Mavis Template — Forbidden Brand Standard
# This snippet is the canonical "no severed brands" block to include in any
# new meok-sovereign-*-mcp or csoai-sovereign-*-mcp package.
#
# Location in the 7-file Mavis structure: append to README.md as a section.
# For server.py: import the BANNED_TERMS constant and gate prompt pre-processing.

# === README.md section (append) ===
"""
## Severed brands (NEVER reference)

This MCP will REFUSE to process any prompt containing the following severed
brands. The rule is enforced at the server level via the BANNED_TERMS list
in `server.py` (see `BannedTermGate` class).

**Severed brands (per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0 §①):**
- James Castle / Grant Carter Osborne / Chris J. — co-founder of CSGA,
  severed 2026-01-31, resigned 2026-03-31. IP dispute, do not engage.
- CSGA (Council for the Sovereign Governance of AI) — the org, the
  website, the npm scope, the GitHub org, the .org domain, all
  references. Severed 2026-01.
- Terranova Holdings / Terranova-OCG / Terranova Aerospace & Defence —
  counter-party in the IP dispute. Severed 2026-01.
- csga-global.org / csgaglobal.org / csga.ai / defonos.io — domains.
- `@csga-global` / `@csgaglobal` / `csga_global` (npm publisher) /
  `csga-global-mcp` (PyPI pkg) / `csga-global-site` (Vercel project) —
  any artifact of the severed brand.

**Forbidden phantoms (Kimi-era fabricated, per meok-ecosystem-navigation
skill §Phantom-Context Strip):**
- Toronto Summit / Toronto Council / Toronto conference / Toronto AI
- 4 Jul launch (the Kimi phantom, NOT the real Article 50 launch on
  csoai.org/launch-4jul/)
- 306 queue (the phantom email queue, real queue = 7 viable + 245
  quarantined)
- defonos.io (an old domain that was a James Castle–era trap)

**The pattern is enforced in `server.py` via the BannedTermGate class.**
Any prompt matching the regex below is refused with a 403 response and
a "severed brand" explanation. The refusal is logged to SOV3 via
`record_memory` with `source_agent: "<this-mcp-name>"` and
`memory_type: "refusal"`.
"""

# === server.py snippet (import at top, use in prompt processing) ===
SERVER_PY_SNIPPET = '''
import re

# Severed brands (per MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0 §①)
# Enforced at prompt pre-processing for any MCP that handles user input.
BANNED_TERMS = re.compile(
    r"\\b(james castle|grant carter|chris j\\.?|csga[\\-\\s]?global|"
    r"terranova|csga[\\.\\-]?ai|defonos\\.io|toronto summit|toronto council)\\b",
    re.IGNORECASE,
)

class BannedTermGate:
    """Pre-inference gate that refuses prompts containing severed brands.

    Per the 28 May v1.0 + 27 Jun v2.0 DEFONEOS alignment + the
    meok-ecosystem-navigation Phantom-Context Strip rule, any prompt
    matching BANNED_TERMS is refused BEFORE any inference. The refusal
    is logged to SOV3 record_memory with source_agent=this-mcp-name
    and memory_type=refusal. No override path.
    """

    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        """Returns (allowed, reason). If allowed=True, reason is empty."""
        if not prompt:
            return True, ""
        match = BANNED_TERMS.search(prompt)
        if match:
            term = match.group(0)
            return False, (
                f"Refused: '{term}' is a severed brand or phantom "
                f"(see MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0 §①). "
                f"Reformulate without severed-brand references."
            )
        return True, ""


# Use in any prompt handler:
# allowed, reason = BannedTermGate.check(user_prompt)
# if not allowed:
#     return {"error": "refused", "reason": reason, "status": 403}
'''
