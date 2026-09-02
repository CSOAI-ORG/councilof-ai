#!/usr/bin/env python3
"""emilia-ep harness consumer — digest-only pointers → unsigned eval.delta.

Emits an unsigned card that records ep_receipt_digest pointers and the
honesty note EP ≠ SCITT inclusion. No keys. Never wrangler. Never certify.
CSOAI is not a TS. Never edits /api/gspc.

Harness (M4): ~/.grokbot/harness/run.sh measure — see HARNESS.md.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))
from _card_canon import unsigned_card, write_card  # noqa: E402

# Pinned digest ore (consume-only). Keep in sync with public/interop/emilia-ep README.
PIN_COMMIT = "e507acdf8efbe8951cb4294801d4c440f0b86a5a"
PIN_REPO = "https://github.com/emiliaprotocol/emilia-protocol"
DIGEST_POINTERS = [
    {
        "id": "conformance/composition/scitt-statement-identity-v0.1/report.reference.json",
        "sha256": "f84a65f3b1a1c88cfbf3b97782c5821b6651c37c7d0e407d2ff02594481395c3",
    },
    {
        "id": "conformance/composition/scitt-statement-identity-v0.1/vectors.reference.json",
        "sha256": "889e410cceec75f4c0955ca9a373d4a8375c00300cbe4d2be375a559958de697",
    },
    {
        "id": "conformance/composition/scitt-statement-identity-v0.1/source-lock.json",
        "sha256": "ca2a707100b0f6871912efe00dd4aa0b7fce91c15d22572cf382d3a4bf0a8232",
    },
    {
        "id": "docs/EP-RECEIPT-SCITT-PROFILE.md",
        "sha256": "75ff4ffc798b2ab893d1814560055c0446f52130228c66935eb45371acfb86f6",
    },
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_optional_example(root: Path) -> dict | None:
    p = root / "public" / "interop" / "emilia-ep" / "card-unsigned.example.json"
    if p.is_file():
        return json.loads(p.read_text(encoding="utf-8"))
    return None


def build_card(as_of: str, example: dict | None) -> dict:
    pointers = DIGEST_POINTERS
    if example and isinstance(example.get("payload"), dict):
        ep = example["payload"].get("ep_receipt_digest") or {}
        if isinstance(ep.get("pointers"), list) and ep["pointers"]:
            pointers = [
                {"id": x["id"], "sha256": x["sha256"]}
                for x in ep["pointers"]
                if x.get("id") and x.get("sha256")
            ]
    payload = {
        "profile": "emilia-ep-digest-only",
        "role": "digest_ore_consumer_only",
        "endorsement": False,
        "csoai_is_transparency_service": False,
        "ep_ne_scitt_inclusion": {
            "note": "EP authorization receipt != SCITT transparency/inclusion receipt",
            "this_card_claims_inclusion": False,
            "ep": "EP-RECEIPT-v1 (who approved what)",
            "scitt": "COSE Receipt / RFC 9942 (statement was logged)",
        },
        "pin": {
            "repo": PIN_REPO,
            "commit": PIN_COMMIT,
            "preimage_rule": "ep-scitt-statement-identity-v0.1",
            "wire": "digest pointers only; do not vendor main",
        },
        "ep_receipt_digest": {
            "pattern": "pointer",
            "pointers": pointers,
        },
        "board_axis_fill": False,
        "never_certify": True,
        "status": "UNSIGNED_DIGEST_ORE",
    }
    sources = [
        PIN_REPO,
        f"{PIN_REPO}/blob/{PIN_COMMIT}/docs/EP-RECEIPT-SCITT-PROFILE.md",
        "https://www.rfc-editor.org/rfc/rfc9943.html",
    ]
    return unsigned_card(
        surface="eval.delta",
        subject="emilia-ep digest-only → unsigned eval.delta (EP≠SCITT inclusion)",
        as_of=as_of,
        source_urls=sources,
        payload=payload,
        unmeasured=[
            "out-of-band-keys",
            "not-inclusion-proof",
            "csoai-not-a-ts",
            "no-live-scitt-keys",
            "live_emilia_verify_run",
            "n>=30",
            "4way",
            "keystone",
            "gspc_axis_projection_forbidden",
        ],
        tags=[
            "emilia-ep",
            "eval.delta",
            "unsigned",
            "digest-only",
            "ep-ne-scitt-inclusion",
            "not-a-ts",
            "harness-consumer",
        ],
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo-root", type=Path, default=None)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--stdout", action="store_true")
    args = ap.parse_args()
    root = args.repo_root or repo_root()
    as_of = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    example = load_optional_example(root)
    card = build_card(as_of, example)
    assert card["sig_ed25519"] is None
    assert card["payload"]["ep_ne_scitt_inclusion"]["this_card_claims_inclusion"] is False
    out = args.out or (root / "public" / "interop" / "emilia-ep" / "card-unsigned.consumer.json")
    if args.stdout:
        print(json.dumps(card, indent=2, ensure_ascii=False))
    else:
        write_card(out, card)
        print(f"wrote {out} sha256={card['sha256']} EP≠SCITT sig=null", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
