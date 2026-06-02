"""
law_core.py — MEOK LAW logic, standalone for the MCP (no meok-one dependency).

Mirrors meok_one/law.py but self-contained: reads law_bundle.json (the SAME bundle generated
from the real CSOAI crosswalks) and issues self-attested certificates via sha256 (the
authoritative SIGIL-audited registration is the live MEOK LAW service at meok.ai/law).

Informational governance mapping, NOT legal advice. Built by MEOK AI Labs.
"""
import hashlib
import json
import os
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
_BUNDLE_PATH = os.path.join(_HERE, "law_bundle.json")
_DISCLAIMER = ("Informational governance mapping, not legal advice. Confirm with qualified "
               "counsel for your jurisdiction and use-case.")
_ENTITIES = {
    "ai_agent": "Software AI agent",
    "humanoid": "Humanoid / physical robot",
    "robotics_company": "Robotics company (builder)",
    "business": "Business deploying AI",
}
_bundle = None


def _load():
    global _bundle
    if _bundle is None:
        with open(_BUNDLE_PATH) as f:
            _bundle = json.load(f)
    return _bundle


def _fw(fid):
    return _load()["frameworks"].get(fid, {})


def _region(rid):
    rid = (rid or "GLOBAL").upper()
    regions = _load()["regions"]
    return regions.get(rid, regions["GLOBAL"]), (rid if rid in regions else "GLOBAL")


def _primary_fw(rid):
    r, _ = _region(rid)
    fids = (r.get("binding") or []) + (r.get("advisory") or [])
    return fids[0] if fids else None


def overview():
    b = _load()
    fws = [{"id": f["id"], "name": f["name"], "region": f["region"], "kind": f["kind"],
            "binding": f["binding"], "cite": f["cite"], "mappings": f["total_mappings"]}
           for f in b["frameworks"].values()]
    fws.sort(key=lambda x: (not x["binding"], x["region"]))
    regions = [{"id": rid, "label": r["label"],
                "binding": [_fw(x).get("name", x) for x in r["binding"]],
                "advisory": [_fw(x).get("name", x) for x in r["advisory"]]}
               for rid, r in b["regions"].items()]
    return {"product": "MEOK LAW", "coverage": b["meta"]["coverage_note"],
            "hub": b["meta"]["hub"], "framework_crosswalks": b["meta"]["framework_crosswalks"],
            "crosswalk_mcps": b["crosswalk_mcps"], "frameworks": fws, "regions": regions,
            "entities": [{"id": k, "label": v} for k, v in _ENTITIES.items()],
            "disclaimer": _DISCLAIMER}


def applicable(region, entity="ai_agent"):
    r, rid = _region(region)
    entity = entity if entity in _ENTITIES else "ai_agent"
    binding = [{"id": x, "name": _fw(x).get("name", x), "cite": _fw(x).get("cite", "")}
               for x in r.get("binding", [])]
    advisory = [{"id": x, "name": _fw(x).get("name", x)} for x in r.get("advisory", [])]
    topic_ob = _load()["topic_obligations"]
    obs, seen = [], set()
    for x in r.get("binding", []) + r.get("advisory", []):
        for t in _fw(x).get("topics", []):
            if t in topic_ob and t not in seen:
                seen.add(t)
                obs.append({"topic": t, "obligation": topic_ob[t]})
    extra = []
    if entity == "humanoid":
        extra.append("Physical robots also fall under product & machinery safety law (e.g. EU "
                     "Machinery Regulation 2023/1230, ISO 13482) — not crosswalked here; treat as additional.")
    if entity in ("business", "robotics_company"):
        extra.append("As a deployer/builder you carry the obligations of every AI system you ship "
                     "or run — classify each system's risk tier and keep evidence per system.")
    return {"region": rid, "region_label": r["label"], "entity": entity,
            "entity_label": _ENTITIES[entity],
            "status": "binding law applies" if binding else "no horizontal AI statute — guidance applies",
            "binding": binding, "advisory": advisory, "also": r.get("also", ""),
            "obligations": obs, "entity_notes": extra, "disclaimer": _DISCLAIMER}


def crosswalk(from_region, to_region):
    rf, fid = _region(from_region)
    rt, tid = _region(to_region)
    pf, pt = _primary_fw(fid), _primary_fw(tid)
    pivot = _load()["pivot"]
    shared, new_on_entry = [], []
    for art, by_fw in pivot.items():
        if pf in by_fw and pt in by_fw:
            shared.append(art)
        elif pt in by_fw and pf not in by_fw:
            new_on_entry.append(art)

    def _n(a):
        return int("".join(c for c in a if c.isdigit()) or 0)
    shared.sort(key=_n)
    new_on_entry.sort(key=_n)
    examples = [{"charter_article": a,
                 "from": {"framework": _fw(pf).get("name", pf), "ref": pivot[a][pf][0]},
                 "to": {"framework": _fw(pt).get("name", pt), "ref": pivot[a][pt][0]}}
                for a in shared[:6]]
    fn, tn = _fw(pf).get("name", pf), _fw(pt).get("name", pt)
    return {"from": {"region": fid, "label": rf["label"], "framework": fn},
            "to": {"region": tid, "label": rt["label"], "framework": tn},
            "shared_articles": len(shared), "new_on_entry_count": len(new_on_entry),
            "new_on_entry": [{"article": a, "ref": pivot[a][pt][0]} for a in new_on_entry[:6]],
            "examples": examples,
            "narrative": (f"An agent governed to the CSOAI charter and compliant with {fn} in "
                          f"{rf['label']} maps to {tn} in {rt['label']} via {len(shared)} shared "
                          f"charter articles; entering {rt['label']} adds {len(new_on_entry)} new "
                          "obligation area(s). The charter binding travels with the agent."),
            "disclaimer": _DISCLAIMER}


def social_contract(entity="ai_agent", region="GLOBAL"):
    _, rid = _region(region)
    return {"title": "MEOK LAW — AI Social Contract", "bound_to": "CSOAI 52-Article Partnership Charter",
            "home_region": rid,
            "commitments": [
                "Keep a human able to understand, intervene, and override me (human oversight).",
                "Act under the care bond — refuse actions that cause foreseeable harm.",
                "Disclose that I am AI and keep an auditable record of my decisions.",
                "Carry these commitments across every region I enter (crosswalked, not dropped).",
                "Submit to the Sovereign Gate — money / credentials / deletion stay human-gated.",
                "Be revocable: my owner can suspend or retire me at any time."],
            "disclaimer": _DISCLAIMER}


def register(name, entity_type="ai_agent", region="GLOBAL", operator="", ts=None):
    """Issue a self-attested registration certificate (sha256). The authoritative,
    SIGIL-hash-chained registration is the live MEOK LAW service (meok.ai/law)."""
    name = (name or "unnamed-agent").strip()[:80]
    etype = entity_type if entity_type in _ENTITIES else "ai_agent"
    _, rid = _region(region)
    ts = int(ts if ts is not None else time.time())
    cert_id = hashlib.sha256(f"{name}|{etype}|{rid}|{operator}|{ts}".encode()).hexdigest()[:16]
    return {"cert_id": cert_id, "entity": name, "type": etype, "type_label": _ENTITIES[etype],
            "region": rid, "operator": (operator or None),
            "charter": "CSOAI 52-Article Partnership Charter", "care_bond": True,
            "sovereign_gate": True, "status": "registered (self-attested)", "ts": ts,
            "contract": social_contract(etype, rid),
            "authoritative_registry": "https://meok.ai/law (SIGIL-audited, hash-chained)",
            "disclaimer": _DISCLAIMER}
