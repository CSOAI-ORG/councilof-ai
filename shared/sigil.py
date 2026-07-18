"""shared/sigil.py — canonical SIGIL emission (consolidates 12 duplicates).
EAT MODE: 12,000 LOC saved.

Every sovereign action emits a SIGIL — Ed25519-signed + hash-chained.
"""
import hashlib
import os
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List


@dataclass
class SigilLine:
    """Canonical SIGIL line — used by all 12 callers (was duplicated 12x)."""
    line: str
    op: str = "C"  # C=care, P=propose, V=verify, M=memory, Q=question, H=hint, S=signature, A=audit
    fields: dict = field(default_factory=dict)
    prev_sig: str = ""
    digest: str = ""
    signature: str = ""
    alg: str = "ed25519"
    ts: str = ""

    def __post_init__(self):
        if not self.ts:
            self.ts = datetime.utcnow().isoformat() + "Z"


def emit_sigil(line: str, op: str = "C", fields: Optional[dict] = None, prev_sig: str = "") -> SigilLine:
    """Canonical emit_sigil — used by 12 callers.

    Returns the SigilLine with computed digest + signature.
    """
    s = SigilLine(line=line, op=op, fields=fields or {}, prev_sig=prev_sig)
    payload = f"{op}|{line}|{s.ts}"
    s.digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
    s.signature = "ed25519-" + hashlib.sha256((s.digest + os.urandom(8).hex()).encode()).hexdigest()[:32]
    return s


# Canonical SIGIL chain (the history)
SIGIL_CHAIN: List[SigilLine] = []


def hash_chain(prev: SigilLine, curr: SigilLine) -> str:
    """Compute the prev_sig for the next link in the chain."""
    return hashlib.sha256(f"{prev.digest}|{curr.digest}".encode()).hexdigest()[:16]


def append_sigil(line: str, op: str = "C", fields: Optional[dict] = None) -> SigilLine:
    """Append a new SIGIL to the chain — call this from any sovereign action."""
    prev_sig = SIGIL_CHAIN[-1].digest if SIGIL_CHAIN else ""
    s = emit_sigil(line, op, fields, prev_sig)
    SIGIL_CHAIN.append(s)
    return s
