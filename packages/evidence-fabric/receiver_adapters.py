#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Offline Langfuse payloads, Turing TEA evidence extraction and Moonshot artifact wrapping.

No SDK, HTTP client, credentials, execution or external acceptance is supplied.
Canonical observations reuse csoai.evidence-event/0.1.
"""
import argparse
import datetime
import hashlib
import json
import math
import pathlib
import re
import sys

import event as E

HERE = pathlib.Path(__file__).resolve().parent
CONTRACTS = HERE / "receiver-contracts"
MAX_BYTES = 8 * 1024 * 1024
MOONSHOT_COMMIT = "03e9344dc9fc949ae05b1f38580611fce36528ab"
MOONSHOT_STATUSES = frozenset({"PENDING", "CANCELLED", "RUNNING", "RUNNING_WITH_ERRORS",
                               "COMPLETED", "COMPLETED_WITH_ERRORS"})
HEX64 = re.compile(r"^[0-9a-f]{64}$")


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def strict_json(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError("JSON exceeds byte bound")

    def unique(pairs):
        out = {}
        for key, value in pairs:
            if key in out:
                raise ValueError("duplicate JSON key")
            out[key] = value
        return out

    def invalid_constant(_value):
        raise ValueError("nonfinite JSON number")

    def finite_float(value):
        number = float(value)
        if not math.isfinite(number):
            raise ValueError("nonfinite JSON number")
        return number

    return json.loads(raw, object_pairs_hook=unique, parse_constant=invalid_constant, parse_float=finite_float)


def read_local(path, root=None):
    path = pathlib.Path(path)
    if root is not None:
        base = pathlib.Path(root).resolve()
        if path.is_absolute() or ".." in path.parts:
            raise ValueError("artifact path must be relative within artifact root")
        path = base / path
        try:
            path.resolve().relative_to(base)
        except ValueError:
            raise ValueError("artifact escapes local root") from None
        cursor = path
        while cursor != base:
            if cursor.is_symlink():
                raise ValueError("symlink artifact refused")
            cursor = cursor.parent
    if path.is_symlink():
        raise ValueError("source is not a local regular file")
    if not path.exists():
        raise FileNotFoundError("local source unavailable")
    if not path.is_file():
        raise ValueError("source is not a local regular file")
    with path.open("rb") as source:
        raw = source.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("source exceeds byte bound")
    return raw


def contract(name):
    raw = read_local(CONTRACTS / name)
    pins = strict_json(read_local(CONTRACTS / "upstream-source-pins.json"))
    if sha(raw) != pins[name]["sha256"]:
        raise ValueError("derived contract differs from retained source pin")
    return strict_json(raw)


def validate_contract(name, obj):
    import jsonschema
    checker = jsonschema.FormatChecker()
    if not {"date-time", "uri", "uuid"}.issubset(checker.checkers):
        raise RuntimeError("required JSON Schema format validators are missing; see RECEIVER-ADAPTERS.md")
    schema = contract(name)
    jsonschema.validators.validator_for(schema)(schema, format_checker=checker).validate(obj)


def langfuse_score(event, trace_id, observation_id=None):
    """Create a native POST /api/public/scores request body, never upload it.

    The caller supplies the actual trace binding. Nothing is derived from an event ID
    and presented as an observed trace. All six evidence states remain strings.
    """
    E.check_renderable(event)
    if not isinstance(trace_id, str) or not re.fullmatch(r"[0-9a-f]{32}", trace_id) or trace_id == "0" * 32:
        raise ValueError("supply a nonzero lowercase 32-hex trace ID from the receiver")
    if observation_id is not None and (not isinstance(observation_id, str)
                                      or not re.fullmatch(r"[0-9a-f]{16}", observation_id)
                                      or observation_id == "0" * 16):
        raise ValueError("observation ID must be nonzero lowercase 16-hex")
    binding = {"event_id": event["event_id"], "trace_id": trace_id, "observation_id": observation_id}
    payload = {
        "id": "csoai-" + sha(E.jcs(binding)), "traceId": trace_id,
        "name": "csoai.evidence_state", "value": event["state"], "dataType": "CATEGORICAL", "source": "API",
        "comment": "Retained evidence state; no release decision or measurement admission is implied.",
        "metadata": {"event_id": event["event_id"], "event_sha256": sha(E.jcs(event)),
                     "method_id": event["method"]["id"], "method_version": str(event["method"]["version"]),
                     "limits": event["limits"], "receiver_acceptance": "NOT_ESTABLISHED"}}
    if observation_id is not None:
        payload["observationId"] = observation_id
    validate_contract("langfuse-create-scores.schema.json", payload)
    return payload


def turing_tea_events(snapshot_raw, capture, evidence_files=None, evidence_root=None):
    """Extract evidence links from a retained Turing TEA public Discover response.

    Validates only the version-1.0 export core against the unchanged official
    schema. Public envelope fields and opaque snapshot extras have separate checks.
    Capture metadata and local file bindings are caller declarations, not proof
    of an authenticated Turing connection or a sound assurance argument.
    """
    snapshot = strict_json(snapshot_raw)
    if not isinstance(snapshot, dict) or not isinstance(capture, dict):
        raise ValueError("snapshot and capture metadata must be objects")
    required = {"id", "type", "slug", "title", "publishedAt", "archivedAt", "content"}
    if not required.issubset(snapshot) or snapshot["type"] != "ASSURANCE_CASE":
        raise ValueError("expected Turing TEA public Discover assurance-case response")
    for key in ("id", "slug", "title", "publishedAt"):
        if not isinstance(snapshot[key], str) or not snapshot[key]:
            raise ValueError("invalid public snapshot envelope field")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", snapshot["slug"]):
        raise ValueError("invalid Discover slug")
    from urllib.parse import urlsplit
    source_url = capture.get("source_url")
    if not isinstance(source_url, str):
        raise ValueError("capture source URL required")
    try:
        parsed = urlsplit(source_url)
        source_port = parsed.port
    except ValueError:
        raise ValueError("invalid capture URL") from None
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username is not None
            or parsed.password is not None or parsed.query or parsed.fragment
            or (source_port is not None and source_port < 1)
            or any(ord(character) < 32 for character in source_url)
            or parsed.path != "/api/public/discover/" + snapshot["slug"]):
        raise ValueError("capture URL does not bind the declared public Discover slug")
    read_at = capture.get("captured_at")
    for stamp in (read_at, snapshot["publishedAt"], snapshot["archivedAt"]):
        if stamp is None and stamp != read_at:
            continue
        if not isinstance(stamp, str):
            raise ValueError("capture/publication time required")
        try:
            parsed_time = datetime.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("invalid capture/publication time") from None
        if parsed_time.tzinfo is None:
            raise ValueError("capture/publication time must have a timezone")
    if capture.get("source_kind") not in ("SYNTHETIC_CONTRACT_FIXTURE", "SUPPLIED_FILE_UNAUTHENTICATED"):
        raise ValueError("capture must not claim authenticated external execution")
    expected = capture.get("snapshot_sha256")
    if expected is not None and not HEX64.fullmatch(str(expected)):
        raise ValueError("malformed snapshot pin")
    content = snapshot["content"]
    core_keys = {"version", "exportedAt", "case", "tree"}
    if not isinstance(content, dict) or not core_keys.issubset(content):
        raise ValueError("snapshot lacks the nested Turing export core")
    core = {key: content[key] for key in core_keys}
    # Bound traversal before invoking the recursive upstream schema validator.
    stack = [(core["tree"], None, "/content/tree", 0)]
    seen, nodes = set(), []
    while stack:
        node, parent, pointer, depth = stack.pop()
        if depth > 48 or len(nodes) >= 2048:
            raise ValueError("Turing snapshot exceeds traversal bound")
        if not isinstance(node, dict) or not isinstance(node.get("children"), list):
            raise ValueError("invalid nested Turing tree node")
        node_id = node.get("id")
        if not isinstance(node_id, str) or node_id in seen:
            raise ValueError("duplicate or ambiguous Turing node identity")
        seen.add(node_id)
        nodes.append((node, parent, pointer))
        for index in reversed(range(len(node["children"]))):
            stack.append((node["children"][index], node, pointer + "/children/" + str(index), depth + 1))
    validate_contract("turing-case-export-v1.0.schema.json", core)
    evidence_files = evidence_files or {}
    evidence_pins = capture.get("evidence_pins") or {}
    if not isinstance(evidence_files, dict) or not isinstance(evidence_pins, dict):
        raise ValueError("evidence maps and pins must be objects")
    actual_snapshot = sha(snapshot_raw)
    snapshot_pin_state = ("UNCHECKABLE" if expected is None else
                          "CONSISTENT" if expected == actual_snapshot else "DIVERGENT")
    extras = {key: sha(E.jcs(value)) for key, value in content.items() if key not in core_keys}
    evidence_nodes = [(node, parent, pointer) for node, parent, pointer in nodes if node["type"] == "EVIDENCE"]
    events = []
    for node, parent, pointer in evidence_nodes or [(None, None, "/content/tree")]:
        node_id = node["id"] if node else None
        url = node.get("url") if node else None
        url_sha = sha(url.encode()) if isinstance(url, str) and url else None
        ref_pin = evidence_pins.get(node_id, {})
        if not isinstance(ref_pin, dict):
            raise ValueError("evidence pin must be an object")
        for key in ("url_sha256", "content_sha256"):
            if ref_pin.get(key) is not None and not HEX64.fullmatch(str(ref_pin[key])):
                raise ValueError("malformed evidence reference pin")
        observed_file = None
        if node_id in evidence_files:
            if evidence_root is None:
                raise ValueError("evidence root required for local file mapping")
            try:
                observed_file = sha(read_local(evidence_files[node_id], evidence_root))
            except FileNotFoundError:
                pass
        reference_complete = (node is not None and parent is not None and url_sha is not None
                              and observed_file is not None and ref_pin.get("url_sha256") is not None
                              and ref_pin.get("content_sha256") is not None)
        reference_mismatch = ((url_sha is not None and ref_pin.get("url_sha256") is not None and url_sha != ref_pin["url_sha256"])
                              or (observed_file is not None and ref_pin.get("content_sha256") is not None
                                  and observed_file != ref_pin["content_sha256"]))
        state = ("DIVERGENT" if snapshot_pin_state == "DIVERGENT" or reference_mismatch else
                 "UNCHECKABLE" if snapshot_pin_state == "UNCHECKABLE" or not reference_complete else "PARTIAL")
        events.append(E.build(
            subject={"kind": "web_page", "locator": source_url + "#" + pointer},
            claim={"text": ("A retained Turing TEA public-response snapshot declares this evidence node at this argument-tree position."
                            if node else "The retained Turing TEA public-response snapshot has no declared evidence nodes in its argument tree."),
                   "source_url": source_url, "source_sha256": actual_snapshot, "read_at": read_at},
            method={"id": "turing-tea-snapshot-evidence-links", "version": "0.1-draft", "holder": "csoai",
                    "code_sha256": sha(pathlib.Path(__file__).read_bytes())},
            declared={"published_snapshot_id": snapshot["id"], "published_at": snapshot["publishedAt"],
                      "capture_source_kind": capture["source_kind"],
                      "expected_response_sha256": expected, "platform_contract_commit": "0fd1084df5399645275b03bfc09ed58c905fe02c",
                      "reference_pins": ref_pin},
            observed={"read_at": read_at, "response_sha256": actual_snapshot, "snapshot_pin_state": snapshot_pin_state,
                      "export_core_sha256": sha(E.jcs(core)), "opaque_extra_sha256": extras,
                      "evidence_node_id": node_id, "tree_pointer": pointer,
                      "parent_element_id": parent["id"] if parent else None,
                      "parent_element_type": parent["type"] if parent else None,
                      "author_assertion_status": node.get("assertionStatus") if node else None,
                      "evidence_node_sha256": sha(E.jcs(node)) if node else None,
                      "declared_url_sha256": url_sha, "retained_reference_sha256": observed_file,
                      "reference_state": "RETAINED_BYTES" if reference_complete else "NOT_ESTABLISHED",
                      "evidence_presence": "DECLARED_NODE" if node else "NO_EVIDENCE_NODES"},
            state=state, value=None,
            limits=["Only the nested export core is validated against the official Turing schema; the public envelope and opaque extras are separate.",
                    "Caller capture metadata and source pins do not authenticate a Turing receiver, published author or independent executor.",
                    "Evidence text, assertion status and URLs are author declarations; linked artifact correctness and argument validity are not evaluated.",
                    "No URL is fetched, private comment or plugin content copied, or platform import performed.",
                    "The slug is mutable; identity is bounded to retained delivered-response bytes and published record ID.",
                    "Public presentation transforms or republishing can change response bytes; a changed digest alone does not establish a working-case edit."]))
    return events


def moonshot_event(result_raw, run_pins, read_at=None):
    """Wrap the pinned Moonshot ResultArguments.to_dict shape, never invent a run score.

    A lifecycle status is quoted as an upstream declaration. Recipe/metric result
    semantics are deliberately left to a separately qualified versioned adapter.
    """
    result = strict_json(result_raw)
    if not isinstance(run_pins, dict):
        raise ValueError("run pins must be an object")
    required = {"id", "start_time", "end_time", "duration", "status", "raw_results", "results", "params"}
    if not isinstance(result, dict) or not required.issubset(result):
        raise ValueError("result lacks pinned Moonshot ResultArguments fields")
    if (not isinstance(result["id"], str) or not result["id"] or not isinstance(result["status"], str)
            or result["status"] not in MOONSHOT_STATUSES):
        raise ValueError("result identity or lifecycle status invalid")
    for field in ("start_time", "end_time"):
        if isinstance(result[field], bool) or not isinstance(result[field], (int, float)) or not math.isfinite(result[field]):
            raise ValueError("invalid Moonshot lifecycle time")
    if type(result["duration"]) is not int or result["duration"] < 0:
        raise ValueError("invalid Moonshot duration")
    if any(not isinstance(result[field], dict) for field in ("raw_results", "results", "params")):
        raise ValueError("Moonshot result sections must be objects")
    if result["status"].startswith("COMPLETED") and result["end_time"] < result["start_time"]:
        raise ValueError("completed lifecycle ends before it starts")
    pins_required = {"result_sha256", "toolkit_commit", "method_sha256", "inputs_sha256", "subject_ref", "source_kind"}
    missing = sorted(k for k in pins_required if k not in run_pins or run_pins[k] is None)
    for field in ("result_sha256", "method_sha256", "inputs_sha256"):
        if field in run_pins and run_pins[field] is not None and not HEX64.fullmatch(str(run_pins[field])):
            raise ValueError("invalid run pin digest")
    if run_pins.get("toolkit_commit") not in (None, MOONSHOT_COMMIT):
        raise ValueError("Moonshot toolkit revision is outside inspected contract")
    if run_pins.get("source_kind") not in (None, "SYNTHETIC_CONTRACT_FIXTURE", "SUPPLIED_FILE_UNAUTHENTICATED"):
        raise ValueError("source kind must not claim authenticated external execution")
    if run_pins.get("subject_ref") is not None and not (isinstance(run_pins["subject_ref"], str) and run_pins["subject_ref"]):
        raise ValueError("subject reference must be nonempty")
    actual = sha(result_raw)
    mismatch = run_pins.get("result_sha256") is not None and run_pins["result_sha256"] != actual
    state = "DIVERGENT" if mismatch else "UNCHECKABLE" if missing else "PARTIAL"
    read_at = read_at or utc_now()
    return E.build(
        subject={"kind": "model_run", "locator": "moonshot-result:" + result["id"]},
        claim={"text": "A retained Moonshot result declares this lifecycle status under the supplied source pins; execution is not independently established.",
               "source_sha256": actual, "read_at": read_at},
        method={"id": "moonshot-retained-result-wrapper", "version": "0.1-draft", "holder": "csoai",
                "code_sha256": sha(pathlib.Path(__file__).read_bytes())},
        declared={"run_pins": run_pins},
        observed={"read_at": read_at, "result_sha256": actual, "upstream_result_id": result["id"],
                  "upstream_lifecycle_status": result["status"], "missing_pins": missing,
                  "raw_results_sha256": sha(E.jcs(result["raw_results"])),
                  "results_sha256": sha(E.jcs(result["results"])), "params_sha256": sha(E.jcs(result["params"]))},
        state=state, value=None,
        limits=["The source file is synthetic or unauthenticated; the wrapper does not authenticate a Moonshot executor.",
                "Lifecycle COMPLETED is not a test result or accuracy; no numerical measurement or GSPC admission is inferred.",
                "Raw recipe/metric outputs remain retained upstream and are referenced by digest, without copying their contents.",
                "No Moonshot process, model call, external upload or receiver import is performed."])


def write_new(path, raw):
    with pathlib.Path(path).open("xb") as output:
        output.write(raw)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    langfuse = commands.add_parser("langfuse")
    langfuse.add_argument("--events", required=True)
    langfuse.add_argument("--trace-map", required=True, help="event ID -> receiver trace_id/optional observation_id")
    tea = commands.add_parser("tea")
    tea.add_argument("--snapshot", required=True)
    tea.add_argument("--capture", required=True)
    tea.add_argument("--evidence-map")
    tea.add_argument("--evidence-root")
    moonshot = commands.add_parser("moonshot")
    moonshot.add_argument("--result", required=True)
    moonshot.add_argument("--pins", required=True)
    for command in (langfuse, tea, moonshot):
        command.add_argument("--out", required=True)
    args = parser.parse_args(argv)
    if args.command == "langfuse":
        events = [strict_json(line) for line in read_local(args.events).splitlines() if line.strip()]
        mapping = strict_json(read_local(args.trace_map))
        payload = []
        for event in events:
            if event["event_id"] not in mapping:
                raise ValueError("receiver trace mapping is missing for event")
            binding = mapping[event["event_id"]]
            payload.append(langfuse_score(event, binding["trace_id"], binding.get("observation_id")))
        validate_contract("langfuse-create-scores.schema.json", payload)
        write_new(args.out, E.jcs(payload) + b"\n")
    elif args.command == "tea":
        events = turing_tea_events(read_local(args.snapshot), strict_json(read_local(args.capture)),
                                  strict_json(read_local(args.evidence_map)) if args.evidence_map else None, args.evidence_root)
        write_new(args.out, b"".join(E.jcs(event) + b"\n" for event in events))
    else:
        event = moonshot_event(read_local(args.result), strict_json(read_local(args.pins)))
        write_new(args.out, E.jcs(event) + b"\n")
    print(json.dumps({"status": "OFFLINE_PROJECTION_ONLY", "output_sha256": sha(read_local(args.out)),
                      "receiver_acceptance": "NOT_ESTABLISHED"}))


if __name__ == "__main__":
    main()
