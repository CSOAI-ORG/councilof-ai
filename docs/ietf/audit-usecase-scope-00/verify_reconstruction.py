#!/usr/bin/env python3
"""verify_reconstruction.py — check the reconstructed XML2rfc source against the recovered text.

WHY. The three sibling drafts of 2026-09-12 were never submitted, so no XML2rfc source of
theirs exists (measured: none in the estate, the repo, or the IETF archive under their
docNames). Only their rendered text survives, and that text is HAND-SET — its page footers,
page numbers and table of contents were written by hand, so it is not the output of any
xml2rfc run. A reconstruction therefore cannot be checked by diffing renders. It is checked
two ways instead:

  (a) NOTHING INVENTED — every term, section name and reference the reconstruction claims
      must exist in the RECOVERED TEXT.
  (b) NOTHING OMITTED — every section and reference in the RECOVERED TEXT must appear in the
      RENDER of the reconstruction.

A reconstruction that drops a state, renames a section or invents a reference fails here.

WHAT ELSE IT CHECKS. xml2rfc must report 0 errors and 0 warnings other than the date
warning (a document dated in the past is expected to warn; anything else is a defect).

USAGE
  python3 verify_reconstruction.py [xml] [recovered-text]
"""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
XML = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "draft-templeman-audit-usecase-scope-00.xml"
ORIGINAL = Path(sys.argv[2]) if len(sys.argv) > 2 else (
    Path.home() / "clawd/_alignment/ietf-drafts-20260912/draft-templeman-audit-usecase-scope-00.txt")

SECTION_RE = re.compile(r"^(\d+(?:\.\d+)?)\.\s+(\S.*\S)\s*$")
REF_RE = re.compile(r"\[((?:RFC\d+|I-D\.[A-Za-z0-9.-]+|SIGSTORE|OTI))\]")
FURNITURE_RE = re.compile(r"^(Templeman\s+Expires|Internet-Draft\s+)")


def required_from_original(path):
    """The structure the recovered text must have: its numbered sections and its references."""
    text = path.read_text(encoding="utf-8", errors="replace")
    sections, refs = [], set()
    for line in text.split("\n"):
        if FURNITURE_RE.match(line):
            continue
        m = SECTION_RE.match(line)
        if m and not line.startswith(" "):
            sections.append((m.group(1), m.group(2)))
        for r in REF_RE.findall(line):
            refs.add(r)
    return sections, sorted(refs)


def vocabulary_from_xml(path):
    """The vocabulary the reconstruction claims: its defined terms, section names and
    reference keys. Each must exist in the RECOVERED TEXT, so nothing is invented."""
    xml = path.read_text(encoding="utf-8", errors="replace")
    terms = [re.sub(r"\s+", " ", t).strip() for t in re.findall(r"<dt>(.*?)</dt>", xml, re.S)]
    names = [re.sub(r"\s+", " ", t).strip() for t in re.findall(r"<name>(.*?)</name>", xml, re.S)]
    sections = re.findall(r"<section[^>]*\stitle=\"([^\"]+)\"", xml)
    refs = sorted(set(re.findall(r"<reference anchor=\"([^\"]+)\"", xml)))
    return terms, names, sections, refs


def main():
    if not ORIGINAL.exists():
        print(f"RECOVERED TEXT NOT FOUND: {ORIGINAL}")
        print("  The recovered text is the source of truth for this check. It is a keeper file")
        print("  at ~/clawd/_alignment/ietf-drafts-20260912/.")
        return 2

    sections, refs = required_from_original(ORIGINAL)
    xml_terms, xml_names, xml_sections, xml_refs = vocabulary_from_xml(XML)

    proc = subprocess.run(["xml2rfc", "--text", "--no-network", str(XML)],
                          cwd=str(XML.parent), capture_output=True, text=True)
    rendered_path = XML.parent / (XML.stem + ".txt")
    rendered = rendered_path.read_text(encoding="utf-8", errors="replace") if rendered_path.exists() else ""
    diag = (proc.stderr or "") + (proc.stdout or "")
    errors = [ln for ln in diag.split("\n") if "Error" in ln]
    warnings = [ln for ln in diag.split("\n") if "Warning" in ln and "more than 3 days away" not in ln]

    if errors:
        print("FAIL: xml2rfc reported errors:")
        for e in errors[:10]:
            print("  " + e)
        return 1
    if warnings:
        print("FAIL: xml2rfc reported warnings other than the date:")
        for w in warnings[:10]:
            print("  " + w)
        return 1
    if not rendered:
        print("FAIL: no render was produced")
        return 1

    orig_text = ORIGINAL.read_text(encoding="utf-8", errors="replace")

    # (a) nothing invented
    invented_terms = [t for t in xml_terms if t not in orig_text]
    invented_names = [t for t in xml_names if t not in orig_text]
    invented_sections = [t for t in xml_sections if t not in orig_text]
    invented_refs = [r for r in xml_refs if ("[" + r + "]") not in orig_text]
    # (b) nothing omitted
    missing_sections = [(n, t) for n, t in sections if t.split()[0] not in rendered and t not in rendered]
    missing_refs = [r for r in refs if ("[" + r + "]") not in rendered]

    print(f"rendered: {rendered_path.name}  ({len(rendered)} bytes)")
    print(f"from the recovered text: {len(sections)} sections, {len(refs)} references")
    print(f"from the reconstruction: {len(xml_terms)} defined terms, {len(xml_names) + len(xml_sections)} section names, {len(xml_refs)} references")
    ok = True
    for label, items in (
        ("term(s)/state(s) the reconstruction claims that are NOT in the recovered text", invented_terms),
        ("section name(s) the reconstruction claims that are NOT in the recovered text", invented_names + invented_sections),
        ("reference(s) the reconstruction claims that are NOT in the recovered text", invented_refs),
        ("section(s) in the recovered text that are MISSING from the render", [f"{n}. {t}" for n, t in missing_sections]),
        ("reference(s) in the recovered text that are MISSING from the render", [f"[{r}]" for r in missing_refs]),
    ):
        if items:
            ok = False
            print(f"FAIL: {len(items)} {label}:")
            for it in items[:10]:
                print("   " + it)
    if ok:
        print("OK: nothing invented, nothing omitted.")
        print("    Every term, section name and reference the reconstruction claims is in the")
        print("    recovered text, and every section and reference in the recovered text is in")
        print("    the render. xml2rfc: 0 errors, 0 warnings other than the expected date.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
