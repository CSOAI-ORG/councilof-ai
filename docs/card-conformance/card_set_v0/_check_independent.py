"""card_set_v0 checker — set-level. How many entries conform, and gaps:
duplicate content-hash, declared-vs-actual count mismatch. Stdlib only."""
import re,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),"..","card_v0"))
from _check_independent import check as one
def check_set(index):
    cards=index.get("cards",[]); gaps=[]; seen=set(); conform=0
    for c in cards:
        if one(c)["conforms"]: conform+=1
        h=c.get("card") if isinstance(c,dict) else None
        if h in seen: gaps.append("duplicate:"+h)
        elif h: seen.add(h)
    dec=index.get("n_cards")
    if dec is not None and dec!=len(cards): gaps.append(f"n_cards_declared_{dec}_actual_{len(cards)}")
    return {"conform":conform,"gaps":gaps}
