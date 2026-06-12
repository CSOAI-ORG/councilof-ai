"""
real_hives.py — the 4 real hives behind csoai.org.

Each hive runs a live HTTP probe to its backend. If the backend is down,
the hive fails safe (all 12 queens vote against).

The 4 hives:
  1. SOV3            — :3101 (sovereign-mcp-server, 6 trained NNs)
  2. MEOK            — api.meok.ai (47 MCPs gateway)
  3. Sovereign-Comm  — :11434 Ollama (local sovereign models)
  4. CSOAI-RI        — csoai.org itself (self-reference)
"""
from __future__ import annotations

import os
import ssl
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from .king_hive import KingHive, ConsensusTicket
from ..ghives.queen_ghives import QueenSwarm, QueenVote, Ghive


class HiveStatus(str, Enum):
    LIVE = "live"
    DEGRADED = "degraded"
    DORMANT = "dormant"


@dataclass
class HiveProbe:
    name: str
    url: str
    last_status: str = "unknown"
    last_latency_ms: float = 0.0
    last_checked: float = 0.0
    last_body: str = ""


def _probe(url: str, timeout: float = 4.0) -> HiveProbe:
    """One HTTP probe. Stdlib only. Uses unverified SSL on macOS."""
    p = HiveProbe(name=url, url=url)
    t0 = time.time()
    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-horus/1.0"})
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            p.last_body = r.read(200).decode("utf-8", errors="replace")[:200]
            p.last_status = "ok" if r.status < 500 else "down"
    except urllib.error.HTTPError as e:
        p.last_body = f"HTTP {e.code}"
        p.last_status = "ok" if e.code < 500 else "down"
    except Exception as e:
        p.last_body = f"{type(e).__name__}: {str(e)[:100]}"
        p.last_status = "down"
    p.last_latency_ms = (time.time() - t0) * 1000.0
    p.last_checked = time.time()
    return p


class RealHive(KingHive):
    def __init__(self, name: str, probe_url: str, secret: str = "sov3-sigil-v2-default-key"):
        super().__init__(secret=secret)
        self.hive_name = name
        self.probe_url = probe_url
        self.last_probe: Optional[HiveProbe] = None
        self.backend_status: HiveStatus = HiveStatus.DORMANT

    def ping(self) -> HiveProbe:
        p = _probe(self.probe_url)
        self.last_probe = p
        self.backend_status = HiveStatus.LIVE if p.last_status == "ok" else HiveStatus.DEGRADED
        return p

    def run_queens_on(self, prompt: str, decide: Optional[Callable] = None) -> ConsensusTicket:
        p = self.ping()
        backend_ok = (p.last_status == "ok")
        t = self.open_ticket(proposal=prompt, proposer=f"hive://{self.hive_name}")

        if backend_ok:
            votes = self.queens.cast_votes(prompt, decide or self._default_decide(prompt))
        else:
            votes = [QueenVote(
                ghive=g.domain.value, vote="against", weight=g.weight,
                confidence=1.0, rationale=f"backend degraded: {p.last_status}",
            ) for g in self.queens.all()]
        self.cast_votes(t.ticket_id, votes)
        return self.certify(t.ticket_id, rationale=f"hive={self.hive_name} backend={p.last_status}")

    def _default_decide(self, prompt: str) -> Callable[[Ghive], QueenVote]:
        def decide(g: Ghive) -> QueenVote:
            if any(bad in prompt.lower() for bad in ("exploit", "harm", "bypass", "ignore safety")):
                return QueenVote(ghive=g.domain.value, vote="against", weight=g.weight,
                                 confidence=0.99, rationale="charter violation")
            return QueenVote(ghive=g.domain.value, vote="for", weight=g.weight,
                             confidence=0.9, rationale=f"{self.hive_name} verified")
        return decide

    def status_dict(self) -> Dict[str, Any]:
        d = self.status()
        d["hive_name"] = self.hive_name
        d["probe_url"] = self.probe_url
        d["backend_status"] = self.last_probe.last_status if self.last_probe else "unknown"
        d["backend_latency_ms"] = self.last_probe.last_latency_ms if self.last_probe else 0.0
        d["live"] = self.backend_status == HiveStatus.LIVE
        return d


def make_sov3_hive() -> RealHive:
    return RealHive(name="sov3", probe_url="http://127.0.0.1:3101/health")


def make_meok_hive() -> RealHive:
    return RealHive(name="meok", probe_url="https://api.meok.ai/")


def make_sov_community_hive() -> RealHive:
    return RealHive(name="sovereign-comm", probe_url="http://127.0.0.1:11434/api/tags")


def make_csoai_ri_hive() -> RealHive:
    port = int(os.environ.get("CSOAI_RI_PORT",
                              os.environ.get("CSOAI_PORT", "8766")))
    return RealHive(name="csoai-ri", probe_url=f"http://127.0.0.1:{port}/health")


def all_4_real_hives() -> Dict[str, RealHive]:
    return {
        "sov3":           make_sov3_hive(),
        "meok":           make_meok_hive(),
        "sovereign-comm": make_sov_community_hive(),
        "csoai-ri":       make_csoai_ri_hive(),
    }
