"""Harness for Cobrix (spark-cobol) in Spark local mode. One JSON line per job on stdout.
Options used for every record: record_format=F, record_length=<file length> (one record per file),
variable_size_occurs=true (Cobrix's documented switch for OCCURS DEPENDING ON), ebcdic_code_page=<declared page>,
schema_retention_policy=collapse_root, pedantic=true.
RDW files (job column 6 = V): record_format=V, is_rdw_big_endian=true and is_rdw_part_of_record_length=true
(IBM RDWs are big-endian and count their own 4 bytes; the README states Cobrix's defaults are little-endian and
payload-only), generate_record_id=true so rows can be put back in file order by Record_Id."""
import json, os, re, sys
from decimal import Decimal

jobs, jars = sys.argv[1], sys.argv[2]
from pyspark.sql import SparkSession

spark = (SparkSession.builder.master("local[1]").appName("cobrix-fidelity")
         .config("spark.jars", jars).config("spark.ui.enabled", "false")
         .config("spark.sql.session.timeZone", "UTC").getOrCreate())
spark.sparkContext.setLogLevel("OFF")


def flat(v, name, idx, out):
    if isinstance(v, dict) or hasattr(v, "asDict"):
        d = v if isinstance(v, dict) else v.asDict(recursive=True)
        for k, x in d.items():
            flat(x, k, idx, out)
    elif isinstance(v, list):
        for i, x in enumerate(v):
            flat(x, name, idx + [i + 1], out)
    else:
        key = name + ("(%s)" % ",".join(map(str, idx)) if idx else "")
        if v is None: s = None
        elif isinstance(v, Decimal): s = str(v)
        elif isinstance(v, (bytes, bytearray)): s = "0x" + bytes(v).hex()
        else: s = str(v)
        out.append({"name": key, "value": s})


GEN = ("File_Id", "Record_Id", "Record_Byte_Length")
def java_cause(e):
    """v2: the Java exception under the Py4J wrapper (the wrapper's first line names only a py4j object id).
    Skips the Py4J and Spark wrappers; the message never includes host names or task ids."""
    s = str(e)
    for name, msg in re.findall(r"(?:[a-z_$][\w$]*\.)+([A-Z][\w$]*(?:Exception|Error)): ([^\n]*)", s):
        if name in ("Py4JJavaError", "SparkException"): continue
        return name, msg.strip()
    return type(e).__name__, s.split("\n")[0]


for ln in open(jobs):
    parts = ln.rstrip("\n").split("\t")
    bid, cpy, rid, binf, cp = parts[:5]
    framing = parts[5] if len(parts) > 5 else "F"
    o = {"record": rid}
    try:
        rd = (spark.read.format("cobol").option("copybook", cpy).option("encoding", "ebcdic")
              .option("ebcdic_code_page", cp).option("variable_size_occurs", "true")
              .option("schema_retention_policy", "collapse_root").option("pedantic", "true"))
        if framing == "V":
            rd = (rd.option("record_format", "V").option("is_rdw_big_endian", "true")
                  .option("is_rdw_part_of_record_length", "true").option("generate_record_id", "true"))
        else:
            rd = rd.option("record_format", "F").option("record_length", str(os.path.getsize(binf)))
        rows = rd.load(binf).collect()
    except Exception as e:
        name, msg = java_cause(e)
        o.update(stage="parse" if "copybook" in msg.lower() or "Syntax" in name else "decode", error=(name + ": " + msg)[:400])
        print(json.dumps(o, sort_keys=True)); continue
    if framing == "V":
        recs = []
        for row in sorted(rows, key=lambda r: (r["File_Id"], r["Record_Id"])):
            d = row.asDict(recursive=True)
            for g in GEN: d.pop(g, None)
            out = []; flat(d, "", [], out); recs.append({"fields": out})
        o.update(stage="ok", records=recs)
        print(json.dumps(o, sort_keys=True), flush=True); continue
    if len(rows) != 1:
        o.update(stage="decode", error="expected 1 row, got %d" % len(rows)); print(json.dumps(o, sort_keys=True)); continue
    out = []
    flat(rows[0].asDict(recursive=True), "", [], out)
    o.update(stage="ok", fields=out)
    print(json.dumps(o, sort_keys=True), flush=True)
spark.stop()
