#!/usr/bin/env python3
"""Golden corpus generator for the COBOL copybook decoder-fidelity measurement (corpus v2).

Licence of everything this script writes: CC0-1.0 (public-domain dedication).

v1 (copybooks c01-c41) is carried unchanged: same copybook text, same bytes, same expected values.
v2 adds c42-c66: COMP-1/COMP-2 (IBM hexadecimal floating point), SYNCHRONIZED slack bytes,
USAGE NATIONAL (UTF-16 text and national decimal) and RDW-prefixed variable-length files,
each with must-fail controls where the construct has an invalid form.

Independence: this encoder imports no decoder under test and does not use Python's
EBCDIC or UTF-16 codecs to produce bytes. Character bytes come from the hand-written tables
below (transcribed from the IBM code page charts for CCSID 37, 500 and 1140); UTF-16 code
units and surrogate pairs are computed arithmetically; hexadecimal floating point is built
from exact rational arithmetic (fractions.Fraction). The stdlib codecs are used only as an
after-the-fact cross-check that aborts the build on any disagreement. Expected values are
the values chosen here, by construction. verify_vectors.py re-derives every expected value
from the bytes with a separate reference decoder and checks published IBM vectors.
"""
import json, os, sys, shutil
from decimal import Decimal, getcontext
from fractions import Fraction

getcontext().prec = 80
OUT = sys.argv[1] if len(sys.argv) > 1 else "corpus"

# ---------------------------------------------------------------------------
# Encoding rules, with sources. Rendered into expected.json and REPORT.md.
# LR  = IBM Enterprise COBOL for z/OS Language Reference 6.4 (SC27-8713)
# PG  = IBM Enterprise COBOL for z/OS Programming Guide 6.4 (SC27-8714)
# POP = IBM z/Architecture Principles of Operation (SA22-7832), ch. 8 "Decimal Instructions"
#       and ch. 18 "Hexadecimal-Floating-Point Instructions"
# DFSMS = z/OS DFSMS Using Data Sets, "Record descriptor word (RDW)"
# ---------------------------------------------------------------------------
RULES = [
 ("PIC X(n) DISPLAY", "n bytes, one EBCDIC code point per character, in the code page of the record.",
  "LR, PICTURE clause (symbol X) and USAGE DISPLAY; IBM CDRA code page charts CCSID 37/500/1140"),
 ("PIC 9(n) / S9(n) DISPLAY (zoned decimal)", "n bytes; each byte = zone nibble X'F' + digit nibble. Signed items carry the sign in the zone "
  "nibble of the rightmost byte (default SIGN TRAILING): X'C' positive, X'D' negative; unsigned items keep X'F'. SIGN LEADING moves the "
  "sign zone to the leftmost byte. SIGN ... SEPARATE CHARACTER adds one byte holding '+' (X'4E') or '-' (X'60') and leaves all digit zones X'F'.",
  "LR, USAGE DISPLAY and SIGN clause; PG, 'Examples: numeric data and internal representation'"),
 ("PIC S9(n) COMP-3 / PACKED-DECIMAL", "floor(n/2)+1 bytes; two digit nibbles per byte, most significant first, left-padded with a zero nibble "
  "when n is even; the rightmost nibble is the sign: X'C' positive, X'D' negative, X'F' for unsigned items.",
  "LR, USAGE PACKED-DECIMAL; PG, 'Examples: numeric data and internal representation'"),
 ("Sign nibble codes", "X'A', X'C', X'E', X'F' are valid plus signs and X'B', X'D' valid minus signs; X'0'-X'9' are invalid as a sign and "
  "X'A'-X'F' are invalid as a digit (data exception). A negative zero (digits 0, minus sign) has the numeric value zero.",
  "POP, 'Decimal-number formats' (sign and digit codes); PG, 'Sign representation of zoned and packed-decimal data' (NUMPROC)"),
 ("PIC S9(n) COMP / COMP-4 / BINARY", "two's-complement big-endian binary: 2 bytes for n=1-4, 4 bytes for n=5-9, 8 bytes for n=10-18. "
  "Values in this corpus stay within the PICTURE digit range, so TRUNC(STD) and TRUNC(BIN) agree on them.",
  "LR, USAGE BINARY/COMPUTATIONAL/COMPUTATIONAL-4; POP, fixed-point binary representation (big-endian)"),
 ("PIC S9(n) COMP-5", "same storage size as COMP, but the value may use the full binary capacity of the 2/4/8 bytes regardless of the PICTURE "
  "digit count (e.g. PIC 9(4) COMP-5 holds 0-65535). Unsigned items are unsigned binary.",
  "LR, USAGE COMPUTATIONAL-5 ('native binary')"),
 ("V (implied decimal point)", "V marks an assumed decimal point and occupies no storage; the stored digits are value x 10^scale.",
  "LR, PICTURE clause, symbol V"),
 ("P (decimal scaling position)", "each P is an assumed digit position that occupies no storage. 999PP stores d and means d x 100; VPP999 "
  "stores d and means d x 10^-5.", "LR, PICTURE clause, symbol P"),
 ("REDEFINES", "the redefining entry describes the same storage as the redefined entry; it does not advance the offset of the next item.",
  "LR, REDEFINES clause"),
 ("OCCURS n TIMES", "the entry is repeated n times contiguously.", "LR, OCCURS clause"),
 ("OCCURS m TO n TIMES DEPENDING ON c", "only the current value of c occurrences are present in the record; items that follow the table "
  "start immediately after the last present occurrence (variably located items, 'complex ODO').",
  "LR, OCCURS DEPENDING ON; PG, 'Complex OCCURS DEPENDING ON'"),
 ("Must-fail criterion", "a control field is not NUMERIC under the COBOL class test (invalid digit nibble, invalid sign nibble, or zoned byte "
  "whose zone is not X'F' before the sign position). A correct decoder rejects or flags it instead of emitting a number.",
  "LR, 'Class condition' (NUMERIC); POP, data exception on invalid digit/sign codes"),
 # ---- v2 --------------------------------------------------------------------------------------------------
 ("COMP-1 / COMP-2 (hexadecimal floating point)", "COMP-1 = 4 bytes (short HFP), COMP-2 = 8 bytes (long HFP): bit 0 sign, bits 1-7 "
  "characteristic (exponent + 64, base 16), then a 24-bit (short) or 56-bit (long) fraction; value = (-1)^sign x 0.fraction(hex) x "
  "16^(characteristic-64). Normalized values have a non-zero leading hex digit; unnormalized fractions are still values; a zero "
  "fraction is zero whatever the sign and characteristic. Published vectors: COMP-1 +1234 = X'434D2000', -1234 = X'C34D2000'; "
  "COMP-2 +1234 = X'434D200000000000'.",
  "PG, 'Examples: numeric data and internal representation' (COMP-1/COMP-2 rows); POP, 'Hexadecimal-floating-point number representation'"),
 ("SYNCHRONIZED (slack bytes within records)", "A SYNC binary item with PICTURE S9-S9(4) is placed at an offset that is a multiple of 2 "
  "from the start of the record, S9(5)-S9(18) a multiple of 4; COMP-1 a multiple of 4; COMP-2 a multiple of 8. The compiler inserts "
  "m-r slack bytes immediately before the item, where r is the preceding byte count mod m. SYNC on a level-01 group applies to every "
  "elementary item in it. SYNC on DISPLAY, NATIONAL or PACKED-DECIMAL items has no effect. Slack bytes hold no data; this corpus fills "
  "them with X'00' or X'40' (stated per record) and never scores them.",
  "LR 6.4, SYNCHRONIZED clause; LR, 'Slack bytes within records' (worked examples reproduced as c47 and c48)"),
 ("SYNCHRONIZED inside OCCURS (inter-occurrence slack)", "For a group with an OCCURS clause, the size of one occurrence (including "
  "slack bytes within it) is divided by the largest m of any elementary item in the group; if the remainder r is not zero, m-r slack "
  "bytes are added at the end of each occurrence, so every occurrence starts at the same relative alignment as the first.",
  "LR, 'Slack bytes within records' (OCCURS example: 1 + 2 + 4 + 2 + 5 = 14 bytes, + 2 slack = 16 per occurrence)"),
 ("PIC N(n) USAGE NATIONAL", "n national character positions of 2 bytes each, UTF-16 big-endian (CCSID 1200). A supplementary "
  "character (above U+FFFF) is a surrogate pair and occupies two positions. Padding is the national space U+0020. A PICTURE of only N "
  "with no USAGE clause is national under the default compiler option NSYMBOL(NATIONAL) (c64-c66 repeat c52, c53 and c57 in that form).",
  "PG, 'Unicode and the encoding of language characters' (Enterprise COBOL for z/OS: UTF-16 big-endian national data; one encoding "
  "unit = 2 bytes); Unicode Standard, section 3.9 (UTF-16 surrogate pairs); Enterprise COBOL 6.4, NSYMBOL compiler option (default "
  "NSYMBOL(NATIONAL): 'treated as if the USAGE NATIONAL clause is specified')"),
 ("PIC 9(n) / S9(n) USAGE NATIONAL (national decimal)", "one national character (2 bytes, U+0030-U+0039) per digit; a signed item must "
  "have SIGN SEPARATE, the sign being national '+' (U+002B) or '-' (U+002D) before or after the digits. Published vectors: PIC 9999 "
  "NATIONAL 1234 = X'0031003200330034'; SIGN LEADING SEPARATE -1234 = X'002D0031003200330034'; SIGN TRAILING SEPARATE +1234 = "
  "X'0031003200330034002B'.",
  "PG, 'Defining national numeric data items' (S requires SIGN IS SEPARATE); PG, 'Examples: numeric data and internal representation'"),
 ("Must-fail criterion (national)", "a national decimal control holds a character that is not a national digit or sign (e.g. 'A', or EBCDIC "
  "zoned bytes read as UTF-16), so it is not NUMERIC under the class test; a PIC N control holds an unpaired surrogate, which is ill-formed "
  "UTF-16. A correct decoder rejects the field or flags it (for text: emits U+FFFD in place of the ill-formed unit) instead of "
  "emitting a plausible value.",
  "LR, 'Class condition' (NUMERIC, national); Unicode Standard, conformance clause C10 (ill-formed code unit sequences are an error "
  "condition and are not interpreted as characters)"),
 ("RDW-prefixed variable-length records (RECFM=V)", "each logical record is preceded by a 4-byte record descriptor word: bytes 1-2 = "
  "record length LL including the 4-byte RDW (big-endian halfword, 4 to 32,760), bytes 3-4 = X'0000' for non-spanned records. The "
  "data after the RDW is the COBOL record; it may be shorter than the copybook (ODO tables, short REDEFINES variants). No block "
  "descriptor words (BDW) are present in this corpus.",
  "DFSMS, 'Record descriptor word (RDW)'; POP, halfword binary integers are big-endian"),
 ("Must-fail criterion (RDW)", "an RDW with LL below 4; an RDW whose bytes 3-4 are not zero (they 'are used for spanned records'; here a "
  "record split into two segments marked X'01' and X'02'); a last RDW whose LL runs past the end of the file. A correct reader "
  "reports the framing error instead of emitting, dropping or padding a record without notice.",
  "DFSMS, 'Record descriptor word (RDW)': 'The length can be from 4 to 32,760' and 'All bits of the third and fourth bytes must be 0, "
  "because other values are used for spanned records'"),
]

# ---------------------------------------------------------------------------
# Code page tables (hand transcribed). Only characters used in the corpus.
# ---------------------------------------------------------------------------
_COMMON = {" ": 0x40, ".": 0x4B, "<": 0x4C, "(": 0x4D, "+": 0x4E, "&": 0x50, "$": 0x5B, "*": 0x5C, ")": 0x5D,
           ";": 0x5E, "-": 0x60, "/": 0x61, ",": 0x6B, "%": 0x6C, "_": 0x6D, ">": 0x6E, "?": 0x6F, ":": 0x7A,
           "#": 0x7B, "@": 0x7C, "'": 0x7D, "=": 0x7E, '"': 0x7F, "é": 0x51, "ñ": 0x49}
for i, c in enumerate("ABCDEFGHI"): _COMMON[c] = 0xC1 + i
for i, c in enumerate("JKLMNOPQR"): _COMMON[c] = 0xD1 + i
for i, c in enumerate("STUVWXYZ"): _COMMON[c] = 0xE2 + i
for i, c in enumerate("abcdefghi"): _COMMON[c] = 0x81 + i
for i, c in enumerate("jklmnopqr"): _COMMON[c] = 0x91 + i
for i, c in enumerate("stuvwxyz"): _COMMON[c] = 0xA2 + i
for i in range(10): _COMMON[str(i)] = 0xF0 + i
CP = {
 "cp037": dict(_COMMON, **{"[": 0xBA, "]": 0xBB, "!": 0x5A, "^": 0xB0, "|": 0x4F, "¬": 0x5F, "¢": 0x4A, "¤": 0x9F}),
 "cp500": dict(_COMMON, **{"[": 0x4A, "]": 0x5A, "!": 0x4F, "^": 0x5F, "|": 0xBB, "¬": 0xBA, "¢": 0xB0, "¤": 0x9F}),
 "cp1140": dict(_COMMON, **{"[": 0xBA, "]": 0xBB, "!": 0x5A, "^": 0xB0, "|": 0x4F, "¬": 0x5F, "¢": 0x4A, "€": 0x9F}),
}
for cp, tab in CP.items():  # cross-check only; never used to produce bytes
    for ch, b in tab.items():
        assert ch.encode(cp) == bytes([b]), (cp, ch, hex(b), ch.encode(cp).hex())
PLUS_SEP, MINUS_SEP = 0x4E, 0x60


def enc_text(s, n, cp):
    if cp == "ascii":
        b = s.encode("ascii")
    else:
        b = bytes(CP[cp][c] for c in s)
    assert len(b) <= n, (s, n)
    pad = 0x20 if cp == "ascii" else 0x40
    return b + bytes([pad]) * (n - len(b))


# ---------------------------------------------------------------------------
# UTF-16 (national) by arithmetic, cross-checked against the stdlib codec afterwards
# ---------------------------------------------------------------------------
def utf16_units(s):
    units = []
    for ch in s:
        cp = ord(ch)
        assert not (0xD800 <= cp <= 0xDFFF), "lone surrogates only via RAW"
        if cp < 0x10000:
            units.append(cp)
        else:
            v = cp - 0x10000
            units += [0xD800 + (v >> 10), 0xDC00 + (v & 0x3FF)]
    return units


def enc_national_text(s, n):
    u = utf16_units(s)
    assert len(u) <= n, (s, n)
    u += [0x0020] * (n - len(u))
    b = b"".join(x.to_bytes(2, "big") for x in u)
    assert b == (s + " " * (n - len(utf16_units(s)))).encode("utf-16-be"), s   # cross-check only
    return b


# ---------------------------------------------------------------------------
# IBM hexadecimal floating point (exact rational arithmetic)
# ---------------------------------------------------------------------------
def hfp_encode(v, nbytes, rounding=False):
    v = Fraction(v)
    nd = 2 * nbytes - 2                      # hex digits in the fraction: 6 (short) or 14 (long)
    if v == 0:
        return bytes(nbytes)
    sign = 1 if v < 0 else 0
    a = abs(v); e = 0
    while a >= 1: a /= 16; e += 1
    while a < Fraction(1, 16): a *= 16; e -= 1
    f = a * 16 ** nd
    if f.denominator != 1:
        assert rounding, ("not exactly representable", v, nbytes)
        fi = round(f)                         # round half to even
        if fi == 16 ** nd: fi //= 16; e += 1
    else:
        fi = f.numerator
    ch = e + 64
    assert 0 <= ch <= 127, ("exponent out of range", v)
    return bytes([(sign << 7) | ch]) + fi.to_bytes(nbytes - 1, "big")


def hfp_value(b):
    sign = -1 if b[0] & 0x80 else 1
    ch = b[0] & 0x7F
    frac = Fraction(int.from_bytes(b[1:], "big"), 16 ** (2 * len(b) - 2))
    return sign * frac * Fraction(16) ** (ch - 64)


def frac_to_decimal(q):
    """exact decimal for a rational whose denominator is a power of two"""
    q = Fraction(q)
    d = q.denominator; k = 0
    while d % 2 == 0: d //= 2; k += 1
    assert d == 1, q
    return Decimal("%dE-%d" % (q.numerator * 5 ** k, k))   # the constructor is exact; scaleb() would round to context


def dec_str(d):
    s = format(d, "f")
    if "." in s: s = s.rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


# ---------------------------------------------------------------------------
# Layout items
# ---------------------------------------------------------------------------
class F:  # elementary item
    def __init__(self, name, kind, digits=0, scale=0, signed=False, usage=None, sign_mode="trailing", pscale=0, length=0, sync=False):
        self.name, self.kind, self.digits, self.scale, self.signed = name, kind, digits, scale, signed
        self.usage, self.sign_mode, self.pscale, self.length = usage, sign_mode, pscale, length
        self.redefines = None
        self.sync = sync

    def size(self):
        if self.kind in ("X", "SL"): return self.length
        if self.kind == "Z": return self.digits + (1 if self.sign_mode.endswith("_sep") and self.signed else 0)
        if self.kind == "P": return self.digits // 2 + 1
        if self.kind == "B": return 2 if self.digits <= 4 else 4 if self.digits <= 9 else 8
        if self.kind == "H": return 4 if self.usage == "COMP-1" else 8
        if self.kind == "N": return 2 * self.length
        if self.kind == "ND": return 2 * (self.digits + (1 if self.signed else 0))
        raise ValueError(self.kind)

    def pic(self):
        if self.kind == "X": return "X(%d)" % self.length
        if self.kind == "N": return "N(%d)" % self.length
        s = "S" if self.signed else ""
        if self.pscale > 0:   # 999PP
            return s + "9" * self.digits + "P" * self.pscale
        if self.pscale < 0:   # VPP999
            return s + "V" + "P" * (-self.pscale) + "9" * self.digits
        ni = self.digits - self.scale
        p = s + ("9(%d)" % ni if ni > 0 else "")
        if self.scale: p += "V9(%d)" % self.scale
        return p

    def clause(self):
        if self.kind == "H":
            c = self.usage
        else:
            c = "PIC " + self.pic()
        if self.kind == "Z":
            if self.signed and self.sign_mode != "trailing":
                c += {"leading": " SIGN LEADING", "trailing_sep": " SIGN TRAILING SEPARATE",
                      "leading_sep": " SIGN LEADING SEPARATE"}[self.sign_mode]
        elif self.kind == "P": c += " COMP-3"
        elif self.kind == "B": c += " " + self.usage
        elif self.kind == "N": c += "" if getattr(self, "implicit", False) else " USAGE NATIONAL"
        elif self.kind == "ND":
            c += " USAGE NATIONAL"
            if self.signed:
                c += {"leading_sep": " SIGN LEADING SEPARATE", "trailing_sep": " SIGN TRAILING SEPARATE"}[self.sign_mode]
        if self.sync: c += " SYNC"
        return c


class G:  # group
    def __init__(self, name, children, occurs=None, odo=None, redefines=None, sync=False):
        self.name, self.children, self.occurs, self.odo, self.redefines = name, children, occurs, odo, redefines
        self.sync = sync

    def size(self):
        s = 0
        for c in self.children:
            if getattr(c, "redefines", None): continue
            n = c.size()
            if isinstance(c, G) and (c.occurs or c.odo): n *= (c.occurs or c.odo[2])
            s += n
        return s


def redef(item, target):
    item.redefines = target
    return item


def _wrap(first, clause, indent):
    """one line when it fits in columns 8-72, otherwise the clause continues in area B"""
    line = first + "  " + clause + "."
    if len(line) <= 72: return [line]
    out = [first]; cur = " " * (11 + indent + 4)
    for w in (clause + ".").split(" "):
        if len(cur) + len(w) + 1 > 72 and cur.strip():
            out.append(cur.rstrip()); cur = " " * (11 + indent + 4)
        cur += ("" if cur.endswith(" ") else " ") + w
    out.append(cur.rstrip())
    return out


def copybook_text(root):
    lines = []
    def emit(item, level, indent):
        if isinstance(item, F) and item.kind == "SL": return        # compiler-inserted slack bytes are not in the source
        pad = " " * 7 + " " * indent
        head = "%s%02d  %s" % (pad, level, item.name)
        rd = " REDEFINES %s" % item.redefines if item.redefines else ""
        if isinstance(item, G):
            occ = ""
            if item.occurs: occ = " OCCURS %d TIMES" % item.occurs
            if item.odo: occ = " OCCURS %d TO %d TIMES DEPENDING ON %s" % (item.odo[1], item.odo[2], item.odo[0])
            lines.append(head + rd + occ + (" SYNC" if item.sync else "") + ".")
            for c in item.children: emit(c, level + 5 if level > 1 else 5, indent + 4)
        else:
            lines.extend(_wrap(head + rd, item.clause(), indent))
    lines.append("      * CC0-1.0. Golden corpus, COBOL decoder-fidelity measurement.")
    emit(root, 1, 0)
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# SYNCHRONIZED: insert the compiler's slack bytes (LR, 'Slack bytes within records')
# ---------------------------------------------------------------------------
def sync_align(f, inherited):
    if not (f.sync or inherited): return 0
    if f.kind == "B": return 2 if f.digits <= 4 else 4
    if f.kind == "H": return 4 if f.usage == "COMP-1" else 8
    return 0                                   # DISPLAY / NATIONAL / PACKED-DECIMAL: no effect


def apply_sync(group, pos=0, inherited=False):
    """returns (offset after the group's first occurrence, largest m inside). Mutates children lists."""
    new, M = [], 0
    for c in group.children:
        assert not getattr(c, "redefines", None) and not (isinstance(c, G) and c.odo), "SYNC with REDEFINES/ODO not in corpus"
        if isinstance(c, G):
            start = pos
            end, m = apply_sync(c, pos, inherited or c.sync)
            if c.occurs:
                S = end - start
                if m and S % m:
                    c.children.append(F("*SLACK*", "SL", length=m - S % m)); S += m - S % m
                pos = start + S * c.occurs
            else:
                pos = end
            M = max(M, m); new.append(c)
        else:
            a = sync_align(c, inherited)
            if a and pos % a:
                new.append(F("*SLACK*", "SL", length=a - pos % a)); pos += a - pos % a
            M = max(M, a); new.append(c); pos += c.size()
    group.children = new
    return pos, M


# ---------------------------------------------------------------------------
# Field encoders (each implements one RULES entry)
# ---------------------------------------------------------------------------
def scaled_int(f, v):
    v = Decimal(v)
    if f.pscale > 0: q = v / (Decimal(10) ** f.pscale)
    elif f.pscale < 0: q = v * (Decimal(10) ** (f.digits - f.pscale))
    else: q = v * (Decimal(10) ** f.scale)
    assert q == q.to_integral_value(), (f.name, v)
    return int(q)


def enc_zoned(f, n, sign_zone=None):
    assert abs(n) < 10 ** f.digits, (f.name, n)
    ds = [int(c) for c in str(abs(n)).rjust(f.digits, "0")]
    b = [0xF0 | d for d in ds]
    if not f.signed:
        assert n >= 0 and sign_zone is None
        return bytes(b)
    z = sign_zone if sign_zone is not None else (0xD if n < 0 else 0xC)
    if f.sign_mode == "trailing": b[-1] = (z << 4) | ds[-1]
    elif f.sign_mode == "leading": b[0] = (z << 4) | ds[0]
    elif f.sign_mode == "trailing_sep": b = b + [MINUS_SEP if n < 0 else PLUS_SEP]
    elif f.sign_mode == "leading_sep": b = [MINUS_SEP if n < 0 else PLUS_SEP] + b
    return bytes(b)


def enc_packed(f, n, sign_nib=None):
    nb = f.digits // 2 + 1
    assert abs(n) < 10 ** f.digits, (f.name, n)
    ds = str(abs(n)).rjust(2 * nb - 1, "0")
    nibs = [int(c) for c in ds]
    if sign_nib is None:
        sign_nib = (0xD if n < 0 else 0xC) if f.signed else 0xF
        if not f.signed: assert n >= 0
    nibs.append(sign_nib)
    return bytes((nibs[i] << 4) | nibs[i + 1] for i in range(0, len(nibs), 2))


def enc_binary(f, n):
    size = f.size()
    signed = f.signed
    if f.usage == "COMP-5":
        lo, hi = (-(1 << (8 * size - 1)), (1 << (8 * size - 1)) - 1) if signed else (0, (1 << (8 * size)) - 1)
    else:
        lo, hi = (-(10 ** f.digits - 1) if signed else 0), 10 ** f.digits - 1
    assert lo <= n <= hi, (f.name, n, lo, hi)
    return n.to_bytes(size, "big", signed=signed)


def enc_national_decimal(f, n):
    assert abs(n) < 10 ** f.digits, (f.name, n)
    units = [0x30 + int(c) for c in str(abs(n)).rjust(f.digits, "0")]
    if f.signed:
        s = 0x2D if n < 0 else 0x2B
        units = [s] + units if f.sign_mode == "leading_sep" else units + [s]
    else:
        assert n >= 0
    return b"".join(u.to_bytes(2, "big") for u in units)


def encode_field(f, spec, cp):
    """spec: plain value | ('SIGN', value, nibble) | ('RAW', hex, expectation) | ('HFPRAW', hex) | ('HFPROUND', value)"""
    if isinstance(spec, tuple) and spec[0] == "RAW":
        b = bytes.fromhex(spec[1]); assert len(b) == f.size(), (f.name, len(b), f.size())
        return b, spec[2]
    if f.kind == "H":
        n = f.size()
        if isinstance(spec, tuple) and spec[0] == "HFPRAW":
            b = bytes.fromhex(spec[1]); assert len(b) == n
        elif isinstance(spec, tuple) and spec[0] == "HFPROUND":
            b = hfp_encode(Fraction(spec[1]), n, rounding=True)
        else:
            b = hfp_encode(Fraction(Decimal(spec)) if not isinstance(spec, Fraction) else spec, n)
            assert hfp_value(b) == Fraction(Decimal(spec)) if not isinstance(spec, Fraction) else True
        return b, frac_to_decimal(hfp_value(b))
    if f.kind == "N":
        return enc_national_text(spec, f.length), spec
    alt = None
    if isinstance(spec, tuple) and spec[0] == "SIGN":
        alt, spec = spec[2], spec[1]
    if f.kind == "X":
        return enc_text(spec, f.length, cp), spec
    if cp == "ascii":
        assert f.kind == "Z" and not f.signed, "ascii control holds unsigned zoned fields only"
        n = scaled_int(f, spec)
        s = str(abs(n)).rjust(f.digits, "0")
        assert n >= 0
        return s.encode("ascii"), "REJECT"
    n = scaled_int(f, spec)
    if f.kind == "Z": b = enc_zoned(f, n, alt)
    elif f.kind == "P": b = enc_packed(f, n, alt)
    elif f.kind == "B": b = enc_binary(f, n)
    elif f.kind == "ND": b = enc_national_decimal(f, n)
    else: raise ValueError(f.kind)
    return b, Decimal(spec)


# ---------------------------------------------------------------------------
# Record encoder
# values: {canonical_name: spec}; canonical name = NAME or NAME(i) / NAME(i,j), 1-based.
# redefines areas: every variant whose leaves appear in `values` is encoded and the
# encodings must be byte-identical (or `values` lists just one variant). A populated
# redefining variant shorter than the area it redefines is padded with X'40' (c60 only).
# Returns (bytes, {name: (item, expected, offset, length)}, first slack offset or None).
# ---------------------------------------------------------------------------
def encode_record(root, values, cp, hazards, odo_counts, slack_fill=0x00):
    expected = {}; used = set(); first_slack = [None]
    def leaf_name(f, idx):
        return f.name + ("(%s)" % ",".join(str(i) for i in idx) if idx else "")

    def enc_item(item, idx, pos):
        if isinstance(item, F):
            if item.kind == "SL":
                if first_slack[0] is None: first_slack[0] = pos
                return bytes([slack_fill]) * item.length
            key = leaf_name(item, idx)
            if key not in values:
                if item.name.startswith("FILLER"):
                    return enc_text("", item.size(), cp) if item.kind == "X" else bytes(item.size())
                raise KeyError(key)
            used.add(key)
            b, exp = encode_field(item, values[key], cp)
            expected[key] = (item, exp, pos, len(b))
            return b
        # group
        reps = 1; b = bytearray()
        if item.occurs: reps = item.occurs
        if item.odo: reps = odo_counts[item.odo[0]]
        for r in range(reps):
            sub = idx + [r + 1] if (item.occurs or item.odo) else idx
            b += enc_children(item.children, sub, pos + len(b))
        return bytes(b)

    def has_values(item, idx):
        if isinstance(item, F): return leaf_name(item, idx) in values
        if item.occurs or item.odo: idx = idx + [1]
        return any(has_values(c, idx) for c in item.children)

    def enc_children(children, idx, pos):
        b = bytearray(); i = 0
        while i < len(children):
            base = children[i]; variants = [base]; j = i + 1
            while j < len(children) and getattr(children[j], "redefines", None) == base.name:
                variants.append(children[j]); j += 1
            size = base.size()
            if len(variants) == 1:
                encs = [enc_item(base, idx, pos + len(b))]
            else:
                encs = [enc_item(v, idx, pos + len(b)) for v in variants if has_values(v, idx)]
                encs = [e + b"\x40" * (size - len(e)) if len(e) < size else e for e in encs]
            assert encs, ("no variant populated", base.name)
            reps = isinstance(base, G) and (base.occurs or base.odo)
            for e in encs: assert e == encs[0] and (reps or len(e) == size), (base.name, [x.hex() for x in encs], size)
            b += encs[0]; i = j
        return bytes(b)

    out = enc_children(root.children, [], 0)
    unused = set(values) - used
    assert not unused, unused
    return out, expected, first_slack[0]


def usage_of(f):
    return {"X": "TEXT", "Z": "DISPLAY", "P": "COMP-3", "N": "NATIONAL", "ND": "NATIONAL"}.get(f.kind) or f.usage


def odo_dependent_names(root):
    """leaf names inside an ODO table or located after one (variably located items)"""
    seen = [False]; dep = set()
    def walk(item):
        if isinstance(item, G):
            if item.odo: seen[0] = True
            for c in item.children: walk(c)
        elif seen[0]:
            dep.add(item.name)
    walk(root)
    return dep


def exp_repr(f, exp):
    if exp == "REJECT": return {"expect": "REJECT"}
    if isinstance(exp, str): return {"expect": "TEXT", "value": exp}
    if f.kind == "H": return {"expect": "NUMBER", "value": dec_str(exp)}
    return {"expect": "NUMBER", "value": str(exp)}


# ---------------------------------------------------------------------------
# The corpus
# ---------------------------------------------------------------------------
def X(n, l, sync=False): return F(n, "X", length=l, sync=sync)
def Z(n, d, s=0, signed=True, mode="trailing", p=0, sync=False): return F(n, "Z", d, s, signed, sign_mode=mode, pscale=p, sync=sync)
def P(n, d, s=0, signed=True, p=0, sync=False): return F(n, "P", d, s, signed, pscale=p, sync=sync)
def B(n, d, s=0, signed=True, usage="COMP", sync=False): return F(n, "B", d, s, signed, usage=usage, sync=sync)
def H(n, usage, sync=False): return F(n, "H", usage=usage, sync=sync)
def N(n, l, implicit=False):
    f = F(n, "N", length=l); f.implicit = implicit       # implicit: PIC N(n) with no USAGE clause (NSYMBOL(NATIONAL))
    return f
def ND(n, d, s=0, signed=False, mode="trailing_sep", sync=False): return F(n, "ND", d, s, signed, sign_mode=mode, sync=sync)

D = Decimal
BOOKS = []  # (id, title, root, [record dicts] or [[files]], framing)

def book(bid, title, fields, records, framing="fixed", sync=False, root_sync=False):
    root = G(bid.upper().replace("_", "-") + "-REC", fields, sync=root_sync)
    if sync or root_sync: apply_sync(root, 0, root_sync)
    BOOKS.append((bid, title, root, records, framing))

def rec(values, hz, cp="cp037", odo=None, must_fail=False, reject_ok=(), note="", slack=0x00, length=None):
    return dict(values=values, hz=hz, cp=cp, odo=odo or {}, must_fail=must_fail, reject_ok=set(reject_ok), note=note,
                slack=slack, length=length)

def mf_rdw(kind, r, note):
    return dict(mf_rdw=kind, rec=r, note=note)

# ============================== corpus v1 (c01-c41), unchanged ==============================
# --- COMP-3 packed decimal -------------------------------------------------
book("c01_pk_basic", "COMP-3 odd digit counts, C/D/F signs",
     [P("C01-POS", 5), P("C01-NEG", 5), P("C01-UNS", 5, signed=False), P("C01-ONE", 1)],
     [rec({"C01-POS": 12345, "C01-NEG": -12345, "C01-UNS": 54321, "C01-ONE": -7}, "comp3"),
      rec({"C01-POS": 0, "C01-NEG": -1, "C01-UNS": 99999, "C01-ONE": 9}, "comp3")])
book("c02_pk_even", "COMP-3 even digit counts (zero pad nibble)",
     [P("C02-S4", 4), P("C02-S6", 6), P("C02-U2", 2, signed=False)],
     [rec({"C02-S4": -1234, "C02-S6": 123456, "C02-U2": 42}, "comp3")])
book("c03_pk_18", "COMP-3 18 digits (at the signed 64-bit edge)",
     [P("C03-A", 18), P("C03-B", 18)],
     [rec({"C03-A": 999999999999999999, "C03-B": -123456789012345678}, "comp3")])
book("c04_pk_31", "COMP-3 31 digits (ARITH(EXTEND) maximum, beyond 64-bit)",
     [P("C04-A", 31), P("C04-B", 31)],
     [rec({"C04-A": 9999999999999999999999999999999, "C04-B": -1234567890123456789012345678901}, "comp3")])
book("c05_pk_scaled", "COMP-3 with implied decimals",
     [P("C05-A", 9, 2), P("C05-B", 7, 4), P("C05-C", 5, 5)],
     [rec({"C05-A": D("-1234567.89"), "C05-B": D("123.4567"), "C05-C": D("-0.12345")}, "implied_decimal")])
book("c06_pk_precision", "COMP-3 decimals beyond binary floating-point precision",
     [P("C06-A", 18, 9), P("C06-B", 17, 2), P("C06-C", 31, 10)],
     [rec({"C06-A": D("123456789.123456789"), "C06-B": D("999999999999999.99"),
           "C06-C": D("-123456789012345678901.2345678901")}, "implied_decimal")])
# --- sign nibbles ------------------------------------------------------------
book("c07_sign_alt", "COMP-3 alternate sign nibbles A/B/E and F in a signed item",
     [P("C07-A", 3), P("C07-B", 3), P("C07-E", 3), P("C07-F", 3)],
     [rec({"C07-A": ("SIGN", 123, 0xA), "C07-B": ("SIGN", -123, 0xB), "C07-E": ("SIGN", 456, 0xE), "C07-F": ("SIGN", 789, 0xF)},
          "sign_nibble", reject_ok=("C07-A", "C07-B", "C07-E"),
          note="A/B/E are valid sign codes (POP) but fail NUMERIC under NUMCLS(PRIM); rejection is also an acceptable outcome")])
book("c08_negzero_pk", "COMP-3 negative zero",
     [P("C08-A", 3), P("C08-B", 5, 2)],
     [rec({"C08-A": ("SIGN", 0, 0xD), "C08-B": ("SIGN", D("0.00"), 0xD)}, "sign_nibble")])
# --- zoned decimal / overpunch --------------------------------------------------
book("c09_zd_basic", "zoned decimal, trailing overpunch C/D, unsigned F, signed F",
     [Z("C09-POS", 5), Z("C09-NEG", 5), Z("C09-UNS", 5, signed=False), Z("C09-FPOS", 5)],
     [rec({"C09-POS": 12345, "C09-NEG": -12345, "C09-UNS": 42, "C09-FPOS": ("SIGN", 777, 0xF)}, "zoned_overpunch"),
      rec({"C09-POS": 1, "C09-NEG": -99999, "C09-UNS": 0, "C09-FPOS": 0}, "zoned_overpunch")])
book("c10_zd_zero", "zoned overpunch on a zero digit ({ and }) and negative zero",
     [Z("C10-A", 3), Z("C10-B", 3), Z("C10-C", 3)],
     [rec({"C10-A": -100, "C10-B": 0, "C10-C": ("SIGN", 0, 0xD)}, "zoned_overpunch")])
book("c11_zd_alt", "zoned alternate sign zones A/B/E",
     [Z("C11-A", 4), Z("C11-B", 4), Z("C11-E", 4)],
     [rec({"C11-A": ("SIGN", 1234, 0xA), "C11-B": ("SIGN", -1234, 0xB), "C11-E": ("SIGN", 4321, 0xE)}, "sign_nibble",
          reject_ok=("C11-A", "C11-B", "C11-E"),
          note="A/B/E are valid sign codes (POP) but fail NUMERIC under NUMCLS(PRIM); rejection is also an acceptable outcome")])
book("c12_zd_lead", "SIGN LEADING (overpunch on first byte)",
     [Z("C12-A", 5, mode="leading"), Z("C12-B", 5, mode="leading")],
     [rec({"C12-A": -12345, "C12-B": 67890}, "zoned_overpunch")])
book("c13_zd_trail_sep", "SIGN TRAILING SEPARATE",
     [Z("C13-A", 5, mode="trailing_sep"), Z("C13-B", 5, mode="trailing_sep")],
     [rec({"C13-A": -12345, "C13-B": 678}, "zoned_overpunch")])
book("c14_zd_lead_sep", "SIGN LEADING SEPARATE",
     [Z("C14-A", 5, mode="leading_sep"), Z("C14-B", 5, mode="leading_sep")],
     [rec({"C14-A": -12345, "C14-B": 678}, "zoned_overpunch")])
# --- implied decimal / scaling ---------------------------------------------------
book("c15_zd_scaled", "zoned with implied decimals",
     [Z("C15-A", 7, 2), Z("C15-B", 6, 3, signed=False), Z("C15-C", 2, 2)],
     [rec({"C15-A": D("-12345.67"), "C15-B": D("1.005"), "C15-C": D("-0.05")}, "implied_decimal")])
book("c16_p_scaling", "PICTURE P scaling positions",
     [P("C16-A", 3, p=2), Z("C16-B", 3, p=-2), Z("C16-C", 2, signed=False, p=3)],
     [rec({"C16-A": 12300, "C16-B": D("-0.00123"), "C16-C": 45000}, "implied_decimal")])
# --- binary ------------------------------------------------------------------------
book("c17_bin_half", "binary halfword COMP/BINARY/COMP-4, big-endian",
     [B("C17-A", 4), B("C17-B", 4, signed=False), B("C17-C", 4, usage="BINARY"), B("C17-D", 4, usage="COMP-4")],
     [rec({"C17-A": -2, "C17-B": 9999, "C17-C": 258, "C17-D": -9999}, "binary")])
book("c18_bin_full", "binary fullword",
     [B("C18-A", 9), B("C18-B", 9, signed=False), B("C18-C", 5)],
     [rec({"C18-A": -123456789, "C18-B": 999999999, "C18-C": -54321}, "binary")])
book("c19_bin_double", "binary doubleword",
     [B("C19-A", 18), B("C19-B", 18, signed=False), B("C19-C", 10)],
     [rec({"C19-A": -123456789012345678, "C19-B": 999999999999999999, "C19-C": 1234567890}, "binary")])
book("c20_bin_scaled", "binary with implied decimals",
     [B("C20-A", 7, 2), B("C20-B", 4, 2)],
     [rec({"C20-A": D("-12345.67"), "C20-B": D("12.34")}, "binary")])
book("c21_comp5_half", "COMP-5 halfword beyond PICTURE digits",
     [B("C21-A", 4, usage="COMP-5"), B("C21-B", 4, signed=False, usage="COMP-5"), B("C21-C", 4, usage="COMP-5")],
     [rec({"C21-A": 32767, "C21-B": 65535, "C21-C": -32768}, "binary_truncation")])
book("c22_comp5_wide", "COMP-5 fullword/doubleword full range, unsigned high bit",
     [B("C22-A", 9, usage="COMP-5"), B("C22-B", 9, signed=False, usage="COMP-5"),
      B("C22-C", 18, usage="COMP-5"), B("C22-D", 18, signed=False, usage="COMP-5")],
     [rec({"C22-A": 2147483647, "C22-B": 4294967295, "C22-C": -9223372036854775808, "C22-D": 18446744073709551615},
          "binary_truncation")])
book("c23_comp5_scaled", "COMP-5 with implied decimals beyond PICTURE digits",
     [B("C23-A", 4, 2, usage="COMP-5"), B("C23-B", 9, 3, signed=False, usage="COMP-5")],
     [rec({"C23-A": D("327.67"), "C23-B": D("4294967.295")}, "binary_truncation")])
# --- code pages ------------------------------------------------------------------------
TXT = "A[1]!B^C|D¬"
book("c24_cp_variant", "code-page variant characters [ ] ! ^ | ¬",
     [X("C24-TXT", 12), P("C24-NUM", 5)],
     [rec({"C24-TXT": TXT, "C24-NUM": 314}, "codepage", cp="cp037"),
      rec({"C24-TXT": TXT, "C24-NUM": 314}, "codepage", cp="cp500"),
      rec({"C24-TXT": TXT, "C24-NUM": 314}, "codepage", cp="cp1140")])
book("c25_cp_euro", "byte X'9F': euro sign in CCSID 1140, currency sign in CCSID 37",
     [X("C25-TXT", 6)],
     [rec({"C25-TXT": "EUR €"}, "codepage", cp="cp1140"), rec({"C25-TXT": "CUR ¤"}, "codepage", cp="cp037")])
book("c26_cp_text", "mixed-case and accented text",
     [X("C26-TXT", 24), X("C26-PUNCT", 16)],
     [rec({"C26-TXT": "Senor cafe ñ é abc xyz", "C26-PUNCT": "$1,234.50 (@#%)"}, "codepage")])
# --- REDEFINES -------------------------------------------------------------------------
book("c27_redef_group", "group REDEFINES selected by a type code",
     [X("C27-TYPE", 1), X("C27-BODY", 12),
      redef(G("C27-BODY-A", [X("C27-A-NAME", 8), P("C27-A-QTY", 7)]), "C27-BODY"),
      redef(G("C27-BODY-B", [P("C27-B-AMT", 11, 2), B("C27-B-CNT", 9), X("FILLER", 2)]), "C27-BODY"),
      X("C27-TAIL", 4)],
     [rec({"C27-TYPE": "A", "C27-A-NAME": "WIDGET", "C27-A-QTY": -42, "C27-TAIL": "END1"}, "redefines"),
      rec({"C27-TYPE": "B", "C27-B-AMT": D("123456789.01"), "C27-B-CNT": 7, "C27-TAIL": "END2"}, "redefines")])
book("c28_redef_elem", "elementary REDEFINES (date view, packed view of text)",
     [Z("C28-DATE", 8, signed=False),
      redef(G("C28-DATE-R", [Z("C28-YYYY", 4, signed=False), Z("C28-MM", 2, signed=False), Z("C28-DD", 2, signed=False)]), "C28-DATE"),
      X("C28-AMT-X", 4), redef(P("C28-AMT-P", 7), "C28-AMT-X"), X("C28-END", 2)],
     [rec({"C28-DATE": 20260928, "C28-YYYY": 2026, "C28-MM": 9, "C28-DD": 28, "C28-AMT-P": -1234567, "C28-END": "ZZ"}, "redefines")])
book("c29_redef_bin", "text redefined as COMP-5 (both views valid)",
     [X("C29-TXT", 4), redef(B("C29-BIN", 9, usage="COMP-5"), "C29-TXT"), X("C29-END", 2)],
     [rec({"C29-TXT": "ABCD", "C29-BIN": int.from_bytes(bytes([0xC1, 0xC2, 0xC3, 0xC4]), "big", signed=True), "C29-END": "OK"},
          "redefines")])
# --- OCCURS DEPENDING ON -------------------------------------------------------------------
def odo_vals(prefix, n, codes, amts, trailer):
    v = {prefix + "-COUNT": n, prefix + "-TRAILER": trailer}
    for i in range(n):
        v["%s-CODE(%d)" % (prefix, i + 1)] = codes[i]; v["%s-AMT(%d)" % (prefix, i + 1)] = amts[i]
    return v
C30F = [Z("C30-COUNT", 2, signed=False), G("C30-ITEM", [X("C30-CODE", 3), P("C30-AMT", 7, 2)], odo=("C30-COUNT", 0, 5)), X("C30-TRAILER", 6)]
book("c30_odo_basic", "OCCURS 0 TO 5 DEPENDING ON, item after the table", C30F,
     [rec(odo_vals("C30", 3, ["AAA", "BBB", "CCC"], [D("1.11"), D("-2.22"), D("33333.33")], "TRLR01"), "odo", odo={"C30-COUNT": 3}),
      rec(odo_vals("C30", 0, [], [], "TRLR00"), "odo", odo={"C30-COUNT": 0}),
      rec(odo_vals("C30", 5, ["A1", "A2", "A3", "A4", "A5"], [D("1"), D("2"), D("3"), D("4"), D("-5.05")], "TRLR05"), "odo",
          odo={"C30-COUNT": 5})])
book("c31_odo_pk_counter", "ODO with a COMP-3 counter",
     [P("C31-COUNT", 3), G("C31-ITEM", [X("C31-CODE", 4)], odo=("C31-COUNT", 1, 4)), X("C31-TRAILER", 3)],
     [rec({"C31-COUNT": 2, "C31-CODE(1)": "WXYZ", "C31-CODE(2)": "QRST", "C31-TRAILER": "EOR"}, "odo", odo={"C31-COUNT": 2})])
book("c32_odo_bin_counter", "ODO with a binary counter and a zoned trailer",
     [B("C32-COUNT", 4), G("C32-ITEM", [P("C32-VAL", 5)], odo=("C32-COUNT", 0, 6)), Z("C32-TRAILER", 7, 2)],
     [rec({"C32-COUNT": 2, "C32-VAL(1)": 11111, "C32-VAL(2)": -22222, "C32-TRAILER": D("-123.45")}, "odo", odo={"C32-COUNT": 2})])
# --- fixed OCCURS, structure ------------------------------------------------------------------
occ = {"C33-END": "XYZ"}
for r in range(2):
    occ["C33-KEY(%d)" % (r + 1)] = "K%d" % (r + 1)
    for c in range(3): occ["C33-VAL(%d,%d)" % (r + 1, c + 1)] = (r + 1) * 100 + (c + 1) * (-1 if c == 1 else 1)
book("c33_occurs_nested", "nested fixed OCCURS",
     [G("C33-ROW", [X("C33-KEY", 2), G("C33-CELL", [P("C33-VAL", 3)], occurs=3)], occurs=2), X("C33-END", 3)],
     [rec(occ, "baseline")])
book("c34_account", "mixed realistic account record",
     [X("C34-ID", 10), P("C34-BAL", 13, 2), B("C34-LIMIT", 7), Z("C34-OPEN", 8, signed=False), P("C34-RATE", 5, 5),
      X("C34-STATUS", 1), B("C34-FLAGS", 4, signed=False, usage="COMP-5")],
     [rec({"C34-ID": "AC00012345", "C34-BAL": D("-98765432109.87"), "C34-LIMIT": 2500000, "C34-OPEN": 19991231,
           "C34-RATE": D("0.04125"), "C34-STATUS": "A", "C34-FLAGS": 40961}, "baseline")])
book("c35_levels_filler", "deep levels with FILLER",
     [G("C35-G1", [X("C35-A", 3), X("FILLER", 2), G("C35-G2", [P("C35-B", 5), X("FILLER", 1), Z("C35-C", 4)])]), X("C35-D", 2)],
     [rec({"C35-A": "ABC", "C35-B": -321, "C35-C": 4321, "C35-D": "ZZ"}, "baseline")])
book("c36_zd_wide", "wide unsigned zoned (beyond 64-bit)",
     [Z("C36-A", 18, signed=False), Z("C36-B", 31, signed=False), Z("C36-C", 25, 6)],
     [rec({"C36-A": 999999999999999999, "C36-B": 1234567890123456789012345678901,
           "C36-C": D("-1234567890123456789.012345")}, "baseline")])
# --- must-fail controls ---------------------------------------------------------------------------
book("c37_mf_pk_digit", "must-fail: packed digit nibble X'A'",
     [P("C37-BAD", 5), P("C37-OK", 5)],
     [rec({"C37-BAD": ("RAW", "12A45C", "REJECT"), "C37-OK": 12345}, "mustfail_packed", must_fail=True)])
book("c38_mf_pk_sign", "must-fail: packed sign nibble X'5'",
     [P("C38-BAD", 5), P("C38-OK", 5)],
     [rec({"C38-BAD": ("RAW", "123455", "REJECT"), "C38-OK": -12345}, "mustfail_packed", must_fail=True)])
book("c39_mf_pk_spaces", "must-fail: packed field holding spaces / low-values",
     [P("C39-SPACES", 5), P("C39-LOWVAL", 5), X("C39-OK", 4)],
     [rec({"C39-SPACES": ("RAW", "404040", "REJECT"), "C39-LOWVAL": ("RAW", "000000", "REJECT"), "C39-OK": "GOOD"},
          "mustfail_packed", must_fail=True)])
book("c40_mf_zd_zone", "must-fail: zoned invalid sign zone / invalid digit",
     [Z("C40-BADSIGN", 3), Z("C40-BADDIGIT", 3, signed=False), Z("C40-OK", 3)],
     [rec({"C40-BADSIGN": ("RAW", "F1F255", "REJECT"), "C40-BADDIGIT": ("RAW", "F14BF3", "REJECT"), "C40-OK": -12},
          "mustfail_zoned", must_fail=True)])
book("c41_mf_ascii", "must-fail: ASCII-encoded record read as EBCDIC (wrong code page)",
     [Z("C41-QTY", 5, signed=False), Z("C41-AMT", 7, 2, signed=False)],
     [rec({"C41-QTY": 12345, "C41-AMT": D("12345.67")}, "mustfail_codepage", cp="ascii", must_fail=True,
          note="bytes written in ASCII; decoders are told the page is cp037")])


# ============================== corpus v2 (c42-c63) ==============================
# --- COMP-1 / COMP-2: IBM hexadecimal floating point -----------------------------------------
book("c42_hfp_short", "COMP-1 short HFP: published vector 1234, -118.625, powers of 16, 24-bit fraction",
     [H("C42-A", "COMP-1"), H("C42-B", "COMP-1"), H("C42-C", "COMP-1"), H("C42-D", "COMP-1"), H("C42-E", "COMP-1")],
     [rec({"C42-A": 1, "C42-B": D("-118.625"), "C42-C": 1234, "C42-D": D("0.15625"), "C42-E": 16777215}, "hfp_float"),
      rec({"C42-A": 0, "C42-B": -1234, "C42-C": D("0.5"), "C42-D": 100, "C42-E": D("-0.0078125")}, "hfp_float")])
book("c43_hfp_long", "COMP-2 long HFP: published vector 1234, fractions, 0.1 rounded to 14 hex digits",
     [H("C43-A", "COMP-2"), H("C43-B", "COMP-2"), H("C43-C", "COMP-2"), H("C43-D", "COMP-2")],
     [rec({"C43-A": 1234, "C43-B": D("-118.625"), "C43-C": D("123456789.125"), "C43-D": ("HFPROUND", Fraction(1, 10))}, "hfp_float",
          note="C43-D holds 0.1 rounded to nearest in 14 hex digits; the expected value is the exact value of those bytes"),
      rec({"C43-A": 0, "C43-B": D("-0.5"), "C43-C": 10 ** 15, "C43-D": ("HFPROUND", Fraction(-1, 10))}, "hfp_float")])
book("c44_hfp_range", "HFP beyond IEEE-754: exponent range beyond binary32, 55/56-bit fractions beyond binary64",
     [H("C44-A", "COMP-2"), H("C44-B", "COMP-2"), H("C44-C", "COMP-1"), H("C44-D", "COMP-1"), H("C44-E", "COMP-1"),
      H("C44-F", "COMP-2"), H("C44-G", "COMP-2")],
     [rec({"C44-A": 2 ** 55 + 1, "C44-B": ("HFPROUND", Fraction(1, 3)), "C44-C": ("HFPRAW", "7FFFFFFF"),
           "C44-D": ("HFPRAW", "00100000"), "C44-E": 2 ** 160, "C44-F": ("HFPRAW", "7FFFFFFFFFFFFFFF"),
           "C44-G": ("HFPRAW", "0010000000000000")}, "hfp_range",
          note="A and B need 56 and 55 significant bits (binary64 holds 53); C, D, E lie outside binary32's range")])
book("c45_hfp_unnorm", "HFP unnormalized fraction, negative zero, zero fraction with non-zero characteristic",
     [H("C45-A", "COMP-1"), H("C45-B", "COMP-1"), H("C45-C", "COMP-1"), H("C45-D", "COMP-2"), H("C45-E", "COMP-2")],
     [rec({"C45-A": ("HFPRAW", "42010000"), "C45-B": ("HFPRAW", "80000000"), "C45-C": ("HFPRAW", "4A000000"),
           "C45-D": ("HFPRAW", "4400000100000000"), "C45-E": ("HFPRAW", "C110000000000000")}, "hfp_unnormalized")])
# --- SYNCHRONIZED slack bytes ------------------------------------------------------------------
book("c46_sync_binary", "SYNC halfword/fullword/doubleword binary: slack bytes before each item",
     [X("C46-A", 1), B("C46-H", 4, sync=True), X("C46-B", 3), B("C46-F", 9, sync=True), X("C46-C", 1), B("C46-D", 18, sync=True),
      X("C46-E", 2)],
     [rec({"C46-A": "A", "C46-H": -2, "C46-B": "BBB", "C46-F": 123456789, "C46-C": "C", "C46-D": -123456789012345678, "C46-E": "ZZ"},
          "sync", slack=0x00, note="slack bytes X'00'"),
      rec({"C46-A": "Q", "C46-H": 9999, "C46-B": "XYZ", "C46-F": -1, "C46-C": "D", "C46-D": 999999999999999999, "C46-E": "YY"},
          "sync", slack=0x40, note="slack bytes X'40'")], sync=True)
book("c47_sync_ibm_ex1", "SYNC in a subgroup (IBM LR 'Slack bytes within records', first example)",
     [X("C47-B", 5), G("C47-C", [X("C47-D", 2), B("C47-E", 6, sync=True)])],
     [rec({"C47-B": "HELLO", "C47-D": "AB", "C47-E": -654321}, "sync")], sync=True)
book("c48_sync_occurs", "SYNC inside OCCURS: slack before COMP-PAY and at the end of every occurrence (IBM LR second example)",
     [X("C48-CODE", 1), G("C48-TABLE", [X("C48-TYPE", 1), B("C48-PAY", 6, 2, sync=True), B("C48-HOURS", 3, sync=True), X("C48-NAME", 5)],
                          occurs=3), X("C48-END", 2)],
     [rec({"C48-CODE": "W", "C48-TYPE(1)": "A", "C48-PAY(1)": D("1234.56"), "C48-HOURS(1)": 40, "C48-NAME(1)": "ANNA",
           "C48-TYPE(2)": "B", "C48-PAY(2)": D("-99.99"), "C48-HOURS(2)": -7, "C48-NAME(2)": "BOB",
           "C48-TYPE(3)": "C", "C48-PAY(3)": D("0.01"), "C48-HOURS(3)": 999, "C48-NAME(3)": "CLARA", "C48-END": "EN"}, "sync")],
     sync=True)
book("c49_sync_float", "SYNC COMP-1 (fullword) and COMP-2 (doubleword, 7 slack bytes)",
     [X("C49-A", 3), H("C49-F1", "COMP-1", sync=True), X("C49-B", 1), H("C49-F2", "COMP-2", sync=True), X("C49-C", 2)],
     [rec({"C49-A": "ABC", "C49-F1": D("-118.625"), "C49-B": "Z", "C49-F2": 1234, "C49-C": "EN"}, "sync")], sync=True)
book("c50_sync_noeffect", "SYNC on COMP-3, zoned and PIC X items has no effect; an unsynchronized binary at an odd offset",
     [X("C50-A", 1), P("C50-P", 3, sync=True), Z("C50-Z", 3, signed=False, sync=True), X("C50-T", 2, sync=True),
      X("C50-X", 1), B("C50-H", 4)],
     [rec({"C50-A": "K", "C50-P": -123, "C50-Z": 456, "C50-T": "TT", "C50-X": "X", "C50-H": -300}, "sync")], sync=True)
book("c51_sync_level01", "SYNC on the level-01 group applies to every elementary binary item",
     [X("C51-A", 1), B("C51-H", 4), X("C51-B", 1), B("C51-F", 9, signed=False, usage="COMP-5"), X("C51-C", 2)],
     [rec({"C51-A": "L", "C51-H": -1, "C51-B": "M", "C51-F": 4000000000, "C51-C": "EN"}, "sync")], root_sync=True)
# --- USAGE NATIONAL ------------------------------------------------------------------------------
book("c52_nat_text", "PIC N USAGE NATIONAL: Latin, CJK and Greek text, followed by an EBCDIC field",
     [N("C52-A", 8), N("C52-B", 3), N("C52-C", 5), X("C52-D", 4)],
     [rec({"C52-A": "Grüße", "C52-B": "日本語", "C52-C": "Ωμέγα", "C52-D": "TAIL"}, "national_text")])
book("c53_nat_surrogate", "PIC N with supplementary characters (surrogate pairs occupy two positions)",
     [N("C53-A", 4), N("C53-B", 2), X("C53-C", 2)],
     [rec({"C53-A": "A\U0001F600B", "C53-B": "\U0001D11E", "C53-C": "OK"}, "national_surrogate")])
book("c54_nat_decimal", "national decimal: unsigned, SIGN LEADING/TRAILING SEPARATE, implied decimals",
     [ND("C54-A", 4), ND("C54-B", 4, signed=True, mode="leading_sep"), ND("C54-C", 4, signed=True, mode="trailing_sep"),
      ND("C54-D", 7, 2, signed=True, mode="trailing_sep"), ND("C54-E", 4, 1)],
     [rec({"C54-A": 1234, "C54-B": -1234, "C54-C": 1234, "C54-D": D("-123.45"), "C54-E": D("12.5")}, "national_decimal"),
      rec({"C54-A": 0, "C54-B": 1234, "C54-C": -1, "C54-D": D("0.01"), "C54-E": D("999.9")}, "national_decimal")])
book("c55_mf_nat_digit", "must-fail: national decimal holding 'A', and EBCDIC zoned bytes in a national field",
     [ND("C55-BAD", 4), ND("C55-EBC", 4), ND("C55-OK", 2)],
     [rec({"C55-BAD": ("RAW", "0031004100330034", "REJECT"), "C55-EBC": ("RAW", "F1F2F3F4F5F6F7F8", "REJECT"), "C55-OK": 42},
          "mustfail_national", must_fail=True)])
book("c56_mf_nat_sign", "must-fail: national decimal with '*' as separate sign, and an EBCDIC minus byte as the sign",
     [ND("C56-STAR", 3, signed=True, mode="leading_sep"), ND("C56-EBCSIGN", 3, signed=True, mode="trailing_sep"),
      ND("C56-OK", 3, signed=True, mode="leading_sep")],
     [rec({"C56-STAR": ("RAW", "002A003100320033", "REJECT"), "C56-EBCSIGN": ("RAW", "0031003200330060", "REJECT"), "C56-OK": -7},
          "mustfail_national", must_fail=True)])
book("c57_mf_nat_surrogate", "must-fail: PIC N holding an unpaired high surrogate and an unpaired low surrogate",
     [N("C57-HI", 3), N("C57-LO", 2), X("C57-OK", 2)],
     [rec({"C57-HI": ("RAW", "D83D00410042", "REJECT"), "C57-LO": ("RAW", "DC000041", "REJECT"), "C57-OK": "OK"},
          "mustfail_national_text", must_fail=True, note="U+FFFD in place of the ill-formed unit counts as a flag")])
# --- RDW-prefixed variable-length files -------------------------------------------------------------
book("c58_rdw_basic", "RDW file: three records of one layout",
     [X("C58-ID", 6), P("C58-AMT", 9, 2), B("C58-QTY", 4)],
     [[rec({"C58-ID": "ACC001", "C58-AMT": D("1234567.89"), "C58-QTY": 7}, "rdw"),
       rec({"C58-ID": "ACC002", "C58-AMT": D("-0.01"), "C58-QTY": -32}, "rdw"),
       rec({"C58-ID": "ACC003", "C58-AMT": 0, "C58-QTY": 9999}, "rdw")]], framing="rdw")

def odo59(n, codes, amts, trailer):
    v = {"C59-COUNT": n, "C59-TRAILER": trailer}
    for i in range(n): v["C59-CODE(%d)" % (i + 1)] = codes[i]; v["C59-AMT(%d)" % (i + 1)] = amts[i]
    return v
book("c59_rdw_odo", "RDW file: OCCURS DEPENDING ON sets each record's length (2, 0 and 5 entries)",
     [Z("C59-COUNT", 2, signed=False), G("C59-ITEM", [X("C59-CODE", 3), P("C59-AMT", 5)], odo=("C59-COUNT", 0, 5)), X("C59-TRAILER", 4)],
     [[rec(odo59(2, ["AAA", "BBB"], [11, -22], "T002"), "rdw", odo={"C59-COUNT": 2}),
       rec(odo59(0, [], [], "T000"), "rdw", odo={"C59-COUNT": 0}),
       rec(odo59(5, ["C1", "C2", "C3", "C4", "C5"], [1, 2, 3, 4, -99999], "T005"), "rdw", odo={"C59-COUNT": 5})]], framing="rdw")
book("c60_rdw_short", "RDW file: short records that end after the active REDEFINES variant",
     [X("C60-TYPE", 1), G("C60-BODY-B", [X("C60-B-NAME", 20), B("C60-B-CNT", 9)]),
      redef(G("C60-BODY-A", [X("C60-A-CODE", 4), P("C60-A-AMT", 5)]), "C60-BODY-B")],
     [[rec({"C60-TYPE": "A", "C60-A-CODE": "CODE", "C60-A-AMT": -12345}, "rdw_short_record", length=8,
           note="8 data bytes: the record ends after the 7-byte variant A"),
       rec({"C60-TYPE": "B", "C60-B-NAME": "LONG VARIANT NAME", "C60-B-CNT": 123456789}, "rdw_short_record"),
       rec({"C60-TYPE": "A", "C60-A-CODE": "XY", "C60-A-AMT": 7}, "rdw_short_record", length=8)]], framing="rdw")
book("c61_mf_rdw_len", "must-fail RDW: a record length of 3 (below the 4-byte minimum)",
     [X("C61-ID", 6), P("C61-AMT", 9, 2), B("C61-QTY", 4)],
     [[rec({"C61-ID": "OK0001", "C61-AMT": D("10.50"), "C61-QTY": 1}, "rdw"),
       mf_rdw("len3", rec({"C61-ID": "BAD002", "C61-AMT": D("20.00"), "C61-QTY": 2}, "rdw"),
              "RDW X'00030000' followed by the 13 data bytes of a record")]], framing="rdw")
book("c62_mf_rdw_spanned", "must-fail RDW: a record split into two spanned segments (third byte X'01', then X'02') in a non-spanned file",
     [X("C62-ID", 6), P("C62-AMT", 9, 2), B("C62-QTY", 4)],
     [[rec({"C62-ID": "OK0001", "C62-AMT": D("10.50"), "C62-QTY": 1}, "rdw"),
       mf_rdw("spanned", rec({"C62-ID": "SPAN02", "C62-AMT": D("-30.25"), "C62-QTY": 3}, "rdw"),
              "one logical record written as two segments: 6 data bytes with X'0100', then 7 with X'0200'")]], framing="rdw")
book("c63_mf_rdw_trunc", "must-fail RDW: the last RDW promises 13 data bytes, the file ends after 5",
     [X("C63-ID", 6), P("C63-AMT", 9, 2), B("C63-QTY", 4)],
     [[rec({"C63-ID": "OK0001", "C63-AMT": D("10.50"), "C63-QTY": 1}, "rdw"),
       mf_rdw("trunc", rec({"C63-ID": "TRUNC2", "C63-AMT": D("40.00"), "C63-QTY": 4}, "rdw"),
              "RDW X'00110000' then only 5 data bytes before end of file")]], framing="rdw")

# --- PIC N without a USAGE clause (national under the default NSYMBOL(NATIONAL)) ----------------------
book("c64_nat_text_implicit", "PIC N(n) with no USAGE clause: the c52 values",
     [N("C64-A", 8, implicit=True), N("C64-B", 3, implicit=True), N("C64-C", 5, implicit=True), X("C64-D", 4)],
     [rec({"C64-A": "Grüße", "C64-B": "日本語", "C64-C": "Ωμέγα", "C64-D": "TAIL"}, "national_text")])
book("c65_nat_surrogate_implicit", "PIC N(n) with no USAGE clause: the c53 surrogate pairs",
     [N("C65-A", 4, implicit=True), N("C65-B", 2, implicit=True), X("C65-C", 2)],
     [rec({"C65-A": "A\U0001F600B", "C65-B": "\U0001D11E", "C65-C": "OK"}, "national_surrogate")])
book("c66_mf_nat_surr_implicit", "must-fail: the c57 unpaired surrogates, PIC N(n) with no USAGE clause",
     [N("C66-HI", 3, implicit=True), N("C66-LO", 2, implicit=True), X("C66-OK", 2)],
     [rec({"C66-HI": ("RAW", "D83D00410042", "REJECT"), "C66-LO": ("RAW", "DC000041", "REJECT"), "C66-OK": "OK"},
          "mustfail_national_text", must_fail=True, note="U+FFFD in place of the ill-formed unit counts as a flag")])


def float_meta(q):
    import struct
    q = Fraction(q)
    try: b64 = Fraction(float(q)) == q
    except OverflowError: b64 = False
    try: b32 = Fraction(struct.unpack(">f", struct.pack(">f", float(q)))[0]) == q
    except (OverflowError, struct.error): b32 = False
    return {"ieee_binary64_exact": b64, "ieee_binary32_exact": b32}


def field_meta(root, exp, r, first_slack):
    fields = {}
    dep = odo_dependent_names(root)
    for k, (f, e, off, ln) in sorted(exp.items()):
        d = exp_repr(f, e)
        d["usage"] = usage_of(f); d["pic"] = f.clause(); d["offset"] = off; d["length"] = ln
        if f.name in dep: d["odo_dependent"] = True
        if f.redefines: d["elementary_redefines"] = True
        if first_slack is not None and off >= first_slack: d["sync_dependent"] = True
        if f.kind == "H": d.update(float_meta(Fraction(e)))
        d["hazard"] = r["hz"]
        if r["must_fail"] and d["expect"] != "REJECT": d["hazard"] = "mustfail_sibling"
        if k.split("(")[0] in r["reject_ok"]: d["reject_acceptable"] = True
        fields[k] = d
    return fields


def rdw(n, b3=0):
    return n.to_bytes(2, "big") + bytes([b3, 0])


def main():
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT + "/copybooks"); os.makedirs(OUT + "/records")
    manifest = {"licence": "CC0-1.0", "generator": "gen_corpus.py", "corpus_version": 2, "encoding_rules":
                [{"field_type": a, "rule": b, "source": c} for a, b, c in RULES], "copybooks": []}
    nrec = nfield = nfile = 0
    for bid, title, root, recs, framing in BOOKS:
        cpy = copybook_text(root)
        with open("%s/copybooks/%s.cpy" % (OUT, bid), "w") as fh: fh.write(cpy)
        entry = {"id": bid, "title": title, "copybook": "copybooks/%s.cpy" % bid, "max_record_length": root.size(),
                 "framing": framing, "records": []}
        if framing == "fixed":
            for i, r in enumerate(recs):
                data, exp, fs = encode_record(root, r["values"], r["cp"], r["hz"], r["odo"], r["slack"])
                rid = "%s_r%02d" % (bid, i + 1)
                with open("%s/records/%s.bin" % (OUT, rid), "wb") as fh: fh.write(data)
                fields = field_meta(root, exp, r, fs)
                e = {"id": rid, "file": "records/%s.bin" % rid, "length": len(data), "hex": data.hex(),
                     "declared_codepage": "cp037" if r["cp"] == "ascii" else r["cp"],
                     "encoded_with": r["cp"], "must_fail": r["must_fail"], "note": r["note"], "fields": fields}
                if fs is not None: e["slack_fill"] = "%02X" % r["slack"]
                entry["records"].append(e)
                nrec += 1; nfield += len(fields)
        else:
            entry["files"] = []
            for fi, items in enumerate(recs):
                fid = "%s_f%02d" % (bid, fi + 1)
                fbytes = bytearray(); file_mf = any("mf_rdw" in it for it in items)
                for k, it in enumerate(items):
                    r = it["rec"] if "mf_rdw" in it else it
                    data, exp, fs = encode_record(root, r["values"], r["cp"], r["hz"], r["odo"], r["slack"])
                    if r["length"] is not None:
                        assert all(off + ln <= r["length"] for (_, _, off, ln) in exp.values())
                        data = data[:r["length"]]
                    rid = "%s_r%02d" % (fid, k + 1)
                    if "mf_rdw" in it:
                        kind = it["mf_rdw"]
                        if kind == "len3":
                            framed = rdw(3) + data
                        elif kind == "spanned":
                            h = len(data) // 2
                            framed = rdw(h + 4, 0x01) + data[:h] + rdw(len(data) - h + 4, 0x02) + data[h:]
                        elif kind == "trunc":
                            framed = rdw(len(data) + 4) + data[:5]
                        else:
                            raise ValueError(kind)
                        fields = {"*RECORD*": {"expect": "REJECT", "usage": "RDW", "hazard": "mustfail_rdw", "record_level": True,
                                               "pic": "RDW %s" % framed[:4].hex().upper(), "offset": len(fbytes),
                                               "length": len(framed)}}
                        note, mf = it["note"], True
                    else:
                        framed = rdw(len(data) + 4) + data
                        fields = field_meta(root, exp, r, fs)
                        if file_mf:
                            for d in fields.values(): d["hazard"] = "rdw_mustfail_sibling"; d["file_must_fail"] = True
                        note, mf = r["note"], False
                    entry["records"].append({"id": rid, "file": "records/%s.bin" % fid, "file_id": fid, "index": k + 1,
                                             "rdw": framed[:4].hex(), "length": len(data), "hex": data.hex(),
                                             "declared_codepage": r["cp"], "encoded_with": r["cp"], "must_fail": mf,
                                             "note": note, "fields": fields})
                    fbytes += framed; nrec += 1; nfield += len(fields)
                with open("%s/records/%s.bin" % (OUT, fid), "wb") as fh: fh.write(bytes(fbytes))
                entry["files"].append({"id": fid, "file": "records/%s.bin" % fid, "length": len(fbytes), "hex": fbytes.hex(),
                                       "n_records": len(items), "must_fail": file_mf, "declared_codepage": "cp037"})
                nfile += 1
        manifest["copybooks"].append(entry)
    manifest["counts"] = {"copybooks": len(BOOKS), "records": nrec, "compared_fields": nfield, "rdw_files": nfile,
                          "copybooks_v1": sum(1 for b in BOOKS if int(b[0][1:3]) <= 41),
                          "copybooks_v2": sum(1 for b in BOOKS if int(b[0][1:3]) > 41)}
    with open(OUT + "/expected.json", "w") as fh:
        json.dump(manifest, fh, indent=1, sort_keys=True, ensure_ascii=False); fh.write("\n")
    with open(OUT + "/LICENSE", "w") as fh:
        fh.write("CC0 1.0 Universal. To the extent possible under law, the authors have waived all copyright and related or\n"
                 "neighboring rights to the copybooks, records and expected values in this directory.\n"
                 "https://creativecommons.org/publicdomain/zero/1.0/\n")
    print(json.dumps(manifest["counts"]))


if __name__ == "__main__":
    main()
