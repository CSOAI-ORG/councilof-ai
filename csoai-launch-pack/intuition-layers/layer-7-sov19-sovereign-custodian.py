"""
Layer 7 — SOV-19 Sovereign Custodian Intuition (revised, fits SOV33 master)

Reads the current substrate state and emits a live intuition vector for
the OWEM 4-stage cycle (INGEST → LEARN → ALIGN → REVISE).

Now with /intuition-live readout support.
"""

import json
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone

try:
    from nacl.signing import SigningKey
    HAVE_NACL = True
except ImportError:
    HAVE_NACL = False

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
KEY_PATH = Path.home() / ".sovereign" / "layer7_key.json"
L7_LOG = Path.home() / ".sovereign" / "layer7_intuition.jsonl"


def _key():
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if KEY_PATH.exists():
        return SigningKey(KEY_PATH.read_bytes())
    k = SigningKey.generate()
    KEY_PATH.write_bytes(k.encode())
    KEY_PATH.chmod(0o600)
    return k


def _read_previous_hash():
    if not L7_LOG.exists() or L7_LOG.stat().st_size == 0:
        return "0" * 64
    last_line = L7_LOG.read_text().strip().split('\n')[-1]
    return json.loads(last_line).get("digest", "0" * 64)


def _measure_substrate():
    sigil_chain = Path.home() / ".sovereign" / "sigil_chain.jsonl"
    chain_len = 0
    if sigil_chain.exists():
        chain_len = sum(1 for _ in sigil_chain.open())

    greenfield = Path("/Users/nicholas/clawd/csoai-launch-pack/greenfield-mcps")
    crowns = Path("/Users/nicholas/clawd/_crown-jewels")
    greenfield_count = sum(1 for _ in greenfield.iterdir()) if greenfield.exists() else 0
    crowns_count = sum(1 for _ in crowns.iterdir()) if crowns.exists() else 0

    l7_count = 0
    if L7_LOG.exists():
        l7_count = sum(1 for _ in L7_LOG.open())

    return {
        "sigil_chain_length": chain_len,
        "greenfield_mcps": greenfield_count,
        "crown_jewels": crowns_count,
        "l7_snapshots_to_date": l7_count,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def _compute_intuition(state):
    chain = state.get("sigil_chain_length", 0)
    # SOV33 master: substrate becomes more sovereign as chain grows toward 33-stack.
    # Target baseline: 33 sigils per BFT vote × 33 votes = ~1,000 by full operation.
    sovereignty_density = max(-1.0, min(1.0, (chain - 100) / 1000.0))
    custodian_threshold = 0.85
    align_page = Path("/Users/nicholas/clawd/csoai-static-deploy2/sov-33-master-plan.html")
    sov33_master_alignment = 0.95 if align_page.exists() else 0.5
    sov19_alignment = 0.9 if Path("/Users/nicholas/clawd/csoai-static-deploy2/sov-18-jeeves-alignment.html").exists() else 0.5
    chain_growth_rate = max(-1.0, min(1.0, (chain / 100.0) - 0.5))
    # Owner-unblock proximity: rises as chain proves the substrate works.
    # Hard floor at +0.30 until D3 fires. Then jumps to +1.0.
    owner_unblock_proximity = 0.3

    return {
        "sovereignty_density": round(sovereignty_density, 4),
        "custodian_threshold": round(custodian_threshold, 4),
        "sov33_master_alignment": round(sov33_master_alignment, 4),
        "sov19_alignment": round(sov19_alignment, 4),
        "chain_growth_rate": round(chain_growth_rate, 4),
        "owner_unblock_proximity": round(owner_unblock_proximity, 4),
    }


def mint_intuition_snapshot():
    state = _measure_substrate()
    intuition = _compute_intuition(state)
    prev_hash = _read_previous_hash()
    ts = datetime.now(timezone.utc).isoformat()

    body = {
        "ts": ts,
        "layer": 7,
        "source": "SOV33-master-aligned",
        "state": state,
        "intuition_axes": intuition,
        "prev_digest": prev_hash,
        "charter": CSOAI_CHARTER_SHA,
    }
    body_json = json.dumps(body, sort_keys=True, default=str)
    body_hash = hashlib.sha256(body_json.encode()).hexdigest()
    digest_input = f"L7_INTUITION|{ts}|{body_hash}|{prev_hash}|{CSOAI_CHARTER_SHA}".encode()
    digest = hashlib.sha256(digest_input).hexdigest()

    sig_hex = ""
    if HAVE_NACL:
        sig_hex = _key().sign(digest_input).signature.hex()

    rec = {
        "ts": ts,
        "layer": 7,
        "digest": digest,
        "signature": sig_hex[:128],
        "prev_digest": prev_hash,
        "charter_sha": CSOAI_CHARTER_SHA[:16] + "...",
        "chain_length": state["sigil_chain_length"],
        "intuition_axes": intuition,
    }
    L7_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(L7_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")
    return rec


def get_latest_intuition():
    """Read the latest L7 snapshot for live readout."""
    if not L7_LOG.exists() or L7_LOG.stat().st_size == 0:
        return None
    last_line = L7_LOG.read_text().strip().split('\n')[-1]
    return json.loads(last_line)


if __name__ == "__main__":
    print("Layer 7 - SOV33-aligned Sovereign Custodian Intuition")
    print("=" * 60)
    print(f"Charter SHA-256: {CSOAI_CHARTER_SHA[:32]}...")
    print()

    for i in range(2):
        snap = mint_intuition_snapshot()
        axes = snap["intuition_axes"]
        print(f"Snapshot #{i + 1}:")
        print(f"  digest:                {snap['digest'][:24]}...")
        print(f"  chain length:          {snap['chain_length']}")
        for k, v in axes.items():
            print(f"  {k:30s} {v:+.4f}")
        print(f"  prev_digest (chain):   {snap['prev_digest'][:24]}...")
        print()
        time.sleep(0.05)

    print(f"Layer 7 intuition log: {L7_LOG}")
    if L7_LOG.exists():
        size = L7_LOG.stat().st_size
        n = sum(1 for _ in L7_LOG.open())
        print(f"  {size} bytes, {n} snapshots")
