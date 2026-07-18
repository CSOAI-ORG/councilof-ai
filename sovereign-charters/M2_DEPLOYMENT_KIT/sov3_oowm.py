#!/usr/bin/env python3
"""SOV3 OOWM — Organic Open World Model runtime.

16-dim intuition state via Mamba-2 selective SSM recurrence.
Ingests SIGILs at 1Hz, updates state, emits broadcasts.

Honesty register: stdlib-only approximation. Real OOWM runs on VM.
Reference: 35-coigndaltion-charter.md Article VI.
"""

import hashlib
import json
import math
import os
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

CHARTER_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = CHARTER_ROOT / 'sov3_oowm.db'

# 16-dim intuition state — 8 axes × (sign + magnitude)
AXES = [
    'bft_quorum_tightness',
    'defense_alert_density',
    'framework_violation_rate',
    'hive_engagement_ibn_khaldun',
    'sov3_creation_flow',
    'care_floor_bandwidth',
    'audit_chain_freshness',
    'oracle_confidence',
]

# Mamba-2 SSM A diagonal: most slow decay, one fast
A_DIAG = [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.01] * 2  # 16 dims

# 256-dim SIGIL embedding projection
def sigil_to_embedding(sigil_line):
    """Map SIGIL line to 256-dim embedding.

    Layout (from 35-coigndaltion-charter.md):
    - one-hot actor (32 dim)
    - one-hot action (16 dim)
    - target embedding (64 dim, learned)
    - timestamp cosine-position (32 dim)
    - contextual hash (16 dim)
    - care-score (1 dim)
    - sovereignty-byte (1 dim)
    - padding (96 dim)
    """
    import hashlib as _h
    h = _h.sha256(sigil_line.encode()).digest()
    emb = [0.0] * 256
    # actor one-hot (first 32 dims)
    actor_idx = h[0] % 32
    emb[actor_idx] = 1.0
    # action one-hot (next 16 dims)
    action_idx = h[1] % 16
    emb[32 + action_idx] = 1.0
    # target embedding (next 64 dims from hash)
    for i in range(64):
        emb[48 + i] = (h[2 + i % 30] / 255.0) * 2 - 1
    # timestamp cosine-position (next 32 dims)
    now = time.time()
    for i in range(32):
        emb[112 + i] = math.cos(now / (3600 * (i + 1)))
    # contextual hash (next 16 dims)
    ctx_h = _h.sha256(sigil_line.encode()).digest()
    for i in range(16):
        emb[144 + i] = (ctx_h[i] / 255.0) * 2 - 1
    # care-score (1 dim)
    emb[160] = 0.97  # 0.95+ floor
    # sovereignty-byte (1 dim)
    emb[161] = 1.0  # always 1 for sovereign
    # padding (96 dims) — leave 0
    return emb


def b_projection(emb):
    """256-dim → 16-dim (linear projection, simplified)."""
    # Take first 16 dims as projection
    return emb[:16]


def mamba2_recurrence(state, sigil_line, gating=True):
    """Selective SSM tick.

    h(t) = A * h(t-1) + B(x(t)) + G * tanh(intuition_score)
    """
    emb = sigil_to_embedding(sigil_line)
    b = b_projection(emb)

    # Compute intuition score (heuristic: weighted sum)
    intuition_score = sum(b[i] * state[i] for i in range(16)) / 16.0

    # Gating: low-utility SIGILs zero out B
    if gating and abs(intuition_score) < 0.01:
        b = [0.0] * 16

    new_state = []
    for i in range(16):
        new_state.append(A_DIAG[i] * state[i] + b[i] + 0.1 * math.tanh(intuition_score))
    return new_state


def sigmoid(x):
    if x > 100:
        return 1.0
    if x < -100:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def intuition_confidence(state):
    """Reduce 16-dim state to scalar confidence via sigmoid(w·h).

    Bifurcation threshold ~0.7 above which intuition is broadcast,
    ~0.4 below which emergency convene is fired.
    """
    w = [1.0] * 16  # equal-weight projection
    dot = sum(w[i] * state[i] for i in range(16)) / 16.0
    return sigmoid(dot)


def emit_sigil(line):
    """Emit Ed25519-style SIGIL (HMAC-SHA512 approximation since we don't have Ed25519 in stdlib)."""
    ts = datetime.now(timezone.utc).isoformat()
    payload = f'{line}|{ts}'
    h = hashlib.sha512(payload.encode()).hexdigest()
    digest = h[:32]
    sigil_log = CHARTER_ROOT / 'OOWM_SIGIL_LOG.txt'
    with open(sigil_log, 'a') as f:
        f.write(f'{ts} | {digest} | {line}\n')
    return digest


def ensure_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS oowm_state (
        id INTEGER PRIMARY KEY,
        axis_name TEXT,
        dim_sign INTEGER,
        dim_mag REAL,
        updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sigils (
        digest TEXT PRIMARY KEY,
        line TEXT,
        intuition_score REAL,
        broadcast INTEGER,
        created_at TEXT
    );
    """)
    conn.commit()
    return conn


def init_state(conn):
    """Initialize 16-dim state to neutral."""
    cur = conn.execute('SELECT COUNT(*) FROM oowm_state')
    if cur.fetchone()[0] == 0:
        ts = datetime.now(timezone.utc).isoformat()
        for axis in AXES:
            for sign in [-1, 1]:
                conn.execute('INSERT INTO oowm_state (axis_name, dim_sign, dim_mag, updated_at) VALUES (?, ?, ?, ?)',
                             (axis, sign, 0.0, ts))
        conn.commit()


def get_state(conn):
    state = [0.0] * 16
    rows = conn.execute('SELECT axis_name, dim_sign, dim_mag FROM oowm_state ORDER BY id').fetchall()
    for i, (axis, sign, mag) in enumerate(rows):
        state[i] = sign * mag
    return state


def set_state(conn, state):
    ts = datetime.now(timezone.utc).isoformat()
    for i, (axis, sign, mag) in enumerate(
        [(AXES[i // 2], -1 if i % 2 == 0 else 1, abs(state[i])) for i in range(16)]
    ):
        conn.execute('UPDATE oowm_state SET dim_sign = ?, dim_mag = ?, updated_at = ? WHERE axis_name = ? AND dim_sign = ?',
                     (sign, mag, ts, axis, -1 if i % 2 == 0 else 1))
    conn.commit()


def ingest_sigil(conn, line):
    """Ingest one SIGIL and update state."""
    state = get_state(conn)
    new_state = mamba2_recurrence(state, line)
    set_state(conn, new_state)
    confidence = intuition_confidence(new_state)
    digest = emit_sigil(line)
    broadcast = 1 if confidence > 0.7 else 0
    emergency = 1 if confidence < 0.4 else 0
    conn.execute('INSERT OR IGNORE INTO sigils (digest, line, intuition_score, broadcast, created_at) VALUES (?, ?, ?, ?, ?)',
                 (digest, line, confidence, broadcast, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    return {
        'digest': digest,
        'confidence': confidence,
        'broadcast': broadcast,
        'emergency': emergency,
        'new_state_summary': {AXES[i // 2]: new_state[i] for i in range(16)},
    }


def demo_run(n_sigils=10):
    """Demo: ingest n SIGILs and show state evolution."""
    conn = ensure_db()
    init_state(conn)

    print(f'[OOWM] starting with 16-dim state initialized')
    print(f'[OOWM] ingesting {n_sigils} SIGILs...\n')

    for i in range(n_sigils):
        line = f'M|demo-actor-{i % 5}|action-{i % 3}|demo event #{i}|{datetime.now(timezone.utc).isoformat()}'
        result = ingest_sigil(conn, line)
        print(f'  [{i+1}/{n_sigils}] digest={result["digest"][:12]} confidence={result["confidence"]:.3f} '
              f'broadcast={result["broadcast"]} emergency={result["emergency"]}')

    print(f'\n[OOWM] final 16-dim state:')
    state = get_state(conn)
    for i, axis in enumerate(AXES):
        print(f'  {axis:32s} = {state[i*2]:+.3f} (sign) {state[i*2+1]:+.3f} (mag)')

    conn.close()


if __name__ == '__main__':
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    demo_run(n)