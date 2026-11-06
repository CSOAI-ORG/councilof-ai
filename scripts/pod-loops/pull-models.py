import json, sys, time, urllib.request
models = sys.argv[1:]
for m in models:
    t0 = time.time(); print(time.strftime("%FT%TZ", time.gmtime()), "pull", m, flush=True)
    req = urllib.request.Request("http://127.0.0.1:11434/api/pull", data=json.dumps({"name": m, "stream": True}).encode(), headers={"Content-Type": "application/json"})
    status = "?"
    try:
        with urllib.request.urlopen(req, timeout=7200) as r:
            for line in r:
                try: d = json.loads(line)
                except Exception: continue
                status = d.get("status", status)
                if "error" in d: status = "ERROR " + str(d["error"]); break
        ok = status == "success"
    except Exception as e:
        ok = False; status = f"EXC {type(e).__name__}: {e}"
    print(time.strftime("%FT%TZ", time.gmtime()), ("done" if ok else "FAILED"), m, status, f"{int(time.time()-t0)}s", flush=True)
