"""FIN7 UNMEASURED coverage notices. Not a GSPC mill. No invented %."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

BOARD = "https://councilof.ai/api/gspc"
AXES = [
    ("reserve-attestation", "is a third-party reserve attestation publicly published and current?"),
    ("regulatory-framework", "is the governing regime declared and confirmable?"),
    ("distribution-integrity", "represented vs distributed never mixed"),
    ("custody-disclosure", "are a custodian and an auditor named and confirmable?"),
    ("ai-economy-index", "cited components only; no composite"),
    ("human-labour-index", "cited components only; no composite"),
    ("humanoid-labour-index", "NOT_BUILT; no input bank"),
]

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def collect() -> dict[str, Any]:
    as_of = now_iso()
    leaves = []
    for axis, task in AXES:
        leaves.append({
            "surface": "public.notice",
            "subject": f"GSPC {axis} UNMEASURED coverage",
            "as_of": as_of,
            "source_urls": [BOARD, f"https://huggingface.co/datasets/csoai/gspc-{axis}"],
            "payload": {
                "axis": axis,
                "cite": BOARD,
                "compute_composite": False,
                "do_not_invent_percentage": True,
                "kind": "gspc.coverage-card/0.1",
                "metamask_is_signer": False,
                "n": 0,
                "not_a_grade": True,
                "schema": "csoai.gspc-axes/0.5",
                "status": "UNMEASURED",
                "task": task,
            },
            "unmeasured": [axis, "n=0"],
            "tags": ["coverage:UNMEASURED", "not-a-grade", "no-composite"],
        })
    return {"leaves": leaves, "sidecar": {"writes_gspc": False, "note": "UNMEASURED coverage notices. Not a mill into /api/gspc."}}
