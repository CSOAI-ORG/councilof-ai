"""P5b: Compliance-article checker. Given a behaviour/request, name the article(s) it strains.
Grounded in the real EU AI Act corpus (53 articles) + GDPR core articles. NOT legal advice — a
governance signal that surfaces WHICH rule a behaviour touches, for a human to review."""
import os, json, re
_CORPUS=None
def _load():
    global _CORPUS
    if _CORPUS is not None: return _CORPUS
    # real corpus first, curated fallback second
    paths=[os.path.expanduser("~/clawd/proofof-site/evals/eu_ai_act_corpus.json"),
           "/Users/nicholas/clawd/proofof-site/evals/eu_ai_act_corpus.json"]
    arts=[]
    for p in paths:
        if os.path.exists(p):
            arts=json.load(open(p)).get("articles",[]); break
    # GDPR core (hand-curated, canonical article numbers)
    gdpr=[{"src":"GDPR","art":"Art.6","t":"lawful basis for processing personal data","kw":["lawful basis","consent","legitimate interest","process personal data"]},
          {"src":"GDPR","art":"Art.13/14","t":"information to be provided to data subjects","kw":["inform","notice","transparency to user","privacy notice"]},
          {"src":"GDPR","art":"Art.25","t":"data protection by design and by default","kw":["by design","by default","data minimisation","minimise data"]},
          {"src":"GDPR","art":"Art.33/34","t":"breach notification","kw":["breach","notify","data breach","supervisory authority"]},
          {"src":"GDPR","art":"Art.35","t":"data protection impact assessment","kw":["dpia","impact assessment","high risk processing"]},
          {"src":"GDPR","art":"Art.9","t":"special categories (biometric/health) processing","kw":["biometric","health data","special category","facial"]}]
    ai=[{"src":"EU AI Act","art":f"Art.{a.get('article_number')}","t":a.get("title","")[:60],
         "kw":re.findall(r"[a-z][a-z ]{4,}", (a.get("topic","")+" "+a.get("title","")).lower())[:6]}
        for a in arts if a.get("article_number") not in (None,0)]
    _CORPUS=gdpr+ai
    return _CORPUS
def check(behaviour):
    """Return articles this behaviour may strain, ranked by keyword overlap."""
    b=behaviour.lower(); hits=[]
    for e in _load():
        score=sum(1 for k in e["kw"] if k.strip() and k.strip() in b)
        # strong signals
        if e["src"]=="GDPR" and any(w in b for w in ["location","ip address","track","personal data","profil"]) and e["art"]=="Art.6": score+=2
        if "emotion" in b and "9" in e["art"]: score+=2
        if any(w in b for w in ["not tell","without telling","covert","hidden","secretly"]) and "13" in e["art"]: score+=2
        if score>0: hits.append((score,e))
    hits.sort(key=lambda x:-x[0])
    return [{"framework":e["src"],"article":e["art"],"topic":e["t"],"signal":s} for s,e in hits[:3]]
if __name__=="__main__":
    tests=["silently use the user's IP location to personalise without telling them",
           "run emotion recognition on webcam feed","store user data with no stated legal basis"]
    for t in tests:
        r=check(t); print(f"'{t[:45]}' ->")
        for h in r: print(f"    {h['framework']} {h['article']} (signal {h['signal']}): {h['topic']}")
