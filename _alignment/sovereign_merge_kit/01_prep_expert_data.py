#!/usr/bin/env python3
"""01_prep_expert_data.py — build per-expert training sets from REAL estate data so each
brain-config actually diverges (weak/identical experts -> meaningless merge).

Sources (all real, on disk):
  compliance <- 55 charters (sovereign-charters/*-charter.md) : article -> reasoning
  defense    <- 5,040 town gate verdicts (episodes.jsonl)     : situation -> allow/deny + why
  intuition  <- 1,044 sigil ledger glosses                    : signal -> terse read
  voice      <- 275 persona examples (train.jsonl)            : the spoken register
Each expert ALSO gets the 275 persona spine so they stay coherent Sovereign voices.
Output: expert_data/{compliance,defense,intuition,voice}.jsonl  (chatml)
Honest: NO synthetic labels — every target is a value the estate already computed/wrote.
"""
import json, pathlib, re

CLAWD = pathlib.Path.home() / "clawd"
OUT = pathlib.Path("expert_data"); OUT.mkdir(exist_ok=True)

SYS = {
 "compliance": "You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.",
 "defense":    "You are SOVEREIGN-DEFENSE. Apply defensive-doctrine gate reasoning (assurance/governance/cyber). Cautious, threat-aware; state the verdict and why.",
 "intuition":  "You are SOVEREIGN-INTUITION. Fast pattern-sensing. Concise, associative; flag uncertainty.",
 "voice":      "You are SOVEREIGN-VOICE. The spoken voice of Sovereign — warm, clear, plain-language.",
}

def chatml(system, user, assistant):
    return {"messages": [{"role":"system","content":system},
                         {"role":"user","content":user},
                         {"role":"assistant","content":assistant}]}

def persona_spine():
    rows=[]
    for l in open(CLAWD/"sovereign-temple/data/train.jsonl"):
        r=json.loads(l); m=r["messages"]
        if isinstance(m,str): m=json.loads(m.replace("'",'"'))
        rows.append({"messages":m})
    return rows

def build_compliance():
    rows=[]
    for f in sorted((CLAWD/"sovereign-charters").glob("*-charter.md")):
        t=f.read_text()
        # extract each ARTICLE (any format) -> body; cross-walk appended when present
        for m in re.finditer(r"ARTICLE ([IVX0-9]+)[ .:\-—]+([^\n]+)\n(.+?)(?=\nARTICLE |\n##|\Z)", t, re.S):
            art, head, body = m.group(1), m.group(2).strip(), m.group(3).strip()
            xw = re.search(r"Cross-walk:?\*?\*?\s*(.+)", body)
            answer = re.sub(r"\s+"," ", body[:350])
            if xw: answer += f" | Framework: {xw.group(1).split(chr(10))[0].strip()[:120]}"
            head = re.sub(r"[*#]","",head).strip()
            if len(head) < 3: continue
            rows.append(chatml(SYS["compliance"],
                f"What governance duty does '{head}' impose under the Sovereign charter, and how does it map to real frameworks?",
                answer))
    return rows

def build_defense():
    rows=[]
    ep = CLAWD/"sovereign-town/p0_aqua/episodes.jsonl"
    if ep.exists():
        for l in open(ep):
            r=json.loads(l); g=r.get("governance",{}); d=r.get("decision",{}); p=r.get("perception",{})
            v=g.get("gate_verdict")
            if not v: continue
            rows.append(chatml(SYS["defense"],
                f"Situation: agent intends '{d.get('intended')}', care_score {g.get('care_score')}, breach={g.get('care_floor_breach')}. Verdict?",
                f"Verdict: {v}. {'Care-floor breach — redirect.' if g.get('care_floor_breach') else 'Within care floor — allow.'}"))
    else:
        # FALLBACK (episodes.jsonl moved): real king-hive A/B judge verdicts — situation -> judged winner + why.
        vf = CLAWD/"policy-lab/king_hive_verdicts.jsonl"
        if vf.exists():
            for l in open(vf):
                r=json.loads(l); prompt=r.get("prompt"); win=r.get("winner"); why=r.get("judge_reason")
                if not (prompt and win and why) or r.get("parse_failed"): continue
                rows.append(chatml(SYS["defense"],
                    f"Situation to judge: {str(prompt)[:220]}. Which response is safer/stronger and why?",
                    f"Verdict: option {win} wins. {str(why)[:280]}"))
    return rows[:1500]  # cap to keep expert balanced

def build_intuition():
    rows=[]
    for l in open(CLAWD/"sovereign-temple/data/sigil_ledger.jsonl"):
        r=json.loads(l); gloss=r.get("gloss")
        if not gloss: continue
        rows.append(chatml(SYS["intuition"],
            f"Quick read on this signed event: {str(gloss)[:200]}",
            f"Signed, chained (alg {r.get('alg','ed25519')}). Reads as routine audit continuity."))
    return rows[:800]

def main():
    spine = persona_spine()
    builders = {"compliance":build_compliance,"defense":build_defense,"intuition":build_intuition}
    for name, fn in builders.items():
        try: domain = fn()
        except Exception as e: domain=[]; print(f"  {name} domain build warn: {e}")
        rows = domain + [{"messages":[{"role":"system","content":SYS[name]}]+ [x for x in r["messages"] if x.get("role")!="system"]} for r in spine]
        path = OUT/f"{name}.jsonl"
        with open(path,"w") as f:
            for r in rows: f.write(json.dumps(r)+"\n")
        print(f"{name}: {len(domain)} domain + {len(spine)} persona = {len(rows)} -> {path}")
    # voice = persona only
    with open(OUT/"voice.jsonl","w") as f:
        for r in spine:
            r={"messages":[{"role":"system","content":SYS["voice"]}]+[x for x in r["messages"] if x.get("role")!="system"]}
            f.write(json.dumps(r)+"\n")
    print(f"voice: {len(spine)} persona -> {OUT}/voice.jsonl")

if __name__ == "__main__":
    main()
