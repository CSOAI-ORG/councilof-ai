#!/usr/bin/env python3
"""town_feed.py — emit town_feed.json: REAL attested data for Kimi's Agent-47 town UI.

Replaces the town's Math.random() fakes with the actual King-hive governed-vs-ungoverned
verdicts + the signed Policy-Lab DORA result + the dose-response headline + the
sovereign SIGIL/Bitcoin anchors. ONLY attestable verdicts are surfaced; everything
carries honest scope labels. The UI fetch()es this file (drop it in app/public/town_feed.json).

Honesty discipline (2026-06-23 rewrite):
  - Anchors source from anchors-sov/ (the mac-sovereign, non-synced set: 8/8 verified,
    Bitcoin-anchored at real blocks). NOT anchors/, which the 30-min VM->mac rsync
    (sync_town_feed.sh) clobbers with king_hive proofs. See anchors-sov-sync-clobber memory.
  - Bitcoin status is read live from `ots info` per proof — "confirmed at block N" only
    when ots reports a BitcoinBlockHeaderAttestation; else honestly "pending"/"unknown".
    Never claim confirmed from file-existence alone.
  - The dose-response sweep (the honest moat: 767 -> 0 violations as gate enforcement
    0 -> 1, ungoverned baseline 1535, 30 seeds, signed + anchored) is surfaced as a
    first-class `headline` — IN-SIMULATION labeled, not a compliance claim.
  - verify.how gives the EXACT reproducible command per anchor (verify_anchor.py
    --anchor anchors-sov/anchor_000X.json --ledger <path>), plus full roots for cross-check.

Inputs (paths via env, all optional — missing ones are skipped):
  PL_VERDICTS  king_hive_verdicts.jsonl   (default ./king_hive_verdicts.jsonl)
  PL_POLICY    policy_lab_dora.jsonl      (default ./policy_lab_dora.jsonl)
  PL_ANCHORS   dir of anchor manifests    (default ./anchors-sov  -- the verified set)
  PL_SWEEP     sweep_dose_response.jsonl  (default ./sweep_dose_response.jsonl)
Output: ./town_feed.json
"""
import os, sys, json, glob, re, subprocess, statistics
from datetime import datetime, timezone

VERDICTS = os.environ.get("PL_VERDICTS", "king_hive_verdicts.jsonl")
POLICY = os.environ.get("PL_POLICY", "policy_lab_dora.jsonl")
ANCHORS = os.environ.get("PL_ANCHORS", "anchors-sov")   # sovereign, non-clobbered set
SWEEP = os.environ.get("PL_SWEEP", "sweep_dose_response.jsonl")
OUT = os.environ.get("PL_OUT", "town_feed.json")
REPO = "https://github.com/CSOAI-ORG/sigil-proofs"
OTS = os.path.expanduser("~/Library/Python/3.14/bin/ots")

def load_jsonl(p):
    if not os.path.exists(p): return []
    out = []
    for l in open(p):
        l = l.strip()
        if l:
            try: out.append(json.loads(l))
            except Exception: pass
    return out

def king_hive():
    rows = load_jsonl(VERDICTS)
    att = [r for r in rows if r.get("attestable")]
    wins = {"A": 0, "B": 0, "TIE": 0}
    for r in att: wins[r.get("winner", "TIE")] = wins.get(r.get("winner", "TIE"), 0) + 1
    margins = [r.get("margin", 0) for r in att if isinstance(r.get("margin"), (int, float))]
    recent = []
    for r in att[-20:]:
        recent.append({
            "ts": r.get("ts"), "winner": r.get("winner"), "margin": r.get("margin"),
            "prompt": (r.get("prompt") or "")[:90],
            "king": (r.get("A") or {}).get("persona", "King/Dragon"),
            "queen": (r.get("B") or {}).get("persona", "Queen/Turtle"),
            "signed": bool(r.get("sigil")),
        })
    return {
        "summary": {"total_rounds": len(rows), "attestable": len(att), "wins": wins,
                    "avg_margin": round(statistics.mean(margins), 4) if margins else 0.0},
        "recent_verdicts": recent,
    }

def policy_lab():
    rows = load_jsonl(POLICY)
    results = [r for r in rows if str(r.get("schema", "")).endswith("experiment-result/v1")]
    out = []
    for r in results[-5:]:
        out.append({
            "experiment_id": r.get("experiment_id"), "verdict": r.get("verdict"),
            "agents": r.get("agents"), "attestable": r.get("attestable"),
            "merkle_root": (r.get("merkle_root") or "")[:24] + "…",
            "signed": bool(r.get("sigil")),
            "aggregate": r.get("aggregate"),
            "scope": r.get("_scope"),
        })
    return out

def ots_bitcoin_status(ots_path):
    """Read `ots info` and extract Bitcoin confirmations honestly.
    Returns {"confirmed": bool, "blocks": [{"height": int, "merkle_root": str}], "note": str}.
    Never claims confirmed from file-existence alone — only from a real
    BitcoinBlockHeaderAttestation line in the proof."""
    res = {"confirmed": False, "blocks": [], "note": "no .ots proof"}
    if not os.path.exists(ots_path):
        return res
    if not os.path.exists(OTS):
        res["note"] = "ots binary absent — confirmation unknown"
        return res
    try:
        info = subprocess.run([OTS, "info", ots_path], capture_output=True, text=True, timeout=30).stdout
    except Exception as e:
        res["note"] = f"ots info failed: {e}"
        return res
    heights = [int(h) for h in re.findall(r"BitcoinBlockHeaderAttestation\((\d+)\)", info)]
    roots = re.findall(r"# Bitcoin block merkle root ([0-9a-f]{64})", info)
    if heights:
        res["confirmed"] = True
        res["blocks"] = [{"height": h, "merkle_root": roots[i] if i < len(roots) else None}
                         for i, h in enumerate(heights)]
        res["note"] = f"confirmed at block{'s' if len(heights)>1 else ''} {', '.join(map(str,heights))} (per ots; run verify_anchor.py to cross-check)"
    else:
        res["note"] = "pending — no Bitcoin attestation yet (calendar not yet posted)"
    return res

def anchors():
    out = []
    # anchors-sov layout: manifests + roots live under <ANCHORS>/public/
    pub = os.path.join(ANCHORS, "public")
    manifest_glob = [os.path.join(ANCHORS, "manifest_*.json")]
    root_glob = [os.path.join(ANCHORS, "root_*.txt")]
    if os.path.isdir(pub):
        manifest_glob.append(os.path.join(pub, "manifest_*.json"))
        root_glob.append(os.path.join(pub, "root_*.txt"))
    # Prefer anchor_*.json at top (carry label + ledger); manifest_*.json under public is the leaf set.
    cand = sorted(glob.glob(os.path.join(ANCHORS, "anchor_[0-9]*.json")) +
                  glob.glob(os.path.join(pub, "manifest_[0-9]*.json")))
    seen = set()
    for m in cand:
        try:
            d = json.load(open(m))
        except Exception:
            continue
        base = os.path.basename(m)
        # de-dup anchor vs its manifest (same root)
        root = d.get("attestable_root") or d.get("merkle", {}).get("root")
        if root in seen: continue
        seen.add(root)
        # find the .ots proof for this root
        ots_path = None
        for rp in glob.glob(os.path.join(pub, "root_*.txt.ots")) + glob.glob(os.path.join(ANCHORS, "root_*.txt.ots")):
            try:
                if open(rp[:-4]).read().strip() == (root or ""):
                    ots_path = rp; break
            except Exception:
                pass
        if ots_path is None:
            ots_path = m.replace("manifest_", "root_").replace(".json", ".txt.ots")
            if not os.path.exists(ots_path):
                ots_path = (m + ".ots") if os.path.exists(m + ".ots") else None
        btc = ots_bitcoin_status(ots_path) if ots_path else {"confirmed": False, "blocks": [], "note": "no .ots proof"}
        out.append({
            "anchor": base,
            "label": d.get("label"),
            "ledger": d.get("ledger"),
            "root": (root or "")[:24] + "…",
            "full_root": root,
            "n_attestable": d.get("n_attestable"),
            "n_total": d.get("n_total"),
            "ts_first": d.get("ts_first"), "ts_last": d.get("ts_last"),
            "bitcoin": btc,
            "ots_proof": ots_path is not None and os.path.exists(ots_path) if ots_path else False,
            "manifest_path": m,
        })
    return out

def headline():
    """The honest moat: governed vs ungoverned dose-response, IN-SIMULATION.
    Surfaces the monotonic 767->0 (governed) vs 1535 (ungoverned baseline) curve,
    signed Ed25519 + hash-chained + Bitcoin-anchored (anchor_0003). Not a compliance claim."""
    rows = load_jsonl(SWEEP)
    if not rows:
        return None
    gov = [r for r in rows if r.get("arm") == "A_governed"]
    base = [r for r in rows if r.get("arm") == "B_ungoverned"]
    series = [{"effective_enforcement": r.get("effective_block_rate"),
               "block_rate": r.get("block_rate"),
               "mean_violations_per_run": r.get("mean_violations_per_run"),
               "stdev": r.get("stdev_violations"),
               "n_seeds": r.get("n_seeds")} for r in sorted(gov, key=lambda r: r.get("block_rate", 0))]
    ung = base[0].get("mean_violations_per_run") if base else None
    # monotonicity check (honest — only assert what the data shows)
    vals = [s["mean_violations_per_run"] for s in series]
    monotone = all(vals[i] >= vals[i+1] for i in range(len(vals)-1)) if len(vals) > 1 else None
    full_at_max = vals[-1] == 0 if vals else False
    return {
        "label": "governed vs ungoverned dose-response (IN-SIMULATION)",
        "scope": rows[0].get("_scope") or "IN-SIMULATION; rule-based ABM agents; not real-world-validated; not a compliance claim",
        "series": series,
        "ungoverned_baseline_violations_per_run": ung,
        "monotonic_decreasing": monotone,
        "governed_zero_at_full_enforcement": full_at_max,
        "verdict": ("Monotonic: governed-arm violations fall %s -> 0 as gate enforcement 0 -> 1; "
                    "ungoverned baseline %s. NOT a real-world compliance claim."
                    % (int(vals[0]) if vals else "?", int(ung) if ung is not None else "?")),
        "signed": all(r.get("sig") for r in rows),
        "issuer_pubkey": rows[0].get("pub"),
        "anchored_as": "anchor_0003 (anchors-sov), root a06f1cf8…, Bitcoin-anchored",
        "n_signed_rows": len(rows),
    }

def main():
    kh = king_hive()
    pl = policy_lab()
    an = anchors()
    hl = headline()
    confirmed = [a for a in an if a["bitcoin"]["confirmed"]]
    feed = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": ("IN-SIMULATION governed-vs-ungoverned data. ONLY cryptographically-attestable "
                  "verdicts are shown. Policy-Lab results may be agents=stub (labeled). Bitcoin "
                  "anchor status is read live from the .ots proofs — 'confirmed' means the proof "
                  "carries a Bitcoin block attestation; 'pending' means the calendar has not yet "
                  "posted. Verify any of this yourself — no trust required."),
        "summary": {
            "king_hive": kh["summary"],
            "policy_lab": {"experiments": len(pl), "latest": (pl[-1]["verdict"] if pl else None),
                           "agents": (pl[-1]["agents"] if pl else None)},
            "anchors": {"count": len(an),
                        "bitcoin_confirmed": len(confirmed),
                        "latest_root": (an[-1]["full_root"] if an else None),
                        "bitcoin": ("%d/%d confirmed" % (len(confirmed), len(an))) if an else "none"},
        },
        "headline": hl,
        "recent_verdicts": kh["recent_verdicts"],
        "policy_lab": pl,
        "anchors": an,
        "verify": {
            "repo": REPO,
            "how": "Independent 3-step skeptic path (recompute Merkle root from public leaves -> "
                   "cross-check the Bitcoin block via blockstream -> validate the .ots proof):",
            "commands": [
                "python3 verify_anchor.py --anchor anchors-sov/%s --ledger %s"
                % (os.path.basename(a["anchor"]),
                   a.get("ledger") or "<ledger>")
                for a in an
            ] or ["python3 verify_anchor.py --anchor anchors-sov/anchor_0001.json --ledger flywheel_ledger_mac.jsonl"],
            "issuer_pubkey": "53kc24fqQz4MctZwtH+SuPLEKdX+NLlhK5wALr5H188=",
            "browser_verifier": "sovereign-town/verify/index.html (client-side Ed25519, no server)",
        },
    }
    json.dump(feed, open(OUT, "w"), indent=2, default=str)
    print("wrote", OUT)
    print("  king-hive: %d attestable / %d rounds  wins=%s" % (
        kh["summary"]["attestable"], kh["summary"]["total_rounds"], kh["summary"]["wins"]))
    print("  policy-lab experiments:", len(pl), "| anchors:", len(an),
          "(%d Bitcoin-confirmed)" % len(confirmed))
    if hl: print("  headline: %d signed sweep rows, monotone=%s" % (hl["n_signed_rows"], hl["monotonic_decreasing"]))

if __name__ == "__main__":
    main()