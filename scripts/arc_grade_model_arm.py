import json, pathlib, collections, os


def grade_task(path):
    """Return SOLVED / FAILED / UNGRADED for one task file.
    `correct` may be True, False, or None. `attempt_N` may be an object, null, or absent.
    None and null and absent all mean NOT GRADED. They never mean wrong."""
    blob = json.load(open(path))
    pairs = blob if isinstance(blob, list) else [blob]
    if not pairs: return "UNGRADED"
    pair_states = []
    for p in pairs:
        vals = []
        for a in ("attempt_1", "attempt_2"):
            att = p.get(a)
            if isinstance(att, dict):
                c = att.get("correct")
                if c is True or c is False: vals.append(c)
        if not vals:            pair_states.append("UNGRADED")
        elif any(vals):         pair_states.append("SOLVED")
        else:                   pair_states.append("FAILED")
    if any(s == "UNGRADED" for s in pair_states): return "UNGRADED"   # cannot score the task
    return "SOLVED" if all(s == "SOLVED" for s in pair_states) else "FAILED"

def build(data_dir=None):
    """data_dir holds v2eval/<config>/*.json. Resolved at CALL time, never at import."""
    root = pathlib.Path(data_dir or os.environ.get("ARC_DATA", ".")) / "v2eval"
    out = {}
    for d in sorted(root.iterdir()):
        if not d.is_dir() or d.name.startswith("."): continue
        st = collections.Counter(); per = {}
        for f in d.glob("*.json"):
            g = grade_task(f); st[g] += 1; per[f.stem] = g
        out[d.name] = (st, per)
    return out

if __name__ == "__main__":
    res = build()
    tot = collections.Counter()
    for st, _ in res.values(): tot += st
    print("ALL CONFIGS:", dict(tot))
    ung = [(c, st) for c, (st, _) in res.items() if st["SOLVED"] + st["FAILED"] == 0]
    print(f"\nconfigs with ZERO gradeable tasks ({len(ung)}) — these are UNMEASURED, not 0%:")
    for c, st in ung: print(f"   {c}  ungraded={st['UNGRADED']}")
    part = [(c, st) for c, (st, _) in res.items() if st["UNGRADED"] and st["SOLVED"] + st["FAILED"] > 0]
    print(f"\nconfigs PARTLY ungraded ({len(part)}):")
    for c, st in sorted(part, key=lambda x: -x[1]["UNGRADED"])[:12]:
        g = st["SOLVED"] + st["FAILED"]
        print(f"   {c:48} graded={g:>3} ungraded={st['UNGRADED']:>3} ({st['UNGRADED']/(g+st['UNGRADED']):.1%})")
