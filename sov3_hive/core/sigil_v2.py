"""
sigil_v2.py — the SIGIL v2 protocol.

Every message in the hive flows through this. The v2 contract is:
  - Hemisphere-aware routing (right/left/both)
  - HMAC-SHA256 signed envelope, compact pipe-delimited encoding
  - TTL + nonce + monotonic counter for replay resistance
  - Charter-article tagging for compliance anchoring
"""
from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class Hemisphere(str, Enum):
    RIGHT = "right"
    LEFT = "left"
    BOTH = "both"
    KING = "king"
    NONE = "none"


class MsgKind(str, Enum):
    THINK = "think"
    ANALYZE = "analyze"
    SYNTHESIZE = "synthesize"
    DELEGATE = "delegate"
    PERCEIVE = "perceive"
    VOTE = "vote"
    CERTIFY = "certify"
    AUDIT = "audit"
    CHARTER = "charter"
    LEARN = "learn"
    QUERY = "query"
    DREAM = "dream"
    PING = "ping"
    PONG = "pong"
    HELLO = "hello"
    GOODBYE = "goodbye"


@dataclass
class Sigil:
    version: str = "v2"
    msg_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    src: str = ""
    dst: str = ""
    hemisphere: Hemisphere = Hemisphere.NONE
    kind: MsgKind = MsgKind.PING
    timestamp: float = field(default_factory=lambda: time.time())
    ttl_seconds: int = 60
    nonce: str = field(default_factory=lambda: secrets.token_hex(8))
    body: Dict[str, Any] = field(default_factory=dict)
    charter_refs: List[int] = field(default_factory=list)
    counter: int = 0
    signature: str = ""
    content_hash: str = ""

    def _canonical_body(self) -> str:
        return json.dumps(self.body, sort_keys=True, separators=(",", ":"))

    def compute_content_hash(self) -> str:
        self.content_hash = hashlib.sha256(self._canonical_body().encode("utf-8")).hexdigest()
        return self.content_hash

    def sign(self, secret: str) -> str:
        self.compute_content_hash()
        payload = "|".join([
            self.version, self.msg_id, self.src, self.dst,
            self.hemisphere.value, self.kind.value,
            f"{self.timestamp:.6f}", str(self.ttl_seconds),
            self.nonce, str(self.counter), self.content_hash,
        ])
        self.signature = hmac.new(
            secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        return self.signature

    def verify(self, secret: str) -> bool:
        if not self.signature:
            return False
        self.compute_content_hash()
        payload = "|".join([
            self.version, self.msg_id, self.src, self.dst,
            self.hemisphere.value, self.kind.value,
            f"{self.timestamp:.6f}", str(self.ttl_seconds),
            self.nonce, str(self.counter), self.content_hash,
        ])
        expected = hmac.new(
            secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, self.signature)

    def is_expired(self, now: Optional[float] = None) -> bool:
        now = now if now is not None else time.time()
        return (now - self.timestamp) > self.ttl_seconds

    def to_compact(self) -> str:
        return "|".join([
            self.version, self.msg_id, self.src, self.dst,
            self.hemisphere.value, self.kind.value,
            f"{self.timestamp:.6f}", str(self.ttl_seconds),
            self.nonce, str(self.counter), self.content_hash, self.signature,
        ])

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["hemisphere"] = self.hemisphere.value
        d["kind"] = self.kind.value
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Sigil":
        d = dict(d)
        d["hemisphere"] = Hemisphere(d.get("hemisphere", "none"))
        d["kind"] = MsgKind(d.get("kind", "ping"))
        d.setdefault("charter_refs", [])
        return cls(**d)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))

    @classmethod
    def from_json(cls, s: str) -> "Sigil":
        return cls.from_dict(json.loads(s))


def make_sigil(src: str, dst: str, hemisphere: Hemisphere, kind: MsgKind,
               body: Dict[str, Any], charter_refs: Optional[List[int]] = None,
               counter: int = 0, ttl: int = 60) -> Sigil:
    return Sigil(
        src=src, dst=dst, hemisphere=hemisphere, kind=kind,
        body=body, charter_refs=charter_refs or [],
        counter=counter, ttl_seconds=ttl,
    )


DEFAULT_SECRET = "sov3-sigil-v2-default-key"
