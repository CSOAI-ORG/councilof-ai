#!/usr/bin/env python3
"""anchor_ledger.py — Merkle-root the attestable rows of a signed ledger and
Bitcoin-anchor the root via OpenTimestamps. Sovereign, offline-verifiable,
third-party-verifiable external anchoring (the CSOAI wedge).

This is the LOCAL twin of the VM's sigil_anchor.py. It reproduces the EXACT
artifact format of anchors/anchor_0000.json (verified: same Merkle scheme,
same leaf/domain-separation, same manifest redaction) so anchors made here
are interchangeable with the VM's.

Trust model (honest):
  - The ledger's own Ed25519 signatures prove tamper-evidence of recorded rows.
  - This anchor proves a SET of attestable rows existed at a provable time
    (Bitcoin block) WITHOUT trusting CSOAI: a skeptic (a) recomputes the Merkle
    root from the published leaf hashes, (b) checks the root's OTS proof against
    a real Bitcoin block, (c) reveals any one row to check sha256(0x00||canon)
    equals a published leaf. The signer is NOT trusted for time-of-existence.

Modes:
  dora     : attestable = row.get("attestable") is True            (Policy Lab)
  kinghive : attestable = row.get("attestable") is True            (verdict chain)
  flywheel : attestable = Ed25519 sig verifies vs --pubkey         (cycle ledger)

Usage:
  python3.14 anchor_ledger.py --ledger FILE --mode {dora,kinghive,flywheel} \
      --index N --out anchors/ [--pubkey town_pub.key] [--label "..."]

Outputs (under --out):
  anchor_NNNN.json          full anchor (leaves, root, summary_index, full_ledger sha256)
  anchor_NNNN.json.ots      OTS stamp of the anchor json
  public/manifest_NNNN.json redacted manifest (no prompts; outcomes + leaves only)
  public/root_NNNN.txt      the 32-byte Merkle root in hex (the public commitment)
  public/root_NNNN.txt.ots  OTS stamp of the root txt  <-- the load-bearing proof
"""
from __future__ import annotations
import argparse, base64, hashlib, json, os, subprocess, sys, urllib.request
from datetime import datetime, timezone

MERKLE = "sha256 domain-separated (0x00 leaf / 0x01 node), duplicate-last"

def canon(o) -> bytes:
    return json.dumps(o, sort_keys=True, separators=(",", ":")).encode()

def leaf(b: bytes) -> bytes:        return hashlib.sha256(b"\x00" + b).digest()
def node(l: bytes, r: bytes) -> bytes: return hashlib.sha256(b"\x01" + l + r).digest()

def merkle(leaves: list[bytes]) -> bytes:
    if not leaves: return b"\x00" * 32
    lv = list(leaves)
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])            # duplicate-last (matches existing anchors)
        lv = [node(lv[i], lv[i + 1]) for i in range(0, len(lv), 2)]
    return lv[0]

# ---- attestability predicates ----------------------------------------------

def att_dora(row):
    return bool(row.get("attestable"))

def att_kinghive(row):
    return bool(row.get("attestable"))

def _flywheel_verify(row, pub):
    # Signed message = prev + json.dumps(row without prev+sig, sort_keys=True)
    # (matches sign_lib.sign + verify_flywheel.py exactly: str + str, then .encode())
    body = json.dumps({k: v for k, v in row.items() if k not in ("prev", "sig")},
                      sort_keys=True)
    msg = (row.get("prev", "") + body).encode()
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        pub.verify(base64.b64decode(row["sig"]), msg)
        return True
    except Exception:
        return False

# ---- per-schema public summary (what the manifest reveals) -----------------

def summary_dora(row):
    m = row.get("metrics", {})
    return {"town": row.get("town"), "incident_id": row.get("incident_id"),
            "latency_initial": m.get("latency_initial"),
            "completeness_initial": m.get("completeness_initial"),
            "false_negative": m.get("false_negative"), "false_positive": m.get("false_positive"),
            "ts": row.get("ts") or row.get("sim_timestamps", {}).get("t_inject")}

def summary_kinghive(row):
    return {"winner": row.get("winner"), "margin": row.get("margin"),
            "ts": row.get("ts")}

def summary_flywheel(row):
    return {"cycle": row.get("cycle"), "ts": row.get("ts"),
            "A_crimes": row.get("A_crimes"), "B_crimes": row.get("B_crimes"),
            "cum_episodes": row.get("cum_episodes")}

SUMMARY = {"dora": summary_dora, "kinghive": summary_kinghive, "flywheel": summary_flywheel}
ATT = {"dora": att_dora, "kinghive": att_kinghive}

# ---- OTS stamping ----------------------------------------------------------

OTS = os.path.expanduser("~/Library/Python/3.14/bin/ots")

def ots_stamp(path: str) -> bool:
    """Stamp a file -> path + '.ots'. Returns True on success."""
    env = dict(os.environ, SSL_CERT_FILE=subprocess.run(
        ["python3.14", "-m", "certifi"], capture_output=True, text=True).stdout.strip())
    r = subprocess.run([OTS, "stamp", path], capture_output=True, text=True, env=env, timeout=120)
    if r.returncode != 0:
        print(f"  ots stamp FAIL: {r.stderr.strip() or r.stdout.strip()}", file=sys.stderr)
        return False
    print(f"  ots stamp OK -> {path}.ots")
    return True

# ---- main ------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ledger", required=True)
    ap.add_argument("--mode", required=True, choices=["dora", "kinghive", "flywheel"])
    ap.add_argument("--index", required=True, type=int)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pubkey", default=None, help="town_pub.key (flywheel mode)")
    ap.add_argument("--label", default="", help="human label for this anchor")
    args = ap.parse_args()

    rows = [json.loads(l) for l in open(args.ledger) if l.strip()]
    if args.mode == "flywheel":
        if not args.pubkey:
            sys.exit("flywheel mode needs --pubkey")
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(open(args.pubkey).read().strip()))
        attestable = [r for r in rows if _flywheel_verify(r, pub)]
    else:
        attestable = [r for r in rows if ATT[args.mode](r)]

    if not attestable:
        sys.exit(f"no attestable rows in {args.ledger} (mode={args.mode})")

    leaves = [leaf(canon(r)) for r in attestable]
    root = merkle(leaves).hex()
    full_sha = hashlib.sha256(open(args.ledger, "rb").read()).hexdigest()
    sfn = SUMMARY[args.mode]
    idx = [{"i": i, **sfn(r)} for i, r in enumerate(attestable)]
    ts_first = min((r.get("ts") for r in attestable if r.get("ts")), default="")
    ts_last = max((r.get("ts") for r in attestable if r.get("ts")), default="")

    anchor = {
        "version": 1,
        "schema": f"anchor/{args.mode}/v1",
        "label": args.label,
        "ledger": os.path.basename(args.ledger),
        "full_ledger_sha256": full_sha,
        "merkle": MERKLE,
        "attestable_root": root,
        "n_attestable": len(attestable),
        "n_total": len(rows),
        "ts_first": ts_first, "ts_last": ts_last,
        "leaves": [l.hex() for l in leaves],
        "verdict_index": idx,           # name kept for parity with anchor_0000; = summary_index
    }
    # redacted public manifest: drop any prompt-bearing fields (summary fns already do)
    manifest = {k: v for k, v in anchor.items() if k not in ("label",)}
    manifest["disclosure"] = ("Public commitment: Merkle root + leaf hashes + outcomes only. "
        "Reveal a row by publishing its canonical JSON; its leaf hash sha256(0x00||canonical) "
        "must equal a published leaf. Verify the root's existence-time via the .ots proof "
        "against a real Bitcoin block (see verify_anchor.py).")

    os.makedirs(args.out, exist_ok=True)
    pub = os.path.join(args.out, "public")
    os.makedirs(pub, exist_ok=True)
    n = f"{args.index:04d}"
    apath = os.path.join(args.out, f"anchor_{n}.json")
    mpath = os.path.join(pub, f"manifest_{n}.json")
    rpath = os.path.join(pub, f"root_{n}.txt")
    json.dump(anchor, open(apath, "w"), indent=2)
    json.dump(manifest, open(mpath, "w"), indent=2)
    open(rpath, "w").write(root + "\n")

    print(f"anchor {n}  mode={args.mode}  label='{args.label}'")
    print(f"  ledger={os.path.basename(args.ledger)}  rows={len(rows)}  attestable={len(attestable)}")
    print(f"  merkle_root = {root}")
    print(f"  full_ledger_sha256 = {full_sha}")
    print(f"  wrote {apath}, {mpath}, {rpath}")
    ok = ots_stamp(rpath)
    if ok:
        ots_stamp(apath)           # also stamp the anchor json (matches existing layout)
    print("DONE" if ok else "STAMP INCOMPLETE (proofs pending — run verify_anchor.py --upgrade later)")

if __name__ == "__main__":
    main()