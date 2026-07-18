"""
SIGIL registry — the mechanism that makes the language EXTENSIBLE and EMERGENT.

An OpSpec declares one opcode: its fields, how each field encodes/decodes, and how
to render it in English. Built-in opcodes are registered at import. Agents can call
register() at runtime to MINT NEW OPCODES — the language grows, and gloss() keeps
every new construct human-readable. A registry can be exported to JSON and reloaded,
so an evolved language persists across sessions.

Field kinds:
  "s"       plain string
  "int"     integer (round-tripped as str, validated)
  "float"   float   (round-tripped as str, validated)
  "list"    comma-joined list  -> Python list
  "choice"  +/-/~  <->  APPROVE/REJECT/ABSTAIN
  "kv*"     variadic trailing key:value pairs -> dict  (only as the LAST field)
"""

from dataclasses import dataclass, field
from typing import Callable, List, Tuple
import json

_CHOICE = {"+": "APPROVE", "-": "REJECT", "~": "ABSTAIN"}
_CHOICE_INV = {v: k for k, v in _CHOICE.items()}


@dataclass
class OpSpec:
    code: str                                   # single char, e.g. "V"
    name: str                                   # human name, e.g. "vote"
    fields: List[Tuple[str, str]]               # [(field_name, kind), ...]
    gloss_template: str                         # e.g. "Agent {agent} votes {choice} on {prop}."
    origin: str = "builtin"                     # "builtin" or the agent id that minted it

    # ---- field-level codecs -------------------------------------------------
    @staticmethod
    def _enc_field(kind: str, value):
        if kind == "list":
            return ",".join(str(x) for x in value)
        if kind == "choice":
            return _CHOICE_INV.get(value, value)
        return str(value)

    @staticmethod
    def _dec_field(kind: str, raw: str):
        # NOTE: int/float are kept as their ORIGINAL STRING on the wire so that
        # encode(parse(x)) == x holds UNCONDITIONALLY (losslessness is the headline
        # guarantee). "182" must not become 182.0 and re-encode as "182.0". They are
        # validated as numeric here but returned as the exact string; consumers coerce
        # on demand (int(d["k"]) / float(d["conf"])).
        if kind == "list":
            return raw.split(",") if raw else []
        if kind == "choice":
            return _CHOICE.get(raw, raw)
        if kind == "int":
            int(raw)            # validate, but keep the exact string (lossless)
            return raw
        if kind == "float":
            float(raw)          # validate, but keep the exact string (lossless)
            return raw
        return raw

    def encode(self, d: dict) -> str:
        parts = [self.code]
        for fname, kind in self.fields:
            if kind == "kv*":
                kv = d[fname]
                parts.extend(f"{k}:{v}" for k, v in kv.items())
            else:
                parts.append(self._enc_field(kind, d[fname]))
        return "|".join(parts)

    def parse(self, args: List[str]) -> dict:
        out = {"op": self.code}
        i = 0
        for fname, kind in self.fields:
            if kind == "kv*":
                out[fname] = dict(seg.split(":", 1) for seg in args[i:])
                i = len(args)
            else:
                out[fname] = self._dec_field(kind, args[i])
                i += 1
        return out

    def gloss(self, parsed: dict) -> str:
        view = {}
        for fname, kind in self.fields:
            v = parsed[fname]
            if kind == "list":
                view[fname] = ", ".join(str(x) for x in v)
            elif kind == "kv*":
                view[fname] = ", ".join(f"{k}={val}" for k, val in v.items())
            else:
                view[fname] = v
        try:
            return self.gloss_template.format(**view)
        except (KeyError, IndexError):
            return f"{self.name}: {view}"


class Registry:
    def __init__(self):
        self._ops = {}

    def register(self, spec: OpSpec, overwrite: bool = False) -> OpSpec:
        if spec.code in self._ops and not overwrite:
            raise ValueError(
                f"opcode {spec.code!r} already registered (by {self._ops[spec.code].origin}). "
                f"Pass overwrite=True to replace."
            )
        if len(spec.code) != 1:
            raise ValueError("opcode must be exactly one character")
        self._ops[spec.code] = spec
        return spec

    def has(self, code: str) -> bool:
        return code in self._ops

    def encode(self, d: dict) -> str:
        code = d["op"]
        if code not in self._ops:
            raise ValueError(f"unknown opcode {code!r}")
        return self._ops[code].encode(d)

    def parse(self, line: str) -> dict:
        parts = line.strip().split("|")
        code = parts[0]
        if code not in self._ops:
            raise ValueError(f"unknown opcode {code!r}")
        return self._ops[code].parse(parts[1:])

    def gloss(self, line: str) -> str:
        parsed = self.parse(line)
        return self._ops[parsed["op"]].gloss(parsed)

    def manifest(self) -> str:
        """Human-readable listing of the whole language as it currently stands."""
        rows = []
        for code in sorted(self._ops):
            s = self._ops[code]
            sig = "|".join([code] + [f"<{n}:{k}>" for n, k in s.fields])
            rows.append(f"  {code}  {s.name:14} {sig:52} [{s.origin}]")
        return "SIGIL opcodes:\n" + "\n".join(rows)

    def to_json(self) -> str:
        return json.dumps(
            {c: {"name": s.name, "fields": s.fields,
                 "gloss_template": s.gloss_template, "origin": s.origin}
             for c, s in self._ops.items()},
            indent=2,
        )

    def load_json(self, data: str, overwrite: bool = True):
        for code, spec in json.loads(data).items():
            self.register(OpSpec(
                code=code, name=spec["name"],
                fields=[tuple(f) for f in spec["fields"]],
                gloss_template=spec["gloss_template"],
                origin=spec.get("origin", "imported"),
            ), overwrite=overwrite)


# ---- the default registry: SIGIL v0.1 core vocabulary ----------------------

default_registry = Registry()

_CORE = [
    OpSpec("P", "propose", [("id", "s"), ("topic", "s"), ("options", "list")],
           'Proposal {id}: "{topic}" — options: {options}.'),
    OpSpec("V", "vote", [("agent", "s"), ("prop", "s"), ("choice", "choice"), ("conf", "float")],
           "Agent {agent} votes {choice} on proposal {prop} (confidence {conf})."),
    OpSpec("M", "memory", [("key", "s"), ("value", "s"), ("salience", "float")],
           'Store memory [{key}] = "{value}" (salience {salience}).'),
    OpSpec("Q", "query", [("pattern", "s"), ("k", "int")],
           'Retrieve top {k} memories matching "{pattern}".'),
    OpSpec("C", "care", [("subject", "s"), ("score", "float"), ("dims", "list")],
           "Care assessment of {subject}: {score} across {dims}."),
    OpSpec("H", "handoff", [("frm", "s"), ("to", "s"), ("task", "s")],
           "Handoff from {frm} to {to}: {task}."),
    OpSpec("S", "state", [("fields", "kv*")],
           "State — {fields}."),
    OpSpec("A", "alert", [("level", "s"), ("msg", "s")],
           "ALERT[{level}]: {msg}"),
]
for _s in _CORE:
    default_registry.register(_s)


# ---- module-level convenience over the default registry --------------------

def register(spec: OpSpec, overwrite: bool = False) -> OpSpec:
    return default_registry.register(spec, overwrite=overwrite)


def manifest() -> str:
    return default_registry.manifest()


def export_registry() -> str:
    return default_registry.to_json()


def import_registry(data: str, overwrite: bool = True):
    default_registry.load_json(data, overwrite=overwrite)
