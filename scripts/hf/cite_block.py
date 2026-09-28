#!/usr/bin/env python3
"""cite_block.py — the How-to-cite, corrections and verification block every public csoai/* dataset card carries.

WHY THIS FILE EXISTS. On 28 Sep 2026 lane L5 wrote this block onto all 127 public csoai/* dataset cards
(log: ~/_alignment/HF-CARDS-2026-09-28.md; script: oracle-micro-2 ~/lanes/l5-hfcards/gen_cards.py). It was
written to the ARTIFACT only. Every generator that rewrites a card from its own template would drop it on its
next run (see memory fix-producer-not-artifact). This module is the one producer of the block; each card
generator calls `apply()` on the README text it is about to write, so the next run keeps the block.

WHAT IS VERBATIM. `block()`, `fm_split()`, `fm_licence()`, `set_licence()`, `title_of()`, `LIC_LABEL`, the
licence decisions in `LIC_FIX` and the notes in `LIC_NOTE` are copied from gen_cards.py unchanged, so
`apply(live_card, repo_id) == live_card` byte for byte on every card L5 wrote (test_cite_block.py and
`python3 cite_block.py diff-live` check exactly that). The one addition is `LIC_LABEL[None]`, used only when a
card states no licence at all (none of the 127 did after L5).

WHAT IT NEVER DOES. It reads no network, invents no number and chooses no licence except the eight decisions
L5 recorded with their sources. Year and DOI come from cite-block-registry.json (read from the HF API by L5:
created_at.year and the repo's doi: tag); a dataset not in the registry takes the year passed in, else the
current UTC year, and no DOI.

Usage (as a library):
    from cite_block import apply            # scripts/hf on sys.path
    readme = apply(readme, "csoai/fleet-status")

Usage (dry run, no upload, no token):
    python3 scripts/hf/cite_block.py diff-live README.generated.md --repo csoai/<name>
        diffs the block in a generated card against the block on the live card (anonymous read)
    python3 scripts/hf/cite_block.py check-dir <dir of live READMEs named <name>.md>
        asserts apply(card) == card for every file (the helper reproduces the live cards exactly)
"""
from __future__ import annotations

import datetime as _dt
import difflib
import json
import re
import sys
import urllib.request
from pathlib import Path

START, END = "<!-- csoai-cite-v1:start -->", "<!-- csoai-cite-v1:end -->"
REGISTRY_PATH = Path(__file__).with_name("cite-block-registry.json")

LIC_LABEL = {"cc-by-4.0": "CC-BY-4.0", "cc0-1.0": "CC0-1.0", "other": "mixed (see Licence note)",
             "mit": "MIT", "apache-2.0": "Apache-2.0", None: "not stated in this card"}

# Licence decisions recorded by L5, each with its source (the site states its data licence as CC-BY-4.0:
# GET /api/gspc license + license_note "Board data is CC-BY-4.0"; GET /api/corrections license CC-BY-4.0).
LIC_FIX = {
    "claim-registries": "cc-by-4.0",           # the card body already stated "Licence: CC-BY-4.0"
    "eldorado-data-listing": "cc-by-4.0",      # apache-2.0 was a code licence on a data card
    "living-catalog": "cc-by-4.0",             # mit was a code licence on a data card
    "labour-economy-unmeasured": "cc-by-4.0",  # mit was a code licence on a data card
    "rwa-testnet-unmeasured": "cc-by-4.0",     # mit was a code licence on a data card
    "gspc-own-models-measured": "cc-by-4.0",   # apache-2.0 on GSPC measurement rows
    "gspc-hf-model-census": "cc-by-4.0",       # apache-2.0 on data; build_census.py stays Apache-2.0 (note)
    "index-presence": "other",                 # mixed: CSOAI files CC-BY-4.0, registry copy keeps upstream terms
}

LIC_NOTE = {
    "gspc-hf-model-census": "\n## Licence note\n\nThe data files (models.jsonl, manifest.jsonl) are CC-BY-4.0. The script build_census.py is code and is Apache-2.0.\n",
    "index-presence": "\n## Licence note\n\nFiles written by CSOAI in this repository (the measurement JSON files and PRESENCE-BOARD.md) are CC-BY-4.0, the licence councilof.ai states for its data. `2026-09-22/mcp-registry-servers.jsonl` is a verbatim copy of third-party MCP registry records; it keeps the terms of its upstream source and is not relicensed by CSOAI.\n",
}


def fm_split(t):
    if t.startswith("---\n"):
        j = t.find("\n---\n", 4)
        if j != -1:
            return t[4:j], t[j + 5:]
    return None, t


def fm_licence(fm):
    m = re.search(r"(?m)^license:\s*(\S+)\s*$", fm or "")
    return m.group(1) if m else None


def set_licence(fm, lic, extra=None):
    if fm is None:
        fm = ""
    if re.search(r"(?m)^license:", fm):
        fm = re.sub(r"(?m)^license:.*$", f"license: {lic}", fm, count=1)
    else:
        fm = f"license: {lic}\n" + fm
    if extra:
        for k, v in extra.items():
            if not re.search(rf"(?m)^{k}:", fm):
                fm = fm.rstrip("\n") + f"\n{k}: {v}\n"
    return fm


def title_of(fm, body, name):
    m = re.search(r'(?m)^pretty_name:\s*"?(.+?)"?\s*$', fm or "")
    if m:
        return m.group(1).strip()
    m = re.search(r"(?m)^#\s+(.+?)\s*$", body)
    return m.group(1).strip() if m else name


def block(name, title, year, lic, doi):
    url = f"https://huggingface.co/datasets/csoai/{name}"
    cite = f"CSOAI Ltd (Council of AI). *{title}*. {year}. Hugging Face dataset `csoai/{name}`. {url}"
    if doi:
        cite += f". DOI: [{doi}](https://doi.org/{doi})"
    key = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    bib = [f"@misc{{csoai_{key},", f"  title        = {{{title}}},", "  author       = {{CSOAI Ltd}},",
           f"  year         = {{{year}}},", f"  howpublished = {{Hugging Face dataset, {url}}},"]
    if doi:
        bib.append(f"  doi          = {{{doi}}},")
    bib.append("  note         = {Corrections: https://councilof.ai/api/corrections}")
    bib.append("}")
    lic_line = {"cc-by-4.0": "Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.",
                "cc0-1.0": "Licence: CC0-1.0. Attribution is appreciated, not required.",
                "other": "Licence: mixed. See the Licence note in this card."}.get(lic, f"Licence: {LIC_LABEL.get(lic, lic)}.")
    return "\n".join([
        START, "## How to cite", "", cite, "", "```bibtex", *bib, "```", "", lic_line, "",
        "## Corrections and verification", "",
        "- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.",
        "- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).",
        "- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/",
        END, ""])


_REGISTRY: dict | None = None


def registry() -> dict:
    global _REGISTRY
    if _REGISTRY is None:
        try:
            _REGISTRY = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))["datasets"]
        except (OSError, ValueError, KeyError):
            _REGISTRY = {}
    return _REGISTRY


def has_block(text: str) -> bool:
    return START in text and END in text


def extract(text: str) -> str | None:
    """The block as it stands in a card (START..END plus its newline), or None."""
    m = re.search(re.escape(START) + r".*?" + re.escape(END) + r"\n?", text, flags=re.S)
    return m.group(0) if m else None


def apply(readme: str, repo_id: str, *, year: int | None = None, doi: str | None = None) -> str:
    """Return `readme` carrying the block at its end (replacing any earlier copy), with L5's licence decision
    for this dataset applied to the front matter. Idempotent: apply(apply(x)) == apply(x)."""
    name = repo_id.split("/", 1)[1] if "/" in repo_id else repo_id
    reg = registry().get(name, {})
    fm, body = fm_split(readme)
    lic = fm_licence(fm)
    if name in LIC_FIX:
        lic = LIC_FIX[name]
        extra = None
        if lic == "other":
            extra = {"license_name": "csoai-mixed-data",
                     "license_link": f"https://huggingface.co/datasets/csoai/{name}/blob/main/README.md#licence-note"}
        fm = set_licence(fm, lic, extra)
    if year is None:
        year = reg.get("year") or _dt.datetime.now(_dt.timezone.utc).year
    if doi is None:
        doi = reg.get("doi")
    title = title_of(fm, body, name).replace("{", "(").replace("}", ")")
    blk = block(name, title, year, lic, doi)
    if START in body:
        body = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n?", "", body, flags=re.S)
    if name in LIC_NOTE and "## Licence note" not in body:
        body = body.rstrip("\n") + "\n" + LIC_NOTE[name]
    body = body.rstrip("\n") + "\n\n" + blk
    return (f"---\n{fm.rstrip(chr(10))}\n---\n" if fm is not None else "") + body


def apply_file(path, repo_id: str, **kw) -> None:
    p = Path(path)
    p.write_text(apply(p.read_text(encoding="utf-8"), repo_id, **kw), encoding="utf-8")


# ── dry-run CLI ───────────────────────────────────────────────────────────────────────────────

def live_card(repo_id: str) -> str:
    url = f"https://huggingface.co/datasets/{repo_id}/resolve/main/README.md"
    req = urllib.request.Request(url, headers={"User-Agent": "councilof.ai cite-block dry-run (+https://councilof.ai)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def _diff(a: str, b: str, fa: str, fb: str) -> str:
    return "".join(difflib.unified_diff(a.splitlines(True), b.splitlines(True), fa, fb))


def main(argv: list[str]) -> int:
    if len(argv) >= 2 and argv[0] == "check-dir":
        bad = []
        files = sorted(Path(argv[1]).glob("*.md"))
        for f in files:
            t = f.read_text(encoding="utf-8")
            if apply(t, f"csoai/{f.stem}") != t:
                bad.append(f.stem)
        print(f"check-dir: {len(files) - len(bad)}/{len(files)} cards reproduced byte for byte by apply()")
        for b in bad:
            print("  DIFFERS", b)
        return 1 if bad or not files else 0
    if len(argv) >= 3 and argv[0] == "diff-live" and "--repo" in argv:
        gen_path = Path(argv[1])
        repo = argv[argv.index("--repo") + 1]
        gen = gen_path.read_text(encoding="utf-8")
        live = Path(argv[argv.index("--live") + 1]).read_text(encoding="utf-8") if "--live" in argv else live_card(repo)
        gb, lb = extract(gen), extract(live)
        if gb is None:
            print(f"{repo}: FAIL the generated card carries no block")
            return 1
        if lb is None:
            print(f"{repo}: the live card carries no block (generated block present)")
            return 1
        d = _diff(lb, gb, f"live:{repo}#block", f"generated:{gen_path}#block")
        whole = "IDENTICAL" if gen == live else f"card differs outside the block ({sum(1 for l in _diff(live, gen, 'live', 'gen').splitlines() if l[:1] in '+-' and l[:3] not in ('+++', '---'))} changed lines)"
        print(f"{repo}: block {'IDENTICAL' if not d else 'DIFFERS'} to live; whole card {whole}; block at end: {gen.endswith(END + chr(10))}")
        if d:
            print(d)
        return 0 if not d else 1
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
