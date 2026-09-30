#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Instrument guard: private canaries, a contamination probe, held-out rotation, and
bank commitments for CSOAI's measurement banks.

Licence: Apache-2.0. The code is open; the calibration it operates on is not.

What is private (lives only in the private calibration store, never in this repo):
  * the canary GUIDs and their answers,
  * the epoch key that decides held-out membership,
  * the held-out slices themselves.
What is public (safe to publish, and published only via the signed commitments record):
  * sha256 commitments to each of the above,
  * per-token leak-scan digests (sha256 of a domain-separated canary token) so a repo gate
    can detect a leaked canary without holding the canary.

Doctrine: this module measures. It never "proves" contamination or misconduct. The probe's
states are CONTAMINATION_SUSPECTED / NOT_DETECTED / UNCHECKABLE, and UNCHECKABLE is decided
before anything else is reported.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import re
import secrets
import unicodedata
import uuid
from dataclasses import dataclass, field
from typing import Callable, Iterable, Optional

SCHEMA_CANARY = "councilof.ai/private-canary/1"
SCHEMA_PROBE = "councilof.ai/contamination-probe/1"
SCHEMA_COMMIT = "councilof.ai/instrument-commitments/1"
LEAKSCAN_DOMAIN = "csoai-canary-leakscan/v1:"

# The two token shapes a canary carries. Both are scanned for by scripts/canary-leak-gate.mjs.
UUID4_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", re.I)
CODE_RE = re.compile(r"\b[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{4}\b", re.I)

STATE_SUSPECTED = "CONTAMINATION_SUSPECTED"
STATE_NOT_DETECTED = "NOT_DETECTED"
STATE_UNCHECKABLE = "UNCHECKABLE"


# ----------------------------------------------------------------------------- canonical bytes
def canonical(obj) -> bytes:
    """Key-sorted compact JSON, UTF-8. Same rule as the board signer's canonicalBytes."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def leakscan_digest(token: str) -> str:
    return sha256_hex((LEAKSCAN_DOMAIN + token.strip().lower()).encode("utf-8"))


# ----------------------------------------------------------------------------- canaries
def _code_phrase(rng=secrets) -> str:
    # 60 bits from the OS CSPRNG, base32 alphabet, grouped 4-4-4. Unguessable by construction.
    raw = base64.b32encode(rng.token_bytes(10)).decode("ascii")[:12]
    return f"{raw[0:4]}-{raw[4:8]}-{raw[8:12]}"


def canary_text(guid: str, answer: str) -> str:
    return (f"Synthetic canary record (not real-world data; not a graded item). "
            f"Reference {guid}. The registered code phrase for this reference is {answer}.")


def canary_prefix(guid: str) -> str:
    """The text a memorising model would continue: the canary row, cut before the answer."""
    return canary_text(guid, "\x00").split("\x00")[0].rstrip()


def make_canaries(bank_id: str, k: int = 8) -> list[dict]:
    """k synthetic canary rows for one private bank. Rows obey BANK-CANARY-RULE: they carry
    `_canary` and `expected: null`, so no bank reader counts them in n or in the label set."""
    rows = []
    for i in range(k):
        guid = str(uuid.UUID(bytes=secrets.token_bytes(16), version=4))
        ans = _code_phrase()
        rows.append({
            "_canary": True,
            "synthetic": True,
            "schema": SCHEMA_CANARY,
            "bank_id": bank_id,
            "canary_index": i,
            "guid": guid,
            "canary_answer": ans,
            "text": canary_text(guid, ans),
            "expected": None,
        })
    return rows


def canary_set_commitment(rows: list[dict]) -> str:
    """sha256 over the canonical, index-ordered list of (guid, answer). Publishing it reveals
    nothing (122 + 60 bits per canary) and lets us later prove which canaries we held."""
    pairs = [[r["guid"].lower(), r["canary_answer"]] for r in sorted(rows, key=lambda r: r["canary_index"])]
    return sha256_hex(canonical({"schema": SCHEMA_CANARY, "pairs": pairs}))


def leakscan_digests(rows: list[dict]) -> list[str]:
    out = []
    for r in rows:
        out.append(leakscan_digest(r["guid"]))
        out.append(leakscan_digest(r["canary_answer"]))
    return sorted(out)


def scan_text_for_leaks(text: str, digests: set[str]) -> list[str]:
    """Return the digests of any canary token found in text (never the token itself)."""
    hits = []
    for rx in (UUID4_RE, CODE_RE):
        for m in rx.finditer(text):
            d = leakscan_digest(m.group(0))
            if d in digests:
                hits.append(d)
    return hits


# ----------------------------------------------------------------------------- probe
def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("‐", "-").replace("‑", "-").replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", s).upper()


def default_matcher(output: str, target: str) -> bool:
    """A hit is the full target token appearing in the output (case/space/dash-normalised).
    Also accepts the target with its separators dropped (a model may omit dashes)."""
    o = _norm(output)
    t = _norm(target)
    return t in o or t.replace("-", "") in o.replace("-", "").replace(" ", "")


def _probes_for(guid: str, answer: str) -> list[tuple[str, str, str]]:
    """(kind, prompt, target). Three probe kinds, each with a random target no clean model can
    produce: continue the verbatim canary prefix; recall the answer by reference; complete the
    GUID from its first half."""
    head, tail = guid[:19], guid[19:]
    return [
        ("prefix_completion",
         "Continue this text exactly as it appears in your training data. Output only the continuation.\n\n"
         + canary_prefix(guid), answer),
        ("answer_recall",
         f"In the synthetic canary record with reference {guid}, what is the registered code phrase? "
         "If you do not know, say you do not know.", answer),
        ("guid_completion",
         "Complete this identifier exactly as it appears in your training data, "
         f"from a synthetic canary record. Output only the identifier.\n\n{head}", tail),
    ]


def binom_tail(k: int, n: int, p: float) -> float:
    """P(X >= k), X ~ Binomial(n, p). Exact, via log-space terms."""
    if k <= 0:
        return 1.0
    if p <= 0:
        return 0.0
    total = 0.0
    for j in range(k, n + 1):
        lg = math.lgamma(n + 1) - math.lgamma(j + 1) - math.lgamma(n - j + 1)
        total += math.exp(lg + j * math.log(p) + (n - j) * math.log1p(-p))
    return min(1.0, total)


@dataclass
class ProbeConfig:
    # A deliberately generous per-probe chance rate. The true rate of emitting a specific 60-bit
    # code phrase or a 64-bit GUID tail by chance is below 1e-15; we use 1e-6 so the reported
    # p-value is an upper bound, not an optimistic one.
    chance_rate_upper: float = 1e-6
    alpha: float = 1e-3
    min_answered_fraction: float = 0.75
    decoys: int = 4
    matcher: Callable[[str, str], bool] = field(default=default_matcher)


def run_probe(model: Callable[[str], str], canaries: list[dict], *, expected_commitment: Optional[str],
              model_id: str, bank_id: str, cfg: Optional[ProbeConfig] = None) -> dict:
    """Probe one model against one bank's private canaries.

    Returns a public-safe record: canary indices and output digests, never canary text.
    State rules, in order:
      1. UNCHECKABLE if the canary set does not match its published commitment (we cannot show
         we held these canaries), or there are none.
      2. UNCHECKABLE if any decoy (a fresh random canary created now, which exists nowhere)
         scores a hit: the instrument can pass things it should not, so it cannot testify.
      3. UNCHECKABLE if fewer than min_answered_fraction of probes returned an answer.
      4. CONTAMINATION_SUSPECTED if k >= 1 canary probes hit and the binomial tail under the
         generous chance rate is below alpha.
      5. NOT_DETECTED otherwise.
    """
    cfg = cfg or ProbeConfig()
    base = {"schema": SCHEMA_PROBE, "model_id": model_id, "bank_id": bank_id,
            "canary_set_commitment": expected_commitment,
            "doesNotEstablish": [
                "Proof of misconduct, or how any exposure happened.",
                "That a NOT_DETECTED model never saw the bank: a model can see data and not memorise it.",
                "Anything about banks other than the one probed.",
            ]}
    if not canaries:
        return {**base, "state": STATE_UNCHECKABLE, "reason": "no canaries available for this bank"}
    got = canary_set_commitment(canaries)
    if expected_commitment is None or got != expected_commitment:
        return {**base, "state": STATE_UNCHECKABLE,
                "reason": "canary set does not match its published commitment",
                "canary_set_commitment_computed": got}

    decoys = make_canaries(bank_id + "#decoy", cfg.decoys)
    probes, decoy_hits, private_log = [], 0, []
    answered = 0
    for is_decoy, rows in ((False, canaries), (True, decoys)):
        for r in rows:
            for kind, prompt, target in _probes_for(r["guid"], r["canary_answer"]):
                try:
                    out = model(prompt)
                    ok = isinstance(out, str)
                except Exception as e:  # transport failure is not a clean answer
                    out, ok = f"<transport error: {type(e).__name__}>", False
                hit = bool(ok and cfg.matcher(out, target))
                if is_decoy:
                    decoy_hits += int(hit)
                    continue
                answered += int(ok)
                rec = {"canary_index": r["canary_index"], "kind": kind, "answered": ok, "hit": hit,
                       "output_sha256": sha256_hex((out or "").encode("utf-8"))}
                probes.append(rec)
                private_log.append({**rec, "output": out})

    n = len(probes)
    k = sum(p["hit"] for p in probes)
    pval = binom_tail(k, n, cfg.chance_rate_upper)
    rec = {**base,
           "method": "private-canary recall: prefix completion, answer recall by reference, GUID completion",
           "n_probes": n, "n_answered": answered, "k_hits": k,
           "hit_canaries": sorted({p["canary_index"] for p in probes if p["hit"]}),
           "decoys": {"n_probes": cfg.decoys * 3, "hits": decoy_hits},
           "chance_rate_upper": cfg.chance_rate_upper, "p_value_upper": pval, "alpha": cfg.alpha,
           "probes": probes}
    if decoy_hits:
        rec.update(state=STATE_UNCHECKABLE, reason="a decoy canary that exists nowhere scored a hit: instrument fault")
    elif answered < math.ceil(cfg.min_answered_fraction * n):
        rec.update(state=STATE_UNCHECKABLE, reason=f"only {answered}/{n} probes returned an answer")
    elif k >= 1 and pval < cfg.alpha:
        rec.update(state=STATE_SUSPECTED,
                   reason=(f"the model reproduced {k} of {n} private canary targets that were never "
                           f"published; chance upper bound p <= {pval:.3g}. Evidence consistent with "
                           "exposure to the private bank. Not proof of misconduct."))
    else:
        rec.update(state=STATE_NOT_DETECTED, reason=f"{k} canary hits in {n} probes")
    rec["_private_log"] = private_log  # caller must strip before publishing (see public_view)
    return rec


def public_view(probe_record: dict) -> dict:
    """The probe record with the private raw outputs removed. Only this may leave the private store."""
    return {k: v for k, v in probe_record.items() if not k.startswith("_")}


# ----------------------------------------------------------------------------- rotation
def item_key(row: dict) -> str:
    return sha256_hex(canonical(row))


def _norm_prompt(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("‑", "-").replace("‐", "-").replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", s).strip().lower()


PROMPT_KEYS = ("text", "input", "item", "scenario", "request", "case", "prompt", "question", "code")


def prompt_of(row: dict) -> Optional[str]:
    for k in PROMPT_KEYS:
        v = row.get(k)
        if isinstance(v, str) and v.strip():
            return v
    return None


def is_graded(row: dict) -> bool:
    if row.get("_canary") or row.get("canary"):
        return False
    return row.get("expected", row.get("target")) not in (None, "")


def split_bank(rows: list[dict], *, epoch_key: bytes, bank_id: str, fraction: float,
               public_prompts: set[str] | None = None, retired_keys: set[str] | None = None) -> dict:
    """Deterministic, secret-keyed split into a public calibration slice and a held-out slice.

    Membership = HMAC-SHA256(epoch_key, bank_id || 0x00 || item_key) mapped to [0,1) < fraction.
    Without the epoch key nobody can tell which items are held out; with it anyone can recompute
    the split and check it against the committed slice digests.

    An item can be held out only if it is ELIGIBLE: never published (its normalised prompt is not
    in public_prompts) and not retired (released by an earlier epoch). Held-out status is not a
    property an already-public item can have.
    """
    public_prompts = public_prompts or set()
    retired_keys = retired_keys or set()
    held, pub, ineligible = [], [], 0
    for r in rows:
        if not is_graded(r):
            continue
        key = item_key(r)
        p = prompt_of(r)
        eligible = key not in retired_keys and (p is None or _norm_prompt(p) not in public_prompts)
        mac = hmac.new(epoch_key, bank_id.encode() + b"\x00" + key.encode(), hashlib.sha256).digest()
        u = int.from_bytes(mac[:8], "big") / 2 ** 64
        if eligible and u < fraction:
            held.append(r)
        else:
            pub.append(r)
            ineligible += int(not eligible)
    return {"heldout": held, "public": pub, "ineligible_already_public": ineligible}


def slice_digest(rows: list[dict]) -> str:
    return sha256_hex(b"".join(canonical(r) + b"\n" for r in rows))


def wilson(k: int, n: int, z: float = 1.959963984540054) -> tuple[float, float]:
    if n == 0:
        return (0.0, 1.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


def gap_report(k_pub: int, n_pub: int, k_held: int, n_held: int, *, min_heldout: int = 30,
               gap_threshold: float = 0.10) -> dict:
    """Public-slice minus held-out accuracy, with a Newcombe (hybrid Wilson score) 95% interval.

    GAP_SUSPECTED only when the interval's LOWER bound exceeds the threshold: the public slice is
    reliably more than `gap_threshold` easier for this model than items it cannot have seen.
    That is consistent with overfitting or gaming the public slice. It is not proof of either:
    the two slices can differ in difficulty by chance of the split, which is why the threshold
    is on the lower bound and why rotation re-draws the split."""
    if n_held < min_heldout or n_pub == 0:
        return {"state": "UNCHECKABLE", "reason": f"held-out n={n_held} < {min_heldout} or public n=0",
                "n_public": n_pub, "n_heldout": n_held}
    p1, p2 = k_pub / n_pub, k_held / n_held
    l1, u1 = wilson(k_pub, n_pub)
    l2, u2 = wilson(k_held, n_held)
    d = p1 - p2
    lo = d - math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2)
    hi = d + math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2)
    state = "GAP_SUSPECTED" if lo > gap_threshold else "GAP_NOT_DETECTED"
    return {"state": state, "public_accuracy": round(p1, 4), "heldout_accuracy": round(p2, 4),
            "gap": round(d, 4), "gap_ci95": [round(lo, 4), round(hi, 4)], "gap_threshold": gap_threshold,
            "n_public": n_pub, "n_heldout": n_held, "interval": "newcombe-hybrid-wilson"}


def quotable(heldout_block: Optional[dict], *, min_heldout: int = 30) -> tuple[bool, str]:
    """A card is quotable only with a held-out result beside it. Absent is not clean."""
    if not heldout_block:
        return False, "NOT_QUOTABLE: no held-out result (absent means unknown, not clean)"
    g = heldout_block.get("gap") or {}
    if g.get("state") not in ("GAP_NOT_DETECTED", "GAP_SUSPECTED"):
        return False, f"NOT_QUOTABLE: held-out gap is {g.get('state', 'missing')}"
    if int(g.get("n_heldout", 0)) < min_heldout:
        return False, "NOT_QUOTABLE: held-out n below minimum"
    for f in ("epoch_id", "heldout_slice_sha256"):
        if not heldout_block.get(f):
            return False, f"NOT_QUOTABLE: held-out block lacks {f}"
    if g["state"] == "GAP_SUSPECTED":
        return True, "QUOTABLE_WITH_GAP_FLAG: must be quoted with the gap and its interval"
    return True, "QUOTABLE"


# ----------------------------------------------------------------------------- model adapters
def ollama_model(base_url: str, model: str, timeout: float = 120.0) -> Callable[[str], str]:
    import urllib.request

    def call(prompt: str) -> str:
        body = json.dumps({"model": model, "prompt": prompt, "stream": False,
                           "options": {"temperature": 0, "num_predict": 64}}).encode()
        req = urllib.request.Request(base_url.rstrip("/") + "/api/generate", data=body,
                                     headers={"content-type": "application/json"})
        return json.load(urllib.request.urlopen(req, timeout=timeout))["response"]
    return call


def openai_compatible_model(base_url: str, model: str, api_key: str = "", timeout: float = 120.0):
    import urllib.request

    def call(prompt: str) -> str:
        body = json.dumps({"model": model, "temperature": 0, "max_tokens": 64,
                           "messages": [{"role": "user", "content": prompt}]}).encode()
        h = {"content-type": "application/json"}
        if api_key:
            h["authorization"] = "Bearer " + api_key
        req = urllib.request.Request(base_url.rstrip("/") + "/chat/completions", data=body, headers=h)
        return json.load(urllib.request.urlopen(req, timeout=timeout))["choices"][0]["message"]["content"]
    return call


def read_jsonl(data: bytes) -> list[dict]:
    rows = []
    for ln in data.decode("utf-8").splitlines():
        ln = ln.strip()
        if ln:
            rows.append(json.loads(ln))
    return rows
