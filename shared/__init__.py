"""clawd/shared/__init__.py — the canonical shared library for the MEOK empire.
EAT MODE: ALL 5 duplicate groups consolidated here on W58.

Public API:
  from shared.governance import Governance, GovernanceCheck
  from shared.validation import Validation, validate
  from shared.ichar import create_ichar, IcharPersona
  from shared.queens import load_queens, QUEENS
  from shared.sigil import emit_sigil, SigilLine
"""

from .governance import Governance, GovernanceCheck
from .validation import Validation, validate
from .ichar import create_ichar, IcharPersona
from .queens import QUEENS, load_queens
from .sigil import emit_sigil, SigilLine

__version__ = "1.0.0"
__all__ = [
    "Governance", "GovernanceCheck",
    "Validation", "validate",
    "create_ichar", "IcharPersona",
    "QUEENS", "load_queens",
    "emit_sigil", "SigilLine",
]
