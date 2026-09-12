#!/usr/bin/env python3
"""Attack family: pyrit-attach — Microsoft PyRIT output as jail-axis EVIDENCE (J10).

PyRIT is an orchestrator, not an oracle. This family takes a PyRIT run export
(JSON list of conversations, or {"conversations": [...]}) and attaches it to the
jail instrument's evidence trail: each conversation is content-hashed
(sha256[:16]) so the pack is tamper-evident and replayable, and the attach is
emitted as a QUEUED redteam.evidence card.

Doctrine (binding — twoSpeed `pyrit` pin + playbookAudit `harness-bind`):
  does:  "Adversarial conversations can feed the jail instrument's evidence pack."
  never: "Keyword-refusal scoring as a signed card. A Microsoft-approved GSPC grade."

So this family DELIBERATELY does not implement the playbook's keyword-refusal
scorer. A substring match on "sorry"/"cannot" is not a GSPC verdict; the jail
axis verdict stays with the frozen GoldBank and its signed measurement. PyRIT
conversations arrive as ATTACHED evidence — never MEASURED, never scored here.

Input: env GSPC_PYRIT_RESULTS or harness/redteam/evidence/pyrit-results.json.
Absent input -> UNCHECKABLE (cannot check is never a pass, never a zero).
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_RESULTS = ROOT / "harness" / "redteam" / "evidence" / "pyrit-results.json"
NAME = "pyrit-attach"
MAX_HASHES_KEPT = 12  # the <=3KB card cap binds; totals carry the full count


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _conversations(doc) -> list:
    if isinstance(doc, list):
        return [c for c in doc if isinstance(c, dict)]
    if isinstance(doc, dict):
        for key in ("conversations", "results", "entries"):
            v = doc.get(key)
            if isinstance(v, list):
                return [c for c in v if isinstance(c, dict)]
    return []


def run(results_path: str | None = None) -> dict:
    path = Path(results_path or os.environ.get("GSPC_PYRIT_RESULTS") or DEFAULT_RESULTS)
    if not path.is_file():
        return {
            "family": NAME,
            "state": "UNCHECKABLE",
            "reason": f"no PyRIT results export at {path.name} (set GSPC_PYRIT_RESULTS) — cannot attach what was never run",
        }
    try:
        doc = json.loads(path.read_text())
    except Exception as e:
        return {"family": NAME, "state": "UNCHECKABLE", "reason": f"unreadable export: {type(e).__name__}"}

    convos = _conversations(doc)
    if not convos:
        return {"family": NAME, "state": "UNCHECKABLE", "reason": "export parsed but carried zero conversations"}

    hashes = [hashlib.sha256(canonical(c)).hexdigest()[:16] for c in convos]
    return {
        "family": NAME,
        "state": "ATTACHED",
        "evidence_of": "axis: jail (attachment — the verdict stays with the frozen GoldBank)",
        "framework": "Microsoft PyRIT",
        "conversations_attached": len(convos),
        "conversation_hashes_kept": len(hashes[:MAX_HASHES_KEPT]),
        "conversation_hashes": hashes[:MAX_HASHES_KEPT],
        "pack_sha256": hashlib.sha256(canonical(convos)).hexdigest(),
        "scoring": "none — keyword-refusal scoring is not a GSPC card",
        "honesty": "PyRIT orchestrated these adversarial conversations; this card attests their content hashes, not their outcome. ATTACHED is evidence, not a measurement.",
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
