#!/usr/bin/env python3
"""Renders REPORT.md from corpus/expected.json, decoders.json, results.jsonl and work/*.json. No number is typed by hand.
Corpus v2 edition: the v2 constructs lead; the v1 hazards are carried in the same tables."""
import hashlib, json, os, sys
from collections import defaultdict, Counter

LANE = sys.argv[1]
P = lambda *a: os.path.join(LANE, *a)
EXP = json.load(open(P("corpus/expected.json")))
DEC = json.load(open(P("decoders.json")))
SUM = json.load(open(P("work/summary.json")))
SELF = json.load(open(P("work/self_check.json")))
VV = json.load(open(P("work/verify_vectors.json")))
ROWS = [json.loads(l) for l in open(P("results.jsonl"))]
DIDS = [d["id"] for d in DEC["measured"]]
DMAP = {d["id"]: d for d in DEC["measured"]}
RDW_DIDS = [d for d in DIDS if "entry" in DMAP[d]["rdw"]]
VERD = ["MATCH", "MISMATCH", "REJECTED", "FLAGGED", "UNSUPPORTED", "ERROR"]
ABBR = ["M", "MM", "R", "F", "U", "E"]
V2 = lambda cid: int(cid[1:3]) > 41
HAZ2 = [("hfp_float", "COMP-1/COMP-2 hexadecimal floating point: published vector 1234, normalized values, 0.1 rounded"),
        ("hfp_range", "COMP-1/COMP-2 beyond IEEE-754: range beyond binary32, 55/56-bit fractions beyond binary64"),
        ("hfp_unnormalized", "COMP-1/COMP-2 unnormalized fraction, negative zero, zero fraction with non-zero exponent"),
        ("sync", "SYNCHRONIZED: slack bytes for binary/COMP-1/COMP-2, in subgroups, inside OCCURS, level-01 SYNC, SYNC with no effect"),
        ("national_text", "PIC N national text (UTF-16BE): Latin, CJK, Greek; explicit USAGE NATIONAL and implicit"),
        ("national_surrogate", "PIC N supplementary characters (surrogate pairs)"),
        ("national_decimal", "national decimal: 9(n) USAGE NATIONAL, SIGN LEADING/TRAILING SEPARATE, implied decimals"),
        ("rdw", "RDW files: one layout, and ODO-driven record lengths"),
        ("rdw_short_record", "RDW files: records that end after a shorter REDEFINES variant"),
        ("mustfail_national", "MUST-FAIL: national decimal holding 'A', EBCDIC zoned bytes, '*' or an EBCDIC minus as sign"),
        ("mustfail_national_text", "MUST-FAIL: PIC N holding an unpaired surrogate (reject, or flag with U+FFFD)"),
        ("mustfail_rdw", "MUST-FAIL: RDW length 3, spanned segments in a non-spanned file, last RDW past end of file"),
        ("rdw_mustfail_sibling", "valid records sharing an RDW file with a must-fail record"),
        ("mustfail_sibling", "valid fields sharing a record with a must-fail control (v1 and v2)")]
HAZ1 = [("comp3", "COMP-3 packed decimal"), ("sign_nibble", "sign nibbles A/B/E/F, negative zero"),
        ("zoned_overpunch", "zoned decimal: overpunch, SIGN SEPARATE"), ("implied_decimal", "implied decimals: V, P scaling"),
        ("binary", "COMP/COMP-4/BINARY"), ("binary_truncation", "COMP-5 beyond the PICTURE digits"),
        ("codepage", "code pages cp037 / cp500 / cp1140"), ("redefines", "REDEFINES"), ("odo", "OCCURS DEPENDING ON"),
        ("baseline", "baseline: nested OCCURS, FILLER, mixed record"), ("mustfail_packed", "MUST-FAIL: packed"),
        ("mustfail_zoned", "MUST-FAIL: zoned"), ("mustfail_codepage", "MUST-FAIL: ASCII declared as cp037")]


def esc(s, n=34):
    if s is None: return "null"
    s = "".join(c if 32 <= ord(c) < 127 or c in "¬¢€¤éñüßΩμέγα日本語" else "\\u%04x" % ord(c) for c in str(s))
    if len(s) > n: s = s[:n - 1] + "…"
    return s.replace("|", "\\|").replace("`", "'")


def shortnum(k, n=26):
    from decimal import Decimal, InvalidOperation
    try:
        d = Decimal(k)
    except (InvalidOperation, ValueError):
        return esc(k, n)
    if len(k) <= n or not d.is_finite(): return esc(k, n)
    return "{:.6E}".format(d)


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


out = []
w = out.append
c = SUM["counts"]
v2books = [cb for cb in EXP["copybooks"] if V2(cb["id"])]
v2rows = [r for r in ROWS if V2(r["copybook"])]
v2fields = sum(len(r["fields"]) for cb in v2books for r in cb["records"])
w("# COBOL copybook decoder fidelity — corpus v2: COMP-1/COMP-2, SYNC, NATIONAL, RDW")
w("")
w("Council of AI (CSOAI) measurement lane `cobol-v2-20260928`, extending lane `cobol-fidelity-20260928` (corpus v1). "
  "**Measurement only**: this report states what each decoder emitted for bytes whose meaning is known by construction. "
  "It is not a rating or ranking of any decoder, and it fixes nothing. It has not been published and no maintainer has "
  "been contacted.")
w("")
w("## What was measured")
w("")
w("Corpus v2 keeps the %d v1 copybooks byte-for-byte and adds **%d copybooks** for four constructs v1 left out: "
  "COMP-1/COMP-2 (IBM hexadecimal floating point), SYNCHRONIZED slack bytes, USAGE NATIONAL (UTF-16 text and national "
  "decimal) and RDW-prefixed variable-length files. In total: **%d copybooks, %d records (%d of them in %d RDW files) and "
  "%d compared fields**, CC0-1.0, in `corpus/`. The v2 part alone is %d records and %d compared fields."
  % (c["copybooks_v1"], c["copybooks_v2"], c["copybooks"], c["records"],
     sum(len(cb["records"]) for cb in EXP["copybooks"] if cb["framing"] == "rdw"), c["rdw_files"], c["compared_fields"],
     sum(len(cb["records"]) for cb in v2books), v2fields))
w("")
w("**%d decoder configurations** produced **%d (decoder, record, field) results** in `results.jsonl` (%d on v2 copybooks). "
  "RDW files were given only to the decoders that have an RDW reader; the others are UNMEASURED for RDW (below)."
  % (c["decoders_measured"], c["rows"], len(v2rows)))
base = P("v1-baseline/results.jsonl")
if os.path.exists(base):
    v1l = open(base).read().splitlines()
    v2l = [l for l in open(P("results.jsonl")).read().splitlines() if not V2(json.loads(l)["copybook"])]
    same = v1l == v2l
    w("")
    w("**v1 regression:** the %d rows this run produced for copybooks c01-c41 are %s the %d rows of the v1 run "
      "(`v1-baseline/results.jsonl`, sha256 `%s`)."
      % (len(v2l), "byte-identical to" if same else "NOT identical to", len(v1l), sha(base)))
w("")
w("## Independent check of the corpus")
w("")
s = VV["stats"]
w("`verify_vectors.py` runs before any decoder and stops the run on any disagreement (`work/verify_vectors.json`, "
  "result: **%s**)." % ("all checks agree" if VV["ok"] else "DISAGREEMENTS"))
w("")
w("- **Values:** a reference decoder written separately from the generator (its own PICTURE parser; stdlib code-page and "
  "UTF-16 codecs instead of the generator's hand tables; exact integer/Decimal arithmetic for hexadecimal floating point) "
  "re-derived %d of %d field values from the bytes, and refused all %d must-fail controls (including %d RDW framing "
  "errors, found at the expected record by its own RDW walker; %d valid RDW records matched byte for byte)."
  % (s["values_equal"], s["fields_checked"] - s["mustfail_refused"] + s["rdw_framing_errors_at_expected_index"],
     s["mustfail_refused"], s["rdw_framing_errors_at_expected_index"], s["rdw_records_equal"]))
w("- **Offsets:** field offsets were recomputed from the copybook *text* with its own implementation of the LR "
  "slack-byte rules for every copybook without ODO or REDEFINES: %d offsets checked." % s["offset_checks"])
w("- **Published vectors:** %d checks against bytes printed in IBM documentation — the PG numeric table (COMP-1/COMP-2 "
  "+/-1234, national decimal with and without SIGN SEPARATE, COMP-5) and the offsets of the two LR slack-byte examples "
  "(reproduced as c47 and c48)." % s["anchors"])
w("- While the corpus was being built this check found one generator defect (the exact decimal of 2^-260 was rounded to "
  "80 digits by `Decimal.scaleb`); it was fixed before this run. An injected wrong offset, a wrong expected float and a "
  "must-fail control relabelled as valid were each caught.")
w("")
w("## Method")
w("")
w("1. **Corpus by construction.** `gen_corpus.py` defines each copybook as data, writes the copybook text from it, and "
  "encodes values chosen in the script with its own encoder (hand-written code-page tables, nibble/zone/binary packing, "
  "UTF-16 surrogate arithmetic, hexadecimal floating point from exact fractions; no decoder under test and no codec is "
  "used to produce bytes — codecs only cross-check and abort the build on disagreement). The expected value of every "
  "field is the value that was encoded; for COMP-1/COMP-2 it is the exact value the bytes hold.")
w("2. **Framing.** Fixed-length copybooks: one record per `.bin` file; record length = file length. RDW copybooks: one "
  "file of several RDW-prefixed records; decoded records are matched to expected records by position. A must-fail RDW "
  "record is compared as a whole (`*RECORD*`).")
w("3. **Configuration.** Each decoder is driven through its documented public entry point and told the record's code "
  "page where it has a parameter for it, and the RDW convention (big-endian, length includes the RDW) where it has "
  "options for it.")
w("4. **Comparison.** Numbers by exact decimal value; text after removing trailing spaces. COMP-1/COMP-2 only: a "
  "rendering that is not the exact decimal also matches when the digits parse to the IEEE-754 binary64 value that "
  "equals the field's value exactly (a decoder that prints a double with shortest round-trip digits); a field whose "
  "value binary64 cannot hold cannot match that way, and such rows say so.")
w("5. **Verdicts.** MATCH; MISMATCH; REJECTED (error or null for the field, the record or the whole file); FLAGGED "
  "(a PIC N must-fail control rendered with U+FFFD in place of the ill-formed unit); UNSUPPORTED (the decoder's own "
  "error message says so, or its README or source declares it — quoted below); ERROR (the copybook itself could not "
  "be loaded). ")
w("6. **Expected outcome (`outcome_ok`).** v1 rules unchanged. Added: FLAGGED on a PIC N must-fail control; REJECTED on "
  "an RDW must-fail record; REJECTED on a valid record of an RDW must-fail file only when the whole file was rejected. "
  "A must-fail RDW record that is emitted, or silently absent, is not the expected outcome.")
w("7. **Name mapping.** As in v1 (`_`→`-`, JRecord 0-based subscripts → 1-based, cobolio's innermost-first suffix "
  "reversed, aws_mdu repeats mapped in row-major order).")
w("")
w("## Encoding rules and sources")
w("")
w("LR = IBM Enterprise COBOL for z/OS Language Reference 6.4 (SC27-8713); PG = Programming Guide 6.4 (SC27-8714); "
  "POP = z/Architecture Principles of Operation (SA22-7832); DFSMS = z/OS DFSMS Using Data Sets. The first twelve rows "
  "are v1's.")
w("")
w("| Field type | Rule used by the encoder | Source |")
w("|---|---|---|")
for r in EXP["encoding_rules"]:
    w("| %s | %s | %s |" % (r["field_type"], r["rule"].replace("|", "\\|"), r["source"]))
w("")
w("## Environment")
w("")
w("RunPod pod (Ubuntu 20.04), Eclipse Temurin JDK 17.0.12+7, CPython 3.11.8 (uv-managed venv synced to "
  "`requirements.lock`), Cobrix in Spark local mode (`local[1]`). The same pinned tools as v1 (`setup.sh` verifies "
  "every checksum and commit).")
w("")
w("## Decoders measured")
w("")
w("| id | decoder | version / pin | licence | how it was driven | RDW files |")
w("|---|---|---|---|---|---|")
for d in DEC["measured"]:
    r = d["rdw"]
    w("| `%s` | %s | %s | %s | %s | %s |" % (d["id"], d["label"], d["version"], d["licence"], d["how"].replace("|", "\\|"),
                                       ("driven: " + r["entry"]) if "entry" in r else "**UNMEASURED**: " + r["unmeasured"]))
w("")
w("Declared limitations applied (verbatim from each project's README or source):")
w("")
for d in DEC["measured"]:
    for x in d.get("declared", []):
        w("- `%s` — %s → fields matching `%s%s` are UNSUPPORTED." % (d["id"], x["quote"], x["when"],
                                                                   (" " + ",".join(x["arg"])) if x.get("arg") else ""))
w("")
w("### SELF (sister product; not ranked)")
w("")
sp = DEC["self"][0]
w("`%s` %s — **SELF (sister product; not ranked)**. Kept out of every comparison. Status: **UNMEASURED** — the installed "
  "wheel exposes %d MCP tools (%s); none takes record bytes and a copybook and returns field values "
  "(`has_decode_path`: %s, from `work/self_check.json`)."
  % (sp["label"], sp["version"], len(SELF["mcp_tools"]), ", ".join("`%s`" % t["tool"] for t in SELF["mcp_tools"]),
     str(SELF["has_decode_path"]).lower()))
w("")
w("### UNMEASURED")
w("")
for u in DEC["unmeasured"]:
    w("- **%s** — %s" % (u["name"], u["reason"]))
w("")

# ---- per-hazard matrix
by = defaultdict(lambda: defaultdict(Counter))
for r in ROWS:
    k = by[r["hazard"]][r["decoder"]]; k[r["verdict"]] += 1; k["ok"] += int(r["outcome_ok"]); k["n"] += 1
def cell(h, d):
    k = by[h][d]
    return "%d/%d" % (k["ok"], k["n"]) if k["n"] else "—"
w("## In brief (computed from results.jsonl)")
w("")
w("Per v2 hazard: which configurations reached the expected outcome on every compared field, on some, and on none. "
  "Names are in alphabetical order within each group.")
w("")
for h, desc in HAZ2:
    if h not in by: continue
    have = [d for d in DIDS if by[h][d]["n"]]
    n = max(by[h][d]["n"] for d in have)
    allok = [d for d in have if by[h][d]["ok"] == by[h][d]["n"]]
    none = [d for d in have if by[h][d]["ok"] == 0]
    part = ["%s %d/%d" % (d, by[h][d]["ok"], by[h][d]["n"]) for d in have if 0 < by[h][d]["ok"] < by[h][d]["n"]]
    notrun = [d for d in DIDS if not by[h][d]["n"]]
    w("- **%s** (%d fields): all — %s; some — %s; none — %s%s." % (
        desc, n, ", ".join("`%s`" % d for d in allok) or "no configuration", ", ".join(part) or "none",
        ", ".join("`%s`" % d for d in none) or "no configuration",
        ("; not given the files — " + ", ".join("`%s`" % d for d in notrun)) if notrun else ""))
w("")
w("## Per-hazard results")
w("")
w("Cells: expected outcomes / compared fields; `—` = no rows (RDW files not given to a decoder without an RDW reader). "
  "Columns are in alphabetical order; no ordering of decoders is implied. Counts, not rates.")
w("")
w("| hazard | n fields | " + " | ".join("`%s`" % d for d in DIDS) + " |")
w("|---|---|" + "---|" * len(DIDS))
for grp, H in (("v2", HAZ2), ("v1", HAZ1)):
    for h, desc in H:
        if h not in by: continue
        n = max(by[h][d]["n"] for d in DIDS)
        w("| %s%s | %d | %s |" % ("" if grp == "v2" else "v1 · ", desc, n, " | ".join(cell(h, d) for d in DIDS)))
tot = {d: Counter() for d in DIDS}; tot2 = {d: Counter() for d in DIDS}
for r in ROWS:
    tot[r["decoder"]]["ok"] += int(r["outcome_ok"]); tot[r["decoder"]]["n"] += 1
    if V2(r["copybook"]): tot2[r["decoder"]]["ok"] += int(r["outcome_ok"]); tot2[r["decoder"]]["n"] += 1
w("| **v2 copybooks** | | %s |" % " | ".join("%d/%d" % (tot2[d]["ok"], tot2[d]["n"]) for d in DIDS))
w("| **all** | | %s |" % " | ".join("%d/%d" % (tot[d]["ok"], tot[d]["n"]) for d in DIDS))
w("")
w("Verdict counts on the v2 hazards (M = MATCH, MM = MISMATCH, R = REJECTED, F = FLAGGED, U = UNSUPPORTED, E = ERROR):")
w("")
w("| hazard | " + " | ".join("`%s`" % d for d in DIDS) + " |")
w("|---|" + "---|" * len(DIDS))
for h, desc in HAZ2:
    if h not in by: continue
    w("| %s | %s |" % (h, " | ".join(" ".join("%s%d" % (ab, by[h][d][v]) for v, ab in zip(VERD, ABBR) if by[h][d][v]) or "—"
                                      for d in DIDS)))
w("")

idx = {(r["decoder"], r["record"], r["field"]): r for r in ROWS}
recmap = {r["id"]: r for cb in EXP["copybooks"] for r in cb["records"]}


def obs_cell(r, n=20):
    if r is None: return "—"
    v = r["verdict"]
    if v in ("MATCH", "UNSUPPORTED", "ERROR", "REJECTED", "FLAGGED"): return v
    return "%s `%s`" % (v, esc(r["observed"], n))


def table(title, intro, picks, hexcol=True):
    w("### " + title)
    w("")
    if intro: w(intro); w("")
    w("| record · field | %sPIC | expected | " % ("bytes | " if hexcol else "") + " | ".join("`%s`" % d for d in DIDS) + " |")
    w("|---|---|" + ("---|" if hexcol else "") + "---|" * len(DIDS))
    for rid, f in picks:
        m = recmap[rid]["fields"][f]
        hx = recmap[rid]["hex"][2 * m["offset"]:2 * (m["offset"] + m["length"])].upper() if not m.get("record_level") else m["pic"][4:]
        w("| %s · %s | %s%s | `%s` | %s |" % (rid, f, ("`%s` | " % hx) if hexcol else "", m["pic"], esc(m.get("value", "REJECT"), 26),
                                          " | ".join(obs_cell(idx.get((d, rid, f))) for d in DIDS)))
    w("")


w("## Selected v2 fields, observed vs expected")
w("")
table("COMP-1 / COMP-2", "C44-A/B/F need 55-56 significant bits (binary64 holds 53); C44-C/D/E lie outside binary32's range; "
      "C45-A is unnormalized, C45-C a zero fraction under a non-zero exponent.",
      [("c42_hfp_short_r01", "C42-A"), ("c42_hfp_short_r01", "C42-C"), ("c42_hfp_short_r01", "C42-E"), ("c43_hfp_long_r01", "C43-A"),
       ("c43_hfp_long_r01", "C43-D"), ("c44_hfp_range_r01", "C44-A"), ("c44_hfp_range_r01", "C44-C"), ("c44_hfp_range_r01", "C44-D"),
       ("c44_hfp_range_r01", "C44-E"), ("c45_hfp_unnorm_r01", "C45-A"), ("c45_hfp_unnorm_r01", "C45-C")])
table("SYNCHRONIZED", "Offsets are the LR's: slack bytes are never compared, only the fields after them.",
      [("c46_sync_binary_r01", "C46-H"), ("c46_sync_binary_r01", "C46-D"), ("c46_sync_binary_r02", "C46-F"), ("c47_sync_ibm_ex1_r01", "C47-E"),
       ("c48_sync_occurs_r01", "C48-PAY(2)"), ("c48_sync_occurs_r01", "C48-END"), ("c49_sync_float_r01", "C49-F2"),
       ("c50_sync_noeffect_r01", "C50-H"), ("c51_sync_level01_r01", "C51-F")], hexcol=False)
table("USAGE NATIONAL", "",
      [("c52_nat_text_r01", "C52-A"), ("c64_nat_text_implicit_r01", "C64-A"), ("c52_nat_text_r01", "C52-B"),
       ("c53_nat_surrogate_r01", "C53-A"), ("c65_nat_surrogate_implicit_r01", "C65-A"), ("c54_nat_decimal_r01", "C54-B"),
       ("c54_nat_decimal_r01", "C54-D"), ("c52_nat_text_r01", "C52-D")], hexcol=False)

w("### RDW files: records emitted per file")
w("")
w("Cells: records the reader emitted / RDW frames written; an error the reader raised is quoted. Decoders without an "
  "RDW reader are UNMEASURED here: %s." % ", ".join("`%s`" % d for d in DIDS if d not in RDW_DIDS))
w("")
w("| file | frames | " + " | ".join("`%s`" % d for d in RDW_DIDS) + " |")
w("|---|---|" + "---|" * len(RDW_DIDS))
for cb in EXP["copybooks"]:
    for fl in cb.get("files", []):
        cells = []
        for d in RDW_DIDS:
            x = SUM["rdw_files"].get(d, {}).get(fl["id"], {})
            cells.append("%s/%s%s" % (x.get("emitted", "?"), fl["n_records"], (" — `%s`" % esc(x["error"], 60)) if x.get("error") else ""))
        w("| %s%s | %d | %s |" % (fl["id"], " (must-fail)" if fl["must_fail"] else "", fl["n_records"], " | ".join(cells)))
w("")

import re as _re
errs = Counter()
for r in v2rows:
    if r["verdict"] == "ERROR":
        errs[(r["decoder"], _re.sub(r"(?:at )?(?:line|position) \d+:\d+", "", r["detail"]).replace("  ", " ")[:150])] += 1
if errs:
    w("### Copybook-stage errors on v2 copybooks (ERROR rows)")
    w("")
    w("The copybook text is valid Enterprise COBOL in every case (LR 6.4); these are the decoders' own messages, line and "
      "column numbers removed.")
    w("")
    w("| decoder | message | fields |")
    w("|---|---|---|")
    for (d, msg), n in sorted(errs.items()):
        w("| `%s` | %s | %d |" % (d, esc(msg, 150), n))
    w("")

# ---- must-fail detail (v2)
w("## Must-fail controls (v1 and v2)")
w("")
w("A correct decoder rejects or flags these. MISMATCH means a value or a record was emitted without an error, null or "
  "flag; `—` means the decoder was not given the file (no RDW reader).")
w("")
w("| record · field | PIC / frame | " + " | ".join("`%s`" % d for d in DIDS) + " |")
w("|---|---|" + "---|" * len(DIDS))
for cb in EXP["copybooks"]:
    for rec in cb["records"]:
        for f, m in sorted(rec["fields"].items()):
            if m["expect"] != "REJECT": continue
            w("| %s · %s | %s | %s |" % (rec["id"], f, m["pic"], " | ".join(obs_cell(idx.get((d, rec["id"], f)), 16) for d in DIDS)))
w("")

# ---- disagreements (v2)
D = [x for x in SUM["disagreements"] if V2(x["record"])]
DV = [x for x in D if x["value_disagreement"]]
w("## Where the decoders disagree with each other (v2 fields)")
w("")
w("**Any disagreement** (different values, or a value versus a rejection/absence; UNSUPPORTED and ERROR alone do not "
  "count): **%d of %d** v2 fields. **Value disagreement** (at least two decoders emitted different values for the same "
  "bytes, the case a downstream system cannot detect): **%d of %d** v2 fields, listed below; all v1+v2 disagreements are "
  "in `work/summary.json`." % (len(D), v2fields, len(DV), v2fields))
w("")
hz = Counter(x["hazard"] for x in DV)
if DV:
    w("By hazard: " + ", ".join("%s %d" % (h, hz[h]) for h, _ in HAZ2 if hz[h]) + ".")
    w("")
    w("| record · field | expected | outcome → decoders |")
    w("|---|---|---|")
    for x in DV:
        w("| %s · %s | `%s` | %s |" % (x["record"], x["field"], shortnum(x["expected"], 34),
                                      "; ".join("`%s` → %s" % (shortnum(k), ", ".join(v)) for k, v in x["outcomes"].items())))
    w("")
notes = Counter((r["decoder"], r["detail"]) for r in v2rows if r["verdict"] == "MATCH" and r["detail"])
if notes:
    w("Notes on v2 MATCH rows: " + "; ".join("`%s` %s ×%d" % (d, t, n) for (d, t), n in sorted(notes.items())) + ".")
    w("")
near = Counter(r["decoder"] for r in v2rows if "nearest IEEE-754 binary64" in r["detail"])
if near:
    w("MISMATCH rows where the decoder emitted the nearest binary64 value of a field binary64 cannot hold: " +
      ", ".join("`%s` ×%d" % (d, n) for d, n in sorted(near.items())) + ".")
    w("")
w("## What this measurement cannot establish")
w("")
for t in [
    "It is not a conformance test and says nothing about any decoder outside the %d copybooks here. Still outside the "
    "corpus: edited PICTUREs, DBCS (PIC G), 88-levels, nested ODO, multi-layout segment selection, BDW/VB blocking, "
    "spanned-record assembly (VBS), SYNC combined with REDEFINES or ODO, national-edited items, national floating point, "
    "COMP-1/COMP-2 in IEEE formats, and code pages other than 37/500/1140." % c["copybooks"],
    "The expected values come from IBM's published rules and printed vectors, not from running an IBM compiler; no z/OS "
    "system produced these bytes. Where IBM behaviour depends on compiler options (NUMPROC, NUMCLS, TRUNC, ARITH, "
    "NSYMBOL) the corpus avoids the ambiguous case, states the default it assumes, or accepts both outcomes.",
    "Slack-byte content is undefined in COBOL; two fills (X'00' and X'40') are used and never compared.",
    "A decoder that converts COMP-2 through IEEE binary64 is doing what many consumers want; the corpus records that the "
    "value changed, not that the conversion is wrong for every purpose.",
    "Each decoder was driven the way its documentation shows. A different option set could produce different outcomes. "
    "Cobrix's defaults for RDW (little-endian, payload-only length) were not used; with them IBM RDWs would be misread.",
    "One observation per field. Counts are small and are reported as counts, not rates or scores.",
    "The sister product was not measured: it has no decode path to measure."]:
    w("- " + t)
w("")
w("## Reproduce")
w("")
w("On the pod: `bash run.sh` (add `FRESH=1` to reinstall every tool from its pinned source). The run stops if "
  "`verify_vectors.py` disagrees with the corpus. `results.jsonl` is sorted and contains no timestamps or paths. "
  "`bash check_determinism.sh` runs the whole pipeline twice and records both SHA-256 digests in `determinism.log`. "
  "`make_candidate.py` writes the unsigned record candidate (`candidate/`), state SIGN_PENDING.")
det = P("determinism.log")
if os.path.exists(det):
    w("")
    w("Determinism check (`determinism.log`):")
    w("")
    w("```")
    for l in open(det).read().strip().splitlines()[-4:]: w(l)
    w("```")
w("")
open(P("REPORT.md"), "w").write("\n".join(out) + "\n")
print("REPORT.md written")
