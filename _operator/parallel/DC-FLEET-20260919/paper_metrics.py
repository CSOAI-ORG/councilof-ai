"""Offline review candidate only; no trading, network or filesystem actions."""
from collections import defaultdict
import math


def score(rows):
    values=[]; by_symbol=defaultdict(list); rejected=0; excluded=0; conflicts=0
    for row in rows:
        if not isinstance(row,dict):
            rejected+=1
            continue
        if row.get('execution')!='disabled':
            excluded+=1
            continue
        value=row.get('net_return_bps')
        try:
            if value is None or isinstance(value,bool):
                raise ValueError('missing or boolean outcome')
            value=float(value)
            if not math.isfinite(value):
                raise ValueError('nonfinite outcome')
        except (TypeError,ValueError,OverflowError):
            rejected+=1
            continue
        flag=row.get('profitable_after_estimated_cost')
        if flag is not None and (not isinstance(flag,bool) or flag!=(value>0)):
            conflicts+=1
        values.append(value)
        by_symbol[str(row.get('symbol','unknown'))].append(value)
    count=len(values)
    return {'execution':'disabled','settled_outcomes':count,
        'net_bps_total':round(math.fsum(values),3) if count else None,
        'net_bps_mean':round(math.fsum(values)/count,3) if count else None,
        'cost_adjusted_win_rate':sum(x>0 for x in values)/count if count else None,
        'by_symbol_net_bps':{k:round(math.fsum(v),3) for k,v in sorted(by_symbol.items())},
        'rejected_outcomes':rejected,'excluded_nonpaper_rows':excluded,
        'inconsistent_profit_flags':conflicts,
        'eligible_for_live_promotion':False,
        'pnl_in_currency':None,
        'status':'OBSERVED_REPORTED_PAPER_RETURNS' if count else 'INSUFFICIENT_DATA',
        'limits':['Reported net returns are not independently verified fills or fees',
            'Sum of per-outcome basis points is not portfolio dollar profit',
            'No capital allocation, independence or out-of-sample performance established']}
