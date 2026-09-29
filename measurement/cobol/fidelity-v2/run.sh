#!/usr/bin/env bash
# Re-derives corpus/, results.jsonl, REPORT.md and the unsigned record candidate from nothing but this
# directory's scripts and pinned downloads. FRESH=1 also deletes ./tools first (full reinstall).
set -euo pipefail
LANE="$(cd "$(dirname "$0")" && pwd)"; cd "$LANE"
export LC_ALL=C.UTF-8 LANG=C.UTF-8 TZ=UTC PYTHONHASHSEED=0 PYTHONDONTWRITEBYTECODE=1
[ "${FRESH:-0}" = 1 ] && rm -rf tools
bash setup.sh
PY="$LANE/tools/venv/bin/python"; JDK="$LANE/tools/jdk-17.0.12+7"; J="$JDK/bin"; JOPT="-Dfile.encoding=UTF-8 -Duser.timezone=UTC"
JR="$LANE/tools/jars/jrecord-0.93.3.jar:$LANE/tools/jars/cb2xml-1.01.08.jar"
rm -rf corpus work results.jsonl REPORT.md
mkdir -p work/raw work/logs work/classes work/wclasses work/xml
"$PY" gen_corpus.py corpus
# independent re-derivation of every expected value, offset and RDW frame; stops the run on any disagreement
"$PY" verify_vectors.py corpus work/verify_vectors.json
"$PY" - <<'PYEOF'
import json, os
m = json.load(open("corpus/expected.json")); java = {"cp037": "Cp037", "cp500": "Cp500", "cp1140": "Cp1140"}
out = {n: open("work/%s.tsv" % n, "w") for n in ("jobs_java", "jobs_py", "jobs_java_fixed", "jobs_py_fixed")}
for c in m["copybooks"]:
    if c["framing"] == "rdw":
        units = [(f["id"], f["file"], f["declared_codepage"], "V") for f in c["files"]]
    else:
        units = [(r["id"], r["file"], r["declared_codepage"], "F") for r in c["records"]]
    for uid, path, cp, fr in units:
        base = [c["id"], os.path.abspath("corpus/" + c["copybook"]), uid, os.path.abspath("corpus/" + path)]
        lj = "\t".join(base + [java[cp], fr]) + "\n"; lp = "\t".join(base + [cp, fr]) + "\n"
        out["jobs_java"].write(lj); out["jobs_py"].write(lp)
        if fr == "F": out["jobs_java_fixed"].write(lj); out["jobs_py_fixed"].write(lp)
for f in out.values(): f.close()
PYEOF
# --- JRecord, both copybook paths (fixed records and RDW files)
"$J/javac" -encoding UTF-8 -nowarn -d work/classes -cp "$JR" harness/JRecordHarness.java 2> work/logs/javac_jrecord.log
"$J/java" $JOPT -cp "work/classes:$JR" JRecordHarness jrecord work/jobs_java.tsv work/xml > work/raw/jrecord.jsonl 2> work/logs/jrecord.log
"$J/java" $JOPT -cp "work/classes:$JR" JRecordHarness cb2xml work/jobs_java.tsv work/xml > work/raw/jrecord_cb2xml.jsonl 2> work/logs/jrecord_cb2xml.log
# --- wilcoyay/copybook-parser (Main.java needs Jackson and is not used); fixed-length records only
WS="$LANE/tools/src/copybook-parser/src/main/java/com/wilcoyay/copybook"
"$J/javac" -encoding UTF-8 -nowarn -d work/wclasses $(ls "$WS"/*.java | grep -v '/Main.java$') harness/WilcoyayHarness.java 2> work/logs/javac_wilcoyay.log
"$J/java" $JOPT -cp work/wclasses WilcoyayHarness work/jobs_java_fixed.tsv > work/raw/wilcoyay_cbp.jsonl 2> work/logs/wilcoyay_cbp.log
# --- Cobrix in Spark local mode (fixed records and RDW files)
JAVA_HOME="$JDK" PATH="$J:$PATH" "$PY" harness/cobrix_harness.py work/jobs_py.tsv \
  "$LANE/tools/jars/spark-cobol_2.12-2.11.1.jar,$LANE/tools/jars/cobol-parser_2.12-2.11.1.jar" > work/raw/cobrix.jsonl 2> work/logs/cobrix.log
# --- Python decoders (only mdu has an RDW reader)
export CF_WORK="$LANE/work"
"$PY" harness/py_harness.py coboljsonifier work/jobs_py_fixed.tsv > work/raw/coboljsonifier.jsonl 2> work/logs/coboljsonifier.log
"$PY" harness/py_harness.py cobolio work/jobs_py_fixed.tsv > work/raw/cobolio.jsonl 2> work/logs/cobolio.log
"$PY" harness/py_harness.py mdu work/jobs_py.tsv "$LANE/tools/src/mainframe-data-utilities" > work/raw/aws_mdu.jsonl 2> work/logs/aws_mdu.log
# --- SELF (sister product; not ranked): static check for a decode path, no measurement
"$PY" check_self.py work/self_check.json
# --- every harness must have produced one line per job it was given
na=$(grep -c . work/jobs_py.tsv); nf=$(grep -c . work/jobs_py_fixed.tsv)
for d in jrecord jrecord_cb2xml cobrix aws_mdu; do [ "$(grep -c . work/raw/$d.jsonl)" = "$na" ] || { echo "run: $d incomplete" >&2; exit 6; }; done
for d in wilcoyay_cbp coboljsonifier cobolio; do [ "$(grep -c . work/raw/$d.jsonl)" = "$nf" ] || { echo "run: $d incomplete" >&2; exit 6; }; done
"$PY" compare.py "$LANE"
"$PY" make_report.py "$LANE"
"$PY" make_candidate.py "$LANE"
sha256sum results.jsonl | tee work/results.sha256
