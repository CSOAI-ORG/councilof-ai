#!/usr/bin/env python3
"""emit_signals.py — per-axis SIGNED SIGNAL emitter.

Reads the axis register (GET /api/axis-register, or --register-file) and the per-axis Elo
reference (public/arena/elo_reference.json), derives ONE signal per register axis, signs it
and writes public/signals/<axis>.signed.json plus _index.json.

Two signing paths, chosen by flag:
  --key <pem>              the estate city key (a node that holds /root/.sovos/city_ed25519):
                           style B — Ed25519 over the content_id string, pubkey inline.
  --pod-token-file <file>  a pod without the key: POST /api/board-sign signs the canonical
                           signal bytes with did:web:csoai.org#board-attestation-1 (the PKCS8
                           never leaves Cloudflare). The signal records that signer and names
                           the signer it supersedes; it never claims the old key signed it.

Honest register (2026-09-22): the 24 Aug signals said status MEASURED with elo_leader null on
9 of 13 axes. A signal now says:
  MEASURED    axis MEASURED on the register AND a SEPARATED Elo leader (>=2 models ranked with
              n>=5 decided games each; leader's Wilson 95% win-rate CI lower bound above the
              runner-up's upper bound)
  TIE         ranked models exist but no separation
  UNMEASURED  not sufficient to rank (no model reaches n>=5 decided games on the axis), or the
              axis itself is not MEASURED on the register
elo_leader is named only when SEPARATED; elo_top is always the top ranked row (with n and CI)
so a reader sees who is ahead and how thin it is. Measurement, not certification.

Usage:
  python3 scripts/emit_signals.py --leaderboard public/arena/elo_reference.json \
      --out public/signals --pod-token-file /workspace/secrets/board-sign-pod-token
"""
import argparse, base64, hashlib, json, os, sys, time
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "arena"))
from board_sign import canonical, norm, sha256_hex, assert_ascii, BOARD_KID  # noqa: E402

REGISTER_URL = "https://councilof.ai/api/axis-register"
MIN_GAMES = 5
SCHEMA = "csoai.axis-signal/0.2"


def fetch_register(url=REGISTER_URL):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 CSOAI-signal-emitter/1.1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def _row(r):
    return {k: r[k] for k in ("model", "elo", "games", "winrate", "ci") if k in r}


def derive_signal(axis_entry, rows, lb, generated, supersedes=None):
    """axis_entry: one row of the register; rows: per_axis[axis] from elo_reference (ranked,
    sorted by elo desc, each with n>=MIN_GAMES). Pure function — tested with planted controls."""
    axis = axis_entry["axis"]
    axis_status = axis_entry.get("status", "UNMEASURED")
    ranked = [r for r in rows if r.get("games", 0) >= MIN_GAMES]
    meta = ((lb.get("axis_meta") or {}).get(axis)) or {}
    top = ranked[0] if ranked else None
    runner = ranked[1] if len(ranked) > 1 else None
    if not ranked:
        separation = "UNMEASURED"
    elif runner is None:
        separation = "TIE"          # one ranked model is not a ranking
    elif top["ci"][0] > runner["ci"][1]:
        separation = "SEPARATED"
    else:
        separation = "TIE"
    if axis_status != "MEASURED":
        register = "UNMEASURED"
    elif separation == "SEPARATED":
        register = "MEASURED"
    elif separation == "TIE":
        register = "TIE"
    else:
        register = "UNMEASURED"
    leader = top if register == "MEASURED" else None   # never a leader on a non-MEASURED axis
    body = {
        "schema": SCHEMA,
        "axis": axis,
        "status": register,
        "register": register,
        "axis_status": axis_status,
        "scored_items": axis_entry.get("scored_items"),
        "models": axis_entry.get("models"),
        "majority_baseline": axis_entry.get("majority_baseline"),
        "elo_source": {"path": "/arena/elo_reference.json", "content_id": lb.get("content_id"),
                       "generated": lb.get("generated"), "schema": lb.get("schema")},
        "elo_decided_games": meta.get("decided_games"),
        "elo_ties": meta.get("ties"),
        "elo_ranked_models": len(ranked),
        "elo_top": _row(top) if top else None,
        "elo_runner_up": _row(runner) if runner else None,
        "elo_separation": separation,
        "elo_leader": leader["model"] if leader else None,
        "elo_leader_score": leader["elo"] if leader else None,
        "games_leader": leader["games"] if leader else None,
        "rank_rule": f"leader named only when >=2 models each have >={MIN_GAMES} decided games on this axis "
                     "and the top model's Wilson 95% win-rate CI lower bound exceeds the runner-up's "
                     "upper bound; TIE = ranked, not separated; UNMEASURED = not sufficient to rank.",
        "not_a_certification": True,
        "note": "From the axis register + the per-axis Elo reference rebuilt from recorded rounds "
                "(deterministic grader on frozen banks). Honest signals only; thin-n axes say so. "
                "Measurement, not certification.",
        "generated": generated,
    }
    if supersedes:
        body["supersedes"] = supersedes
    return norm(body)


def sign_city(body, key_path):
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    sk = load_pem_private_key(open(key_path, "rb").read(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    cid = sha256_hex(canonical(body))
    sig = sk.sign(cid.encode())
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    body["signer"] = "city_ed25519 (estate key; pubkey inline)"
    return cid, {"alg": "Ed25519", "content_id": cid, "sig": base64.b64encode(sig).decode(),
                 "pubkey": base64.b64encode(pub).decode(),
                 "note": "Ed25519 over canonical content_id. Verify: recompute, sha256=content_id, ed25519==sig with PUBKEY."}


def sign_board(body, token_file, did_doc=None):
    from board_sign import sign_payload
    body["signer"] = BOARD_KID
    cid = sha256_hex(assert_ascii(body, f"signal {body.get('axis')}"))
    sig = sign_payload(body, token_file, did_doc)
    assert sig["payload_sha256"] == cid
    sig["content_id"] = cid
    sig["preimage"] = "canonical(body minus content_id, signature)"
    return cid, sig


def previous_signal(out_dir, axis):
    p = os.path.join(out_dir, f"{axis}.signed.json")
    if not os.path.exists(p):
        return None
    try:
        old = json.load(open(p))
    except Exception:
        return None
    osig = old.get("signature") or {}
    if osig.get("did"):
        signer = osig["did"]
    elif osig.get("pubkey"):
        signer = f"city_ed25519 (pubkey {osig['pubkey'][:12]}...; not bound in did.json)"
    else:
        signer = "unsigned"
    return {"content_id": old.get("content_id"), "generated": old.get("generated"), "signer": signer,
            "status_then": old.get("status"), "elo_leader_then": old.get("elo_leader"),
            "note": "superseded, never edited; new bytes, new signature"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/signals")
    ap.add_argument("--leaderboard", default="public/arena/elo_reference.json")
    ap.add_argument("--register-url", default=REGISTER_URL)
    ap.add_argument("--register-file", default=None)
    ap.add_argument("--key", default=None, help="city_ed25519 PEM (style B)")
    ap.add_argument("--pod-token-file", default=None, help="board-sign caller token file (style B-DID)")
    ap.add_argument("--did-doc", default=None)
    ap.add_argument("--only", default=None, help="comma list of axes (default: all register axes)")
    args = ap.parse_args()
    if bool(args.key) == bool(args.pod_token_file):
        sys.exit("choose exactly one of --key / --pod-token-file")
    reg = json.load(open(args.register_file)) if args.register_file else fetch_register(args.register_url)
    axes = reg.get("axes", [])
    if args.only:
        keep = set(args.only.split(","))
        axes = [a for a in axes if a["axis"] in keep]
    lb = json.load(open(args.leaderboard))
    if not lb.get("per_axis"):
        sys.exit(f"GATE: {args.leaderboard} has no per_axis — refusing to emit signals from nothing")
    did_doc = json.load(open(args.did_doc)) if args.did_doc else None
    os.makedirs(args.out, exist_ok=True)
    generated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    index = []
    for a in axes:
        axis = a["axis"]
        rows = (lb.get("per_axis") or {}).get(axis, [])
        body = derive_signal(a, rows, lb, generated, previous_signal(args.out, axis))
        if args.key:
            cid, sig = sign_city(body, args.key)
        else:
            cid, sig = sign_board(body, args.pod_token_file, did_doc)
        body["content_id"] = cid
        body["signature"] = sig
        fp = os.path.join(args.out, f"{axis}.signed.json")
        open(fp, "w").write(json.dumps(body, indent=1, sort_keys=True, ensure_ascii=False) + "\n")
        index.append({"axis": axis, "status": body["status"], "elo_leader": body["elo_leader"],
                      "elo_top": body["elo_top"]["model"] if body["elo_top"] else None,
                      "elo_separation": body["elo_separation"], "content_id": cid[:16]})
        print(f"  signed {axis}.signed.json  cid={cid[:16]}  {body['status']:<10} top={index[-1]['elo_top']} leader={body['elo_leader']}")
    idx = {"schema": "csoai.signals-index/0.2", "signals": index, "generated": generated,
           "signer": BOARD_KID if args.pod_token_file else "city_ed25519",
           "elo_source_content_id": lb.get("content_id"),
           "status_rule": "MEASURED = separated Elo leader on a MEASURED axis; TIE = ranked, not separated; "
                          "UNMEASURED = not sufficient to rank. A leader is named only when separated."}
    open(os.path.join(args.out, "_index.json"), "w").write(json.dumps(idx, indent=1, ensure_ascii=False) + "\n")
    print(f"SIGNED {len(axes)} per-axis signals -> {args.out}")


if __name__ == "__main__":
    main()
