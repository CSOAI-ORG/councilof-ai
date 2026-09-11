#!/usr/bin/env python3
"""agent_cards_build.py — generate the 13 A2A analyst agent cards from ONE roster.

WHY THIS FILE EXISTS (2026-09-11, TUI-4 V2 / J1)
------------------------------------------------
The estate publishes one org-level A2A card (public/.well-known/agent-card.json).
The 12-Generals design (scripts/badger/csoai-bft-council.py) names 12 analyst
personas plus a 33-seat council, and external A2A discovery rewards one card per
discoverable agent. The temptation is to hand-write 13 cards. Hand-written
copies drift: a number typed here stops matching /api/gspc, a purpose reworded
here stops matching the BFT registry, an endpoint named here may not exist.
Every one of those is the estate's own defect class — a typed claim an API can
derive. So this generator exists:

  * ONE authored source: scripts/agent_cards/roster.json (names, roles,
    purposes verbatim from the BFT registry; axis mapping; skill selection).
  * Everything else is COPIED VERBATIM from live sources at build time:
    provider/supportedInterfaces/capabilities.extensions/skills bodies from the
    org card; axis ids parsed out of functions/api/_gspc_axes_*.ts (never typed
    here); general name/role/purpose re-verified against the imported BFT
    registry in --check.
  * Every card states its real status out loud: DESIGN_ONLY persona fronting
    the SAME shared substrate at https://councilof.ai/api/a2a. There is no
    per-analyst isolated service and none is claimed. The measured artifacts
    are the signed GSPC cards; the persona is a discovery surface, not a
    service boundary.

SIGNING LAW. Nothing here is signed. Every card carries "sig_ed25519": null
and an explicit signature_state note. Signatures are attached only by the GHA
publisher (one-writer law); a future signed copy verifies against
did:web:csoai.org#board-attestation-1.

COLLISION LAW. scripts/agent-card-extensions.mjs rewrites ONLY
public/.well-known/agent-card.json and agent.json. These cards live in the
agent-cards/ SUBDIRECTORY precisely so that producer never touches them.

Usage:
  python3 scripts/agent_cards_build.py           # generate
  python3 scripts/agent_cards_build.py --check   # validate; exit non-zero on failure

--check is fail-closed and three-state in spirit: every file either validates
or the run fails; there is no "warn" lane that lets a bad card ship.
"""

from __future__ import annotations

import copy
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROSTER_PATH = ROOT / "scripts/agent_cards/roster.json"
ORG_CARD_PATH = ROOT / "public/.well-known/agent-card.json"
OUT_DIR = ROOT / "public/.well-known/agent-cards"
AXIS_SOURCES = [
    ROOT / "functions/api/_gspc_axes_a.ts",
    ROOT / "functions/api/_gspc_axes_b.ts",
    ROOT / "functions/api/_gspc_axes_fin.ts",
]
BFT_REGISTRY = ROOT / "scripts/badger/csoai-bft-council.py"

BASE_URL = "https://councilof.ai"
CARD_VERSION = "0.1.0"
INDEX_SCHEMA = "csoai.agent-cards-index/0.1"

STATUS_LINE = (
    "STATUS: DESIGN_ONLY analyst persona fronting the shared measured substrate "
    "at the single interface below — there is no per-analyst isolated service "
    "and none is claimed. The measured artifacts are the signed GSPC cards at "
    "GET /api/gspc and /signed/card_index.json; this persona is a discovery "
    "surface, not a service boundary. Measurement, never certification."
)

ANALYST_STATUS = (
    "DESIGN_ONLY persona fronting the shared measured substrate — the measured "
    "artifacts are the signed GSPC cards; per-analyst isolated service is "
    "NOT_CLAIMED and NOT_MEASURED"
)
MAPPING_NOTE = "axis mapping is indicative; the board at /api/gspc is authority"
SIGNATURE_STATE = (
    "UNSIGNED — signatures are attached only by the GHA publisher (one-writer "
    "law); verify any future signed copy against "
    "did:web:csoai.org#board-attestation-1"
)

REQUIRED_CARD_FIELDS = [
    "name", "description", "version", "provider", "supportedInterfaces",
    "capabilities", "defaultInputModes", "defaultOutputModes", "skills",
    "explicitly_not", "x-csoai-analyst", "sig_ed25519", "signature_state",
]


class CheckFailure(Exception):
    """Any validation failure. Fail-closed: one failure fails the run."""


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise CheckFailure(f"{path}: cannot parse JSON: {exc}") from exc


def board_axis_ids() -> set[str]:
    """Parse axis ids out of the TS board sources — derived, never typed here."""
    ids: set[str] = set()
    for src in AXIS_SOURCES:
        text = src.read_text()
        ids.update(re.findall(r'axis:\s*"([^"]+)"', text))
    if not ids:
        raise CheckFailure("no axis ids parsed from functions/api/_gspc_axes_*.ts")
    return ids


def bft_generals() -> dict[str, dict]:
    """Import the BFT registry (module-level constants only; main is guarded)."""
    spec = importlib.util.spec_from_file_location("csoai_bft_council", BFT_REGISTRY)
    if spec is None or spec.loader is None:
        raise CheckFailure(f"cannot load {BFT_REGISTRY}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {a["name"].lower(): a for a in mod.AGENTS if a.get("tier") == "general"}


def axis_skill(axis: str) -> dict:
    return {
        "id": f"{axis}-axis",
        "name": f"GSPC axis: {axis}",
        "description": (
            f"This analyst fronts the '{axis}' axis of the GSPC board. The "
            f"measurements are the signed GSPC cards at GET /api/gspc and "
            f"/signed/card_index.json — quote them, never this card. Axis "
            f"mapping is indicative; the board is authority. Measurement, "
            f"never certification."
        ),
        "tags": ["measurement", "gspc-axis", axis],
        "examples": [
            "SendMessage with Part.data {\"skill\":\"gspc-board\",\"input\":{}}",
            "GET /api/gspc — the live board this axis is measured on",
            "GET /signed/card_index.json — the signed card index",
        ],
    }


def build_card(entry: dict, org: dict, org_skills: dict[str, dict],
               council_axes: list[str] | None = None) -> dict:
    """Assemble one card. Everything structural is copied from the org card."""
    is_council = entry["id"] == "council"
    axes = council_axes if is_council else entry.get("axes", [])
    role = entry["role"]

    card = {
        "name": (
            # De-branded per the brand gate: the withdrawn fault-tolerance claim is
            # never asserted on a public surface — "designed ... council" only.
            "Council of AI — The Council (designed 33-agent council, 23/33 design threshold)"
            if is_council else
            # public_name exists for personas whose registry name is a de-branded
            # word on public surfaces (the brand gate scans these JSON values).
            f"Council of AI — {entry.get('public_name') or (entry['name'] + ' (' + role + ' Analyst)')}"
        ),
        "description": f"{entry['purpose']} {STATUS_LINE}",
        "version": CARD_VERSION,
        # Copied verbatim from the org card — one provider, one real interface,
        # the same three extension declarations, the same I/O modes.
        "provider": copy.deepcopy(org["provider"]),
        "supportedInterfaces": copy.deepcopy(org["supportedInterfaces"]),
        "documentationUrl": org.get("documentationUrl"),
        "iconUrl": org.get("iconUrl"),
        "capabilities": copy.deepcopy(org["capabilities"]),
        "defaultInputModes": copy.deepcopy(org["defaultInputModes"]),
        "defaultOutputModes": copy.deepcopy(org["defaultOutputModes"]),
        "skills": [copy.deepcopy(org_skills[s]) for s in entry["skills"]]
                  + [axis_skill(a) for a in axes],
        "catalogUrl": org.get("catalogUrl"),
        "doi": org.get("doi"),
        "explicitly_not": copy.deepcopy(org["explicitly_not"]),
        "x-csoai-analyst": {
            "role": role,
            "tier": "design",
            "bft_registry": "scripts/badger/csoai-bft-council.py",
            "status": ANALYST_STATUS,
            "mapping_note": MAPPING_NOTE,
        },
        "sig_ed25519": None,
        "signature_state": SIGNATURE_STATE,
    }
    if is_council:
        card["x-csoai-council"] = {
            "design_seats": entry["design_seats"],
            "design_quorum": entry["design_quorum"],
            "status": "DESIGN_ONLY",
            "credentials": "NOT_CONFIGURED",
            "independence": "NOT_MEASURED",
            "live_quorum_claim": "WITHDRAWN (n_eff 1.21 of 3; refutation ledger)",
            "registry": "scripts/badger/csoai-bft-council.py",
            "note": (
                "33 seats are role definitions, not 33 independently operated "
                "voters. No quorum observation exists; any future claim of one "
                "must carry independently produced, verifiable votes."
            ),
        }
    return {k: v for k, v in card.items() if v is not None or k in ("sig_ed25519",)}


def build_index(cards: dict[str, dict], roster: dict) -> dict:
    entries = []
    for cid, card in cards.items():
        entries.append({
            "id": cid,
            "name": card["name"],
            "role": card["x-csoai-analyst"]["role"],
            "url": f"{BASE_URL}/.well-known/agent-cards/{cid}.json",
            "skill_count": len(card["skills"]),
            "sig_ed25519": None,
        })
    return {
        "schema": INDEX_SCHEMA,
        "register": "measurement, never certification",
        "as_of_source": {
            "roster": "scripts/agent_cards/roster.json",
            "org_card": "public/.well-known/agent-card.json",
            "bft_registry": "scripts/badger/csoai-bft-council.py",
        },
        # Derived counts — never typed.
        "card_count": len(entries),
        "analyst_count": sum(1 for e in entries if e["id"] != "council"),
        "status": "DESIGN_ONLY — 13 discovery cards over ONE shared measured substrate; per-analyst isolated service NOT_CLAIMED",
        "cards": entries,
        "sig_ed25519": None,
        "signature_state": SIGNATURE_STATE,
    }


def generate() -> dict[str, dict]:
    roster = load_json(ROSTER_PATH)
    org = load_json(ORG_CARD_PATH)
    valid_axes = board_axis_ids()
    org_skills = {s["id"]: s for s in org["skills"]}

    union_axes: list[str] = []
    for g in roster["generals"]:
        for a in g.get("axes", []):
            if a not in valid_axes:
                raise CheckFailure(f"roster: {g['id']} references unknown axis '{a}'")
            if a not in union_axes:
                union_axes.append(a)
        for s in g["skills"]:
            if s not in org_skills:
                raise CheckFailure(f"roster: {g['id']} references unknown org skill '{s}'")

    cards: dict[str, dict] = {}
    for g in roster["generals"]:
        cards[g["id"]] = build_card(g, org, org_skills)
    council = dict(roster["council"])
    cards["council"] = build_card(council, org, org_skills, council_axes=union_axes)
    cards["index"] = build_index({k: v for k, v in cards.items()}, roster)
    return cards


def validate_card(cid: str, card: dict, valid_axes: set[str]) -> list[str]:
    errs: list[str] = []
    for field in REQUIRED_CARD_FIELDS:
        if field not in card:
            errs.append(f"{cid}: missing required field '{field}'")
    if errs:
        return errs
    if card["sig_ed25519"] is not None:
        errs.append(f"{cid}: sig_ed25519 must be null here — signing is the GHA publisher's job only")
    if not card["supportedInterfaces"] or card["supportedInterfaces"][0].get("url") != f"{BASE_URL}/api/a2a":
        errs.append(f"{cid}: supportedInterfaces must point at the single real interface {BASE_URL}/api/a2a")
    if card["provider"].get("organization") != "CSOAI Ltd":
        errs.append(f"{cid}: provider.organization drifted from the org card")
    if not card["skills"]:
        errs.append(f"{cid}: skills must be non-empty")
    for skill in card["skills"]:
        sid = skill.get("id", "")
        if sid.endswith("-axis"):
            axis = sid[: -len("-axis")]
            if axis not in valid_axes:
                errs.append(f"{cid}: axis skill '{sid}' names an axis not on the board ({axis})")
    if ANALYST_STATUS not in card["x-csoai-analyst"].get("status", ""):
        errs.append(f"{cid}: x-csoai-analyst.status drifted from the canonical status line")
    return errs


def check() -> int:
    errors: list[str] = []
    valid_axes = board_axis_ids()

    # 1. Roster re-verified against the BFT registry — the roster may not drift.
    roster = load_json(ROSTER_PATH)
    registry = bft_generals()
    for g in roster["generals"]:
        ref = registry.get(g["id"])
        if ref is None:
            errors.append(f"roster: '{g['id']}' is not a general in the BFT registry")
            continue
        for field in ("name", "role", "purpose"):
            if g[field] != ref[field]:
                errors.append(f"roster: {g['id']}.{field} != BFT registry ('{g[field]}' vs '{ref[field]}')")

    # 2. Regenerate in memory and compare to disk — a stale card is a typed claim.
    try:
        fresh = generate()
    except CheckFailure as exc:
        errors.append(str(exc))
        fresh = {}

    for cid, card in fresh.items():
        path = OUT_DIR / f"{cid}.json"
        if not path.exists():
            errors.append(f"{path}: missing — run scripts/agent_cards_build.py")
            continue
        on_disk = load_json(path)
        if on_disk != card:
            errors.append(f"{path}: stale — differs from regeneration; re-run the generator")
        if cid != "index":
            errors.extend(validate_card(cid, on_disk, valid_axes))
        else:
            if on_disk.get("schema") != INDEX_SCHEMA:
                errors.append(f"{path}: schema must be {INDEX_SCHEMA}")
            if on_disk.get("card_count") != len(on_disk.get("cards", [])):
                errors.append(f"{path}: card_count not derived from the cards array")

    if errors:
        print("CHECK FAILED:")
        for e in errors:
            print(f"  ✗ {e}")
        return 1
    print(f"CHECK OK: {len(fresh)} files valid (13 cards + index), "
          f"{len(valid_axes)} board axes derived, roster == BFT registry, "
          f"all sig_ed25519 null, single interface {BASE_URL}/api/a2a")
    return 0


def main() -> int:
    if "--check" in sys.argv:
        return check()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cards = generate()
    for cid, card in cards.items():
        (OUT_DIR / f"{cid}.json").write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(cards)} files to {OUT_DIR.relative_to(ROOT)}/ "
          f"(12 analysts + council + index) — all UNSIGNED by law")
    return 0


if __name__ == "__main__":
    sys.exit(main())
