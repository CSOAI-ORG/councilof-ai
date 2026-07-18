#!/usr/bin/env python3
"""compute_db.py — query the SOVEREIGN COMPUTE REGISTRY. Every entry primary-sourced, status-marked, catch named.

  python3 compute_db.py                 # the actionable shortlist (what to DO)
  python3 compute_db.py --all           # everything
  python3 compute_db.py --works         # only VERIFIED-usable
  python3 compute_db.py --dead          # the graveyard (what NOT to chase — this is half the value)
  python3 compute_db.py --nocard        # no credit card required
  python3 compute_db.py --train         # GPU for training
  python3 compute_db.py --api           # inference APIs
  python3 compute_db.py --hpc           # public/national HPC
  python3 compute_db.py --credits       # credit programmes
  python3 compute_db.py --stats         # the honest count
"""
import json, os, sys

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "compute_registry.json")
D = json.load(open(DB))
E = D["entries"]
ICON = {"works": "✅", "caveat": "⚠️ ", "dead": "❌", "blocked": "🚫", "gated": "🔒"}
CAT = {"train": "gpu-train", "api": "inference-api", "hpc": "hpc-public", "credits": "credit-program", "cloud": "cloud-tier"}

def show(rows, title):
    print(f"\n{'='*78}\n {title}  ({len(rows)})\n{'='*78}")
    for e in sorted(rows, key=lambda x: (x.get("priority", 9), x["name"])):
        print(f"\n{ICON.get(e['status'],'?')} {e['name']}   [{e['category']}]")
        print(f"   free: {e['free_allowance']}")
        print(f"   card: {'YES' if e.get('card') else 'no' if e.get('card') is False else '?'}"
              f" · uk: {'yes' if e.get('uk_eligible') else 'NO' if e.get('uk_eligible') is False else '?'}"
              f" · 7-14B: {'yes' if e.get('good_for_7b_14b') else 'no' if e.get('good_for_7b_14b') is False else '-'}"
              f" · {e.get('turnaround','-')}")
        if e.get("catch"):  print(f"   ⚠️  catch: {e['catch']}")
        if e.get("catch2"): print(f"   ⚠️  also:  {e['catch2']}")
        print(f"   → {e['verdict']}")
        print(f"   {e['url']}")

def stats():
    from collections import Counter
    s = Counter(e["status"] for e in E); c = Counter(e["category"] for e in E)
    print(f"\n{'='*78}\n SOVEREIGN COMPUTE REGISTRY — the honest count\n{'='*78}")
    print(f" total catalogued : {len(E)}")
    for k in ("works","caveat","dead","blocked","gated"):
        print(f"   {ICON[k]} {k:8}: {s.get(k,0)}")
    print(f"\n by category:")
    for k,v in c.most_common(): print(f"   {k:16}: {v}")
    usable = [e for e in E if e["status"]=="works" and e.get("uk_eligible") is not False]
    print(f"\n ⭐ VERIFIED-USABLE for CSOAI LTD (UK micro SME, bootstrapped, non-academic): {len(usable)}")
    print(f" ❌ dead/blocked/gated kept ON PURPOSE — knowing what NOT to chase is half the value.")
    print(f"\n {D['_meta']['honesty_rule']}\n")

if __name__ == "__main__":
    a = sys.argv[1:]
    if "--stats" in a: stats()
    elif "--all" in a: show(E, "EVERYTHING")
    elif "--works" in a: show([e for e in E if e["status"]=="works"], "VERIFIED USABLE")
    elif "--dead" in a: show([e for e in E if e["status"] in ("dead","blocked","gated")], "GRAVEYARD — do NOT chase")
    elif "--nocard" in a: show([e for e in E if e.get("card") is False and e["status"]=="works"], "NO CREDIT CARD + WORKS")
    elif any(x in a for x in ("--train","--api","--hpc","--credits","--cloud")):
        k = [x for x in a if x.lstrip("-") in CAT][0].lstrip("-")
        show([e for e in E if e["category"]==CAT[k]], CAT[k].upper())
    else:
        show([e for e in E if e.get("priority")==1 and e["status"]=="works"], "🎯 THE SHORTLIST — do these")
        print("\n(--all · --works · --dead · --nocard · --train · --api · --hpc · --credits · --stats)\n")
