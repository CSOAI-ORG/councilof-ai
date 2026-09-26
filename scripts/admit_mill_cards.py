#!/usr/bin/env python3
"""Mill ADMISSION: the step that makes a signed pod card publishable, or says exactly why not.

scripts/pod-loops/mill_publication_admission_gate.py holds every newly signed mill card whose
intake receipt is not ADMITTED, and intake receipts are immutable VERIFIED_QUARANTINE bytes.
Nothing produced ADMITTED, so the 2026-09-24 cohort (C-2026-0924-03) could never publish.
This is the missing producer.

Owner rule (approved 2026-09-26). A card is ADMITTED only when ALL of these hold:

  1 INTAKE      It passes land_mill_cards.py's intake gate. The unsigned card it was signed
                from is an honest unsigned mill card (land_mill_cards.reject_reason). Its one
                intake receipt sits in the evidence dir under its content address, the bundle
                digest recomputes, and land_mill_cards.runpod_receipt_reason passes: the receipt
                is VERIFIED_QUARANTINE, binds the card id, run id, items digest and
                axis/subject/n/accuracy, the current bank allowlist is the one the run was
                verified against, and that allowlist lists the bank.
  2 REPRODUCED  An INDEPENDENT second runtime reproduced the same result on the same
                instrument_sha256, model manifest digest and bank sha256. Independent means
                a different run AND a different declared runtime/host id. Same result means
                identical intake counts and accuracy AND (owner ruling 2026-09-26, "yes
                item-level") the same grade on EVERY item: totals that agree because flips
                cancel are not a reproduction. Raw-output, label or done_reason differences
                that leave every grade unchanged do not block, and are recorded. The
                reproduction must pass the same intake checks.
  3 SIGNED      It was signed by scripts/sign_mill_cards.py. Ed25519 verifies VALID under the
                DID the card names (allowed: #board-attestation-1), and the signed body is
                exactly sign_mill_cards' transform of the intake-bound unsigned card.

Anything short of that is NOT_ADMITTED, with machine-readable reason codes. Every failing
condition is reported, not only the first:
  INTAKE_FAILED, UNSIGNED, SIGNATURE_INVALID, NO_INDEPENDENT_REPRODUCTION,
  DIGEST_MISMATCH, RESULT_MISMATCH, ITEM_MISMATCH (details list the differing item_ids),
  NO_ITEM_LEVEL_EVIDENCE (per-item results absent, unbound or self-inconsistent).

Per-item evidence comes from the same side file: a declaration that binds BOTH runs (its own
run by intake_bundle_sha256, the primary in baseline_runtime.runs[] by bundle_sha256) and
carries per_item_results (the reproduction's items, hashed as per_item_results_sha256) plus
parity.per_item_cross_hardware.differing_items (both sides of every item that differs in any
field). The primary's per-item grades are the reproduction's, overridden by the declared
primary side of each differing item, and must sum to the primary's intake count; the
reproduction's must sum to its own. The reproduction's items.jsonl must sit beside its intake
receipt, hash to the bound items digest and agree with per_item_results. The primary side is
declaration-derived: only its sum is checked against the primary receipt.

Runtime provenance comes from a side file. The card body and run.json key sets are pinned by
the intake verifier (adding a runtime field is REJECT UNEXPECTED_FIELDS), so runtime/host
identity lives in a csoai.mill-runtime-declaration/0.1 file, for example the Kaggle 2xT4
slice's runtime-declaration.json. A declaration names the runtime of its own run (runtime.*,
bound by intake_bundle_sha256). It may also name baseline runs it was compared against
(baseline_runtime.runs[], each bound by bundle_sha256). A run with no declared runtime, an
UNRECORDED one, or two conflicting ones cannot be shown independent, so it fails closed.

Dry-run is the default. It prints a per-card table and JSON and writes nothing. --apply
writes one immutable csoai.mill-admission/0.1 record per ADMITTED card
(runpod-admission-<intake bundle12>.json) into --out-dir. The record embeds everything it
binds, so the publication gate can revalidate it offline (validate_admission_record). This
script never signs, never edits a card, and never touches master.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from land_mill_cards import BANK_ALLOWLIST, EVIDENCE, reject_reason, runpod_receipt_reason  # noqa: E402
from verify_card import canonical_body_bytes, verify_signed_card_with_did_doc  # noqa: E402
from verify_runpod_gspc_intake import VERIFICATION_SCHEMA, canonical_json_bytes  # noqa: E402

ADMISSION_SCHEMA = "csoai.mill-admission/0.1"
DECLARATION_SCHEMA = "csoai.mill-runtime-declaration/0.1"
RULE = ("intake + independent reproduction (same instrument/model/bank, same counts, same grade on every item) "
        "+ sign_mill_cards signature; owner-approved 2026-09-26, item-level ruling 2026-09-26")
DID_DOC = ROOT / "public" / ".well-known" / "did.json"
SIGNED_DIR = ROOT / "public" / "interop" / "mill-cards-signed"
ALLOWED_DIDS = frozenset({"did:web:csoai.org#board-attestation-1"})
# verify_runpod_gspc_intake.py pins the unsigned card's unmeasured list to exactly this value.
UNSIGNED_UNMEASURED = ["unsigned compute output; admission and verification required"]
DIGEST_FIELDS = ("instrument_sha256", "model_manifest_digest", "bank_sha256")

INTAKE_FAILED = "INTAKE_FAILED"
UNSIGNED = "UNSIGNED"
SIGNATURE_INVALID = "SIGNATURE_INVALID"
NO_INDEPENDENT_REPRODUCTION = "NO_INDEPENDENT_REPRODUCTION"
DIGEST_MISMATCH = "DIGEST_MISMATCH"
RESULT_MISMATCH = "RESULT_MISMATCH"
ITEM_MISMATCH = "ITEM_MISMATCH"
NO_ITEM_LEVEL_EVIDENCE = "NO_ITEM_LEVEL_EVIDENCE"
REASON_ORDER = (INTAKE_FAILED, UNSIGNED, SIGNATURE_INVALID, NO_INDEPENDENT_REPRODUCTION,
                DIGEST_MISMATCH, RESULT_MISMATCH, ITEM_MISMATCH, NO_ITEM_LEVEL_EVIDENCE)
# postprocess.py's slim item row, and the per-side fields of a differing item
ITEM_FIELDS = ("sequence", "item_id", "prompt_sha256", "raw_output_sha256", "parsed_label", "grade", "done_reason")
SIDE_FIELDS = ("raw_output_sha256", "parsed_label", "grade", "done_reason")


def sha256_hex(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def base_model(subject: object) -> str:
    return str(subject or "").split("@", 1)[0]


def receipt_bundle_recomputes(receipt: dict) -> bool:
    """The intake verifier's bundle digest, recomputed from the receipt's own fields."""
    try:
        want = sha256_hex(canonical_json_bytes({
            "schema": receipt["schema"], "run_id": receipt["run_id"], "axis": receipt["axis"],
            "subject": receipt["subject"], "source_hashes": receipt["source_hashes"],
        }))
    except Exception:  # noqa: BLE001
        return False
    return receipt.get("bundle_sha256") == want


def unsigned_from_signed(wrap: dict) -> dict:
    """Invert sign_mill_cards' body transform: the unsigned wrap the intake receipt bound."""
    body = copy.deepcopy(wrap.get("body") if isinstance(wrap.get("body"), dict) else {})
    body.pop("signature_state", None)
    body["status"] = "UNMEASURED"
    body["unmeasured"] = list(UNSIGNED_UNMEASURED)
    return {"body": body, "id": sha256_hex(canonical_body_bytes(body)), "signature": None}


def sign_transform_reason(wrap: dict) -> str | None:
    """None iff the signed wrap has exactly the shape sign_mill_cards.py writes."""
    body = wrap.get("body") if isinstance(wrap.get("body"), dict) else {}
    n = body.get("n")
    if not isinstance(n, int):
        return "signed body has no integer n"
    status, unmeasured = ("MEASURED", []) if n >= 30 else ("UNMEASURED", ["n<30 unquotable"])
    if body.get("signature_state") != "SIGNED":
        return "signed body lacks signature_state SIGNED"
    if body.get("status") != status or body.get("unmeasured") != unmeasured:
        return f"signed body status/unmeasured is not sign_mill_cards' {status}/{unmeasured} for n={n}"
    if wrap.get("preimage_rule") != "sha256(canonical body)" or wrap.get("alg") != "Ed25519":
        return "wrapper is not a sign_mill_cards Ed25519 wrapper"
    if wrap.get("quotable") is not (status == "MEASURED") or wrap.get("n") != n:
        return "wrapper n/quotable disagree with the signed body"
    return None


# ---------------------------------------------------------------- runtime declarations

def runtime_id(runtime: object) -> str | None:
    """The declared runtime/host identity, or None when it is absent or unrecorded."""
    if not isinstance(runtime, dict):
        return None
    for key in ("host_id", "runtime_id", "substrate"):
        value = runtime.get(key)
        if isinstance(value, str) and value.strip():
            norm = " ".join(value.split())
            return None if norm.upper().startswith("UNRECORDED") else norm
    return None


@dataclass
class RuntimeIndex:
    """(run_id, intake bundle_sha256) -> declared runtime ids, from every declaration seen."""
    rows: dict[tuple[str, str], set[str]] = field(default_factory=dict)
    sources: dict[tuple[str, str], set[str]] = field(default_factory=dict)
    decls: list[tuple[dict, str]] = field(default_factory=list)

    def add(self, run_id: object, bundle: object, rid: str | None, source: str) -> None:
        if not isinstance(run_id, str) or not isinstance(bundle, str) or not re.fullmatch(r"[0-9a-f]{64}", bundle):
            return  # a declaration that does not bind the intake bundle proves nothing about that run
        key = (run_id, bundle)
        self.rows.setdefault(key, set())
        self.sources.setdefault(key, set()).add(source)
        self.rows[key].add(rid or "")

    def resolve(self, run_id: str, bundle: str) -> tuple[str | None, str]:
        """(runtime id, why-not). Fail closed on absent, unrecorded or conflicting declarations."""
        ids = self.rows.get((run_id, bundle))
        if not ids:
            return None, f"no runtime declaration binds run {run_id} / bundle {bundle[:12]}"
        if "" in ids:
            return None, f"runtime of run {run_id} is declared UNRECORDED or empty"
        if len({i.casefold() for i in ids}) != 1:
            return None, f"conflicting runtime declarations for run {run_id}: {sorted(ids)}"
        return next(iter(ids)), ""

    def source(self, run_id: str, bundle: str) -> list[str]:
        return sorted(self.sources.get((run_id, bundle), set()))


def index_declaration(index: RuntimeIndex, decl: dict, source: str) -> None:
    if not isinstance(decl, dict) or decl.get("schema") != DECLARATION_SCHEMA:
        return
    index.decls.append((decl, source))
    index.add(decl.get("run_id"), decl.get("intake_bundle_sha256"), runtime_id(decl.get("runtime")), source)
    base = decl.get("baseline_runtime")
    if isinstance(base, dict):
        rid = runtime_id(base)
        for run in base.get("runs") or []:
            if isinstance(run, dict):
                index.add(run.get("run_id"), run.get("bundle_sha256"), rid, source)


# ---------------------------------------------------------------- reproduction bundles

@dataclass
class Repro:
    receipt: dict
    receipt_raw: bytes
    card: dict
    where: str
    items_raw: bytes | None = None


def _read_json(path: Path) -> tuple[object, bytes]:
    if path.is_symlink() or not path.is_file():
        raise OSError(f"not a regular file: {path}")
    raw = path.read_bytes()
    return json.loads(raw), raw


def load_repro_dirs(dirs: list[Path], index: RuntimeIndex) -> tuple[list[Repro], list[str]]:
    """Collect (intake receipt, unsigned card) pairs and runtime declarations under each dir."""
    repros: list[Repro] = []
    notes: list[str] = []
    for d in dirs:
        if not d.is_dir():
            notes.append(f"repro dir absent: {d}")
            continue
        receipts: list[tuple[dict, bytes, Path]] = []
        cards: dict[str, dict] = {}
        for f in sorted(d.rglob("*.json")):
            try:
                obj, raw = _read_json(f)
            except (OSError, ValueError):
                continue
            if not isinstance(obj, dict):
                continue
            if obj.get("schema") == DECLARATION_SCHEMA:
                index_declaration(index, obj, f"{f.name}#{sha256_hex(raw)[:12]}")
            elif obj.get("schema") == VERIFICATION_SCHEMA:
                receipts.append((obj, raw, f))
            elif isinstance(obj.get("body"), dict) and obj.get("id") and not obj.get("signature"):
                cards[str(obj["id"])] = obj
        for receipt, raw, f in receipts:
            cid = str((receipt.get("source_hashes") or {}).get("card_id") or "")
            if cid in cards:
                items = f.parent / "items.jsonl"
                items_raw = items.read_bytes() if items.is_file() and not items.is_symlink() else None
                repros.append(Repro(receipt, raw, cards[cid], str(f), items_raw))
            else:
                notes.append(f"receipt {f} has no unsigned card beside it; not usable as a reproduction")
    # one receipt may be reachable through several dirs; keep one per bundle
    seen: dict[str, Repro] = {}
    for r in repros:
        seen.setdefault(str(r.receipt.get("bundle_sha256")), r)
    return list(seen.values()), notes


def load_declarations(paths: list[Path], index: RuntimeIndex) -> list[str]:
    notes = []
    for p in paths:
        try:
            obj, raw = _read_json(p)
        except (OSError, ValueError) as error:
            notes.append(f"runtime declaration unreadable {p}: {error}")
            continue
        if not isinstance(obj, dict) or obj.get("schema") != DECLARATION_SCHEMA:
            notes.append(f"{p} is not a {DECLARATION_SCHEMA}")
            continue
        index_declaration(index, obj, f"{p.name}#{sha256_hex(raw)[:12]}")
    return notes


# ---------------------------------------------------------------- the three conditions

def find_receipt(card: dict, evidence_dir: Path) -> tuple[dict | None, bytes, str, str]:
    """(receipt, raw, filename, why-not): the one intake receipt for this card's run."""
    body = card.get("body") if isinstance(card.get("body"), dict) else {}
    ce = body.get("compute_evidence") if isinstance(body.get("compute_evidence"), dict) else {}
    key = (ce.get("run_id"), body.get("axis"), body.get("model"))
    matches = []
    for f in sorted(evidence_dir.glob("runpod-verification-*.json")):
        try:
            obj, raw = _read_json(f)
        except (OSError, ValueError):
            continue
        if isinstance(obj, dict) and (obj.get("run_id"), obj.get("axis"), obj.get("subject")) == key:
            matches.append((obj, raw, f.name))
    if len(matches) != 1:
        return None, b"", "", f"expected one intake receipt for run {key[0]}, found {len(matches)}"
    return matches[0][0], matches[0][1], matches[0][2], ""


def intake_reasons(unsigned: dict, receipt: dict, raw: bytes, name: str | None,
                   bank_allowlist: Path) -> list[str]:
    """Condition 1 for one (unsigned card, receipt) pair. Empty list = passes."""
    out = []
    why = reject_reason(unsigned)
    if why:
        out.append(f"unsigned card fails the landing gate: {why}")
    why = runpod_receipt_reason(unsigned, raw, bank_allowlist)
    if why:
        out.append(f"intake receipt fails the landing gate: {why}")
    bundle = str(receipt.get("bundle_sha256") or "")
    if not re.fullmatch(r"[0-9a-f]{64}", bundle) or not receipt_bundle_recomputes(receipt):
        out.append("intake receipt bundle_sha256 does not recompute")
    elif name is not None and name != f"runpod-verification-{bundle[:12]}.json":
        out.append(f"intake receipt {name} is not stored under its content address")
    return out


def signature_reasons(card: dict, did_doc: dict | None) -> list[tuple[str, str]]:
    """Condition 3. Empty list = signed by sign_mill_cards.py and VALID."""
    if not card.get("signature"):
        return [(UNSIGNED, "card carries no signature")]
    out = []
    why = sign_transform_reason(card)
    if why:
        out.append((SIGNATURE_INVALID, why))
    if card.get("did") not in ALLOWED_DIDS:
        out.append((SIGNATURE_INVALID, f"signing DID {card.get('did')!r} is not the sign_mill_cards board DID"))
    if did_doc is None:
        out.append((SIGNATURE_INVALID, "DID document unavailable; the signature cannot be checked"))
    else:
        state, detail = verify_signed_card_with_did_doc(
            json.dumps(card, ensure_ascii=False).encode("utf-8"), did_doc)
        if state != "VALID":
            out.append((SIGNATURE_INVALID, f"{state}: {detail}"))
    return out


def digest_reasons(card: dict, repro: Repro) -> list[tuple[str, str]]:
    """Same instrument_sha256, model manifest digest and bank sha256, or DIGEST_MISMATCH."""
    ce = card["body"].get("compute_evidence") or {}
    rbody = repro.card.get("body") if isinstance(repro.card.get("body"), dict) else {}
    rce = rbody.get("compute_evidence") if isinstance(rbody.get("compute_evidence"), dict) else {}
    differs = [f for f in DIGEST_FIELDS if not ce.get(f) or rce.get(f) != ce.get(f)]
    if not differs:
        return []
    return [(DIGEST_MISMATCH, "reproduction differs on " + ", ".join(
        f"{f} ({str(ce.get(f))[:19]} vs {str(rce.get(f))[:19]})" for f in differs))]


def result_reasons(receipt: dict, repro: Repro) -> list[tuple[str, str]]:
    """Identical intake counts and accuracy, or RESULT_MISMATCH."""
    if repro.receipt.get("counts") == receipt.get("counts") and repro.receipt.get("accuracy") == receipt.get("accuracy"):
        return []
    rc, pc = repro.receipt.get("counts") or {}, receipt.get("counts") or {}
    return [(RESULT_MISMATCH, f"reproduction {rc.get('correct')}/{rc.get('graded_n')} acc {repro.receipt.get('accuracy')}"
             f" vs card {pc.get('correct')}/{pc.get('graded_n')} acc {receipt.get('accuracy')}")]


def independence_reasons(card: dict, receipt: dict, repro: Repro, index: RuntimeIndex) -> list[tuple[str, str]]:
    """A different run on a different declared runtime/host id, or NO_INDEPENDENT_REPRODUCTION."""
    run = str((card["body"].get("compute_evidence") or {}).get("run_id") or "")
    rrun = str(repro.receipt.get("run_id") or "")
    if run == rrun:
        return [(NO_INDEPENDENT_REPRODUCTION, "the reproduction is the same run")]
    out = []
    pid, pwhy = index.resolve(run, str(receipt.get("bundle_sha256") or ""))
    rid, rwhy = index.resolve(rrun, str(repro.receipt.get("bundle_sha256") or ""))
    if pid is None:
        out.append((NO_INDEPENDENT_REPRODUCTION, f"primary runtime unproven: {pwhy}"))
    if rid is None:
        out.append((NO_INDEPENDENT_REPRODUCTION, f"reproduction runtime unproven: {rwhy}"))
    if pid is not None and rid is not None and pid.casefold() == rid.casefold():
        out.append((NO_INDEPENDENT_REPRODUCTION, f"same runtime/host id on both runs: {pid!r}"))
    return out


def per_item_sha256(per_item: list) -> str:
    """postprocess.py's per_item_results_sha256."""
    return sha256_hex(json.dumps(per_item, sort_keys=True, separators=(",", ":")).encode())


def compare_items(ev: dict, primary_receipt: dict, repro_receipt: dict, repro_items_raw: bytes | None = None,
                  require_items: bool = True) -> tuple[list[tuple[str, str]], dict | None]:
    """Pure per-item comparison. ev = {per_item_results, per_item_results_sha256, per_item_cross_hardware}.

    Returns (reasons, parity). NO_ITEM_LEVEL_EVIDENCE when the evidence is absent, unbound or
    contradicts either intake receipt; ITEM_MISMATCH listing every item whose grade differs.
    At admission the reproduction's intake-bound items.jsonl is REQUIRED, so per_item_results
    are checked against bytes the intake receipt pins. validate_admission_record passes
    require_items=False: offline it can recheck consistency with both receipts, but a
    consistent re-grade of per_item_results is caught only here, where items.jsonl is present.
    """
    def missing(why: str) -> tuple[list[tuple[str, str]], None]:
        return [(NO_ITEM_LEVEL_EVIDENCE, why)], None

    per = ev.get("per_item_results") if isinstance(ev, dict) else None
    block = ev.get("per_item_cross_hardware") if isinstance(ev, dict) else None
    if not isinstance(per, list) or not per:
        return missing("reproduction per-item results absent")
    if not isinstance(block, dict) or not isinstance(block.get("differing_items"), list):
        return missing("primary per-item results absent (no parity.per_item_cross_hardware.differing_items)")
    if per_item_sha256(per) != ev.get("per_item_results_sha256"):
        return missing("per_item_results do not hash to per_item_results_sha256")
    rside: dict[str, dict] = {}
    for row in per:
        if not isinstance(row, dict) or not isinstance(row.get("item_id"), str) \
                or not isinstance(row.get("grade"), bool) or row["item_id"] in rside:
            return missing("reproduction per-item results malformed or duplicate item_id")
        rside[row["item_id"]] = {f: row.get(f) for f in SIDE_FIELDS}
    if repro_items_raw is None and require_items:
        return missing("reproduction items.jsonl absent beside its intake receipt; per-item grades unbound")
    if repro_items_raw is not None:
        try:
            rows = [json.loads(line) for line in repro_items_raw.decode("utf-8").splitlines() if line.strip()]
        except ValueError:
            return missing("reproduction items.jsonl unreadable")
        if sha256_hex(repro_items_raw) != ((repro_receipt.get("source_hashes") or {}).get("items_sha256")):
            return missing("items.jsonl beside the reproduction receipt is not the intake-bound items")
        if [{k: r.get(k) for k in ITEM_FIELDS} for r in rows] != per:
            return missing("per_item_results differ from the reproduction's intake-bound items.jsonl")
    pside: dict[str, dict | None] = dict(rside)
    for d in block["differing_items"]:
        iid = d.get("item_id") if isinstance(d, dict) else None
        if iid not in rside:
            return missing(f"differing item {iid!r} is not a reproduction item")
        sides = {k: v for k, v in d.items() if k not in ("item_id", "sequence")}
        rkeys = [k for k, v in sides.items() if isinstance(v, dict) and {f: v.get(f) for f in SIDE_FIELDS} == rside[iid]]
        if len(sides) != 2 or len(rkeys) != 1:
            return missing(f"differing item {iid} does not carry exactly one reproduction side and one primary side")
        pv = sides[next(k for k in sides if k != rkeys[0])]
        if pv is not None and (not isinstance(pv, dict) or not isinstance(pv.get("grade"), bool)):
            return missing(f"primary side of differing item {iid} has no boolean grade")
        pside[iid] = None if pv is None else {f: pv.get(f) for f in SIDE_FIELDS}
    n = len(per)
    pc, rc = primary_receipt.get("counts") or {}, repro_receipt.get("counts") or {}
    if block.get("n_items") != n or pc.get("attempted") != n or rc.get("attempted") != n:
        return missing(f"{n} per-item results vs n_items {block.get('n_items')}, attempted "
                       f"{pc.get('attempted')}/{rc.get('attempted')}")
    if sum(v["grade"] for v in rside.values()) != rc.get("correct"):
        return missing("reproduction per-item grades do not sum to its intake count")
    if sum(bool(v and v["grade"]) for v in pside.values()) != pc.get("correct"):
        return missing("declared primary per-item grades do not sum to the primary intake count")
    grade_diff = sorted(i for i in rside if pside[i] is None or pside[i]["grade"] != rside[i]["grade"])
    if block.get("grade_equal") is not None and block.get("grade_equal") != n - len(grade_diff):
        return missing("declared grade_equal disagrees with its own differing_items")
    other = [{"item_id": i, "fields": [f for f in SIDE_FIELDS if f != "grade" and pside[i][f] != rside[i][f]]}
             for i in sorted(rside) if i not in grade_diff and pside[i] != rside[i]]
    parity = {"n_items": n, "grade_equal": n - len(grade_diff), "grade_differs": grade_diff,
              "non_grade_differs": other,
              "primary_items_from": "declared differing_items over the reproduction's per_item_results"}
    if grade_diff:
        return [(ITEM_MISMATCH, f"grade differs on {len(grade_diff)} of {n} items: {', '.join(grade_diff)}")], parity
    return [], parity


def item_evidence(decl: dict) -> dict:
    return {"per_item_results": decl.get("per_item_results"),
            "per_item_results_sha256": decl.get("per_item_results_sha256"),
            "per_item_cross_hardware": (decl.get("parity") or {}).get("per_item_cross_hardware")
            if isinstance(decl.get("parity"), dict) else None}


def item_parity(card: dict, receipt: dict, repro: Repro, index: RuntimeIndex
                ) -> tuple[list[tuple[str, str]], dict | None, dict | None]:
    """(reasons, parity, evidence) from every declaration that binds BOTH runs. Fail closed."""
    run = str((card["body"].get("compute_evidence") or {}).get("run_id") or "")
    bundle = str(receipt.get("bundle_sha256") or "")
    rrun, rbundle = repro.receipt.get("run_id"), repro.receipt.get("bundle_sha256")
    decls = []
    for decl, src in index.decls:
        runs = (decl.get("baseline_runtime") or {}).get("runs") if isinstance(decl.get("baseline_runtime"), dict) else None
        if decl.get("run_id") == rrun and decl.get("intake_bundle_sha256") == rbundle and any(
                isinstance(r, dict) and r.get("run_id") == run and r.get("bundle_sha256") == bundle for r in runs or []):
            decls.append((decl, src))
    if not decls:
        return [(NO_ITEM_LEVEL_EVIDENCE, f"no runtime declaration binds both run {run} and reproduction {rrun} "
                 "with per-item results")], None, None
    outcomes = []
    for decl, src in decls:
        ev = item_evidence(decl)
        reasons, parity = compare_items(ev, receipt, repro.receipt, repro.items_raw)
        outcomes.append((reasons, parity, {**ev, "declared_by": src}))
    if len({json.dumps(o[1], sort_keys=True) for o in outcomes}) != 1:
        return [(NO_ITEM_LEVEL_EVIDENCE, "declarations binding these runs disagree item by item")], None, None
    return outcomes[0]


def item_reasons(card: dict, receipt: dict, repro: Repro, index: RuntimeIndex) -> list[tuple[str, str]]:
    """Per-item grade equality between the two runtimes (ITEM_MISMATCH / NO_ITEM_LEVEL_EVIDENCE)."""
    return item_parity(card, receipt, repro, index)[0]


def reproduction_reasons(card: dict, receipt: dict, repro: Repro, index: RuntimeIndex,
                         bank_allowlist: Path) -> list[tuple[str, str]]:
    """Condition 2 against one candidate reproduction. Empty list = independent and equal."""
    out: list[tuple[str, str]] = []
    bad = intake_reasons(repro.card, repro.receipt, repro.receipt_raw, None, bank_allowlist)
    if bad:
        out.append((NO_INDEPENDENT_REPRODUCTION, f"reproduction {repro.receipt.get('run_id')} fails intake: {bad[0]}"))
    out += digest_reasons(card, repro)
    out += result_reasons(receipt, repro)
    out += item_reasons(card, receipt, repro, index)
    out += independence_reasons(card, receipt, repro, index)
    return out


# ---------------------------------------------------------------- decision + record

def decide(card_path: Path, evidence_dir: Path, repros: list[Repro], index: RuntimeIndex,
           did_doc: dict | None, bank_allowlist: Path) -> dict:
    try:
        card, card_raw = _read_json(card_path)
    except (OSError, ValueError) as error:
        return {"card_file": card_path.name, "state": "NOT_ADMITTED", "reasons": [INTAKE_FAILED],
                "details": [{"code": INTAKE_FAILED, "detail": f"card unreadable: {error}"}]}
    body = card.get("body") if isinstance(card, dict) and isinstance(card.get("body"), dict) else {}
    ce = body.get("compute_evidence") if isinstance(body.get("compute_evidence"), dict) else {}
    out = {"card_file": card_path.name, "card_id": card.get("id") if isinstance(card, dict) else None,
           "model": body.get("model"), "axis": body.get("axis"), "n": body.get("n"),
           "run_id": ce.get("run_id")}
    details: list[tuple[str, str]] = []

    receipt, raw, rname = None, b"", ""
    if not ce.get("run_id"):
        details.append((INTAKE_FAILED, "not a pod (compute_evidence) card; this admission covers the RunPod intake road"))
    else:
        receipt, raw, rname, why = find_receipt(card, evidence_dir)
        if receipt is None:
            details.append((INTAKE_FAILED, why))
        else:
            unsigned = unsigned_from_signed(card)
            for why in intake_reasons(unsigned, receipt, raw, rname, bank_allowlist):
                details.append((INTAKE_FAILED, why))
    details += signature_reasons(card, did_doc)

    chosen: Repro | None = None
    if receipt is None:
        details.append((NO_INDEPENDENT_REPRODUCTION, "no intake receipt to compare a reproduction against"))
    else:
        cands = [r for r in repros if r.receipt.get("axis") == body.get("axis")
                 and base_model(r.receipt.get("subject")) == base_model(body.get("model"))]
        if not cands:
            details.append((NO_INDEPENDENT_REPRODUCTION,
                            f"no reproduction of ({base_model(body.get('model'))}, {body.get('axis')}) on any other runtime"))
        else:
            per = [(r, reproduction_reasons(card, receipt, r, index, bank_allowlist)) for r in cands]
            ok = [r for r, why in per if not why]
            shown = ok[0] if ok else cands[0]
            parity = item_parity(card, receipt, shown, index)[1]
            if parity is not None:
                out["item_parity"] = {"reproduction_run_id": shown.receipt.get("run_id"), **parity}
            if ok:
                chosen = ok[0]
            else:
                for _, why in per:
                    details += why

    codes = sorted({c for c, _ in details}, key=REASON_ORDER.index)
    out["state"] = "NOT_ADMITTED" if codes else "ADMITTED"
    out["reasons"] = codes
    out["details"] = [{"code": c, "detail": d} for c, d in details]
    if not codes and chosen is not None and receipt is not None:
        out["record"] = admission_record(card, card_path.name, receipt, raw, rname, chosen, index)
    return out


def admission_record(card: dict, card_file: str, receipt: dict, raw: bytes, rname: str,
                     repro: Repro, index: RuntimeIndex) -> dict:
    body = card["body"]
    ce = body["compute_evidence"]
    bundle, rbundle = receipt["bundle_sha256"], repro.receipt["bundle_sha256"]
    pid, _ = index.resolve(ce["run_id"], bundle)
    rid, _ = index.resolve(repro.receipt["run_id"], rbundle)
    _, parity, evidence = item_parity(card, receipt, repro, index)
    return {
        "schema": ADMISSION_SCHEMA,
        "state": "ADMITTED",
        "authority": {"admitted": True, "by": "scripts/admit_mill_cards.py", "rule": RULE},
        "card": {"id": card["id"], "file": card_file, "did": card.get("did"), "axis": body["axis"],
                 "subject": body["model"], "run_id": ce["run_id"], "n": body["n"], "accuracy": body.get("accuracy")},
        "intake": {"receipt_file": rname, "bundle_sha256": bundle, "receipt_sha256": sha256_hex(raw)},
        "primary_runtime": {"runtime_id": pid, "declared_by": index.source(ce["run_id"], bundle)},
        "reproduction": {
            "run_id": repro.receipt["run_id"],
            "runtime_id": rid,
            "declared_by": index.source(repro.receipt["run_id"], rbundle),
            "receipt": repro.receipt,
            "card_body": repro.card["body"],
        },
        "matched": {**{f: ce[f] for f in DIGEST_FIELDS}, "counts": receipt["counts"], "accuracy": receipt["accuracy"]},
        "item_parity": parity,
        "item_evidence": evidence,
        "admitted_at": now_iso(),
    }


def validate_admission_record(record: dict, card: dict, receipt: dict, did_doc: dict | None) -> list[str]:
    """Offline re-check of an admission record against the signed card and its intake receipt.

    Used by mill_publication_admission_gate.py. Every binding is recomputed from the bytes
    at hand; the record's own ADMITTED is never taken on trust.
    """
    errs: list[str] = []
    try:
        body = card["body"]
        ce = body["compute_evidence"]
        rc = record["card"]
        rep = record["reproduction"]
        rrec = rep["receipt"]
        rbody = rep["card_body"]
        rce = rbody["compute_evidence"]
        matched = record["matched"]
    except (KeyError, TypeError) as error:
        return [f"admission record malformed: missing {error}"]
    if record.get("schema") != ADMISSION_SCHEMA or record.get("state") != "ADMITTED" \
            or (record.get("authority") or {}).get("admitted") is not True:
        errs.append("admission record is not an ADMITTED csoai.mill-admission/0.1 record")
    if rc.get("id") != card.get("id") or (rc.get("axis"), rc.get("subject"), rc.get("run_id")) != (
            body.get("axis"), body.get("model"), ce.get("run_id")):
        errs.append("admission record does not bind this card")
    if (record.get("intake") or {}).get("bundle_sha256") != receipt.get("bundle_sha256") \
            or receipt.get("state") != "VERIFIED_QUARANTINE" or not receipt_bundle_recomputes(receipt):
        errs.append("admission record does not bind a valid intake receipt")
    if (receipt.get("source_hashes") or {}).get("card_id") != unsigned_from_signed(card)["id"]:
        errs.append("signed card is not the sign_mill_cards transform of the intake-bound card")
    errs += [f"{code}: {why}" for code, why in signature_reasons(card, did_doc)]
    pid = str((record.get("primary_runtime") or {}).get("runtime_id") or "")
    rid = str(rep.get("runtime_id") or "")
    if not pid or not rid or pid.casefold() == rid.casefold() or rep.get("run_id") == ce.get("run_id"):
        errs.append("reproduction is not on an independent runtime/run")
    if rrec.get("run_id") != rep.get("run_id") or rrec.get("state") != "VERIFIED_QUARANTINE" \
            or not receipt_bundle_recomputes(rrec) \
            or (rrec.get("source_hashes") or {}).get("card_id") != sha256_hex(canonical_body_bytes(rbody)):
        errs.append("reproduction receipt does not bind its card")
    if any(not ce.get(f) or rce.get(f) != ce.get(f) or matched.get(f) != ce.get(f) for f in DIGEST_FIELDS):
        errs.append("reproduction instrument/model/bank digests differ from the card")
    if (rrec.get("counts"), rrec.get("accuracy")) != (receipt.get("counts"), receipt.get("accuracy")) \
            or (matched.get("counts"), matched.get("accuracy")) != (receipt.get("counts"), receipt.get("accuracy")):
        errs.append("reproduction result differs from the card's intake result")
    reasons, parity = compare_items(record.get("item_evidence") or {}, receipt, rrec, require_items=False)
    if reasons or parity is None or parity != record.get("item_parity"):
        errs.append("item-level evidence does not show the same grade on every item: "
                    + "; ".join(f"{c}: {d}" for c, d in reasons) if reasons else
                    "item-level evidence does not reproduce the recorded item parity")
    return errs


# ---------------------------------------------------------------- CLI

def collect_cards(args_cards: list[str]) -> list[Path]:
    out: list[Path] = []
    for a in args_cards:
        p = Path(a)
        if p.is_dir():
            out += sorted(p.glob("signed-*.json"))
        else:
            out.append(p)
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--cards", nargs="+", required=True, help="signed card files or dirs of signed-*.json")
    ap.add_argument("--evidence-dir", type=Path, default=EVIDENCE, help="where intake receipts live")
    ap.add_argument("--repro-dir", type=Path, action="append", default=[],
                    help="dir holding a reproduction's intake receipt, its unsigned card and runtime declaration(s)")
    ap.add_argument("--runtime-declaration", type=Path, action="append", default=[],
                    help="extra csoai.mill-runtime-declaration/0.1 side files")
    ap.add_argument("--did-doc", type=Path, default=DID_DOC)
    ap.add_argument("--bank-allowlist", type=Path, default=BANK_ALLOWLIST)
    ap.add_argument("--apply", action="store_true", help="write admission records (default: dry-run, writes nothing)")
    ap.add_argument("--out-dir", type=Path, help="with --apply: where runpod-admission-*.json records go")
    ap.add_argument("--json", action="store_true", help="print the full decisions as JSON")
    args = ap.parse_args(argv)
    if args.apply and args.out_dir is None:
        ap.error("--apply requires an explicit --out-dir")

    index = RuntimeIndex()
    notes = load_declarations(args.runtime_declaration, index)
    repros, more = load_repro_dirs(args.repro_dir, index)
    notes += more
    try:
        did_doc, _ = _read_json(args.did_doc)
    except (OSError, ValueError) as error:
        did_doc = None
        notes.append(f"DID document unreadable ({error}); every card fails SIGNATURE_INVALID")
    decisions = [decide(p, args.evidence_dir, repros, index, did_doc, args.bank_allowlist)
                 for p in collect_cards(args.cards)]

    written = []
    if args.apply:
        from verify_hub_mill_evidence import EvidenceError, write_immutable  # noqa: E402
        args.out_dir.mkdir(parents=True, exist_ok=True)
        for d in decisions:
            rec = d.get("record")
            if not rec:
                continue
            dest = args.out_dir / f"runpod-admission-{rec['intake']['bundle_sha256'][:12]}.json"
            if dest.is_file():
                written.append(f"exists {dest.name}")
                continue
            try:
                write_immutable(dest, (json.dumps(rec, indent=2, sort_keys=True) + "\n").encode("utf-8"))
                written.append(str(dest))
            except (EvidenceError, OSError) as error:
                print(f"HOLD {dest.name}: {error}", file=sys.stderr)
                return 1

    for d in decisions:
        why = ",".join(d["reasons"]) or "-"
        print(f"{d['state']:<13} {d['card_file']:<36} {str(d.get('model') or '')[:34]:<34} "
              f"{str(d.get('axis') or ''):<20} n={d.get('n')} {why}")
    admitted = sum(d["state"] == "ADMITTED" for d in decisions)
    print(f"mill-admission {'APPLY' if args.apply else 'DRY-RUN'} cards={len(decisions)} admitted={admitted} "
          f"not_admitted={len(decisions) - admitted} reproductions={len(repros)} written={len(written)}")
    for n in notes:
        print("NOTE", n)
    if args.json:
        print(json.dumps({"schema": "csoai.mill-admission-report/0.1", "dry_run": not args.apply,
                          "rule": RULE, "decisions": decisions, "notes": notes, "written": written},
                         indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
