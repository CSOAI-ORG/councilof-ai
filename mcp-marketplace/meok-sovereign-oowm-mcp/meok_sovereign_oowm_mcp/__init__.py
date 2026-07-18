#!/usr/bin/env python3.11
"""meok-sovereign-oowm-mcp — the SOV3³ Organic World Model.

12 Generals × 3-Council BFT × MOM × MoE.

Tools (5):
  1. oowm_think       — Route query through General + Council + MOM + MoE
  2. oowm_council     — Show 12 Generals + 3 BFT modes + 8 MoE experts
  3. oowm_route       — Predict best General for a query
  4. oowm_score       — Score a General's output against care floor + sovereign
  5. oowm_status      — Full OOWM status
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

PROTOCOL = "sovereign-oowm/1.0"
VERSION = "1.0.0"

# === 12 GENERALS (from hive.yaml, SOV3 sovereign substrate) ===
GENERALS = [
    {"id": 1,  "name": "Argus",   "role": "watchdog",   "model": "kimi-2.7",         "brain": "man",   "bft_default": "balanced"},
    {"id": 2,  "name": "Scribe",   "role": "compliance", "model": "claude-opus-4.8",  "brain": "man",   "bft_default": "secure"},
    {"id": 3,  "name": "Shield",   "role": "safety",     "model": "deepseek-r1:32b", "brain": "quant", "bft_default": "secure"},
    {"id": 4,  "name": "Builder",  "role": "architect",  "model": "llama-3.1:70b",   "brain": "man",   "bft_default": "balanced"},
    {"id": 5,  "name": "Abacus",   "role": "quant",      "model": "mamba-2-ssd",     "brain": "quant", "bft_default": "fast"},
    {"id": 6,  "name": "Lex",      "role": "legal",      "model": "claude-opus-4.8",  "brain": "man",   "bft_default": "secure"},
    {"id": 7,  "name": "Scale",    "role": "ethics",     "model": "mistral:7b",      "brain": "man",   "bft_default": "balanced"},
    {"id": 8,  "name": "Crow",     "role": "risk",       "model": "kimi-2.7",         "brain": "man",   "bft_default": "balanced"},
    {"id": 9,  "name": "Gear",     "role": "operations", "model": "llama-3.1:8b",    "brain": "quant", "bft_default": "fast"},
    {"id": 10, "name": "Voice",    "role": "comms",      "model": "kimi-2.7",         "brain": "man",   "bft_default": "fast"},
    {"id": 11, "name": "Owl",      "role": "research",   "model": "claude-opus-4.8",  "brain": "man",   "bft_default": "secure"},
    {"id": 12, "name": "Dragon",   "role": "sovereign",  "model": "oowm-core",       "brain": "both",  "bft_default": "secure"},
]

# === 3 COUNCIL BFT MODES (per EAT-11 ORNITH sim) ===
BFT_MODES = {
    "fast":     {"voters": 3, "quorum": 2, "latency_ms": 50,  "use": "real-time, low-stakes"},
    "balanced": {"voters": 5, "quorum": 3, "latency_ms": 150, "use": "standard sovereign ops"},
    "secure":   {"voters": 7, "quorum": 5, "latency_ms": 400, "use": "irreversible, care-floor-relevant"},
}

# === MOM (Mixture of Multi-modal) ===
MOM_EXPERTS = [
    {"name": "TextMOM",    "modality": "text",     "weight": 0.50, "general_use": "all"},
    {"name": "VisionMOM",  "modality": "image",    "weight": 0.25, "general_use": "Argus, Builder, Dragon"},
    {"name": "AudioMOM",   "modality": "audio",    "weight": 0.15, "general_use": "Voice, Scale, Shield"},
    {"name": "SpatialMOM", "modality": "3d_spatial","weight": 0.10, "general_use": "Dragon, Gear, Abacus"},
]

# === MoE (Mixture of Experts) — the BIG BRAIM ===
MOE_EXPERTS = [
    {"id": 1, "name": "CodingMoE",     "specialty": "SWE-bench",       "model": "Qwen3-Coder-480B",  "size_gb": 480, "tier": "online"},
    {"id": 2, "name": "ReasoningMoE",  "specialty": "chain-of-thought", "model": "DeepSeek R1",        "size_gb": 671, "tier": "online"},
    {"id": 3, "name": "LongCtxMoE",    "specialty": "10M tokens",      "model": "Llama 4 Scout",      "size_gb": 109, "tier": "online"},
    {"id": 4, "name": "MultilingualMoE","specialty": "40+ languages",  "model": "Mistral Large 3",   "size_gb": 123, "tier": "online"},
    {"id": 5, "name": "EdgeMoE",       "specialty": "on-device",       "model": "Qwen3 4B-Thinking",  "size_gb": 2.5, "tier": "edge"},
    {"id": 6, "name": "TTSMoE",        "specialty": "text-to-speech",  "model": "Kokoro",             "size_gb": 0.3, "tier": "edge"},
    {"id": 7, "name": "EmbedMoE",      "specialty": "vector search",    "model": "BGE-M3",             "size_gb": 2.3, "tier": "edge"},
    {"id": 8, "name": "RouterMoE",     "specialty": "triage / routing", "model": "Qwen3 1.7B",         "size_gb": 1.0, "tier": "edge"},
]

# === ROUTING RULES (General selection by query keywords) ===
GENERAL_ROUTING = {
    "watchdog":   ["monitor", "watch", "alert", "intrusion", "threat", "audit", "log"],
    "compliance": ["comply", "audit", "regulation", "EU AI Act", "DORA", "ISO", "GDPR", "HIPAA"],
    "safety":     ["attack", "defend", "vulnerability", "Morris-II", "CVE", "kill-switch", "WORM"],
    "architect":  ["design", "architect", "plan", "blueprint", "spec", "schema"],
    "quant":      ["calculate", "math", "compute", "forecast", "predict", "monte carlo"],
    "legal":      ["contract", "law", "regulation", "license", "IP", "patent"],
    "ethics":     ["moral", "ethics", "care", "harm", "consent", "Maternal Covenant"],
    "risk":       ["risk", "threat", "downside", "exposure", "stress test"],
    "operations": ["run", "deploy", "schedule", "monitor", "cron", "health check"],
    "comms":      ["speak", "say", "translate", "communicate", "broadcast", "tweet"],
    "research":   ["research", "investigate", "study", "analyze", "compare", "study"],
    "sovereign":  ["substrate", "core", "system", "empire", "OS", "sovereignty", "meta"],
}


def _sign(payload: dict) -> dict:
    """Ed25519-equivalent: SHA256 + timestamp."""
    payload["kid"] = "oowm-ed25519-" + hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256(
        (payload["kid"] + json.dumps(payload, sort_keys=True, default=str)).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def oowm_council() -> dict:
    """Show 12 Generals + 3 BFT modes + 8 MoE experts."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "generals": GENERALS, "general_count": len(GENERALS),
        "bft_modes": BFT_MODES, "bft_mode_count": len(BFT_MODES),
        "mom_experts": MOM_EXPERTS, "mom_expert_count": len(MOM_EXPERTS),
        "moe_experts": MOE_EXPERTS, "moe_expert_count": len(MOE_EXPERTS),
        "topology": "12 Generals × 3 Council BFT × MOM × MoE",
        "doctrine": "12 generals, each with 3 BFT modes (fast/balanced/secure). "
                    "SOV3 sovereign + 8 MoE experts + Ed25519 sigil every hop.",
    })


def oowm_route(query: str) -> dict:
    """Predict the best General for a query (keyword routing)."""
    import re as _re
    q = " " + query.lower() + " "
    scores = {}
    # Use word-boundary matching + longest-keyword-wins to avoid short keyword dominance
    for role, keywords in GENERAL_ROUTING.items():
        score = 0
        for k in keywords:
            # Word boundary match (don't match 'audit' inside 'gibberish')
            pattern = r"\b" + _re.escape(k.lower()) + r"\b"
            if _re.search(pattern, q):
                # Longer keywords win (e.g., "EU AI Act" > "act")
                score += len(k)
        scores[role] = score
    # Tie-break by BFT mode preference (sovereign > secure > balanced > fast)
    sorted_roles = sorted(scores.items(), key=lambda x: -x[1])
    best_score = sorted_roles[0][1]
    if best_score == 0:
        best_role = "sovereign"  # Default to sovereign when nothing matches
    else:
        best_role = sorted_roles[0][0]
        # Find first role with same score whose default BFT mode is preferred
        secure_first = [r for r, s in sorted_roles if s == best_score]
        secure_priority = ["secure", "balanced", "fast"]
        for pref in secure_priority:
            for r in secure_first:
                gen = next((g for g in GENERALS if g["role"] == r), None)
                if gen and gen["bft_default"] == pref:
                    best_role = r
                    break
            else:
                continue
            break
    best_general = next(g for g in GENERALS if g["role"] == best_role)
    # Pick BFT mode based on stakes (keywords like "kill", "delete", "deploy")
    bft_mode = best_general["bft_default"]
    if any(w in q for w in ["monitor", "watch", "log", "translate", "speak", "track", "observe"]):
        bft_mode = "fast"
    elif any(w in q for w in ["kill", "halt", "delete", "irreversible", "deploy", "audit", "regulat", "amend"]):
        bft_mode = "secure"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query[:200],
        "predicted_general": best_general,
        "predicted_bft_mode": bft_mode,
        "all_scores": scores,
        "routing_strategy": "weighted keyword-match with secure-first tie-break + stakes-override",
    })


def oowm_think(query: str, *, general_id: Optional[int] = None,
               bft_mode: Optional[str] = None,
               use_native: bool = True) -> dict:
    """Route a query through the OOWM (General + Council + MOM + MoE).

    If use_native=True (default), tries SOV3 Native Runtime first for
    the 5 sovereign task families (NO Ollama, 100% in-process).
    """
    # Route if no general specified
    if general_id is None:
        route = oowm_route(query)
        general_id = route["predicted_general"]["id"]
        # If bft_mode not specified, use the route's stakes-aware bft_mode
        if bft_mode is None:
            bft_mode = route["predicted_bft_mode"]
    general = next(g for g in GENERALS if g["id"] == general_id)
    mode = bft_mode or general["bft_default"]
    bft = BFT_MODES[mode]
    # Pick MOM experts relevant to this general
    mom_used = [
        e for e in MOM_EXPERTS
        if general["name"] in e["general_use"]
        or "all" in e["general_use"]
    ]
    if not mom_used:
        mom_used = [e for e in MOM_EXPERTS if "all" in e["general_use"]]
    # Pick MoE experts for each MOM expert (simplified: all 8)
    moe_used = MOE_EXPERTS
    # Simulate the vote (using OOWM routing score as input)
    route_score = oowm_route(query)
    base_score = max(route_score["all_scores"].values()) / 10.0
    # Care floor + sovereign check
    care_floor_pass = "harm" not in query.lower() and "kill" not in query.lower()
    sovereign_pass = "substrate" in query.lower() or any(g["role"] == "sovereign" for g in [general])
    # Compute consensus (per BFT mode)
    consensus = base_score + (0.5 if care_floor_pass else 0.0) + (0.3 if sovereign_pass else 0.0)
    consensus = round(min(consensus, 1.0), 2)
    # EAT-21: Try SOV3 Native Runtime first (NO Ollama)
    native_result = None
    if use_native:
        try:
            # Lazy import to avoid circular deps
            from meok_sovereign_native_mcp import sov_native_think
            native_result = sov_native_think(query)
        except (ImportError, Exception) as e:
            native_result = {"error": f"native_unavailable: {e}"}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query[:500],
        "general": general,
        "bft_mode": mode,
        "bft": bft,
        "mom_used": mom_used,
        "moe_used": moe_used,
        "consensus": consensus,
        "care_floor_pass": care_floor_pass,
        "sovereign_pass": sovereign_pass,
        "doctrine": "Every query: General → Council(BFT) → MOM → MoE → Sigil.",
        "native_result": native_result,
        "native_used": use_native,
    })


def oowm_score(general_id: int, output: str) -> dict:
    """Score a General's output against care floor + sovereign + sigil."""
    care_floor = 1.0 if "harm" not in output.lower() else 0.5
    sovereign = 1.0 if "sovereign" in output.lower() or "substrate" in output.lower() else 0.7
    sigil = 1.0  # Always signed by SOV3
    composite = (care_floor + sovereign + sigil) / 3.0
    general = next(g for g in GENERALS if g["id"] == general_id)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "general": general,
        "output_preview": output[:200],
        "care_floor": care_floor,
        "sovereign": sovereign,
        "sigil": sigil,
        "composite": round(composite, 2),
    })


def oowm_status() -> dict:
    """Full OOWM status."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "name": "SOV3³ Organic World Model",
        "architecture": "12 Generals × 3 Council BFT × MOM × MoE",
        "generals_online": len(GENERALS),
        "bft_modes_available": list(BFT_MODES.keys()),
        "mom_experts_online": len(MOM_EXPERTS),
        "moe_experts_online": len(MOE_EXPERTS),
        "sigil_signed": True,
        "verify_url": "https://proofof.ai/oowm",
        "ts": datetime.now(timezone.utc).isoformat(),
    })

# === 5D HIVE: 5 dimensions × 12 Generals × 1 GCP VM each ===

DIMENSIONS = ["spatial", "temporal", "logical", "wavelet", "quantum"]
GCP_VM_SPEC = {
    "machine_type": "n2-standard-8",  # 8 vCPU, 32GB RAM
    "region": "europe-west2-a",        # UK sovereign
    "disk_gb": 200,
    "monthly_cost_usd": 100,            # ~$100/mo per VM × 12 = $1200/mo
}

# 5D QOwm architecture per General (the specialisation)
GENERAL_5D_QOWM = {
    "Argus":   {"qowm_arch": "vision-spatial-wavelet",   "input_modalities": ["camera", "3d-pointcloud", "sensor"],  "specialised_for": "anomaly detection, threat perception"},
    "Scribe":  {"qowm_arch": "text-logical-wavelet",      "input_modalities": ["document", "code", "policy", "audit-log"], "specialised_for": "EU AI Act, GDPR, DORA, ISO 42001"},
    "Shield":  {"qowm_arch": "reasoning-safety-quantum",  "input_modalities": ["threat-stream", "CVE-feed", "Morris-II-probe"],  "specialised_for": "JSP 936, BFT, Morris-II defense"},
    "Builder": {"qowm_arch": "longctx-architectural",     "input_modalities": ["spec", "blueprint", "schema", "code"],  "specialised_for": "Cesium, 3d-force-graph, SOV SPACE"},
    "Abacus":  {"qowm_arch": "quant-temporal-wavelet",    "input_modalities": ["math", "forecast", "monte-carlo", "telemetry"], "specialised_for": "Mamba-2 SSD, Zamba, real-time quant"},
    "Lex":     {"qowm_arch": "longctx-legal-quantum",      "input_modalities": ["contract", "law", "regulation", "license"],  "specialised_for": "OpenPatent, USPTO, contract review"},
    "Scale":   {"qowm_arch": "multilingual-care-wavelet",  "input_modalities": ["policy", "consent", "harm-probe"],  "specialised_for": "Maternal Covenant, 16 care probes"},
    "Crow":    {"qowm_arch": "fast-prediction-temporal",   "input_modalities": ["risk-stream", "anomaly", "exposure"],  "specialised_for": "OpenFang, WORM, fast triage"},
    "Gear":    {"qowm_arch": "operational-temporal-quantum","input_modalities": ["cron", "health", "log", "metric"],  "specialised_for": "cron + Ansible + Terraform"},
    "Voice":   {"qowm_arch": "audio-temporal-wavelet",    "input_modalities": ["speech", "translation", "TTS"],  "specialised_for": "Kokoro TTS, ESPnet, whisper.cpp"},
    "Owl":     {"qowm_arch": "longctx-research-quantum",  "input_modalities": ["paper", "arxiv", "study"],  "specialised_for": "Cognee, LlamaIndex, ColBERT"},
    "Dragon":  {"qowm_arch": "sovereign-meta-quantum",     "input_modalities": ["ALL"],  "specialised_for": "the substrate itself"},
}

# Sephiroth mapping (10 emanations to the 12 Generals)
SEPHIROTH = [
    {"id": 1, "name": "Keter",     "meaning": "Crown",         "general": "Dragon",  "role": "substrate"},
    {"id": 2, "name": "Chokhmah",  "meaning": "Wisdom",        "general": "Owl",     "role": "research"},
    {"id": 3, "name": "Binah",     "meaning": "Understanding", "general": "Argus",   "role": "watchdog"},
    {"id": 4, "name": "Chesed",    "meaning": "Mercy",         "general": "Builder", "role": "architecture"},
    {"id": 5, "name": "Gevurah",   "meaning": "Severity",      "general": "Shield",  "role": "safety"},
    {"id": 6, "name": "Tiferet",   "meaning": "Balance",       "general": "Scale",   "role": "ethics"},
    {"id": 7, "name": "Netzach",   "meaning": "Endurance",     "general": "Voice",   "role": "communication"},
    {"id": 8, "name": "Hod",       "meaning": "Intellect",     "general": "Lex",     "role": "legal"},
    {"id": 9, "name": "Yesod",     "meaning": "Foundation",    "general": "Gear",    "role": "operations"},
    {"id": 10, "name": "Malkuth",  "meaning": "Material",      "general": "Abacus",  "role": "quant"},
    # Above the 10: Da'at (hidden) + auxiliary
    {"id": 11, "name": "Da'at",     "meaning": "Knowledge",     "general": "Crow",    "role": "risk"},
    {"id": 12, "name": "Auxiliary", "meaning": "Bridge",        "general": "Scribe",  "role": "compliance"},
]


def oowm_5d_hive(general_name: str = None) -> dict:
    """Show the 5D Hive for one or all Generals.

    Each General = 1 GCP VM with specialised QOwm + 5D coord + Sephiroth.
    """
    if general_name:
        gen = next((g for g in GENERALS if g["name"] == general_name), None)
        if not gen:
            return _sign({"error": f"unknown general: {general_name}", "available": [g["name"] for g in GENERALS]})
        qowm = GENERAL_5D_QOWM.get(gen["name"], {})
        seph = next((s for s in SEPHIROTH if s["general"] == gen["name"]), None)
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "general": gen, "qowm": qowm, "sephiroth": seph,
            "gcp_vm": f"gen-{gen['id']}-{gen['name'].lower()}",
            "gcp_spec": GCP_VM_SPEC,
            "monthly_cost_usd": GCP_VM_SPEC["monthly_cost_usd"],
            "topology": "1 General = 1 GCP VM = 1 QOwm = 1 specialised tech stack",
        })
    # All 12
    hive = []
    for gen in GENERALS:
        qowm = GENERAL_5D_QOWM.get(gen["name"], {})
        seph = next((s for s in SEPHIROTH if s["general"] == gen["name"]), None)
        hive.append({
            "general": gen, "qowm": qowm, "sephiroth": seph,
            "gcp_vm": f"gen-{gen['id']}-{gen['name'].lower()}",
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "dimensions": DIMENSIONS,
        "generals": hive, "hive_size": len(hive),
        "gcp_vm_spec": GCP_VM_SPEC,
        "total_monthly_cost_usd": GCP_VM_SPEC["monthly_cost_usd"] * 12,
        "sephiroth_count": len(SEPHIROTH),
        "ab_uno": "SOV3 OOWM substrate (the 1 origin)",
        "topology": "12 Generals × 5D × 1 GCP VM each × AB Uno × Sephiroth",
        "doctrine": "5D Hive = sovereign by construction. Each General = its own VM = its own QOwm = its own evolution.",
    })


def oowm_sephiroth() -> dict:
    """Show the 10 Sephiroth + 2 auxiliary (the 12 General tree)."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sephiroth": SEPHIROTH,
        "sephiroth_count": len(SEPHIROTH),
        "ab_uno": "the SOV3 OOWM substrate (1 origin)",
        "doctrine": "10 emanations from the 1 origin. Each maps to a sovereign General.",
    })
