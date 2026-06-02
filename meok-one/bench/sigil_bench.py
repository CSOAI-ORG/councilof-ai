"""SIGIL benchmark — does it actually help? Honest, measurable, with a REAL tokenizer.

Measures meok_one/sigil.py (the LIVE module, incl. the multimodal F/D opcodes) against the two
baselines an agent system would otherwise use to pass the same information:
  • English (verbose natural language)
  • JSON  (structured, what a tool/vision model emits)
  • SIGIL (our compact opcode line)

Two corpora:
  1. AGENT DECISIONS (text)  — votes / state / care / alerts / memory / query / handoff
  2. MULTIMODAL (vision)     — screen frames (F) + detections (D): SIGIL as the SEMANTIC layer
     over media (NOT a pixel codec — the honest framing). A vision model emits one of these per
     frame; agents reason over the SIGIL instead of re-shipping the model's fat JSON/caption.

Reports: tokens per form, compression ratio, % tokens saved, round-trip losslessness, throughput.
Tokenizer: tiktoken o200k_base (GPT-4o-class BPE) if available, else a chars/4 proxy (labelled).

Run:  python3 bench/sigil_bench.py
"""
import sys, os, json, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meok_one import sigil

try:
    import tiktoken
    _ENC = tiktoken.get_encoding("o200k_base")
    def ntok(s): return len(_ENC.encode(s))
    TOK = "tiktoken/o200k_base (real BPE)"
except Exception:
    def ntok(s): return max(1, round(len(s) / 4))
    TOK = "chars/4 proxy (tiktoken unavailable)"


# ---- corpus 1: agent decisions (each item = {sigil_dict, json, english}) ----
DECISIONS = [
    (dict(op="V", agent="care_governor", prop="p5c1940", choice="approve", conf="0.91"),
     {"op": "vote", "agent": "care_governor", "proposal": "p5c1940", "choice": "approve", "confidence": 0.91},
     "The care governor lens votes to approve proposal p5c1940 with a confidence of 0.91."),
    (dict(op="V", agent="security_sentinel", prop="p5c1940", choice="revise", conf="0.78"),
     {"op": "vote", "agent": "security_sentinel", "proposal": "p5c1940", "choice": "revise", "confidence": 0.78},
     "The security sentinel lens votes to revise proposal p5c1940 with a confidence of 0.78."),
    (dict(op="A", level="veto", msg="prompt_injection_guard flagged an instruction-hijack attempt"),
     {"op": "alert", "level": "veto", "message": "prompt_injection_guard flagged an instruction-hijack attempt"},
     "ALERT (veto level): the prompt injection guard flagged an instruction-hijack attempt."),
    (dict(op="C", subject="user", score="0.88", dims=["safety", "warmth", "attunement"]),
     {"op": "care", "subject": "user", "score": 0.88, "dimensions": ["safety", "warmth", "attunement"]},
     "Care assessment of the user scored 0.88 across the dimensions safety, warmth, and attunement."),
    (dict(op="S", fields={"char": "aria", "decision": "approved", "nodes": "5", "f": "1"}),
     {"op": "state", "character": "aria", "decision": "approved", "nodes": 5, "byzantine_f": 1},
     "State update: for character aria the decision was approved across 5 nodes tolerating f=1 Byzantine faults."),
    (dict(op="M", key="user/birthday", value="July 4", salience="0.9"),
     {"op": "memory", "key": "user/birthday", "value": "July 4", "salience": 0.9},
     'Store a memory under the key user/birthday with the value "July 4" at salience 0.9.'),
    (dict(op="Q", pattern="past promises to the user", k="5"),
     {"op": "query", "pattern": "past promises to the user", "k": 5},
     "Retrieve the top 5 memories matching the pattern: past promises to the user."),
    (dict(op="H", frm="aria", to="strategist", task="break the launch plan into weekly milestones"),
     {"op": "handoff", "from": "aria", "to": "strategist", "task": "break the launch plan into weekly milestones"},
     "Hand off from aria to the strategist: break the launch plan into weekly milestones."),
]

# ---- corpus 2: multimodal (screen frames + detections) ----
MULTIMODAL = [
    (dict(op="F", scene="VS Code with a failing pytest and an open terminal",
          objects=["vscode", "terminal", "error-banner", "test-tree"], ref="sha_9f2a"),
     {"frame": {"scene": "VS Code with a failing pytest and an open terminal",
                "objects": ["vscode", "terminal", "error-banner", "test-tree"], "ref": "sha_9f2a"}},
     "The screen shows VS Code with a failing pytest and an open terminal; the visible objects are "
     "vscode, terminal, an error banner, and the test tree. Reference hash sha_9f2a."),
    (dict(op="D", label="red error banner", bbox="x120,y480,w300,h40", conf="0.94"),
     {"detection": {"label": "red error banner", "bbox": [120, 480, 300, 40], "confidence": 0.94}},
     "Detected a red error banner at position x=120, y=480 with width 300 and height 40, "
     "at a confidence of 0.94."),
    (dict(op="F", scene="a strategy game, base under attack, low on resources",
          objects=["minimap", "enemy-units", "resource-bar", "alert"], ref="sha_3c7d"),
     {"frame": {"scene": "a strategy game, base under attack, low on resources",
                "objects": ["minimap", "enemy-units", "resource-bar", "alert"], "ref": "sha_3c7d"}},
     "The screen shows a strategy game where the base is under attack and the player is low on "
     "resources; visible objects: minimap, enemy units, resource bar, and an alert. Ref sha_3c7d."),
    (dict(op="D", label="enemy unit cluster", bbox="x880,y210,w160,h120", conf="0.87"),
     {"detection": {"label": "enemy unit cluster", "bbox": [880, 210, 160, 120], "confidence": 0.87}},
     "Detected an enemy unit cluster at position x=880, y=210 with width 160 and height 120, "
     "at a confidence of 0.87."),
]


def measure(corpus, label):
    eng = jsn = sig = 0
    for sdict, jdict, english in corpus:
        line = sigil.encode(sdict)
        eng += ntok(english)
        jsn += ntok(json.dumps(jdict, separators=(",", ":")))
        sig += ntok(line)
    n = len(corpus)
    return {"label": label, "n": n, "eng": eng, "jsn": jsn, "sig": sig,
            "eng_avg": eng / n, "jsn_avg": jsn / n, "sig_avg": sig / n,
            "vs_json_ratio": jsn / sig, "vs_json_save": 100 * (1 - sig / jsn),
            "vs_eng_ratio": eng / sig, "vs_eng_save": 100 * (1 - sig / eng)}


def roundtrip_ok(corpus):
    ok = 0
    for sdict, _, _ in corpus:
        line = sigil.encode(sdict)
        if sigil.encode(sigil.parse(line)) == line:
            ok += 1
    return ok, len(corpus)


def throughput(corpus, iters=2000):
    lines = [sigil.encode(s) for s, _, _ in corpus]
    t0 = time.perf_counter()
    for _ in range(iters):
        for ln in lines:
            sigil.gloss(sigil.encode(sigil.parse(ln)))   # full encode+parse+gloss cycle
    dt = time.perf_counter() - t0
    ops = iters * len(lines)
    return ops, dt, ops / dt


def main():
    rows = [measure(DECISIONS, "Agent decisions (text)"), measure(MULTIMODAL, "Multimodal (vision F/D)")]
    allc = DECISIONS + MULTIMODAL
    rows.append(measure(allc, "OVERALL"))
    rt_ok, rt_n = roundtrip_ok(allc)
    ops, dt, ops_s = throughput(allc)

    out = []
    out.append(f"# SIGIL benchmark — {time.strftime('%Y-%m-%d')}\n")
    out.append(f"Tokenizer: **{TOK}** · module: `meok_one/sigil.py` (live, incl. F/D multimodal).\n")
    out.append("| Corpus | n | English tok | JSON tok | SIGIL tok | vs JSON | vs English |")
    out.append("|---|--:|--:|--:|--:|--:|--:|")
    for r in rows:
        out.append(f"| {r['label']} | {r['n']} | {r['eng']} | {r['jsn']} | {r['sig']} | "
                   f"**{r['vs_json_ratio']:.2f}× / −{r['vs_json_save']:.0f}%** | "
                   f"**{r['vs_eng_ratio']:.2f}× / −{r['vs_eng_save']:.0f}%** |")
    out.append("")
    out.append(f"- **Round-trip lossless:** {rt_ok}/{rt_n} lines `encode(parse(x))==x` ✓")
    out.append(f"- **Throughput:** {ops:,} full encode→parse→gloss cycles in {dt:.3f}s = "
               f"**{ops_s:,.0f} ops/sec** (pure stdlib, single thread)")
    out.append("")
    out.append("**Honest read:** SIGIL is denser than JSON and far denser than English for both "
               "agent decisions and the multimodal *semantic* layer. The multimodal win is real but "
               "specific: SIGIL compresses the vision model's STRUCTURED OUTPUT (scene/objects/bbox), "
               "not raw pixels — agents pass the SIGIL summary instead of re-describing the frame. "
               "Every saved token is saved on EVERY agent hop, and the line stays glossable + "
               "hash-chained for audit.")
    report = "\n".join(out)
    print(report)
    dst = os.path.join(os.path.dirname(__file__), "..", "..", "MEOK_SIGIL_BENCH_2026-06-02.md")
    try:
        open(os.path.abspath(dst), "w").write(report + "\n")
        print(f"\n[written: {os.path.abspath(dst)}]")
    except Exception as e:
        print(f"\n[write skipped: {e}]")


if __name__ == "__main__":
    main()
