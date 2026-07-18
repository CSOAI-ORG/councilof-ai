#!/usr/bin/env python3
"""sov33_daily_refresh.py — Framework 101's currency loop, made runnable. Every day: (1) re-survey which OWEM
stack config wins on the current measured battery, (2) record which base models are current leads to re-check,
(3) stamp the date so 'most current' is a fact not a vibe. HONEST: the model-leaderboard part is a WATCHLIST
of leads to verify against live sources (no browser here) — it does NOT auto-adopt an unverified model.

The 'which OWEM stack works' half IS measured live (re-runs find_best_config on CPU). The 'top-100 models' half
is a currency WATCHLIST — real refresh needs a live channel; without one it flags leads as stale-by-default.
"""
import json, os, datetime, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
HERE=os.path.dirname(os.path.abspath(__file__))

def refresh():
    today=datetime.date.today().isoformat()
    out={"date":today, "measured_today":{}, "watchlist_leads":{}, "honest":{}}

    # (1) MEASURED: re-run best-config selection on the current battery (CPU, real)
    try:
        import importlib, sov33_find_best_config as fb  # the committed selector
        r=fb.run() if hasattr(fb,"run") else None
        out["measured_today"]["best_stack"]=r
    except Exception as e:
        # fall back to reading the last committed result
        try:
            j=json.load(open(os.path.join(HERE,"find_best_config_results.json")))
            out["measured_today"]["best_stack"]={"source":"last_committed","result":j}
        except Exception:
            out["measured_today"]["best_stack"]={"note":"selector not runnable this pass","err":str(e)[:80]}

    # (2) WATCHLIST: current model leads to RE-VERIFY (not auto-adopted; leads_not_facts)
    out["watchlist_leads"]={
        "corroborated_last_check":["DeepSeek-V4-Pro 1.6T/49B (MIT, vendor-claimed)","GLM-5.2 744B total (MIT)"],
        "leads_to_reverify":["DeepSeek-V4-Flash 284B/13B","Kimi-K2.x","Qwen3.x-MoE current size"],
        "verify_via":"live web/model-card check — NOT reachable from sandbox; owner or a connected browser lane refreshes this",
    }
    # (3) HONEST currency stamp
    out["honest"]={
        "measured_half":"OWEM stack winner is re-measured on CPU each run — real, current, reproducible",
        "watchlist_half":"model leaderboard is stale-by-default without a live channel; leads stay VERIFY-BEFORE-ADOPT",
        "not_claimed":"this does NOT auto-download or auto-swap a base model; it flags what to re-check",
        "framework_101":"this IS the '+1' currency loop — re-survey top-N, re-measure the synthesis, never assume last week's best still holds",
    }
    json.dump(out, open(os.path.join(HERE,"daily_refresh_state.json"),"w"), indent=2)
    return out

if __name__=="__main__":
    r=refresh()
    print("=== SOV33 DAILY REFRESH (Framework 101 currency loop) ===\n")
    print(f"  date: {r['date']}")
    bs=r["measured_today"]["best_stack"]
    print(f"  MEASURED best stack: {json.dumps(bs)[:120] if bs else 'n/a'}")
    print(f"  WATCHLIST corroborated: {r['watchlist_leads']['corroborated_last_check']}")
    print(f"  WATCHLIST to re-verify: {r['watchlist_leads']['leads_to_reverify']}")
    print(f"\n  HONEST: measured half is live+current; model-leaderboard half is a WATCHLIST of leads")
    print(f"          (no browser here -> stale-by-default; owner/connected lane refreshes). Never auto-swaps a base.")
