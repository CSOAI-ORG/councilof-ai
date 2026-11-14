from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from .models import (
    CostEstimate,
    RiskState,
    Side,
    SwarmPolicy,
    SwarmVerdict,
    TradeIntent,
)


def _risk_blockers(risk: RiskState) -> list[str]:
    blockers: list[str] = []
    if risk.kill_switch:
        blockers.append("kill_switch")
    if risk.stale_data:
        blockers.append("stale_data")
    if risk.current_drawdown_pct >= risk.max_drawdown_pct:
        blockers.append("max_drawdown")
    if risk.daily_loss_pct >= risk.max_daily_loss_pct:
        blockers.append("max_daily_loss")
    if risk.asset_exposure_pct >= risk.max_asset_exposure_pct:
        blockers.append("max_asset_exposure")
    return blockers


def _group_representatives(
    intents: Iterable[TradeIntent], sigma_floor_bps: float
) -> list[tuple[str, Side, float, float, str]]:
    """Collapse correlated agents so clones cannot manufacture consensus."""
    grouped: dict[str, list[TradeIntent]] = defaultdict(list)
    for intent in intents:
        if intent.side is not Side.HOLD:
            grouped[intent.correlation_group].append(intent)

    reps: list[tuple[str, Side, float, float, str]] = []
    for group, rows in grouped.items():
        best = max(
            rows,
            key=lambda x: x.confidence / max(x.sigma_bps, sigma_floor_bps),
        )
        precision = best.confidence / max(best.sigma_bps, sigma_floor_bps)
        reps.append(
            (
                group,
                best.side,
                best.expected_gross_edge_bps,
                precision,
                best.source,
            )
        )
    return reps


def score_swarm(
    intents: Iterable[TradeIntent],
    costs: CostEstimate,
    risk: RiskState | None = None,
    policy: SwarmPolicy | None = None,
) -> SwarmVerdict:
    intents = list(intents)
    if not intents:
        raise ValueError("at least one TradeIntent is required")

    asset = intents[0].asset
    if any(i.asset != asset for i in intents):
        raise ValueError("score_swarm accepts one asset at a time")

    risk = risk or RiskState()
    policy = policy or SwarmPolicy()
    blockers = _risk_blockers(risk)

    reps = _group_representatives(intents, policy.sigma_floor_bps)
    if not reps:
        return SwarmVerdict(
            asset=asset,
            side=Side.HOLD,
            allowed=False,
            expected_gross_edge_bps=0,
            estimated_cost_bps=costs.total_bps,
            expected_net_edge_bps=-costs.total_bps,
            calibrated_confidence=0,
            consensus=0,
            independent_groups=0,
            contributors=[],
            blockers=blockers + ["no_directional_signal"],
        )

    total_precision = sum(r[3] for r in reps)
    buy_precision = sum(r[3] for r in reps if r[1] is Side.BUY)
    sell_precision = sum(r[3] for r in reps if r[1] is Side.SELL)
    side = Side.BUY if buy_precision >= sell_precision else Side.SELL
    winning_precision = max(buy_precision, sell_precision)
    consensus = winning_precision / total_precision if total_precision else 0.0

    winners = [r for r in reps if r[1] is side]
    win_precision = sum(r[3] for r in winners)
    gross_edge = (
        sum(edge * precision for _, _, edge, precision, _ in winners)
        / win_precision
        if win_precision
        else 0.0
    )

    # Confidence is consensus tempered by the average precision-derived
    # uncertainty of the independent winning groups.
    mean_conf = 0.0
    if winners:
        mean_conf = sum(
            next(
                i.confidence
                for i in intents
                if i.source == source and i.correlation_group == group
            )
            for group, _, _, _, source in winners
        ) / len(winners)
    calibrated_confidence = min(1.0, consensus * mean_conf)
    net_edge = gross_edge - costs.total_bps

    independent_groups = len(winners)
    if independent_groups < policy.min_independent_groups:
        blockers.append("insufficient_independent_groups")
    if consensus < policy.min_consensus:
        blockers.append("low_consensus")
    if calibrated_confidence < policy.min_calibrated_confidence:
        blockers.append("low_calibrated_confidence")
    if net_edge < policy.min_net_edge_bps:
        blockers.append("insufficient_net_edge")

    return SwarmVerdict(
        asset=asset,
        side=side if not blockers else Side.HOLD,
        allowed=not blockers,
        expected_gross_edge_bps=round(gross_edge, 4),
        estimated_cost_bps=round(costs.total_bps, 4),
        expected_net_edge_bps=round(net_edge, 4),
        calibrated_confidence=round(calibrated_confidence, 6),
        consensus=round(consensus, 6),
        independent_groups=independent_groups,
        contributors=[r[4] for r in winners],
        blockers=blockers,
    )
