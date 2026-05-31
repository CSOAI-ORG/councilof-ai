"""
MEOK DATA FORGE — turn the expiring £742 Gemini credit into a PERMANENT asset.

Nick's insight: a chatbot on the credit leaves nothing when it expires (June 9). But using
Gemini to GENERATE LABELED TRAINING DATA leaves you a dataset + sharper neural nets forever.
Expiring compute → permanent moat.

The 6 SOV3 neural nets are starved (only ~246 hand-written examples each). FORGE asks Gemini
to synthesize thousands more, in the EXACT schema the NNs already train on:
    {content, care_weight, importance_score, memory_type, tags}

Plus a FREE-TIER WATERFALL (the Kilo/Cline pattern): use a model's free quota until it 429s,
then fall to the next, then local — so generation never stops and burns free quota first.

    forge(kind, n=200)   -> generated examples appended to sovereign-temple/training_data/<kind>_episodes.json
    KINDS: care, emotion, intent, threat, sentiment, relationship, creativity, partnership

Run:  GOOGLE_API_KEY=AIza... python3 -m meok_one.data_forge care 500
Needs a REAL Gemini key (https://aistudio.google.com/apikey). No gcloud, no terminal pty needed.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# load .env.local if present (gitignored)
_ENV = Path(__file__).resolve().parent.parent / ".env.local"
if _ENV.exists():
    for line in _ENV.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

_TRAIN_DIR = Path(__file__).resolve().parents[2] / "sovereign-temple" / "training_data"

# FREE-TIER WATERFALL — try each in order until one answers (the Kilo/Cline auto-fallback).
# Free tiers 429 ("resource exhausted") when burned; we catch that and drop to the next.
# VERIFIED 2026-05-31 against Nick's key: these have free quota; gemini-2.0-flash daily cap was spent.
# Order = best free quota first; auto-fall on 429 (Kilo/Cline pattern).
_WATERFALL = [
    ("gemini-flash-latest",      "google"),   # ✅ works, generous
    ("gemini-flash-lite-latest", "google"),   # ✅ works, cheapest
    ("gemma-4-31b-it",           "google"),   # ✅ works — 31B free fallback
    ("gemma-4-26b-a4b-it",       "google"),   # ✅ free fallback
    ("gemini-2.5-flash",         "google"),   # try if others capped
]

# what each NN learns to score — the prompt seed per kind
_KINDS = {
    "care":         "emotional care & support quality (warmth, presence, validation)",
    "emotion":      "the speaker's emotion (joy, sadness, anger, fear, surprise, calm)",
    "intent":       "the user's intent (ask_help, vent, command, chat, crisis, thanks)",
    "threat":       "safety threat level (none, mild, moderate, severe self-harm/abuse)",
    "sentiment":    "sentiment polarity (positive, neutral, negative) + intensity",
    "relationship": "relationship depth signal (stranger, warming, bonded, trusted)",
    "creativity":   "creative/novel-idea content quality",
    "partnership":  "collaboration/partnership-opportunity signal",
}


def _gemini(prompt: str, model: str, key: str, timeout: int = 60) -> dict:
    """One Gemini call. Returns {ok, text} or {ok:False, status, err}."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}],
                       "generationConfig": {"temperature": 1.0, "maxOutputTokens": 8192}}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            d = json.loads(r.read().decode())
        txt = d["candidates"][0]["content"]["parts"][0]["text"]
        return {"ok": True, "text": txt}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "err": e.read().decode()[:200]}
    except Exception as e:
        return {"ok": False, "status": 0, "err": str(e)[:200]}


def _ask_waterfall(prompt: str) -> dict:
    """Try each free-tier model until one answers (Kilo-style auto-fallback on 429)."""
    key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not key or not key.startswith("AIza"):
        return {"ok": False, "err": "no real GOOGLE_API_KEY (need AIza... from aistudio.google.com/apikey)"}
    for model, _ in _WATERFALL:
        r = _gemini(prompt, model, key)
        if r["ok"]:
            r["model"] = model
            return r
        if r.get("status") == 429:
            print(f"   [{model}] free tier exhausted (429) → falling to next…")
            continue
        if r.get("status") in (400, 403):
            return r  # auth/permission error — next model won't help
        print(f"   [{model}] error {r.get('status')} → trying next…")
    return {"ok": False, "err": "all free-tier models exhausted/failed"}


_PROMPT = """You are generating TRAINING DATA for a neural net that scores {desc}.
Produce {batch} diverse, realistic examples as a JSON array. Each item EXACTLY:
{{"content": "<a realistic 1-3 sentence user message or conversation snippet>",
  "care_weight": <float 0.0-1.0>,
  "importance_score": <float 0.0-1.0>,
  "memory_type": "interaction",
  "tags": ["<2-4 short tags>"]}}
Cover the FULL range (high, medium, low). Vary tone, context, persona. UK English.
Output ONLY the JSON array, no prose, no markdown fences."""


def _parse_array(text: str) -> list:
    """Extract a JSON array from the model output (strip fences, find brackets)."""
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1] if "```" in t[3:] else t[3:]
        t = t.replace("json", "", 1).strip()
    a, b = t.find("["), t.rfind("]")
    if a == -1 or b == -1:
        return []
    try:
        out = json.loads(t[a:b + 1])
        return out if isinstance(out, list) else []
    except json.JSONDecodeError:
        return []


def forge(kind: str, n: int = 200, batch: int = 25) -> dict:
    """Generate n examples for `kind`, append to its training file. Free-tier waterfall."""
    if kind not in _KINDS:
        return {"error": f"kind must be one of {list(_KINDS)}"}
    target = _TRAIN_DIR / f"{kind}_episodes.json"
    existing = []
    if target.exists():
        try:
            existing = json.loads(target.read_text())
        except json.JSONDecodeError:
            existing = []
    start = len(existing)
    generated = []
    rounds = (n + batch - 1) // batch
    for i in range(rounds):
        print(f"  forging {kind} batch {i+1}/{rounds} (have {start+len(generated)})…")
        r = _ask_waterfall(_PROMPT.format(desc=_KINDS[kind], batch=batch))
        if not r["ok"]:
            print(f"  STOP: {r.get('err')}")
            break
        items = _parse_array(r["text"])
        good = [x for x in items if isinstance(x, dict) and x.get("content")]
        generated.extend(good)
        print(f"   +{len(good)} via {r.get('model')}")
        time.sleep(1)  # be polite to the free tier
        if len(generated) >= n:
            break
    if generated:
        merged = existing + generated
        _TRAIN_DIR.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(merged, indent=2))
        # ALSO mirror to a git-TRACKED corpus so the asset is backed up to GitHub
        # (sovereign-temple/ is gitignored — without this the forged data isn't safe).
        backup_dir = Path(__file__).resolve().parent.parent / "training_corpus"
        backup_dir.mkdir(parents=True, exist_ok=True)
        (backup_dir / f"{kind}_episodes.json").write_text(json.dumps(merged, indent=2))
    return {"kind": kind, "before": start, "added": len(generated),
            "total": start + len(generated), "file": str(target),
            "backup": "meok-one/training_corpus/"}


if __name__ == "__main__":
    kind = sys.argv[1] if len(sys.argv) > 1 else "care"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    key = os.environ.get("GOOGLE_API_KEY", "").strip()
    print(f"MEOK DATA FORGE — kind={kind} target=+{n}")
    print(f"key: {'REAL (AIza)' if key.startswith('AIza') else 'MISSING — get one at https://aistudio.google.com/apikey'}")
    if key.startswith("AIza"):
        print(json.dumps(forge(kind, n), indent=2))
    else:
        print("→ paste a real Gemini key into meok-one/.env.local then re-run. Engine is ready.")
