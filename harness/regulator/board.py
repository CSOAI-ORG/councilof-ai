"""board.py — one place that knows what axes the GSPC board actually carries.

Why this exists: the findings tools each kept their own axis-name list. Five of the
names in `eu_ai_act_findings.AXIS_TO_OBLIGATION` did not exist on the board
(`jailbreak-resistance`, `det`, `mcp`, `xsr`, `agi`), so the tools printed
`UNMEASURED` for axes that ARE measured — e.g. `jailbreak-resistance measured=None`
while the board carries `jail` at 0.5915 over n=71.

In a compliance findings tool a FALSE UNMEASURED is the dangerous direction: it tells
a regulator we did not check something we did. So:

  * an axis key that does not resolve against /api/gspc is a MAPPING BUG, never an
    unmeasured axis. `check_axis_keys()` raises, the tools abort, and CI fails.
  * if the board itself cannot be fetched, the tools abort rather than print a
    report in which every axis reads UNMEASURED.
"""
from __future__ import annotations

import json
import os
import urllib.request

API = os.environ.get("API_HOST", "https://councilof.ai")


class BoardUnavailable(RuntimeError):
    """The board could not be fetched. Refuse to report rather than report UNMEASURED."""


class AxisMappingError(RuntimeError):
    """A tool's axis map names an axis the board does not carry."""


def get(path: str, timeout: int = 20):
    req = urllib.request.Request(API + path, headers={"User-Agent": "csoai-wl-findings/0.2"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:                       # noqa: BLE001 - surfaced to the caller
        return {"error": f"{type(e).__name__}: {e}"}


def axis_index(board: dict) -> dict:
    """{axis_key: {accuracy, fleet_mean, n, interval, leader, status, family}} from /api/gspc."""
    if not isinstance(board, dict) or board.get("error"):
        raise BoardUnavailable(str((board or {}).get("error", "no board payload")))
    axes = board.get("axes")
    idx: dict = {}
    if isinstance(axes, list):
        for a in axes:
            if isinstance(a, dict) and a.get("axis"):
                idx[a["axis"]] = {
                    "accuracy": a.get("accuracy"), "fleet_mean": a.get("fleet_mean"),
                    "n": a.get("n"), "interval": a.get("interval"), "leader": a.get("leader"),
                    "status": a.get("status"), "family": a.get("family"),
                }
    elif isinstance(axes, dict):
        for k, v in axes.items():
            if isinstance(v, dict):
                idx[k] = {"accuracy": v.get("accuracy"), "fleet_mean": v.get("fleet_mean"),
                          "n": v.get("n"), "interval": v.get("interval"),
                          "leader": v.get("leader"), "status": v.get("status"),
                          "family": v.get("family")}
    if not idx:
        raise BoardUnavailable("board payload carried no axes")
    return idx


def check_axis_keys(keys, axis_idx: dict, source: str) -> None:
    """Raise AxisMappingError if any key does not resolve against the live board.

    This is the check that stops a false UNMEASURED recurring silently: a name the
    board does not carry can never be graded, so it must stop the run, loudly.
    """
    missing = sorted({k for k in keys if k not in axis_idx})
    if missing:
        raise AxisMappingError(
            f"{source}: {len(missing)} axis key(s) do not exist on the board: "
            f"{', '.join(missing)}. The board carries: {', '.join(sorted(axis_idx))}. "
            "An unresolvable key would be reported as UNMEASURED, which would tell a "
            "regulator we did not check something we may have checked. Fix the map."
        )


def load_board_or_die(prog: str) -> dict:
    """Fetch /api/gspc and index it, or exit(3) with an honest reason."""
    import sys
    board = get("/api/gspc")
    try:
        return axis_index(board)
    except BoardUnavailable as e:
        print(f"{prog}: BOARD UNAVAILABLE — {e}", file=sys.stderr)
        print(f"{prog}: refusing to emit findings. Every axis would read UNMEASURED, "
              "which is a false negative, not a missing measurement.", file=sys.stderr)
        sys.exit(3)


def guard_axis_keys(keys, axis_idx: dict, source: str, prog: str) -> None:
    """check_axis_keys, but exit(4) with the message instead of raising."""
    import sys
    try:
        check_axis_keys(keys, axis_idx, source)
    except AxisMappingError as e:
        print(f"{prog}: AXIS MAPPING ERROR — {e}", file=sys.stderr)
        sys.exit(4)
