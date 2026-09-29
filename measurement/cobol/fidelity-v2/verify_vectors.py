#!/usr/bin/env python3
"""Independent check of the golden corpus. Usage: verify_vectors.py <corpus_dir> <out.json>

Part A re-derives every expected value from the record bytes with a reference decoder written
separately from gen_corpus.py (it reads only expected.json, the .cpy texts and the .bin files; it
parses PICTURE strings itself, decodes text with the stdlib codecs rather than the generator's hand
tables, converts hexadecimal floating point by exact integer arithmetic and Decimal division, and
walks RDW files on its own). Every must-fail control must be refused by the reference decoder.
Part B recomputes field offsets from the copybook TEXT (its own parser and its own implementation
of the LR slack-byte rules) for every copybook without OCCURS DEPENDING ON or REDEFINES.
Part C checks the generator's encoders against vectors printed in IBM documentation.
Exit status 1 on any disagreement. Nothing here is a decoder under test."""
import json, os, re, sys
from decimal import Decimal, localcontext, Inexact, getcontext

getcontext().prec = 4000       # every value here is exact; never let the context round

CORPUS, OUTP = sys.argv[1], sys.argv[2]
EXP = json.load(open(os.path.join(CORPUS, "expected.json")))
fails = []; stats = {"fields_checked": 0, "values_equal": 0, "mustfail_refused": 0, "offset_checks": 0, "rdw_files": 0,
                     "rdw_records_equal": 0, "rdw_framing_errors_at_expected_index": 0, "anchors": 0}


class Invalid(Exception):
    pass


# ------------------------------------------------------------------ PICTURE parsing (independent)
def expand(p):
    return re.sub(r"([X9NP])\((\d+)\)", lambda m: m.group(1) * int(m.group(2)), p)


def parse_clause(pic):
    t = pic.split()
    if t[0] in ("COMP-1", "COMP-2"):
        return {"cat": "float", "n": 4 if t[0] == "COMP-1" else 8}
    p = expand(t[1]); rest = " ".join(t[2:])
    m = {"signed": p.startswith("S"), "rest": rest}
    body = p[1:] if m["signed"] else p
    if "N" in body: return dict(m, cat="ntext", n=body.count("N"))
    if "X" in body: return dict(m, cat="text", n=body.count("X"))
    m["digits"] = body.count("9")
    if "V" in body:
        after = body.split("V")[1]
        m["exp10"] = -(after.count("P") + after.count("9"))
    else:
        m["exp10"] = body.count("P")
    if "USAGE NATIONAL" in rest: m["cat"] = "ndec"
    elif "COMP-3" in rest: m["cat"] = "packed"
    elif "COMP-5" in rest: m["cat"] = "comp5"
    elif re.search(r"\b(COMP|COMP-4|BINARY)\b", rest): m["cat"] = "binary"
    else: m["cat"] = "zoned"
    m["sep"] = "LEADING SEPARATE" if "LEADING SEPARATE" in rest else "TRAILING SEPARATE" if "TRAILING SEPARATE" in rest else None
    m["leading"] = "SIGN LEADING" in rest and not m["sep"]
    return m


def storage(m):
    c = m["cat"]
    if c == "float": return m["n"]
    if c == "text": return m["n"]
    if c == "ntext": return 2 * m["n"]
    if c == "ndec": return 2 * (m["digits"] + (1 if m["signed"] else 0))
    if c == "packed": return m["digits"] // 2 + 1
    if c in ("binary", "comp5"): return 2 if m["digits"] <= 4 else 4 if m["digits"] <= 9 else 8
    return m["digits"] + (1 if m["sep"] else 0)


def scaled(n, m):
    return Decimal(n).scaleb(m["exp10"])


# ------------------------------------------------------------------ reference decoders
def dec_zoned(b, m):
    sign = 1; digs = list(b)
    if m["sep"]:
        s = digs.pop(0) if m["sep"].startswith("LEADING") else digs.pop()
        if s == 0x60: sign = -1
        elif s != 0x4E: raise Invalid("separate sign byte %02X" % s)
    signpos = None if (m["sep"] or not m["signed"]) else (0 if m["leading"] else len(digs) - 1)
    n = 0
    for i, x in enumerate(digs):
        z, d = x >> 4, x & 15
        if d > 9: raise Invalid("digit nibble")
        if i == signpos:
            if z < 0xA: raise Invalid("sign zone")
            if z in (0xB, 0xD): sign = -1
        elif z != 0xF: raise Invalid("zone not F")
        n = n * 10 + d
    return scaled(sign * n, m)


def dec_packed(b, m):
    nibs = [x for y in b for x in (y >> 4, y & 15)]
    s = nibs.pop()
    if s < 0xA: raise Invalid("sign nibble")
    if any(d > 9 for d in nibs): raise Invalid("digit nibble")
    n = int("".join(map(str, nibs)))
    return scaled(-n if s in (0xB, 0xD) else n, m)


def dec_float(b):
    neg = b[0] >> 7; ch = b[0] & 0x7F; frac = int.from_bytes(b[1:], "big"); k = 2 * len(b) - 2
    e = ch - 64 - k                         # value = frac * 16^e
    with localcontext() as ctx:
        ctx.prec = 4000; ctx.traps[Inexact] = True
        v = Decimal(frac) * (Decimal(16) ** e) if e >= 0 else Decimal(frac) / (Decimal(16) ** -e)
    return -v if neg and frac else v


def dec_ndec(b, m):
    s = b.decode("utf-16-be")                  # strict
    sign = 1
    if m["signed"]:
        c = s[0] if m["sep"].startswith("LEADING") else s[-1]
        s = s[1:] if m["sep"].startswith("LEADING") else s[:-1]
        if c == "-": sign = -1
        elif c != "+": raise Invalid("national sign %r" % c)
    if not s or any(ch not in "0123456789" for ch in s): raise Invalid("national digit")
    return scaled(sign * int(s), m)


def ref_decode(b, pic, cp):
    m = parse_clause(pic)
    c = m["cat"]
    if c == "text": return b.decode(cp).rstrip(" ")
    if c == "ntext": return b.decode("utf-16-be").rstrip(" ")
    if c == "float": return dec_float(b)
    if c == "zoned": return dec_zoned(b, m)
    if c == "packed": return dec_packed(b, m)
    if c in ("binary", "comp5"): return scaled(int.from_bytes(b, "big", signed=m["signed"]), m)
    if c == "ndec": return dec_ndec(b, m)
    raise ValueError(c)


def check_field(rid, k, f, data, cp):
    stats["fields_checked"] += 1
    b = data[f["offset"]:f["offset"] + f["length"]]
    assert len(b) == f["length"] == storage(parse_clause(f["pic"])), (rid, k)
    try:
        v = ref_decode(b, f["pic"], cp)
    except (Invalid, UnicodeDecodeError) as e:
        if f["expect"] == "REJECT": stats["mustfail_refused"] += 1
        else: fails.append("A %s %s: reference refused a valid field (%s)" % (rid, k, e))
        return
    if f["expect"] == "REJECT":
        fails.append("A %s %s: must-fail control decoded by the reference as %r" % (rid, k, v)); return
    ok = (v == Decimal(f["value"])) if f["expect"] == "NUMBER" else (v == f["value"].rstrip(" "))
    if ok: stats["values_equal"] += 1
    else: fails.append("A %s %s: reference %r != expected %r" % (rid, k, v, f["value"]))


# ------------------------------------------------------------------ A. values
for cb in EXP["copybooks"]:
    if cb["framing"] == "fixed":
        for r in cb["records"]:
            data = open(os.path.join(CORPUS, r["file"]), "rb").read()
            assert data.hex() == r["hex"]
            cp = r["declared_codepage"]
            for k, f in sorted(r["fields"].items()): check_field(r["id"], k, f, data, cp)
    else:
        for fl in cb["files"]:
            stats["rdw_files"] += 1
            data = open(os.path.join(CORPUS, fl["file"]), "rb").read()
            recs = [r for r in cb["records"] if r["file_id"] == fl["id"]]
            pos = 0; out = []; err = None
            while pos < len(data):                     # independent RDW walk (DFSMS rules)
                if len(data) - pos < 4: err = "short RDW"; break
                ll = int.from_bytes(data[pos:pos + 2], "big")
                if ll < 4: err = "LL<4"; break
                if data[pos + 2:pos + 4] != b"\0\0": err = "bytes 3-4 not zero"; break
                if pos + ll > len(data): err = "LL past end of file"; break
                out.append(data[pos + 4:pos + ll]); pos += ll
            for i, r in enumerate(recs):
                if r["must_fail"]:
                    if err and len(out) == i: stats["rdw_framing_errors_at_expected_index"] += 1; stats["mustfail_refused"] += 1
                    else: fails.append("A %s: expected a framing error at record %d, walker got %d records, err=%s" % (fl["id"], i + 1, len(out), err))
                    continue
                if i >= len(out) or out[i].hex() != r["hex"]:
                    fails.append("A %s record %d bytes differ" % (fl["id"], i + 1)); continue
                stats["rdw_records_equal"] += 1
                for k, f in sorted(r["fields"].items()): check_field(r["id"], k, f, out[i], r["declared_codepage"])


# ------------------------------------------------------------------ B. offsets from the copybook text
def parse_cpy(text):
    ents = []; buf = ""
    for ln in text.splitlines():
        if len(ln) > 6 and ln[6] == "*": continue
        buf += " " + ln[7:72].strip()
        if buf.rstrip().endswith("."):
            ents.append(buf.strip().rstrip(".").strip()); buf = ""
    items = []
    for e in ents:
        t = e.split()
        lvl, name, rest = int(t[0]), t[1], " ".join(t[2:])
        it = {"lvl": lvl, "name": name, "rest": rest, "kids": []}
        it["redef"] = "REDEFINES" in rest; it["odo"] = "DEPENDING" in rest
        mo = re.search(r"OCCURS (\d+) TIMES", rest); it["occurs"] = int(mo.group(1)) if mo and not it["odo"] else 1
        it["sync"] = bool(re.search(r"\bSYNC\b", rest))
        mp = re.search(r"(PIC \S+.*|COMP-1.*|COMP-2.*)$", rest)
        it["clause"] = mp.group(1) if mp else None
        items.append(it)
    root = items[0]; stack = [root]
    for it in items[1:]:
        while stack[-1]["lvl"] >= it["lvl"]: stack.pop()
        stack[-1]["kids"].append(it); stack.append(it)
    return root


def align(it, inherited):
    if not (it["sync"] or inherited) or not it["clause"]: return 0
    m = parse_clause(it["clause"].replace(" SYNC", ""))
    if m["cat"] in ("binary", "comp5"): return 2 if m["digits"] <= 4 else 4
    if m["cat"] == "float": return m["n"]
    return 0


def layout(g, pos, inh, idx, out):
    """LR 'Slack bytes within records': returns (end offset of one occurrence, largest m)."""
    M = 0
    for k in g["kids"]:
        if k["clause"] is None:                       # group
            start = pos
            end, m = layout(k, pos, inh or k["sync"], idx + ([1] if k["occurs"] > 1 else []), out)
            size = end - start
            if k["occurs"] > 1:
                if m and size % m: size += m - size % m
                for r in range(2, k["occurs"] + 1):     # later occurrences: same relative offsets
                    sub = {}
                    layout(k, start + (r - 1) * size, inh or k["sync"], idx + [r], sub)
                    out.update(sub)
            pos = start + size * k["occurs"]; M = max(M, m)
        else:
            a = align(k, inh)
            if a and pos % a: pos += a - pos % a
            key = k["name"] + ("(%s)" % ",".join(map(str, idx)) if idx else "")
            out[key] = pos
            pos += storage(parse_clause(k["clause"].replace(" SYNC", ""))); M = max(M, a)
    return pos, M


for cb in EXP["copybooks"]:
    text = open(os.path.join(CORPUS, cb["copybook"])).read()
    root = parse_cpy(text)
    def flat(it): return [it] + [x for k in it["kids"] for x in flat(k)]
    if any(i["redef"] or i["odo"] for i in flat(root)): continue
    offs = {}
    end, _ = layout(root, 0, root["sync"], [], offs)
    if end != cb["max_record_length"]:
        fails.append("B %s: record length %d from text, %d from generator" % (cb["id"], end, cb["max_record_length"]))
    for r in cb["records"]:
        for k, f in r["fields"].items():
            if f.get("record_level"): continue
            stats["offset_checks"] += 1
            if offs.get(k) != f["offset"]:
                fails.append("B %s %s: offset %s from text, %s from generator" % (r["id"], k, offs.get(k), f["offset"]))


# ------------------------------------------------------------------ C. published IBM vectors
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_corpus as g  # noqa: E402  (the generator's encoders are what is being checked here)
ANCHORS = [
 ("PG numeric table: COMP-1 +1234", g.hfp_encode(1234, 4), "434D2000"),
 ("PG numeric table: COMP-1 -1234", g.hfp_encode(-1234, 4), "C34D2000"),
 ("PG numeric table: COMP-2 +1234", g.hfp_encode(1234, 8), "434D200000000000"),
 ("PG numeric table: COMP-2 -1234", g.hfp_encode(-1234, 8), "C34D200000000000"),
 ("PG numeric table: PIC 9999 NATIONAL 1234", g.enc_national_decimal(g.ND("A", 4), 1234), "0031003200330034"),
 ("PG numeric table: PIC S9999 NATIONAL SIGN LEADING SEPARATE +1234",
  g.enc_national_decimal(g.ND("A", 4, signed=True, mode="leading_sep"), 1234), "002B0031003200330034"),
 ("PG numeric table: PIC S9999 NATIONAL SIGN LEADING SEPARATE -1234",
  g.enc_national_decimal(g.ND("A", 4, signed=True, mode="leading_sep"), -1234), "002D0031003200330034"),
 ("PG numeric table: PIC S9999 NATIONAL SIGN TRAILING SEPARATE +1234",
  g.enc_national_decimal(g.ND("A", 4, signed=True, mode="trailing_sep"), 1234), "0031003200330034002B"),
 ("PG numeric table: PIC S9999 NATIONAL SIGN TRAILING SEPARATE -1234",
  g.enc_national_decimal(g.ND("A", 4, signed=True, mode="trailing_sep"), -1234), "0031003200330034002D"),
 ("PG numeric table: PIC S9999 COMP-5 +12345", g.enc_binary(g.B("A", 4, usage="COMP-5"), 12345), "3039"),
 ("PG numeric table: PIC S9999 COMP-5 -12345", g.enc_binary(g.B("A", 4, usage="COMP-5"), -12345), "CFC7"),
 ("PG numeric table: PIC 9999 COMP-5 60000", g.enc_binary(g.B("A", 4, signed=False, usage="COMP-5"), 60000), "EA60"),
]
for name, got, want in ANCHORS:
    if got.hex().upper() == want: stats["anchors"] += 1
    else: fails.append("C %s: generator %s, published %s" % (name, got.hex().upper(), want))
# LR slack-byte examples: 1 slack byte before FIELD-E (offset 8); 2 before COMP-PAY (offset 4 in an occurrence starting at 1),
# 2 at the end of each 16-byte occurrence.
lr = {"c47_sync_ibm_ex1": {"C47-E": 8}, "c48_sync_occurs": {"C48-PAY(1)": 4, "C48-HOURS(1)": 8, "C48-NAME(1)": 10, "C48-TYPE(2)": 17,
                                                               "C48-PAY(2)": 20, "C48-END": 49}}
for cb in EXP["copybooks"]:
    for k, want in lr.get(cb["id"], {}).items():
        got = cb["records"][0]["fields"][k]["offset"]
        if got == want: stats["anchors"] += 1
        else: fails.append("C LR example %s %s: offset %d, LR gives %d" % (cb["id"], k, got, want))

res = {"ok": not fails, "stats": stats, "failures": fails}
json.dump(res, open(OUTP, "w"), indent=1, sort_keys=True)
print(json.dumps({"ok": res["ok"], **stats}))
sys.exit(0 if not fails else 1)
