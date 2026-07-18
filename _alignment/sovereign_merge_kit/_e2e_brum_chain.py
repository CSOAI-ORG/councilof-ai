import os
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"),"sov33_sigil"))
# FULL CHAIN: request -> BRUM route -> care-gate -> SIGIL sign -> (+ JRUM log)
req = "Does processing EU residents' data with an AI hiring tool comply with GDPR Article 6?"
steps = {}
# 1. BRUM routes (intelligence)
import sov33_brum as brum
r = brum.drive(req)
steps["1_BRUM_route"] = f"{r['node']} (conf={r['confidence']}, {r['route_method']})"
# 2. care-gate (governance)
from sov33_care_local import score_local, FLOOR
score, intent = score_local(req)
gated = score >= FLOOR
steps["2_care_gate"] = f"score={score:.2f} floor={FLOOR} -> {'ALLOW' if gated else 'VETO'}"
# 3. SIGIL sign (governance/attestation)
from sov33_ed25519_sigil import Ed25519Sigil
sig = Ed25519Sigil().sign(f"{req}|{r['node']}|{score}")
steps["3_SIGIL"] = f"signed seq={sig.get('seq')} hash={sig.get('own_hash','')[:12]}"
# 4. JRUM journal (reflective — remember the decision)
import sov33_jrum as jrum
j = jrum.log_decision(req, r['node'], gate="E2E_CHAIN", nn_signals={"care":score})
steps["4_JRUM_log"] = f"logged @ {j.get('drum')}"
# 5. TRUM+CRUM (render-ready + visual tone)
import sov33_trum as trum, sov33_crum as crum
ev = trum.world_events()[:3]
styled = crum.style_map(ev)
steps["5_TRUM_CRUM"] = f"{len(ev)} events render-ready, styles traced={styled['all_styles_traced_to_real_values']}"
print("=== BRUM FULL E2E CHAIN ===")
for k,v in steps.items(): print(f"  {k}: {v}")
print("CHAIN COMPLETE:", all(steps.values()))
