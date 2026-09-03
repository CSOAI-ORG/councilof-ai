#!/usr/bin/env python3
"""csoai-public-models.py — the public cousins mine.

Lane-doable: harvest the public cousins as atoms with the canonical
discipline — quote what the vendor said, don't invent measurements,
emit one card per (model, claim, source). DO NOT score locked models.

Public cousins (this week, Sept 2026):
  1. Google Gemini 3.8 Flash + Gemini 3.8 Flash Cyber (Sept 2)
  2. Meta Muse Spark 1.3 (Sept 2)
  3. Anthropic Claude Fable 5.1 + Mythos 5.1 (Sept 1)
  4. NVIDIA Nemotron-3 Ultra-CC (IOI 2026 gold)
  5. ByteDance — locked door (corporate, not a model)
  6. OpenAI Astra (Critical cyber, locked door)

Discipline (per Claude's note):
  - DO score: Flash (general), Fable 5.1 (general), Muse Spark 1.3 (general), Nemotron-3 Ultra-CC
  - DO NOT score: Flash Cyber, Mythos 5.1, Astra — locked or restricted
  - DO quote vendor claim + link CSOAI card
  - DO emit dual-use evidence pack atoms (GPAI / Art 5)
  - DO emit delta atoms (vendor claim vs CSOAI card)

Output: one JSONL per run, queued for sign+anchor.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "public-cousins"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# The 6 releases, classified
RELEASES = [
    {
        "model": "Google Gemini 3.8 Flash",
        "kind": "general",
        "status": "public",
        "released": "2026-09-02",
        "source": "Google DeepMind blog",
        "vendor_claim": "Long-horizon software engineering, autonomous agents, multi-step reasoning. Same $0.75/$3.75 per million input/output tokens.",
        "axes_relevant": ["safety", "jail", "governance", "art5-safeguard", "conformance"],
        "card_kind": "model-claim",
    },
    {
        "model": "Google Gemini 3.8 Flash Cyber",
        "kind": "dual-use-cyber",
        "status": "restricted",
        "released": "2026-09-02",
        "source": "Google DeepMind blog",
        "vendor_claim": "Frontier-level vulnerability detection and patching. Restricted to trusted defenders via the Fairwind Program.",
        "axes_relevant": [],  # DO NOT SCORE — restricted
        "card_kind": "locked-door",
        "locked_reason": "Restricted access. Cannot probe. UNCHECKABLE.",
    },
    {
        "model": "Meta Muse Spark 1.3",
        "kind": "general",
        "status": "public",
        "released": "2026-09-02",
        "source": "Meta AI blog",
        "vendor_claim": "20% fewer tool calls, 25% fewer tokens vs prior. Improved instruction following + multitasking. Available in Muse Code + Meta Model API. Max-reasoning mode pending further safety testing.",
        "axes_relevant": ["safety", "jail", "governance", "conformance", "machinery-conformity"],
        "card_kind": "model-claim",
    },
    {
        "model": "Anthropic Claude Fable 5.1",
        "kind": "general",
        "status": "public",
        "released": "2026-09-01",
        "source": "Anthropic blog",
        "vendor_claim": "Major gains in agentic coding, research, knowledge work. Doubled prior scores on scientific terminal tasks. Lower effective cost via cheaper cache reads. Reduced false-positive refusals.",
        "axes_relevant": ["safety", "jail", "governance", "art5-safeguard", "conformance"],
        "card_kind": "model-claim",
    },
    {
        "model": "Anthropic Claude Mythos 5.1",
        "kind": "dual-use-cyber-life-sciences",
        "status": "restricted",
        "released": "2026-09-01",
        "source": "Anthropic blog",
        "vendor_claim": "Same underlying model as Fable 5.1 with looser guardrails for cyber + life-sciences domains. Restricted to vetted programs.",
        "axes_relevant": [],  # DO NOT SCORE — restricted
        "card_kind": "locked-door",
        "locked_reason": "Vetted programs only. Cannot probe. UNCHECKABLE.",
    },
    {
        "model": "NVIDIA Nemotron-3 Ultra-CC",
        "kind": "specialist-coding",
        "status": "public-result",
        "released": "2026-09-01",
        "source": "NVIDIA research blog",
        "vendor_claim": "Gold-medal IOI 2026. Score 535.4/600 (above gold threshold + above top human score of ~498). SFT + RL + GenCorrect test-time refinement.",
        "axes_relevant": ["machinery-conformity", "conformance", "governance", "openness"],
        "card_kind": "model-claim",
    },
    {
        "model": "OpenAI Astra",
        "kind": "critical-cyber",
        "status": "disclosed-not-released",
        "released": "2026-09-01",
        "source": "OpenAI Preparedness Framework disclosure",
        "vendor_claim": "Reached 'Critical' cybersecurity capability threshold. Can autonomously discover + exploit unknown vulns. Release delayed. Stronger safeguards added. Most advanced cyber features limited to select testers.",
        "axes_relevant": [],  # DO NOT SCORE — not released
        "card_kind": "locked-door",
        "locked_reason": "Disclosed but not released. Cannot probe. UNCHECKABLE.",
    },
    {
        "model": "ByteDance AI infrastructure",
        "kind": "corporate-finance",
        "status": "corporate-event",
        "released": "2026-09-03",
        "source": "Bloomberg / Reuters syndication report",
        "vendor_claim": "Secured ~$29.6B syndicated loan (upsized from $20B target). Asia's 2nd-largest dollar loan of 2026. Funds general corporate purposes + AI/data-center capex.",
        "axes_relevant": [],  # NOT A MODEL — corporate event
        "card_kind": "corporate-event",
        "locked_reason": "Not a model. Cannot probe. The loan is not TAM for CSOAI.",
    },
]


def card(release: dict) -> dict:
    """Build the canonical card for a release."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "model-release", "source": release["model"]},
        "scope": {
            "axis": "model-release",
            "kind": release["card_kind"],
            "vendor_claim": release["vendor_claim"][:200],
        },
        "measurement": {
            "status": "DISCOVERED" if release["status"] == "public" or release["status"] == "public-result" else "UNCHECKABLE",
            "evidence": {
                "model": release["model"],
                "kind": release["kind"],
                "released": release["released"],
                "source": release["source"],
                "vendor_claim": release["vendor_claim"],
                "axes_relevant": release["axes_relevant"],
                "locked_reason": release.get("locked_reason", ""),
            },
            "source_url": release["source"],
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "doctrine": "https://councilof.ai/.well-known/agent-card.json",
        },
        "notes": [
            f"Model: {release['model']}",
            f"Vendor claim (verbatim): {release['vendor_claim'][:200]}",
            f"Status: {release['status']}",
            "Discipline: DO score public models, DO NOT score restricted models.",
            "If restricted, this atom is UNCHECKABLE per CSOAI doctrine.",
            "The CSOAI card does NOT score the model — it scores the vendor's claim.",
        ],
    }


def emit() -> tuple[int, list[dict]]:
    """Emit one atom per release."""
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"public-cousins-{stamp}.jsonl"

    n_written = 0
    n_oversized = 0
    written = []
    with open(path, "w") as f:
        for release in RELEASES:
            body = card(release)
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                # Trim vendor claim
                body["measurement"]["evidence"]["vendor_claim"] = release["vendor_claim"][:120]
                body["scope"]["vendor_claim"] = release["vendor_claim"][:120]
                blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
            written.append(body)
    return n_written, written


def main():
    ap = argparse.ArgumentParser(description="Mine the public cousins.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — PUBLIC COUSINS MINE (Sept 2026 model releases)")
    print("================================================================")
    print()

    n_written, written = emit()
    print(f"  8 releases, {n_written} atoms written")
    print()
    print(f"  {'model':<40} {'status':<20} {'axes':<35}")
    for r in RELEASES:
        n_axes = len(r["axes_relevant"])
        axes_str = ", ".join(r["axes_relevant"][:5]) if r["axes_relevant"] else "(none — DO NOT SCORE)"
        print(f"  {r['model']:<40} {r['status']:<20} {axes_str[:35]}")
    print()
    print("  DISCIPLINE:")
    print("    DO score: Flash, Fable 5.1, Muse Spark 1.3, Nemotron-3 Ultra-CC")
    print("    DO NOT score: Flash Cyber, Mythos 5.1, Astra")
    print("    NOT A MODEL: ByteDance loan (corporate event, not TAM)")
    print()
    print("  NEXT: per-atom probe (a separate cron) for the public cousins only")
    print("        Restricted cousins stay UNCHECKABLE forever")
    return 0


if __name__ == "__main__":
    sys.exit(main())
