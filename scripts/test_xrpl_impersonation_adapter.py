"""Offline tests for the XRPL impersonation-watch adapter (brief G3.2).

Run:  python3 scripts/test_xrpl_impersonation_adapter.py
No network. Replays fixture pages from scripts/adapters/fixtures/xrpl-impersonation/.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

from adapters import xrpl_impersonation as xi  # noqa: E402

FIXTURES = REPO / "scripts" / "adapters" / "fixtures" / "xrpl-impersonation"
NO_DEEP = FIXTURES / "deep-capture-does-not-exist.json"

FORBIDDEN = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.IGNORECASE,
)
VERDICT_WORDS = re.compile(r"\b(fake|scam|fraud|fraudulent)\b", re.IGNORECASE)


def fixture_fetch(url: str) -> bytes:
    offset = url.split("offset=")[1]
    path = FIXTURES / f"xrpscan-tokens-{offset}.json"
    if not path.is_file():
        raise RuntimeError(f"no fixture for {url}")
    return path.read_bytes()


def canon(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def check(cond: bool, label: str) -> None:
    if not cond:
        raise AssertionError(label)
    print(f"  ok - {label}")


def main() -> None:
    result = xi.collect(root=REPO, fetch=fixture_fetch, scan_limit=300, deep_capture=NO_DEEP)
    sidecar = result["sidecar"]
    leaves = result["leaves"]

    print("sidecar:")
    check(sidecar["status"] == "PROBED", "status PROBED")
    check(sidecar["pages_ok"] == 3 and sidecar["pages_failed"] == 0, "3 pages ok, 0 failed")
    check(sidecar["n_scanned"] == 300, "n_scanned 300")
    check(sidecar["hits"] == 3, "3 watched-code hits (RLUSD x2, AUDD x1)")
    check(sidecar["mismatches"] == 1, "exactly 1 MISMATCH")
    check(sidecar["verified_set_unmeasured"] == 1, "exactly 1 VERIFIED_SET_UNMEASURED (AUDD)")
    check(sidecar["mirrors_written"] == 0, "replay writes no mirrors")

    print("leaf shapes:")
    # 1 summary + 1 mismatch + 1 unmeasured
    check(len(leaves) == 3, "3 leaves total")
    for leaf in leaves:
        check(set(leaf) == {"surface", "subject", "as_of", "source_urls", "payload", "unmeasured", "tags"},
              f"leaf envelope keys ({leaf['payload']['kind']})")
        check(leaf["surface"] == "public.notice", "surface public.notice")
        check(isinstance(leaf["source_urls"], list) and leaf["source_urls"], "source_urls non-empty")
        check(isinstance(leaf["unmeasured"], list), "unmeasured list present")
        check(len(canon(leaf["payload"])) <= 3072, f"payload <=3072 bytes ({leaf['payload']['kind']})")

    kinds = [leaf["payload"]["kind"] for leaf in leaves]
    check(kinds[0] == "csoai.xrpl-impersonation-scan/0.1", "first leaf is the summary")
    summary = leaves[0]["payload"]
    check(summary["status"] == "PROBED", "summary status PROBED")
    check(summary["counts"]["RLUSD"] == {"matches": 1, "mismatches": 1, "verified_set_unmeasured": 0},
          "RLUSD counts 1 match / 1 mismatch")
    check(summary["counts"]["AUDD"]["verified_set_unmeasured"] == 1, "AUDD counted as verified-set unmeasured")
    check("XSGD issuance inside scan window" in summary["unmeasured"], "no XSGD observed -> named unmeasured")
    check("long_tail" in summary["scan_coverage"], "long-tail caveat recorded")

    print("classification:")
    mismatch = next(leaf for leaf in leaves if leaf["payload"]["kind"] == "csoai.xrpl-impersonation-mismatch/0.1")
    mp = mismatch["payload"]
    check(mp["status"] == "DISCOVERED", "mismatch status DISCOVERED")
    check(mp["code"] == "RLUSD" and mp["issuer"] == "rGovFdpM9LHE5U6DJVR3mLcpAMAxTJffWH", "mismatch identity")
    check(mp["verified_issuer"] == "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", "verified issuer carried")
    check("UNMEASURED" in mp["wording"], "mismatch wording keeps legitimacy UNMEASURED")
    check(mp["first_seen_in_window"] == "2025-01-09T10:29:28.090Z", "first_seen_in_window from createdAt")
    check(f"https://xrpscan.com/token/{mp['code']}.{mp['issuer']}" in mismatch["source_urls"],
          "xrpscan token URL in source_urls")

    unmeasured_leaf = next(leaf for leaf in leaves if leaf["payload"]["kind"] == "csoai.xrpl-impersonation-unmeasured/0.1")
    up = unmeasured_leaf["payload"]
    check(up["code"] == "AUDD" and up["verified_set_state"] == "UNMEASURED", "AUDD reported UNMEASURED, not mismatch")

    print("never-raises:")
    def dark_fetch(url: str) -> bytes:
        raise OSError("network dark")

    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        dark = xi.collect(root=tmp, fetch=dark_fetch, scan_limit=200, deep_capture=NO_DEEP)
        check(dark["leaves"] == [] and dark["sidecar"]["status"] == "ABSENT", "dark + no snapshot -> ABSENT")
        # committed snapshot present -> SNAPSHOT_REPLAY with leaves
        snap_dir = Path(tmp) / xi.SNAPSHOT_REL.parent
        snap_dir.mkdir(parents=True, exist_ok=True)
        replay_src = xi.collect(root=REPO, fetch=fixture_fetch, scan_limit=300, deep_capture=NO_DEEP)
        # rebuild a snapshot dict the way collect() persists it: rerun live-ish by hand
        snapshot = {
            "schema": "csoai.xrpl-impersonation-scan/0.1",
            "generated_at": "2026-09-12T00:00:00Z",
            "scan_coverage": {"source": "api.xrpscan.com/api/v1/tokens", "window": "top-300 by holders ranking",
                              "n_scanned": 300, "pages_ok": 3, "pages_failed": 0, "long_tail": xi.LONG_TAIL_NOTE},
            "verified_issuers": xi.VERIFIED,
            "hits": [], "mismatches": [], "unmeasured": [],
        }
        (snap_dir / "latest.json").write_text(json.dumps(snapshot))
        dark2 = xi.collect(root=tmp, fetch=dark_fetch, scan_limit=200, deep_capture=NO_DEEP)
        check(dark2["sidecar"]["status"] == "SNAPSHOT_REPLAY", "dark + snapshot -> SNAPSHOT_REPLAY")
        check(len(dark2["leaves"]) == 1 and dark2["leaves"][0]["payload"]["replay_from_snapshot"] is True,
              "replay summary leaf flagged")
    check(replay_src["sidecar"]["status"] == "PROBED", "replay source run unaffected")

    print("doctrine:")
    for leaf in leaves + dark2["leaves"]:
        blob = json.dumps(leaf, ensure_ascii=False)
        hits = FORBIDDEN.findall(blob)
        check(not hits, f"no forbidden words in leaf {leaf['payload']['kind']}: {hits}")
        check(not VERDICT_WORDS.search(blob), f"no fake/scam/fraud in leaf {leaf['payload']['kind']}")

    print("\nALL CHECKS PASSED")


if __name__ == "__main__":
    main()
