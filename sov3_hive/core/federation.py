"""
federation.py — the csoai.org 4-hive federation.

4 hives (SOV3, MEOK, CSOAI-RI, Sovereign-Community) give PBFT f=1 tolerance.
Hash-chained attestations, tamper-evident, persisted to JSONL.
"""
from __future__ import annotations

import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

from .horus import HorusHive, HorusTicket, HorusVerdict
from .king_hive import KingHive, TicketStatus
from .sigil_v2 import Sigil, Hemisphere, MsgKind, make_sigil, DEFAULT_SECRET


class AttestationKind(str, Enum):
    DIAMOND = "diamond"
    COMPLIANCE = "compliance"
    BOOTSTRAP = "bootstrap"
    INTEGRATION = "integration"
    REGULATORY = "regulatory"
    COMPETITIVE = "competitive"
    ARCHITECTURE = "architecture"


@dataclass
class Attestation:
    attestation_id: str
    kind: AttestationKind
    subject: str
    claim: Dict[str, Any]
    submitter: str = "csoai.org"
    created_at: float = field(default_factory=time.time)
    horus_ticket: Optional[HorusTicket] = None
    sigil: Optional[Sigil] = None
    prev_hash: str = ""
    attestation_hash: str = ""
    status: str = "pending"
    meta_leader: str = ""
    meta_confidence: float = 0.0

    def compute_hash(self) -> str:
        body = json.dumps({
            "id": self.attestation_id, "kind": self.kind.value,
            "subject": self.subject, "claim": self.claim,
            "prev_hash": self.prev_hash, "created_at": self.created_at,
        }, sort_keys=True, separators=(",", ":"))
        self.attestation_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
        return self.attestation_hash


class Federation:
    def __init__(self, secret: str = DEFAULT_SECRET,
                 log_path: Optional[str] = None,
                 use_real_hives: bool = False) -> None:
        self.secret = secret
        if use_real_hives:
            from .real_hives import all_4_real_hives
            self.hives: Dict[str, Any] = all_4_real_hives()
        else:
            self.hives = {
                "sov3":            KingHive(secret=secret),
                "meok":            KingHive(secret=secret),
                "csoai-ri":        KingHive(secret=secret),
                "sovereign-comm":  KingHive(secret=secret),
            }
        self.horus = HorusHive(self.hives, secret=secret)
        self.log: List[Attestation] = []
        self._log_path = Path(log_path) if log_path else None
        if self._log_path and self._log_path.exists():
            self._load_log()

    def probe_all(self) -> Dict[str, str]:
        out: Dict[str, str] = {}
        for hid, hive in self.hives.items():
            if hasattr(hive, "ping"):
                p = hive.ping()
                out[hid] = p.last_status
            else:
                out[hid] = "n/a"
        return out

    def attest(self, kind: AttestationKind, subject: str, claim: Dict[str, Any],
               submitter: str = "csoai.org",
               extra_proposal: Optional[str] = None) -> Attestation:
        prev_hash = self.log[-1].attestation_hash if self.log else ("0" * 64)
        a = Attestation(
            attestation_id=str(uuid.uuid4()),
            kind=kind, subject=subject, claim=claim,
            submitter=submitter, prev_hash=prev_hash,
        )

        proposal = f"[{kind.value}] {subject}: " + json.dumps(claim, sort_keys=True)[:200]
        if extra_proposal:
            proposal += " | " + extra_proposal

        ticket = self.horus.arbitrate(proposal)
        a.horus_ticket = ticket
        a.meta_leader = ticket.meta_leader
        a.meta_confidence = ticket.meta_confidence
        a.status = ticket.verdict.value

        sigil = make_sigil(
            src="sov3://horus/horus-01",
            dst=f"sov3://csoai.org/attest/{a.attestation_id}",
            hemisphere=Hemisphere.KING, kind=MsgKind.AUDIT,
            body={
                "attestation_id": a.attestation_id, "kind": kind.value,
                "subject": subject, "claim": claim,
                "verdict": ticket.verdict.value,
                "meta_leader": ticket.meta_leader,
                "meta_confidence": ticket.meta_confidence,
            },
        )
        sigil.sign(self.secret)
        a.sigil = sigil

        a.compute_hash()
        body_with_sig = json.dumps({
            "id": a.attestation_id, "kind": a.kind.value,
            "subject": a.subject, "claim": a.claim,
            "prev_hash": a.prev_hash, "created_at": a.created_at,
            "sigil": sigil.signature, "horus_verdict": ticket.verdict.value,
        }, sort_keys=True, separators=(",", ":"))
        a.attestation_hash = hashlib.sha256(body_with_sig.encode("utf-8")).hexdigest()

        self.log.append(a)
        self._persist(a)
        return a

    def get(self, attestation_id: str) -> Optional[Attestation]:
        for a in self.log:
            if a.attestation_id == attestation_id:
                return a

    def get_by_hash(self, attestation_hash: str) -> Optional[Attestation]:
        for a in self.log:
            if a.attestation_hash == attestation_hash:
                return a

    def verify_chain(self) -> bool:
        prev = "0" * 64
        for a in self.log:
            if a.prev_hash != prev:
                return False
            if a.sigil and not a.sigil.verify(self.secret):
                return False
            body = json.dumps({
                "id": a.attestation_id, "kind": a.kind.value,
                "subject": a.subject, "claim": a.claim,
                "prev_hash": a.prev_hash, "created_at": a.created_at,
                "sigil": a.sigil.signature if a.sigil else "",
                "horus_verdict": a.status,
            }, sort_keys=True, separators=(",", ":"))
            expected = hashlib.sha256(body.encode("utf-8")).hexdigest()
            if a.attestation_hash != expected:
                return False
            prev = a.attestation_hash
        return True

    def status(self) -> Dict[str, Any]:
        n = len(self.log)
        by_kind: Dict[str, int] = {}
        for a in self.log:
            by_kind[a.kind.value] = by_kind.get(a.kind.value, 0) + 1
        by_status: Dict[str, int] = {}
        for a in self.log:
            by_status[a.status] = by_status.get(a.status, 0) + 1
        return {
            "hives": list(self.hives.keys()),
            "horus": self.horus.status(),
            "attestations_total": n,
            "by_kind": by_kind, "by_status": by_status,
            "chain_valid": self.verify_chain(),
            "tip_hash": self.log[-1].attestation_hash if self.log else None,
        }

    def _persist(self, a: Attestation) -> None:
        if not self._log_path:
            return
        self._log_path.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "attestation_id": a.attestation_id, "kind": a.kind.value,
            "subject": a.subject, "claim": a.claim,
            "submitter": a.submitter, "created_at": a.created_at,
            "prev_hash": a.prev_hash, "attestation_hash": a.attestation_hash,
            "status": a.status, "meta_leader": a.meta_leader,
            "meta_confidence": a.meta_confidence,
            "sigil": a.sigil.to_dict() if a.sigil else None,
        }
        with self._log_path.open("a") as f:
            f.write(json.dumps(record, separators=(",", ":")) + "\n")

    def _load_log(self) -> None:
        if not self._log_path or not self._log_path.exists():
            return
        self.log = []
        for line in self._log_path.read_text().splitlines():
            if not line.strip():
                continue
            d = json.loads(line)
            a = Attestation(
                attestation_id=d["attestation_id"],
                kind=AttestationKind(d["kind"]),
                subject=d["subject"], claim=d["claim"],
                submitter=d.get("submitter", "csoai.org"),
                created_at=d["created_at"], prev_hash=d["prev_hash"],
                attestation_hash=d["attestation_hash"],
                status=d["status"],
                meta_leader=d.get("meta_leader", ""),
                meta_confidence=d.get("meta_confidence", 0.0),
            )
            if d.get("sigil"):
                a.sigil = Sigil.from_dict(d["sigil"])
            self.log.append(a)
            from .horus import HorusVerdict
            verdict = (HorusVerdict(a.status)
                       if a.status in {v.value for v in HorusVerdict}
                       else HorusVerdict.NO_QUORUM)
            ht = HorusTicket(
                ticket_id=str(uuid.uuid4()),
                proposal=f"replay: {a.subject}",
                verdict=verdict, meta_leader=a.meta_leader,
                meta_confidence=a.meta_confidence,
                created_at=a.created_at, certified_at=a.created_at,
            )
            self.horus.tickets.append(ht)
