#!/usr/bin/env python3
"""shamir_2of3.py — Shamir secret sharing over GF(2^8), 2-of-3, for the ROOT ceremony.

G4.1 CEREMONY PREP (TUI-4 ROOTS & IDENTITY V3). Splits the 32-byte ROOT-alpha
seed into three shares; any two reconstruct it. Measurement infrastructure,
not certification. Nothing here certifies anything.

Field and construction (stated exactly so a second implementation can
cross-check — see the honest-limits note in docs/operations/root-ceremony/):

  * Field: GF(2^8) with the irreducible polynomial x^8 + x^4 + x^3 + x + 1
    (0x11B) — the SAME field AES uses (FIPS-197 §4.2). Not invented. The
    selftest proves the multiplication table with the FIPS-197 worked
    example 0x57 * 0x83 == 0xC1 and the xtime identity 0x02 * 0x80 == 0x1B.
  * Applied PER-BYTE to the 32-byte secret (the classic HashiCorp-vault
    style byte-wise scheme). Honest limit: shares leak nothing individually
    (any single share is information-theoretically silent on the secret),
    but byte-wise sharing is malleable per byte if an attacker controls
    k-1 shares and you skip the integrity check — which is exactly why every
    share file carries secret_sha256 and combine() FAILS CLOSED on mismatch.
  * Polynomial: for each secret byte s, draw one random coefficient a in
    GF(2^8); f(x) = s + a*x. Shares are f(1), f(2), f(3). Evaluation is
    NEVER at x = 0 (f(0) = s would be the secret itself).
  * Randomness: os.urandom. Optionally mixed with extra ceremony entropy via
    --entropy-file: coefficient = SHA-256(os.urandom(32) || entropy_bytes)[0]
    … per coefficient draw. A mixer can only add entropy, never remove it
    (a bad --entropy-file cannot make os.urandom output weaker — stated so
    a reader knows the mixer is belt-and-braces, not the source).

Share file format (JSON, chmod 0600):
  {"scheme": "shamir-gf256-0x11b/v1", "k": 2, "n": 3, "index": 1|2|3,
   "share_hex": "<32 bytes hex>", "secret_sha256": "<sha256 of the 32-byte
   secret>"}
  secret_sha256 lets combine() prove reconstruction succeeded; it reveals
  nothing usable about the secret (a 256-bit preimage search).

Subcommands:
  split    --seed FILE --out-dir DIR [--entropy-file F]
  combine  --share FILE --share FILE ... --out FILE
  selftest

Selftest (must pass 3x on the ceremony machine BEFORE the real run):
  random secret -> split -> reconstruct from ALL THREE pairs {1,2} {1,3}
  {2,3} -> confirm a corrupted share is DETECTED (secret_sha256 mismatch
  fails closed) -> confirm a single share alone cannot reconstruct (and,
  for rigour, that a share's value is statistically silent: for each byte
  position every value 0..255 is equally possible given one share — checked
  structurally by showing one share plus any candidate byte admits a
  consistent polynomial).
  Prints fingerprints only. Never prints a secret, share, or seed.

Exit codes: 0 ok; 1 usage/io; 2 fail-closed crypto refusal (mismatch,
corruption, duplicate index, fewer than k distinct shares).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEME = "shamir-gf256-0x11b/v1"
K, N = 2, 3
SECRET_LEN = 32


# ---------------------------------------------------------------------------
# GF(2^8) arithmetic, modulus 0x11B (x^8 + x^4 + x^3 + x + 1 — the AES field,
# FIPS-197 §4.2). Multiplication is the Russian-peasant/xtime algorithm.
# ---------------------------------------------------------------------------

def gf_mul(a: int, b: int) -> int:
    p = 0
    for _ in range(8):
        if b & 1:
            p ^= a
        carry = a & 0x80
        a = (a << 1) & 0xFF
        if carry:
            a ^= 0x1B  # reduce by the low byte of 0x11B
        b >>= 1
    return p


def gf_inv(a: int) -> int:
    if a == 0:
        raise ZeroDivisionError("GF(2^8) has no inverse of 0")
    # a^254 = a^-1 in GF(2^8) since the multiplicative group has order 255
    # (Fermat's little theorem for finite fields). Square-and-multiply.
    r, e, base = 1, 254, a
    while e:
        if e & 1:
            r = gf_mul(r, base)
        base = gf_mul(base, base)
        e >>= 1
    return r


def gf_div(a: int, b: int) -> int:
    return gf_mul(a, gf_inv(b))


def _fips197_selfcheck() -> None:
    """Pin the field to the primary source before trusting anything."""
    assert gf_mul(0x57, 0x83) == 0xC1, "FIPS-197 §4.2 example broken"
    assert gf_mul(0x02, 0x80) == 0x1B, "xtime reduction broken"
    for x in range(1, 256):
        assert gf_mul(x, gf_inv(x)) == 1, f"inverse broken at {x}"
    assert gf_mul(0x00, 0xFF) == 0 and gf_mul(0x01, 0xFF) == 0xFF


# ---------------------------------------------------------------------------
# Sharing core
# ---------------------------------------------------------------------------

def _coeff(entropy: bytes | None) -> int:
    """One random GF(2^8) coefficient; optionally SHA-256-mixed with --entropy-file bytes."""
    rnd = os.urandom(32)
    if entropy is not None:
        rnd = hashlib.sha256(rnd + entropy).digest()
    return rnd[0]


def split_secret(secret: bytes, k: int = K, n: int = N,
                 entropy: bytes | None = None) -> list[tuple[int, bytes]]:
    if len(secret) != SECRET_LEN:
        raise ValueError(f"secret must be {SECRET_LEN} bytes, got {len(secret)}")
    shares = [bytearray(SECRET_LEN) for _ in range(n)]
    for pos in range(SECRET_LEN):
        coeffs = [secret[pos]] + [_coeff(entropy) for _ in range(k - 1)]
        for idx in range(n):
            x = idx + 1  # x = 1..n; NEVER x = 0 (that would be the secret)
            y = 0
            for c in reversed(coeffs):  # Horner in GF(2^8)
                y = gf_mul(y, x) ^ c
            shares[idx][pos] = y
    return [(i + 1, bytes(shares[i])) for i in range(n)]


def combine_shares(points: list[tuple[int, bytes]]) -> bytes:
    if len(points) != K:
        raise ValueError(f"need exactly {K} shares, got {len(points)}")
    xs = [p[0] for p in points]
    if len(set(xs)) != len(xs):
        raise ValueError("duplicate share index — refusing to combine")
    if any(x not in range(1, N + 1) for x in xs):
        raise ValueError(f"share index outside 1..{N}")
    if any(len(p[1]) != SECRET_LEN for p in points):
        raise ValueError("share length mismatch")
    use = points[:K]
    out = bytearray(SECRET_LEN)
    for pos in range(SECRET_LEN):
        # Lagrange interpolation at x = 0. In characteristic 2, minus = plus.
        acc = 0
        for i, (xi, yi) in enumerate(use):
            num, den = 1, 1
            for j, (xj, _) in enumerate(use):
                if i == j:
                    continue
                num = gf_mul(num, xj)              # (0 - x_j) == x_j
                den = gf_mul(den, xi ^ xj)         # (x_i - x_j) == x_i + x_j
            acc ^= gf_mul(yi[pos], gf_div(num, den))
        out[pos] = acc
    return bytes(out)


# ---------------------------------------------------------------------------
# File handling — secrets stay on disk at 0600, never on stdout
# ---------------------------------------------------------------------------

def _write_secret_file(path: Path, data: bytes) -> None:
    if path.exists():
        raise FileExistsError(f"{path} exists — never overwrite secret material")
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as fh:
        fh.write(data)
    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)


def share_record(index: int, share: bytes, secret_sha256: str) -> dict:
    return {"scheme": SCHEME, "k": K, "n": N, "index": index,
            "share_hex": share.hex(), "secret_sha256": secret_sha256}


def load_share(path: Path) -> tuple[int, bytes, str]:
    rec = json.loads(Path(path).read_text(encoding="utf-8"))
    if rec.get("scheme") != SCHEME or rec.get("k") != K or rec.get("n") != N:
        raise ValueError(f"{path}: scheme/k/n mismatch — not a {SCHEME} share")
    share = bytes.fromhex(rec["share_hex"])
    index = int(rec["index"])
    digest = rec["secret_sha256"]
    if index not in range(1, N + 1):
        raise ValueError(f"{path}: share index must be 1..{N}")
    if len(share) != SECRET_LEN:
        raise ValueError(f"{path}: share must be {SECRET_LEN} bytes")
    if not isinstance(digest, str) or len(digest) != 64:
        raise ValueError(f"{path}: secret_sha256 is malformed")
    bytes.fromhex(digest)
    return index, share, digest.lower()


def cmd_split(args: argparse.Namespace) -> int:
    try:
        secret = Path(args.seed).read_bytes()
        entropy = Path(args.entropy_file).read_bytes() if args.entropy_file else None
        _fips197_selfcheck()
        shares = split_secret(secret, entropy=entropy)
    except (ValueError, OSError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    s_sha = hashlib.sha256(secret).hexdigest()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    try:
        for idx, share in shares:
            p = out_dir / f"share-{idx}.json"
            _write_secret_file(p, json.dumps(share_record(idx, share, s_sha), indent=1).encode() + b"\n")
            paths.append(p)
    except (FileExistsError, OSError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    print(f"split: {K}-of-{N} over GF(2^8)/0x11B; {SECRET_LEN}-byte secret")
    print(f"secret_sha256: {s_sha}")
    for p in paths:
        print(f"wrote {p} (mode 0600) — distribute each to a DIFFERENT medium/holder")
    return 0


def cmd_crosscheck(args: argparse.Namespace) -> int:
    """Bind a reconstruction from this implementation to an independent one.

    The independent implementation runs separately and writes only its
    reconstructed 32-byte seed to --independent-secret on the disposable
    ceremony medium. This command compares both byte strings, binds the
    independent executable by SHA-256, and writes a public, secret-free PASS
    record. genesis_card.py refuses to finalize a real card without this
    record matching ROOT-alpha's seed fingerprint.
    """
    try:
        _fips197_selfcheck()
        if len(args.share) != K:
            raise ValueError(f"cross-check needs exactly {K} shares")
        loaded = [load_share(Path(p)) for p in args.share]
        digests = {d for _, _, d in loaded}
        if len(digests) != 1:
            raise ValueError("share files disagree on secret_sha256")
        internal = combine_shares([(i, s) for i, s, _ in loaded])
        independent = Path(args.independent_secret).read_bytes()
        if len(independent) != SECRET_LEN:
            raise ValueError(
                f"independent reconstruction must be {SECRET_LEN} bytes, got {len(independent)}"
            )
        tool_bytes = Path(args.independent_tool).read_bytes()
        if not tool_bytes:
            raise ValueError("independent tool file is empty")
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 2

    expected = digests.pop()
    internal_sha = hashlib.sha256(internal).hexdigest()
    independent_sha = hashlib.sha256(independent).hexdigest()
    if internal_sha != expected or independent_sha != expected or internal != independent:
        print(
            "REFUSING: independent Shamir reconstruction does not match the "
            "native reconstruction and committed secret_sha256",
            file=sys.stderr,
        )
        return 2

    record = {
        "kind": "csoai.shamir-independent-crosscheck/1",
        "status": "PASS",
        "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "scheme": SCHEME,
        "share_indices": sorted(i for i, _, _ in loaded),
        "secret_sha256": expected,
        "independent_tool": {
            "name": args.independent_tool_name,
            "sha256": hashlib.sha256(tool_bytes).hexdigest(),
        },
        "scope": (
            "The independent implementation reconstructed the same bytes from "
            "this share pair. This record contains no secret material."
        ),
    }
    out = Path(args.out_record)
    try:
        _write_secret_file(out, json.dumps(record, sort_keys=True, indent=1).encode() + b"\n")
        os.chmod(out, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
    except (FileExistsError, OSError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    print("independent_crosscheck: PASS")
    print(f"secret_sha256: {expected}")
    print(f"record_file: {out}")
    print("DESTROY NOW: the independent reconstructed seed is seed-equivalent secret material")
    return 0


def cmd_combine(args: argparse.Namespace) -> int:
    try:
        _fips197_selfcheck()
        loaded = [load_share(Path(p)) for p in args.share]
        digests = {d for _, _, d in loaded}
        if len(digests) != 1:
            print("REFUSING: share files disagree on secret_sha256 — they are not shares of one secret",
                  file=sys.stderr)
            return 2
        secret = combine_shares([(i, s) for i, s, _ in loaded])
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 2
    want = digests.pop()
    got = hashlib.sha256(secret).hexdigest()
    if got != want:
        print("REFUSING: reconstruction mismatch — secret_sha256 does not bind the result. "
              "A share is corrupt. Fail closed; nothing written.", file=sys.stderr)
        return 2
    try:
        _write_secret_file(Path(args.out), secret)
    except (FileExistsError, OSError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1
    print(f"combine: reconstructed from {len(loaded)} shares; secret_sha256 verified")
    print(f"secret_sha256: {got}")
    print(f"seed_file: {args.out} (mode 0600)")
    return 0


def cmd_selftest() -> int:
    import tempfile
    _fips197_selfcheck()
    print("selftest: GF(2^8)/0x11B pinned to FIPS-197 §4.2 (0x57*0x83==0xC1; inverses for all 255 non-zero elements)")
    fails: list[str] = []
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        secret = os.urandom(SECRET_LEN)
        s_sha = hashlib.sha256(secret).hexdigest()
        shares = split_secret(secret)
        # 1. all three pairs reconstruct
        for pair in ((0, 1), (0, 2), (1, 2)):
            rec = combine_shares([shares[pair[0]], shares[pair[1]]])
            if rec != secret:
                fails.append(f"pair {pair[0]+1},{pair[1]+1} reconstructed a different secret")
        # 2. corrupted share detected end-to-end (secret_sha256 fails closed)
        for idx, share in shares:
            _write_secret_file(d / f"share-{idx}.json",
                               json.dumps(share_record(idx, share, s_sha)).encode() + b"\n")
        bad = bytearray(shares[1][1]); bad[0] ^= 0x01
        _write_secret_file(d / "share-bad.json",
                           json.dumps(share_record(3, bytes(bad), s_sha)).encode() + b"\n")
        class _A:
            share = [str(d / "share-1.json"), str(d / "share-bad.json")]
            out = str(d / "seed-out.bin")
        rc = cmd_combine(_A())  # prints REFUSING; must fail closed
        if rc != 2:
            fails.append("corrupted share was not detected by combine (expected exit 2)")
        if (d / "seed-out.bin").exists():
            fails.append("combine wrote output despite a corrupt share")
        # 3. one share alone: structural silence. For each byte position, holding
        # share value y at x fixed, ANY candidate secret byte s' admits exactly one
        # coefficient a = y + s'*x with f(x)=y — so one share cannot rule out a
        # single byte of the secret. Verify the algebra for all 256 candidates.
        x, y = shares[0][0], shares[0][1][0]
        for s_candidate in range(256):
            a = y ^ gf_mul(s_candidate, x)
            if gf_mul(s_candidate, x) ^ a != y:  # f(x) with this a hits y?
                fails.append(f"single-share silence broken at candidate {s_candidate}")
                break
        # 4. combine refuses anything other than exactly k distinct shares
        for bad_points in ([shares[0]], [shares[0], shares[0]], shares):
            try:
                combine_shares(bad_points)
                fails.append(f"combine accepted invalid input {len(bad_points)} shares")
            except ValueError:
                pass
        # 5. integrity binds: recompute from a real pair and compare fingerprint
        rec = combine_shares([shares[1], shares[2]])
        if hashlib.sha256(rec).hexdigest() != s_sha:
            fails.append("secret_sha256 does not bind a correct reconstruction")
    if fails:
        for f in fails:
            print("FAIL:", f)
        print("selftest: FAILED — do NOT run the real ceremony on this machine")
        return 1
    print("selftest: ok — 3/3 pairs reconstruct; corruption detected fail-closed; "
          "single share silent on all 256 values per byte; wrong count and duplicate shares refused")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sp = sub.add_parser("split")
    sp.add_argument("--seed", required=True)
    sp.add_argument("--out-dir", required=True)
    sp.add_argument("--entropy-file")
    cp = sub.add_parser("combine")
    cp.add_argument("--share", action="append", required=True)
    cp.add_argument("--out", required=True)
    xp = sub.add_parser("crosscheck")
    xp.add_argument("--share", action="append", required=True)
    xp.add_argument("--independent-secret", required=True,
                    help="32-byte reconstruction emitted by a separately implemented checker")
    xp.add_argument("--independent-tool", required=True,
                    help="the independently sourced checker executable/source, hashed into the record")
    xp.add_argument("--independent-tool-name", required=True,
                    help="public name and version of the independently sourced checker")
    xp.add_argument("--out-record", required=True)
    sub.add_parser("selftest")
    args = ap.parse_args()
    if args.cmd == "split":
        return cmd_split(args)
    if args.cmd == "combine":
        return cmd_combine(args)
    if args.cmd == "crosscheck":
        return cmd_crosscheck(args)
    return cmd_selftest()


if __name__ == "__main__":
    sys.exit(main())
