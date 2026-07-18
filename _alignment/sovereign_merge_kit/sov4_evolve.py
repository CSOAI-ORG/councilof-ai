#!/usr/bin/env python3
"""sov4_evolve.py — the GOVERNED self-improvement loop (data intake stage).

Closes the loop honestly: every governed decision is signed + logged (sov4_decisions.jsonl by sovereign_decision.decide).
This reads that ledger and distils the GOOD ones (answered, high-care, verified, not gated, real backend) into
retrain-ready instruction/response pairs -> expert_data/evolved.jsonl. Feed that to sov33_fuse_experts / sov33_modal_train,
run the battery, and swap ONLY IF it beats the incumbent (governed swap — that gate lives in the eval/swap step).

Honest: this does NOT auto-mutate weights. It prepares the *data* for a governed retrain. No silent self-modification.
Run:  python3 sov4_evolve.py            # -> how many new training pairs the loop harvested
"""
import os, json
HERE=os.path.dirname(os.path.abspath(__file__))
LEDGER=os.path.join(HERE,"sov4_decisions.jsonl")
OUT=os.path.join(HERE,"expert_data","evolved.jsonl")

def harvest(min_care=0.6):
    if not os.path.exists(LEDGER):
        print("no decision ledger yet — run some decide() calls first"); return 0
    seen=set(); pairs=[]
    for line in open(LEDGER):
        try: d=json.loads(line)
        except: continue
        # only learn from clean, signed, ungated, actually-answered decisions above the care bar
        if (d.get("stage")=="answered" and d.get("verified") and not d.get("gated")
                and (d.get("care") or 0) >= min_care and d.get("backend") not in (None,"care-veto","defoneos-veto")):
            q=(d.get("p") or "").strip(); a=(d.get("answer") or "").strip()
            if len(q)>6 and len(a)>12 and q not in seen:
                seen.add(q); pairs.append({"instruction":q,"response":a,"_care":d.get("care"),"_backend":d.get("backend")})
    if pairs:
        os.makedirs(os.path.dirname(OUT),exist_ok=True)
        open(OUT,"w").write("\n".join(json.dumps(p) for p in pairs)+"\n")
    print(f"harvested {len(pairs)} governed pairs -> {OUT}")
    print("next (governed): merge with merged_corpus.jsonl -> sov33_modal_train.py -> eval battery -> swap ONLY IF better -> sign")
    return len(pairs)

if __name__=="__main__":
    harvest()
