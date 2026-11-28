#!/usr/bin/env python3
"""Offline comparison of captured EUR-Lex HTML, not legal interpretation or a detector migration."""
import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path

MAX_BYTES = 32 * 1024 * 1024
ROUTES = {"ai-act": ("2024/1689", "32024R1689"),
          "gdpr": ("2016/679", "32016R0679"),
          "machinery": ("2023/1230", "32023R1230")}
MARKERS = {"tit_1", "pbl_1", "art_1", "art_2"}

def digest(data):
    return hashlib.sha256(data).hexdigest()

class Region(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text = text
        self.lines = [0]
        self.lines.extend(i+1 for i,c in enumerate(text) if c == "\n")
        self.depth = 0
        self.start = self.end = None
        self.roots = 0
        self.identity = []
        self.languages = []
        self.markers = {}
        self.feed(text)
        self.close()

    def source_offset(self):
        line, col = self.getpos()
        return self.lines[line-1] + col

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        ids = [v for k,v in attrs if k == "id"]
        if tag == "html":
            self.languages.append([v for k,v in attrs if k == "lang"])
        if tag == "meta" and a.get("property") == "eli:id_local":
            if len(a) != len(attrs):
                raise ValueError("AMBIGUOUS_IDENTITY")
            self.identity.append((a.get("about"), a.get("content")))
        if "document1" in ids:
            self.roots += 1
            if len(ids) != 1 or tag != "div" or self.depth or self.start is not None:
                raise ValueError("AMBIGUOUS_REGION")
            self.start = self.source_offset()
            self.depth = 1
        elif self.depth:
            for value in ids:
                if value in MARKERS:
                    self.markers[value] = self.markers.get(value, 0) + 1
            if tag == "div":
                self.depth += 1

    def handle_startendtag(self, tag, attrs):
        if tag == "div":
            raise ValueError("SELF_CLOSING_DIV")
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if self.depth and tag == "div":
            self.depth -= 1
            if self.depth == 0:
                self.end = self.text.index(">", self.source_offset()) + 1

def fingerprint(data, instrument):
    if not data or len(data) > MAX_BYTES:
        raise ValueError("CAPTURE_SIZE")
    text = data.decode("utf-8", errors="strict")
    eli, celex = ROUTES[instrument]
    p = Region(text)
    expected = ("http://data.europa.eu/eli/reg/" + eli + "/oj", celex)
    if p.identity != [expected] or p.languages != [["en"]]:
        raise ValueError("WRONG_OR_AMBIGUOUS_IDENTITY")
    if p.roots != 1 or p.depth or p.start is None or p.end is None:
        raise ValueError("REGION_INCOMPLETE")
    if p.markers != {key: 1 for key in MARKERS}:
        raise ValueError("DOCUMENT_MARKERS_MISSING_OR_AMBIGUOUS")
    region = text[p.start:p.end].encode("utf-8")
    return {"capture_sha256": digest(data), "capture_bytes": len(data),
            "region_sha256": digest(region), "region_bytes": len(region)}

def compare(a, b, instrument):
    first, second = fingerprint(a, instrument), fingerprint(b, instrument)
    whole = first["capture_sha256"] == second["capture_sha256"]
    region = first["region_sha256"] == second["region_sha256"]
    return {"instrument": instrument, "expected_celex": ROUTES[instrument][1],
            "requested_source": "https://eur-lex.europa.eu/eli/reg/" + ROUTES[instrument][0] + "/oj",
            "first": first, "second": second,
            "whole_capture_equal": whole, "document_region_equal": region,
            "state": ("CAPTURES_IDENTICAL" if whole else
                      "OUTSIDE_REGION_DRIFT_OBSERVED" if region else "REGION_DRIFT_OBSERVED"),
            "legal_change_verified": False, "canonical_fingerprint_changed": False}

def read_capture(path):
    with Path(path).open("rb") as handle:
        data = handle.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("CAPTURE_SIZE")
    return data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("instrument", choices=ROUTES)
    parser.add_argument("first")
    parser.add_argument("second")
    args = parser.parse_args()
    print(json.dumps(compare(read_capture(args.first), read_capture(args.second), args.instrument),
                     indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
