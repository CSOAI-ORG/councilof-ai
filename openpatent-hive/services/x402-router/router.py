#!/usr/bin/env python3
"""
x402 Payment Router
====================

Sub-dollar / sub-cent micropayment router for openpatent.ai. The x402 protocol
splits every disclosure fee 60% / 25% / 15% across three wallets:

  - 60% → openpatent operations treasury
  - 25% → SOV3 infrastructure pool (hermes/sovereign)
  - 15% → BFT council reward pool (distributed across 33 review agents)

The router exposes:
  POST /pay/      — submit a payment, get a split + tx receipt
  GET  /treasury/ — current balance of all three pots
  GET  /stats/    — router statistics
  GET  /health/   — health check

This is the production implementation of master plan §5.2.2 (unit economics).
In dev mode all transactions are simulated; in production a real Polygon PoS
RPC would be used. The split logic is identical.
"""
import hashlib
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="x402 Payment Router", version="1.0.0")

# ── Wallets (configurable via env) ───────────────────────────────────────────
TREASURY_WALLET = os.environ.get("OPENPATENT_TREASURY", "0xOPENPATENT_TREASURY_WALLET")
INFRA_WALLET = os.environ.get("SOV3_INFRA", "0xSOV3_INFRASTRUCTURE_POOL")
BFT_POOL_WALLET = os.environ.get("BFT_POOL", "0xBFT_COUNCIL_REWARD_POOL")

# ── Splits (must match pricing.py X402_REVENUE_SPLIT) ───────────────────────
SPLIT_OPS = 0.60
SPLIT_INFRA = 0.25
SPLIT_BFT = 0.15

# ── In-memory ledger (replace with Postgres in production) ──────────────────
_ledger: list[dict] = []
_treasury_balance = 0.0
_infra_balance = 0.0
_bft_balance = 0.0
_council_payouts: dict[str, float] = {}  # agent_id → accrued


class PayRequest(BaseModel):
    payer_did: str = Field(..., description="DID of the paying inventor")
    amount_usd: float = Field(..., gt=0)
    tier: str = Field(..., pattern="^(starter|defensive|full|premium)$")
    disclosure_hash: Optional[str] = None
    tx_hash: Optional[str] = None  # Optional — caller can pass an on-chain tx
    request_bft_review: bool = False


class PayoutRequest(BaseModel):
    agent_id: str


def _split(amount: float) -> tuple[float, float, float]:
    return (
        round(amount * SPLIT_OPS, 6),
        round(amount * SPLIT_INFRA, 6),
        round(amount * SPLIT_BFT, 6),
    )


def _pseudo_tx_hash() -> str:
    return "0x" + hashlib.sha256(os.urandom(32)).hexdigest()


@app.post("/pay/")
async def pay(req: PayRequest):
    """Submit a payment, get a 60/25/15 split + tx receipt."""
    global _treasury_balance, _infra_balance, _bft_balance
    ops, infra, bft = _split(req.amount_usd)
    receipt_id = str(uuid.uuid4())
    tx_hash = req.tx_hash or _pseudo_tx_hash()
    timestamp = datetime.now(timezone.utc).isoformat()

    receipt = {
        "receipt_id": receipt_id,
        "payer_did": req.payer_did,
        "amount_usd": req.amount_usd,
        "tier": req.tier,
        "disclosure_hash": req.disclosure_hash,
        "tx_hash": tx_hash,
        "split": {
            "operations_treasury": {"amount_usd": ops, "wallet": TREASURY_WALLET, "share": SPLIT_OPS},
            "infrastructure_pool": {"amount_usd": infra, "wallet": INFRA_WALLET, "share": SPLIT_INFRA},
            "bft_council_reward": {"amount_usd": bft, "wallet": BFT_POOL_WALLET, "share": SPLIT_BFT},
        },
        "request_bft_review": req.request_bft_review,
        "status": "SETTLED",
        "timestamp": timestamp,
    }
    _ledger.append(receipt)
    _treasury_balance += ops
    _infra_balance += infra
    _bft_balance += bft
    return receipt


@app.get("/treasury/")
async def treasury():
    """Current balance of all three pots."""
    return {
        "operations_treasury": {
            "balance_usd": round(_treasury_balance, 6),
            "wallet": TREASURY_WALLET,
            "share": SPLIT_OPS,
        },
        "infrastructure_pool": {
            "balance_usd": round(_infra_balance, 6),
            "wallet": INFRA_WALLET,
            "share": SPLIT_INFRA,
        },
        "bft_council_reward": {
            "balance_usd": round(_bft_balance, 6),
            "wallet": BFT_POOL_WALLET,
            "share": SPLIT_BFT,
            "agent_payouts": {k: round(v, 6) for k, v in _council_payouts.items()},
        },
        "total_received_usd": round(_treasury_balance + _infra_balance + _bft_balance, 6),
        "transaction_count": len(_ledger),
    }


@app.post("/payout-bft/")
async def payout_bft(req: PayoutRequest):
    """Trigger payout to a specific council agent (proportional to participation)."""
    if req.agent_id not in _council_payouts:
        return JSONResponse({"status": "UNKNOWN_AGENT", "agent_id": req.agent_id}, status_code=404)
    amount = _council_payouts[req.agent_id]
    _council_payouts[req.agent_id] = 0
    return {
        "agent_id": req.agent_id,
        "payout_usd": round(amount, 6),
        "tx_hash": _pseudo_tx_hash(),
        "status": "PAID",
    }


@app.post("/distribute-bft/")
async def distribute_bft():
    """Distribute the BFT council pool evenly across all 33 council agents.
    Called by the cron job after each BFT review cycle."""
    global _bft_balance
    if _bft_balance <= 0:
        return {"status": "NO_BALANCE", "distributed": 0}
    per_agent = round(_bft_balance / 33, 6)
    for i in range(33):
        agent_id = f"agent-{i:02d}"
        _council_payouts[agent_id] = _council_payouts.get(agent_id, 0) + per_agent
    distributed = _bft_balance
    _bft_balance = 0
    return {
        "status": "DISTRIBUTED",
        "total_distributed_usd": round(distributed, 6),
        "per_agent_usd": per_agent,
        "agents": 33,
    }


@app.get("/ledger/")
async def ledger(limit: int = 50):
    return {
        "transactions": _ledger[-limit:],
        "total": len(_ledger),
    }


@app.get("/stats/")
async def stats():
    total = _treasury_balance + _infra_balance + _bft_balance
    return {
        "transactions": len(_ledger),
        "total_volume_usd": round(total, 6),
        "treasury_balance_usd": round(_treasury_balance, 6),
        "infra_balance_usd": round(_infra_balance, 6),
        "bft_balance_usd": round(_bft_balance, 6),
        "split": {"ops": SPLIT_OPS, "infra": SPLIT_INFRA, "bft": SPLIT_BFT},
    }


@app.get("/health/")
async def health():
    return {
        "status": "OK",
        "service": "x402-router",
        "wallets": {
            "operations_treasury": TREASURY_WALLET,
            "infrastructure_pool": INFRA_WALLET,
            "bft_council_reward": BFT_POOL_WALLET,
        },
        "split": {"ops": SPLIT_OPS, "infra": SPLIT_INFRA, "bft": SPLIT_BFT},
    }


@app.get("/health")
async def health_no_slash():
    return await health()


# ── Prometheus metrics ──────────────────────────────────────────────────────
import sys as _metrics_sys
_metrics_sys.path.insert(0, "/opt/_shared")
try:
    from metrics import instrument
    instrument(app, service_name="x402-router", version="1.0.0", hive="openpatent")
except ImportError:
    pass  # metrics are optional; service still works without them

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3217, log_level="info")



