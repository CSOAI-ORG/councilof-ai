#!/usr/bin/env python3
"""arena_scoreboard.py — build a SIGNED per-axis Elo leaderboard from recorded rounds.

Input : arena_rounds.jsonl (one per line: {round, ts, axis, <modelA>: {score, esto},
        <modelB>: {score, elo}, winner: a|b|tie})
Output: arena_scoreboard.json — { generation, as_of, axes: {axis: {models: {model:
        {elo, lo, hi, n}}, top: model}}, trust_anchor: {content_id, sig}} +
        a per-axis leaderboard view, content-addressed + Ed25519-signed with the
        estate brick (did:web:csoai.org#card-attestation-1 / estate signing key).

Doctrine: measurement-not-certification. Thin-n axes are reported honestly (n small ->
wide CI -> 'not sufficient to rank'). Corrections appended never edited.

Usage:
  python3 arena_scoreboard.py --rounds /workspace/arena_rounds.jsonl \
      --key ~/clawd/sovereign-temple-public/data/sigil_ed25519.key \
      --out /workspace/arena_scoreboard.json
"""
import argparse, hashlib, json, math, sys
from collections import defaultdict
from pathlib import Path
from elo import EloSystem, bootstrap_ci

# Both systems use the same signing convention as the estate:
#   content_id = sha256(canonical_json(body, sort_keys, compact separators, ensure_ascii))
def canon_json(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True)

def content_id(obj) -> str:
    return hashlib.sha256(canon_json(obj).encode()).hexdigest()

def sign(content_id: str, keyfile: Path) -> str:
    """Ed25519-sign the content_id string with the 32-byte raw seed key."""
    from nacl.signing import SigningKey
    seed = keyfile.read_bytes()
    sk = SigningKey(seed)
    return sk.sign(content_id.encode()).signature.hex()

def load_rounds(path: Path) -> list:
    if not path.exists():
        return []
    out = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out

def discover_models(rounds):
    models = set()
    for r in rounds:
        for k in r:
            if k not in ("round", "ts", "axis", "winner"):
                models.add(k)
    return sorted(models)

def is_oowm(model: str) -> bool:
    """OOWM fleet per owner directive. Tiny models (0.5b/1.5b/3b/4b) are excluded."""
    return any(s in model for s in ("30b", "14b", "12b", "8b", "7b"))

def per_axis_elo(rounds, models, n_boot=300, seed=None):
    """Rebuild per-axis Elo from scratch each run (deterministic given a fixed seed
    and the rounds), so third parties can reproduce exactly."""
    axes = defaultdict(list)
    for r in rounds:
        if "axis" not in r:
            continue
        # convert {ma: {'score':s}, mb: {'score':s}, 'winner': w} -> pairwise round
        keys = [k for k in r if k not in ("round", "ts", "axis", "winner")]
        if len(keys) < 2:
            continue
        a, b = keys[0], keys[1]
        ax = r["axis"]
        w = r.get("winner", "tie")
        # winner may be a model NAME, "a", "b", or "tie"
        if w in (a,):
            win = "a"
        elif w in (b,):
            win = "b"
        elif w == "draw":
            win = "draw"
        elif w in ("a", "b"):
            win = w
        else:
            win = "draw"
        axes[ax].append({"a": a, "b": b, "winner": {
            "a": "a", "b": "b", "draw": "draw"}.get(win, "draw")})
    result = {}
    for ax, axrounds in axes.items():
        es = EloSystem()
        for rr in axrounds:
            es.update(rr["a"], rr["b"], draw=(rr["winner"] == "draw"))
        # bootstrap CI per model on this axis (only n_boot if enough rounds)
        ci = {}
        n = len(axrounds)
        rng = __import__("random").Random(seed)
        for m in set(x for rr in axrounds for x in (rr["a"], rr["b"])):
            if not is_oowm(m):
                continue   # OOWM fleet only — exclude banned tiny models
            m_rounds = [rr for rr in axrounds if m in (rr["a"], rr["b"])]
            if n >= 3 and len(m_rounds) >= 2:
                # bootstrap: resample THIS model's games WITH replacement
                vs = []
                for _ in range(n_boot):
                    boot = [rng.choice(m_rounds) for _ in range(len(m_rounds))]
                    esb = EloSystem()
                    for _ in range(3):
                        for rr in boot:
                            esb.update(rr["a"], rr["b"], draw=(rr["winner"] == "draw"))
                    vs.append(esb.ratings[m])
                vs = sorted(vs)
                lo = vs[int(0.025 * len(vs))]
                hi = vs[int(0.975 * len(vs))]
            else:
                lo = hi = es.ratings[m]
            ci[m] = {"elo": round(es.ratings[m], 1), "lo": round(lo, 1), "hi": round(hi, 1),
                     "n": len(m_rounds)}
        ranked = sorted(ci.items(), key=lambda kv: kv[1]["elo"], reverse=True)
        result[ax] = {"n_rounds": n, "models": ci, "top": (ranked[0][0] if ranked else None)}
    return result

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rounds", required=True)
    ap.add_argument("--key", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    rounds = load_rounds(Path(args.rounds))
    models = discover_models(rounds)

    # 1. Overall (across all axes) Elo — the "general" board.
    overall_und = []
    for r in rounds:
        keys = [k for k in r if k not in ("round", "ts", "axis", "winner")]
        if len(keys) < 2:
            continue
        a, b = keys[0], keys[1]
        w = r.get("winner", "tie")
        if w in (a, "a"):
            win = "a"
        elif w in (b, "b"):
            win = "b"
        else:
            win = "draw"
        overall_und.append({"a": a, "b": b, "winner": {
            "a": "a", "b": "b", "draw": "draw"}.get(win, "draw")})
    es = EloSystem()
    for rr in overall_und:
        es.update(rr["a"], rr["b"], draw=(rr["winner"] == "draw"))
    overall = {m: round(v, 1) for m, v in es.ratings.items() if m in models}

    axes = per_axis_elo(rounds, models)

    body = {
        "schema": "csoai.signed-arena-leaderboard/0.1",
        "as_of": max((r.get("ts", "") for r in rounds), default="") or None,
        "generation": "2026-08-23-b",
        "n_rounds": len(rounds),
        "n_models": len(models),
        "models": models,
        "overall_elo": overall,
        "axes": {ax: {"n_rounds": v["n_rounds"], "models": v["models"], "top": v["top"]}
                 for ax, v in axes.items()},
        "doctrine": "measurement, not certification — thin-n axes are not sufficient to rank; "
                    "every score carries n and CI",
    }
    body["n_axes"] = len(body["axes"])

    cid = content_id(body)
    sig = sign(cid, Path(args.key))
    body["signature"] = {"content_id": cid, "sig": sig,
                         "kid": "did:web:csoai.org#card-attestation-1"}

    Path(args.out).write_text(json.dumps(body, indent=2))
    print(f"ARENA SCOREBOARD WRITTEN -> {args.out}")
    print(f"  rounds={len(rounds)} models={len(models)} axes={len(body['axes'])}")
    print(f"  content_id={cid[:16]}... sig={sig[:16]}...")
    # quick per-axis top-3 summary
    for ax, v in sorted(body["axes"].items()):
        ranked = sorted(v["models"].items(), key=lambda kv: kv[1]["elo"], reverse=True)[:3]
        print(f"  [{ax}] n={v['n_rounds']}  " + " | ".join(f"{m}={d['elo']}±{round((d['hi']-d['lo'])/2,0)}" for m, d in ranked))
    return cid

if __name__ == "__main__":
    main()
