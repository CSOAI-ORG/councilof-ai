#!/usr/bin/env python3
"""Batch 1 of the alignment fixes: discovery reachability + catalog truth.

Runs inside /Users/nicholas/_alignment/sd-fix (fresh clone of master).

Fixes, each traceable to a verified audit finding:

  1. llms.txt.tmpl      -> the Agent Skills pointer (F1: skills reachable from
                           zero manifests; 15 live skills, 0 references)
  2. llms-full.txt.tmpl -> the Agent Skills mention + clarify that
                           /api/board-sign is POST-only (F3: a relative path in
                           prose that reads as a GET link but 404s on GET)
  3. surface-catalog-<date>.json -> a NEW dated catalogue that carries the
                           skills + agent discovery entries AND drops the four
                           endpoints that do not resolve (F2: /api/checkout,
                           /api/fulfill, /api/interop-bulk,
                           /interop/sboum-councilof-ai.json)
  4. sitemap.xml        -> regenerated, so it stops being 2 URLs behind the
                           live site (F4: native-panel/, reports/daily-signal/)

The ORIGINAL public/interop/surface-catalog.json carries an OpenTimestamps
proof and must stay byte-identical; the updated catalogue is the dated file.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path("/Users/nicholas/_alignment/sd-fix")
sys.path.insert(0, str(ROOT / "scripts" / "badger"))
from ots_stamp import submit_ots, attestation_state  # noqa: E402

DATE = "2026-11-06"
LIVE = "https://councilof.ai"

SKILLS_LINE = (
    "- Agent Skills (the 15 executable skills, each with a digest and one SKILL.md): "
    f"{LIVE}/.well-known/agent-skills/index.json — the index lists every skill id and the path "
    "of its SKILL.md; each SKILL.md names the exact call it makes. Send a skill to the A2A door "
    f"(POST {LIVE}/api/a2a, header `A2A-Version: 1.0`, JSON-RPC 2.0 `SendMessage`)."
)

# The four endpoints the catalog advertised but which do not resolve. Each was
# checked live on 2026-11-06: 404 (checkout, fulfill, sboum) or 404-on-POST /
# 400-on-GET (interop-bulk).
DEAD = [
    "/api/checkout",
    "/api/fulfill",
    "/api/interop-bulk",
    "/interop/sboum-councilof-ai.json",
]


def read(p: Path) -> str:
    return p.read_text()


def write(p: Path, s: str) -> None:
    p.write_text(s)
    print(f"wrote {p.relative_to(ROOT)}")


def run(cmd, timeout=900):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
    out = (r.stdout.strip() or r.stderr.strip())
    print(f"$ {' '.join(cmd)}\n{out[-700:]}")
    assert r.returncode == 0, f"{cmd} failed: {r.stderr[-800:]}"
    return out


def patch_templates() -> None:
    p = ROOT / "scripts/llms/llms.txt.tmpl"
    s = read(p)
    if "agent-skills" not in s:
        m = re.search(r"^- Agent card: .*$", s, re.M)
        assert m, "no agent card line in llms.txt.tmpl"
        s = s[: m.end()] + "\n" + SKILLS_LINE + s[m.end():]
        write(p, s)
    else:
        print("llms.txt.tmpl already patched")

    p = ROOT / "scripts/llms/llms-full.txt.tmpl"
    s = read(p)
    if "agent-skills" not in s:
        m = re.search(r"^2\. A2A \(agent to agent\).*$", s, re.M)
        assert m, "no A2A section in llms-full.txt.tmpl"
        add = (
            f"\n   Agent Skills: `GET {LIVE}/.well-known/agent-skills/index.json` lists the 15"
            "\n   executable skills; the index lists every skill id and the path of its `SKILL.md`,"
            "\n   and each SKILL.md names the exact call it makes."
        )
        s = s[: m.end()] + add + s[m.end():]
        write(p, s)
    else:
        print("llms-full.txt.tmpl already patched")

    # board-sign is a POST-only Pages Function (it exports onRequestPost and
    # onRequestOptions, no GET handler), so a GET returns 404. The prose that
    # mentions it reads as a GET link. Say POST and the reference is accurate.
    p = ROOT / "scripts/llms/llms-full.txt.tmpl"
    s = read(p)
    old = "The Pages /api/board-sign path was not used"
    new = "The Pages POST /api/board-sign path was not used"
    if old in s:
        write(p, s.replace(old, new))
    else:
        print("board-sign wording already corrected")


def write_dated_catalogue() -> Path:
    src = ROOT / "public/interop/surface-catalog.json"
    d = json.loads(src.read_text())
    pa = d.setdefault("public_artifacts", {})
    pa["agent_skills"] = (
        "/.well-known/agent-skills/index.json (15 Agent Skills, each with a digest; the index "
        "lists every skill id and the path of its SKILL.md - the A2A door POST /api/a2a executes them)"
    )
    pa["agent_discovery"] = (
        "/.well-known/agent-card.json (A2A v1.0 card; names every skill) + /.well-known/agent.json"
        " + /.well-known/ai-catalog.json + /.well-known/api-catalog"
    )
    # drop the four endpoints that do not resolve
    dropped = []
    for key in ("api", "interop", "signed", "signals", "docs", "datasets", "rails"):
        arr = d.get(key)
        if not isinstance(arr, list):
            continue
        keep = []
        for item in arr:
            head = str(item).split(" ")[0]
            if any(head.endswith(dd) for dd in DEAD):
                dropped.append(f"{key}:{head}")
                continue
            keep.append(item)
        d[key] = keep
    print(f"dropped {len(dropped)} unresolvable endpoint(s): {dropped}")
    d["as_of"] = DATE
    out = ROOT / f"public/interop/surface-catalog-{DATE}.json"
    out.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size} B)")
    return out


def stamp(p: Path) -> None:
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    proof = submit_ots(digest)
    if not proof:
        raise SystemExit("STAMP FAILED — no proof returned")
    Path(str(p) + ".ots").write_bytes(proof)
    print(f"stamped {p.name}: {len(proof)} B | state: {attestation_state(proof)}")


def main() -> None:
    patch_templates()
    run(["node", "scripts/llms-txt.mjs"])
    dated = write_dated_catalogue()
    stamp(dated)
    run(["python3", "scripts/ots_manifest_rebuild.py", "--apply"])
    run(["node", "scripts/llms-txt.mjs"])          # re-derive OTS as_of
    run(["node", "scripts/generate-sitemap.mjs"])  # pick up the 2 missing URLs
    print("=== BATCH 1 DONE ===")


if __name__ == "__main__":
    main()
