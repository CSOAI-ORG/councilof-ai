#!/usr/bin/env python3
"""verify_anchor.py — INDEPENDENT skeptic verification of a CSOAI OTS anchor.

No trust in CSOAI required. Verifies, against public sources only:

  1. MANIFEST SELF-CONSISTENCY: recompute the Merkle root from the published
     leaf hashes in the manifest and confirm it equals the committed root.
  2. BITCOIN BLOCK REALITY: parse the .ots proof's Bitcoin attestations
     (block heights + claimed block merkle roots) and confirm each block's
     actual merkle root via a public Bitcoin explorer (blockstream.info).
  3. (optional, --ledger) LEDGER INTEGRITY: recompute leaves from the ledger's
     attestable rows and confirm they equal the manifest's leaves, and that the
     ledger file's sha256 equals the manifest's full_ledger_sha256.

What this does NOT replace: full op-chain verification (that the .ots binary ops
connect the root file's hash to the block's merkle root) is the standard `ots
verify` job and needs a Bitcoin node. Here we confirm the block reference is real
and the manifest is internally consistent — the two facts a skeptic most needs.
For full end-to-end: `ots verify root_NNNN.txt.ots -f root_NNNN.txt` with a
synced bitcoind, or a public OTS verifier.

Usage:
  python3.14 verify_anchor.py --anchor anchors/anchor_0002.json [--ledger FILE] [--upgrade]
"""
from __future__ import annotations
import argparse, base64, hashlib, json, os, re, ssl, subprocess, sys, urllib.request

OTS = os.path.expanduser("~/Library/Python/3.14/bin/ots")
CERTIFI = subprocess.run(["python3.14", "-m", "certifi"], capture_output=True, text=True).stdout.strip()
_SSL = ssl.create_default_context(cafile=CERTIFI) if CERTIFI else ssl.create_default_context()

def canon(o) -> bytes: return json.dumps(o, sort_keys=True, separators=(",", ":")).encode()
def leaf(b: bytes) -> bytes: return hashlib.sha256(b"\x00" + b).digest()
def node(l: bytes, r: bytes) -> bytes: return hashlib.sha256(b"\x01" + l + r).digest()
def merkle(leaves: list[bytes]) -> bytes:
    if not leaves: return b"\x00" * 32
    lv = list(leaves)
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])
        lv = [node(lv[i], lv[i + 1]) for i in range(0, len(lv), 2)]
    return lv[0]

def ots_info(proof_path: str) -> str:
    env = dict(os.environ, SSL_CERT_FILE=CERTIFI)
    r = subprocess.run([OTS, "info", proof_path], capture_output=True, text=True, env=env)
    return r.stdout + r.stderr

def block_merkle_root(height: int) -> str | None:
    """Fetch a Bitcoin block's merkle root from blockstream.info (public, independent)."""
    try:
        h = urllib.request.urlopen(
            f"https://blockstream.info/api/block-height/{height}", timeout=30, context=_SSL).read().decode().strip()
        d = json.loads(urllib.request.urlopen(
            f"https://blockstream.info/api/block/{h}", timeout=30, context=_SSL).read())
        return d.get("merkle_root")
    except Exception as e:
        print(f"  block {height}: fetch FAILED ({e})", file=sys.stderr)
        return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anchor", required=True)
    ap.add_argument("--ledger", default=None)
    ap.add_argument("--pubkey", default=os.path.expanduser("~/clawd/sovereign-town/p0_aqua/town_pub.key"),
                    help="Ed25519 public key for signed ledgers without an `attestable` flag")
    ap.add_argument("--upgrade", action="store_true", help="run `ots upgrade` before verifying")
    args = ap.parse_args()

    a = json.load(open(args.anchor))
    d = os.path.dirname(args.anchor)
    n = os.path.basename(args.anchor).replace("anchor_", "").replace(".json", "")
    root_txt = os.path.join(d, "public", f"root_{n}.txt")
    root_ots = root_txt + ".ots"
    manifest = json.load(open(os.path.join(d, "public", f"manifest_{n}.json")))

    print(f"=== CSOAI anchor {n} — independent verification ===")
    print(f"schema={a.get('schema')}  ledger={a.get('ledger')}  label={a.get('label','')!r}")
    print(f"rows={a.get('n_total')}  attestable={a.get('n_attestable')}\n")

    # 1. manifest self-consistency
    leaves = [bytes.fromhex(l) for l in a["leaves"]]
    computed = merkle(leaves).hex()
    rt = open(root_txt).read().strip()
    checks = []
    checks.append(("recomputed merkle == anchor root", computed == a["attestable_root"]))
    checks.append(("root txt == anchor root", rt == a["attestable_root"]))
    checks.append(("manifest leaves == anchor leaves", a["leaves"] == manifest["leaves"]))
    checks.append(("manifest root == anchor root", manifest["attestable_root"] == a["attestable_root"]))
    print(f"[1] manifest self-consistency")
    print(f"    recomputed root : {computed}")
    print(f"    anchor root     : {a['attestable_root']}")
    print(f"    root txt        : {rt}")
    for name, ok in checks:
        print(f"    {'PASS' if ok else 'FAIL'}  {name}")
    print()

    # optional ledger integrity
    if args.ledger:
        print(f"[2] ledger integrity  ({args.ledger})")
        full_sha = hashlib.sha256(open(args.ledger, "rb").read()).hexdigest()
        rows = [json.loads(l) for l in open(args.ledger) if l.strip()]
        ok_sha = full_sha == a["full_ledger_sha256"]
        print(f"    {'PASS' if ok_sha else 'FAIL'}  ledger sha256 == manifest full_ledger_sha256")
        print(f"         ledger    {full_sha}")
        print(f"         manifest  {a['full_ledger_sha256']}")
        # recompute leaves from attestable rows (mode-agnostic: use attestable flag or sig)
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        att = []
        for r in rows:
            if r.get("attestable") is True:
                att.append(leaf(canon(r)))
            elif "sig" in r and "prev" in r and r.get("schema", "").startswith("policy-lab") is False and "A_crimes" in r:
                pass  # flywheel handled below if pubkey given
        # Signed-ledger rows without an `attestable` flag (flywheel cycles, dose-response sweep):
        # the attestable subset = rows whose Ed25519 sig verifies vs the pub key.
        if any("sig" in r and "prev" in r and "attestable" not in r for r in rows):
            pubf = args.pubkey if os.path.isabs(args.pubkey) else os.path.join(os.path.dirname(args.ledger), args.pubkey)
            if not os.path.exists(pubf):
                pubf = os.path.join(os.path.dirname(args.ledger), "town_pub.key")
            if os.path.exists(pubf):
                pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(open(pubf).read().strip()))
                att = []
                for r in rows:
                    body = json.dumps({k: v for k, v in r.items() if k not in ("prev", "sig")}, sort_keys=True)
                    try:
                        pub.verify(base64.b64decode(r["sig"]), (r.get("prev", "") + body).encode())
                        att.append(leaf(canon(r)))
                    except Exception:
                        pass
        ok_leaves = [l.hex() for l in att] == a["leaves"]
        print(f"    {'PASS' if ok_leaves else 'FAIL'}  recomputed leaves from ledger == manifest leaves "
              f"({len(att)} attestable)")
        checks.append(("ledger sha256", ok_sha))
        checks.append(("ledger leaves", ok_leaves))
        print()

    # 3. Bitcoin block reality
    if args.upgrade and os.path.exists(root_ots):
        env = dict(os.environ, SSL_CERT_FILE=CERTIFI)
        print(f"[3] upgrading OTS proof (fetching Bitcoin confirmation)...")
        subprocess.run([OTS, "upgrade", root_ots], env=env, capture_output=True, text=True, timeout=120)
        print()
    print(f"[3] Bitcoin block reality  ({os.path.basename(root_ots)})")
    info = ots_info(root_ots)
    blocks = re.findall(r"BitcoinBlockHeaderAttestation\((\d+)\)", info)
    claimed = re.findall(r"# Bitcoin block merkle root ([0-9a-f]{64})", info)
    if not blocks:
        print(f"    FAIL  no Bitcoin block attestation found (proof may be pending — try --upgrade)")
        checks.append(("bitcoin attestation present", False))
    else:
        for h, claim in zip(blocks, claimed):
            real = block_merkle_root(int(h))
            ok = (real == claim)
            checks.append((f"block {h} merkle root", ok))
            print(f"    block {h}: {'PASS' if ok else 'FAIL'}  "
                  f"public={real}  proof_claims={claim}")
    print()

    # verdict
    passed = sum(1 for _, ok in checks if ok)
    total = len(checks)
    print(f"=== VERDICT: {passed}/{total} checks passed ===")
    print("FULLY VERIFIED (manifest consistent + Bitcoin-anchored at real blocks)"
          if passed == total else
          "INCOMPLETE — see FAIL lines above (pending confirmation needs --upgrade + ~1hr)")

if __name__ == "__main__":
    main()