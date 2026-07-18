"""sov33_arum.py — ARUM: the LAYER spine. Enumerates + wires all hive layers, Layer-0 up.

Third spine of SOV4: DRUM=time (stages+clock), KRUM=trust (Byzantine aggregation), ARUM=layers (this).
HONEST: ARUM is an ORGANIZING + WIRING of layers that ALREADY EXIST as modules. It is NOT a new engine
and NOT a living/self-aware system. It maps each layer to its real on-disk module and reports which
import clean (wired) vs missing (gap). "Awareness" here = the layer stack is legible and connected.
"""
import importlib, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# security layer modules live in the public submodule's security/ dir
_sec = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sovereign-temple-public", "security")
if os.path.isdir(_sec):
    sys.path.insert(0, _sec)
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))

# Layer-0 up: (layer_id, role, module, key_symbol)
LAYERS = [
    ("L0", "SIGIL attestation fabric (signs every decision)", "sov33_ed25519_sigil", None),
    ("L0a","Rainbow security (IP-rotation, worm/probe/DDoS evasion)","rainbow_rotate", "get_rotator"),
    ("L0b","BFT threat council (75-node, tolerate f=24 Byzantine)","bft_threat_council", "ThreatCouncil"),
    ("L1", "Memory (fixed planet-memory / identity)",         "sov33_memory_bridge", None),
    ("L2", "Fluid routing (rho-driven per-task composition)", "sov33_fluid_router", "decide"),
    ("L3", "Care ontology (0.35 floor, framed-harm gate)",    "sov33_care_local", "score_local"),
    ("L4", "Governed aggregation (KRUM Byzantine-robust)",    "sov33_governed_training", "agg_krum"),
    ("L5", "Conformal veto (Pr[allow&harmful]<=alpha)",       "sov33_conformal_veto", None),
    ("L6", "Evolve / IMPROVE (propose-only, human-gated)",    "sov33_evolve_layer", "propose"),
    ("L7", "BFT hive (DRUM quorum + N-version sensing)",      "sov33_bft_hive", None),
    ("L7b","Audit (catches overclaim before it ships)",       "sov33_audit_stage", "audit"),
    ("L7c","7-NN planet bus (hive awareness feed)",           "sov33_nn_hive_bus", "bus_status"),
    ("L7d","Fusion gate (rho: emergence precondition)",       "sov33_rho_gate", "fusion_gate"),
    ("L6b","Gated executor (propose->DORADO->guard->care->sign->run)","sov33_gated_executor","authorize_action"),
]

def wire():
    """Import every layer module; report wired vs gap. Pure introspection, no side effects claimed."""
    out = []
    for lid, role, mod, sym in LAYERS:
        rec = {"layer": lid, "role": role, "module": mod}
        try:
            m = importlib.import_module(mod)
            rec["wired"] = True
            rec["symbol_present"] = (sym is None) or hasattr(m, sym)
        except Exception as e:
            rec["wired"] = False
            rec["error"] = str(e)[:80]
            rec["symbol_present"] = False
        out.append(rec)
    return out

def manifest():
    w = wire()
    wired = sum(1 for r in w if r["wired"])
    return {"spine": "ARUM", "role": "LAYER spine (Layer-0 up), organizes+wires existing layers",
            "honest": "naming+wiring of existing modules, NOT a new engine or living system",
            "layers_total": len(w), "layers_wired": wired,
            "layers": w}

if __name__ == "__main__":
    import json
    m = manifest()
    print(f"ARUM: {m['layers_wired']}/{m['layers_total']} layers wired")
    for r in m["layers"]:
        flag = "OK " if r["wired"] and r["symbol_present"] else ("~  " if r["wired"] else "GAP")
        print(f"  [{flag}] {r['layer']:4} {r['role']}")


# --- L0 connects it all: every layer's output threaded through the SIGIL signing act ---
def signed_chain(layer_outputs):
    """Layer-0 is the connective tissue: each layer's output is signed by SIGIL and hash-chained
    to the previous, so the whole stack is ONE verifiable sequence. This is what 'L0 connects it
    all' means concretely — not L0 at the bottom, but L0 threading through every layer's output.
    layer_outputs: list of (layer_id, output_dict). Returns the signed chain + verification."""
    import sov33_ed25519_sigil as sigil
    import hashlib, json
    s = sigil.Ed25519Sigil()
    chain, prev = [], "genesis"
    for lid, out in layer_outputs:
        payload = {"layer": lid, "output": out, "prev": prev}
        rec = s.sign(json.dumps(payload, sort_keys=True))
        # link: this record's hash becomes prev for the next layer
        link = hashlib.sha256(json.dumps(rec, sort_keys=True).encode()).hexdigest()[:16]
        chain.append({"layer": lid, "sig_ok": s.verify(rec), "link": link, "prev": prev})
        prev = link
    all_verified = all(c["sig_ok"] for c in chain)
    return {"chain": chain, "all_layers_signed": all_verified, "length": len(chain),
            "connective_tissue": "L0/SIGIL — every layer output signed + hash-chained to prev"}
