"""
inspect_sigil_bridge — bind the Sigil signing spine into Inspect AI's Scorer.

This is the Gap-2 wire-in from the Aug-2026 Fork Manifest:
"wrap every eval log as an OMS inbound record -> Council card -> SCITT receipt.
Inspect's Scorer object is the natural hook."

Usage (inside any Inspect task file):

    from inspect_sigil_bridge import SigilScorer
    from inspect_ai.scorer import accuracy

    scorer = SigilScorer(accuracy(), axis="governance", model="council-34")

    @task
    def my_eval():
        return Task(dataset=..., scorer=scorer, ...)

Every score() call is Ed25519-signed and hash-chained to
~/.sovereign/sigil_chain.jsonl, then appended to a per-run ledger
(inspect-sigil-ledger.jsonl in the run dir). The unsigned Inspect log
still exists — the signed card is the measurement envelope ON TOP of it,
so nothing Inspect-native is lost.

If inspect_ai is not importable, the bridge reports that honestly and
refuses to fake a wrapper.
"""

import json
import time
from pathlib import Path
from typing import Any, Optional

try:
    from inspect_ai.scorer import Scorer  # type: ignore
    INSPECT_PRESENT = True
except ImportError:
    INSPECT_PRESENT = False

import sigil_inspect


def _run_ledger() -> Path:
    p = Path.cwd() / "inspect-sigil-ledger.jsonl"
    return p


class SigilScorer:
    """Inspect-compatible Scorer wrapper that signs every scoring call.

    When INSPECT_PRESENT is False this class still exists so imports don't
    break — its .sign_last() path can be used standalone — but it will not
    claim to wrap an Inspect Scorer it cannot see.
    """

    def __init__(self, inner_scorer: Any, axis: str = "unknown", model: str = "unknown"):
        self._inner = inner_scorer
        self._axis = axis
        self._model = model
        self._key = sigil_inspect.load_sigil_key()
        self._last_card: Optional[dict] = None

    # -- Inspect protocol -------------------------------------------------
    async def __call__(self, *args: Any, **kwargs: Any):
        if not INSPECT_PRESENT:
            raise RuntimeError(
                "inspect_ai is not installed in this environment — "
                "SigilScorer cannot wrap a Scorer it cannot import"
            )
        result = await self._inner(*args, **kwargs)
        card = self.sign_last({"scorer_output": str(result)})
        result_dict = {"scorer_result": result, "council_card": card}
        return result_dict

    # -- signing path (shared) -------------------------------------------
    def sign_last(self, body: dict) -> dict:
        card = sigil_inspect.sign_measurement(
            body, sk=self._key, axis=self._axis, model=self._model
        )
        self._last_card = card
        with open(_run_ledger(), "a") as f:
            f.write(
                json.dumps(
                    {"ts": time.time_ns(), "axis": self._axis, "model": self._model, "card": card},
                    sort_keys=True,
                )
                + "\n"
            )
        return card

    # -- status ------------------------------------------------------------
    def status(self) -> dict:
        return {
            "inspect_present": INSPECT_PRESENT,
            "axis": self._axis,
            "model": self._model,
            "key_loaded": self._key is not None,
            "chain_len": sum(1 for _ in open(sigil_inspect.SIGIL_CHAIN_PATH)) if sigil_inspect.SIGIL_CHAIN_PATH.exists() else 0,
            "last_sigil": self._last_card["signature"]["sigil"] if self._last_card else None,
        }


if __name__ == "__main__":
    print(json.dumps(
        {
            "inspect_ai_present": INSPECT_PRESENT,
            "sigil_chain": str(sigil_inspect.SIGIL_CHAIN_PATH),
            "note": "Run inside an Inspect task; this module is the scorer wrapper, not a CLI.",
        },
        indent=2,
    ))
