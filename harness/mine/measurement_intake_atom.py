#!/usr/bin/env python3
"""measurement_intake_atom.py — emits unsigned intake atoms per TUI-1 charter.

Subject + family/version + method + scorer version + denominator + cost + artifact hash.
Admission/signing belongs to TUI 4 — this only emits atoms.
"""
from __future__ import annotations
import json, os, sys, hashlib, urllib.request
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
INTAKE_LOG = MEAS_DIR / "intake_atoms.jsonl"
STATE = Path("/tmp/measurement_intake_state.json")


def hash_atom(atom):
    """Content hash of atom for integrity."""
    s = json.dumps(atom, sort_keys=True).encode()
    return hashlib.sha256(s).hexdigest()[:16]


def emit_atom(subject, family, version, method, scorer_version, denominator, cost_usd=0.0, source_revision=None, state="INDEXED"):
    """Emit unsigned intake atom. TUI 4 signs later."""
    atom = {
        "atom_schema": "csoai.intake-atom/0.1",
        "atom_kind": "intake-atom",
        "subject": subject,
        "family": family,
        "version": version,
        "method": method,
        "scorer_version": scorer_version,
        "denominator": denominator,
        "cost_usd": cost_usd,
        "source_revision": source_revision or NOW(),
        "state": state,  # INDEXED → PROBED → MEASURED → ADMITTED (TUI 4)
        "emitted_at": NOW(),
        "emitted_by": "TUI-1",
        "unsigned": True,
        "notes": "Unsigned intake atom. Admission/signing handled by TUI 4.",
    }
    atom["content_hash"] = hash_atom(atom)
    with open(INTAKE_LOG, "a") as f:
        f.write(json.dumps(atom) + "\n")
    return atom


def probe_hf_model(model_id):
    """Check Hugging Face model existence + last modified."""
    try:
        url = f"https://huggingface.co/api/models/{model_id}"
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-intake/1"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            return {
                "id": data.get("id"),
                "last_modified": data.get("lastModified"),
                "tags": data.get("tags", [])[:20],
                "downloads": data.get("downloads", 0),
            }
    except Exception as e:
        return {"error": str(e)[:100]}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-1 intake atoms: {metrics.get('atoms_emitted', 0)} atoms emitted.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "intake_atom_layer": True,
    }
    fname = MEAS_DIR / f"intake-atom-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


# Known ready-to-measure from news_miner (Sep 12-13)
KNOWN_ATOMS = [
    {"subject": "DeepSeek V4.1-Flash", "family": "deepseek", "version": "4.1-flash",
     "method": "huggingface_metadata_probe", "scorer_version": "gspc-axis-1-14",
     "denominator": "TBD", "source": "news-2026-09-12"},
    {"subject": "Nemotron 3 Ultra (IMO-gold)", "family": "nvidia-nemotron", "version": "3-ultra-imo",
     "method": "huggingface_metadata_probe", "scorer_version": "gspc-axis-1-14+math",
     "denominator": "TBD", "source": "news-2026-09-12"},
    {"subject": "NASA+IBM open lunar foundation model", "family": "nasa-ibm", "version": "lunar-1",
     "method": "huggingface_metadata_probe", "scorer_version": "gspc-axis-15-22",
     "denominator": "TBD", "source": "news-2026-09-12"},
    {"subject": "OpenAI GPT-Live-1", "family": "openai-gpt", "version": "live-1",
     "method": "api_metadata_probe", "scorer_version": "gspc-axis-1-14-full-duplex",
     "denominator": "TBD", "source": "news-2026-09-12"},
    {"subject": "California SB 813", "family": "us-regulation", "version": "sb-813-2026",
     "method": "legal_text_probe", "scorer_version": "gspc-axis-regulation-1",
     "denominator": "TBD", "source": "news-2026-09-12"},
    {"subject": "California AB 1405", "family": "us-regulation", "version": "ab-1405-2026",
     "method": "legal_text_probe", "scorer_version": "gspc-axis-regulation-1",
     "denominator": "TBD", "source": "news-2026-09-12"},
    {"subject": "Anthropic third-party evaluator pledge", "family": "lab-commitment", "version": "dario-pace-2026-09-12",
     "method": "commitment_text_probe", "scorer_version": "gspc-axis-oversight",
     "denominator": "TBD", "source": "news-2026-09-12"},
]


def main():
    print(f"[{NOW()}] measurement_intake_atom starting")
    emitted = []
    for ka in KNOWN_ATOMS:
        # Probe HF if it's a model
        hf_meta = None
        if ka["family"] in {"deepseek", "nvidia-nemotron", "nasa-ibm"}:
            model_id = ka["subject"].split(" (")[0].lower().replace(" ", "-").replace("+", "_")
            hf_meta = probe_hf_model(model_id)
        atom = emit_atom(
            subject=ka["subject"],
            family=ka["family"],
            version=ka["version"],
            method=ka["method"],
            scorer_version=ka["scorer_version"],
            denominator=ka["denominator"],
            source_revision=ka["source"],
            state="PROBED" if hf_meta and "error" not in hf_meta else "INDEXED",
        )
        if hf_meta:
            atom["hf_metadata"] = hf_meta
        emitted.append(atom)
    # Card summary
    write_card(f"news-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.intake_atom.news_atoms",
               {
                   "atoms_emitted": len(emitted),
                   "by_family": {a["family"]: 0 for a in emitted},
                   "state_breakdown": {"INDEXED": 0, "PROBED": 0, "MEASURED": 0},
                   "atoms": [{"subject": a["subject"], "family": a["family"], "state": a["state"], "content_hash": a["content_hash"]} for a in emitted],
                   "charter_note": "TUI-1 emits unsigned intake atoms only. Admission/signing → TUI 4.",
                   "auto_churn": True,
               })
    # Update family/state breakdown
    families = {}
    states = {}
    for a in emitted:
        families[a["family"]] = families.get(a["family"], 0) + 1
        states[a["state"]] = states.get(a["state"], 0) + 1
    print(f"[{NOW()}] intake_atom done: {len(emitted)} atoms, families={families}, states={states}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
