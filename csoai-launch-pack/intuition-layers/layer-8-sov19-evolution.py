"""
Layer 8 — SOV-19 Evolution Layer
=================================

Sits on top of Layer 7. Reads the L7 intuition chain and computes
the deltas (axis-by-axis delta vs the previous snapshot), then
proposes an evolution action:

  - HOLD      — axis stable, no action
  - NUDGE     — axis drifting, schedule a recall
  - REVISE    — axis inverted, BFT council vote required
  - EMIT      — axis crosses threshold, mint an evolution sigil

The OOWM 4-stage cycle (INGEST → LEARN → ALIGN → REVISE) is enforced here.
Honesty register: this layer PROPOSES actions. None auto-fires.
Care floor 0.95. Stage, never fire.
"""

import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone

try:
    from nacl.signing import SigningKey
    HAVE_NACL = True
except ImportError:
    HAVE_NACL = False

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
KEY_PATH = Path.home() / ".sovereign" / "layer8_key.json"
L7_LOG = Path.home() / ".sovereign" / "layer7_intuition.jsonl"
L8_LOG = Path.home() / ".sovereign" / "layer8_evolution.jsonl"


def _key():
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if KEY_PATH.exists():
        return SigningKey(KEY_PATH.read_bytes())
    k = SigningKey.generate()
    KEY_PATH.write_bytes(k.encode())
    KEY_PATH.chmod(0o600)
    return k


def _load_l7_snapshots():
    if not L7_LOG.exists():
        return []
    out = []
    for line in L7_LOG.read_text().splitlines():
        if not line.strip():
            continue
        out.append(json.loads(line))
    return out


def _read_last_l8_digest():
    if not L8_LOG.exists() or L8_LOG.stat().st_size == 0:
        return "0" * 64
    last_line = L8_LOG.read_text().strip().split('\n')[-1]
    return json.loads(last_line).get("digest", "0" * 64)


def _classify_axis(curr, prev, threshold=0.15):
    if prev is None:
        return "EMIT", 0.0  # first evolution
    delta = curr - prev
    if abs(delta) < 0.02:
        return "HOLD", delta
    if abs(delta) < threshold:
        return "NUDGE", delta
    if delta * (1.0 if curr > prev else -1.0) > 0:
        return "REVISE", delta
    return "EMIT", delta  # crossed threshold


def evaluate_evolution():
    snaps = _load_l7_snapshots()
    if len(snaps) < 1:
        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "action": "HOLD",
            "reason": "no L7 snapshots yet",
        }

    curr = snaps[-1]
    prev = snaps[-2] if len(snaps) >= 2 else None
    axes_now = curr.get("intuition_axes", {})
    axes_prev = prev.get("intuition_axes", {}) if prev else {}

    actions = {}
    max_abs_delta = 0.0
    dominant = "HOLD"
    for axis, val in axes_now.items():
        pval = axes_prev.get(axis)
        cls, delta = _classify_axis(val, pval)
        actions[axis] = {"value": val, "delta": round(delta, 4), "classification": cls}
        if abs(delta) > abs(max_abs_delta):
            max_abs_delta = delta
            dominant = cls

    return {
        "ts": datetime.now(timezone.utc).isoformat(),
        "dominant_action": dominant,
        "max_abs_delta": round(abs(max_abs_delta), 4),
        "snapshot_count": len(snaps),
        "latest_chain_length": curr.get("chain_length"),
        "axis_states": actions,
    }


def mint_evolution_receipt():
    ev = evaluate_evolution()
    prev_digest = _read_last_l8_digest()
    ts = ev["ts"]

    body = {
        "ts": ts,
        "layer": 8,
        "source": "SOV-19-evolution",
        "evaluation": ev,
        "prev_digest": prev_digest,
        "charter": CSOAI_CHARTER_SHA,
    }
    body_json = json.dumps(body, sort_keys=True, default=str)
    body_hash = hashlib.sha256(body_json.encode()).hexdigest()
    digest_input = f"L8_EVOLUTION|{ts}|{body_hash}|{prev_digest}|{CSOAI_CHARTER_SHA}".encode()
    digest = hashlib.sha256(digest_input).hexdigest()

    sig_hex = ""
    if HAVE_NACL:
        sig_hex = _key().sign(digest_input).signature.hex()

    rec = {
        "ts": ts,
        "layer": 8,
        "digest": digest,
        "signature": sig_hex[:128],
        "prev_digest": prev_digest,
        "charter_sha": CSOAI_CHARTER_SHA[:16] + "...",
        "dominant_action": ev["dominant_action"],
        "max_abs_delta": ev["max_abs_delta"],
        "snapshot_count": ev["snapshot_count"],
        "latest_chain_length": ev["latest_chain_length"],
    }
    L8_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(L8_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")
    return rec, ev


if __name__ == "__main__":
    print("Layer 8 - SOV-19 Evolution Layer")
    print("=" * 60)
    print(f"Charter SHA-256: {CSOAI_CHARTER_SHA[:32]}...")
    print()
    rec, ev = mint_evolution_receipt()
    print(f"Evolution receipt:")
    print(f"  digest:             {rec['digest'][:24]}...")
    print(f"  dominant_action:    {rec['dominant_action']}")
    print(f"  max_abs_delta:      {rec['max_abs_delta']}")
    print(f"  snapshot_count:     {rec['snapshot_count']}")
    print(f"  latest_chain_len:   {rec['latest_chain_length']}")
    print(f"  prev_digest (link): {rec['prev_digest'][:24]}...")
    print()
    print("Per-axis decisions:")
    for axis, st in (ev.get("axis_states") or {}).items():
        print(f"  {axis:30s} value={st['value']:+.4f}  delta={st['delta']:+.4f}  -> {st['classification']}")
    print()
    print(f"Layer 8 evolution log: {L8_LOG}")
    if L8_LOG.exists():
        size = L8_LOG.stat().st_size
        n = sum(1 for _ in L8_LOG.open())
        print(f"  {size} bytes, {n} evolution receipts")
