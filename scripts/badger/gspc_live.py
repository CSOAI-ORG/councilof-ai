"""Live GSPC board numbers for outreach copy.

Fetched at send time so a wave can never pitch a stale count. If the board
is unreachable the helpers raise — an unverifiable claim does not go out
(measurement, not certification; never send a number you cannot cite).
"""
import json
import urllib.request

BOARD_URL = "https://councilof.ai/api/gspc"


def totals() -> dict:
    with urllib.request.urlopen(BOARD_URL, timeout=15) as r:
        d = json.load(r)
    counts = {c["name"]: c["value"] for c in d.get("counts", [])}
    sep = d.get("separation", {})
    return {
        "slots": counts.get("axis_slots"),
        "measured": counts.get("measured"),
        "unmeasured": counts.get("unmeasured"),
        "comparisons": sep.get("comparison_axes"),
        "separated": sep.get("separated_leads"),
        "ties": sep.get("ties"),
        "untested": sep.get("untested"),
        "as_of": (d.get("as_of") or {}).get("fetched_at"),
    }


def live_line() -> str:
    t = totals()
    return (
        f"We're already live: {t['slots']} declared axis slots on the public board, "
        f"{t['measured']} measured · {t['unmeasured']} unmeasured (slots are not "
        f"measurements; never summed). Separation: {t['separated']} of {t['comparisons']} "
        f"model-comparison axes separated a leader — {t['ties']} TIE · {t['untested']} "
        f"UNTESTED (a TIE is not a win). Board: https://councilof.ai/api/gspc · "
        f"Measurement, not certification."
    )


def short_counts() -> str:
    t = totals()
    return f"{t['slots']} axis slots · {t['measured']} measured · {t['unmeasured']} unmeasured"
