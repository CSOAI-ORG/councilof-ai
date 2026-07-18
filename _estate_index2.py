import os, sqlite3, time
ROOTS = {"Documents":"/Users/nicholas/Documents","Desktop":"/Users/nicholas/Desktop",
         "Downloads":"/Users/nicholas/Downloads",
         "iCloud":"/Users/nicholas/Library/Mobile Documents/com~apple~CloudDocs"}
SKIP={"node_modules",".git",".venv","venv","__pycache__",".cache",".npm",".next",
 ".turbo","dist","build",".pytest_cache",".mypy_cache","site-packages",".terraform",
 "vendor",".gradle",".tox","target",".idea",".vscode","coverage","bower_components"}
TEXT={".md",".txt",".markdown",".rst"};DOC={".pdf",".docx",".doc",".pages",".rtf",".odt",".key",".numbers",".xlsx",".pptx"}
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
con=sqlite3.connect("/Users/nicholas/clawd/_estate_index.db")
con.execute("DELETE FROM files WHERE root!='clawd'")  # clear partial Documents
t0=time.time()
for rn,rp in ROOTS.items():
    if not os.path.isdir(rp): print("SKIP",rn,flush=True); continue
    n=sig=0
    for dp,dns,fns in os.walk(rp,topdown=True):
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
              (rn,fp,fn,ext,cat(ext),tops(fp.lower()),size,mt,None,stub))
            sig+=1
        if n%40000<300: con.commit()
    con.commit(); print(f"DONE {rn}: total={n} signal={sig}",flush=True)
print("ELAPSED",int(time.time()-t0),"s",flush=True)
con.close()
