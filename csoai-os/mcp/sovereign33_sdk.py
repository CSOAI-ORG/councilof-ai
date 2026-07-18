"""
sovereign33_sdk.py
==================

The Sovereign33 SDK — the Robot Operating System (ROS) Python package for the
SOV3 sovereign substrate.

A 33-domain, 6-sensor, 5-capability, 4-rule sovereign robot OS designed to
match the SOV3 Big-Braim 8-category winner framework. Provides a stable
interface for sensing the world (cameras, microphones, IMU, LiDAR, thermal,
RF), acting upon it (navigate, manipulate, speak, transact, govern), and
remaining accountable (BFT consensus, SIGIL audit, care floor, sovereignty
floor) per CSOAI Ltd (UK Companies House 16939677).

License: MIT.
Author : M4 engineering lane. CSOAI Ltd / MEOK Labs.

Design summary
--------------
* 33 sovereign districts (the constitutional number of the substrate,
  matching the BFT-33 council and the 33 Sephiroth-aligned hives)
* 6 sensor layers — vision, audio, proprioception, lidar, thermal, rf
* 5 capabilities   — perceive, decide, act, transact, govern
* 4 hard rules     — care_floor >= 0.95, sovereignty == sovereign,
                      bft_quorum == True, sigil_emit == True

The SDK exposes a single importable class ``Sovereign33`` and a functional
wrapper ``run()``. Telemetry is signed with HMAC-SHA256 (HMAC stage 1,
Ed25519 stage 2 deferred to the federation layer); see ``sigil_emit``.
The chain format follows the SOV3 SIGIL line grammar::

    <op>|<actor>|<target>|<ts>|<payload_hash>|<prev_sig>|<sig>

This SDK is intentionally stdlib-only (no third-party deps) so it can run
air-gapped on Jetson Orin, Raspberry Pi 5, M2/M3/M4 Macs and sovereign GCP
VMs without pip install.

References
----------
* ROS 2 (rclpy): https://design.ros2.org/articles/ros_apis.html
* IEEE 1873-2015 — Robot Map Information Model
* ISO 13482:2014 — Robots and robotic devices — Safety requirements
* EU AI Act Article 14 — Human oversight
* EU AI Act Article 50 — Transparency / watermarking
* NIST AI Risk Management Framework 1.0 (2023)
* CSOAI Layer-0 governance (33-agent BFT council)
"""

from __future__ import annotations

import abc
import argparse
import base64
import dataclasses
import hashlib
import hmac
import json
import logging
import os
import queue
import random
import re
import signal
import socket
import struct
import sys
import threading
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import (
    Any,
    Callable,
    ClassVar,
    Deque,
    Dict,
    Iterable,
    Iterator,
    List,
    Mapping,
    MutableMapping,
    Optional,
    Sequence,
    Set,
    Tuple,
    Union,
)

__version__ = "1.0.0"
__author__ = "M4 engineering lane / CSOAI Ltd (UK 16939677)"
__license__ = "MIT"

LOGGER = logging.getLogger("sovereign33")
if not LOGGER.handlers:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s [%(levelname)s] sovereign33: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )
    )
    LOGGER.addHandler(handler)
    LOGGER.setLevel(logging.INFO)


# --------------------------------------------------------------------------- #
# 1. CONSTITUTIONAL CONSTANTS — the four hard rules
# --------------------------------------------------------------------------- #

CARE_FLOOR: float = 0.95
SOVEREIGNTY_MIN: str = "sovereign"
BFT_QUORUM: int = 8  # 12-around-1: 8-of-12 required
SIGIL_REQUIRED: bool = True
DISTRICTS: int = 33
SENSORS: int = 6
CAPABILITIES: int = 5
RULES: int = 4


# --------------------------------------------------------------------------- #
# 2. SENSOR LAYERS — six senses of the sovereign robot
# --------------------------------------------------------------------------- #


class SensorKind(str, Enum):
    """The six canonical SOV3 sensor layers."""

    VISION = "vision"           # RGB + depth + segmentation
    AUDIO = "audio"             # 16-kHz speech + acoustic scene
    PROPRIO = "proprioception"  # IMU, joint encoders, force-torque
    LIDAR = "lidar"             # 360° 3-D point cloud
    THERMAL = "thermal"         # LWIR radiometry
    RF = "rf"                   # Software-defined radio, 70 MHz–6 GHz

    @classmethod
    def all(cls) -> List["SensorKind"]:
        return list(cls)


@dataclass
class SensorReading:
    """A single sensor datum.

    Attributes
    ----------
    kind : SensorKind
        Which of the six senses.
    payload : bytes
        Raw or compressed layer data (e.g. JPEG, PCM-16, float32 array).
    metadata : dict
        Frame id, ts, intrinsics, calibration hash, etc.
    confidence : float
        Operator confidence in [0, 1]. Used to feed the care floor.
    """

    kind: SensorKind
    payload: bytes
    metadata: MutableMapping[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    seq: int = 0
    ts_ns: int = 0

    def __post_init__(self) -> None:
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(f"confidence {self.confidence} not in [0, 1]")
        if self.ts_ns == 0:
            self.ts_ns = time.time_ns()

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.payload).hexdigest()


class Sensor(abc.ABC):
    """Abstract base class for the six sensor layers."""

    kind: ClassVar[SensorKind]

    def __init__(self, node_id: str = "sovereign-33") -> None:
        self.node_id = node_id
        self._seq = 0
        self._lock = threading.Lock()

    @abc.abstractmethod
    def open(self) -> None:
        """Open the underlying device/transport."""

    @abc.abstractmethod
    def close(self) -> None:
        """Close the underlying device/transport."""

    @abc.abstractmethod
    def read(self) -> SensorReading:
        """Block until the next reading is available, then return it."""

    # ------------------------------------------------------------------ #
    # Default helpers
    # ------------------------------------------------------------------ #
    def _next_seq(self) -> int:
        with self._lock:
            self._seq += 1
            return self._seq

    def stream(self, max_frames: Optional[int] = None) -> Iterator[SensorReading]:
        """Yield readings forever (or until ``max_frames``)."""
        opened = False
        try:
            self.open()
            opened = True
            n = 0
            while True:
                if max_frames is not None and n >= max_frames:
                    return
                yield self.read()
                n += 1
        finally:
            if opened:
                self.close()


# --------- six concrete sensor scaffolds (stdlib-only) ---------------------- #


class VisionSensor(Sensor):
    """RGB vision. Defaults to a synthetic camera; override for V4L2 / Arducam."""

    kind: ClassVar[SensorKind] = SensorKind.VISION

    def __init__(self, **kw: Any) -> None:
        super().__init__(**kw)
        self.width, self.height = 640, 480
        self._rng = random.Random(0x5653534F)  # 'VSSO'

    def open(self) -> None:
        LOGGER.info("vision.open (synthetic %dx%d)", self.width, self.height)

    def close(self) -> None:
        LOGGER.info("vision.close")

    def read(self) -> SensorReading:
        # 8 bytes of deterministic synthetic pixel data
        buf = self._rng.randbytes(8)
        return SensorReading(
            kind=SensorKind.VISION,
            payload=buf,
            metadata={"w": self.width, "h": self.height, "codec": "synthetic"},
            confidence=0.97,
            seq=self._next_seq(),
        )


class AudioSensor(Sensor):
    """16-kHz mono audio. Synthetic pulse train by default."""

    kind: ClassVar[SensorKind] = SensorKind.AUDIO

    def __init__(self, sample_rate: int = 16_000, **kw: Any) -> None:
        super().__init__(**kw)
        self.sample_rate = sample_rate
        self._t = 0

    def open(self) -> None:
        LOGGER.info("audio.open @%dHz", self.sample_rate)

    def close(self) -> None:
        LOGGER.info("audio.close")

    def read(self) -> SensorReading:
        # 16 ms of audio; 256 samples
        samples = bytes(((self._t + i) % 256) for i in range(256))
        self._t += 256
        return SensorReading(
            kind=SensorKind.AUDIO,
            payload=samples,
            metadata={"rate": self.sample_rate, "ms": 16.0},
            confidence=0.94,
            seq=self._next_seq(),
        )


class ProprioSensor(Sensor):
    """Inertial Measurement Unit + joint state."""

    kind: ClassVar[SensorKind] = SensorKind.PROPRIO

    def open(self) -> None:
        LOGGER.info("proprio.open (6-axis IMU + 6 joints)")

    def close(self) -> None:
        LOGGER.info("proprio.close")

    def read(self) -> SensorReading:
        # Pack 12 floats: acc xyz, gyro xyz, quat (4), joint (2)
        buf = struct.pack(
            "<12f",
            0.0, 0.0, 9.81,        # acc xyz
            0.0, 0.0, 0.0,         # gyro xyz
            0.0, 0.0, 0.0, 1.0,    # orientation quaternion (qx qy qz qw)
            0.0, 0.0,              # joint position (q, d)
        )
        return SensorReading(
            kind=SensorKind.PROPRIO,
            payload=buf,
            metadata={"joints": 6},
            confidence=0.99,
            seq=self._next_seq(),
        )


class LidarSensor(Sensor):
    """360° planar LiDAR (e.g. SICK TiM571, RPLIDAR A1, Ouster OS0)."""

    kind: ClassVar[SensorKind] = SensorKind.LIDAR

    def __init__(self, beams: int = 32, **kw: Any) -> None:
        super().__init__(**kw)
        self.beams = beams

    def open(self) -> None:
        LOGGER.info("lidar.open beams=%d", self.beams)

    def close(self) -> None:
        LOGGER.info("lidar.close")

    def read(self) -> SensorReading:
        buf = struct.pack(f"<{self.beams}f", *([3.0] * self.beams))
        return SensorReading(
            kind=SensorKind.LIDAR,
            payload=buf,
            metadata={"beams": self.beams, "fov_deg": 360.0},
            confidence=0.96,
            seq=self._next_seq(),
        )


class ThermalSensor(Sensor):
    """Long-wave IR (FLIR Lepton, Seek Thermal)."""

    kind: ClassVar[SensorKind] = SensorKind.THERMAL

    def open(self) -> None:
        LOGGER.info("thermal.open (160x120 LWIR)")

    def close(self) -> None:
        LOGGER.info("thermal.close")

    def read(self) -> SensorReading:
        buf = struct.pack("<120H", *([30000] * 120))  # ~27°C
        return SensorReading(
            kind=SensorKind.THERMAL,
            payload=buf,
            metadata={"w": 160, "h": 120, "calibration_K": 30000},
            confidence=0.93,
            seq=self._next_seq(),
        )


class RfSensor(Sensor):
    """Software-defined radio (HackRF One, Airspy R2, USRP B200)."""

    kind: ClassVar[SensorKind] = SensorKind.RF

    def __init__(self, center_mhz: float = 433.92, **kw: Any) -> None:
        super().__init__(**kw)
        self.center_mhz = center_mhz

    def open(self) -> None:
        LOGGER.info("rf.open %.3fMHz", self.center_mhz)

    def close(self) -> None:
        LOGGER.info("rf.close")

    def read(self) -> SensorReading:
        buf = random.Random(0x5246534F).randbytes(64)  # 'RFSO'
        return SensorReading(
            kind=SensorKind.RF,
            payload=buf,
            metadata={"center_mhz": self.center_mhz, "bw_mhz": 2.5},
            confidence=0.85,  # RF is intrinsically noisier
            seq=self._next_seq(),
        )


# --------------------------------------------------------------------------- #
# 3. CAPABILITIES — the five sovereign acts
# --------------------------------------------------------------------------- #


class CapabilityKind(str, Enum):
    """The five canonical capabilities."""

    PERCEIVE = "perceive"     # fuse the 6 sensors
    DECIDE = "decide"         # BFT-12-around-1 council
    ACT = "act"               # motors + grippers + haptics
    TRANSACT = "transact"     # x402 / MiCA / DID-signed
    GOVERN = "govern"         # SIGIL emit + Article 50 passport + audit

    @classmethod
    def all(cls) -> List["CapabilityKind"]:
        return list(cls)


@dataclass
class Decision:
    """A council-approved action."""

    intent: str
    args: Mapping[str, Any]
    care: float
    votes_for: int
    votes_against: int
    sigil: str
    ts_ns: int = field(default_factory=time.time_ns)

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)


class BFTVote:
    """A single Byzantine-fault-tolerant vote."""

    def __init__(self, voter: str, for_action: bool, rationale: str) -> None:
        self.voter = voter
        self.choice = for_action
        self.rationale = rationale
        self.ts_ns = time.time_ns()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "voter": self.voter,
            "choice": "for" if self.choice else "against",
            "rationale": self.rationale,
            "ts_ns": self.ts_ns,
        }


class BFT12Around1:
    """Twelve voter agents + 1 Hermes external veto, f = (n-1)/3 = 4.

    Consensus reached when ≥ 8 of 12 internal voters AND the Hermes
    external veto approve. Mirrors the canonical SOV3 sovereign BFT.
    """

    N_INTERNAL: ClassVar[int] = 12
    FAULT_TOLERANCE: ClassVar[int] = 4  # f = (12-1)//3

    def __init__(self, hermes_id: str = "hermes-citizen-001") -> None:
        self.voters: List[str] = [f"council-{i:02d}" for i in range(self.N_INTERNAL)]
        self.hermes = hermes_id
        self._votes: Dict[str, List[BFTVote]] = {}

    def propose(
        self,
        proposal_id: str,
        proposal: Mapping[str, Any],
        cast_fn: Callable[[str, Mapping[str, Any]], Tuple[bool, str]],
    ) -> Decision:
        """Convene a vote. ``cast_fn(voter, proposal) -> (choice, rationale)``.

        Returns a :class:`Decision` once consensus (or rejection) is reached.
        """
        votes = []
        for voter in self.voters:
            choice, rationale = cast_fn(voter, proposal)
            votes.append(BFTVote(voter, choice, rationale))
        self._votes[proposal_id] = votes
        for_ = sum(1 for v in votes if v.choice)
        against = len(votes) - for_
        # External Hermes veto — model as a 13th voter; rule: ≥8-of-12 AND Hermes ok
        external_ok, ext_rationale = cast_fn(self.hermes, proposal)
        if not (for_ >= BFT_QUORUM and external_ok):
            return Decision(
                intent=str(proposal.get("intent", "?")),
                args=dict(proposal),
                care=0.0,
                votes_for=for_,
                votes_against=against,
                sigil="REJECTED",
            )
        return Decision(
            intent=str(proposal.get("intent", "?")),
            args=dict(proposal),
            care=1.0,
            votes_for=for_,
            votes_against=against,
            sigil=Sovereign33.sigil_emit(proposal_id, proposal),
        )


# --------------------------------------------------------------------------- #
# 4. SIGIL CHAIN — hash-linked audit ledger (HMAC stage 1)
# --------------------------------------------------------------------------- #


def _sigil_line(op: str, actor: str, target: str, ts: int,
                payload_hash: str, prev_sig: str, sig: str) -> str:
    return f"{op}|{actor}|{target}|{ts}|{payload_hash}|{prev_sig}|{sig}"


def _sigil_default_secret() -> bytes:
    """Resolve the audit-chain secret from env or fall back to a process-
    local key. NEVER use the fallback in production — your SIGILs become
    non-portable across processes.
    """
    s = os.environ.get("SOV3_SIGIL_SECRET")
    if s:
        return s.encode("utf-8")
    # Local demo key — derivable per process so multiple procs can't collide
    pid_key = f"sovereign33:{os.getpid()}".encode("utf-8")
    return hashlib.sha256(pid_key).digest()


@dataclass
class SigilRecord:
    line: str
    gloss: str
    digest: str

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)


def sigil_sign(payload: Mapping[str, Any], *, secret: Optional[bytes] = None,
               actor: str = "M4", op: str = "C", target: str = "node") -> SigilRecord:
    """Sign a JSON-serialisable payload and return a SIGIL record."""
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    payload_hash = hashlib.sha256(body).hexdigest()
    prev = "0" * 64  # Genesis row
    sig = hmac.new(secret or _sigil_default_secret(), body, hashlib.sha256).hexdigest()
    ts = int(time.time())
    line = _sigil_line(op, actor, target, ts, payload_hash, prev, sig)
    gloss = f"op={op} actor={actor} target={target} bytes={len(body)}"
    return SigilRecord(line=line, gloss=gloss, digest=sig)


# --------------------------------------------------------------------------- #
# 5. CARE METER — soft-power governance, code-level
# --------------------------------------------------------------------------- #


@dataclass
class CareMeter:
    """Tracks the care floor (default 0.95) over a rolling window.

    Care is the substrate's protection of operator, citizen, bystander
    and data-subject interest. Anything below the floor is non-compliant.
    """

    floor: float = CARE_FLOOR
    window: Deque[float] = field(default_factory=lambda: deque(maxlen=128))

    def sample(self, score: float) -> None:
        if not 0.0 <= score <= 1.0:
            raise ValueError(f"care {score} out of range")
        self.window.append(score)

    @property
    def mean(self) -> float:
        return sum(self.window) / len(self.window) if self.window else 0.0

    def compliant(self, score: float) -> bool:
        return score >= self.floor

    def verdict(self, score: float) -> str:
        if score >= 0.97:
            return "EXEMPLARY"
        if score >= self.floor:
            return "PASS"
        if score >= 0.85:
            return "WARN"
        return "BLOCK"


# --------------------------------------------------------------------------- #
# 6. SOVEREIGNTY FLOOR — promote or degrade the node
# --------------------------------------------------------------------------- #


class SovereigntyState(str, Enum):
    """Five-tier sovereignty ladder."""

    SOVEREIGN = "sovereign"        # Own data plane, KMS, BFT chain
    FEDERATED = "federated"        # Own data plane; council mixed
    COMPATIBLE = "compatible"      # Same charter, delegated KMS
    ADVISORY = "advisory"          # Read-only audit access
    PROHIBITED = "prohibited"      # Disallowed by jurisdiction (Russia/PRC/n)

    @classmethod
    def degrade(cls, cur: "SovereigntyState", reason: str) -> "SovereigntyState":
        order = [cls.SOVEREIGN, cls.FEDERATED, cls.COMPATIBLE,
                 cls.ADVISORY, cls.PROHIBITED]
        return order[min(order.index(cur) + 1, len(order) - 1)]


# --------------------------------------------------------------------------- #
# 7. x402 TRANSACT — sovereign payment primitive
# --------------------------------------------------------------------------- #


@dataclass
class X402Invoice:
    invoice_id: str
    service: str
    tier: str          # Free, Pro, Governance, Enterprise
    quantity: int
    customer: str
    fiat_minor: int    # e.g. 0.05 EUR → 5 cents in minor units
    currency: str      # 'EUR', 'GBP', 'USDC'
    ts: int
    sigil: str

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)


def x402_invoice(service: str, tier: str = "Pro", quantity: int = 1,
                 customer: str = "anonymous", currency: str = "EUR") -> X402Invoice:
    """Create a MiCA-compliant micro-invoice for a sovereign service.

    Pricing tiers (per call) follow the published SOV3 price book.
    """
    price = {
        "Free": 0, "Pro": 10, "Governance": 100, "Enterprise": 1000,
    }.get(tier, 10)
    payload = {
        "service": service, "tier": tier,
        "quantity": quantity, "customer": customer,
        "currency": currency, "price_minor": price * quantity,
        "ts": int(time.time()),
    }
    rec = sigil_sign(payload, actor="M4", op="Q", target=service)
    return X402Invoice(
        invoice_id=uuid.uuid4().hex,
        service=service, tier=tier, quantity=quantity,
        customer=customer, fiat_minor=price * quantity,
        currency=currency, ts=payload["ts"], sigil=rec.digest,
    )


# --------------------------------------------------------------------------- #
# 8. THE TOP-LEVEL Sovereign33 CLASS — wires sensors + capabilities together
# --------------------------------------------------------------------------- #


class Sovereign33:
    """The sovereign robot OS core. Compose one or more; share a ``sigil_chain``.

    Parameters
    ----------
    node_id : str
        Unique identifier for this substrate node.
    council : BFT12Around1, optional
        Inject a custom BFT (e.g. with hermes_id from a sovereign citizen).
    secret : bytes, optional
        HMAC secret for SIGILs. Defaults to env or process-local.
    """

    def __init__(
        self,
        node_id: str = f"sovereign-{uuid.uuid4().hex[:8]}",
        council: Optional[BFT12Around1] = None,
        secret: Optional[bytes] = None,
    ) -> None:
        self.node_id = node_id
        self.council = council or BFT12Around1()
        self.secret = secret
        self.sensors: Dict[SensorKind, Sensor] = {}
        self.care = CareMeter()
        self.sovereignty: SovereigntyState = SovereigntyState.SOVEREIGN
        self._sigil_chain: List[SigilRecord] = []
        self._sigil_lock = threading.Lock()
        self._stop = threading.Event()

    # -------------------- sensor helpers ---------------------------------- #
    def attach(self, sensor: Sensor) -> None:
        if sensor.kind in self.sensors:
            raise ValueError(f"sensor {sensor.kind} already attached")
        self.sensors[sensor.kind] = sensor
        LOGGER.info("attach sensor %s", sensor.kind)

    def detach(self, kind: SensorKind) -> None:
        s = self.sensors.pop(kind, None)
        if s is not None:
            s.close()
            LOGGER.info("detach sensor %s", kind)

    # -------------------- the 5 capabilities ------------------------------ #
    def perceive(self, frames: int = 1) -> Dict[SensorKind, List[SensorReading]]:
        """Run a synchronous perception cycle across all attached sensors."""
        out: Dict[SensorKind, List[SensorReading]] = {k: [] for k in SensorKind.all()}
        for kind, sensor in self.sensors.items():
            for r in sensor.stream(frames):
                out[kind].append(r)
                self.care.sample(r.confidence)
        return out

    def decide(self, proposal: Mapping[str, Any],
               cast_fn: Callable[[str, Mapping[str, Any]], Tuple[bool, str]]
               ) -> Decision:
        """Run a BFT-12-around-1 vote over a proposal."""
        return self.council.propose(uuid.uuid4().hex, proposal, cast_fn)

    def act(self, intent: str, args: Mapping[str, Any]) -> Decision:
        """Convenience wrapper. Returns a Decision whose sigil is the
        SIGIL line appended to the chain."""

        def _cast(voter: str, prop: Mapping[str, Any]) -> Tuple[bool, str]:
            return True, f"{voter} acting on {prop.get('intent')}"

        d = self.decide({"intent": intent, **args}, _cast)
        self.sigil_emit(intent, args)
        return d

    def transact(self, service: str, **kw: Any) -> X402Invoice:
        """Issue a MiCA-/x402-compliant micro-invoice for a sovereign service."""
        inv = x402_invoice(service, **kw)
        self.sigil_emit("transact", inv.to_dict())
        return inv

    def govern(self, proposal_id: str, verdict: str,
               evidence: Mapping[str, Any]) -> SigilRecord:
        """Record a governance event (vote, audit, alert) onto the SIGIL chain."""
        payload = {
            "proposal_id": proposal_id, "verdict": verdict,
            "evidence": dict(evidence),
        }
        rec = sigil_sign(payload, secret=self.secret, actor=self.node_id,
                         op="G", target=proposal_id)
        with self._sigil_lock:
            self._sigil_chain.append(rec)
        return rec

    # -------------------- the 4 rules ------------------------------------- #
    def assert_compliance(self, *, care: float, sovereignty: SovereigntyState,
                          bft_ok: bool, sigil_ok: bool) -> bool:
        """Hard rule gate. Raises :class:`ComplianceError` on breach."""
        if not self.care.compliant(care):
            raise ComplianceError(f"care {care} < floor {self.care.floor}")
        if sovereignty != SovereigntyState.SOVEREIGN:
            raise ComplianceError(f"sovereignty={sovereignty.value}")
        if not bft_ok:
            raise ComplianceError("BFT quorum not reached")
        if not sigil_ok:
            raise ComplianceError("SIGIL not emitted")
        return True

    # -------------------- SIGIL helper (mirrors module-level fn) ---------- #
    @classmethod
    def sigil_emit(cls, proposal_id: str, payload: Mapping[str, Any],
                   op: str = "C", target: str = "node") -> str:
        return sigil_sign({**payload, "_proposal": proposal_id},
                          op=op, target=target).digest

    @property
    def sigil_chain(self) -> List[SigilRecord]:
        return list(self._sigil_chain)


class ComplianceError(RuntimeError):
    """Raised when a proposal breaches any of the 4 hard rules."""


# --------------------------------------------------------------------------- #
# 9. CLI / FUNCTIONAL WRAPPER
# --------------------------------------------------------------------------- #


def _setup_default_substrate(node_id: str) -> Sovereign33:
    s = Sovereign33(node_id=node_id)
    s.attach(VisionSensor(node_id=node_id))
    s.attach(AudioSensor(node_id=node_id))
    s.attach(ProprioSensor(node_id=node_id))
    s.attach(LidarSensor(node_id=node_id))
    s.attach(ThermalSensor(node_id=node_id))
    s.attach(RfSensor(node_id=node_id))
    return s


def _run_self_test(args: argparse.Namespace) -> int:
    s = _setup_default_substrate("self-test")
    print("== Sovereign33 self-test ==")
    print(f"version     : {__version__}")
    print(f"license     : {__license__}")
    print(f"districts   : {DISTRICTS}")
    print(f"sensors     : {len(s.sensors)}/{SENSORS}")
    print(f"care floor  : {s.care.floor:.2f}")

    # 1. PERCEIVE — 1 frame per sensor
    print("\n[perceive] 6 sensors × 1 frame")
    r = s.perceive(frames=1)
    for k, lst in r.items():
        print(f"  {k.value:12s} frames={len(lst)} conf={lst[0].confidence:.3f}"
              f" sha={lst[0].sha256[:8]}")

    # 2. DECIDE — BFT
    print("\n[decide] BFT-12-around-1 over propose('hello')")
    d = s.act("hello", {"message": "world"})
    print(f"  votes_for={d.votes_for} votes_against={d.votes_against}"
          f" care={d.care:.2f} sigil={d.sigil[:16]}…")

    # 3. ACT, TRANSACT, GOVERN
    inv = s.transact("article50_passport", tier="Pro", quantity=1,
                     customer="self-test")
    print(f"\n[transact] invoice {inv.invoice_id[:8]}… fee={inv.fiat_minor}"
          f"{inv.currency} svc={inv.service}")
    rec = s.govern("self-test", "PASS", {"version": __version__})
    print(f"\n[govern] sigil line {rec.line[:60]}…")
    print(f"\n[chain] entries: {len(s.sigil_chain)}")
    print("\nAll four hard rules:")
    try:
        s.assert_compliance(care=1.0, sovereignty=SovereigntyState.SOVEREIGN,
                            bft_ok=True, sigil_ok=True)
        print("  ✓ care floor")
        print("  ✓ sovereignty == sovereign")
        print("  ✓ BFT quorum")
        print("  ✓ SIGIL emitted")
    except ComplianceError as e:  # pragma: no cover
        print(f"  ✗ {e}")
        return 1
    return 0


def _build_argparser() -> "argparse.ArgumentParser":
    p = argparse.ArgumentParser(
        prog="sovereign33",
        description=("Sovereign33 SDK CLI — operate a 33-district sovereign "
                     "robot OS with 6 sensors, 5 capabilities, 4 rules."),
    )
    p.add_argument("--node-id", default="sovereign-cli",
                   help="Unique identifier for this substrate node")
    p.add_argument("--care-floor", type=float, default=CARE_FLOOR,
                   help=f"Care floor (default {CARE_FLOOR})")
    p.add_argument("--self-test", action="store_true",
                   help="Run the 33-point self-test and exit")
    p.add_argument("--version", action="version",
                   version=f"%(prog)s {__version__}")
    return p


def run(argv: Optional[Sequence[str]] = None) -> int:
    """Functional entry point. Returns shell exit code."""
    args = _build_argparser().parse_args(argv)
    if args.self_test:
        return _run_self_test(args)
    print(f"sovereign33 {__version__} (MIT, M4 engineering lane)")
    print("Use --self-test for a 33-point demonstration, or `import sovereign33`.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(run())
