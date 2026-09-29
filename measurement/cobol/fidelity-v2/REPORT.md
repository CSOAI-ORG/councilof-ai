# COBOL copybook decoder fidelity — corpus v2: COMP-1/COMP-2, SYNC, NATIONAL, RDW

Council of AI (CSOAI) measurement lane `cobol-v2-20260928`, extending lane `cobol-fidelity-20260928` (corpus v1). **Measurement only**: this report states what each decoder emitted for bytes whose meaning is known by construction. It is not a rating or ranking of any decoder, and it fixes nothing. It has not been published and no maintainer has been contacted.

## What was measured

Corpus v2 keeps the 41 v1 copybooks byte-for-byte and adds **25 copybooks** for four constructs v1 left out: COMP-1/COMP-2 (IBM hexadecimal floating point), SYNCHRONIZED slack bytes, USAGE NATIONAL (UTF-16 text and national decimal) and RDW-prefixed variable-length files. In total: **66 copybooks, 87 records (15 of them in 6 RDW files) and 329 compared fields**, CC0-1.0, in `corpus/`. The v2 part alone is 38 records and 163 compared fields.

**7 decoder configurations** produced **2153 (decoder, record, field) results** in `results.jsonl` (991 on v2 copybooks). RDW files were given only to the decoders that have an RDW reader; the others are UNMEASURED for RDW (below).

**v1 regression:** the 1162 rows this run produced for copybooks c01-c41 are byte-identical to the 1162 rows of the v1 run (`v1-baseline/results.jsonl`, sha256 `34861ce970b2600d1c9c243a5f31cfaca9098fe6b2d30b3c8b44f56c8498f339`).

## Independent check of the corpus

`verify_vectors.py` runs before any decoder and stops the run on any disagreement (`work/verify_vectors.json`, result: **all checks agree**).

- **Values:** a reference decoder written separately from the generator (its own PICTURE parser; stdlib code-page and UTF-16 codecs instead of the generator's hand tables; exact integer/Decimal arithmetic for hexadecimal floating point) re-derived 310 of 310 field values from the bytes, and refused all 19 must-fail controls (including 3 RDW framing errors, found at the expected record by its own RDW walker; 12 valid RDW records matched byte for byte).
- **Offsets:** field offsets were recomputed from the copybook *text* with its own implementation of the LR slack-byte rules for every copybook without ODO or REDEFINES: 250 offsets checked.
- **Published vectors:** 19 checks against bytes printed in IBM documentation — the PG numeric table (COMP-1/COMP-2 +/-1234, national decimal with and without SIGN SEPARATE, COMP-5) and the offsets of the two LR slack-byte examples (reproduced as c47 and c48).
- While the corpus was being built this check found one generator defect (the exact decimal of 2^-260 was rounded to 80 digits by `Decimal.scaleb`); it was fixed before this run. An injected wrong offset, a wrong expected float and a must-fail control relabelled as valid were each caught.

## Method

1. **Corpus by construction.** `gen_corpus.py` defines each copybook as data, writes the copybook text from it, and encodes values chosen in the script with its own encoder (hand-written code-page tables, nibble/zone/binary packing, UTF-16 surrogate arithmetic, hexadecimal floating point from exact fractions; no decoder under test and no codec is used to produce bytes — codecs only cross-check and abort the build on disagreement). The expected value of every field is the value that was encoded; for COMP-1/COMP-2 it is the exact value the bytes hold.
2. **Framing.** Fixed-length copybooks: one record per `.bin` file; record length = file length. RDW copybooks: one file of several RDW-prefixed records; decoded records are matched to expected records by position. A must-fail RDW record is compared as a whole (`*RECORD*`).
3. **Configuration.** Each decoder is driven through its documented public entry point and told the record's code page where it has a parameter for it, and the RDW convention (big-endian, length includes the RDW) where it has options for it.
4. **Comparison.** Numbers by exact decimal value; text after removing trailing spaces. COMP-1/COMP-2 only: a rendering that is not the exact decimal also matches when the digits parse to the IEEE-754 binary64 value that equals the field's value exactly (a decoder that prints a double with shortest round-trip digits); a field whose value binary64 cannot hold cannot match that way, and such rows say so.
5. **Verdicts.** MATCH; MISMATCH; REJECTED (error or null for the field, the record or the whole file); FLAGGED (a PIC N must-fail control rendered with U+FFFD in place of the ill-formed unit); UNSUPPORTED (the decoder's own error message says so, or its README or source declares it — quoted below); ERROR (the copybook itself could not be loaded). 
6. **Expected outcome (`outcome_ok`).** v1 rules unchanged. Added: FLAGGED on a PIC N must-fail control; REJECTED on an RDW must-fail record; REJECTED on a valid record of an RDW must-fail file only when the whole file was rejected. A must-fail RDW record that is emitted, or silently absent, is not the expected outcome.
7. **Name mapping.** As in v1 (`_`→`-`, JRecord 0-based subscripts → 1-based, cobolio's innermost-first suffix reversed, aws_mdu repeats mapped in row-major order).

## Encoding rules and sources

LR = IBM Enterprise COBOL for z/OS Language Reference 6.4 (SC27-8713); PG = Programming Guide 6.4 (SC27-8714); POP = z/Architecture Principles of Operation (SA22-7832); DFSMS = z/OS DFSMS Using Data Sets. The first twelve rows are v1's.

| Field type | Rule used by the encoder | Source |
|---|---|---|
| PIC X(n) DISPLAY | n bytes, one EBCDIC code point per character, in the code page of the record. | LR, PICTURE clause (symbol X) and USAGE DISPLAY; IBM CDRA code page charts CCSID 37/500/1140 |
| PIC 9(n) / S9(n) DISPLAY (zoned decimal) | n bytes; each byte = zone nibble X'F' + digit nibble. Signed items carry the sign in the zone nibble of the rightmost byte (default SIGN TRAILING): X'C' positive, X'D' negative; unsigned items keep X'F'. SIGN LEADING moves the sign zone to the leftmost byte. SIGN ... SEPARATE CHARACTER adds one byte holding '+' (X'4E') or '-' (X'60') and leaves all digit zones X'F'. | LR, USAGE DISPLAY and SIGN clause; PG, 'Examples: numeric data and internal representation' |
| PIC S9(n) COMP-3 / PACKED-DECIMAL | floor(n/2)+1 bytes; two digit nibbles per byte, most significant first, left-padded with a zero nibble when n is even; the rightmost nibble is the sign: X'C' positive, X'D' negative, X'F' for unsigned items. | LR, USAGE PACKED-DECIMAL; PG, 'Examples: numeric data and internal representation' |
| Sign nibble codes | X'A', X'C', X'E', X'F' are valid plus signs and X'B', X'D' valid minus signs; X'0'-X'9' are invalid as a sign and X'A'-X'F' are invalid as a digit (data exception). A negative zero (digits 0, minus sign) has the numeric value zero. | POP, 'Decimal-number formats' (sign and digit codes); PG, 'Sign representation of zoned and packed-decimal data' (NUMPROC) |
| PIC S9(n) COMP / COMP-4 / BINARY | two's-complement big-endian binary: 2 bytes for n=1-4, 4 bytes for n=5-9, 8 bytes for n=10-18. Values in this corpus stay within the PICTURE digit range, so TRUNC(STD) and TRUNC(BIN) agree on them. | LR, USAGE BINARY/COMPUTATIONAL/COMPUTATIONAL-4; POP, fixed-point binary representation (big-endian) |
| PIC S9(n) COMP-5 | same storage size as COMP, but the value may use the full binary capacity of the 2/4/8 bytes regardless of the PICTURE digit count (e.g. PIC 9(4) COMP-5 holds 0-65535). Unsigned items are unsigned binary. | LR, USAGE COMPUTATIONAL-5 ('native binary') |
| V (implied decimal point) | V marks an assumed decimal point and occupies no storage; the stored digits are value x 10^scale. | LR, PICTURE clause, symbol V |
| P (decimal scaling position) | each P is an assumed digit position that occupies no storage. 999PP stores d and means d x 100; VPP999 stores d and means d x 10^-5. | LR, PICTURE clause, symbol P |
| REDEFINES | the redefining entry describes the same storage as the redefined entry; it does not advance the offset of the next item. | LR, REDEFINES clause |
| OCCURS n TIMES | the entry is repeated n times contiguously. | LR, OCCURS clause |
| OCCURS m TO n TIMES DEPENDING ON c | only the current value of c occurrences are present in the record; items that follow the table start immediately after the last present occurrence (variably located items, 'complex ODO'). | LR, OCCURS DEPENDING ON; PG, 'Complex OCCURS DEPENDING ON' |
| Must-fail criterion | a control field is not NUMERIC under the COBOL class test (invalid digit nibble, invalid sign nibble, or zoned byte whose zone is not X'F' before the sign position). A correct decoder rejects or flags it instead of emitting a number. | LR, 'Class condition' (NUMERIC); POP, data exception on invalid digit/sign codes |
| COMP-1 / COMP-2 (hexadecimal floating point) | COMP-1 = 4 bytes (short HFP), COMP-2 = 8 bytes (long HFP): bit 0 sign, bits 1-7 characteristic (exponent + 64, base 16), then a 24-bit (short) or 56-bit (long) fraction; value = (-1)^sign x 0.fraction(hex) x 16^(characteristic-64). Normalized values have a non-zero leading hex digit; unnormalized fractions are still values; a zero fraction is zero whatever the sign and characteristic. Published vectors: COMP-1 +1234 = X'434D2000', -1234 = X'C34D2000'; COMP-2 +1234 = X'434D200000000000'. | PG, 'Examples: numeric data and internal representation' (COMP-1/COMP-2 rows); POP, 'Hexadecimal-floating-point number representation' |
| SYNCHRONIZED (slack bytes within records) | A SYNC binary item with PICTURE S9-S9(4) is placed at an offset that is a multiple of 2 from the start of the record, S9(5)-S9(18) a multiple of 4; COMP-1 a multiple of 4; COMP-2 a multiple of 8. The compiler inserts m-r slack bytes immediately before the item, where r is the preceding byte count mod m. SYNC on a level-01 group applies to every elementary item in it. SYNC on DISPLAY, NATIONAL or PACKED-DECIMAL items has no effect. Slack bytes hold no data; this corpus fills them with X'00' or X'40' (stated per record) and never scores them. | LR 6.4, SYNCHRONIZED clause; LR, 'Slack bytes within records' (worked examples reproduced as c47 and c48) |
| SYNCHRONIZED inside OCCURS (inter-occurrence slack) | For a group with an OCCURS clause, the size of one occurrence (including slack bytes within it) is divided by the largest m of any elementary item in the group; if the remainder r is not zero, m-r slack bytes are added at the end of each occurrence, so every occurrence starts at the same relative alignment as the first. | LR, 'Slack bytes within records' (OCCURS example: 1 + 2 + 4 + 2 + 5 = 14 bytes, + 2 slack = 16 per occurrence) |
| PIC N(n) USAGE NATIONAL | n national character positions of 2 bytes each, UTF-16 big-endian (CCSID 1200). A supplementary character (above U+FFFF) is a surrogate pair and occupies two positions. Padding is the national space U+0020. A PICTURE of only N with no USAGE clause is national under the default compiler option NSYMBOL(NATIONAL) (c64-c66 repeat c52, c53 and c57 in that form). | PG, 'Unicode and the encoding of language characters' (Enterprise COBOL for z/OS: UTF-16 big-endian national data; one encoding unit = 2 bytes); Unicode Standard, section 3.9 (UTF-16 surrogate pairs); Enterprise COBOL 6.4, NSYMBOL compiler option (default NSYMBOL(NATIONAL): 'treated as if the USAGE NATIONAL clause is specified') |
| PIC 9(n) / S9(n) USAGE NATIONAL (national decimal) | one national character (2 bytes, U+0030-U+0039) per digit; a signed item must have SIGN SEPARATE, the sign being national '+' (U+002B) or '-' (U+002D) before or after the digits. Published vectors: PIC 9999 NATIONAL 1234 = X'0031003200330034'; SIGN LEADING SEPARATE -1234 = X'002D0031003200330034'; SIGN TRAILING SEPARATE +1234 = X'0031003200330034002B'. | PG, 'Defining national numeric data items' (S requires SIGN IS SEPARATE); PG, 'Examples: numeric data and internal representation' |
| Must-fail criterion (national) | a national decimal control holds a character that is not a national digit or sign (e.g. 'A', or EBCDIC zoned bytes read as UTF-16), so it is not NUMERIC under the class test; a PIC N control holds an unpaired surrogate, which is ill-formed UTF-16. A correct decoder rejects the field or flags it (for text: emits U+FFFD in place of the ill-formed unit) instead of emitting a plausible value. | LR, 'Class condition' (NUMERIC, national); Unicode Standard, conformance clause C10 (ill-formed code unit sequences are an error condition and are not interpreted as characters) |
| RDW-prefixed variable-length records (RECFM=V) | each logical record is preceded by a 4-byte record descriptor word: bytes 1-2 = record length LL including the 4-byte RDW (big-endian halfword, 4 to 32,760), bytes 3-4 = X'0000' for non-spanned records. The data after the RDW is the COBOL record; it may be shorter than the copybook (ODO tables, short REDEFINES variants). No block descriptor words (BDW) are present in this corpus. | DFSMS, 'Record descriptor word (RDW)'; POP, halfword binary integers are big-endian |
| Must-fail criterion (RDW) | an RDW with LL below 4; an RDW whose bytes 3-4 are not zero (they 'are used for spanned records'; here a record split into two segments marked X'01' and X'02'); a last RDW whose LL runs past the end of the file. A correct reader reports the framing error instead of emitting, dropping or padding a record without notice. | DFSMS, 'Record descriptor word (RDW)': 'The length can be from 4 to 32,760' and 'All bits of the third and fourth bytes must be 0, because other values are used for spanned records' |

## Environment

RunPod pod (Ubuntu 20.04), Eclipse Temurin JDK 17.0.12+7, CPython 3.11.8 (uv-managed venv synced to `requirements.lock`), Cobrix in Spark local mode (`local[1]`). The same pinned tools as v1 (`setup.sh` verifies every checksum and commit).

## Decoders measured

| id | decoder | version / pin | licence | how it was driven | RDW files |
|---|---|---|---|---|---|
| `aws_mdu` | aws-samples/mainframe-data-utilities | git 5fc427629e51b87d4c6310860cac6f93c0eb756c (2025-08-25) | Apache-2.0 | copybook parsed by its core/parsecp.py (fresh interpreter per copybook); each field decoded with its core/ebcdic.unpack() exactly as core/extract.write_output() calls it; every alternate REDEFINES layout it generates is decoded and merged after the base layout. No code-page parameter: text is decoded as cp037 inside unpack(). | driven: core/extract.read(file, 'vb', lrecl) called until it returns empty, the loop core/extract.FileProcess runs (README: 'To convert a Variable Block file you need to inform the -input-recfm vb'); each record then decoded as in the fixed-length path. |
| `cobolio` | cobolio | 0.1.5 (PyPI) | MIT | cobolio.copybook_to_layout(copybook) then cobolio.loads(record, layout, input_encoding=<declared page>). | **UNMEASURED**: no RDW or variable-length reader in the public API: loads() takes one record's bytes, and the bundled CLI (cobolio/cli/cob_to_csv.py, yield_records) reads fixed rec_size chunks. |
| `coboljsonifier` | coboljsonifier | 1.0.8 (PyPI) | MIT per PyPI metadata; the GitHub repository (jrperin/cobol-copybook.jsonifier) declares no licence | CopybookExtractor(copybook).dict_book_structure -> Parser(structure, ParseType.BINARY_EBCDIC).build().parse(record).value. No code-page parameter: text is decoded as cp500 inside the library. | **UNMEASURED**: no file reader in the public API: Parser(...).build().parse(record) takes one record's bytes. |
| `cobrix` | Cobrix (spark-cobol) | 2.11.1 (Maven Central, scala 2.12) on pyspark 3.4.4, Spark local[1] | Apache-2.0 | spark.read.format('cobol') with encoding=ebcdic, ebcdic_code_page=<declared page>, record_format=F, record_length=<file length>, variable_size_occurs=true, schema_retention_policy=collapse_root, pedantic=true. | driven: record_format=V, is_rdw_big_endian=true, is_rdw_part_of_record_length=true, generate_record_id=true (rows ordered by Record_Id). README: 'Specifies if RDW headers are big endian. They are considered little-endian by default.' and 'By default RDW headers count only payload record in record length, not RDW headers themselves.' |
| `jrecord` | JRecord (COBOL builder) | JRecord 0.93.3 (GitHub release jar) with cb2xml 1.01.08 on the classpath | LGPL-3.0 (JRecord), LGPL-2.1 (cb2xml) | JRecordInterface1.COBOL.newIOBuilder(copybook).setFont(<Java charset for declared page>).setFileOrganization(IO_FIXED_LENGTH).setDialect(FMT_MAINFRAME).setSplitCopybook(SPLIT_NONE); newLine(recordBytes); getFieldValue(field).asString() for every field of record 0. | driven: setFileOrganization(Constants.IO_VB) and newReader(file).read() until null, same font and dialect. |
| `jrecord_cb2xml` | cb2xml + JRecord (XML path) | cb2xml 1.01.08 (GitHub release jar) -> JRecord 0.93.3 | LGPL-2.1 (cb2xml), LGPL-3.0 (JRecord) | net.sf.cb2xml.Cb2Xml2.convertToXMLDOM(copybook, false, FMT_MAINFRAME) -> XML file -> JRecordInterface1.CB2XML.newIOBuilder(xml) with the same font/organisation settings; same field read-out as the COBOL builder. | driven: setFileOrganization(Constants.IO_VB) and newReader(file).read() until null, same font. |
| `wilcoyay_cbp` | wilcoyay/copybook-parser | git 82ebbec9ba4c117a39e0ac3225cf910a576c3bdc (2026-09-21), compiled with javac (Main.java, which needs Jackson, left out) | MIT | CopybookParser.parse(copybookText) then RecordDecoder.decode(schema, recordBytes); values rendered with toString(). | **UNMEASURED**: README: 'Parses COBOL copybooks and decodes fixed-length EBCDIC records'; RecordDecoder.decode(schema, bytes) takes one record. |

Declared limitations applied (verbatim from each project's README or source):

- `aws_mdu` — README Backlog > Copybook parser: 'OCCURS DEPENDING ON copybook parsing.' → fields matching `odo_dependent` are UNSUPPORTED.
- `aws_mdu` — README Limitations: 'The REDEFINES statement for data items, it's only supported for group items.' → fields matching `elementary_redefines` are UNSUPPORTED.
- `aws_mdu` — README Backlog: 'Add similar packing statements (BINARY, PACKED-DECIMAL...)' → fields matching `usage BINARY` are UNSUPPORTED.
- `cobolio` — README Limitations: 'No support for OCCURS DEPENDING ON clause in copybook.' → fields matching `odo_dependent` are UNSUPPORTED.
- `wilcoyay_cbp` — README 'Doesn't handle': 'COMP / COMP-1 / COMP-2 (binary/float usage), only DISPLAY and COMP-3' → fields matching `usage COMP,COMP-4,BINARY,COMP-5,COMP-1,COMP-2` are UNSUPPORTED.
- `wilcoyay_cbp` — README 'Handles': 'EBCDIC text via the JDK's built-in Cp037 charset' → fields matching `codepage_only cp037` are UNSUPPORTED.
- `wilcoyay_cbp` — source comment, src/main/java/com/wilcoyay/copybook/CopybookParser.java lines 13-14: 'not handled: 88-level condition names, COMP/COMP-1/COMP-2, SYNC, REDEFINES chains more than one level deep, edited PICs.' → fields matching `sync_dependent` are UNSUPPORTED.

### SELF (sister product; not ranked)

`cobol-bridge-mcp` 1.1.11 (PyPI) — **SELF (sister product; not ranked)**. Kept out of every comparison. Status: **UNMEASURED** — the installed wheel exposes 5 MCP tools (`parse_cobol_program`, `identify_business_rules`, `estimate_migration_complexity`, `plan_migration_phases`, `generate_test_harness`); none takes record bytes and a copybook and returns field values (`has_decode_path`: false, from `work/self_check.json`).

### UNMEASURED

- **ebcdic-parser 3.4.0 (PyPI, MIT)** — takes no copybook: it needs a hand-written JSON layout file. Translating the 41 copybooks into its layout format by hand would make the translation, not the decoder, the thing measured.
- **copybook 1.0.16 (PyPI, MIT)** — copybook parser only; its Field.parse() takes an already-decoded text string, so there is no EBCDIC byte-decode path (COMP-3 is recognised in the PICTURE grammar but never unpacked).
- **cobol-copybook-to-json 1.1.1 (PyPI, MIT)** — copybook -> JSON schema converter; no record-decode function in the wheel.
- **python-cobol 0.1.4 (PyPI, GPLv3)** — copybook parsing/denormalising only; no record-decode function in the wheel.
- **cobol-parser 1.8.4 (PyPI)** — COBOL program-source parser (AST), not a data decoder. Licence is proprietary ('END-USER LICENSE AGREEMENT'); not installed.
- **cobol-py 0.2.1 (PyPI, MIT)** — COBOL program-source parser (ANTLR port), not a data decoder; not installed.

## In brief (computed from results.jsonl)

Per v2 hazard: which configurations reached the expected outcome on every compared field, on some, and on none. Names are in alphabetical order within each group.

- **COMP-1/COMP-2 hexadecimal floating point: published vector 1234, normalized values, 0.1 rounded** (18 fields): all — `cobrix`; some — jrecord 2/18, jrecord_cb2xml 2/18; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **COMP-1/COMP-2 beyond IEEE-754: range beyond binary32, 55/56-bit fractions beyond binary64** (7 fields): all — no configuration; some — cobrix 1/7; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `jrecord`, `jrecord_cb2xml`, `wilcoyay_cbp`.
- **COMP-1/COMP-2 unnormalized fraction, negative zero, zero fraction with non-zero exponent** (5 fields): all — `cobrix`; some — none; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `jrecord`, `jrecord_cb2xml`, `wilcoyay_cbp`.
- **SYNCHRONIZED: slack bytes for binary/COMP-1/COMP-2, in subgroups, inside OCCURS, level-01 SYNC, SYNC with no effect** (47 fields): all — no configuration; some — aws_mdu 14/47, cobolio 14/47, jrecord 31/47, jrecord_cb2xml 31/47, wilcoyay_cbp 2/47; none — `coboljsonifier`, `cobrix`.
- **PIC N national text (UTF-16BE): Latin, CJK, Greek; explicit USAGE NATIONAL and implicit** (8 fields): all — no configuration; some — cobrix 4/8, jrecord 2/8, jrecord_cb2xml 2/8; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **PIC N supplementary characters (surrogate pairs)** (6 fields): all — no configuration; some — cobrix 3/6, jrecord 2/6, jrecord_cb2xml 2/6; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **national decimal: 9(n) USAGE NATIONAL, SIGN LEADING/TRAILING SEPARATE, implied decimals** (10 fields): all — no configuration; some — none; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `cobrix`, `jrecord`, `jrecord_cb2xml`, `wilcoyay_cbp`.
- **RDW files: one layout, and ODO-driven record lengths** (29 fields): all — `cobrix`, `jrecord`, `jrecord_cb2xml`; some — aws_mdu 12/29; none — no configuration; not given the files — `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **RDW files: records that end after a shorter REDEFINES variant** (9 fields): all — `aws_mdu`, `cobrix`, `jrecord`, `jrecord_cb2xml`; some — none; none — no configuration; not given the files — `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **MUST-FAIL: national decimal holding 'A', EBCDIC zoned bytes, '*' or an EBCDIC minus as sign** (4 fields): all — no configuration; some — coboljsonifier 2/4, jrecord_cb2xml 2/4; none — `aws_mdu`, `cobolio`, `cobrix`, `jrecord`, `wilcoyay_cbp`.
- **MUST-FAIL: PIC N holding an unpaired surrogate (reject, or flag with U+FFFD)** (4 fields): all — no configuration; some — cobrix 2/4; none — `aws_mdu`, `cobolio`, `coboljsonifier`, `jrecord`, `jrecord_cb2xml`, `wilcoyay_cbp`.
- **MUST-FAIL: RDW length 3, spanned segments in a non-spanned file, last RDW past end of file** (3 fields): all — no configuration; some — cobrix 1/3, jrecord 2/3, jrecord_cb2xml 2/3; none — `aws_mdu`; not given the files — `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **valid records sharing an RDW file with a must-fail record** (9 fields): all — `aws_mdu`, `cobrix`, `jrecord`, `jrecord_cb2xml`; some — none; none — no configuration; not given the files — `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.
- **valid fields sharing a record with a must-fail control (v1 and v2)** (8 fields): all — no configuration; some — aws_mdu 4/8, cobolio 4/8, coboljsonifier 5/8, cobrix 5/8, jrecord 6/8, jrecord_cb2xml 6/8, wilcoyay_cbp 4/8; none — no configuration.

## Per-hazard results

Cells: expected outcomes / compared fields; `—` = no rows (RDW files not given to a decoder without an RDW reader). Columns are in alphabetical order; no ordering of decoders is implied. Counts, not rates.

| hazard | n fields | `aws_mdu` | `cobolio` | `coboljsonifier` | `cobrix` | `jrecord` | `jrecord_cb2xml` | `wilcoyay_cbp` |
|---|---|---|---|---|---|---|---|---|
| COMP-1/COMP-2 hexadecimal floating point: published vector 1234, normalized values, 0.1 rounded | 18 | 0/18 | 0/18 | 0/18 | 18/18 | 2/18 | 2/18 | 0/18 |
| COMP-1/COMP-2 beyond IEEE-754: range beyond binary32, 55/56-bit fractions beyond binary64 | 7 | 0/7 | 0/7 | 0/7 | 1/7 | 0/7 | 0/7 | 0/7 |
| COMP-1/COMP-2 unnormalized fraction, negative zero, zero fraction with non-zero exponent | 5 | 0/5 | 0/5 | 0/5 | 5/5 | 0/5 | 0/5 | 0/5 |
| SYNCHRONIZED: slack bytes for binary/COMP-1/COMP-2, in subgroups, inside OCCURS, level-01 SYNC, SYNC with no effect | 47 | 14/47 | 14/47 | 0/47 | 0/47 | 31/47 | 31/47 | 2/47 |
| PIC N national text (UTF-16BE): Latin, CJK, Greek; explicit USAGE NATIONAL and implicit | 8 | 0/8 | 0/8 | 0/8 | 4/8 | 2/8 | 2/8 | 0/8 |
| PIC N supplementary characters (surrogate pairs) | 6 | 0/6 | 0/6 | 0/6 | 3/6 | 2/6 | 2/6 | 0/6 |
| national decimal: 9(n) USAGE NATIONAL, SIGN LEADING/TRAILING SEPARATE, implied decimals | 10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 | 0/10 |
| RDW files: one layout, and ODO-driven record lengths | 29 | 12/29 | — | — | 29/29 | 29/29 | 29/29 | — |
| RDW files: records that end after a shorter REDEFINES variant | 9 | 9/9 | — | — | 9/9 | 9/9 | 9/9 | — |
| MUST-FAIL: national decimal holding 'A', EBCDIC zoned bytes, '*' or an EBCDIC minus as sign | 4 | 0/4 | 0/4 | 2/4 | 0/4 | 0/4 | 2/4 | 0/4 |
| MUST-FAIL: PIC N holding an unpaired surrogate (reject, or flag with U+FFFD) | 4 | 0/4 | 0/4 | 0/4 | 2/4 | 0/4 | 0/4 | 0/4 |
| MUST-FAIL: RDW length 3, spanned segments in a non-spanned file, last RDW past end of file | 3 | 0/3 | — | — | 1/3 | 2/3 | 2/3 | — |
| valid records sharing an RDW file with a must-fail record | 9 | 9/9 | — | — | 9/9 | 9/9 | 9/9 | — |
| valid fields sharing a record with a must-fail control (v1 and v2) | 8 | 4/8 | 4/8 | 5/8 | 5/8 | 6/8 | 6/8 | 4/8 |
| v1 · COMP-3 packed decimal | 15 | 15/15 | 15/15 | 4/15 | 15/15 | 15/15 | 15/15 | 15/15 |
| v1 · sign nibbles A/B/E/F, negative zero | 9 | 8/9 | 9/9 | 8/9 | 9/9 | 8/9 | 8/9 | 7/9 |
| v1 · zoned decimal: overpunch, SIGN SEPARATE | 17 | 11/17 | 11/17 | 11/17 | 17/17 | 16/17 | 12/17 | 12/17 |
| v1 · implied decimals: V, P scaling | 12 | 7/12 | 6/12 | 0/12 | 12/12 | 10/12 | 10/12 | 9/12 |
| v1 · COMP/COMP-4/BINARY | 12 | 10/12 | 9/12 | 2/12 | 12/12 | 12/12 | 12/12 | 0/12 |
| v1 · COMP-5 beyond the PICTURE digits | 9 | 0/9 | 0/9 | 0/9 | 7/9 | 9/9 | 9/9 | 0/9 |
| v1 · code pages cp037 / cp500 / cp1140 | 10 | 8/10 | 10/10 | 7/10 | 10/10 | 10/10 | 10/10 | 7/10 |
| v1 · REDEFINES | 17 | 15/17 | 15/17 | 0/17 | 17/17 | 17/17 | 17/17 | 6/17 |
| v1 · OCCURS DEPENDING ON | 30 | 5/30 | 5/30 | 6/30 | 30/30 | 30/30 | 30/30 | 26/30 |
| v1 · baseline: nested OCCURS, FILLER, mixed record | 23 | 21/23 | 21/23 | 6/23 | 23/23 | 23/23 | 23/23 | 16/23 |
| v1 · MUST-FAIL: packed | 4 | 0/4 | 0/4 | 4/4 | 4/4 | 4/4 | 4/4 | 0/4 |
| v1 · MUST-FAIL: zoned | 2 | 0/2 | 0/2 | 2/2 | 2/2 | 1/2 | 1/2 | 0/2 |
| v1 · MUST-FAIL: ASCII declared as cp037 | 2 | 0/2 | 0/2 | 2/2 | 2/2 | 0/2 | 0/2 | 0/2 |
| **v2 copybooks** | | 44/163 | 14/113 | 3/113 | 82/163 | 88/163 | 90/163 | 2/113 |
| **all** | | 148/329 | 119/279 | 59/279 | 246/329 | 247/329 | 245/329 | 104/279 |

Verdict counts on the v2 hazards (M = MATCH, MM = MISMATCH, R = REJECTED, F = FLAGGED, U = UNSUPPORTED, E = ERROR):

| hazard | `aws_mdu` | `cobolio` | `coboljsonifier` | `cobrix` | `jrecord` | `jrecord_cb2xml` | `wilcoyay_cbp` |
|---|---|---|---|---|---|---|---|
| hfp_float | MM18 | MM18 | E18 | M18 | M2 MM16 | M2 MM16 | U18 |
| hfp_range | MM7 | MM7 | E7 | M1 MM6 | MM7 | MM7 | U7 |
| hfp_unnormalized | MM5 | MM5 | E5 | M5 | MM5 | MM5 | U5 |
| sync | M14 MM33 | M14 MM33 | E47 | E47 | M31 MM16 | M31 MM16 | M2 R10 U34 E1 |
| national_text | MM8 | MM8 | E8 | M4 E4 | M2 MM6 | M2 MM6 | MM8 |
| national_surrogate | MM6 | MM6 | E6 | M3 E3 | M2 MM4 | M2 MM4 | MM6 |
| national_decimal | MM10 | MM10 | E10 | E10 | MM10 | MM4 R6 | E10 |
| rdw | M12 U17 | — | — | M29 | M29 | M29 | — |
| rdw_short_record | M9 | — | — | M9 | M9 | M9 | — |
| mustfail_national | MM4 | MM4 | R2 E2 | E4 | MM4 | MM2 R2 | MM2 E2 |
| mustfail_national_text | MM4 | MM4 | E4 | F2 E2 | MM4 | MM4 | MM4 |
| mustfail_rdw | MM3 | — | — | MM2 R1 | MM1 R2 | MM1 R2 | — |
| rdw_mustfail_sibling | M9 | — | — | M6 R3 | M9 | M9 | — |
| mustfail_sibling | M4 MM4 | M4 MM4 | R5 E3 | M5 E3 | M6 MM2 | M6 MM1 R1 | M4 MM3 E1 |

## Selected v2 fields, observed vs expected

### COMP-1 / COMP-2

C44-A/B/F need 55-56 significant bits (binary64 holds 53); C44-C/D/E lie outside binary32's range; C45-A is unnormalized, C45-C a zero fraction under a non-zero exponent.

| record · field | bytes | PIC | expected | `aws_mdu` | `cobolio` | `coboljsonifier` | `cobrix` | `jrecord` | `jrecord_cb2xml` | `wilcoyay_cbp` |
|---|---|---|---|---|---|---|---|---|---|
| c42_hfp_short_r01 · C42-A | `41100000` | COMP-1 | `1` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `5.831E-42` | MISMATCH `5.831E-42` | UNSUPPORTED |
| c42_hfp_short_r01 · C42-C | `434D2000` | COMP-1 | `1234` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `2.966452E-39` | MISMATCH `2.966452E-39` | UNSUPPORTED |
| c42_hfp_short_r01 · C42-E | `46FFFFFF` | COMP-1 | `16777215` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `NaN` | MISMATCH `NaN` | UNSUPPORTED |
| c43_hfp_long_r01 · C43-A | `434D200000000000` | COMP-2 | `1234` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `1.045903E-317` | MISMATCH `1.045903E-317` | UNSUPPORTED |
| c43_hfp_long_r01 · C43-D | `401999999999999A` | COMP-2 | `0.10000000000000000555111…` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `-1.5423487136588129…` | MISMATCH `-1.5423487136588129…` | UNSUPPORTED |
| c44_hfp_range_r01 · C44-A | `4E80000000000001` | COMP-2 | `36028797018963969` | MISMATCH `null` | MISMATCH `null` | ERROR | MISMATCH `3.602879701896397e+…` | MISMATCH `7.291122019609574E-…` | MISMATCH `7.291122019609574E-…` | UNSUPPORTED |
| c44_hfp_range_r01 · C44-C | `7FFFFFFF` | COMP-1 | `7237005145973115539562949…` | MISMATCH `null` | MISMATCH `null` | ERROR | MISMATCH `inf` | MISMATCH `NaN` | MISMATCH `NaN` | UNSUPPORTED |
| c44_hfp_range_r01 · C44-D | `00100000` | COMP-1 | `0.00000000000000000000000…` | MISMATCH `null` | MISMATCH `null` | ERROR | MISMATCH `0.0` | MISMATCH `5.74E-42` | MISMATCH `5.74E-42` | UNSUPPORTED |
| c44_hfp_range_r01 · C44-E | `69100000` | COMP-1 | `1461501637330902918203684…` | MISMATCH `null` | MISMATCH `null` | ERROR | MISMATCH `inf` | MISMATCH `5.887E-42` | MISMATCH `5.887E-42` | UNSUPPORTED |
| c45_hfp_unnorm_r01 · C45-A | `42010000` | COMP-1 | `1` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `4.51E-43` | MISMATCH `4.51E-43` | UNSUPPORTED |
| c45_hfp_unnorm_r01 · C45-C | `4A000000` | COMP-1 | `0` | MISMATCH `null` | MISMATCH `null` | ERROR | MATCH | MISMATCH `1.04E-43` | MISMATCH `1.04E-43` | UNSUPPORTED |

### SYNCHRONIZED

Offsets are the LR's: slack bytes are never compared, only the fields after them.

| record · field | PIC | expected | `aws_mdu` | `cobolio` | `coboljsonifier` | `cobrix` | `jrecord` | `jrecord_cb2xml` | `wilcoyay_cbp` |
|---|---|---|---|---|---|---|---|---|
| c46_sync_binary_r01 · C46-H | PIC S9(4) COMP SYNC | `-2` | MISMATCH `255` | MISMATCH `+255` | ERROR | ERROR | MATCH | MATCH | UNSUPPORTED |
| c46_sync_binary_r01 · C46-D | PIC S9(18) COMP SYNC | `-123456789012345678` | MISMATCH `1568097095271729508` | MISMATCH `+1568097095271729408` | ERROR | ERROR | MATCH | MATCH | UNSUPPORTED |
| c46_sync_binary_r02 · C46-F | PIC S9(9) COMP SYNC | `-1` | MISMATCH `-381616129` | MISMATCH `-381616129` | ERROR | ERROR | MATCH | MATCH | UNSUPPORTED |
| c47_sync_ibm_ex1_r01 · C47-E | PIC S9(6) COMP SYNC | `-654321` | MISMATCH `16774660` | MISMATCH `+16774660` | ERROR | ERROR | MATCH | MATCH | UNSUPPORTED |
| c48_sync_occurs_r01 · C48-PAY(2) | PIC S9(4)V9(2) COMP SYNC | `-99.99` | MISMATCH `10737420.18` | MISMATCH `+10737420.18` | ERROR | ERROR | MISMATCH `655.35` | MISMATCH `655.35` | UNSUPPORTED |
| c48_sync_occurs_r01 · C48-END | PIC X(2) | `EN` | MISMATCH `` | MISMATCH `..` | ERROR | ERROR | MISMATCH `LA` | MISMATCH `LA` | UNSUPPORTED |
| c49_sync_float_r01 · C49-F2 | COMP-2 SYNC | `1234` | MISMATCH `null` | MISMATCH `null` | ERROR | ERROR | MISMATCH `4.534089626513407E-…` | MISMATCH `4.534089626513407E-…` | UNSUPPORTED |
| c50_sync_noeffect_r01 · C50-H | PIC S9(4) COMP | `-300` | MATCH | MATCH | ERROR | ERROR | MATCH | MATCH | UNSUPPORTED |
| c51_sync_level01_r01 · C51-F | PIC 9(9) COMP-5 | `4000000000` | MISMATCH `M\u00d3,\u0088E` | MISMATCH `M...\u00d3,..E` | ERROR | ERROR | MISMATCH `3556769792` | MISMATCH `3556769792` | UNSUPPORTED |

### USAGE NATIONAL

| record · field | PIC | expected | `aws_mdu` | `cobolio` | `coboljsonifier` | `cobrix` | `jrecord` | `jrecord_cb2xml` | `wilcoyay_cbp` |
|---|---|---|---|---|---|---|---|---|
| c52_nat_text_r01 · C52-A | PIC N(8) USAGE NATIONAL | `Grüße` | MISMATCH `\u00e5\u00ca\u00dc\…` | MISMATCH `null` | ERROR | ERROR | MISMATCH `\u0000\u00e5\u0000\…` | MISMATCH `\u0000\u00e5\u0000\…` | MISMATCH `702` |
| c64_nat_text_implicit_r01 · C64-A | PIC N(8) | `Grüße` | MISMATCH `\u00e5\u00ca\u00dc\…` | MISMATCH `null` | ERROR | MATCH | MISMATCH `\u0000\u00e5\u0000\…` | MISMATCH `\u0000\u00e5\u0000\…` | MISMATCH `702` |
| c52_nat_text_r01 · C52-B | PIC N(3) USAGE NATIONAL | `日本語` | MISMATCH `\u00c1` | MISMATCH `null` | ERROR | ERROR | MISMATCH `\u00c1V\u00c5\u008c…` | MISMATCH `\u00c1V\u00c5\u008c…` | MISMATCH `-12015` |
| c53_nat_surrogate_r01 · C53-A | PIC N(4) USAGE NATIONAL | `A\u1f600B` | MISMATCH `\u00a0Q\u0015` | MISMATCH `null` | ERROR | ERROR | MISMATCH `\u0000\u00a0Q\u0015…` | MISMATCH `\u0000\u00a0Q\u0015…` | MISMATCH `1813` |
| c65_nat_surrogate_implicit_r01 · C65-A | PIC N(4) | `A\u1f600B` | MISMATCH `\u00a0Q\u0015` | MISMATCH `null` | ERROR | MATCH | MISMATCH `\u0000\u00a0Q\u0015…` | MISMATCH `\u0000\u00a0Q\u0015…` | MISMATCH `1813` |
| c54_nat_decimal_r01 · C54-B | PIC S9(4) USAGE NATIONAL SIGN LEADING SEPARATE | `-1234` | MISMATCH `\u0000\u0093\u00004` | MISMATCH `+...4` | ERROR | ERROR | MISMATCH `\u0093\u0000\u0094` | REJECTED | ERROR |
| c54_nat_decimal_r01 · C54-D | PIC S9(5)V9(2) USAGE NATIONAL SIGN TRAILING SEPARATE | `-123.45` | MISMATCH `\u0000\u0016\u0000\…` | MISMATCH `+.......0` | ERROR | ERROR | MISMATCH `\u0093\u0000\u0094` | REJECTED | ERROR |
| c52_nat_text_r01 · C52-D | PIC X(4) | `TAIL` | MISMATCH `\u00c1V\u00c5\u008c` | MISMATCH `.\u00e5.\u00ca` | ERROR | ERROR | MATCH | MATCH | MISMATCH `\u0000\u0080\u0000\…` |

### RDW files: records emitted per file

Cells: records the reader emitted / RDW frames written; an error the reader raised is quoted. Decoders without an RDW reader are UNMEASURED here: `cobolio`, `coboljsonifier`, `wilcoyay_cbp`.

| file | frames | `aws_mdu` | `cobrix` | `jrecord` | `jrecord_cb2xml` |
|---|---|---|---|---|---|
| c58_rdw_basic_f01 | 3 | 3/3 | 3/3 | 3/3 | 3/3 |
| c59_rdw_odo_f01 | 3 | 3/3 | 3/3 | 3/3 | 3/3 |
| c60_rdw_short_f01 | 3 | 3/3 | 3/3 | 3/3 | 3/3 |
| c61_mf_rdw_len_f01 (must-fail) | 2 | 2/2 | 0/2 — `IllegalStateException: RDW headers should never be zero (0,…` | 1/2 — `IOException: Invalid Line Length: -1 For line 2` | 1/2 — `IOException: Invalid Line Length: -1 For line 2` |
| c62_mf_rdw_spanned_f01 (must-fail) | 2 | 3/2 | 3/2 | 1/2 — `IOException: Invalid Record Descriptor word at line 2 6\u00…` | 1/2 — `IOException: Invalid Record Descriptor word at line 2 6\u00…` |
| c63_mf_rdw_trunc_f01 (must-fail) | 2 | 2/2 | 2/2 | 2/2 | 2/2 |

### Copybook-stage errors on v2 copybooks (ERROR rows)

The copybook text is valid Enterprise COBOL in every case (LR 6.4); these are the decoders' own messages, line and column numbers removed.

| decoder | message | fields |
|---|---|---|
| `coboljsonifier` | copybook stage: Exception: ERROR processing field  | 20 |
| `coboljsonifier` | copybook stage: Exception: ERROR processing line  | 90 |
| `cobrix` | copybook stage: SyntaxErrorException: Syntax error in the copybook : Invalid input 'NATIONAL'  | 26 |
| `cobrix` | copybook stage: SyntaxErrorException: Syntax error in the copybook : Invalid input 'SYNC'  | 47 |
| `wilcoyay_cbp` | copybook stage: NullPointerException: Cannot invoke "com.wilcoyay.copybook.PictureClause.displayLength()" because "<local2>" is null | 14 |

## Must-fail controls (v1 and v2)

A correct decoder rejects or flags these. MISMATCH means a value or a record was emitted without an error, null or flag; `—` means the decoder was not given the file (no RDW reader).

| record · field | PIC / frame | `aws_mdu` | `cobolio` | `coboljsonifier` | `cobrix` | `jrecord` | `jrecord_cb2xml` | `wilcoyay_cbp` |
|---|---|---|---|---|---|---|---|---|
| c37_mf_pk_digit_r01 · C37-BAD | PIC S9(5) COMP-3 | MISMATCH `12a45` | MISMATCH `+12a45` | REJECTED | REJECTED | REJECTED | REJECTED | MISMATCH `121045` |
| c38_mf_pk_sign_r01 · C38-BAD | PIC S9(5) COMP-3 | MISMATCH `12345` | MISMATCH `+12345` | REJECTED | REJECTED | REJECTED | REJECTED | MISMATCH `12345` |
| c39_mf_pk_spaces_r01 · C39-LOWVAL | PIC S9(5) COMP-3 | MISMATCH `00000` | MISMATCH `+00000` | REJECTED | REJECTED | REJECTED | REJECTED | MISMATCH `0` |
| c39_mf_pk_spaces_r01 · C39-SPACES | PIC S9(5) COMP-3 | MISMATCH `40404` | MISMATCH `+40404` | REJECTED | REJECTED | REJECTED | REJECTED | MISMATCH `40404` |
| c40_mf_zd_zone_r01 · C40-BADDIGIT | PIC 9(3) | MISMATCH `1.3` | MISMATCH `1.3` | REJECTED | REJECTED | MISMATCH `1.3` | MISMATCH `1.3` | MISMATCH `1113` |
| c40_mf_zd_zone_r01 · C40-BADSIGN | PIC S9(3) | MISMATCH `125` | MISMATCH `+125` | REJECTED | REJECTED | REJECTED | REJECTED | MISMATCH `125` |
| c41_mf_ascii_r01 · C41-AMT | PIC 9(5)V9(2) | MISMATCH `\u0091\u0016\u0…` | MISMATCH `.......` | REJECTED | REJECTED | MISMATCH `\u0091\u0016\u0…` | MISMATCH `\u0091\u0016\u0…` | MISMATCH `12345.67` |
| c41_mf_ascii_r01 · C41-QTY | PIC 9(5) | MISMATCH `\u0091\u0016\u0…` | MISMATCH `.....` | REJECTED | REJECTED | MISMATCH `\u0091\u0016\u0…` | MISMATCH `\u0091\u0016\u0…` | MISMATCH `12345` |
| c55_mf_nat_digit_r01 · C55-BAD | PIC 9(4) USAGE NATIONAL | MISMATCH `\u0091` | MISMATCH `....` | REJECTED | ERROR | MISMATCH `\u0091\u0000\u0…` | MISMATCH `\u0091\u0000\u0…` | MISMATCH `101` |
| c55_mf_nat_digit_r01 · C55-EBC | PIC 9(4) USAGE NATIONAL | MISMATCH `\u0093\u0094` | MISMATCH `....` | REJECTED | ERROR | MISMATCH `\u0093\u0000\u0…` | MISMATCH `\u0093\u0000\u0…` | MISMATCH `304` |
| c56_mf_nat_sign_r01 · C56-EBCSIGN | PIC S9(3) USAGE NATIONAL SIGN TRAILING SEPARATE | MISMATCH `\u0091\u00002` | MISMATCH `+..2` | ERROR | ERROR | MISMATCH `\u0091` | REJECTED | ERROR |
| c56_mf_nat_sign_r01 · C56-STAR | PIC S9(3) USAGE NATIONAL SIGN LEADING SEPARATE | MISMATCH `\u0000\u008a0` | MISMATCH `+..0` | ERROR | ERROR | MISMATCH `\u008a` | REJECTED | ERROR |
| c57_mf_nat_surrogate_r01 · C57-HI | PIC N(3) USAGE NATIONAL | MISMATCH `Q\u0015` | MISMATCH `null` | ERROR | ERROR | MISMATCH `Q\u0015\u0000\u…` | MISMATCH `Q\u0015\u0000\u…` | MISMATCH `81301` |
| c57_mf_nat_surrogate_r01 · C57-LO | PIC N(2) USAGE NATIONAL | MISMATCH `` | MISMATCH `null` | ERROR | ERROR | MISMATCH `ü\u0000\u0000\u…` | MISMATCH `ü\u0000\u0000\u…` | MISMATCH `2120` |
| c61_mf_rdw_len_f01_r02 · *RECORD* | RDW 00030000 | MISMATCH `<record emitted…` | — | — | REJECTED | REJECTED | REJECTED | — |
| c62_mf_rdw_spanned_f01_r02 · *RECORD* | RDW 000A0100 | MISMATCH `<record emitted…` | — | — | MISMATCH `<record emitted…` | REJECTED | REJECTED | — |
| c63_mf_rdw_trunc_f01_r02 · *RECORD* | RDW 00110000 | MISMATCH `<record emitted…` | — | — | MISMATCH `<record emitted…` | MISMATCH `<record emitted…` | MISMATCH `<record emitted…` | — |
| c66_mf_nat_surr_implicit_r01 · C66-HI | PIC N(3) | MISMATCH `Q\u0015` | MISMATCH `null` | ERROR | FLAGGED | MISMATCH `Q\u0015\u0000\u…` | MISMATCH `Q\u0015\u0000\u…` | MISMATCH `81301` |
| c66_mf_nat_surr_implicit_r01 · C66-LO | PIC N(2) | MISMATCH `` | MISMATCH `null` | ERROR | FLAGGED | MISMATCH `ü\u0000\u0000\u…` | MISMATCH `ü\u0000\u0000\u…` | MISMATCH `2120` |

## Where the decoders disagree with each other (v2 fields)

**Any disagreement** (different values, or a value versus a rejection/absence; UNSUPPORTED and ERROR alone do not count): **113 of 163** v2 fields. **Value disagreement** (at least two decoders emitted different values for the same bytes, the case a downstream system cannot detect): **93 of 163** v2 fields, listed below; all v1+v2 disagreements are in `work/summary.json`.

By hazard: hfp_float 16, hfp_range 7, hfp_unnormalized 5, sync 30, national_text 8, national_surrogate 6, national_decimal 10, mustfail_national 4, mustfail_national_text 4, mustfail_sibling 3.

| record · field | expected | outcome → decoders |
|---|---|---|
| c42_hfp_short_r01 · C42-A | `1` | `5.831000E-42` → jrecord, jrecord_cb2xml; `1` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r01 · C42-B | `-118.625` | `-118.625` → cobrix; `1.473628E-38` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r01 · C42-C | `1234` | `2.966452E-39` → jrecord, jrecord_cb2xml; `1234` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r01 · C42-D | `0.15625` | `1.443900E-41` → jrecord, jrecord_cb2xml; `0.15625` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r01 · C42-E | `16777215` | `16777215` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp; `NaN` → jrecord, jrecord_cb2xml |
| c42_hfp_short_r02 · C42-B | `-1234` | `-1234` → cobrix; `2.966632E-39` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r02 · C42-C | `0.5` | `4.600700E-41` → jrecord, jrecord_cb2xml; `0.5` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r02 · C42-D | `100` | `3.596600E-41` → jrecord, jrecord_cb2xml; `100` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c42_hfp_short_r02 · C42-E | `-0.0078125` | `-0.0078125` → cobrix; `1.174700E-41` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r01 · C43-A | `1234` | `1.045903E-317` → jrecord, jrecord_cb2xml; `1234` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r01 · C43-B | `-118.625` | `-118.625` → cobrix; `5.195674E-317` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r01 · C43-C | `123456789.125` | `1.757422E-312` → jrecord, jrecord_cb2xml; `123456789.125` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r01 · C43-D | `1.000000E-1` | `-1.542349E-180` → jrecord, jrecord_cb2xml; `0.1` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r02 · C43-B | `-0.5` | `-0.5` → cobrix; `1.628440E-319` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r02 · C43-C | `1000000000000000` | `5.665923E-310` → jrecord, jrecord_cb2xml; `1000000000000000` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c43_hfp_long_r02 · C43-D | `-1.000000E-1` | `-1.542349E-180` → jrecord, jrecord_cb2xml; `-0.1` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c44_hfp_range_r01 · C44-A | `36028797018963969` | `7.291122E-304` → jrecord, jrecord_cb2xml; `36028797018963970` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c44_hfp_range_r01 · C44-B | `3.333333E-1` | `0.3333333333333333` → cobrix; `1.194531E+103` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c44_hfp_range_r01 · C44-C | `7.237005E+75` | `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp; `NaN` → jrecord, jrecord_cb2xml; `inf` → cobrix |
| c44_hfp_range_r01 · C44-D | `5.397605E-79` | `0` → cobrix; `5.740000E-42` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c44_hfp_range_r01 · C44-E | `1.461502E+48` | `5.887000E-42` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp; `inf` → cobrix |
| c44_hfp_range_r01 · C44-F | `7.237006E+75` | `7.237006E+75` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp; `NaN` → jrecord, jrecord_cb2xml |
| c44_hfp_range_r01 · C44-G | `5.397605E-79` | `2.023700E-320` → jrecord, jrecord_cb2xml; `5.397605E-79` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c45_hfp_unnorm_r01 · C45-A | `1` | `4.510000E-43` → jrecord, jrecord_cb2xml; `1` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c45_hfp_unnorm_r01 · C45-B | `0` | `0` → cobrix; `1.794000E-43` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c45_hfp_unnorm_r01 · C45-C | `0` | `0` → cobrix; `1.040000E-43` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c45_hfp_unnorm_r01 · C45-D | `0.00390625` | `8.289080E-317` → jrecord, jrecord_cb2xml; `0.00390625` → cobrix; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c45_hfp_unnorm_r01 · C45-E | `-1` | `-1` → cobrix; `2.119000E-320` → jrecord, jrecord_cb2xml; `<absent>` → aws_mdu, cobolio; `<error>` → coboljsonifier; `<unsupported>` → wilcoyay_cbp |
| c46_sync_binary_r01 · C46-B | `BBB` | `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `BBB` → jrecord, jrecord_cb2xml; `\u00daBB` → aws_mdu, cobolio |
| c46_sync_binary_r01 · C46-C | `C` | `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `C` → jrecord, jrecord_cb2xml; `\u00f2` → aws_mdu, cobolio |
| c46_sync_binary_r01 · C46-D | `-123456789012345678` | `-123456789012345678` → jrecord, jrecord_cb2xml; `1568097095271729408` → cobolio; `1568097095271729508` → aws_mdu; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c46_sync_binary_r01 · C46-E | `ZZ` | `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `ZZ` → jrecord, jrecord_cb2xml; `\u00a9ß` → aws_mdu, cobolio |
| c46_sync_binary_r01 · C46-F | `123456789` | `-1040185509` → aws_mdu, cobolio; `123456789` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c46_sync_binary_r01 · C46-H | `-2` | `-2` → jrecord, jrecord_cb2xml; `255` → aws_mdu, cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c46_sync_binary_r02 · C46-B | `XYZ` | `\u000fXY` → aws_mdu; `.XY` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `XYZ` → jrecord, jrecord_cb2xml |
| c46_sync_binary_r02 · C46-C | `D` | `.` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `D` → jrecord, jrecord_cb2xml; `\u009f` → aws_mdu |
| c46_sync_binary_r02 · C46-D | `999999999999999999` | `-16817853905903434` → aws_mdu, cobolio; `999999999999999999` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c46_sync_binary_r02 · C46-E | `YY` | `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `YY` → jrecord, jrecord_cb2xml; `\u00b7x` → aws_mdu, cobolio |
| c46_sync_binary_r02 · C46-F | `-1` | `-1` → jrecord, jrecord_cb2xml; `-381616129` → aws_mdu, cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c46_sync_binary_r02 · C46-H | `9999` | `16423` → aws_mdu, cobolio; `9999` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c47_sync_ibm_ex1_r01 · C47-E | `-654321` | `-654321` → jrecord, jrecord_cb2xml; `16774660` → aws_mdu, cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-END | `EN` | `` → aws_mdu; `..` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `LA` → jrecord, jrecord_cb2xml |
| c48_sync_occurs_r01 · C48-HOURS(1) | `40` | `-7616` → aws_mdu, cobolio; `40` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-HOURS(2) | `-7` | `-9999` → jrecord, jrecord_cb2xml; `0` → aws_mdu, cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-HOURS(3) | `999` | `0` → jrecord, jrecord_cb2xml; `16384` → aws_mdu, cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-NAME(1) | `ANNA` | `..ANN` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `ANNA` → jrecord, jrecord_cb2xml; `\u0088ANN` → aws_mdu |
| c48_sync_occurs_r01 · C48-NAME(2) | `BOB` | `..Q1.` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `\u009f9BOB` → jrecord, jrecord_cb2xml; `\u009f\u009fQ1\u009f` → aws_mdu |
| c48_sync_occurs_r01 · C48-NAME(3) | `CLARA` | `\u0000\u0001\u0003XC` → jrecord, jrecord_cb2xml; `.C...` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `C` → aws_mdu |
| c48_sync_occurs_r01 · C48-PAY(1) | `1234.56` | `0.01` → cobolio; `0.1` → aws_mdu; `1234.56` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-PAY(2) | `-99.99` | `10737420.18` → aws_mdu, cobolio; `655.35` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-PAY(3) | `0.01` | `-10261129.6` → aws_mdu, cobolio; `127795.2` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c48_sync_occurs_r01 · C48-TYPE(2) | `B` | `` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `A` → aws_mdu, cobolio |
| c48_sync_occurs_r01 · C48-TYPE(3) | `C` | `` → jrecord, jrecord_cb2xml; `9` → aws_mdu, cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp |
| c49_sync_float_r01 · C49-B | `Z` | `` → aws_mdu; `.` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `Z` → jrecord, jrecord_cb2xml |
| c49_sync_float_r01 · C49-C | `EN` | `` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `B\u00ce` → aws_mdu, cobolio |
| c51_sync_level01_r01 · C51-B | `M` | `.` → cobolio; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `\u009f` → aws_mdu, jrecord, jrecord_cb2xml |
| c51_sync_level01_r01 · C51-C | `EN` | `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `N` → aws_mdu, cobolio; `\u00d3,` → jrecord, jrecord_cb2xml |
| c51_sync_level01_r01 · C51-F | `4000000000` | `3556769792` → jrecord, jrecord_cb2xml; `<error>` → coboljsonifier, cobrix; `<unsupported>` → wilcoyay_cbp; `M...\u00d3,..E` → cobolio; `M\u00d3,\u0088E` → aws_mdu |
| c52_nat_text_r01 · C52-A | `Grüße` | `\u0000\u00e5\u0000\u00ca\…` → jrecord, jrecord_cb2xml; `702` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `\u00e5\u00ca\u00dc\u00ff` → aws_mdu |
| c52_nat_text_r01 · C52-B | `日本語` | `-12015` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `\u00c1` → aws_mdu; `\u00c1V\u00c5\u008c\u00ab…` → jrecord, jrecord_cb2xml |
| c52_nat_text_r01 · C52-C | `Ωμέγα` | `\u0003z\u0003\u00af\u0003…` → jrecord, jrecord_cb2xml; `500` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `\u0080\u0080\u0080` → aws_mdu |
| c52_nat_text_r01 · C52-D | `TAIL` | `\u0000\u0080\u0000\u0080` → wilcoyay_cbp; `.\u00e5.\u00ca` → cobolio; `<error>` → coboljsonifier, cobrix; `TAIL` → jrecord, jrecord_cb2xml; `\u00c1V\u00c5\u008c` → aws_mdu |
| c53_nat_surrogate_r01 · C53-A | `A\u1f600B` | `\u0000\u00a0Q\u0015\u00fa…` → jrecord, jrecord_cb2xml; `1813` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `\u00a0Q\u0015` → aws_mdu |
| c53_nat_surrogate_r01 · C53-B | `\u1d11e` | `14002` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `Q\u0094\u00f9\u001e` → jrecord, jrecord_cb2xml; `\u00fa` → aws_mdu |
| c53_nat_surrogate_r01 · C53-C | `OK` | `..` → cobolio; `<error>` → coboljsonifier, cobrix; `OK` → jrecord, jrecord_cb2xml; `Q\u0094` → wilcoyay_cbp; `\u00e2` → aws_mdu |
| c54_nat_decimal_r01 · C54-A | `1234` | `....` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `\u0091` → jrecord, jrecord_cb2xml; `\u0091\u0016` → aws_mdu |
| c54_nat_decimal_r01 · C54-B | `-1234` | `\u0000\u0093\u00004` → aws_mdu; `+...4` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0093\u0000\u0094` → jrecord |
| c54_nat_decimal_r01 · C54-C | `1234` | `\u0000\u0005\u00001` → aws_mdu; `+...1` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0091` → jrecord |
| c54_nat_decimal_r01 · C54-D | `-123.45` | `\u0000\u0016\u0000\u0093\…` → aws_mdu; `+.......0` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0093\u0000\u0094` → jrecord |
| c54_nat_decimal_r01 · C54-E | `12.5` | `....` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `\u0091` → jrecord, jrecord_cb2xml; `\u0091.\u0016` → aws_mdu |
| c54_nat_decimal_r02 · C54-A | `0` | `....` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `\u0090\u0000\u0090` → jrecord, jrecord_cb2xml; `\u0090\u0090` → aws_mdu |
| c54_nat_decimal_r02 · C54-B | `1234` | `\u0000\u0090\u00000` → aws_mdu; `+...0` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0090\u0000\u0090` → jrecord |
| c54_nat_decimal_r02 · C54-C | `-1` | `\u0000\u008b\u00001` → aws_mdu; `+...1` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u008b\u0000\u0091` → jrecord |
| c54_nat_decimal_r02 · C54-D | `0.01` | `\u0000\u0016\u0000\u0093\…` → aws_mdu; `+.......0` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0093\u0000\u0094` → jrecord |
| c54_nat_decimal_r02 · C54-E | `999.9` | `....` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `\u0090\u0000\u0090` → jrecord, jrecord_cb2xml; `\u0090.\u0090` → aws_mdu |
| c55_mf_nat_digit_r01 · C55-BAD | `REJECT_OR_FLAG` | `....` → cobolio; `101` → wilcoyay_cbp; `<error>` → cobrix; `<rejected>` → coboljsonifier; `\u0091` → aws_mdu; `\u0091\u0000\u00a0` → jrecord, jrecord_cb2xml |
| c55_mf_nat_digit_r01 · C55-EBC | `REJECT_OR_FLAG` | `....` → cobolio; `304` → wilcoyay_cbp; `<error>` → cobrix; `<rejected>` → coboljsonifier; `\u0093\u0000\u0094` → jrecord, jrecord_cb2xml; `\u0093\u0094` → aws_mdu |
| c56_mf_nat_sign_r01 · C56-EBCSIGN | `REJECT_OR_FLAG` | `+..2` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0091` → jrecord; `\u0091\u00002` → aws_mdu |
| c56_mf_nat_sign_r01 · C56-OK | `-7` | `\u0000\u00930` → aws_mdu; `+..0` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u0093` → jrecord |
| c56_mf_nat_sign_r01 · C56-STAR | `REJECT_OR_FLAG` | `\u0000\u008a0` → aws_mdu; `+..0` → cobolio; `<error>` → coboljsonifier, cobrix, wilcoyay_cbp; `<rejected>` → jrecord_cb2xml; `\u008a` → jrecord |
| c57_mf_nat_surrogate_r01 · C57-HI | `REJECT_OR_FLAG` | `81301` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `Q\u0015` → aws_mdu; `Q\u0015\u0000\u00a0\u0000…` → jrecord, jrecord_cb2xml |
| c57_mf_nat_surrogate_r01 · C57-LO | `REJECT_OR_FLAG` | `` → aws_mdu; `2120` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier, cobrix; `ü\u0000\u0000\u00a0` → jrecord, jrecord_cb2xml |
| c57_mf_nat_surrogate_r01 · C57-OK | `OK` | `\u0000\u00a0` → wilcoyay_cbp; `<error>` → coboljsonifier, cobrix; `OK` → jrecord, jrecord_cb2xml; `Q.` → cobolio; `\u00e2ü` → aws_mdu |
| c64_nat_text_implicit_r01 · C64-A | `Grüße` | `\u0000\u00e5\u0000\u00ca\…` → jrecord, jrecord_cb2xml; `702` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `Grüße` → cobrix; `\u00e5\u00ca\u00dc\u00ff` → aws_mdu |
| c64_nat_text_implicit_r01 · C64-B | `日本語` | `-12015` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `\u00c1` → aws_mdu; `\u00c1V\u00c5\u008c\u00ab…` → jrecord, jrecord_cb2xml; `日本語` → cobrix |
| c64_nat_text_implicit_r01 · C64-C | `Ωμέγα` | `\u0003z\u0003\u00af\u0003…` → jrecord, jrecord_cb2xml; `500` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `\u0080\u0080\u0080` → aws_mdu; `Ωμέγα` → cobrix |
| c64_nat_text_implicit_r01 · C64-D | `TAIL` | `\u0000\u0080\u0000\u0080` → wilcoyay_cbp; `.\u00e5.\u00ca` → cobolio; `<error>` → coboljsonifier; `TAIL` → cobrix, jrecord, jrecord_cb2xml; `\u00c1V\u00c5\u008c` → aws_mdu |
| c65_nat_surrogate_implicit_r01 · C65-A | `A\u1f600B` | `\u0000\u00a0Q\u0015\u00fa…` → jrecord, jrecord_cb2xml; `1813` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `A\u1f600B` → cobrix; `\u00a0Q\u0015` → aws_mdu |
| c65_nat_surrogate_implicit_r01 · C65-B | `\u1d11e` | `14002` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `Q\u0094\u00f9\u001e` → jrecord, jrecord_cb2xml; `\u00fa` → aws_mdu; `\u1d11e` → cobrix |
| c65_nat_surrogate_implicit_r01 · C65-C | `OK` | `..` → cobolio; `<error>` → coboljsonifier; `OK` → cobrix, jrecord, jrecord_cb2xml; `Q\u0094` → wilcoyay_cbp; `\u00e2` → aws_mdu |
| c66_mf_nat_surr_implicit_r01 · C66-HI | `REJECT_OR_FLAG` | `81301` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `<flagged>` → cobrix; `Q\u0015` → aws_mdu; `Q\u0015\u0000\u00a0\u0000…` → jrecord, jrecord_cb2xml |
| c66_mf_nat_surr_implicit_r01 · C66-LO | `REJECT_OR_FLAG` | `` → aws_mdu; `2120` → wilcoyay_cbp; `<absent>` → cobolio; `<error>` → coboljsonifier; `<flagged>` → cobrix; `ü\u0000\u0000\u00a0` → jrecord, jrecord_cb2xml |
| c66_mf_nat_surr_implicit_r01 · C66-OK | `OK` | `\u0000\u00a0` → wilcoyay_cbp; `<error>` → coboljsonifier; `OK` → cobrix, jrecord, jrecord_cb2xml; `Q.` → cobolio; `\u00e2ü` → aws_mdu |

Notes on v2 MATCH rows: `cobrix` equal after IEEE-754 binary64 round-trip of the rendered digits ×3.

MISMATCH rows where the decoder emitted the nearest binary64 value of a field binary64 cannot hold: `cobrix` ×3.

## What this measurement cannot establish

- It is not a conformance test and says nothing about any decoder outside the 66 copybooks here. Still outside the corpus: edited PICTUREs, DBCS (PIC G), 88-levels, nested ODO, multi-layout segment selection, BDW/VB blocking, spanned-record assembly (VBS), SYNC combined with REDEFINES or ODO, national-edited items, national floating point, COMP-1/COMP-2 in IEEE formats, and code pages other than 37/500/1140.
- The expected values come from IBM's published rules and printed vectors, not from running an IBM compiler; no z/OS system produced these bytes. Where IBM behaviour depends on compiler options (NUMPROC, NUMCLS, TRUNC, ARITH, NSYMBOL) the corpus avoids the ambiguous case, states the default it assumes, or accepts both outcomes.
- Slack-byte content is undefined in COBOL; two fills (X'00' and X'40') are used and never compared.
- A decoder that converts COMP-2 through IEEE binary64 is doing what many consumers want; the corpus records that the value changed, not that the conversion is wrong for every purpose.
- Each decoder was driven the way its documentation shows. A different option set could produce different outcomes. Cobrix's defaults for RDW (little-endian, payload-only length) were not used; with them IBM RDWs would be misread.
- One observation per field. Counts are small and are reported as counts, not rates or scores.
- The sister product was not measured: it has no decode path to measure.

## Reproduce

On the pod: `bash run.sh` (add `FRESH=1` to reinstall every tool from its pinned source). The run stops if `verify_vectors.py` disagrees with the corpus. `results.jsonl` is sorted and contains no timestamps or paths. `bash check_determinism.sh` runs the whole pipeline twice and records both SHA-256 digests in `determinism.log`. `make_candidate.py` writes the unsigned record candidate (`candidate/`), state SIGN_PENDING.

Determinism check (`determinism.log`):

```
run 1 results.jsonl sha256 3859bb3798d8b84526e80e6241dd28c40426345e1ce101c50e9857af36c257cf
run 2 results.jsonl sha256 3859bb3798d8b84526e80e6241dd28c40426345e1ce101c50e9857af36c257cf
byte-identical: yes
```

