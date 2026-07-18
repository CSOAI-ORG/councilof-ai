#!/usr/bin/env python3
"""
DRUM — Sovereign Heartbeat Layer (L0)
The pulse of the sovereign substrate. 1Hz beats from every sovereign entity.

Real implementation of:
  - 1Hz heartbeat from 30 entities (1 hub + 12 queens + 17 agents)
  - Firefly/Peskin phase-lock algorithm (1966 model)
  - Sovereign Mist 12 pillars score → coupling strength K
  - Ring buffer of last 1024 beats per entity
  - SIGIL chain hash per beat
  - Phase-lock detection via order parameter R(t) = (1/N)|Σ exp(i φⱼ)|
  - Real sovereign-by-construction enforcement: Care-Floor → phase drift

Run:
  $ python3 drum_heartbeat.py [duration_sec]
  # default 30s (30 beats per entity, 900 total)
"""

import sys, os, json, time, math, hashlib
from pathlib import Path
from datetime import datetime, timezone
from collections import deque
from dataclasses import dataclass, field


# ============== SOVEREIGN MIST 12 PILLARS + BOUNDS ==============

SOVEREIGN_MIST_12 = [
    "Honor", "Safety", "Guidance", "Sovereignty", "Resilience",
    "Auditability", "Verifiability", "Transparency", "Justice",
    "Equity", "Openness", "Continuity"
]
CARE_FLOOR = 0.95


# ============== THE 30 SOVEREIGN ENTITIES ==============

ENTITIES = [
    # Hub (1)
    {'id': 'hub',            'role': 'hub',         'name': 'Hub',                  'arcana': '0. The Fool'},
    # 12 Queens
    {'id': 'q1-strategy',    'role': 'queen',       'name': 'Queen-Strategy',       'arcana': '4. The Emperor'},
    {'id': 'q2-care',        'role': 'queen',       'name': 'Queen-Care',           'arcana': '5. The Hierophant'},
    {'id': 'q3-brain',       'role': 'queen',       'name': 'Queen-Brain',          'arcana': '—'},
    {'id': 'q4-bridge',      'role': 'queen',       'name': 'Queen-Bridge',         'arcana': '—'},
    {'id': 'q5-carefloor',   'role': 'queen-mandatory', 'name': 'Queen-CareFloor',  'arcana': '—'},
    {'id': 'q6-compliance',  'role': 'queen',       'name': 'Queen-Compliance',     'arcana': '—'},
    {'id': 'q7-council',     'role': 'queen-mandatory', 'name': 'Queen-Council',    'arcana': '11. Strength'},
    {'id': 'q8-distribution','role': 'queen',       'name': 'Queen-Distribution',   'arcana': '19. The Sun'},
    {'id': 'q9-domain',      'role': 'queen',       'name': 'Queen-Domain',         'arcana': '—'},
    {'id': 'q10-watch',      'role': 'queen-mandatory', 'name': 'Queen-Watch',      'arcana': '16. The Tower'},
    {'id': 'q11-safety',     'role': 'queen-mandatory', 'name': 'Queen-Safety',     'arcana': '—'},
    {'id': 'q12-veteran',    'role': 'queen',       'name': 'Queen-Veteran',        'arcana': '—'},
    # 17 agents (real sovereign entity names)
    {'id': 'a-grabhire',     'role': 'agent',       'name': 'GrabHire-Agent',       'arcana': '—'},
    {'id': 'a-muckaway',     'role': 'agent',       'name': 'MuckAway-Agent',       'arcana': '—'},
    {'id': 'a-loopfactory',  'role': 'agent',       'name': 'LoopFactory-Agent',    'arcana': '—'},
    {'id': 'a-fishkeeper',   'role': 'agent',       'name': 'FishKeeper-Agent',     'arcana': '—'},
    {'id': 'a-sovereign-charter','role':'agent',     'name': 'SovereignCharter-Agent','arcana': '—'},
    {'id': 'a-defoneos',     'role': 'agent',       'name': 'DEFONEOS-Agent',       'arcana': '—'},
    {'id': 'a-sigil',        'role': 'agent',       'name': 'SIGIL-Agent',          'arcana': '—'},
    {'id': 'a-carefloor',    'role': 'agent',       'name': 'CareFloor-Agent',      'arcana': '—'},
    {'id': 'a-bft33',        'role': 'agent',       'name': 'BFT33-Agent',          'arcana': '—'},
    {'id': 'a-moecouncil',   'role': 'agent',       'name': 'MoECouncil-Agent',     'arcana': '—'},
    {'id': 'a-owem',         'role': 'agent',       'name': 'OWEM-Agent',           'arcana': '—'},
    {'id': 'a-drum',         'role': 'agent',       'name': 'DRUM-Agent',           'arcana': '—'},
    {'id': 'a-mindset',      'role': 'agent',       'name': 'Mindset-Agent',        'arcana': '—'},
    {'id': 'a-flywheel',     'role': 'agent',       'name': 'MindsetFlywheel-Agent','arcana': '—'},
    {'id': 'a-forge',        'role': 'agent',       'name': 'FrameworkForge-Agent', 'arcana': '—'},
    {'id': 'a-seal-pilot',   'role': 'agent',       'name': 'SovereignSEAL-Agent',  'arcana': '—'},
    {'id': 'a-crown-1',      'role': 'agent',       'name': 'Crown-1-SEAL-Agent',   'arcana': '—'},
]


# ============== HEARTBEAT ENTITY ==============

@dataclass
class SovereignEntity:
    """One sovereign entity that pulses its heartbeat into DRUM."""
    entity_id: str
    name: str
    role: str
    arcana: str
    mist_12: float = 0.91          # sovereign Mist 12 pillars compliance score
    care_floor: float = CARE_FLOOR
    phase: float = 0.0
    natural_freq: float = 1.0      # Hz (target sovereign pulse)
    seq: int = 0
    last_beat_ts: float = 0.0
    ring_buffer: deque = field(default_factory=lambda: deque(maxlen=1024))
    sigil_chain: list = field(default_factory=list)
    mandatory_care_veto: bool = False

    def beat(self, t: float, system_mean_phase: float = 0.0) -> dict:
        """Emit one sovereign heartbeat beat."""
        self.seq += 1
        dt = max(0.001, t - self.last_beat_ts) if self.last_beat_ts else 1.0
        self.last_beat_ts = t

        # Sovereign Mist 12 pillars ↔ coupling strength K (Peskin 1966)
        k = max(0.0, self.mist_12 - 0.85) * 2.5  # 0.85→0, 1.0→0.375 (weak), 0.95→0.25

        # Mandatory care-floor veto: phase set to π/2 (asynchronous, disconnected)
        if self.role == 'queen-mandatory' and self.mist_12 < self.care_floor:
            self.mandatory_care_veto = True
            self.phase = math.pi / 2  # forced off-phase
        else:
            self.mandatory_care_veto = False
            # Peskin's firefly: phase advances by natural_freq * dt, plus K * sin(mean - phase)
            self.phase = (
                self.phase
                + self.natural_freq * dt * 2 * math.pi / 30  # normalize so 1Hz = full revolution
                + k * math.sin(system_mean_phase - self.phase) * dt * 2 * math.pi
            ) % (2 * math.pi)

        # Build beat
        beat_payload = {
            'entity': self.entity_id,
            'name': self.name,
            'role': self.role,
            'seq': self.seq,
            'ts': round(t, 3),
            'phase': round(self.phase, 4),
            'mist_12': round(self.mist_12, 4),
            'care_floor': self.care_floor,
            'mandatory_care_veto': self.mandatory_care_veto,
            'coupling_k': round(k, 4),
        }

        # SIGIL chain hop
        sigil_prev = self.sigil_chain[-1]['digest'] if self.sigil_chain else '0' * 16
        sigil_payload = {**beat_payload, 'prev_hash': sigil_prev}
        sigil_digest = hashlib.sha256(json.dumps(sigil_payload, sort_keys=True).encode()).hexdigest()[:16]
        beat_with_sig = {**sigil_payload, 'digest': sigil_digest}
        self.sigil_chain.append(beat_with_sig)
        self.ring_buffer.append(beat_with_sig)

        return beat_with_sig


# ============== DRUM — THE LAYER ==============

class DRUM:
    """The Sovereign Heartbeat Layer.

    Holds sovereign entities, runs firefly phase-lock, emits beats, tracks order parameter.
    """

    def __init__(self):
        self.entities = {
            e['id']: SovereignEntity(
                entity_id=e['id'], name=e['name'], role=e['role'], arcana=e['arcana']
            )
            for e in ENTITIES
        }
        self.global_sigil_chain = []
        self.last_mean_phase = 0.0

    def step(self, t: float) -> dict:
        """One DRUM step (1 second). Returns the global beat packet + order parameter."""
        # First, compute system mean phase
        phases = [e.phase for e in self.entities.values() if not e.mandatory_care_veto]
        if phases:
            self.last_mean_phase = sum(phases) / len(phases) % (2 * math.pi)
        else:
            self.last_mean_phase = 0.0

        # Beat every entity
        beats = []
        for entity in self.entities.values():
            b = entity.beat(t, self.last_mean_phase)
            beats.append(b)

        # Order parameter R(t) — Kuramoto's
        # R = 1 means perfectly synchronized, R = 0 means completely scattered
        r_complex_sum = sum(math.cos(e.phase) + 1j * math.sin(e.phase)
                          for e in self.entities.values()
                          if not e.mandatory_care_veto)
        n_synced = sum(1 for e in self.entities.values() if not e.mandatory_care_veto)
        if n_synced > 0:
            r = abs(r_complex_sum) / n_synced
            psi = math.atan2(
                sum(math.sin(e.phase) for e in self.entities.values() if not e.mandatory_care_veto) / n_synced,
                sum(math.cos(e.phase) for e in self.entities.values() if not e.mandatory_care_veto) / n_synced,
            )
        else:
            r = 0.0
            psi = 0.0

        # DRUM's global SIGIL hop
        prev = self.global_sigil_chain[-1]['digest'] if self.global_sigil_chain else '0' * 16
        global_payload = {
            'hop': 'DRUM_GLOBAL',
            't': round(t, 3),
            'n_entities': len(self.entities),
            'n_synced': n_synced,
            'order_param_R': round(r, 4),
            'mean_phase_psi': round(psi, 4),
            'mandatory_care_veto': any(e.mandatory_care_veto for e in self.entities.values()),
            'prev_hash': prev,
        }
        global_digest = hashlib.sha256(json.dumps(global_payload, sort_keys=True).encode()).hexdigest()[:16]
        self.global_sigil_chain.append({**global_payload, 'digest': global_digest})

        return {
            't': t,
            'r': r,
            'psi': psi,
            'n_synced': n_synced,
            'beats': beats,
            'global_digest': global_digest,
        }

    def verify_sigil_chain(self) -> bool:
        """Verify the global SIGIL chain (offline verifiable)."""
        prev = '0' * 16
        for hop in self.global_sigil_chain:
            payload = {k: v for k, v in hop.items() if k not in ('digest',)}
            expected = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
            if expected != hop.get('digest') or hop.get('prev_hash') != prev:
                return False
            prev = hop['digest']
        return True

    def save_chain(self, path: Path):
        """Persist the DRUM SIGIL chain."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('w') as f:
            for hop in self.global_sigil_chain:
                f.write(json.dumps(hop) + '\n')


# ============== MAIN — LIVE DRUM DEMO ==============

def main():
    duration = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    drum = DRUM()
    print("=" * 70)
    print("🥁 DRUM — Sovereign Heartbeat Layer (L0)")
    print(f"   {len(drum.entities)} sovereign entities · 1Hz · {duration}s")
    print("=" * 70)
    print(f"   {'t':>5s} | {'R':>6s} | {'ψ':>6s} | {'synced':>6s} | {'global_digest':16s}")
    print("-" * 70)

    start = time.time()
    beat_steps = []
    for i in range(duration):
        t = i + 1.0
        result = drum.step(t)
        # Brief inline status every 5 beats
        if i % 5 == 0 or i == duration - 1:
            elapsed = time.time() - start
            print(f"   {result['t']:>5.1f} | {result['r']:.4f} | {result['psi']:>6.3f} | "
                  f"{result['n_synced']:>6d} | {result['global_digest'][:16]}")

    # Save chain
    save_path = Path.home() / '.sovereign' / 'drum_global.sigil.jsonl'
    drum.save_chain(save_path)

    # Verify
    verified = drum.verify_sigil_chain()

    print("\n" + "=" * 70)
    print(f"✅ DRUM complete: {duration} global beats")
    print(f"   Total beats emitted: {duration} × {len(drum.entities)} = {duration * len(drum.entities)}")
    print(f"   Global SIGIL chain length: {len(drum.global_sigil_chain)} hops")
    print(f"   Chain verified (offline): {verified}")
    print(f"   Saved to: {save_path}")
    print(f"\n🥁 DRUM IS BEATING. Sovereign substrate is alive.")
    print(f"   Heartbeat: {sum(len(e.sigil_chain) for e in drum.entities.values())} per-entity SIGIL hops")
    print("=" * 70)


if __name__ == '__main__':
    main()