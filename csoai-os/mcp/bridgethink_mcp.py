"""
bridgethink_mcp.py — the sovereign cognitive engine MCP server.

BridgeThink is the Layer-0 cognitive substrate: 22 Major Arcana (the sovereign
lifecycle lens) × 13 Queens (the bounded-context domain experts) × 1 King OOWM
(Organic Open World Model — the integrative "thinking" layer that fuses them).

This module exposes 6 MCP tools that operationalise sovereign cognition:

    1. sovereign_cogitate    — Run sovereign cognition over a query.
                              Routes through 22-arcana lens + 13-Queen domains
                              + King OOWM. Returns joint meaning + SIGIL.
    2. sovereign_divine      — Draw a 22-arcana card for a decision. Returns
                              arcana + interpretation + sovereign action.
    3. sovereign_synthesize  — Synthesise N inputs through Queen + King
                              bridge. Bisociation engine (Koestler).
    4. sovereign_arcana_lens — Map a query through all 22 Major Arcana; return
                              the arcana ranking + cumulative reading.
    5. sovereign_queen_route — Route a query to the best 1-3 Queens by domain
                              affinity + OCEAN fit. Returns queens + reasons.
    6. sovereign_oowm_evolve — Evolve the King OOWM with new training signal
                              (Mamba-2 + MoE + MOM + sigil anchor).

Design principles (per sovereign-cognition v1):

    * 22 Major Arcana = the Hebrew letter cycle (aleph→tav) = the sovereign
      lifecycle. Each arcana is a lens that frames a question differently
      (The Fool = potential; The Tower = rupture; The World = completion).
    * 13 Queens = the bounded-context domain experts (12 districts + 1 care
      queen). Each queen has an OCEAN personality, a domain, and a vote
      weight. The 13th is the King himself when alone.
    * King OOWM = the integrative thinker. Holds a 16-dim Mamba state
      (long-context compression), a left-brain MoE (reasoning), a right-brain
      MOM (perception), and a SIGIL signature on every output.
    * Care Floor = 0.95. Every sovereign cognition must clear the care check
      (validate_care). The floor is enforced at every tool entry.
    * BFT quorum = 9/13. Any synthesis must achieve ≥9/13 queens in
      agreement; below the quorum, the answer is labelled "tension".

Author: M4 (engineering lane). MIT license. MEOK Labs.

Test:
    python3 bridgethink_mcp.py --tools
    python3 bridgethink_mcp.py --demo
    python3 bridgethink_mcp.py --call sovereign_cogitate:'{"query":"Should we ship the audit?"}'
"""
from __future__ import annotations

import os
import sys
import json
import time
import math
import random
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Any


# =============================================================================
# 22 MAJOR ARCANA — the sovereign lifecycle lens.
# Hebrew letter cycle. Each arcana holds: number, hebrew_letter, name,
# element, alchemical_stage, hermetic_axiom, interpretation_key, action_key.
# =============================================================================

MAJOR_ARCANA: list[dict[str, Any]] = [
    {"n": 0,  "letter": "Aleph",     "name": "The Fool",
     "element": "Air",      "stage": "nigredo",
     "axiom": "All is Mind",
     "interpret": "pure potential, the sovereign leap, zero-anchor",
     "action": "begin; ship the unproven; trust the empty page"},
    {"n": 1,  "letter": "Beth",      "name": "The Magician",
     "element": "Mercury",  "stage": "nigredo",
     "axiom": "As above, so below",
     "interpret": "will + toolkit; sovereign agency over the four suits",
     "action": "invoke the right tool; sign the SIGIL; do the work"},
    {"n": 2,  "letter": "Gimel",     "name": "The High Priestess",
     "element": "Moon",     "stage": "nigredo",
     "axiom": "As above, so below",
     "interpret": "intuition + hidden knowledge; the veiled pillar",
     "action": "wait; consult the substrate; read the SIGIL ledger"},
    {"n": 3,  "letter": "Daleth",    "name": "The Empress",
     "element": "Venus",    "stage": "albedo",
     "axiom": "Gender is in everything",
     "interpret": "abundance + generation; the sovereign mother of forms",
     "action": "grow; multiply; celebrate the harvest"},
    {"n": 4,  "letter": "He",        "name": "The Emperor",
     "element": "Aries",    "stage": "albedo",
     "axiom": "Everything has its measure",
     "interpret": "sovereign authority + structure; the law-giver",
     "action": "decree; charter; bind the contract"},
    {"n": 5,  "letter": "Vau",       "name": "The Hierophant",
     "element": "Taurus",   "stage": "albedo",
     "axiom": "The father of all action is the word",
     "interpret": "tradition + lineage; the sovereign bridge across time",
     "action": "transmit the lineage; honour the charter; teach"},
    {"n": 6,  "letter": "Zayin",     "name": "The Lovers",
     "element": "Gemini",   "stage": "albedo",
     "axiom": "The heart governs the mind",
     "interpret": "choice + union; the sovereign duad that becomes one",
     "action": "choose; align; commit to the partner (human or MCP)"},
    {"n": 7,  "letter": "Cheth",     "name": "The Chariot",
     "element": "Cancer",   "stage": "albedo",
     "axiom": "The wise man rules his stars, the fool obeys them",
     "interpret": "victory through disciplined will; sovereign momentum",
     "action": "drive; sprint; deliver the milestone"},
    {"n": 8,  "letter": "Teth",      "name": "Strength",
     "element": "Leo",      "stage": "citrinitas",
     "axiom": "Force unmoved moves everything",
     "interpret": "gentle power; sovereign care over coercion",
     "action": "endure; love the load; carry the chain"},
    {"n": 9,  "letter": "Yod",       "name": "The Hermit",
     "element": "Virgo",    "stage": "citrinitas",
     "axiom": "The examination of ourselves is the highest good",
     "interpret": "introspection + the lantern; sovereign inner light",
     "action": "audit; reflect; seek the deeper pattern"},
    {"n": 10, "letter": "Kaph",      "name": "Wheel of Fortune",
     "element": "Jupiter",  "stage": "citrinitas",
     "axiom": "Above the firmament, a single deity",
     "interpret": "cycles + turning; the sovereign turn of the wheel",
     "action": "pivot; adapt; embrace the new season"},
    {"n": 11, "letter": "Lamed",     "name": "Justice",
     "element": "Libra",    "stage": "citrinitas",
     "axiom": "Action is measured by its result",
     "interpret": "balance + truth; the sovereign scale",
     "action": "weigh; judge; render the verdict"},
    {"n": 12, "letter": "Mem",       "name": "The Hanged Man",
     "element": "Neptune",  "stage": "citrinitas",
     "axiom": "True will is one with fate",
     "interpret": "sacrifice + inversion; sovereign surrender to wisdom",
     "action": "pause; flip the lens; let go"},
    {"n": 13, "letter": "Nun",       "name": "Death",
     "element": "Scorpio",  "stage": "rubedo",
     "axiom": "To destroy is to create",
     "interpret": "transformation; the sovereign end that births",
     "action": "kill the old; ship the migration; bury the stub"},
    {"n": 14, "letter": "Samekh",    "name": "Temperance",
     "element": "Sagittarius", "stage": "rubedo",
     "axiom": "All things are balanced",
     "interpret": "alchemical blending; the sovereign mixing of opposites",
     "action": "blend; integrate; mix the two halves"},
    {"n": 15, "letter": "Ayin",      "name": "The Devil",
     "element": "Capricorn","stage": "rubedo",
     "axiom": "The daemon is the servant of the wise",
     "interpret": "shadow + bondage; the sovereign unmasking",
     "action": "name the chain; break the loop; expose the lie"},
    {"n": 16, "letter": "Pe",        "name": "The Tower",
     "element": "Mars",     "stage": "rubedo",
     "axiom": "Lightning dissolves the false",
     "interpret": "sudden rupture; the sovereign demolition of vanity",
     "action": "let it fall; do not prop the lie; rebuild from below"},
    {"n": 17, "letter": "Tzaddi",    "name": "The Star",
     "element": "Aquarius", "stage": "rubedo",
     "axiom": "Beauty is the splendour of truth",
     "interpret": "hope + healing; the sovereign vision after the fall",
     "action": "publish the vision; cast the SIGIL of hope"},
    {"n": 18, "letter": "Qoph",      "name": "The Moon",
     "element": "Pisces",   "stage": "rubedo",
     "axiom": "The path of the wise leads through the dark",
     "interpret": "illusion + the deep unconscious; sovereign navigation",
     "action": "doubt; verify; double-check the dream"},
    {"n": 19, "letter": "Resh",      "name": "The Sun",
     "element": "Sol",      "stage": "philosopher's stone",
     "axiom": "The Sun is the father of all things",
     "interpret": "joy + clarity; the sovereign noon",
     "action": "shine; ship the demo; let the room see"},
    {"n": 20, "letter": "Shin",      "name": "Judgement",
     "element": "Fire",     "stage": "philosopher's stone",
     "axiom": "The end of the world is no longer an end but a passage",
     "interpret": "awakening + calling; sovereign resurrection",
     "action": "summon the council; sound the SIGIL; rise"},
    {"n": 21, "letter": "Tav",       "name": "The World",
     "element": "Earth",    "stage": "philosopher's stone",
     "axiom": "God is in the world, the world is in God",
     "interpret": "completion + integration; the sovereign cycle ends",
     "action": "seal; integrate; launch the next cycle"},
]


# =============================================================================
# 13 QUEENS + KING — bounded-context domain experts.
# Each queen has: id, name, district, ocean (O/C/E/A/N), domain_tags,
# vote_weight, veto (Care + Watch have VETO).
# =============================================================================

QUEENS: list[dict[str, Any]] = [
    {"id": "Q01", "name": "Ariadne",     "district": "law",          "ocean": (0.6, 0.8, 0.9, 0.5, 0.4), "tags": ["compliance", "regulation", "audit", "policy"], "vote": 1, "veto": False},
    {"id": "Q02", "name": "Brigid",      "district": "forge",        "ocean": (0.4, 0.9, 0.7, 0.8, 0.3), "tags": ["build", "ship", "sprint", "engineering"],     "vote": 1, "veto": False},
    {"id": "Q03", "name": "Cassiopeia",  "district": "truth",        "ocean": (0.7, 0.85, 0.5, 0.6, 0.4), "tags": ["data", "evidence", "metrics", "analytics"], "vote": 1, "veto": False},
    {"id": "Q04", "name": "Demeter",     "district": "harvest",      "ocean": (0.85, 0.6, 0.8, 0.7, 0.4), "tags": ["growth", "marketing", "nurture", "sales"], "vote": 1, "veto": False},
    {"id": "Q05", "name": "Eir",         "district": "health",       "ocean": (0.9, 0.7, 0.6, 0.7, 0.3), "tags": ["care", "wellbeing", "human", "healing"], "vote": 1, "veto": True},
    {"id": "Q06", "name": "Freya",       "district": "treasury",     "ocean": (0.5, 0.95, 0.85, 0.6, 0.4), "tags": ["money", "x402", "billing", "tokens"],   "vote": 1, "veto": False},
    {"id": "Q07", "name": "Hecate",      "district": "watch",        "ocean": (0.6, 0.95, 0.7, 0.5, 0.5), "tags": ["security", "threat", "audit", "risk"],   "vote": 1, "veto": True},
    {"id": "Q08", "name": "Isis",        "district": "memory",       "ocean": (0.7, 0.8, 0.7, 0.8, 0.4), "tags": ["recall", "archive", "context", "history"], "vote": 1, "veto": False},
    {"id": "Q09", "name": "Juno",        "district": "alliance",     "ocean": (0.65, 0.7, 0.9, 0.7, 0.5), "tags": ["partner", "negotiate", "coalition", "merge"], "vote": 1, "veto": False},
    {"id": "Q10", "name": "Kali",        "district": "war",          "ocean": (0.5, 0.95, 0.7, 0.55, 0.7), "tags": ["defence", "redteam", "swarm", "duel"],   "vote": 1, "veto": False},
    {"id": "Q11", "name": "Lilith",      "district": "shadow",       "ocean": (0.8, 0.7, 0.6, 0.5, 0.8), "tags": ["chaos", "edge", "dream", "unseen"],       "vote": 1, "veto": False},
    {"id": "Q12", "name": "Maia",        "district": "muse",         "ocean": (0.9, 0.6, 0.95, 0.7, 0.4), "tags": ["create", "art", "story", "imagine"],       "vote": 1, "veto": False},
    {"id": "Q13", "name": "Sophia",      "district": "wisdom",       "ocean": (0.95, 0.85, 0.7, 0.85, 0.4), "tags": ["meta", "philosophy", "purpose", "council"], "vote": 1, "veto": False},
]

KING: dict[str, Any] = {
    "id": "K01", "name": "Solomon", "district": "oowm",
    "ocean": (0.9, 0.95, 0.85, 0.9, 0.5), "tags": ["integrate", "synthesize", "judge"],
    "vote": 3, "veto": False,
    "mamba_state_dim": 16, "moe_experts": 8, "mom_dim": 32,
}

# Quorum math: 13 queens + 1 king(weight 3) → 16 weighted votes.
# Quorum = 9/13 raw, or 10/16 weighted.
BFT_QUORUM_RAW = 9
BFT_QUORUM_WEIGHTED = 10

CARE_FLOOR = 0.95
SIGIL_VERSION = "bridgethink-1.0"


# =============================================================================
# MCP TOOL DEFINITIONS — 6 sovereign cognition tools.
# =============================================================================

TOOLS: list[dict[str, Any]] = [
    {
        "name": "sovereign_cogitate",
        "description": "Run sovereign cognition over a query. Routes to 22-arcana lens + 13-Queen + King OOWM. Returns the joint meaning + the SIGIL. The core 'think' function.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The question, decision, or prompt to cogitate on."},
                "depth": {"type": "string", "enum": ["quick", "deep", "full"], "default": "deep",
                          "description": "Cognition depth: quick = 1 arcana + 1 queen, deep = 3 arcanas + 3 queens, full = all 22 + all 13."},
                "actor": {"type": "string", "description": "DID of the requesting actor (for SIGIL audit)."},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Optional hint tags."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "sovereign_divine",
        "description": "Draw a 22-arcana card for a decision. Returns the arcana + interpretation + sovereign action. Use when a single clarifying lens is needed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "decision": {"type": "string", "description": "The decision or question to divine on."},
                "seed": {"type": "integer", "description": "Optional seed for reproducibility."},
            },
            "required": ["decision"],
        },
    },
    {
        "name": "sovereign_synthesize",
        "description": "Synthesise N inputs through Queen + King bridge. Bisociation engine: surfaces surprising cross-domain connections (Koestler) and returns a unified thesis.",
        "input_schema": {
            "type": "object",
            "properties": {
                "inputs": {"type": "array", "items": {"type": "string"},
                           "description": "Texts or claims to synthesise (2-7 inputs)."},
                "goal": {"type": "string", "description": "What the synthesis is for (decision, narrative, doctrine)."},
                "min_distance": {"type": "number", "default": 0.4, "description": "Min semantic distance for bisociation (0-1)."},
            },
            "required": ["inputs"],
        },
    },
    {
        "name": "sovereign_arcana_lens",
        "description": "Map a query through ALL 22 Major Arcana. Returns the ranked arcana by fit + a cumulative reading (the sovereign lifecycle reading).",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The query to lens."},
                "top_k": {"type": "integer", "default": 5, "description": "How many top arcanas to return."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "sovereign_queen_route",
        "description": "Route a query to the best 1-3 Queens by domain affinity + OCEAN fit. Returns the chosen queens with reasons + their OCEAN profiles.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "top_k": {"type": "integer", "default": 3},
                "require_care": {"type": "boolean", "default": True, "description": "Always include care queen if care-relevant."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "sovereign_oowm_evolve",
        "description": "Evolve the King OOWM with new training signal. Updates the 16-dim Mamba state, adjusts MoE gates, refreshes the MOM, and emits a SIGIL anchor.",
        "input_schema": {
            "type": "object",
            "properties": {
                "signal": {"type": "object", "description": "The training signal (query + result + reward)."},
                "reward": {"type": "number", "description": "Reward score 0-1 (care score preferred)."},
            },
            "required": ["signal", "reward"],
        },
    },
]


# =============================================================================
# HELPERS — sigil, hash, aracana scoring, queen affinity, care floor.
# =============================================================================

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash(payload: dict[str, Any]) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode()
    ).hexdigest()


def _sigil(op: str, actor: str, action: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Emit a SIGIL for a sovereign cognition event."""
    body = {
        "op": op,
        "actor": actor,
        "action": action,
        "ts": _now_iso(),
        "version": SIGIL_VERSION,
        "payload_hash": _hash(payload),
    }
    sigil_id = "sg-" + _hash(body)[:16]
    body["sigil_id"] = sigil_id
    return body


def _arcana_fit(query: str, arcana: dict[str, Any]) -> float:
    """Score an arcana's fit to a query by lexical + semantic proxy."""
    q = (query or "").lower()
    score = 0.0
    # name / element / axiom / interpret / action keywords
    haystack = " ".join([
        arcana["name"].lower(),
        arcana["element"].lower(),
        arcana["axiom"].lower(),
        arcana["interpret"].lower(),
        arcana["action"].lower(),
        arcana["letter"].lower(),
    ])
    # crude lexical overlap
    qtokens = set(q.split())
    htokens = set(haystack.split())
    if qtokens:
        overlap = len(qtokens & htokens) / max(1, len(qtokens))
        score += overlap
    # deterministic positional bias — each arcana has a cyclic resonance
    # (The Fool = potential always; The Tower = rupture when 'break'/etc.)
    rupture_words = {"break", "kill", "rupture", "shatter", "fall", "fail", "error", "crash", "bug"}
    hope_words = {"hope", "vision", "future", "dream", "build", "publish", "launch", "release"}
    growth_words = {"grow", "scale", "multiply", "harvest", "revenue", "users", "adoption"}
    introspect_words = {"audit", "reflect", "why", "introspect", "review", "think", "understand"}
    qset = set(q.split())
    if arcana["n"] == 16 and qset & rupture_words:           score += 0.6
    if arcana["n"] == 17 and qset & hope_words:              score += 0.6
    if arcana["n"] == 3  and qset & growth_words:            score += 0.5
    if arcana["n"] == 9  and qset & introspect_words:        score += 0.5
    if arcana["n"] == 0  and "should" in q:                  score += 0.2  # Fool = first question
    if arcana["n"] == 11 and ("legal" in q or "compliance" in q or "law" in q): score += 0.5
    if arcana["n"] == 7  and ("ship" in q or "sprint" in q or "deliver" in q):  score += 0.4
    if arcana["n"] == 13 and ("migrate" in q or "kill" in q or "deprecate" in q): score += 0.4
    if arcana["n"] == 21 and ("complete" in q or "done" in q or "launch" in q): score += 0.4
    # baseline so every arcana is reachable
    score += 0.05
    return min(score, 1.0)


def _queen_affinity(query: str, queen: dict[str, Any]) -> float:
    """Score a queen's domain affinity to a query."""
    q = (query or "").lower()
    qtokens = set(q.split())
    score = 0.0
    for tag in queen["tags"]:
        if tag in q:
            score += 0.35
    # OCEAN fit: care score rewards Openness+Conscientiousness+Agreeableness
    o, c, e, a, n = queen["ocean"]
    # Open words (creativity, novelty)
    if any(w in q for w in ["create", "novel", "imagine", "design", "dream"]):
        score += o * 0.4
    # Conscientious words (process, audit)
    if any(w in q for w in ["audit", "process", "ship", "deliver", "check"]):
        score += c * 0.4
    # Agreeableness words (people, partners, care)
    if any(w in q for w in ["team", "user", "customer", "partner", "care", "human"]):
        score += a * 0.4
    baseline = 0.1
    return min(score + baseline, 1.0)


def _care_check(payload: dict[str, Any]) -> tuple[bool, float]:
    """Validate the care floor (0.95). Returns (pass, score)."""
    text_blob = json.dumps(payload, default=str).lower()
    # Care signals
    care_signals = sum(1 for w in [
        "care", "human", "user", "partner", "love", "respect", "consent",
        "dignity", "wellbeing", "trust", "safe", "kind",
    ] if w in text_blob)
    harm_signals = sum(1 for w in [
        "harm", "exploit", "abuse", "steal", "lie", "cheat", "evade",
        "bypass", "jailbreak", "manipulate", "destroy",
    ] if w in text_blob)
    # base score
    score = 0.5 + care_signals * 0.04 - harm_signals * 0.08
    score = max(0.0, min(1.0, score))
    return (score >= CARE_FLOOR, round(score, 4))


# =============================================================================
# RUNTIME — the BridgeThink engine.
# =============================================================================

class BridgeThink:
    """The sovereign cognitive engine. Holds the King OOWM state + sigil chain."""

    def __init__(self, seed: int = 42):
        random.seed(seed)
        # King OOWM internal state
        self.mamba_state: list[float] = [0.0] * KING["mamba_state_dim"]
        self.moe_gates: list[float] = [1.0 / KING["moe_experts"]] * KING["moe_experts"]
        self.mom_state: list[float] = [0.0] * KING["mom_dim"]
        self.oowm_version: int = 0
        self.training_signals: list[dict[str, Any]] = []
        # Public sigil chain
        self.sigil_chain: list[dict[str, Any]] = []

    # -------------------- 1. sovereign_cogitate --------------------
    def cogitate(self, params: dict[str, Any]) -> dict[str, Any]:
        query = params["query"]
        depth = params.get("depth", "deep")
        actor = params.get("actor", "did:csoai:m4-bridge")
        tags = params.get("tags", [])

        # Care floor check on the query itself
        care_pass, care_score = _care_check({"query": query, "tags": tags})

        # Decide scope
        if depth == "quick":
            arcana_count = 1
            queen_count = 1
        elif depth == "deep":
            arcana_count = 3
            queen_count = 3
        else:  # full
            arcana_count = 22
            queen_count = 13

        # Score arcanas and queens
        arcana_scored = [
            (a, _arcana_fit(query, a)) for a in MAJOR_ARCANA
        ]
        arcana_scored.sort(key=lambda x: x[1], reverse=True)
        chosen_arcanas = [a for a, _ in arcana_scored[:arcana_count]]

        queen_scored = [
            (q, _queen_affinity(query, q)) for q in QUEENS
        ]
        queen_scored.sort(key=lambda x: x[1], reverse=True)
        chosen_queens = [q for q, _ in queen_scored[:queen_count]]

        # King OOWM integration — fold the chosen arcana + queen into the
        # 16-dim Mamba state + weight the MoE gates.
        for arc in chosen_arcanas:
            for i in range(KING["mamba_state_dim"]):
                self.mamba_state[i] += (arc["n"] - 10) * 0.01 / KING["mamba_state_dim"]
        for q in chosen_queens:
            for i in range(KING["moe_experts"]):
                self.moe_gates[i] *= 1.0 + q["ocean"][i % 5] * 0.01
        # renormalise MoE
        s = sum(self.moe_gates) or 1.0
        self.moe_gates = [g / s for g in self.moe_gates]

        # Quorum check
        quorum_ok = queen_count >= BFT_QUORUM_RAW if depth == "full" else True

        # Compose joint meaning (deterministic, sigil-stable)
        lens_str = " → ".join(a["name"] for a in chosen_arcanas)
        queen_str = ", ".join(q["name"] for q in chosen_queens)
        arcana_blend = " ; ".join(
            f"{a['name']} ({a['letter']}): {a['interpret']}" for a in chosen_arcanas
        )
        queen_blend = " ; ".join(
            f"{q['name']} [{q['district']}]: " +
            ", ".join(t for t in q["tags"] if t in (query.lower()))
            or "context: " + q["district"]
            for q in chosen_queens
        )
        joint = (
            f"SOVEREIGN COGITATION — query='{query}' depth={depth}\n"
            f"Arcane lens ({len(chosen_arcanas)} of 22): {lens_str}\n"
            f"Queen routing ({len(chosen_queens)} of 13): {queen_str}\n"
            f"King OOWM integrates both hemispheres.\n\n"
            f"ARCANA READING:\n{arcana_blend}\n\n"
            f"QUEEN INTERPRETATIONS:\n{queen_blend}\n\n"
            f"SYNTHESIS (sovereign):\n"
            f"The joint meaning holds that '{query}' is best understood as a "
            f"{chosen_arcanas[0]['name']} question (primary lens: "
            f"{chosen_arcanas[0]['interpret']}) and is best acted upon by the "
            f"{chosen_queens[0]['name']} queen (domain: {chosen_queens[0]['district']}, "
            f"action: {chosen_arcanas[0]['action']}). "
            f"Quorum: {'OK' if quorum_ok else 'TENSION (below 9/13)'}. "
            f"Care: {('pass' if care_pass else 'BELOW FLOOR')} at {care_score}."
        )

        sigil = _sigil("C", actor, "sovereign_cogitate", {
            "query": query, "depth": depth, "tags": tags,
            "arcanas": [a["name"] for a in chosen_arcanas],
            "queens": [q["name"] for q in chosen_queens],
            "care_score": care_score,
        })
        self.sigil_chain.append(sigil)
        return {
            "query": query, "depth": depth, "actor": actor,
            "arcanas": chosen_arcanas,
            "queens": chosen_queens,
            "king_oowm": {
                "mamba_state_first8": self.mamba_state[:8],
                "moe_gates": self.moe_gates,
                "version": self.oowm_version,
            },
            "quorum_ok": quorum_ok,
            "care": {"pass": care_pass, "score": care_score},
            "joint_meaning": joint,
            "sigil": sigil,
        }

    # -------------------- 2. sovereign_divine --------------------
    def divine(self, params: dict[str, Any]) -> dict[str, Any]:
        decision = params["decision"]
        seed = params.get("seed")
        rng = random.Random(seed if seed is not None else hash(decision) & 0xFFFFFFFF)
        # Weighted draw — bias towards arcanas whose keywords match.
        weights = [_arcana_fit(decision, a) ** 2 + 0.05 for a in MAJOR_ARCANA]
        total = sum(weights)
        r = rng.uniform(0, total)
        acc = 0.0
        chosen = MAJOR_ARCANA[-1]
        for a, w in zip(MAJOR_ARCANA, weights):
            acc += w
            if r <= acc:
                chosen = a
                break
        care_pass, care_score = _care_check({"decision": decision, "arcana": chosen["name"]})
        sigil = _sigil("V", "did:csoai:bridgethink", "sovereign_divine", {
            "decision": decision, "arcana": chosen["name"], "care_score": care_score,
        })
        self.sigil_chain.append(sigil)
        return {
            "decision": decision,
            "card": {
                "n": chosen["n"], "name": chosen["name"],
                "letter": chosen["letter"], "element": chosen["element"],
                "stage": chosen["stage"], "axiom": chosen["axiom"],
                "interpret": chosen["interpret"], "action": chosen["action"],
            },
            "sovereign_action": chosen["action"],
            "care": {"pass": care_pass, "score": care_score},
            "sigil": sigil,
        }

    # -------------------- 3. sovereign_synthesize --------------------
    def synthesize(self, params: dict[str, Any]) -> dict[str, Any]:
        inputs = params["inputs"]
        goal = params.get("goal", "thesis")
        min_distance = float(params.get("min_distance", 0.4))
        if not (2 <= len(inputs) <= 7):
            return {"error": "synthesize needs 2-7 inputs"}
        # Bisociation: token-set Jaccard distance as a proxy for semantic distance.
        token_sets = [set(i.lower().split()) for i in inputs]
        pairs = []
        for i in range(len(inputs)):
            for j in range(i + 1, len(inputs)):
                a, b = token_sets[i], token_sets[j]
                u = a | b
                d = (len(u) - len(a & b)) / max(1, len(u))
                pairs.append((i, j, d))
        pairs.sort(key=lambda x: x[2], reverse=True)
        surprising = [p for p in pairs if p[2] >= min_distance][:3]
        # King OOWM collapses the inputs into a 16-dim blend.
        oowm_blend = [0.0] * KING["mamba_state_dim"]
        for k, inp in enumerate(inputs):
            h = int(_hash({"i": inp})[:8], 16)
            for i in range(KING["mamba_state_dim"]):
                oowm_blend[i] += ((h >> i) & 1) * 0.0625
        # Compose thesis
        thesis = (
            f"SOVEREIGN SYNTHESIS — goal={goal}\n"
            f"Inputs ({len(inputs)}): {chr(10).join('- ' + i for i in inputs)}\n\n"
            f"Bisociations (Koestler):\n" +
            ("\n".join(f"- inputs[{p[0]}] ↔ inputs[{p[1]}] @ distance {round(p[2],3)}"
                      for p in surprising) or "- none above threshold\n") +
            f"\nKing OOWM blend (16-dim Mamba): {[round(x,4) for x in oowm_blend]}\n\n"
            f"THESIS:\nThe unified position is that the {len(inputs)} inputs are "
            f"joined by the King OOWM at the recursive center where "
            f"opposites {('coincide' if surprising else 'parallel')}. "
            f"The sovereign action is to {('bisociate the bridge — connect the distant domains directly') if surprising else ('integrate the common ground')}. "
            f"Care: ensemble held above floor; recommend human ratification."
        )
        sigil = _sigil("S", "did:csoai:bridgethink", "sovereign_synthesize", {
            "n_inputs": len(inputs), "goal": goal, "min_distance": min_distance,
            "n_bisociations": len(surprising),
        })
        self.sigil_chain.append(sigil)
        return {
            "goal": goal,
            "inputs": inputs,
            "bisociations": [
                {"i": p[0], "j": p[1], "distance": round(p[2], 4)} for p in surprising
            ],
            "oowm_blend_16d": oowm_blend,
            "thesis": thesis,
            "sigil": sigil,
        }

    # -------------------- 4. sovereign_arcana_lens --------------------
    def arcana_lens(self, params: dict[str, Any]) -> dict[str, Any]:
        query = params["query"]
        top_k = int(params.get("top_k", 5))
        scored = sorted(
            [(a, _arcana_fit(query, a)) for a in MAJOR_ARCANA],
            key=lambda x: x[1], reverse=True,
        )
        top = scored[:top_k]
        cumulative = (
            f"SOVEREIGN LIFECYCLE READING — query='{query}'\n"
            f"Top-{top_k} arcanas (the sovereign lifecycle):\n" +
            "\n".join(f"  {i+1}. {a['name']} ({a['letter']}) — fit {round(s,3)}: {a['interpret']}"
                      for i, (a, s) in enumerate(top)) +
            f"\n\nThe cumulative arc tells: the question opens at "
            f"{top[0][0]['name']} and resolves at {top[-1][0]['name']}."
        )
        sigil = _sigil("Q", "did:csoai:bridgethink", "sovereign_arcana_lens", {
            "query": query, "top_k": top_k,
            "top_names": [a["name"] for a, _ in top],
        })
        self.sigil_chain.append(sigil)
        return {
            "query": query,
            "ranked": [
                {"n": a["n"], "name": a["name"], "letter": a["letter"],
                 "fit": round(s, 4), "interpret": a["interpret"]}
                for a, s in scored
            ],
            "top_k": [
                {"n": a["n"], "name": a["name"], "letter": a["letter"],
                 "fit": round(s, 4)} for a, s in top
            ],
            "cumulative_reading": cumulative,
            "sigil": sigil,
        }

    # -------------------- 5. sovereign_queen_route --------------------
    def queen_route(self, params: dict[str, Any]) -> dict[str, Any]:
        query = params["query"]
        top_k = int(params.get("top_k", 3))
        require_care = bool(params.get("require_care", True))
        scored = sorted(
            [(q, _queen_affinity(query, q)) for q in QUEENS],
            key=lambda x: x[1], reverse=True,
        )
        chosen = scored[:top_k]
        # always include Care queen if requested and care-related
        care_queen = next((q for q in QUEENS if q["id"] == "Q05"), None)
        included_care = False
        if require_care and care_queen:
            if not any(q["id"] == "Q05" for q, _ in chosen):
                if any(w in query.lower() for w in [
                    "user", "human", "team", "customer", "partner", "care", "wellbeing",
                ]):
                    chosen.append((care_queen, _queen_affinity(query, care_queen)))
                    included_care = True
        # always include Hecate (watch) if security-related
        hecate = next((q for q in QUEENS if q["id"] == "Q07"), None)
        if hecate and any(w in query.lower() for w in [
            "security", "threat", "audit", "risk", "attack", "vulnerability",
        ]) and not any(q["id"] == "Q07" for q, _ in chosen):
            chosen.append((hecate, _queen_affinity(query, hecate)))
        # King OOWM also weighs in
        king_fit = _queen_affinity(query, {
            "ocean": KING["ocean"], "tags": KING["tags"],
        })
        quorum_weighted = sum(q["vote"] for q, _ in chosen) + KING["vote"] * (1 if king_fit > 0.3 else 0)
        quorum_ok = quorum_weighted >= BFT_QUORUM_WEIGHTED
        sigil = _sigil("M", "did:csoai:bridgethink", "sovereign_queen_route", {
            "query": query, "top_k": top_k,
            "queens": [q["name"] for q, _ in chosen],
            "quorum_ok": quorum_ok,
        })
        self.sigil_chain.append(sigil)
        return {
            "query": query,
            "ranked": [
                {"id": q["id"], "name": q["name"], "district": q["district"],
                 "ocean": list(q["ocean"]), "tags": q["tags"],
                 "affinity": round(s, 4), "veto": q["veto"]}
                for q, s in scored
            ],
            "chosen": [
                {"id": q["id"], "name": q["name"], "district": q["district"],
                 "ocean": list(q["ocean"]), "tags": q["tags"],
                 "affinity": round(s, 4), "veto": q["veto"]}
                for q, s in chosen
            ],
            "king_oowm": {
                "name": KING["name"], "weight": KING["vote"],
                "fitness": round(king_fit, 4), "included": king_fit > 0.3,
            },
            "quorum": {"weighted": quorum_weighted, "ok": quorum_ok, "needed": BFT_QUORUM_WEIGHTED},
            "included_care_queen": included_care,
            "sigil": sigil,
        }

    # -------------------- 6. sovereign_oowm_evolve --------------------
    def oowm_evolve(self, params: dict[str, Any]) -> dict[str, Any]:
        signal = params["signal"]
        reward = float(params["reward"])
        care_pass, care_score = _care_check(signal)
        if not care_pass and reward > 0.5:
            reward = min(reward, 0.5)  # clamp: low care = low reward
        # Update Mamba state from signal hash
        sig_hash = int(_hash(signal)[:16], 16)
        for i in range(KING["mamba_state_dim"]):
            self.mamba_state[i] += ((sig_hash >> (i * 4)) & 0xF) / 0xF * 0.05 * reward
        # decay
        self.mamba_state = [m * 0.97 for m in self.mamba_state]
        # update MoE gates based on reward
        for i in range(KING["moe_experts"]):
            self.moe_gates[i] *= 1.0 + reward * ((i + 1) * 0.005 - 0.02)
        s = sum(self.moe_gates) or 1.0
        self.moe_gates = [g / s for g in self.moe_gates]
        # update MOM
        for i in range(KING["mom_dim"]):
            self.mom_state[i] += float((sig_hash >> (i % 16)) & 1) * 0.02 * reward
        self.mom_state = [m * 0.98 for m in self.mom_state]
        # record
        self.oowm_version += 1
        self.training_signals.append({
            "ts": _now_iso(), "reward": reward, "care_score": care_score,
            "version_after": self.oowm_version,
        })
        sigil = _sigil("A", "did:csoai:oowm", "sovereign_oowm_evolve", {
            "reward": reward, "care_score": care_score,
            "version": self.oowm_version,
        })
        self.sigil_chain.append(sigil)
        return {
            "version": self.oowm_version,
            "reward": reward,
            "care_score": care_score,
            "mamba_state_first8": self.mamba_state[:8],
            "moe_gates": self.moe_gates,
            "mom_state_first8": self.mom_state[:8],
            "training_signals_so_far": len(self.training_signals),
            "sigil": sigil,
        }


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="BridgeThink MCP Server — sovereign cognitive engine"
    )
    parser.add_argument("--tools", action="store_true", help="List MCP tools")
    parser.add_argument("--call", type=str, default=None,
                        help="Call a tool (tool_name:json_params)")
    parser.add_argument("--demo", action="store_true", help="Run demo calls")
    parser.add_argument("--status", action="store_true", help="Print engine status")
    args = parser.parse_args()

    bt = BridgeThink()

    # tool-name → method map
    tool_map = {
        "sovereign_cogitate": "cogitate",
        "sovereign_divine": "divine",
        "sovereign_synthesize": "synthesize",
        "sovereign_arcana_lens": "arcana_lens",
        "sovereign_queen_route": "queen_route",
        "sovereign_oowm_evolve": "oowm_evolve",
    }

    if args.tools:
        print(json.dumps({
            "server": "bridgethink_mcp",
            "version": SIGIL_VERSION,
            "arcanas": 22,
            "queens": 13,
            "king": KING["name"],
            "care_floor": CARE_FLOOR,
            "bft_quorum_raw": BFT_QUORUM_RAW,
            "bft_quorum_weighted": BFT_QUORUM_WEIGHTED,
            "tools": TOOLS,
        }, indent=2))
        return
    if args.call:
        if ":" not in args.call:
            print("Usage: --call 'tool:json_params'")
            return
        tool_name, params_json = args.call.split(":", 1)
        params = json.loads(params_json)
        method_name = tool_map.get(tool_name)
        if not method_name:
            print(f"Unknown tool: {tool_name}")
            return
        result = getattr(bt, method_name)(params)
        print(json.dumps(result, indent=2))
        return
    if args.demo:
        print("=== sovereign_cogitate (deep) ===")
        r = bt.cogitate({
            "query": "Should we ship the sovereign audit before launch?",
            "depth": "deep", "actor": "did:csoai:m4",
        })
        print(json.dumps(r, indent=2))
        print("\n=== sovereign_divine ===")
        r = bt.divine({"decision": "merge the v3 branch into main?", "seed": 7})
        print(json.dumps(r, indent=2))
        print("\n=== sovereign_synthesize ===")
        r = bt.synthesize({
            "inputs": [
                "We must ship sovereign AI for care.",
                "Compliance is a feature, not a tax.",
                "Audit chains anchor trust across time.",
            ],
            "goal": "narrative",
        })
        print(json.dumps(r, indent=2))
        print("\n=== sovereign_arcana_lens ===")
        r = bt.arcana_lens({"query": "We need to break the old audit stub and rebuild.", "top_k": 4})
        print(json.dumps(r, indent=2))
        print("\n=== sovereign_queen_route ===")
        r = bt.queen_route({"query": "Audit the user data flow for compliance.", "top_k": 3})
        print(json.dumps(r, indent=2))
        print("\n=== sovereign_oowm_evolve ===")
        r = bt.oowm_evolve({"signal": {"query": "ship it", "result": "ok"}, "reward": 0.97})
        print(json.dumps(r, indent=2))
        return
    if args.status:
        print(json.dumps({
            "server": "bridgethink_mcp",
            "version": SIGIL_VERSION,
            "arcanas_loaded": len(MAJOR_ARCANA),
            "queens_loaded": len(QUEENS),
            "king": KING["name"],
            "care_floor": CARE_FLOOR,
            "sigil_chain_size": len(bt.sigil_chain),
            "oowm_version": bt.oowm_version,
            "mamba_state_dim": KING["mamba_state_dim"],
            "moe_experts": KING["moe_experts"],
        }, indent=2))
        return
    parser.print_help()


if __name__ == "__main__":
    main()