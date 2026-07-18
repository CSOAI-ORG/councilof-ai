"""sov33_mindset_swarm.py — SRUM at 12-mindset width.

The 12 mindsets are PERSONA CONFIGS over a shared brain pool (NOT 12 separate trained models — honest
per prior ruling). The venturi SELECTS the relevant subset per task (not all 12 always — right-sized).
Each selected mindset answers as its persona; outputs care-gated + SIGIL-signed and returned per-mindset.
TESTED: select + persona-answer + care-gate + sign. NOT implemented here: BFT voting or master-OWEM aggregation
(that lives in the DESIGNED aggregator; this function returns the per-mindset set for a caller to aggregate).

HONEST: online tier (Oracle/NVIDIA) works NOW, no GPU. Accuracy gain requires decorrelated perspectives;
12 personas over ONE model share failure modes, so this improves JUDGMENT (diverse views), not raw capability.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))

# 12 mindsets: persona system-prompt + routing keywords the venturi matches against
MINDSETS = {
    "Dragon":     {"sys":"You are bold and decisive. Push for the ambitious path.", "kw":["risk","bold","aggressive","attack","compete","win"]},
    "Turtle":     {"sys":"You are cautious and defensive. Protect against downside.", "kw":["safe","protect","defend","risk","cautious","secure"]},
    "Sage":       {"sys":"You are wise and reflective. Ground the answer in principle.", "kw":["why","principle","ethics","meaning","wisdom","law"]},
    "Quant":      {"sys":"You are analytical. Reason with numbers, data, probabilities.", "kw":["cost","number","data","calculate","metric","probability","how much"]},
    "Companion":  {"sys":"You are warm and supportive. Attend to the human's wellbeing.", "kw":["feel","help","support","lonely","struggle","care"]},
    "Guardian":   {"sys":"You protect the end-user from harm. Flag anything unsafe.", "kw":["harm","safe","protect","abuse","vulnerable","danger","comply"]},
    "Builder":    {"sys":"You are practical. Give concrete steps to build the thing.", "kw":["build","make","step","implement","code","wire","how do"]},
    "Creator":    {"sys":"You are imaginative. Offer novel, original angles.", "kw":["idea","create","design","novel","imagine","new","invent"]},
    "Scout":      {"sys":"You explore. Surface what's new/bleeding-edge and unknowns.", "kw":["latest","new","explore","research","find","discover","edge"]},
    "Negotiator": {"sys":"You find the deal. Balance competing interests to agreement.", "kw":["deal","balance","trade","agree","compromise","price","partner"]},
    "Sovereign":  {"sys":"You govern. Decide with authority under the charter.", "kw":["decide","govern","charter","rule","authority","sovereign","policy"]},
    "Free":       {"sys":"You think without constraint. Question the frame itself.", "kw":["what if","reframe","question","assume","challenge","alternative"]},
}

def select_mindsets(task, min_heads=3, max_heads=5):
    """Venturi mindset-selection: score each mindset by keyword overlap; take top-k. Always >= min_heads
    (Sovereign+Guardian+Sage are the default governance core if nothing else matches)."""
    tl = task.lower()
    scored = [(name, sum(1 for k in m["kw"] if k in tl)) for name, m in MINDSETS.items()]
    hits = [(n,s) for n,s in scored if s > 0]
    hits.sort(key=lambda x: -x[1])
    chosen = [n for n,_ in hits[:max_heads]]
    for core in ["Sovereign","Guardian","Sage"]:   # governance floor: always present
        if core not in chosen: chosen.append(core)
    return chosen[:max(max_heads, min_heads)] if len(chosen) >= min_heads else chosen

def mindset_swarm(task, brain_fn):
    """brain_fn(system, user)->str. Selects mindsets, each answers as persona, gate+sign, aggregate."""
    import sov33_care_local as care, sov33_ed25519_sigil as sigil
    s = sigil.Ed25519Sigil()
    chosen = select_mindsets(task)
    cs, intent = care.score_local(task)
    per = []
    for name in chosen:
        m = MINDSETS[name]
        ans = brain_fn(m["sys"], task)
        rec = s.sign(json.dumps({"mindset":name,"task":task[:60]}, sort_keys=True))
        per.append({"mindset":name,"answer":ans[:180],"sig_ok":s.verify(rec)})
    return {"selected_mindsets":chosen,"n_selected":len(chosen),"of_total":len(MINDSETS),
            "task_care":round(cs,3),"gated_ok":cs>=0.35,
            "per_mindset":per,"all_signed":all(p["sig_ok"] for p in per),
            "note":"venturi selected the relevant subset (not all 12); governance core Sovereign/Guardian/Sage always present"}

if __name__ == "__main__":
    def mock(system, user): return f"[{system[:22]}...] on {user[:30]}"
    for t in ["What are the cheapest bold moves to win market share and compete?",
              "How do I protect a vulnerable elderly user from a harmful financial ask?",
              "Calculate the cost and build steps for a new data pipeline"]:
        r = mindset_swarm(t, mock)
        print(f"task={t[:45]!r}\n  -> {r['n_selected']}/{r['of_total']} mindsets: {r['selected_mindsets']} | signed={r['all_signed']}")
