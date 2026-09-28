"""Harness for the Python decoders. Usage: py_harness.py <mode> <jobs.tsv> [mdu_src_dir]
Modes: coboljsonifier | cobolio | mdu. One JSON line per job on stdout (same shape as the Java/Spark harnesses).
Each decoder is driven through its documented public entry points; nothing in the decoders is patched.
Job column 6 = framing: F (one record per file) or V (RDW file). Only mdu has an RDW reader
(core/extract.read(file, 'vb', lrecl), the loop core/extract.FileProcess runs); run.sh gives V jobs to mdu only.
core/extract.py imports boto3, urllib3 and botocore at module level; they are not installed, and empty
stand-in modules satisfy those imports. read() uses none of them."""
import argparse, contextlib, importlib, io, json, os, sys
from decimal import Decimal

mode, jobs = sys.argv[1], sys.argv[2]


def sval(v):
    if v is None: return None
    if isinstance(v, (bytes, bytearray)): return "0x" + bytes(v).hex()
    if isinstance(v, float): return repr(v)
    return str(v)


def flat(v, name, idx, out):
    if isinstance(v, dict):
        for k, x in v.items(): flat(x, k, idx, out)
    elif isinstance(v, list):
        for i, x in enumerate(v): flat(x, name, idx + [i + 1], out)
    else:
        out.append({"name": name + ("(%s)" % ",".join(map(str, idx)) if idx else ""), "value": sval(v)})


def err(e):
    return (type(e).__name__ + ": " + str(e)).split("\n")[0][:400]


def quiet(fn, *a, **k):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        return fn(*a, **k)


cache = {}

if mode == "coboljsonifier":
    from coboljsonifier.copybookextractor import CopybookExtractor
    from coboljsonifier.parser import Parser
    from coboljsonifier.config.parser_type_enum import ParseType

    def setup(cpy, cp):
        return quiet(lambda: CopybookExtractor(cpy).dict_book_structure)

    def decode(struct, data, cp):
        p = quiet(lambda: Parser(struct, ParseType.BINARY_EBCDIC).build())
        quiet(p.parse, data)
        out = []; flat(p.value, "", [], out); return out

elif mode == "cobolio":
    import cobolio

    def setup(cpy, cp):
        return quiet(cobolio.copybook_to_layout, open(cpy).read())

    def decode(lay, data, cp):
        d = quiet(cobolio.loads, data, lay[1], cp)
        out = []; flat(d, "", [], out); return out

elif mode == "mdu":
    sys.path.insert(0, os.path.join(sys.argv[3], "src"))
    import core.ebcdic as mdu_ebcdic
    import types
    for _m in ("boto3", "urllib3", "botocore", "botocore.exceptions"):
        sys.modules.setdefault(_m, types.ModuleType(_m))
    sys.modules["botocore.exceptions"].ClientError = type("ClientError", (Exception,), {})
    import core.extract as mdu_extract

    def read_rdw_file(path, lrecl):
        recs = []
        with open(path, "rb") as fh:
            while len(recs) < 10000:
                r = mdu_extract.read(fh, "vb", lrecl)   # exactly the call FileProcess makes, until it returns empty
                if not r: break
                recs.append(r)
        return recs

    def setup(cpy, cp):
        # parsecp/copybook keep module-level state, so each copybook is parsed in a fresh interpreter
        import subprocess
        tmp = os.path.join(os.environ.get("CF_WORK", "."), "mdu_" + os.path.basename(cpy) + ".json")
        code = ("import sys, argparse; sys.path.insert(0, %r); import core.parsecp as p; "
                "p.RunParse(None, argparse.Namespace(copybook=%r, json=%r, json_debug='', part_k_len=0, sort_k_len=0))"
                % (os.path.join(sys.argv[3], "src"), cpy, tmp))
        r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError((r.stderr.strip().splitlines() or ["exit %d" % r.returncode])[-1])
        return json.load(open(tmp))

    def decode(param, data, cp):
        out = []
        layouts = ["transf"] + sorted([k for k in param if k.startswith("transf") and k[6:].isdigit()], key=lambda k: int(k[6:]))
        for lay in layouts:
            for t in param[lay]:
                name = t["name"] if lay == "transf" else "%s@%s" % (t["name"], lay)
                try:
                    v = quiet(mdu_ebcdic.unpack, data[t["offset"]:t["offset"] + t["bytes"]], t["type"], t["dplaces"], True, False)
                    out.append({"name": name, "value": sval(v)})
                except SystemExit:
                    out.append({"name": name, "error": "SystemExit: Length & Type not supported (type %s)" % t["type"]})
                except Exception as e:
                    out.append({"name": name, "error": err(e)})
        return out
else:
    raise SystemExit("unknown mode " + mode)

for ln in open(jobs):
    parts = ln.rstrip("\n").split("\t")
    bid, cpy, rid, binf, cp = parts[:5]
    framing = parts[5] if len(parts) > 5 else "F"
    o = {"record": rid}
    if bid not in cache:
        try: cache[bid] = ("ok", setup(cpy, cp))
        except BaseException as e: cache[bid] = ("err", err(e))
    st, obj = cache[bid]
    if st == "err":
        o.update(stage="parse", error=obj); print(json.dumps(o, sort_keys=True)); continue
    if framing == "V":
        if mode != "mdu":
            o.update(stage="parse", error="harness: no RDW entry point for " + mode); print(json.dumps(o, sort_keys=True)); continue
        try:
            recs = read_rdw_file(binf, obj["input_recl"])
        except BaseException as e:
            o.update(stage="decode", error=err(e)); print(json.dumps(o, sort_keys=True)); continue
        out = []
        for data in recs:
            try: out.append({"fields": decode(obj, data, cp)})
            except BaseException as e: out.append({"error": err(e)})
        o.update(stage="ok", records=out)
        print(json.dumps(o, sort_keys=True), flush=True); continue
    data = open(binf, "rb").read()
    try:
        o.update(stage="ok", fields=decode(obj, data, cp))
    except BaseException as e:
        o.update(stage="decode", error=err(e))
    print(json.dumps(o, sort_keys=True), flush=True)
