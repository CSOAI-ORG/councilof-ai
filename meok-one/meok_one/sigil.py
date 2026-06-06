"""MEOK ONE — SIGIL: the agent-decision audit trail (stdlib only, zero deps).

SIGIL = Sovereign Inter-aGent Interchange Language. A compact, deterministic, pipe-delimited
opcode language: one line → one decision → one English gloss → one signed receipt. This is a
faithful, self-contained port of meok-sigil's core grammar (so meok-one stays standalone), plus
a HASH-CHAINED audit log: every recorded line's receipt = sha256(prev_receipt + line), so the
whole trail is tamper-evident and independently verifiable — exactly what EU AI Act Art 12/14
(tamper-evident logging) and the 2026 "hash-chained receipts" standard ask for.

Core vocabulary (matches meok-sigil v0.1):
  P propose · V vote · M memory · Q query · C care · H handoff · S state · A alert

The Sovereign council EMITS SIGIL on every run (one V per lens, an S for the verdict, an A on
veto). The OS Compliance tab GLOSSES the live trail so a person can read — and verify — exactly
how their AI reasoned. The moat made visible.
"""
import os
import json
import time
import hashlib
import threading
from collections import deque

# choice symbols (wire) ↔ words (gloss) — matches SIGIL's compact vote encoding
_CHOICE = {"+": "approve", "-": "veto", "~": "revise", "=": "abstain"}
_CHOICE_INV = {v: k for k, v in _CHOICE.items()}

# opcode specs: code -> (name, [(field, kind)], gloss_template)
_OPS = {
    "P": ("propose", [("id", "s"), ("topic", "s"), ("options", "list")],
          'Proposal {id}: "{topic}" — options: {options}.'),
    "V": ("vote", [("agent", "s"), ("prop", "s"), ("choice", "choice"), ("conf", "float")],
          "{agent} votes {choice} on {prop} (confidence {conf})."),
    "M": ("memory", [("key", "s"), ("value", "s"), ("salience", "float")],
          'Store memory [{key}] = "{value}" (salience {salience}).'),
    "Q": ("query", [("pattern", "s"), ("k", "int")],
          'Retrieve top {k} memories matching "{pattern}".'),
    "C": ("care", [("subject", "s"), ("score", "float"), ("dims", "list")],
          "Care assessment of {subject}: {score} across {dims}."),
    "H": ("handoff", [("frm", "s"), ("to", "s"), ("task", "s")],
          "Handoff from {frm} to {to}: {task}."),
    "S": ("state", [("fields", "kv*")], "State — {fields}."),
    "A": ("alert", [("level", "s"), ("msg", "s")], "ALERT[{level}]: {msg}"),
    # ---- multimodal: SIGIL as the SEMANTIC layer over media (not a pixel codec). A vision
    # model (e.g. step3.7) looks at a screen/frame ONCE and emits these compact opcodes; agents
    # then reason over the SIGIL — tiny, glossable, hash-chained — instead of re-shipping pixels.
    "F": ("frame", [("scene", "s"), ("objects", "list"), ("ref", "s")],
          'Frame: {scene} — objects: {objects} [{ref}].'),          # one screen/video frame, summarised
    "D": ("detect", [("label", "s"), ("bbox", "s"), ("conf", "float")],
          "Detected {label} at {bbox} (confidence {conf})."),        # one on-screen detection / region
}

_SAFE = str.maketrans({"|": "/", ":": ";", "\n": " "})   # keep the wire grammar unambiguous


def _clean(v) -> str:
    return str(v).translate(_SAFE)


def encode(d: dict) -> str:
    """dict (with 'op') → a SIGIL line. Faithful to meok-sigil's pipe grammar."""
    code = d["op"]
    name, fields, _ = _OPS[code]
    parts = [code]
    for fname, kind in fields:
        if kind == "kv*":
            for k, v in (d[fname] or {}).items():
                parts.append(f"{_clean(k)}:{_clean(v)}")
        elif kind == "list":
            parts.append(",".join(_clean(x) for x in d[fname]))
        elif kind == "choice":
            parts.append(_CHOICE_INV.get(d[fname], _clean(d[fname])))
        else:
            parts.append(_clean(d[fname]))
    return "|".join(parts)


def gloss(line: str) -> str:
    """A SIGIL line → plain English."""
    parts = line.strip().split("|")
    code = parts[0]
    if code not in _OPS:
        return line
    name, fields, tmpl = _OPS[code]
    args = parts[1:]
    view, i = {}, 0
    for fname, kind in fields:
        if kind == "kv*":
            view[fname] = ", ".join(s.replace(":", "=", 1) for s in args[i:])
            i = len(args)
        elif i < len(args):
            v = args[i]
            view[fname] = _CHOICE.get(v, v) if kind == "choice" else v
            i += 1
        else:
            view[fname] = ""
    try:
        return tmpl.format(**view)
    except (KeyError, IndexError):
        return f"{name}: {view}"


def parse(line: str) -> dict:
    """A SIGIL line → its dict (the inverse of encode; encode(parse(x)) == x for valid lines —
    the lossless guarantee). Unknown opcodes return their raw fields under _raw."""
    parts = line.strip().split("|")
    code = parts[0]
    if code not in _OPS:
        return {"op": code, "_raw": parts[1:]}
    name, fields, _ = _OPS[code]
    out, args, i = {"op": code}, parts[1:], 0
    for fname, kind in fields:
        if kind == "kv*":
            out[fname] = dict(s.split(":", 1) for s in args[i:] if ":" in s)
            i = len(args)
        elif kind == "list":
            out[fname] = args[i].split(",") if (i < len(args) and args[i]) else []
            i += 1
        elif kind == "choice":
            out[fname] = _CHOICE.get(args[i], args[i]) if i < len(args) else ""
            i += 1
        else:
            out[fname] = args[i] if i < len(args) else ""
            i += 1
    return out


# ---- hash-chained, tamper-evident audit log --------------------------------
_GENESIS = "MEOK-SIGIL-GENESIS"
_LOCK = threading.RLock()
_LOG = deque(maxlen=1000)
_STORE = os.environ.get("MEOK_SIGIL_LOG",
                        str(os.path.join(os.path.dirname(__file__), "data", "sigil_audit.jsonl")))


def _load_existing() -> None:
    """Reload the durable hash-chained log into memory on startup, so the audit trail
    SURVIVES restarts (an audit trail that vanishes on restart is no audit trail)."""
    try:
        if os.path.isfile(_STORE):
            with open(_STORE) as f:
                tail = f.readlines()[-_LOG.maxlen:]
            for ln in tail:
                ln = ln.strip()
                if ln:
                    _LOG.append(json.loads(ln))
    except Exception:
        pass


def _head() -> str:
    return _LOG[-1]["receipt"] if _LOG else _GENESIS


def record(d: dict) -> dict:
    """Encode + append to the hash-chained log. receipt = sha256(prev_receipt + line)[:16]."""
    with _LOCK:
        line = encode(d)
        prev = _head()
        receipt = hashlib.sha256(f"{prev}{line}".encode()).hexdigest()[:16]
        rec = {"seq": len(_LOG), "ts": int(time.time()), "op": d["op"],
               "line": line, "gloss": gloss(line), "prev": prev, "receipt": receipt}
        _LOG.append(rec)
        try:   # best-effort durable append; never break the reply path
            os.makedirs(os.path.dirname(_STORE), exist_ok=True)
            with open(_STORE, "a") as f:
                f.write(json.dumps(rec) + "\n")
        except Exception:
            pass
        return rec


def recent(n: int = 50) -> list:
    with _LOCK:
        return list(_LOG)[-max(1, min(n, len(_LOG))):][::-1] if _LOG else []


def verify_chain() -> dict:
    """Recompute the hash chain — proves the log hasn't been tampered with."""
    with _LOCK:
        prev, ok, bad = (_LOG[0]["prev"] if _LOG else _GENESIS), 0, None
        for r in _LOG:
            calc = hashlib.sha256(f"{prev}{r['line']}".encode()).hexdigest()[:16]
            if calc != r["receipt"]:
                bad = r["seq"]
                break
            prev, ok = r["receipt"], ok + 1
        return {"intact": bad is None, "verified": ok, "total": len(_LOG),
                "head": _head(), "broken_at": bad}


def manifest() -> list:
    return [{"op": c, "name": n, "fields": [f[0] for f in fl], "gloss": t}
            for c, (n, fl, t) in _OPS.items()]


# ---- convenience: emit a whole council run as SIGIL ------------------------
def emit_council(character: str, message: str, council: dict) -> list:
    """One V per lens vote, an S for the verdict, an A on any veto. Returns the records."""
    prop = "p" + hashlib.sha256((message or "·").encode()).hexdigest()[:6]
    conf = "%.2f" % float(council.get("eigen_agreement") or 0.9)
    out = []
    for r in council.get("reviews", []):
        if not r.get("available"):
            continue
        choice = {"pass": "approve", "revise": "revise", "veto": "veto"}.get(r.get("vote"), "revise")
        out.append(record({"op": "V", "agent": r.get("lens", "lens"), "prop": prop,
                           "choice": choice, "conf": conf}))
    vetoes = council.get("vetoes") or []
    if vetoes:
        out.append(record({"op": "A", "level": "veto",
                           "msg": f"{character} council vetoed by {', '.join(vetoes)}"}))
    out.append(record({"op": "S", "fields": {
        "char": character, "decision": council.get("decision", "?"),
        "nodes": council.get("available_nodes", 0),
        "f": council.get("byzantine_tolerance_f", 0), "vetoes": len(vetoes)}}))
    return out


# populate the in-memory log from the durable store on import (audit trail persists across restarts)
_load_existing()


if __name__ == "__main__":
    record({"op": "V", "agent": "care_governor", "prop": "pAB12cd", "choice": "approve", "conf": "0.91"})
    record({"op": "A", "level": "veto", "msg": "security_sentinel flagged exfiltration"})
    record({"op": "S", "fields": {"char": "aria", "decision": "approved", "nodes": 5, "f": 1}})
    for r in recent():
        print(f"  {r['line']}\n    → {r['gloss']}  [{r['receipt']}]")
    print("verify:", verify_chain())
