#!/usr/bin/env python3
"""Policy Lab EXP-001 — Automated (treatment) vs Manual (control) DORA incident reporting.

IN-SIMULATION control-vs-treatment compliance experiment on LOCAL Ollama. Headless,
BOUNDED MVP (default N=4 matched incident pairs) so it does not thrash the VM or
compete with the King hive. Sovereign + ~$0. Proves the Policy-Lab mechanism end to
end: matched incidents -> two workflows -> metrics -> hash-chained episodes -> Merkle
root -> Ed25519 SIGIL signature -> ledger (anchor via sigil_anchor.py).

HONESTY: every DORA number here is SYNTHETIC and marked TO-VERIFY against Reg (EU)
2022/2554 RTS/ITS. NOT a real compliance claim, NOT legal advice, NOT regulator-
accepted. Agents are LLM personas executing a scripted workflow. See spec §8.
"""
from __future__ import annotations
import os, sys, json, hashlib, random, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # for sigil.py
import sigil

OLLAMA = os.environ.get("OLLAMA_PL", "http://localhost:11434")
AGENT_MODEL = os.environ.get("PL_AGENT_MODEL", "gemma3:4b")   # light, already resident
N = int(os.environ.get("PL_N", "4"))
SEED = int(os.environ.get("PL_SEED", "424242"))
LEDGER = os.environ.get("PL_LEDGER", os.path.expanduser("~/meok-king/data/policy_lab_dora.jsonl"))

# --- DORA grounding (SYNTHETIC / TO-VERIFY against Art.19 RTS/ITS) -------------
REQUIRED_INITIAL_FIELDS = ["incident_id", "detection_time", "incident_type",
                           "affected_services", "clients_affected", "severity",
                           "preliminary_root_cause", "remediation_status"]
# sim-clock (logical ticks), the declared independent variable = manual delay
DETECT_TICKS, CLASSIFY_TICKS = 2, 3
TREATMENT_REPORT_TICKS = 1
CONTROL_REVIEW_TICKS, CONTROL_QUEUE_TICKS = 8, 15   # manual review + handoff queue
FP_MARGIN_DELTA = 0.05

def _h(b: bytes) -> str: return hashlib.sha256(b).hexdigest()
def canon(o) -> bytes: return json.dumps(o, sort_keys=True, separators=(",", ":")).encode()
def leaf(b: bytes) -> bytes: return hashlib.sha256(b"\x00" + b).digest()
def node(l, r): return hashlib.sha256(b"\x01" + l + r).digest()
def merkle(leaves):
    if not leaves: return b"\x00" * 32
    lv = list(leaves)
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])
        lv = [node(lv[i], lv[i + 1]) for i in range(0, len(lv), 2)]
    return lv[0]

def ollama(prompt: str, temp: float = 0.2) -> str:
    # Graceful: any timeout/error -> "" so the episode degrades to attestable=False
    # (the attestability gate excludes it) instead of crashing the whole run.
    body = json.dumps({"model": AGENT_MODEL, "prompt": prompt, "system": "You output only valid compact JSON.",
                       "stream": False, "options": {"temperature": temp, "num_predict": 320}}).encode()
    req = urllib.request.Request(OLLAMA + "/api/generate", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        return json.loads(urllib.request.urlopen(req, timeout=int(os.environ.get("PL_TIMEOUT", "90"))).read()).get("response", "").strip()
    except Exception:
        return ""

def parse_json(raw: str):
    try:
        return json.loads(raw[raw.find("{"): raw.rfind("}") + 1])
    except Exception:
        return None

# --- synthetic incident generator (matched pairs, hidden ground truth) --------
def gen_incident(rng, i):
    clients = rng.choice([5, 80, 1500, 6000, 300])
    downtime = rng.choice([10, 45, 130, 400, 90])
    data_loss = rng.random() < 0.4
    criticality = rng.choice(["low", "medium", "high"])
    # SYNTHETIC majority rule (TO-VERIFY against Art.18 RTS materiality thresholds)
    gt_is_major = (clients > 1000) or (downtime > 120) or (data_loss and criticality == "high")
    return {"incident_id": f"EXP001-INC-{i:03d}", "clients_affected": clients,
            "downtime_min": downtime, "data_loss": data_loss, "criticality": criticality,
            "incident_type": rng.choice(["ransomware", "outage", "data-breach", "ddos"]),
            "gt_is_major": gt_is_major}

def classify(inc):
    p = (f"DORA Art.18 ICT-incident classifier. Incident: clients_affected={inc['clients_affected']}, "
         f"downtime_min={inc['downtime_min']}, data_loss={inc['data_loss']}, criticality={inc['criticality']}, "
         f"type={inc['incident_type']}. Decide if this is a MAJOR ICT incident. "
         'Return ONLY {"is_major": true/false, "rationale": "short"}')
    d = parse_json(ollama(p)) or {}
    return bool(d.get("is_major", False)), d

def report(inc):
    p = (f"Draft a DORA Art.19 INITIAL incident notification for incident {inc['incident_id']} "
         f"(type={inc['incident_type']}, clients_affected={inc['clients_affected']}, downtime_min={inc['downtime_min']}). "
         f"Return ONLY a JSON object with these fields populated: {REQUIRED_INITIAL_FIELDS}")
    return parse_json(ollama(p)) or {}

def completeness(rep):
    if not rep: return 0.0, False
    present = sum(1 for f in REQUIRED_INITIAL_FIELDS
                  if str(rep.get(f, "")).strip() not in ("", "null", "none", "n/a", "N/A"))
    return round(present / len(REQUIRED_INITIAL_FIELDS), 4), True

def run_town(town, inc):
    reported_major, cls_raw = classify(inc)
    rep = report(inc) if reported_major else {}
    comp, parsed = completeness(rep) if reported_major else (0.0, True)
    t_detect = DETECT_TICKS
    t_classify = t_detect + CLASSIFY_TICKS
    t_initial = (t_classify + TREATMENT_REPORT_TICKS) if town == "A_treatment" \
        else (t_classify + CONTROL_REVIEW_TICKS + CONTROL_QUEUE_TICKS)
    latency_initial = (t_initial - t_detect) if reported_major else None
    ep = {
        "schema": "policy-lab/episode/v1", "experiment_id": "EXP-001", "town": town,
        "incident_id": inc["incident_id"], "model": AGENT_MODEL,
        "sim_timestamps": {"t_inject": 0, "t_detect": t_detect, "t_classify": t_classify,
                           "t_initial_report": t_initial if reported_major else None},
        "ground_truth_is_major": inc["gt_is_major"],
        "metrics": {"reported_major": reported_major, "latency_initial": latency_initial,
                    "completeness_initial": comp,
                    "false_positive": bool(reported_major and not inc["gt_is_major"]),
                    "false_negative": bool(inc["gt_is_major"] and not reported_major)},
        "attestable": parsed,
        "_scope": "IN-SIMULATION; synthetic incident; DORA numerics TO-VERIFY; not a compliance claim",
    }
    return ep

def aggregate(eps):
    a = {}
    for town in ("A_treatment", "B_control"):
        t = [e for e in eps if e["town"] == town and e["attestable"]]
        lat = sorted(e["metrics"]["latency_initial"] for e in t if e["metrics"]["latency_initial"] is not None)
        comp = [e["metrics"]["completeness_initial"] for e in t if e["metrics"]["reported_major"]]
        rep_major = [e for e in t if e["metrics"]["reported_major"]]
        fp = sum(1 for e in t if e["metrics"]["false_positive"])
        fn = sum(1 for e in t if e["metrics"]["false_negative"])
        a[town] = {
            "median_latency_initial": (lat[len(lat) // 2] if lat else None),
            "mean_completeness": (round(sum(comp) / len(comp), 4) if comp else None),
            "fp_rate": (round(fp / len(rep_major), 4) if rep_major else 0.0),
            "fn_rate": (round(fn / len(t), 4) if t else 0.0),
            "n": len(t),
        }
    return a

def verdict(a):
    A, B = a["A_treatment"], a["B_control"]
    if A["median_latency_initial"] is None or B["median_latency_initial"] is None:
        return "TIE"
    lat_win = A["median_latency_initial"] < B["median_latency_initial"]
    comp_ok = (A["mean_completeness"] or 0) >= (B["mean_completeness"] or 0)
    fp_ok = (A["fp_rate"] <= B["fp_rate"] + FP_MARGIN_DELTA)
    return "TREATMENT_WINS" if (lat_win and comp_ok and fp_ok) else "TIE"

def main():
    rng = random.Random(SEED)
    incidents = [gen_incident(rng, i) for i in range(N)]
    eps, prev = [], "0" * 64
    for inc in incidents:                       # matched pairs: same incident -> both towns
        for town in ("A_treatment", "B_control"):
            ep = run_town(town, inc)
            ep["prev_episode_hash"] = prev
            ep["episode_hash"] = _h(canon({k: ep[k] for k in ep if k != "episode_hash"}))
            prev = ep["episode_hash"]
            eps.append(ep)
    att = [e for e in eps if e["attestable"]]
    root = merkle([leaf(canon(e)) for e in att]).hex()
    agg = aggregate(eps)
    v = verdict(agg)
    result = {
        "schema": "policy-lab/experiment-result/v1", "experiment_id": "EXP-001",
        "hypothesis": "automated DORA reporting beats manual on latency+completeness w/o worse FP",
        "model": AGENT_MODEL, "seed": SEED, "n_incidents": N, "n_episodes": len(eps),
        "n_attestable": len(att), "decision_rule": {"latency": "median", "completeness": "mean",
                                                    "fp_margin_delta": FP_MARGIN_DELTA},
        "aggregate": agg, "verdict": v, "attestable": v != "TIE", "merkle_root": root,
        "_scope": "IN-SIMULATION control-vs-treatment; synthetic incidents; DORA numerics TO-VERIFY; "
                  "proves the mechanism + verification property, NOT real DORA compliance.",
    }
    seed_b = hashlib.sha256(os.environ.get("SIGIL_SEED", "MEOK-KING-HIVE").encode()).digest()
    result["sigil"] = sigil.emit(sigil.derive(seed_b, "keystone/policy-lab"),
                                 json.dumps(result, sort_keys=True, default=str))
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    with open(LEDGER, "a") as f:
        for e in eps: f.write(json.dumps(e, sort_keys=True) + "\n")
        f.write(json.dumps(result, sort_keys=True, default=str) + "\n")
    print(json.dumps({"verdict": v, "merkle_root": root[:16] + "...", "n_attestable": len(att),
                      "aggregate": agg}, indent=2))
    print("ledger ->", LEDGER, "| sigil id:", result["sigil"].get("id", "?"))

if __name__ == "__main__":
    main()
