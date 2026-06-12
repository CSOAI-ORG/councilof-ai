"""
horus.py — the HORUS meta-hive.

HORUS sits above multiple King Hives and reaches meta-consensus on
proposals that span more than one hive. Uses the same SIGIL protocol.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from .sigil_v2 import Sigil, Hemisphere, MsgKind, make_sigil, DEFAULT_SECRET
from ..core.king_hive import KingHive, ConsensusTicket, TicketStatus


class HorusVerdict(str, Enum):
    CERTIFIED = "certified"
    NO_QUORUM = "no_quorum"
    CONFLICT = "conflict"


@dataclass
class HiveVerdict:
    hive_id: str
    hive_name: str
    ticket_id: str
    status: str
    leader: str
    confidence: float
    timestamp: float = field(default_factory=time.time)


@dataclass
class HorusTicket:
    ticket_id: str
    proposal: str
    hive_verdicts: List[HiveVerdict] = field(default_factory=list)
    verdict: HorusVerdict = HorusVerdict.NO_QUORUM
    meta_leader: str = ""
    meta_confidence: float = 0.0
    created_at: float = field(default_factory=time.time)
    certified_at: Optional[float] = None
    audit: List[Dict[str, Any]] = field(default_factory=list)

    def add_audit(self, event: str, **details: Any) -> None:
        self.audit.append({"ts": time.time(), "event": event, **details})


class HorusHive:
    def __init__(self, hives: Optional[Dict[str, KingHive]] = None,
                 secret: str = DEFAULT_SECRET) -> None:
        self.secret = secret
        self.hives: Dict[str, KingHive] = hives or {}
        self.tickets: List[HorusTicket] = []
        self._log: List[Sigil] = []
        self._recompute_quorum()

    def _recompute_quorum(self) -> None:
        self.n = len(self.hives)
        if self.n <= 1:
            self.f, self.quorum = 0, self.n
            return
        if self.n == 2:
            self.f, self.quorum = 0, 2
            return
        if self.n == 3:
            self.f, self.quorum = 0, 2  # clean majority, no fault tolerance
            return
        self.f = (self.n - 1) // 3
        self.quorum = 2 * self.f + 1

    def register(self, hive_id: str, hive: KingHive, name: Optional[str] = None) -> None:
        self.hives[hive_id] = hive
        hive._secret = self.secret
        self._recompute_quorum()

    def _signed(self, src: str, dst: str, kind: MsgKind, body: Dict[str, Any]) -> Sigil:
        s = make_sigil(src=src, dst=dst, hemisphere=Hemisphere.KING,
                       kind=kind, body=body)
        s.sign(self.secret)
        self._log.append(s)
        return s

    def fanout(self, proposal: str) -> List[HiveVerdict]:
        verdicts: List[HiveVerdict] = []
        self._signed("sov3://horus/horus-01", "sov3://broadcast",
                     MsgKind.HELLO, {"proposal": proposal})
        for hid, king in self.hives.items():
            try:
                t = king.run_queens_on(f"[{hid}] {proposal}")
                verdicts.append(HiveVerdict(
                    hive_id=hid, hive_name=hid, ticket_id=t.ticket_id,
                    status=t.status.value, leader=t.leader()[0],
                    confidence=(t.leader()[1] / max(1, len(t.votes))),
                ))
            except Exception:
                verdicts.append(HiveVerdict(
                    hive_id=hid, hive_name=hid, ticket_id="",
                    status="error", leader="", confidence=0.0,
                ))
        return verdicts

    def arbitrate(self, proposal: str) -> HorusTicket:
        ticket = HorusTicket(ticket_id=str(uuid.uuid4()), proposal=proposal)
        ticket.add_audit("opened", hives=len(self.hives),
                         quorum=self.quorum, f=self.f)
        verdicts = self.fanout(proposal)
        ticket.hive_verdicts = verdicts

        leaders: Dict[str, int] = {}
        for v in verdicts:
            if v.status == "certified" and v.leader:
                leaders[v.leader] = leaders.get(v.leader, 0) + 1

        if not leaders:
            ticket.verdict = HorusVerdict.NO_QUORUM
            ticket.add_audit("no_leaders", reason="no hive certified")
        else:
            sorted_leaders = sorted(leaders.items(), key=lambda kv: kv[1], reverse=True)
            winner, count = sorted_leaders[0]
            runner_up = sorted_leaders[1][1] if len(sorted_leaders) > 1 else 0
            margin = count - runner_up

            if count >= self.quorum and margin > self.f:
                ticket.verdict = HorusVerdict.CERTIFIED
                ticket.meta_leader = winner
                ticket.meta_confidence = count / max(1, len(verdicts))
                ticket.certified_at = time.time()
                ticket.add_audit("certified", winner=winner, count=count, margin=margin)
            else:
                ticket.verdict = HorusVerdict.NO_QUORUM
                ticket.add_audit("no_quorum", leaders=leaders, margin=margin)

        if (ticket.verdict == HorusVerdict.NO_QUORUM
                and len(leaders) >= 2):
            ticket.verdict = HorusVerdict.CONFLICT
            ticket.add_audit("conflict", leaders=leaders)

        self.tickets.append(ticket)
        return ticket

    def status(self) -> Dict[str, Any]:
        return {
            "hives": list(self.hives.keys()),
            "n": self.n, "f": self.f, "quorum": self.quorum,
            "tickets_total": len(self.tickets),
            "certified": sum(1 for t in self.tickets if t.verdict == HorusVerdict.CERTIFIED),
            "no_quorum": sum(1 for t in self.tickets if t.verdict == HorusVerdict.NO_QUORUM),
            "conflict": sum(1 for t in self.tickets if t.verdict == HorusVerdict.CONFLICT),
        }
