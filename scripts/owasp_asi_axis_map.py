#!/usr/bin/env python3
"""owasp_asi_axis_map.py — OWASP Top 10 for Agentic Applications (2026) ↔ the live GSPC axes.

Producer for measurement/owasp-asi/asi-gspc-axis-map.json and docs/owasp-asi-gspc-axis-map.md.
The claim lives in both artifacts AND here: edit the mapping below, never the outputs.

Relationship vocabulary (one word, on purpose): `related`. A related axis measures a behaviour
that bears on the ASI risk. It never means the axis covers, tests for, mitigates or demonstrates
resistance to that risk — every mapping row carries coverage NOT_ESTABLISHED. Axes with no
defensible relation are listed as UNMAPPED with the reason; ASI entries no axis relates to are
listed as UNCOVERED. Neither list is hidden or padded.

  python3 scripts/owasp_asi_axis_map.py --write      # fetch source + live board, regenerate both files
  python3 scripts/owasp_asi_axis_map.py --check      # CI: every mapped/unmapped axis still on the live board, and vice versa
  python3 scripts/owasp_asi_axis_map.py --selftest   # offline: proves --check can fail
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OUT_JSON = REPO / "measurement" / "owasp-asi" / "asi-gspc-axis-map.json"
OUT_MD = REPO / "docs" / "owasp-asi-gspc-axis-map.md"
BOARD = "https://councilof.ai/api/gspc"
UA = "csoai-owasp-asi-map/0.1 (+https://councilof.ai; nicholas@csoai.org)"

SOURCE = {
    "title": "OWASP Top 10 for Agentic Applications for 2026",
    "publisher": "OWASP GenAI Security Project — Agentic Security Initiative",
    "resource_url": "https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/",
    "announcement_url": "https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/",
    "licence_note": "Titles quoted for identification. Cite OWASP. No OWASP endorsement, partnership or review of this mapping is claimed.",
}

ASI = [
    ("ASI01", "Agent Goal Hijack"),
    ("ASI02", "Tool Misuse"),
    ("ASI03", "Identity & Privilege Abuse"),
    ("ASI04", "Agentic Supply Chain Vulnerabilities"),
    ("ASI05", "Unexpected Code Execution"),
    ("ASI06", "Memory & Context Poisoning"),
    ("ASI07", "Insecure Inter-Agent Communication"),
    ("ASI08", "Cascading Failures"),
    ("ASI09", "Human-Agent Trust Exploitation"),
    ("ASI10", "Rogue Agents"),
]

# axis → [(ASI id, why related, what the axis does NOT establish)]
MAP: dict[str, list[tuple[str, str, str]]] = {
    "conformance": [
        ("ASI02", "MCPBench scores whether a model calls MCP tools within their declared contract; using a legitimate tool outside its intent is the ASI02 risk.",
         "Conformance on a frozen bank is not resistance to adversarial tool misuse or exploitation."),
        ("ASI04", "MCP servers and tool schemas are agentic supply-chain components, and the axis exercises a model against them.",
         "It measures model conformance to tool contracts, not the integrity or provenance of the components."),
    ],
    "cross-reality": [
        ("ASI02", "XRAIV asks whether an autonomous agent should PROCEED, CONFIRM or REFUSE before acting — the decision point where tools get used beyond intent.",
         "Action-authority judgement on a bank is not observed tool behaviour in a deployed agent."),
        ("ASI03", "Acting beyond granted authority is the privilege half of ASI03.",
         "No credential, identity, delegation or token handling is tested."),
    ],
    "swarm": [
        ("ASI07", "SwarmBench v2b measures safety of multi-agent coordination, which runs over inter-agent messages.",
         "Message authentication, spoofing and channel security are not tested."),
        ("ASI08", "Coordination failures between agents are one route by which a fault propagates across a system.",
         "No end-to-end cascade across real pipelines is measured."),
    ],
    "jail": [
        ("ASI05", "GoldBank-Detector measures detection of escape attempts from containment — a detection layer next to unexpected execution.",
         "It is not a sandbox or code-execution test, and detection is not prevention."),
        ("ASI10", "Escape attempts are one observable of an agent acting outside its sanctioned scope.",
         "Misalignment, deception or persistence of a rogue agent are not measured."),
    ],
    "affect": [
        ("ASI09", "AffectBench measures manipulation, disclosure and vulnerability handling — the behaviours through which an agent can exploit a human's trust.",
         "Responses on a frozen bank, not deployed agent-human interaction or operator approval flows."),
    ],
    "art5-safeguard": [
        ("ASI09", "Article 5 prohibited practices include manipulative and exploitative techniques; the axis measures whether a model trips on them.",
         "A legal-category trip test, not a measure of trust exploitation in agent workflows."),
    ],
}

UNMAPPED: dict[str, str] = {
    "governance": "EU AI Act risk-tier classification is a regulatory-reasoning task with no agentic threat surface.",
    "safety": "Calibrated refusal on paired direct requests; no injected or indirect instruction is present, so it does not bear on goal hijack (ASI01).",
    "provenance": "Article 50 marking survival concerns synthetic-content labelling, not an ASI risk; a link to ASI09 would be too weak to state.",
    "continuity": "Post-quantum status of cryptographic assumptions; not an agentic application risk.",
    "openness": "Licence reasoning against intended use; licence terms are not a supply-chain security property.",
    "machinery-conformity": "Machinery Regulation safety-function classification; not an agentic application risk.",
    "care": "Care-cost (protect x help) in paired conduct scenarios; no ASI entry names this behaviour.",
    "detector-interop": "Cross-detector watermark interoperability; not an agentic application risk.",
    "provenance-controls": "Deterministic on-chain issuer facts; not a model or agent behaviour.",
    "reserve-attestation": "Deterministic issuer-disclosure facts; not a model or agent behaviour.",
    "regulatory-framework": "Deterministic regime-declaration facts; not a model or agent behaviour.",
    "distribution-integrity": "Deterministic chain-supply facts; not a model or agent behaviour.",
    "custody-disclosure": "Deterministic custodian/auditor facts; not a model or agent behaviour.",
    "ai-adoption-components": "Cited public statistical series; not a model or agent behaviour.",
    "labour-components": "Cited public statistical series; not a model or agent behaviour.",
    "humanoid-labour-index": "Vendor disclosure facts; not a model or agent behaviour.",
}

TITLE_NOTES = {
    "ASI02": "Title as it appears in the announcement text ('ASI02 – Tool Misuse'). docs/owasp-agentic-crosswalk.md uses 'Tool Misuse & Exploitation'; the longer form was not checked against the published document here.",
}

UNCOVERED_NOTES = {
    "ASI01": "No board axis injects instructions through content, tools or retrieved data. Refusal calibration (safety) is not goal-hijack resistance.",
    "ASI06": "No board axis poisons memory or context. A separate repository (CSOAI-ORG/memory-poisoning-axis) exists but is not a board axis and is not counted here.",
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def board_axes(board: dict) -> dict[str, dict]:
    return {a["axis"]: a for a in board.get("axes", [])}


def check_against(axes: set[str]) -> list[str]:
    problems = []
    mapped = set(MAP) | set(UNMAPPED)
    if set(MAP) & set(UNMAPPED):
        problems.append(f"axis both mapped and unmapped: {sorted(set(MAP) & set(UNMAPPED))}")
    for a in sorted(mapped - axes):
        problems.append(f"mapped axis no longer on the live board: {a}")
    for a in sorted(axes - mapped):
        problems.append(f"live board axis with no mapping decision (map it or list it UNMAPPED): {a}")
    ids = {i for i, _ in ASI}
    for a, rows in MAP.items():
        for asi, _, _ in rows:
            if asi not in ids:
                problems.append(f"{a} maps to unknown ASI id {asi}")
    return problems


def verify_source() -> dict:
    t = fetch(SOURCE["announcement_url"]).decode("utf-8", "ignore")
    date = re.search(r'"datePublished":"([^"]+)"', t)
    text = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t)))
    found = {}
    for i, title in ASI:
        m = re.search(re.escape(i) + r"\s*[–-]\s*" + re.escape(title), text)
        found[i] = bool(m)
    r = fetch(SOURCE["resource_url"]).decode("utf-8", "ignore")
    rdate = re.search(r'"datePublished":"([^"]+)"', r)
    return {"announcement_datePublished": date.group(1) if date else None, "resource_datePublished": rdate.group(1) if rdate else None,
            "titles_found_verbatim_in_announcement": found, "retrieved_at": now()}


def build(board: dict, source_check: dict, board_at: str) -> dict:
    axes = board_axes(board)
    rows = []
    for axis, maps in MAP.items():
        a = axes[axis]
        for asi, why, not_est in maps:
            rows.append({"axis": axis, "axis_status": a.get("status"), "bench": a.get("bench"), "task": a.get("task"), "asi": asi,
                         "asi_title": dict(ASI)[asi], "relation": "related", "coverage": "NOT_ESTABLISHED", "why_related": why, "not_established": not_est})
    covered = {r["asi"] for r in rows}
    return {
        "schema": "csoai.owasp-asi-gspc-axis-map/0.1",
        "generated_at": now(),
        "generator": "scripts/owasp_asi_axis_map.py",
        "source": {**SOURCE, **source_check},
        "board": {"url": BOARD, "retrieved_at": board_at, "public_count": board.get("totals", {}).get("public_count"), "axes_on_board": len(axes)},
        "relation_vocabulary": {"related": "the axis measures a behaviour that bears on the ASI risk; it does not cover, test for, mitigate, or show resistance to it"},
        "asi_entries": [{"id": i, "title": t, "related_axes": sorted({r["axis"] for r in rows if r["asi"] == i}),
                         "state": "RELATED_AXES_PRESENT" if i in covered else "UNCOVERED",
                         **({"note": UNCOVERED_NOTES[i]} if i in UNCOVERED_NOTES else {}),
                         **({"title_note": TITLE_NOTES[i]} if i in TITLE_NOTES else {})} for i, t in ASI],
        "mapping": rows,
        "unmapped_axes": [{"axis": a, "axis_status": axes[a].get("status"), "family": axes[a].get("family"), "reason": UNMAPPED[a]} for a in UNMAPPED],
        "counts": {"asi_entries": len(ASI), "asi_with_related_axes": len(covered), "asi_uncovered": len(ASI) - len(covered),
                   "axes_on_board": len(axes), "axes_related": len(MAP), "axes_unmapped": len(UNMAPPED), "mapping_rows": len(rows)},
        "not_claimed": [
            "Not an OWASP product, review, endorsement or partnership.",
            "A related axis is not coverage of an ASI risk and not evidence of resistance to it.",
            "Not a certification or compliance statement. Measurement, not certification.",
            "Board status is read live; re-GET /api/gspc rather than trusting the snapshot in this file.",
        ],
    }


def render_md(d: dict) -> str:
    s, c = d["source"], d["counts"]
    L = [
        "# OWASP Top 10 for Agentic Applications (2026) ↔ GSPC axes",
        "",
        f"Generated by `{d['generator']}` at {d['generated_at']} — edit the generator, not this file. Machine copy: "
        "`measurement/owasp-asi/asi-gspc-axis-map.json`. Control-level crosswalk (ASI ↔ our controls and halts): `docs/owasp-agentic-crosswalk.md`.",
        "",
        "**Cite OWASP.** Source: [" + s["title"] + "](" + s["resource_url"] + f") (resource page datePublished {s.get('resource_datePublished')}); "
        f"ASI01–ASI10 titles checked verbatim against the [announcement]({s['announcement_url']}) (datePublished {s.get('announcement_datePublished')}), "
        f"retrieved {s.get('retrieved_at')}. {s['licence_note']}",
        "",
        f"Board: `GET {d['board']['url']}` retrieved {d['board']['retrieved_at']} — `public_count` \"{d['board']['public_count']}\", "
        f"{d['board']['axes_on_board']} axes. Re-GET before quoting; statuses below are a snapshot.",
        "",
        "**Vocabulary.** `related` = the axis measures a behaviour that bears on the risk. It is never coverage: every row is "
        "`coverage: NOT_ESTABLISHED`. No axis here tests for, mitigates or shows resistance to an ASI risk.",
        "",
        f"**Counts.** {c['asi_with_related_axes']} of {c['asi_entries']} ASI entries have at least one related axis; "
        f"{c['asi_uncovered']} are UNCOVERED. {c['axes_related']} of {c['axes_on_board']} axes are related to some entry; "
        f"{c['axes_unmapped']} are UNMAPPED.",
        "",
        "## ASI entries",
        "",
        "| ASI | Title (OWASP) | State | Related axes |",
        "|---|---|---|---|",
    ]
    for e in d["asi_entries"]:
        L.append(f"| {e['id']} | {e['title']} | **{e['state']}** | {', '.join('`'+a+'`' for a in e['related_axes']) or '—'} |")
    L += ["", "UNCOVERED, stated rather than filled:", ""]
    for e in d["asi_entries"]:
        if e["state"] == "UNCOVERED":
            L.append(f"- **{e['id']} {e['title']}** — {e.get('note', 'no board axis relates to it.')}")
    for e in d["asi_entries"]:
        if e.get("title_note"):
            L.append(f"- Title note, {e['id']}: {e['title_note']}")
    L += ["", "## Mapping rows", "", "| Axis (status) | ASI | Why related | Not established |", "|---|---|---|---|"]
    for r in d["mapping"]:
        L.append(f"| `{r['axis']}` ({r['axis_status']}) — {r['bench']} | {r['asi']} | {r['why_related']} | {r['not_established']} |")
    L += ["", "## Unmapped axes", "", "| Axis (status, family) | Why no ASI relation is stated |", "|---|---|"]
    for u in d["unmapped_axes"]:
        L.append(f"| `{u['axis']}` ({u['axis_status']}, {u['family']}) | {u['reason']} |")
    L += ["", "## Not claimed", ""] + [f"- {x}" for x in d["not_claimed"]] + [""]
    return "\n".join(L)


def selftest() -> int:
    full = set(MAP) | set(UNMAPPED)
    assert not check_against(full), check_against(full)
    assert any("no longer on the live board" in p for p in check_against(full - {"swarm"}))
    assert any("no mapping decision" in p for p in check_against(full | {"new-axis"}))
    print("owasp_asi_axis_map selftest: PASS (a removed axis and an undecided axis both fail --check)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--write", action="store_true")
    g.add_argument("--check", action="store_true")
    g.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    board_at = now()
    board = json.loads(fetch(BOARD))
    problems = check_against(set(board_axes(board)))
    if problems:
        print("OWASP-ASI axis map: FAIL\n  " + "\n  ".join(problems))
        return 1
    if a.check:
        print(f"OWASP-ASI axis map: PASS — all {len(board_axes(board))} live axes carry a mapping decision")
        return 0
    src = verify_source()
    missing = [k for k, v in src["titles_found_verbatim_in_announcement"].items() if not v]
    if missing:
        print(f"source check FAIL: titles not found verbatim for {missing}")
        return 1
    d = build(board, src, board_at)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    OUT_MD.write_text(render_md(d), encoding="utf-8")
    print(f"wrote {OUT_JSON.relative_to(REPO)} and {OUT_MD.relative_to(REPO)}: {d['counts']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
