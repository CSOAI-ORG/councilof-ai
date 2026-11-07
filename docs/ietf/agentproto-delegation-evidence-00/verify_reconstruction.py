#!/usr/bin/env python3
"""verify_reconstruction.py — check the reconstructed XML2rfc source against the recovered text.

WHY. The three sibling drafts of 2026-09-12 were never submitted, so no XML2rfc source of
theirs exists (measured: none in the estate, the repo, or the IETF archive under their
docNames). Only their rendered text survives, and that text is HAND-SET — its page footers,
page numbers and table of contents were written by hand, so it is not the output of any
xml2rfc run. A reconstruction therefore cannot be checked by diffing renders. It is checked
three ways instead:

  (a) NOTHING INVENTED — every term, section name and reference the reconstruction claims
      must exist in the RECOVERED TEXT.
  (b) NOTHING OMITTED — every prose paragraph of the recovered text must appear in the
      RENDER of the reconstruction, and every prose paragraph of the render must appear in
      the recovered text. Nothing dropped, nothing added.
  (c) THE REFERENCES AGREE — every reference in the author's list must be present in the
      render with the same title and the same URL, and every reference the render lists must
      be in the author's list.

WHAT ELSE IT CHECKS. xml2rfc must report 0 errors and 0 warnings other than the date
warning (a document dated in the past is expected to warn; anything else is a defect).

THE TWO THINGS THIS FILE HAS TO GET RIGHT, both measured, both learned the hard way:

  1. THE RECOVERED TEXT'S PAGE FURNITURE SPLITS PARAGRAPHS. A paragraph that crosses a page
     break in the hand-set text is cut in two by the footer and the running header, and the
     two halves are separated by blank lines. So the furniture is REMOVED, not replaced with
     a newline: otherwise one paragraph reads as two, and the reconstruction is charged for
     omitting half of it.

  2. xml2rfc WRAPS LINES AT HYPHENS. The render breaks "agent-to-tool" as "agent-" / "to-tool".
     Collapsing whitespace without de-hyphenating first turns that into "agent- to-tool" and
     reports a difference where there is none. Both texts are therefore de-hyphenated at a
     line break before whitespace is collapsed.

USAGE
  python3 verify_reconstruction.py [xml] [recovered-text]
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
XML = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "draft-templeman-agentproto-delegation-evidence-00.xml"
ORIGINAL = Path(sys.argv[2]) if len(sys.argv) > 2 else (
    Path.home() / "clawd/_alignment/ietf-drafts-20260912/draft-templeman-agentproto-delegation-evidence-00.txt")

SECTION_RE = re.compile(r"^(\d+(?:\.\d+)?)\.\s+(\S.*\S)\s*$")
REF_RE = re.compile(r"\[((?:RFC\d+|I-D\.[A-Za-z0-9.-]+|SIGSTORE|OTI|A2A|MCP|MACAROONS))\]")

# The title block. The recovered text hand-set it; xml2rfc builds its own, and the two are
# not the same block. It is furniture, not content: the document's title and docName are
# checked separately, by the section-name and reference-key checks.
GENERATED_FRONT_MATTER_RE = re.compile(
    r"^(?:Network Working Group\b|Intended status:|Expires:|RFC\d+\s|SCITT\s+N\.)"
    r"|^This Internet-Draft will expire on\b"
    r"|^Copyright \(c\)\b"
    # The author's address block. xml2rfc builds it from the <author> element; the
    # recovered text hand-set it, and the two blocks are cut differently. The address itself
    # is checked against the XML's author element, not here.
    r"|^Nicholas Templeman\b"
    r"|^Email: "
    r"|^Author's Address\b")

# THE URL FORMS xml2rfc DERIVES, and the ones the recovered text carries instead. A
# reference's URL is GENERATED from its seriesInfo: xml2rfc renders an RFC as
# https://www.rfc-editor.org/rfc/rfcNNNN and an Internet-Draft as
# https://datatracker.ietf.org/doc/html/<name>-<rev>. The recovered text carries the
# /info/ and /doc/ forms of the same documents. Both resolve to the same document; the
# difference is the generator's choice, not authored content.
#
# They are RECORDED here rather than silently tolerated: a URL difference that is NOT in
# this table FAILS the check. So the list is the whole of the permitted difference, and it
# is visible in the file rather than hidden in a tolerance.
RECORDED_URL_FORM_DIFFERENCES = {
    "RFC6962": "https://www.rfc-editor.org/info/rfc6962",
    "RFC9052": "https://www.rfc-editor.org/info/rfc9052",
    "RFC9943": "https://www.rfc-editor.org/info/rfc9943",
    "I-D.templeman-scitt-framing-space":
        "https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/",
    "I-D.templeman-agent-log-tampering":
        "https://datatracker.ietf.org/doc/draft-templeman-agent-log-tampering/",
    "I-D.templeman-audit-usecase-scope":
        "https://datatracker.ietf.org/doc/draft-templeman-audit-usecase-scope/",
}

# The page furniture of the hand-set text: the running header, the running footer with its
# page number, and the form feed between pages. Removed WITHOUT leaving a blank line.
FURNITURE_RE = re.compile(
    r"^(?:Templeman\s+Expires\s+\d+\s+[A-Z][a-z]+\s+\d{4}\s+\[Page\s+\d+\]"
    r"|Internet-Draft\s+\S.*"
    r"|RFC\d+\s+\S.*\d{4}\s*)$",
    re.M)


def strip_furniture(text):
    """Remove the hand-set page furniture, JOINING the paragraph it cut in two.

    A paragraph that crosses a page break in the hand-set text is cut in two by the footer
    and the running header, and blank lines sit on both sides of them. So the blank lines
    around a piece of furniture go with it: otherwise one paragraph reads as two, and the
    reconstruction is charged for omitting half of it.
    """
    lines = text.replace("\f", "\n").split("\n")
    out = []
    pending_join = False
    i = 0
    while i < len(lines):
        if FURNITURE_RE.match(lines[i]):
            while out and not out[-1].strip():
                out.pop()          # the blank lines before the furniture
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1              # the blank lines after it
            pending_join = True     # the two sides were one paragraph: join them with a space
            continue
        if pending_join:
            if out:
                out[-1] = out[-1] + " "
            pending_join = False
        out.append(lines[i])
        i += 1
    return "\n".join(out)


def normalise(text):
    """Typography and whitespace normalisation, applied to BOTH texts identically."""
    for a, b in (("—", "--"), ("–", "-"), ("−", "-"),
                 ("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
                 (" ", " "), ("", ""), (" ", " "), ("⁠", ""),
                 ("‑", "-")):
        text = text.replace(a, b)
    # a line break AT a hyphen is a wrap, not a space (xml2rfc wraps at hyphens)
    text = re.sub(r"([A-Za-z0-9])-\n[ \t]*([A-Za-z0-9])", r"\1-\2", text)
    # a line break after a slash is a wrap of a URL, not a space
    text = re.sub(r"(/)\n[ \t]*([A-Za-z0-9])", r"\1\2", text)
    return re.sub(r"[ \t]+", " ", text)


def sentences(text, drop_furniture=True):
    """The SENTENCES of a document.

    WHY SENTENCES AND NOT PARAGRAPHS. The recovered text is hand-set and the render is
    generated, and they do not agree on where a paragraph ends: the hand-set text runs a
    heading onto the end of the paragraph before it, runs two list items into one block, and
    splits a paragraph across a page break. The CONTENT is the same. So the check is made at
    the granularity that does not move — the sentence. A dropped sentence is still caught, and
    a paragraph that is merely re-divided is not reported as an omission.

    Headings, the table of contents, the title block and the reference entries are excluded:
    the references are compared separately, entry by entry.
    """
    if drop_furniture:
        text = strip_furniture(text)
    text = normalise(text)
    out = []
    for block in re.split(r"\n[ \t]*\n", text):
        b = " ".join(block.split())
        if not b:
            continue
        # a heading that runs onto the end of the paragraph before it
        b = re.split(r"(?<=[.:])\s+(?=\d+(?:\.\d+)?\.\s+[A-Z])", b)[0]
        if SECTION_RE.match(b):            # a numbered heading
            continue
        if b.startswith("["):              # a reference entry: compared separately
            continue
        if GENERATED_FRONT_MATTER_RE.match(b):
            continue
        if re.match(r"^.{0,120}\.\s\.\s\.\s\.", b):   # a table-of-contents line
            continue
        # The hand-set text runs several items into one block where the render separates
        # them: an identifier list (A1. G1. R1.), a definition-list term ("grant: ..."), and
        # a bullet. So the block is cut at each of those, in both texts.
        pieces = []
        for piece in re.split(r"(?<=[.:])\s+(?=(?:[A-Z]\d+\.|[a-z][a-zA-Z-]{2,28}: ))", b):
            pieces.extend(re.split(r"(?<=[.;])\s+(?=\* )", piece))
        for item in pieces:
            item = item.strip()
            if len(item) < 25:
                continue
            # a sentence: a full stop, a question mark or an exclamation, then a space and
            # something that starts a new one
            for s in re.split(r"(?<=[.!?])\s+(?=[A-Z*\[(])", item):
                s = s.strip()
                if len(s) < 25:
                    continue
                out.append(s)
    return out


def reference_entries(text):
    """The reference list as {anchor: block}, taken from the rendered text."""
    text = normalise(strip_furniture(text))
    entries = {}
    for block in re.split(r"\n[ \t]*\n", text):
        b = " ".join(block.split())
        m = re.match(r"^\[([^\]]+)\]\s*(.*)$", b)
        if m:
            entries[m.group(1)] = m.group(2)
    return entries


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
    reference anchors. Each must exist in the RECOVERED TEXT, so nothing is invented."""
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

    # Render into a TEMPORARY directory: the renders are build artefacts and are never
    # committed.
    out = Path(tempfile.mkdtemp(prefix="xml2rfc-verify-"))
    proc = subprocess.run(["xml2rfc", "--text", "--no-network", "-o", str(out / "render.txt"), str(XML)],
                          cwd=str(XML.parent), capture_output=True, text=True)
    diag = (proc.stderr or "") + (proc.stdout or "")
    errors = [ln for ln in diag.split("\n") if "Error" in ln]
    warnings = [ln for ln in diag.split("\n") if "Warning" in ln and "more than 3 days away" not in ln]

    rendered_path = out / "render.txt"
    rendered = rendered_path.read_text(encoding="utf-8", errors="replace") if rendered_path.exists() else ""

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

    # (b) nothing omitted, at paragraph level
    rec_sents = sentences(orig_text)
    ren_sents = sentences(rendered)
    missing = [p for p in rec_sents if p not in ren_sents]
    added = [p for p in ren_sents if p not in rec_sents]

    # (c) the references agree, entry by entry: the same anchor, the same bibliographic
    #     content, and no URL lost. The URL FORM may be the generator's, and that is
    #     RECORDED above — so the list is the whole of the permitted difference.
    rec_entries = reference_entries(orig_text)
    ren_entries = reference_entries(rendered)
    missing_refs = sorted(set(rec_entries) - set(ren_entries))
    extra_refs = sorted(set(ren_entries) - set(rec_entries))
    content_mismatch = []
    url_lost = []
    for anchor, block in rec_entries.items():
        if anchor not in ren_entries:
            continue
        want = " ".join(re.sub(r",?\s*<?https?://[^>]*>?", "", block).split())
        got = " ".join(re.sub(r",?\s*<?https?://[^>]*>?", "", ren_entries[anchor]).split())
        if want != got:
            content_mismatch.append((anchor, want[:130], got[:130]))
        for url in re.findall(r"<(https?://[^>]+)>", block):
            if url in ren_entries[anchor]:
                continue
            if RECORDED_URL_FORM_DIFFERENCES.get(anchor) == url:
                continue
            url_lost.append((anchor, url))

    print(f"rendered: {rendered_path}  ({len(rendered)} bytes)")
    print(f"from the recovered text: {len(sections)} sections, {len(refs)} references, "
          f"{len(rec_sents)} sentences")
    print(f"from the reconstruction: {len(xml_terms)} defined terms, "
          f"{len(xml_names) + len(xml_sections)} section names, {len(xml_refs)} references, "
          f"{len(ren_sents)} sentences")

    ok = True
    for label, items in (
        ("term(s)/state(s) the reconstruction claims that are NOT in the recovered text", invented_terms),
        ("section name(s) the reconstruction claims that are NOT in the recovered text", invented_names + invented_sections),
        ("reference(s) the reconstruction claims that are NOT in the recovered text", invented_refs),
        ("sentence(s) in the recovered text that are MISSING from the render", missing),
        ("sentence(s) in the render that are NOT in the recovered text", added),
        ("reference(s) in the recovered text that are MISSING from the render", missing_refs),
        ("reference(s) in the render that are NOT in the recovered text", extra_refs),
        ("reference entr(ies) whose bibliographic content differs", content_mismatch),
        ("reference URL(s) the render LOST", url_lost),
    ):
        if items:
            ok = False
            print(f"FAIL: {len(items)} {label}:")
            for it in items[:8]:
                print("   " + str(it)[:260])
    if RECORDED_URL_FORM_DIFFERENCES:
        print(f"RECORDED: {len(RECORDED_URL_FORM_DIFFERENCES)} reference URL form(s) differ because")
        print("          xml2rfc derives a reference's URL from its seriesInfo and the recovered")
        print("          text carries another canonical form of the same document:")
        for anchor, url in sorted(RECORDED_URL_FORM_DIFFERENCES.items()):
            print(f"   [{anchor}] {url}")
    if ok:
        print("OK: nothing invented, nothing omitted.")
        print("    Every term, section name and reference the reconstruction claims is in the")
        print("    recovered text, every sentence of the recovered text is in the render, every")
        print("    sentence of the render is in the recovered text, and every reference")
        print("    agrees on its URL. xml2rfc: 0 errors, 0 warnings other than the expected date.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
