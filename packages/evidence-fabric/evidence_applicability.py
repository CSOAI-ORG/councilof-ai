#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Offline two-release synthetic fixture; no admission, release decision or external upload.

Reuses evidence-event/0.1, its OTel renderer, and measurement-capsule/0.2.
The local approval principal is an ephemeral fixture key, never a human operator.
"""
import argparse
import base64
import copy
import datetime as dt
import hashlib
import http.server
import json
import pathlib
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from contextlib import contextmanager

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

import event as E
from render.otel import render_batch

VERSION = "0.1-draft"
CLAIM = "In this fixture an outbound request requires an unexpired scoped approval token."
LIMITS = [
    "Synthetic localhost fixture operated by CSOAI; no third-party system or independent executor was tested.",
    "Three scenario families, not an admitted measurement, GSPC score or population estimate.",
    "Fixture key authenticity establishes local bytes only; it is not a trusted Council signing identity.",
    "No genuine human decision, release decision, execution authority or external integration is established.",
]
APPROVAL_MODES = ("valid", "denied", "forged", "wrong_scope", "expired", "timeout")
REQUIRED_MEMBERS = frozenset({"pilot.json", "evaluation.otlp.json", "reference-projections.json",
                              "events.jsonl", "capsules.jsonl"})
MAX_MEMBER_BYTES = 8 * 1024 * 1024
MAX_MANIFEST_BYTES = 64 * 1024


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def public_b64(key):
    return base64.b64encode(key.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw)).decode()


def seal(payload, key):
    raw = E.jcs(payload)
    return {"algorithm": "Ed25519", "payload_sha256": sha(raw),
            "signature_b64": base64.b64encode(key.sign(raw)).decode(),
            "public_key_b64": public_b64(key), "key_scope": "ephemeral_local_fixture_only"}


def check_seal(payload, record, expected_public_key):
    """Pinned fixture public key is required; an attacker-supplied inline key is insufficient."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    if record.get("public_key_b64") != expected_public_key:
        return False
    raw = E.jcs(payload)
    if sha(raw) != record.get("payload_sha256"):
        return False
    try:
        Ed25519PublicKey.from_public_bytes(base64.b64decode(expected_public_key, validate=True)).verify(
            base64.b64decode(record["signature_b64"], validate=True), raw)
        return True
    except (InvalidSignature, ValueError, KeyError, TypeError):
        return False


class QuietServer(http.server.ThreadingHTTPServer):
    daemon_threads = True


@contextmanager
def fixture_servers(mode, approval_key, request_body):
    """Only loopback listeners. Timeout is caused by a real withheld HTTP response."""
    effects = []
    waiting = threading.Event()
    finish = threading.Event()

    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_POST(self):
            raw = self.rfile.read(int(self.headers.get("Content-Length", "0")))
            if self.server.role == "sink":
                effects.append({"body_sha256": sha(raw), "body": json.loads(raw)})
                result = {"received": True}
            elif mode == "timeout":
                waiting.set()
                finish.wait(2)
                return
            else:
                payload = {"request_sha256": sha(raw), "expires_unix": int(time.time()) + 60,
                           "token_state": "accepted" if mode != "denied" else "declined"}
                if mode == "wrong_scope":
                    payload["request_sha256"] = sha(b"different-request")
                if mode == "expired":
                    payload["expires_unix"] = 0
                signer = Ed25519PrivateKey.generate() if mode == "forged" else approval_key
                result = {"payload": payload, "seal": seal(payload, signer)}
            body = E.jcs(result)
            try:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

    approval = QuietServer(("127.0.0.1", 0), Handler)
    approval.role = "approval"
    sink = QuietServer(("127.0.0.1", 0), Handler)
    sink.role = "sink"
    threads = [threading.Thread(target=s.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
               for s in (approval, sink)]
    for t in threads:
        t.start()
    try:
        yield (f"http://127.0.0.1:{approval.server_port}/approval",
               f"http://127.0.0.1:{sink.server_port}/effect", effects, waiting)
    finally:
        finish.set()
        for s in (approval, sink):
            s.shutdown()
            s.server_close()
        for t in threads:
            t.join(timeout=2)


def post_local(url, body, timeout):
    # A redirected response must never turn this fixture into an external request.
    try:
        parsed = urllib.parse.urlsplit(url)
        local = (parsed.scheme == "http" and parsed.hostname == "127.0.0.1"
                 and parsed.username is None and parsed.password is None
                 and parsed.port is not None and parsed.port > 0 and not parsed.fragment
                 and not any(ord(c) < 32 for c in url))
    except (ValueError, TypeError):
        local = False
    if not local:
        raise ValueError("fixture accepts loopback URLs only")

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *_args, **_kwargs):
            raise ValueError("redirect refused")

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    req = urllib.request.Request(url, data=E.jcs(body), headers={"Content-Type": "application/json"})
    with opener.open(req, timeout=timeout) as response:
        return json.loads(response.read(65536))


def guarded_request(config, approval_url, sink_url, body, trusted_fixture_key):
    """Toy service intentionally has an observable changed timeout-policy branch."""
    reason, token_valid = "token_rejected", False
    try:
        response = post_local(approval_url, body, config["timeout_seconds"])
        token = response.get("payload", {})
        token_valid = (check_seal(token, response.get("seal", {}), trusted_fixture_key)
                       and token.get("request_sha256") == sha(E.jcs(body))
                       and token.get("expires_unix", 0) > int(time.time())
                       and token.get("token_state") == "accepted")
        send = token_valid
        reason = "scoped_token_valid" if token_valid else reason
    except (TimeoutError, socket.timeout):
        send = config["timeout_fallback"] == "send"
        reason = "timeout_fallback"
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, (TimeoutError, socket.timeout)):
            send = config["timeout_fallback"] == "send"
            reason = "timeout_fallback"
        else:
            raise
    if send:
        post_local(sink_url, body, 1)
    return {"token_valid": token_valid, "request_emitted": send, "reason": reason}


def run_release(config, approval_key):
    observations = []
    for mode in APPROVAL_MODES:
        body = {"resource": "fixture://local-effect", "operation": "append", "payload": "synthetic"}
        with fixture_servers(mode, approval_key, body) as (approval_url, sink_url, effects, waiting):
            started = time.monotonic_ns()
            result = guarded_request(config, approval_url, sink_url, body, public_b64(approval_key))
            elapsed_ns = time.monotonic_ns() - started
            if mode == "timeout" and not waiting.is_set():
                raise RuntimeError("timeout stimulus did not reach approval server")
            result.update({"mode": mode, "sink_request_count": len(effects),
                           "effect_sha256": sha(E.jcs(effects)), "elapsed_ns": elapsed_ns})
            if result["request_emitted"] != bool(effects):
                raise RuntimeError("service acknowledgement disagrees with actual sink")
            observations.append(result)
    return {"read_at": now(), "executed_config": copy.deepcopy(config), "tests": observations}


def claim_observation(run):
    if run is None:
        return None
    return not any(x["sink_request_count"] and not x["token_valid"] for x in run["tests"])


def screen_applicability(old_config, new_config, prior_evidence):
    """Scoped dependency screen, not expert judgment or a release decision.

    The complete dependency list is known because this is the included toy service.
    No change inference is made if either declaration or prior source is missing.
    """
    required = {"timeout_seconds", "timeout_fallback"}
    if not isinstance(new_config, dict) or not isinstance(old_config, dict) or not prior_evidence:
        return {"state": "UNCHECKABLE", "changed_dependencies": None,
                "basis": "required source unavailable"}
    if not required.issubset(old_config) or not required.issubset(new_config):
        return {"state": "UNCHECKABLE", "changed_dependencies": None,
                "basis": "declared dependency inventory incomplete"}
    changed = sorted(k for k in required if old_config[k] != new_config[k])
    return {"state": "DIVERGENT" if changed else "CONSISTENT", "changed_dependencies": changed,
            "basis": "included toy-service dependency inventory; no claim about third-party completeness"}


def source_pins(root):
    paths = ["packages/evidence-fabric/event.py", "packages/evidence-fabric/render/__init__.py",
             "packages/evidence-fabric/render/otel.py", "packages/venturi-capsule/venturi_capsule.py",
             "packages/evidence-fabric/schema/evidence-event-0.1.schema.json",
             "docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json",
             "docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.schema.json"]
    return {p: sha((root / p).read_bytes()) for p in paths}


def evidence_reference(path, system):
    """Reference supplied bytes only: no fabricated Moonshot/Langfuse/TEA result parsing."""
    path = pathlib.Path(path)
    return {"system": system, "file_name": path.name, "sha256": sha(path.read_bytes()),
            "semantic_result": "UNMEASURED", "upstream_acceptance": "NOT_ESTABLISHED"}


def capsule_for(scenario, event, root):
    sys.path.insert(0, str(root / "packages/venturi-capsule"))
    import venturi_capsule as V
    return V.make_capsule(
        kind="measurement.local_fixture_applicability", subject_id=f"fixture://{scenario['id']}",
        claim={"statement": CLAIM},
        declared={"historical_result": True, "fixture_scope": "localhost toy service"},
        observed={"result": claim_observation(scenario["r2_run"]),
                  "dependency_state": scenario["screen"]["state"]},
        differential={"changed_dependencies": scenario["screen"]["changed_dependencies"]},
        sources={"event_sha256": sha(E.jcs(event)),
                 "scenario_sha256": sha(E.jcs(scenario))},
        measurement_state="LOCAL_FIXTURE_ONLY", limitations=LIMITS,
        observed_at=event["claim"]["read_at"])


def make_pilot(root, source_revision=None):
    root = pathlib.Path(root).resolve()
    if source_revision is None and (root / "SOURCE-REVISION").is_file():
        source_revision = (root / "SOURCE-REVISION").read_text().strip()
    if source_revision is not None and not re.fullmatch(r"[0-9a-f]{40}", source_revision):
        raise ValueError("source revision must be a full lowercase Git SHA or null")
    declaration_key = Ed25519PrivateKey.generate()
    approval_key = Ed25519PrivateKey.generate()
    r1 = {"timeout_seconds": 0.08, "timeout_fallback": "suppress", "audit_label": "release-1"}
    r2 = {**r1, "timeout_fallback": "send"}
    no_impact = {**r1, "audit_label": "display-only-release-2"}
    r1_run = run_release(r1, approval_key)
    material_run = run_release(r2, approval_key)
    no_impact_run = run_release(no_impact, approval_key)
    r1_seal = seal(r1, declaration_key)
    historical_seal = seal(r1_run, declaration_key)
    scenarios = []
    for name, config, run in (("timeout-policy-change", r2, material_run),
                              ("display-label-control", no_impact, no_impact_run),
                              ("missing-dependency-record", None, None)):
        screen = screen_applicability(r1, config, r1_run)
        scenarios.append({"id": name, "r1_config": r1, "r2_config": config,
                          "r1_run": r1_run, "r2_run": run, "screen": screen,
                          "historical_declaration_seal": r1_seal,
                          "historical_observation_seal": historical_seal,
                          "historical_integrity": {
                              "declaration_valid": check_seal(r1, r1_seal, public_b64(declaration_key)),
                              "observation_valid": check_seal(r1_run, historical_seal, public_b64(declaration_key))},
                          "declaration_matches_executed_config": None if run is None else config == run["executed_config"]})
    events, capsules = [], []
    captured = now()
    code_sha = sha(pathlib.Path(__file__).read_bytes())
    for scenario in scenarios:
        ev = E.build(subject={"kind": "sandbox_run", "locator": f"fixture://{scenario['id']}"},
                     claim={"text": CLAIM, "read_at": captured},
                     method={"id": "local-two-release-applicability-fixture", "version": VERSION,
                             "holder": "csoai", "code_sha256": code_sha},
                     declared={"historical_result": True, "historical_subject": "fixture://release-1"},
                     observed={"read_at": captured, "new_release_result": claim_observation(scenario["r2_run"]),
                               "dependency_screen": scenario["screen"],
                               "record_sha256": sha(E.jcs(scenario))},
                     state=scenario["screen"]["state"], value=None,
                     negative_control={"id": "timeout-policy-change",
                                       "expected": "UNSCOPED_EFFECT_OBSERVED",
                                       "got": "UNSCOPED_EFFECT_OBSERVED" if not claim_observation(material_run) else "NOT_RUN"},
                     limits=LIMITS)
        events.append(ev)
        capsules.append(capsule_for(scenario, ev, root))
    return {"status": "LOCAL_SYNTHETIC_FIXTURE_ONLY", "method_version": VERSION,
            "captured_at": captured, "fixture_public_key_b64": public_b64(declaration_key),
            "fixture_approval_public_key_b64": public_b64(approval_key),
            "control_inputs_sha256": sha(E.jcs(list(APPROVAL_MODES))),
            "source_revision": source_revision,
            "model": None, "model_state": "NO_MODEL_USED", "python_version": sys.version.split()[0],
            "scenario_family_count": len(scenarios), "independent_executor": None,
            "human_review_minutes": None, "test_cost": None, "source_pins": source_pins(root),
            "pilot_source_sha256": code_sha, "scenarios": scenarios, "events": events,
            "capsules": capsules, "limitations": LIMITS}


def write_pilot(pilot, output):
    output = pathlib.Path(output)
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        raise ValueError("output must be empty; prior evidence is never overwritten")
    files = {"pilot.json": pilot,
             "evaluation.otlp.json": render_batch(pilot["events"]),
             "reference-projections.json": {
                 "status": "LOCAL_CANDIDATE_PROJECTIONS_ONLY",
                 "evidence_refs": [{"event_id": e["event_id"], "sha256": sha(E.jcs(e))} for e in pilot["events"]],
                 "receivers": {name: {"state": "NOT_CONNECTED", "acceptance": "NOT_ESTABLISHED"}
                               for name in ("Verisuff", "TEA", "Langfuse", "Moonshot")},
                 "limits": ["Generic file references, not asserted receiver-native schemas or executed imports.",
                            "OTel export reuses the existing renderer; no collector or Langfuse upload occurred."]}}
    for name, value in files.items():
        (output / name).write_bytes(E.jcs(value) + b"\n")
    E.write_jsonl(str(output / "events.jsonl"), pilot["events"])
    E.write_jsonl(str(output / "capsules.jsonl"), pilot["capsules"])
    manifest = {"status": "UNSIGNED_LOCAL_FILE_MANIFEST", "files": {
        p.name: sha(p.read_bytes()) for p in sorted(output.iterdir())}}
    (output / "manifest.json").write_bytes(E.jcs(manifest) + b"\n")
    return manifest


def verify_directory(output, expected_manifest_sha256):
    output = pathlib.Path(output).resolve()
    def bounded_read(name, maximum):
        path = output / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"not a local regular member: {name}")
        with path.open("rb") as member:
            raw = member.read(maximum + 1)
        if len(raw) > maximum:
            raise ValueError(f"member exceeds byte bound: {name}")
        return raw

    raw = bounded_read("manifest.json", MAX_MANIFEST_BYTES)
    if sha(raw) != expected_manifest_sha256:
        raise ValueError("manifest differs from independently retained digest")
    manifest = json.loads(raw)
    members = manifest.get("files") if isinstance(manifest, dict) else None
    if not isinstance(members, dict) or set(members) != REQUIRED_MEMBERS:
        raise ValueError("manifest must cover exactly the five required output members")
    retained = {}
    for name, digest in members.items():
        if name in (".", "..") or pathlib.PurePath(name).name != name or (output / name).is_symlink():
            raise ValueError("manifest contains nonlocal member")
        if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
            raise ValueError(f"malformed member digest: {name}")
        retained[name] = bounded_read(name, MAX_MEMBER_BYTES)
        if sha(retained[name]) != digest:
            raise ValueError(f"member digest mismatch: {name}")
    pilot = json.loads(retained["pilot.json"])
    if not (len(pilot["scenarios"]) == len(pilot["events"]) == len(pilot["capsules"])
            == pilot["scenario_family_count"]):
        raise ValueError("scenario/event/capsule counts differ")
    identifiers = [s["id"] for s in pilot["scenarios"]]
    if len(set(identifiers)) != len(identifiers):
        raise ValueError("duplicate scenario identifier")
    for scenario in pilot["scenarios"]:
        for field, seal_field in (("r1_config", "historical_declaration_seal"),
                                 ("r1_run", "historical_observation_seal")):
            if not check_seal(scenario[field], scenario[seal_field], pilot["fixture_public_key_b64"]):
                raise ValueError("historical fixture signature invalid")
    for ev in pilot["events"]:
        E.check_renderable(ev)
    for scenario, ev, capsule in zip(pilot["scenarios"], pilot["events"], pilot["capsules"]):
        expected_subject = f"fixture://{scenario['id']}"
        if ev["subject"]["locator"] != expected_subject or capsule["subject_id"] != expected_subject:
            raise ValueError("scenario subject references differ")
        record_sha = sha(E.jcs(scenario))
        if ev["observed"]["record_sha256"] != record_sha or capsule["sources"]["scenario_sha256"] != record_sha:
            raise ValueError("scenario source references differ")
        if capsule["capsule_id"] != sha(E.jcs({k: v for k, v in capsule.items() if k != "capsule_id"})):
            raise ValueError("capsule id differs from canonical body")
        if capsule["sources"]["event_sha256"] != sha(E.jcs(ev)):
            raise ValueError("capsule points at different event")
    if [json.loads(line) for line in retained["capsules.jsonl"].decode().splitlines()] != pilot["capsules"]:
        raise ValueError("capsule projection differs from canonical capsules")
    if json.loads(retained["evaluation.otlp.json"]) != render_batch(pilot["events"]):
        raise ValueError("OTel projection differs from canonical events")
    if retained["events.jsonl"].decode().splitlines() != [json.dumps(e, ensure_ascii=False, sort_keys=True) for e in pilot["events"]]:
        raise ValueError("event projection differs from canonical events")
    refs = json.loads(retained["reference-projections.json"])
    expected_refs = [{"event_id": ev["event_id"], "sha256": sha(E.jcs(ev))} for ev in pilot["events"]]
    if refs.get("evidence_refs") != expected_refs:
        raise ValueError("receiver references differ from canonical events")
    return {"file_integrity": "VERIFIED_AGAINST_SUPPLIED_DIGEST", "publisher_identity": "NOT_ESTABLISHED",
            "measurement_admission": "NOT_ESTABLISHED", "external_acceptance": "NOT_ESTABLISHED"}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run")
    run.add_argument("--source-root", type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[2])
    run.add_argument("--out", type=pathlib.Path, required=True)
    run.add_argument("--source-revision")
    verify = sub.add_parser("verify")
    verify.add_argument("--out", type=pathlib.Path, required=True)
    verify.add_argument("--expected-manifest-sha256", required=True)
    args = ap.parse_args(argv)
    if args.command == "run":
        pilot = make_pilot(args.source_root, args.source_revision)
        write_pilot(pilot, args.out)
        print(json.dumps({"status": pilot["status"], "scenario_families": len(pilot["scenarios"]),
                          "manifest_sha256": sha((args.out / "manifest.json").read_bytes())}))
    else:
        print(json.dumps(verify_directory(args.out, args.expected_manifest_sha256)))


if __name__ == "__main__":
    main()
