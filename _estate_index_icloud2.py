import os, sqlite3, time
IC="/Users/nicholas/Library/Mobile Documents/com~apple~CloudDocs"
MAXDEPTH=6  # bounded: useful docs are shallow; avoids the deep synced-repo stall
SKIP={"node_modules",".git",".venv","venv","__pycache__",".cache",".npm",".next",
 ".turbo","dist","build",".pytest_cache",".mypy_cache","site-packages",".terraform",
 "vendor",".gradle",".tox","target",".idea",".vscode","coverage","bower_components"}
TEXT={".md",".txt",".markdown",".rst"};DOC={".pdf",".docx",".doc",".pages",".rtf",".odt",".xlsx",".pptx",".key",".numbers"}
DATA={".json",".yaml",".yml",".toml",".csv",".tsv",".xml",".ini",".env",".cfg",".sql"}
CODE={".py",".ts",".tsx",".js",".jsx",".sh",".rs",".go",".sol",".html",".css",".ipynb"}
SIG=TEXT|DOC|DATA|CODE
TOP={"sov3":["sov3","sovereign-temple"],"oowm":["oowm","open-world"],"meok":["meok"],
 "csoai":["csoai"],"defoneos":["defoneos"],"charter":["charter"],"layer0":["layer0","layer-0","oscal"],
 "sovspace":["sovspace","sovtown","cesium"],"mcp":["mcp"],"neural":["neural_core","_nn","mamba"],
 "keystone":["keystone","sigil","ed25519"],"alignment":["_alignment","memory.md","claude.md"],
 "compliance":["eu-ai-act","gdpr","dora","nis2","compliance","passport"],
 "business":["stripe","invoice","pricing","proposal","revenue","pitch","investor"]}
def cat(e): return "text" if e in TEXT else "doc" if e in DOC else "data" if e in DATA else "code" if e in CODE else "other"
def tops(pl): return ",".join(t for t,k in TOP.items() if any(x in pl for x in k))
base_depth=IC.rstrip("/").count("/")
con=sqlite3.connect("/Users/nicholas/clawd/_estate_index.db")
con.execute("DELETE FROM files WHERE root='iCloud'")
t0=time.time(); n=sig=0
for dp,dns,fns in os.walk(IC,topdown=True):
    depth=dp.rstrip("/").count("/")-base_depth
    if depth>=MAXDEPTH: dns[:]=[]   # prune deeper descent
    dns[:]=[d for d in dns if d not in SKIP and not d.startswith(".Trash")]
    for fn in fns:
        n+=1
        stub=1 if fn.endswith(".icloud") else 0
        ext=os.path.splitext(fn.replace(".icloud",""))[1].lower()
        if ext not in SIG: continue
        fp=os.path.join(dp,fn)
        try: st=os.lstat(fp); size=st.st_size; mt=st.st_mtime
        except OSError: continue
        con.execute("INSERT INTO files VALUES(?,?,?,?,?,?,?,?,?,?)",
          ("iCloud",fp,fn,ext,cat(ext),tops(fp.lower()),size,mt,None,stub))
        sig+=1
    if n%10000<300: con.commit()
con.commit()
print(f"iCloud(depth<={MAXDEPTH}) DONE: total={n} signal={sig} elapsed={int(time.time()-t0)}s")
con.close()
