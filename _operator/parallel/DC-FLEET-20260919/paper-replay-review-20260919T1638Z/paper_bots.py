"""Bounded offline paper-strategy replay. No exchange client or order interface."""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import math
from pathlib import Path

UTC = dt.timezone.utc
ASSUMPTIONS = {"initial_virtual_quote": 1000.0, "target_entry_fraction": 0.20,
    "fee_bps_per_side": 10.0, "slippage_bps_per_side": 5.0,
    "signal_lookback_observations": 5, "signal_threshold_bps": 10.0,
    "maximum_gap_seconds": 90, "minimum_observations": 30,
    "fill_model": "next observed ask/bid plus assumed slippage; no queue model",
    "cost_source": "illustrative assumptions, not an exchange fee quotation"}
STRATEGIES = ("cash_baseline", "buy_hold_paper", "momentum_paper", "reversion_paper")
SYMBOLS = ("BTC/USDC", "ETH/USDC", "LINK/USDC", "ONDO/USDC")
VENUES = ("coinbase", "kraken", "okx")
DB = Path("/Users/iokfarm/gspc-shadow-lab/data/shadow_market.duckdb")

def timestamp(value):
    date = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if date.tzinfo is None:
        raise ValueError("missing timezone")
    return date.astimezone(UTC)

def number(value, minimum=0):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > minimum

def clean_rows(rows):
    accepted, invalid, duplicate_times = {}, 0, set()
    for row in rows:
        try:
            when = timestamp(row["observed_at"])
            if when in accepted or when in duplicate_times:
                accepted.pop(when, None)
                duplicate_times.add(when)
                raise ValueError("duplicate timestamp")
            if not number(row["bid"]) or not number(row["ask"]):
                raise ValueError("invalid quote")
            if row["ask"] < row["bid"]:
                raise ValueError("crossed quote")
            accepted[when] = dict(row, observed_at=when.isoformat())
        except (KeyError, TypeError, ValueError, OverflowError):
            invalid += 1
    return [accepted[key] for key in sorted(accepted)], invalid, len(duplicate_times)

def replay(rows, strategy, assumptions=None):
    if strategy not in STRATEGIES:
        raise ValueError("unknown paper strategy")
    a = dict(ASSUMPTIONS if assumptions is None else assumptions)
    if a != ASSUMPTIONS:
        raise ValueError("this bounded demonstration uses fixed disclosed assumptions")
    rows, invalid, duplicates = clean_rows(rows)
    result = {"strategy": strategy, "valid_observations": len(rows),
        "invalid_rows": invalid, "duplicate_timestamps": duplicates,
        "mode": "OFFLINE_SIMULATION", "live_execution_allowed": False}
    if len(rows) < a["minimum_observations"]:
        return dict(result, status="INSUFFICIENT_DATA", virtual_profit=None, fills=[])
    cash, units, peak, drawdown = a["initial_virtual_quote"], 0.0, a["initial_virtual_quote"], 0.0
    fee, slip = a["fee_bps_per_side"]/10000, a["slippage_bps_per_side"]/10000
    pending, history, fills, gap_count, total_fees = None, [], [], 0, 0.0
    previous_time = None
    for row in rows:
        when, bid, ask = timestamp(row["observed_at"]), row["bid"], row["ask"]
        gap = previous_time is not None and (when-previous_time).total_seconds() > a["maximum_gap_seconds"]
        if gap:
            pending, history = None, []
            gap_count += 1
        sell_price = bid*(1-slip)
        if pending is not None:
            fraction, decision_time = pending
            liquidation_value = cash + units*sell_price*(1-fee)
            target_units = liquidation_value*fraction/ask
            change = target_units-units
            if change > 1e-10 and units == 0:
                price = ask*(1+slip)
                quantity = min(change, cash/(price*(1+fee)))
                cost = quantity*price
                cash -= cost*(1+fee)
                units += quantity
                total_fees += cost*fee
                fills.append({"side": "buy", "quantity": quantity, "price": price,
                    "fee": cost*fee, "signal_at": decision_time, "fill_at": row["observed_at"]})
            elif change < -1e-10 and fraction == 0:
                quantity = units
                proceeds = quantity*sell_price
                cash += proceeds*(1-fee)
                units = 0.0
                total_fees += proceeds*fee
                fills.append({"side": "sell", "quantity": quantity, "price": sell_price,
                    "fee": proceeds*fee, "signal_at": decision_time, "fill_at": row["observed_at"]})
        equity = cash + units*sell_price*(1-fee)
        peak = max(peak, equity)
        drawdown = max(drawdown, (peak-equity)/peak)
        assert cash >= -1e-8 and units >= 0
        history.append((bid+ask)/2)
        lookback = a["signal_lookback_observations"]
        fraction = None
        if strategy == "cash_baseline":
            fraction = 0.0
        elif strategy == "buy_hold_paper":
            fraction = a["target_entry_fraction"]
        elif len(history) > lookback:
            move = 10000*(history[-1]/history[-1-lookback]-1)
            threshold = a["signal_threshold_bps"]
            if strategy == "momentum_paper":
                fraction = a["target_entry_fraction"] if move > threshold else 0.0
            else:
                fraction = a["target_entry_fraction"] if move < -threshold else 0.0
        pending = (fraction, row["observed_at"]) if fraction is not None else None
        previous_time = when
    return dict(result, status="SIMULATED_NOT_VALIDATED", start=rows[0]["observed_at"],
        end=rows[-1]["observed_at"], virtual_cash=cash, virtual_asset_units=units,
        estimated_liquidation_value=equity, virtual_profit=equity-a["initial_virtual_quote"],
        fees_on_simulated_fills=total_fees, maximum_drawdown_fraction=drawdown,
        gap_count=gap_count, simulated_fill_count=len(fills), fills=fills,
        final_signal_not_filled=True, evidence_of_live_profitability=False)

def load_rows():
    import duckdb
    con = duckdb.connect(str(DB), read_only=True)
    try:
        cursor = con.execute("""SELECT observed_at, symbol, exchange, bid, ask
            FROM shadow_snapshots WHERE observed_at >= now()-INTERVAL '2 hours'
            ORDER BY observed_at, symbol, exchange LIMIT 20001""")
        rows = [dict(zip([item[0] for item in cursor.description], row)) for row in cursor.fetchall()]
    finally:
        con.close()
    if len(rows) > 20000:
        raise ValueError("bounded replay row limit exceeded")
    for row in rows:
        row["observed_at"] = row["observed_at"].astimezone(UTC).isoformat()
        for field in ("bid", "ask"):
            if isinstance(row[field], float) and not math.isfinite(row[field]):
                row[field] = None
    return rows

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()

def report(include_inputs=False):
    rows = load_rows()
    results = []
    for symbol in SYMBOLS:
        for venue in VENUES:
            selected = [row for row in rows if row["symbol"] == symbol and row["exchange"] == venue]
            for strategy in STRATEGIES:
                result = replay(selected, strategy)
                result.update(symbol=symbol, exchange=venue)
                if not include_inputs:
                    result.pop("fills", None)
                results.append(result)
    at = dt.datetime.now(UTC)
    latest = max((timestamp(row["observed_at"]) for row in rows), default=None)
    result = {"schema": "csoai.paper-replay/0.1", "as_of": at.isoformat(),
        "mode": "OFFLINE_SIMULATION", "assumptions": ASSUMPTIONS,
        "input_rows": len(rows), "input_sha256": digest(rows),
        "latest_collector_age_seconds": (at-latest).total_seconds() if latest else None,
        "source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "results": results, "executed_live_orders": 0, "real_money_used": 0,
        "limits": ["Not native Hummingbot bots; no continuously running strategy",
            "Collector timestamps, not exchange event times; polling gaps remain",
            "Assumed fills/costs; no order queue, available-depth or market-impact model",
            "No held-out validation; no proof of live profitability; no live promotion"]}
    if include_inputs:
        result["retained_inputs"] = rows
    return result
