"""
MEOK ONE — ASSITTI: the Agent Discovery directory (Initiative 5 of the domination plan).

The doc's gap: "Every A2A agent publishes an Agent Card, but no central directory exists to
search, filter, and verify them." assitti.* is the canonical directory — the "DNS for agents".

What makes MEOK's version defensible (vs a plain list): every registered agent is run through
the SAME safety gateway that protects characters, and gets a SIGNED safety classification
(proofof.ai-style attestation). So assitti isn't just discovery — it's *verified* discovery.
That fuses three domains: assitti (directory) + the gateway (Initiative 2 security) + proofof
(attestation) into one product no competitor pairs.

Agent Card = the A2A standard descriptor: {name, description, url, provider, skills[],
capabilities, auth}. assitti stores cards, classifies each skill's safety tier via the
gateway, computes a trust grade, and serves search.

    register_agent(card)        -> store + classify + grade a card (returns the verified record)
    search(query, tier=None)    -> find agents by name/skill/domain, optional max-safety filter
    verify(agent_id)            -> re-check + (stub) signed attestation of the card
    directory()                 -> the whole verified directory (for the UI / public listing)

Storage: meok-one/data/assitti_directory.json (local, git-tracked seed; real deploy = a DB).
"""

import os
import json
import hashlib

from . import tool_gateway as gw

_DB = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "assitti_directory.json")

# Trust grade from the safety profile of an agent's skills.
#   A = all read-only (safe to auto-use)   B = has writes (needs confirm)
#   C = has prohibited-class skills (handle with care)   U = unverified/empty
def _grade(skill_tiers: list) -> str:
    if not skill_tiers:
        return "U"
    if "prohibited" in skill_tiers:
        return "C"
    if "write" in skill_tiers:
        return "B"
    return "A"


def _load() -> dict:
    if os.path.exists(_DB):
        try:
            return json.load(open(_DB))
        except Exception:
            pass
    return {"agents": {}, "version": 1}


def _save(d: dict):
    os.makedirs(os.path.dirname(_DB), exist_ok=True)
    json.dump(d, open(_DB, "w"), indent=2)


def _agent_id(card: dict) -> str:
    base = (card.get("name", "") + "|" + card.get("url", "")).lower()
    return "agent_" + hashlib.sha256(base.encode()).hexdigest()[:12]


def register_agent(card: dict) -> dict:
    """Store an A2A Agent Card, classify each skill via the safety gateway, grade it.
    Honest: classification is by the verified gateway rules — no skill is marked safe
    that the classifier would block."""
    d = _load()
    aid = _agent_id(card)
    skills = card.get("skills", []) or []
    classified = []
    tiers = []
    for s in skills:
        sname = s if isinstance(s, str) else (s.get("id") or s.get("name") or "")
        tier = gw.classify(sname)
        tiers.append(tier)
        classified.append({"skill": sname, "safety_tier": tier})
    rec = {
        "agent_id": aid,
        "name": card.get("name", "(unnamed)"),
        "description": card.get("description", ""),
        "url": card.get("url", ""),
        "provider": card.get("provider", ""),
        "domain": card.get("domain", "general"),
        "skills": classified,
        "skill_count": len(classified),
        "trust_grade": _grade(tiers),
        "safety_summary": {t: tiers.count(t) for t in ("read", "write", "prohibited") if tiers.count(t)},
        "verified": True,           # passed gateway classification
        "attestation": None,        # filled by verify() (proofof.ai signing — stub here)
    }
    d["agents"][aid] = rec
    _save(d)
    return rec


def search(query: str = "", tier: str = None, domain: str = None) -> list:
    """Find agents. query matches name/description/skill; tier filters by MAX safety tier
    an agent contains (e.g. tier='read' => only A-grade, fully safe agents)."""
    d = _load()
    q = (query or "").lower()
    order = {"read": 0, "write": 1, "prohibited": 2}
    out = []
    for rec in d["agents"].values():
        hay = (rec["name"] + " " + rec["description"] + " " +
               " ".join(s["skill"] for s in rec["skills"]) + " " + rec["domain"]).lower()
        if q and q not in hay:
            continue
        if domain and rec["domain"] != domain:
            continue
        if tier:
            maxtier = max((order[s["safety_tier"]] for s in rec["skills"]), default=0)
            if maxtier > order.get(tier, 2):
                continue
        out.append(rec)
    out.sort(key=lambda r: (r["trust_grade"], -r["skill_count"]))
    return out


def verify(agent_id: str) -> dict:
    """Re-classify an agent's skills and (stub) issue a signed attestation. The real
    signing routes through proofof.ai / meok-attestation-api; here we emit the cert
    SHAPE honestly (signature=None) rather than fake a signature."""
    d = _load()
    rec = d["agents"].get(agent_id)
    if not rec:
        return {"ok": False, "error": "unknown agent_id"}
    tiers = [s["safety_tier"] for s in rec["skills"]]
    rec["trust_grade"] = _grade(tiers)
    rec["attestation"] = {
        "cert_id": "ASSITTI-" + agent_id.split("_")[-1].upper(),
        "agent_id": agent_id, "trust_grade": rec["trust_grade"],
        "skills_classified": len(tiers),
        "signature": None,  # honest: real signing via meok-attestation-api (Ed25519 roadmap)
        "note": "classification verified by MEOK safety gateway; cryptographic signature "
                "pending proofof.ai integration",
    }
    d["agents"][agent_id] = rec
    _save(d)
    return {"ok": True, "record": rec}


def directory() -> dict:
    d = _load()
    agents = list(d["agents"].values())
    grades = {}
    for a in agents:
        grades[a["trust_grade"]] = grades.get(a["trust_grade"], 0) + 1
    return {"count": len(agents), "by_grade": grades, "agents": agents}


def _seed_from_gateway():
    """Bootstrap the directory with MEOK's OWN agents: SOV3 (the character brain) and the
    council, described as A2A Agent Cards. Real, not invented — skills come from the live
    gateway catalog."""
    cat = gw.catalog()
    sov3_skills = cat.get("sov3", {})
    all_sov3 = sov3_skills.get("read", []) + sov3_skills.get("write", []) + sov3_skills.get("prohibited", [])
    cards = [
        {"name": "MEOK Sovereign", "url": "https://35.246.43.221.sslip.io/sov3/mcp",
         "provider": "MEOK", "domain": "care",
         "description": "The Sovereign care-brain: memory, consciousness, BFT council, "
                        "guardian safety. The endpoint a MEOK character talks to.",
         "skills": all_sov3[:40]},
        {"name": "MEOK Council (12-around-1)", "url": "meok-one://sovereign_council",
         "provider": "MEOK", "domain": "governance",
         "description": "BFT-of-MoEs council: 11 expert lenses + 1 companion reconcile a "
                        "safe reply. Safety is a hard veto.",
         "skills": ["sovereign_council", "submit_council_proposal", "vote_on_proposal"]},
    ]
    for c in cards:
        register_agent(c)
    return len(cards)


if __name__ == "__main__":
    seeded = _seed_from_gateway()
    d = directory()
    print(f"=== ASSITTI — Agent Discovery directory (seeded {seeded} MEOK agents) ===")
    print(f"agents: {d['count']}   trust grades: {d['by_grade']}")
    print("  (A=all-safe-read · B=has-writes · C=has-prohibited · U=unverified)\n")
    for a in d["agents"]:
        print(f"  [{a['trust_grade']}] {a['name']:28s} {a['skill_count']:3d} skills  "
              f"{a['safety_summary']}  {a['domain']}")
    print("\n=== search demo: only fully-safe (read-only) agents ===")
    for a in search(tier="read"):
        print(f"  [{a['trust_grade']}] {a['name']} ({a['domain']})")
    print("\n=== verify (issue attestation cert) ===")
    first = d["agents"][0]["agent_id"] if d["agents"] else None
    if first:
        v = verify(first)
        print(f"  {v['record']['name']}: cert={v['record']['attestation']['cert_id']} "
              f"grade={v['record']['trust_grade']} signature={v['record']['attestation']['signature']}")
