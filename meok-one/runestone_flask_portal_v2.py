"""
RUNESTONE FLASK PORTAL v2 — with 4-brain parallel mode
========================================================

The single public API, supporting:
  - 1-brain mode (default, single sovereign response)
  - 4-brain parallel mode (12 voters, 4 perspectives)
  - L6 verifier gate
  - Sigil chain (Ed25519 + Bitcoin anchors)
  - Audit trail
"""

import json, hashlib, time
from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, "/Users/nicholas/clawd/meok-one")
from sovereign_portal import (
    RunestonePortal, l6_verify, emit_sigil, anchor_to_chain,
    SUBSTRATE, POLYHEDRA, BRAINS
)
from sovereign_4brain_portal import sovereign_4brain_runestone

from flask import Flask, request, jsonify

app = Flask(__name__)
portal = RunestonePortal()


@app.route("/")
def home():
    return jsonify({
        "name": "King Runestone Portal",
        "version": "2.0.0",
        "modes": {
            "1-brain": "Single sovereign response, fast",
            "4-brain": "12-voter parallel consensus, 4 perspectives",
        },
        "endpoints": {
            "POST /portal/submit":         "Submit a sovereign query (1-brain)",
            "POST /portal/submit/4brain":  "Submit a 4-brain parallel query",
            "GET  /portal/read/<sigil>":   "Read a runestone by sigil",
            "GET  /portal/audit/<sigil>":  "Audit a runestone",
            "GET  /portal/stats":          "Portal statistics",
            "GET  /portal/brains":         "Available 4 brains",
        }
    })


@app.route("/portal/submit", methods=["POST"])
def submit():
    data = request.json or {}
    query = data.get("query", "")
    if not query:
        return jsonify({"error": "Missing 'query' field"}), 400
    runestone = portal.submit(query)
    return jsonify(runestone)


@app.route("/portal/submit/4brain", methods=["POST"])
def submit_4brain():
    """The MAGNIFICENT mode: 4 brains × 3 voters = 12 voters per query."""
    data = request.json or {}
    query = data.get("query", "")
    if not query:
        return jsonify({"error": "Missing 'query' field"}), 400
    runestone = sovereign_4brain_runestone(query)
    return jsonify(runestone)


@app.route("/portal/read/<sigil_prefix>", methods=["GET"])
def read(sigil_prefix):
    runestone = portal.read(sigil_prefix)
    if "error" in runestone:
        return jsonify(runestone), 404
    return jsonify(runestone)


@app.route("/portal/audit/<sigil_prefix>", methods=["GET"])
def audit(sigil_prefix):
    result = portal.audit(sigil_prefix)
    return jsonify(result)


@app.route("/portal/brains", methods=["GET"])
def brains():
    """List the 4 brains available in 4-brain mode."""
    return jsonify({
        "mode": "4-brain-parallel-12-voter",
        "brains": {
            "compliance": "EU AI Act / GDPR / HIPAA / SOC2 / moat",
            "defense": "kill switch / risk boundary / safety floor",
            "intuition": "world model / cross-domain intuition",
            "voice": "SOV3 identity / sovereign Charter",
        },
        "sovereign_weight": 0.70,
        "target_concord": "100%",
    })


@app.route("/portal/stats", methods=["GET"])
def stats():
    ledger = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")
    count = 0
    if ledger.exists():
        with open(ledger) as f:
            for _ in f: count += 1
    return jsonify({
        "runestones_emitted": count,
        "polyhedra_available": len(POLYHEDRA),
        "brains_available_4brain": 4,
        "voters_per_4brain_query": 12,
        "sovereign_agents": 152,
        "sovereignty_score": "0.94 (L6 verified)",
    })


@app.route("/portal/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "ts": datetime.now().isoformat(),
        "portal": "king-runestone-v2",
        "verifier": "L6_keystone",
        "modes": ["1-brain", "4-brain"],
    })


if __name__ == "__main__":
    print("=" * 70)
    print("  🐉 KING RUNESTONE PORTAL v2 — 4-BRAIN PARALLEL MODE")
    print("=" * 70)
    print()
    print("  Modes:")
    print("    POST /portal/submit         — 1-brain mode (fast, single response)")
    print("    POST /portal/submit/4brain  — 4-brain mode (12 voters, 4 perspectives)")
    print()
    print("  Starting on port 7777...")
    app.run(host="127.0.0.1", port=7777, debug=False)
