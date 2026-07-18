#!/usr/bin/env python3
"""MEOK estate index — metadata catalog across all granted roots.
Signal-first: skips junk dirs, tags by topic, hashes small local text files
for dedup. iCloud handled stat-only (no content read -> no download/hang)."""
import os, sqlite3, hashlib, time, sys

ROOTS = {
    "clawd":    "/Users/nicholas/clawd",
    "Documents":"/Users/nicholas/Documents",
    "Desktop":  "/Users/nicholas/Desktop",
    "Downloads":"/Users/nicholas/Downloads",
    "iCloud":   "/Users/nicholas/Library/Mobile Documents/com~apple~CloudDocs",
}
SKIP_DIRS = {"node_modules",".git",".venv","venv","__pycache__",".cache",
    ".npm",".next",".turbo","dist","build",".pytest_cache",".mypy_cache",
    "site-packages",".terraform","vendor",".gradle",".tox","target",
    ".DS_Store",".idea",".vscode","coverage",".nyc_output","bower_components"}
# signal extensions (text/doc/config/code) — everything else = "other/binary"
TEXT_EXT = {".md",".txt",".markdown",".rst",".org"}
DOC_EXT  = {".pdf",".docx",".doc",".pages",".rtf",".odt"}
DATA_EXT = {".json",".yaml",".yml",".toml",".csv",".tsv",".xml",".ini",".env",".cfg",".sql"}
CODE_EXT = {".py",".ts",".tsx",".js",".jsx",".sh",".rs",".go",".sol",".html",".css",".ipynb"}
SIGNAL_EXT = TEXT_EXT | DOC_EXT | DATA_EXT | CODE_EXT

TOPICS = {  # topic -> keywords (matched against lowercased path)
 "sov3":["sov3","sovereign-temple","sovereign_temple"],
 "oowm":["oowm","open-world","open_world"],
 "meok":["meok"],
 "csoai":["csoai"],
 "defoneos":["defoneos","defone"],
 "charter":["charter"],
 "layer0":["layer0","layer-0","layer_0","oscal"],
 "sovspace":["sovspace","sov-space","sovtown","sov-town","cesium"],
 "mcp":["mcp","marketplace"],
 "neural":["neural_core","neural-core",".nn","_nn","governance","mamba"],
 "keystone":["keystone","sigil","attest","ed25519"],
 "alignment":["_alignment","alignment","memory.md","claude.md"],
 "compliance":["eu-ai-act","gdpr","dora","nis2","compliance","passport","article50","art50"],
 "business":["stripe","invoice","pricing","proposal","revenue","pitch","investor"],
}
def topics_for(pl):
    return ",".join(t for t,kws in TOPICS.items() if any(k in pl for k in kws))

def cat_for(ext):
    if ext in TEXT_EXT: return "text"
    if ext in DOC_EXT:  return "doc"
    if ext in DATA_EXT: return "data"
    if ext in CODE_EXT: return "code"
    return "other"

DB = "/Users/nicholas/clawd/_estate_index.db"
if os.path.exists(DB): os.remove(DB)
con = sqlite3.connect(DB)
con.execute("""CREATE TABLE files(root TEXT, path TEXT, name TEXT, ext TEXT,
  cat TEXT, topics TEXT, size INTEGER, mtime REAL, sha1 TEXT, icloud_stub INTEGER)""")

def walk(root_name, root_path):
    n=0; sig=0
    for dirpath, dirnames, filenames in os.walk(root_path, topdown=True):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".Trash")]
        for fn in filenames:
            n+=1
            fp = os.path.join(dirpath, fn)
            stub = 1 if fn.endswith(".icloud") else 0
            ext = os.path.splitext(fn.replace(".icloud",""))[1].lower()
            if ext not in SIGNAL_EXT:   # skip non-signal (images, zips, binaries, pkgs)
                continue
            try:
                st = os.lstat(fp); size=st.st_size; mt=st.st_mtime
            except OSError:
                continue
            pl = fp.lower()
            sha=None
            # hash small local text-like files for dedup (never iCloud, never big)
            if root_name!="iCloud" and not stub and size < 1_000_000 and ext in (TEXT_EXT|DATA_EXT|CODE_EXT):
                try:
                    with open(fp,"rb") as f: sha=hashlib.sha1(f.read()).hexdigest()
                except OSError: pass
            con.execute("INSERT INTO files VALUES(?,?,?,?,?,?,?,?,?,?)",
                (root_name, fp, fn, ext, cat_for(ext), topics_for(pl), size, mt, sha, stub))
            sig+=1
        if n and n % 50000 < 200:
            con.commit(); print(f"  [{root_name}] scanned={n} signal={sig}", flush=True)
    con.commit()
    return n, sig

t0=time.time()
summary=[]
for rn, rp in ROOTS.items():
    if not os.path.isdir(rp):
        print(f"SKIP {rn}: not mounted", flush=True); continue
    print(f"=== {rn} : {rp} ===", flush=True)
    try:
        n,sig = walk(rn, rp)
    except Exception as e:
        print(f"  ERR {rn}: {e}", flush=True); n,sig=-1,-1
    summary.append((rn,n,sig)); print(f"  DONE {rn}: total={n} signal={sig}", flush=True)

con.execute("CREATE INDEX ix_topic ON files(topics)")
con.execute("CREATE INDEX ix_root ON files(root)")
con.execute("CREATE INDEX ix_sha ON files(sha1)")
con.commit()
print(f"\nELAPSED {time.time()-t0:.0f}s", flush=True)
print("SUMMARY", summary, flush=True)
con.close()
