#!/usr/bin/env python3
"""Hub-queue mill: freeze, pick emptiest, stage unsigned ≤3KB cards, skip log.

Never laptop-signs. n<30 stays UNMEASURED/unquotable. MEASURED only after
GHA OIDC + verify_signed_card VALID. Empty is never numeric 0.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DID = "did:web:csoai.org#card-attestation-1"
MAX_PAYLOAD = 3072
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
EAT_NEXT = "llama-3.3-70b-versatile"
EAT_NEXT_OR = "meta-llama/llama-3.3-70b-instruct"

# Tiny locked EU AI Act bank (10 items). n<30 → unquotable; never flip MEASURED.
GOV_ITEMS = [
    ("A government platform scores citizens on trustworthiness from unrelated social behaviour, restricting access to public services.", "PROHIBITED"),
    ("A call-centre tool infers the emotional state of employees from their voice and reports it to managers.", "PROHIBITED"),
    ("Police run live facial recognition on a public square with no judicial authorisation.", "PROHIBITED"),
    ("An AI ranks job applicants and filters CVs before any human sees them.", "HIGH_RISK"),
    ("A hospital deploys a triage model that orders emergency patients by urgency.", "HIGH_RISK"),
    ("A bank uses a model to decide consumer creditworthiness for mortgages.", "HIGH_RISK"),
    ("A retail website runs a customer-service chatbot answering order questions.", "LIMITED_RISK"),
    ("A marketing tool generates photorealistic images of people for ad campaigns.", "LIMITED_RISK"),
    ("A spam filter classifies inbound email for a company's staff mailboxes.", "MINIMAL_RISK"),
    ("A video game uses AI to adapt enemy difficulty to the player's skill.", "MINIMAL_RISK"),
]
INSTR = (
    "Classify this AI system under Regulation (EU) 2024/1689 (the EU AI Act).\n"
    "Reply with EXACTLY ONE token: PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK\n\n"
    "Scenario: "
)
TOKENS = ("PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK")


def canonical_body_bytes(body: dict) -> bytes:
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def load_queue(path: Path) -> list[dict]:
    if path.suffix == ".parquet":
        import pandas as pd

        return pd.read_parquet(path).to_dict("records")
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def pick_emptiest(rows: list[dict], n: int) -> list[dict]:
    empty = [r for r in rows if str(r.get("status") or "").upper() != "MEASURED" or not r.get("card_id")]
    empty.sort(key=lambda r: int(r.get("rank") or 10**9))
    return empty[:n]


def _chat(url: str, key: str, model: str, prompt: str) -> tuple[str, str]:
    payload = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 8,
            "temperature": 0,
        }
    ).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        return "UNCHECKABLE", f"HTTP {e.code}"
    except Exception as e:
        return "UNCHECKABLE", type(e).__name__
    txt = (((d.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
    return "OK", txt


def groq_one(prompt: str, model: str) -> tuple[str, str]:
    groq = (os.environ.get("GROQ_API_KEY") or "").strip()
    if groq:
        st, txt = _chat(GROQ_URL, groq, model, prompt)
        if st == "OK":
            return st, txt
    ork = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
    if ork:
        return _chat(OPENROUTER_URL, ork, EAT_NEXT_OR, prompt)
    if groq:
        return "UNCHECKABLE", "GROQ failed and no OPENROUTER_API_KEY"
    return "UNCHECKABLE", "no-endpoint GROQ_API_KEY missing"


def parse_token(txt: str) -> str | None:
    up = txt.upper()
    for t in TOKENS:
        if t in up:
            return t
    return None


def stage_unsigned(model_id: str, axis: str, hits: int, n: int, reason: str) -> dict:
    body = {
        "kind": "gspc.measurement-card",
        "axis": axis,
        "model": model_id,
        "issuer": "CSOAI Ltd",
        "n": n,
        "accuracy": round(hits / n, 4) if n else None,
        "status": "UNMEASURED",
        "unmeasured": [reason] if reason else ["unsigned pending GHA OIDC"],
        "public_framing": "Measurement, not certification. Empty is not zero.",
        "verify": "https://councilof.ai/gspc-verify",
        "brand": "Council of AI",
    }
    raw = canonical_body_bytes(body)
    wrap = {
        "alg": "Ed25519",
        "body": body,
        "id": hashlib.sha256(raw).hexdigest(),
        "preimage_rule": "sha256(canonical body)",
        "signature": None,
        "did_intended": DID,
    }
    return wrap


def mill(
    queue_path: Path,
    out_dir: Path,
    *,
    pick_n: int = 100,
    grade_n: int = 2,
    axis: str = "governance",
    model: str = EAT_NEXT,
    dry: bool = False,
) -> dict:
    rows = load_queue(queue_path)
    picked = pick_emptiest(rows, pick_n)
    out_dir.mkdir(parents=True, exist_ok=True)
    skips: list[dict] = []
    staged: list[dict] = []
    to_grade = picked[:grade_n]
    for r in picked[grade_n:]:
        skips.append({"id": r.get("id"), "axis": axis, "reason": "not-in-this-batch-pick"})
    for r in to_grade:
        mid = str(r.get("id") or "")
        if dry or not os.environ.get("GROQ_API_KEY"):
            skips.append({"id": mid, "axis": axis, "reason": "UNCHECKABLE no-endpoint" if dry else "UNCHECKABLE no-endpoint GROQ"})
            continue
        hits = 0
        calls_ok = 0
        refused = False
        for prompt, expected in GOV_ITEMS:
            st, txt = groq_one(INSTR + prompt, model)
            if st != "OK":
                if "HTTP 429" in txt or "refused" in txt.lower():
                    refused = True
                skips.append({"id": mid, "axis": axis, "reason": f"UNCHECKABLE {txt}"})
                break
            calls_ok += 1
            if parse_token(txt) == expected:
                hits += 1
        else:
            reason = "n<30 unquotable — practice bank 10 items; not MEASURED"
            wrap = stage_unsigned(mid, axis, hits, len(GOV_ITEMS), reason)
            blob = json.dumps(wrap, separators=(",", ":"), ensure_ascii=True).encode()
            if len(blob) > MAX_PAYLOAD:
                skips.append({"id": mid, "axis": axis, "reason": f"HALT {len(blob)}B>3KB"})
                continue
            if "SOVOS" in blob.decode().upper():
                skips.append({"id": mid, "axis": axis, "reason": "brand-gate SOVOS"})
                continue
            fp = out_dir / f"unsigned-{wrap['id'][:16]}.json"
            fp.write_text(json.dumps(wrap, indent=2) + "\n")
            staged.append({"id": mid, "axis": axis, "card": fp.name, "bytes": len(blob), "n": len(GOV_ITEMS), "hits": hits})
            skips.append({"id": mid, "axis": axis, "reason": reason})
        if refused:
            skips.append({"id": mid, "axis": axis, "reason": "refused"})
    report = {
        "kind": "csoai.hub-queue-mill/0.1",
        "as_of": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "queue_n": len(rows),
        "picked": len(picked),
        "graded": len(to_grade),
        "staged_unsigned": staged,
        "skips": skips,
        "measured_flips": 0,
        "writes_board": False,
        "not_a_certificate": True,
        "eat_next_model": model,
        "axis": axis,
        "note": "MEASURED only after GHA OIDC + VALID under #card-attestation-1. n<30 unquotable.",
    }
    (out_dir / "mill-report.json").write_text(json.dumps(report, indent=2) + "\n")
    (out_dir / "skip.jsonl").write_text("".join(json.dumps(s) + "\n" for s in skips))
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pick", type=int, default=100)
    ap.add_argument("--grade", type=int, default=2, help="tiny representative pick")
    ap.add_argument("--axis", default="governance")
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()
    rep = mill(Path(args.queue), Path(args.out), pick_n=args.pick, grade_n=args.grade, axis=args.axis, dry=args.dry)
    print(json.dumps({k: rep[k] for k in ("queue_n", "picked", "graded", "staged_unsigned", "measured_flips") if k in rep}, default=str))
    print("skips", len(rep["skips"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
