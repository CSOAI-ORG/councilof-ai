#!/usr/bin/env python3
"""Verify a CSOAI Inspect evidence bundle from the bundle ALONE. No network. No key.

Exit 0 = every check passed. Exit 1 = REJECTED, with the failing check named.

This verifier is designed to be able to say NO. scripts/inspect_adapter/run_controls.sh runs
three tampered bundles through it and requires each to be rejected for the stated reason; a
verifier that only ever says VALID is worthless, so the controls are part of the artifact.

It opens no socket, reads no key, and needs nothing but the bundle file. The `.eval` it came
from is NOT required — that is the point of selective disclosure. If you pass --eval anyway it
performs one extra, optional cross-check.

WHAT A PASS MEANS. That these exact bytes were in this set when this root was computed. It does
NOT mean the eval was honest, uncontaminated or correctly scored, it does NOT mean every action
was captured, and — because the bundle is unsigned — it does NOT say who produced any of it.
"""
import argparse, base64, hashlib, json, pathlib, sys, zipfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from csoai_merkle import build_levels, merkle_root, verify_proof  # noqa: E402

SCHEMA = "csoai.inspect-evidence-bundle/0.1"


def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


class Report:
    def __init__(self) -> None:
        self.rows: list[tuple[bool, str, str]] = []

    def check(self, ok: bool, name: str, detail: str = "") -> bool:
        self.rows.append((bool(ok), name, detail))
        return bool(ok)

    @property
    def failed(self) -> list[tuple[bool, str, str]]:
        return [r for r in self.rows if not r[0]]

    def render(self) -> str:
        out = []
        for ok, name, detail in self.rows:
            out.append(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))
        return "\n".join(out)


def verify(bundle: dict, eval_path: pathlib.Path | None = None) -> Report:
    r = Report()

    r.check(bundle.get("schema") == SCHEMA, "schema is recognised", str(bundle.get("schema")))
    samples = bundle.get("samples")
    if not r.check(isinstance(samples, list) and len(samples) > 0,
                   "bundle carries a non-empty sample list"):
        return r

    declared_n = bundle.get("n_samples")
    root = bundle.get("merkle_root")

    # --- CVE-2012-2459 mitigation, mandatory per public/root.json's own tree_caveat. --------
    # Odd-node duplication means a DIFFERENT leaf set can share an IDENTICAL root. The declared
    # count is the only thing that closes it, so these two checks are not bureaucracy: without
    # them a duplication-padded bundle verifies against the honest root. Control C3 proves it.
    r.check(isinstance(declared_n, int) and declared_n == len(samples),
            "declared n_samples equals the number of leaves presented (CVE-2012-2459 guard)",
            f"n_samples={declared_n} presented={len(samples)}")
    r.check(all(isinstance(s.get("index"), int) and 0 <= s["index"] < len(samples) for s in samples),
            "every leaf index is within [0, n_samples) (CVE-2012-2459 guard)")
    idxs = sorted(s.get("index") for s in samples if isinstance(s.get("index"), int))
    r.check(idxs == list(range(len(samples))),
            "leaf indices are exactly 0..n-1 with no gaps or repeats")
    cp = bundle.get("checkpoint") or {}
    r.check(cp.get("merkle_root") == root and cp.get("n_samples") == declared_n,
            "checkpoint agrees with the bundle body")

    # --- Digests: recompute every disclosed preimage. ---------------------------------------
    # This is the check that catches an altered preimage. It must be a real recomputation, not a
    # field comparison: a bundle that merely restates its own digest proves nothing.
    ordered = sorted(samples, key=lambda s: s.get("index", 0))
    n_recomputed = 0
    for s in ordered:
        d = s.get("digest")
        if not (isinstance(d, str) and len(d) == 64):
            r.check(False, f"sample index {s.get('index')} has a well-formed digest", str(d))
            continue
        if s.get("disclosure") == "disclosed":
            b64 = s.get("preimage_b64")
            if not r.check(isinstance(b64, str) and b64,
                           f"disclosed sample index {s['index']} carries its preimage"):
                continue
            pre = base64.b64decode(b64)
            got = sha256_hex(pre)
            r.check(got == d,
                    f"disclosed sample index {s['index']} digest matches sha256(preimage)",
                    f"recomputed {got[:16]}… vs recorded {d[:16]}…")
            try:
                r.check(canonical(json.loads(pre)) == pre,
                        f"disclosed sample index {s['index']} preimage is in canonical form")
            except Exception as e:
                r.check(False, f"disclosed sample index {s['index']} preimage parses as JSON", str(e))
            n_recomputed += 1
        elif s.get("disclosure") == "withheld":
            r.check("preimage_b64" not in s,
                    f"withheld sample index {s['index']} really omits its preimage")
            r.check(bool(s.get("inclusion_proof")),
                    f"withheld sample index {s['index']} still carries an inclusion proof")
        else:
            r.check(False, f"sample index {s.get('index')} declares a known disclosure state",
                    str(s.get("disclosure")))
    r.check(n_recomputed > 0,
            "at least one preimage was actually recomputed (guards against a vacuous pass)",
            f"{n_recomputed} recomputed")

    # --- The root, rebuilt from the leaves in the declared order. ---------------------------
    leaves = [s["digest"] for s in ordered]
    recomputed_root = merkle_root(leaves)
    r.check(recomputed_root == root, "merkle root recomputes from the presented leaves",
            f"recomputed {recomputed_root[:16]}… vs recorded {str(root)[:16]}…")

    # --- Every inclusion proof, including the withheld ones. --------------------------------
    levels = build_levels(leaves)
    n_ok = sum(1 for i, s in enumerate(ordered)
               if verify_proof(s["digest"], s.get("inclusion_proof") or [], recomputed_root))
    r.check(n_ok == len(ordered), "every inclusion proof verifies against the recomputed root",
            f"{n_ok}/{len(ordered)}")
    withheld = [s for s in ordered if s.get("disclosure") == "withheld"]
    if withheld:
        w_ok = sum(1 for s in withheld
                   if verify_proof(s["digest"], s.get("inclusion_proof") or [], recomputed_root))
        r.check(w_ok == len(withheld),
                "withheld samples still prove inclusion with no preimage present",
                f"{w_ok}/{len(withheld)} withheld")
    _ = levels

    # --- Honesty fields must be present in the bytes, not just in a README. -----------------
    r.check(bundle.get("signed") is False and "UNSIGNED" in str(bundle.get("signature_state", "")),
            "bundle states in its own bytes that it is unsigned")
    r.check(len(bundle.get("what_this_does_not_establish") or []) >= 5,
            "bundle carries its own limits (what_this_does_not_establish)")
    r.check("NOT an AISI-adopted design" in str((bundle.get("interop_target") or {}).get("status_warning", "")),
            "bundle records the true status of inspect_ai issue #5444")

    # --- Optional cross-check against the source .eval, if the caller supplies it. -----------
    if eval_path is not None:
        with zipfile.ZipFile(eval_path) as z:
            members = {n for n in z.namelist() if n.startswith("samples/")}
            r.check(sha256_hex(eval_path.read_bytes()) == (bundle.get("source") or {}).get("eval_file_sha256"),
                    "source .eval file hash matches the bundle's record")
            r.check(len(members) == declared_n,
                    "source .eval holds exactly n_samples sample members",
                    f"{len(members)} members vs n_samples={declared_n}")
            n_rd = 0
            for s in ordered:
                m = s.get("member")
                if m in members and canonical(json.loads(z.read(m))) is not None:
                    if sha256_hex(canonical(json.loads(z.read(m)))) != s["digest"]:
                        r.check(False, f"member {m} re-derives to the recorded digest")
                    else:
                        n_rd += 1
            r.check(n_rd == len(ordered), "every digest re-derives from the source .eval",
                    f"{n_rd}/{len(ordered)}")
    return r


def main() -> int:
    ap = argparse.ArgumentParser(description="Offline verifier for a CSOAI Inspect evidence bundle")
    ap.add_argument("bundle")
    ap.add_argument("--eval", default=None, help="optional: cross-check against the source .eval")
    ap.add_argument("--expect", choices=["valid", "reject"], default=None,
                    help="assert the outcome; used by the tamper controls")
    a = ap.parse_args()

    bundle = json.loads(pathlib.Path(a.bundle).read_text())
    rep = verify(bundle, pathlib.Path(a.eval) if a.eval else None)

    print(f"bundle: {a.bundle}")
    print(rep.render())
    ok = not rep.failed
    if ok:
        print(f"\nVERDICT: VALID — {len(rep.rows)} checks passed, 0 failed.")
        print("  Proves: these exact bytes were in this set when this root was computed.")
        print("  Does NOT prove: that the eval was honest, uncontaminated, correctly scored,")
        print("                  or complete; nor WHO produced it — the bundle is unsigned.")
    else:
        print(f"\nVERDICT: REJECTED — {len(rep.failed)} of {len(rep.rows)} checks failed:")
        for _, name, detail in rep.failed:
            print(f"    - {name}" + (f" ({detail})" if detail else ""))

    if a.expect:
        want_ok = a.expect == "valid"
        if want_ok != ok:
            print(f"\nCONTROL FAILED: expected {a.expect}, got {'valid' if ok else 'reject'}")
            return 2
        print(f"CONTROL OK: expected {a.expect}, got {a.expect}")
        return 0
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
