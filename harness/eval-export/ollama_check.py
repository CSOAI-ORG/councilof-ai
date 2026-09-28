import json,re,sys,urllib.request,datetime
models=sorted(set(json.load(open(sys.argv[1]))))
out={"checked_at":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),"method":"GET https://ollama.com/library/<tag>; a library page is recorded only when the HTML <title> equals the tag's model name (an unknown name returns HTTP 200 with the generic title 'Ollama', a soft 404)","results":{}}
for m in models:
    name,_,tag=m.partition(":")
    url="https://ollama.com/library/"+(m if tag and tag!="latest" else name)
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"csoai-eval-export/0.1"})
        with urllib.request.urlopen(req,timeout=25) as r:
            code=r.status; s=r.read().decode("utf-8","replace")
    except urllib.error.HTTPError as e:
        code=e.code; s=""
    except Exception as e:
        out["results"][m]={"url":url,"state":"SEARCH_INCONCLUSIVE","error":type(e).__name__}; continue
    t=re.search(r"<title>([^<]*)</title>",s); title=t.group(1).strip() if t else None
    listed = code==200 and title is not None and title.split(":")[0]==name
    out["results"][m]={"url":url,"http":code,"title":title,"in_ollama_library":listed}
json.dump(out,sys.stdout,indent=1)
