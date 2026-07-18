"""CouncilOf.AI MCP — the 33-agent BFT council orchestrator.

The 3rd L6 industry pack in the DEFONEOS fleet (the OS-for-ALL expansion).
For AI governance, BFT decision-making, and any high-stakes decision that
requires a sovereign, care-ethics-certified verdict.

THE 33-AGENT COUNCIL COMPOSITION:
  - 1 King (the orchestrator, synthesizes the final verdict)
  - 12 Queens (one per hive domain: accountability, agisafe, asisecurity,
    cobolbridge, compliance, council, grabhire, landlaw, meok, openpatent,
    proofof, safety)
  - 12-around-1 PBFT (safety veto layer, quorum 2f+1 = 23/33)
  - 4 Vanguards (bias / care / sovereignty / honesty lenses)
  - 4 Specials (companion / dreamer / chronicler / cultivator)

THE 4 CARE PRINCIPLES (the Maternal Covenant):
  - Dignity (the AI respects the human, the data, the world)
  - Agency (sovereign AI, not platform AI; the human can act, not just think)
  - Safety (the law is enforced, not bypassed; no kinetic, no surveillance)
  - Solidarity (the IP is verifiable, the credit is attributable)

Inherits: MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0 (forthcoming)
           + DEFONEOS_GLOBAL_DOME_OS_FOR_ALL.md v1.0
"""

__version__ = "1.0.0"
__alignment__ = "DEFONEOS_GLOBAL_DOME_OS_FOR_ALL.md v1.0 + MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v3.0"
__council_size__ = 33
__council_quorum__ = 23
__care_score_threshold__ = 0.95

import re

from councilof_mcp.server import (
    COUNCIL_MEMBERS,
    BANNED_TERMS,
    BannedTermGate,
    _all_member_ids,
    convene_council,
    get_verdict,
    list_council_members,
    cast_vote,
    simulate_council,
    evaluate_care_principle,
)

__version__ = "1.0.0"
