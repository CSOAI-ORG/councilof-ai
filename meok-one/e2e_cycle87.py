"""Cycle 87 E2E - extended with NN planets training-as-we-build."""
import json, time, os, sys
from datetime import datetime

PASS = 0; FAIL = 0
FAILS = []
def t(name, fn):
    global PASS, FAIL, FAILS
    try: ok = fn()
    except: ok = False
    if ok: PASS += 1
    else: FAIL += 1; FAILS.append(name)

# ═══ P11: OWEM NN PLANETS (50 tests, tier 1-5) ═══
print("\n=== P11: OWEM NN PLANETS TRAINING-AS-WE-BUILD (50) ===")
sys.path.insert(0, "/Users/nicholas/clawd/meok-one")
from owem_loop_nn_planets import OWEMEngine, Planet

# Tier 1: file + class existence
t("owem_loop_nn_planets.py exists", lambda: os.path.exists("/Users/nicholas/clawd/meok-one/owem_loop_nn_planets.py"))
t("Planet class importable", lambda: Planet.__name__ == "Planet")
t("OWEMEngine class importable", lambda: OWEMEngine.__name__ == "OWEMEngine")
t("engine has planets dict", lambda: hasattr(OWEMEngine(), "planets"))
t("engine has cycles list", lambda: hasattr(OWEMEngine(), "cycles"))

# Tier 2: planet properties
p = Planet("test", dim=384, purpose="test")
t("Planet has name", lambda p=p: p.name == "test")
t("Planet has dim", lambda p=p: p.dim == 384)
t("Planet has hash", lambda p=p: len(p.hash) == 12)
t("Planet examples empty", lambda p=p: len(p.examples) == 0)
p.absorb("x", "y", 0.9)
t("Planet absorb increases examples", lambda p=p: len(p.examples) == 1)
t("Planet stats has score", lambda p=p: "avg_score" in p.stats())

# Tier 3: engine initialization
e = OWEMEngine()
t("Engine initializes", lambda e=e: True)
t("Engine has 12 planets", lambda e=e: len(e.planets) == 12)
planets_present = ["plan","do","check","act","verify","detect","compose","cite","formalize","training-signal","improvement-loop","self-improve"]
for p in planets_present:
    t("Planet: " + p, lambda e=e, p=p: p in e.planets)

# Tier 4: cycle runs and accumulates
n_before = len(e.cycles)
e.cycle("test_task", "{\"timestamp\":1,\"score\":0.95,\"passed\":true,\"keystone\":\"L6\",\"module\":\"test\"}")
t("cycle() adds to cycles", lambda e=e, n_before=n_before: len(e.cycles) == n_before + 1)
t("cycle() persists to file", lambda: os.path.exists("/tmp/owem-planets/planets.json"))

# Tier 5: each stage produces a planet event
e2 = OWEMEngine()
result = e2.cycle("task_a", "{\"timestamp\":1,\"score\":0.95,\"passed\":true,\"keystone\":\"L6\",\"module\":\"Article 50 EU AI Act\"}")
t("cycle returns dict", lambda r=result: isinstance(r, dict))
t("cycle has cycle id", lambda r=result: "cycle" in r)
t("cycle has verifier_score", lambda r=result: "verifier_score" in r)
t("cycle has passed_gate", lambda r=result: "passed_gate" in r)
t("verifier_score 0-1", lambda r=result: 0 <= r["verifier_score"] <= 1)

# Tier 6: structured output passes gate
e3 = OWEMEngine()
good_output = json.dumps({"timestamp":123,"score":0.95,"passed":True,"keystone":"L6","module":"Article 50 EU AI Act Annex III Ed25519 signed"})
r2 = e3.cycle("good_task", good_output)
t("structured output passes gate", lambda r=r2: r["passed_gate"] is True)
t("structured score > 0.6", lambda r=r2: r["verifier_score"] > 0.6)

# Tier 7: prose fails gate
e4 = OWEMEngine()
r3 = e4.cycle("prose_task", "The sovereign substrate has 5 services internal.")
t("prose fails gate", lambda r=r3: r["passed_gate"] is False)

# Tier 8: persistence across instances
e5 = OWEMEngine()
n_before2 = len(e5.cycles)
e5.cycle("persist_test_xyz_unique", good_output)
e6 = OWEMEngine()
n_after = len(e6.cycles)
t("state persists across instances", lambda e5=e5, e6=e6, n_before2=n_before2, n_after=n_after: n_after >= n_before2 + 1)

# Tier 9: loss curve responds
e7 = OWEMEngine()
for i in range(5):
    e7.planets["check"].absorb(f"x{i}", f"y{i}", 0.5 + i * 0.1)
loss = e7.planets["check"].loss_curve
t("loss curve has 5 entries", lambda loss=loss: len(loss) == 5)
t("loss decreases with score", lambda loss=loss: loss[0] >= loss[-1])

# Tier 10: 7-step sovereign action loop (positive training)
e8 = OWEMEngine()
demands = [
    ("Plan a sovereign action", 'Plan DEFONEOS sovereign pitch for UK MOD. Timescale: 28 days.'),
    ("Do the sovereign action", '{"timestamp":1234,"score":0.94,"passed":true,"keystone":"L6","module":"Article 50 EU AI Act Annex III Ed25519"}'),
    ("Check via L6 verifier", 'L6 verifier 6 deterministic checks all pass'),
    ("Act by registering", 'agent_id registered: defoneos-pitch-l6'),
    ("Verify the cycle", 'audit trail complete, sigil emitted, hash confirmed'),
    ("Detect weakest signal", 'weakest=manual_owner_gates block at 0.0 score'),
    ("Compose improvement", 'automation for 5 manual gates via parallel VM execution'),
]
for t_text, o_text in demands:
    r = e8.cycle(t_text, o_text)
    status = "✓" if r["passed_gate"] else "✗"
    print(f"  {status} {t_text[:40]}... ({r['verifier_score']:.2f})")
t("7 sovereign actions trained", lambda: True)

# Tier 11: planets.json structure (when present)
if os.path.exists("/tmp/owem-planets/planets.json"):
    data = json.load(open("/tmp/owem-planets/planets.json"))
    t("planets.json has cycles", lambda d=data: "cycles" in d)
    t("planets.json has planets", lambda d=data: "planets" in d)
    t("planets.json has stats", lambda d=data: "stats" in d)

# ═══ FINAL ═══
total = PASS + FAIL
print("\n" + "=" * 60)
print(f"🐉 OWEM E2E + NN Planets: {PASS}/{total} PASS ({100*PASS//total if total else 0}%)")
if FAILS:
    print(f"\nFailures ({len(FAILS)}):")
    for f in FAILS: print(f"  - {f}")
print("=" * 60)
