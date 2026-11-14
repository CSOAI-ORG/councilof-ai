from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class Side(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class TradeIntent(BaseModel):
    """Normalized proposal emitted by any trading/research agent."""

    source: str
    asset: str
    side: Side
    horizon_seconds: int = Field(gt=0)
    expected_gross_edge_bps: float = Field(ge=0)
    confidence: float = Field(ge=0, le=1)
    sigma_bps: float = Field(gt=0)
    correlation_group: str
    evidence_ids: List[str] = Field(default_factory=list)
    regime: str = "unknown"
    session: str = "unknown"
    observed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class CostEstimate(BaseModel):
    """All-in estimated round-trip friction in basis points."""

    entry_fee_bps: float = Field(default=0, ge=0)
    exit_fee_bps: float = Field(default=0, ge=0)
    spread_bps: float = Field(default=0, ge=0)
    slippage_bps: float = Field(default=0, ge=0)
    gas_bps: float = Field(default=0, ge=0)
    adverse_selection_bps: float = Field(default=0, ge=0)
    latency_bps: float = Field(default=0, ge=0)

    @property
    def total_bps(self) -> float:
        return (
            self.entry_fee_bps
            + self.exit_fee_bps
            + self.spread_bps
            + self.slippage_bps
            + self.gas_bps
            + self.adverse_selection_bps
            + self.latency_bps
        )


class RiskState(BaseModel):
    kill_switch: bool = False
    stale_data: bool = False
    current_drawdown_pct: float = Field(default=0, ge=0)
    max_drawdown_pct: float = Field(default=8, gt=0)
    daily_loss_pct: float = Field(default=0, ge=0)
    max_daily_loss_pct: float = Field(default=3, gt=0)
    asset_exposure_pct: float = Field(default=0, ge=0)
    max_asset_exposure_pct: float = Field(default=25, gt=0)


class SwarmPolicy(BaseModel):
    min_independent_groups: int = Field(default=2, ge=1)
    min_consensus: float = Field(default=0.60, ge=0, le=1)
    min_calibrated_confidence: float = Field(default=0.55, ge=0, le=1)
    min_net_edge_bps: float = Field(default=15, ge=0)
    sigma_floor_bps: float = Field(default=10, gt=0)


class SwarmVerdict(BaseModel):
    asset: str
    side: Side
    allowed: bool
    expected_gross_edge_bps: float
    estimated_cost_bps: float
    expected_net_edge_bps: float
    calibrated_confidence: float
    consensus: float
    independent_groups: int
    contributors: List[str]
    blockers: List[str]
