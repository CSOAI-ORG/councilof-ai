#!/usr/bin/env python3
"""Apply the Agent Skills discovery fix on top of current master.

Runs inside the fresh checkout at /Users/nicholas/_alignment/sd-fix.

The fix has five steps, each of which the estate's own gates demand:
  1. add the pointer to the two llms templates (no slot pattern as a link)
  2. regenerate public/llms.txt + public/llms-full.txt from the templates
  3. write the updated surface catalogue as a NEW dated file (the original
     carries an OTS proof and must stay byte-identical)
  4. stamp the new file with the estate's own primitive
  5. rebuild public/interop/ots/manifest.json from the bytes, then
     regenerate llms again so its recorded OTS as_of derives from the NEW
     manifest rather than the old one
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


def read(p: Path) -> str:
    return p.read_text()


def write(p: Path, s: str) -> None:
    p.write_text(s)
    print(f"wrote {p.relative_to(ROOT)}")


def patch_templates() -> None:
    # 1. llms.txt.tmpl — insert the skills line directly after the agent card line.
    p = ROOT / "scripts/llms/llms.txt.tmpl"
    s = read(p)
    assert "agent-skills" not in s, "llms.txt.tmpl already points at the skills"
    m = re.search(r"^- Agent card: .*$", s, re.M)
    assert m, "no agent card line in llms.txt.tmpl"
    s = s[: m.end()] + "\n" + SKILLS_LINE + s[m.end():]
    write(p, s)

    # 2. llms-full.txt.tmpl — extend the A2A door section.
    p = ROOT / "scripts/llms/llms-full.txt.tmpl"
    s = read(p)
    assert "agent-skills" not in s, "llms-full.txt.tmpl already points at the skills"
    m = re.search(r"^2\. A2A \(agent to agent\).*$", s, re.M)
    assert m, "no A2A section in llms-full.txt.tmpl"
    add = (
        f"\n   Agent Skills: `GET {LIVE}/.well-known/agent-skills/index.json` lists the 15"
        "\n   executable skills; the index lists every skill id and the path of its `SKILL.md`,"
        "\n   and each SKILL.md names the exact call it makes."
    )
    s = s[: m.end()] + add + s[m.end():]
    write(p, s)


def regenerate_llms() -> None:
    r = subprocess.run(
        ["node", "scripts/llms-txt.mjs"], cwd=ROOT, capture_output=True, text=True, timeout=600
    )
    print(r.stdout.strip()[-400:] or r.stderr.strip()[-400:])
    assert r.returncode == 0, f"llms-txt.mjs failed: {r.stderr[-800:]}"


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


def rebuild_manifest() -> None:
    r = subprocess.run(
        ["python3", "scripts/ots_manifest_rebuild.py", "--apply"],
        cwd=ROOT, capture_output=True, text=True, timeout=900,
    )
    print(r.stdout.strip()[-600:] or r.stderr.strip()[-600:])
    assert r.returncode == 0, f"manifest rebuild failed: {r.stderr[-800:]}"


if __name__ == "__main__":
    patch_templates()
    regenerate_llms()
    dated = write_dated_catalogue()
    stamp(dated)
    rebuild_manifest()
    regenerate_llms()  # now derives the OTS as_of from the NEW manifest
    print("=== DONE ===")
