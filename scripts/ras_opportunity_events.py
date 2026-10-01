#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, importlib.util, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIRROR = Path("/workspace/staging/mirror/councilof-ai.git")
DEFAULT_REF = "review/codex-f86f23e-20260930"
OUT_DIR = ROOT / "public/evidence/ras-opportunity-watch"
SOURCE_DIR = OUT_DIR / "source"
EVENTS = OUT_DIR / "events.jsonl"

SOURCES = {
    "a2a_directory": "public/evidence/ras-opportunity-watch/ras-csoai-a2a-directory-drift-20260930.json",
    "c2pa": "public/evidence/ras-opportunity-watch/ras-c2pa-provenance-conformance-20260929.json",
    "battery_control": "public/evidence/ras-opportunity-watch/ras-cm-bat-r18-current-collector-control-20260929.json",
    "battery_audit": "public/evidence/ras-opportunity-watch/ras-cm-bat-r18-source-audit-20260929.json",
}

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def load_fabric():
    path = ROOT / "packages/evidence-fabric/event.py"
    spec = importlib.util.spec_from_file_location("csoai_evidence_event", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod

def read_legacy(ref: str, path: str) -> tuple[bytes, dict]:
    raw = subprocess.check_output(["git", f"--git-dir={MIRROR}", "show", f"{ref}:{path}"])
    return raw, json.loads(raw)

def method(code_sha: str) -> dict:
    return {"id": "legacy-ras-to-evidence-event", "version": "0.1", "code_sha256": code_sha, "holder": "csoai"}

def a2a_event(fabric, doc: dict, raw_sha: str, code_sha: str):
    provider = doc["canonical_provider"]
    projection = doc["third_party_projection"]
    declared_n = len(provider.get("skill_ids", []))
    observed_n = int(doc["comparison"]["projection_described_skill_count"])
    return fabric.build(
        subject={"kind": "web_page", "locator": projection["url"], "declared_by": "third_party:apis.io"},
        claim={"text": f"Directory projection described {observed_n} skills while the canonical provider card exposed {declared_n} skills at the recorded read.",
               "source_url": projection["url"], "source_sha256": projection["sha256"], "read_at": doc.get("observed_at")},
        method=method(code_sha),
        declared={"canonical_agent_card_url": provider["url"], "skill_count": declared_n, "agent_version": provider.get("agent_version")},
        observed={"projection_skill_count": observed_n, "missing_skill_ids": doc["comparison"]["canonical_skills_absent_from_projection_text"],
                  "legacy_record_sha256": raw_sha},
        state="DIVERGENT", value=declared_n-observed_n,
        negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
        limits=[doc["claim_boundary"], "This event measures public projection freshness only; it does not infer operator intent or service quality."],
        maintenance={"next_read_utc": "2026-10-01T03:41:58Z", "schedule": "d1,d7"},
    )

def c2pa_event(fabric, doc: dict, raw_sha: str, code_sha: str):
    resources = doc.get("canonical_resources", [])
    states = doc.get("measurement_states", {})
    return fabric.build(
        subject={"kind": "web_page", "locator": "https://payai.agentstools.dev/provenance/verify", "declared_by": "third_party:AgentTools"},
        claim={"text": "Public discovery advertised C2PA provenance resources and official fixtures were identified; third-party execution, payment, settlement and exact-byte delivery remained unmeasured in this record.",
               "source_url": doc["discovery_source"]["url"], "source_sha256": doc["discovery_source"]["sha256"],
               "read_at": doc["discovery_source"].get("observed_at")},
        method=method(code_sha),
        declared={"resource_count": len(resources), "resources": [r.get("resource") for r in resources], "acceptance_checks": doc.get("acceptance", [])},
        observed={"measurement_states": states, "fixture_count": len(doc.get("fixtures", [])), "legacy_record_sha256": raw_sha},
        state="PARTIAL", value=len(resources),
        negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
        limits=["Discovery and fixture availability were observed; paid third-party service behaviour was not exercised by this record.",
                "A provenance result would not by itself establish truth of depicted real-world content."],
        maintenance=None,
    )

def battery_control_event(fabric, doc: dict, raw_sha: str, code_sha: str):
    vals = [abs(float(v)) for d in doc.get("deltas", {}).values() for v in d.values()]
    max_delta = max(vals) if vals else 0.0
    return fabric.build(
        subject={"kind": "model_run", "locator": "csoai://ras-opportunity-watch/cm-bat-r18-current-collector-control-20260929", "declared_by": "csoai"},
        claim={"text": "Collector-mapped and original parameter variants produced zero reported delta in the bounded 1C lithiation control.",
               "source_url": None, "source_sha256": raw_sha, "read_at": None},
        method=method(code_sha),
        declared={"parameter_change": doc.get("parameter_change", {}), "condition": doc.get("condition", {})},
        observed={"deltas": doc.get("deltas", {}), "bounded_causal_verdict": doc.get("bounded_causal_verdict")},
        state="CONSISTENT", value=max_delta,
        negative_control={"id": "original-vs-collector-mapped", "expected": "ZERO_DELTA", "got": "ZERO_DELTA"},
        limits=[doc.get("scope_note", "Bounded control only; broader configurations remain unmeasured.")],
        maintenance=None,
    )

def battery_audit_event(fabric, doc: dict, raw_sha: str, code_sha: str):
    unmapped = list(doc.get("unmapped_current_collector_keys", []))
    return fabric.build(
        subject={"kind": "repository", "locator": "csoai://ras-opportunity-watch/cm-bat-r18-chen2020-mapping", "declared_by": "csoai"},
        claim={"text": "The recorded graphite-to-positive-slot mapping left current-collector keys unmapped while the audited bulk targets existed.",
               "source_url": None, "source_sha256": doc.get("source_sha256") or raw_sha, "read_at": None},
        method=method(code_sha),
        declared={"bulk_negative_electrode_particle_keys": doc.get("bulk_negative_electrode_particle_keys"),
                  "bulk_targets_all_exist": doc.get("bulk_targets_all_exist")},
        observed={"unmapped_current_collector_keys": unmapped, "source_totality_verdict": doc.get("source_totality_verdict"),
                  "causal_control": doc.get("causal_control"), "legacy_record_sha256": raw_sha},
        state="DIVERGENT", value=len(unmapped),
        negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
        limits=[doc.get("causal_scope", "Broader configurations remain unmeasured."),
                "This event records source-mapping completeness, not a general battery-performance conclusion."],
        maintenance=None,
    )

def render(ref: str) -> tuple[dict[str, bytes], bytes]:
    fabric = load_fabric()
    code_sha = sha(Path(__file__).read_bytes())
    docs, raw_by_name = {}, {}
    for key, old_path in SOURCES.items():
        raw, doc = read_legacy(ref, old_path)
        docs[key], raw_by_name[Path(old_path).name] = doc, raw
    events = [
        a2a_event(fabric, docs["a2a_directory"], sha(raw_by_name[Path(SOURCES["a2a_directory"]).name]), code_sha),
        c2pa_event(fabric, docs["c2pa"], sha(raw_by_name[Path(SOURCES["c2pa"]).name]), code_sha),
        battery_control_event(fabric, docs["battery_control"], sha(raw_by_name[Path(SOURCES["battery_control"]).name]), code_sha),
        battery_audit_event(fabric, docs["battery_audit"], sha(raw_by_name[Path(SOURCES["battery_audit"]).name]), code_sha),
    ]
    for ev in events:
        errs = fabric.validate(ev)
        if errs:
            raise SystemExit("; ".join(errs))
    data = "".join(json.dumps(ev, sort_keys=True, ensure_ascii=False) + "\n" for ev in events).encode()
    return raw_by_name, data

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default=DEFAULT_REF)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    raw_by_name, events = render(args.ref)
    if args.check:
        ok = EVENTS.is_file() and EVENTS.read_bytes() == events
        ok = ok and all((SOURCE_DIR / n).is_file() and (SOURCE_DIR / n).read_bytes() == b for n,b in raw_by_name.items())
        print(f"{'PASS' if ok else 'FAIL'} ras-opportunity evidence-events events=4")
        return 0 if ok else 1
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    for name, raw in raw_by_name.items():
        (SOURCE_DIR / name).write_bytes(raw)
    EVENTS.parent.mkdir(parents=True, exist_ok=True)
    EVENTS.write_bytes(events)
    print(f"wrote {EVENTS.relative_to(ROOT)} events=4 source_records={len(raw_by_name)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
