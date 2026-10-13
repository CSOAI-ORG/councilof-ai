#!/usr/bin/env python3
"""Read-only hourly CSOAI loop engine.

Runs from the existing standing-cycle scheduler. It touches every declared loop,
queues bounded internal deep-measurement candidates only when a cheap fingerprint
changes, and emits an hourly receipt-of-receipts. It never signs, anchors, pays,
publishes, contacts humans, or executes trades.
"""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
DEFAULT_MANIFEST = HERE / "loops.json"
DEFAULT_STATE = ROOT / "data" / "hourly-loops"
UA = "CSOAI-hourly-loop-engine/0.1"
MAX_HTTP_BYTES = 2 * 1024 * 1024
UTC = timezone.utc


def now():
    return datetime.now(UTC)


def stamp(value=None):
    return (value or now()).isoformat(timespec="seconds").replace("+00:00", "Z")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def atomic_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".hourly-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(value, stream, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def load_json(path: Path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {} if default is None else default


def corrections_content_id(body: bytes):
    """Return a locally checked signed ledger identity, or an inconclusive reason.

    This is a change detector, not a publisher identity or authorization decision.
    """
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        payload = json.loads(body)
        check = payload["signature_check"]
        signature = payload["signature"]
        attestation = signature["attestation"]
        excluded = check["unsigned_wrapper_fields"]
        if not isinstance(excluded, list) or not all(isinstance(x, str) for x in excluded):
            return None, "bad_unsigned_fields"
        # The schema's signed body excludes exactly these request-time wrapper keys.
        if set(excluded) != {"signature", "signature_state", "signature_check", "correction_latency", "note", "fix_requires"}:
            return None, "unexpected_unsigned_fields"
        signed_body = {k: v for k, v in payload.items() if k not in excluded}
        signed_bytes = json.dumps(signed_body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        content_id = sha(signed_bytes)
        if (check.get("state") != "VALID" or check.get("content_id_matches") is not True
                or check.get("ed25519_verified") is not True
                or content_id != check.get("recomputed_content_id")
                or content_id != check.get("attested_content_id")
                or content_id != attestation.get("content_id")
                or content_id != signature.get("id")
                or check.get("key_ed25519_hex") != signature.get("signer")):
            return None, "signed_content_mismatch"
        attestation_bytes = json.dumps(attestation, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(signature["signer"])).verify(
            bytes.fromhex(signature["signature"]), attestation_bytes
        )
        return content_id, None
    except (ImportError, ValueError, KeyError, TypeError, AttributeError, json.JSONDecodeError) as exc:
        return None, "signature_uncheckable:" + type(exc).__name__
    except Exception as exc:
        return None, "signature_invalid:" + type(exc).__name__


def archive_signed_corrections(body: bytes, content_id: str, archive_dir: Path) -> Path:
    """Store only verified signed content bytes under the existing observer state."""
    if len(body) > MAX_HTTP_BYTES or len(content_id) != 64 or any(c not in "0123456789abcdef" for c in content_id):
        raise ValueError("archive_input_invalid")
    payload = json.loads(body)
    excluded = {"signature", "signature_state", "signature_check", "correction_latency", "note", "fix_requires"}
    signed = {k: v for k, v in payload.items() if k not in excluded}
    encoded = json.dumps(signed, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    if len(encoded) > MAX_HTTP_BYTES or sha(encoded) != content_id:
        raise ValueError("archive_hash_mismatch")
    archive_dir.mkdir(parents=True, exist_ok=True)
    path = archive_dir / (content_id + ".json")
    if path.exists():
        if sha(path.read_bytes()) != content_id:
            raise ValueError("existing_archive_hash_mismatch")
        return path
    fd, temp = tempfile.mkstemp(prefix=".signed-", dir=archive_dir)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(encoded)
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temp, path)
        except FileExistsError:
            if sha(path.read_bytes()) != content_id:
                raise ValueError("existing_archive_hash_mismatch")
    finally:
        os.unlink(temp)
    return path


class HttpSnapshotBatch:
    """One bounded, private HTTP snapshot per URL within one loop run.

    Reuse is not an independent observation. Bodies never enter receipt JSON.
    """
    def __init__(self, max_bytes=32 * 1024 * 1024):
        if type(max_bytes) is not int or max_bytes < 0:
            raise ValueError("snapshot byte budget must be a nonnegative integer")
        self.max_bytes = max_bytes
        self.retained_bytes = 0
        self.fetch_count = 0
        self.reuse_count = 0
        self._snapshots = {}

    def get(self, url):
        if url in self._snapshots:
            self.reuse_count += 1
            return self._snapshots[url]
        self.fetch_count += 1
        body, headers, status, error = b"", {}, None, None
        request = urllib.request.Request(url, headers={
            "User-Agent": UA, "Accept": "application/json,text/plain,text/html,*/*"
        })
        observed_at = stamp()
        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                status, headers = response.status, dict(response.headers.items())
                body = response.read(MAX_HTTP_BYTES + 1)
        except urllib.error.HTTPError as exc:
            status = exc.code
            headers = dict(exc.headers.items()) if exc.headers else {}
            try:
                with exc:
                    body = exc.read(MAX_HTTP_BYTES + 1)
            except Exception as read_error:
                error = f"{type(read_error).__name__}:{str(read_error)[:180]}"
        except Exception as exc:
            error = f"{type(exc).__name__}:{str(exc)[:180]}"
        if len(body) > MAX_HTTP_BYTES:
            body, error = b"", "response_exceeded_2MiB"
        elif self.retained_bytes + len(body) > self.max_bytes:
            body, error = b"", "snapshot_batch_budget_exceeded"
        self.retained_bytes += len(body)
        snapshot = (status, headers, body, error, observed_at)
        self._snapshots[url] = snapshot
        return snapshot

    def stats(self):
        return {"http_requests": self.fetch_count, "snapshot_reuses": self.reuse_count,
                "retained_body_bytes": self.retained_bytes, "max_body_bytes": self.max_bytes,
                "reuse_scope": "same_run_same_url_not_independent_witnesses"}



def http_probe(spec, *, snapshots=None, archive_dir=None):
    url = spec["url"]
    allowed = set(spec.get("allowed_status") or [200])
    snapshots = snapshots if snapshots is not None else HttpSnapshotBatch()
    status, headers, body, error, observed_at = snapshots.get(url)
    if error or status not in allowed:
        return {"kind": "http", "source": url, "state": "INCONCLUSIVE",
                "http": status, "reason": error or f"unexpected_status:{status}",
                "observed_at": observed_at}
    result = {"kind": "http", "source": url, "state": "OBSERVED", "http": status,
              "sha256": sha(body), "bytes": len(body), "observed_at": observed_at,
              "etag": headers.get("ETag") or headers.get("Etag"),
              "last_modified": headers.get("Last-Modified")}
    if spec.get("signed_content_identity") == "corrections-v1":
        content_id, reason = corrections_content_id(body)
        if reason:
            result.update(state="INCONCLUSIVE", reason=reason)
        else:
            if archive_dir is not None:
                try:
                    archive_signed_corrections(body, content_id, archive_dir)
                    result["signed_body_archive"] = "signed-corrections/" + content_id + ".json"
                except (OSError, ValueError, TypeError) as exc:
                    result.update(state="INCONCLUSIVE", reason="signed_archive_failed:" + type(exc).__name__)
                    return result
            result["signed_content_id"] = content_id
            result["identity_rule"] = "verified_corrections_signed_body_v1"
    return result



def file_probe(spec):
    path = ROOT / spec["path"]
    if not path.is_file():
        return {
            "kind": "file",
            "source": spec["path"],
            "state": "INCONCLUSIVE",
            "reason": "missing_file",
        }
    data = path.read_bytes()
    return {
        "kind": "file",
        "source": spec["path"],
        "state": "OBSERVED",
        "sha256": sha(data),
        "bytes": len(data),
        "mtime_ns": path.stat().st_mtime_ns,
    }


def glob_probe(spec):
    rows = []
    for path in sorted(ROOT.glob(spec["pattern"])):
        if not path.is_file():
            continue
        try:
            data = path.read_bytes()
        except OSError:
            continue
        rows.append(
            {
                "path": str(path.relative_to(ROOT)),
                "sha256": sha(data),
                "bytes": len(data),
            }
        )
    if not rows:
        return {
            "kind": "glob",
            "source": spec["pattern"],
            "state": "INCONCLUSIVE",
            "reason": "no_matching_files",
        }
    return {
        "kind": "glob",
        "source": spec["pattern"],
        "state": "OBSERVED",
        "sha256": sha(canonical(rows)),
        "files": len(rows),
        "bytes": sum(row["bytes"] for row in rows),
    }


def run_probe(spec, *, snapshots=None, archive_dir=None):
    kind = spec.get("kind")
    if kind == "http":
        return http_probe(spec, snapshots=snapshots, archive_dir=archive_dir)
    if kind == "file":
        return file_probe(spec)
    if kind == "glob":
        return glob_probe(spec)
    return {
        "kind": kind,
        "source": str(spec),
        "state": "INCONCLUSIVE",
        "reason": "unsupported_probe_kind",
    }



def loop_fingerprint(loop, probes, dependencies):
    material = {
        "id": loop["id"],
        "probes": [
            {
                "source": row.get("source"),
                "state": row.get("state"),
                "sha256": (row.get("signed_content_id") if row.get("identity_rule") == "verified_corrections_signed_body_v1" else row.get("sha256")),
                "http": row.get("http"),
                "etag": (None if row.get("identity_rule") == "verified_corrections_signed_body_v1" else row.get("etag")),
            }
            for row in probes
        ],
        "dependencies": dependencies,
    }
    return sha(canonical(material))


def merkle_root(digests):
    level = [bytes.fromhex(d) for d in digests if d]
    if not level:
        return sha(b"")
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [
            hashlib.sha256(level[i] + level[i + 1]).digest()
            for i in range(0, len(level), 2)
        ]
    return level[0].hex()


def root_freshness_special(receipt, *, snapshots=None):
    if receipt["id"] != "H-01":
        return
    snapshots = snapshots if snapshots is not None else HttpSnapshotBatch()
    spec = {"kind": "http", "url": "https://councilof.ai/root.json"}
    raw = http_probe(spec, snapshots=snapshots)
    receipt["freshness_source_sha256"] = raw.get("sha256")
    receipt["freshness_observed_at"] = raw.get("observed_at")
    try:
        if raw["state"] != "OBSERVED":
            raise ValueError("root_snapshot_inconclusive")
        payload = json.loads(snapshots.get(spec["url"])[2])
        source_as_of = payload.get("as_of")
        if not isinstance(source_as_of, str) or not source_as_of:
            raise ValueError("root_source_time_missing")
        observed = datetime.fromisoformat(source_as_of.replace("Z", "+00:00"))
        if observed.tzinfo is None:
            raise ValueError("root_source_time_has_no_timezone")
        receipt["source_as_of"] = source_as_of
        age = (now() - observed.astimezone(UTC)).total_seconds()
        receipt["source_age_seconds"] = round(age, 1)
        receipt["freshness_state"] = ("FRESH_WITHIN_60M" if 0 <= age <= 3600
                                      else "STALE_OVER_60M" if age > 3600
                                      else "INCONCLUSIVE_FUTURE_SOURCE_TIME")
    except Exception as exc:
        receipt["freshness_state"] = "INCONCLUSIVE"
        receipt["freshness_error"] = type(exc).__name__



def axis_touch(*, snapshots=None):
    snapshots = snapshots if snapshots is not None else HttpSnapshotBatch()
    spec = {"kind": "http", "url": "https://councilof.ai/api/gspc"}
    raw = http_probe(spec, snapshots=snapshots)
    result = {"state": raw["state"], "source": spec["url"], "sha256": raw.get("sha256"),
              "observed_at": raw.get("observed_at"), "axes": [], "axis_count": None,
              "measured": None, "unmeasured": None,
              "claim_boundary": "This touch observes the roster in the exact hashed HTTP snapshot. It is not a new axis measurement or an independent second witness."}
    if raw["state"] != "OBSERVED":
        result["reason"] = raw.get("reason")
        return result
    try:
        payload = json.loads(snapshots.get(spec["url"])[2])
        axes = payload.get("axes") if isinstance(payload, dict) else None
        if not isinstance(axes, list) or not all(isinstance(row, dict) for row in axes):
            raise ValueError("axes_must_be_array_of_objects")
        if any(not isinstance(row.get("axis"), str) or not row["axis"].strip()
               or not isinstance(row.get("status"), str) or not row["status"].strip()
               for row in axes):
            raise ValueError("axis_identity_and_status_required")
        if len({row["axis"] for row in axes}) != len(axes):
            raise ValueError("duplicate_axis_identity")
        result["axes"] = [{"axis": row["axis"], "status": row["status"]} for row in axes]
        result["axis_count"] = len(axes)
        result["measured"] = sum(row.get("status") == "MEASURED" for row in axes)
        result["unmeasured"] = len(axes) - result["measured"]
    except Exception as exc:
        result["state"], result["reason"] = "INCONCLUSIVE", type(exc).__name__
    return result



def append_jsonl(path: Path, row) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(row, sort_keys=True) + "\n")
        stream.flush()
        os.fsync(stream.fileno())


def next_observed_state(prior, receipt):
    """Retain the last good comparison baseline across inconclusive probes."""
    if receipt["state"] == "OBSERVED":
        return {
            "fingerprint": receipt["fingerprint"],
            "observed_at": receipt["observed_at"],
            "state": "OBSERVED",
            **({"transition_id": receipt["transition_id"]} if receipt.get("transition_id") else {}),
        }
    if isinstance(prior, dict) and prior.get("state") == "OBSERVED":
        return prior
    return {"state": "INCONCLUSIVE", "observed_at": receipt["observed_at"]}


def validate_loop_graph(loops):
    """Fail before state writes on duplicate IDs or non-topological dependencies."""
    seen = set()
    for loop in loops:
        if not isinstance(loop, dict):
            raise ValueError("loop must be an object")
        ident = loop.get("id")
        deps = loop.get("depends_on", [])
        if not isinstance(ident, str) or not ident or ident in seen:
            raise ValueError("loop IDs must be nonempty and unique")
        if not isinstance(deps, list) or not all(isinstance(dep, str) for dep in deps):
            raise ValueError("depends_on must be a list of IDs")
        if len(deps) != len(set(deps)) or any(dep not in seen for dep in deps):
            raise ValueError("dependencies must be unique and precede their consumer")
        seen.add(ident)


def validate_loop_plan(loops):
    """Validate the fixed 40-loop plan using the installed graph validator."""
    if not isinstance(loops, list) or len(loops) != 40:
        raise ValueError("manifest must contain exactly 40 loops")
    validate_loop_graph(loops)
    if any(not isinstance(loop.get("probes", []), list) for loop in loops):
        raise ValueError("probes must be an array")
    if "H-40" not in {loop["id"] for loop in loops}:
        raise ValueError("receipt-of-receipts loop H-40 missing")


def classify_loop(loop, probes, by_id):
    blocked = []
    for dep in loop.get("depends_on", []):
        upstream = by_id.get(dep)
        fingerprint = upstream.get("fingerprint") if isinstance(upstream, dict) else None
        if (not isinstance(upstream, dict) or upstream.get("state") != "OBSERVED"
                or not isinstance(fingerprint, str) or len(fingerprint) != 64
                or any(c not in "0123456789abcdef" for c in fingerprint)):
            blocked.append(dep)
    observed = (bool(probes or loop.get("depends_on")) and not blocked
                and all(row.get("state") == "OBSERVED" for row in probes))
    return ("OBSERVED" if observed else "INCONCLUSIVE"), blocked



# Review handoffs extend this engine only. They never dispatch its action names.
CHAIN_REVISION = "csoai.review-chain/0.1"
MAX_QUEUE_BYTES = 16 * 1024 * 1024
MAX_CANDIDATES_PER_RUN = 40


def valid_fingerprint(value):
    return isinstance(value, str) and len(value) == 64 and all(c in "0123456789abcdef" for c in value)


def transition_identity(prior, receipt):
    """A content transition, not an hour: recurrence after another state is new work."""
    if receipt.get("state") != "OBSERVED" or not valid_fingerprint(receipt.get("fingerprint")):
        return None
    prior = prior if isinstance(prior, dict) else {}
    prior_fp = prior.get("fingerprint")
    previous_id = prior.get("transition_id")
    if prior_fp == receipt["fingerprint"] and valid_fingerprint(previous_id):
        return previous_id
    return sha(canonical({"loop": receipt["id"], "from": prior_fp,
                          "to": receipt["fingerprint"], "previous_transition": previous_id}))


def review_graph(loops, handoffs):
    """Soft work-routing links do not change the underlying observation contracts."""
    import heapq
    by_id = {loop["id"]: loop for loop in loops}
    parents = {ident: set(loop.get("depends_on", [])) for ident, loop in by_id.items()}
    if not isinstance(handoffs, dict):
        raise ValueError("review_handoffs must be an object")
    for parent, children in handoffs.items():
        if parent not in by_id or not isinstance(children, list) or len(children) != len(set(children)):
            raise ValueError("invalid review handoff source or targets")
        for child in children:
            if child not in by_id or child == parent:
                raise ValueError("unknown or self review handoff")
            parents[child].add(parent)
    children = {ident: set() for ident in by_id}
    for child, upstream in parents.items():
        for parent in upstream:
            if parent not in by_id:
                raise ValueError("unknown dependency")
            children[parent].add(child)
    degree = {ident: len(upstream) for ident, upstream in parents.items()}
    ready = [ident for ident, n in degree.items() if n == 0]
    heapq.heapify(ready); order = []
    while ready:
        ident = heapq.heappop(ready); order.append(ident)
        for child in sorted(children[ident]):
            degree[child] -= 1
            if degree[child] == 0: heapq.heappush(ready, child)
    if len(order) != len(by_id):
        raise ValueError("review handoff cycle; feedback must be a later observed transition")
    return order, parents, children


def queued_work_keys(path):
    """Fail closed rather than erase or reinterpret malformed queue history."""
    if not path.exists(): return set()
    if path.stat().st_size > MAX_QUEUE_BYTES:
        raise ValueError("queue exceeds bounded history scan; operator rotation required")
    keys = set()
    with path.open("rb") as stream:
        for number, line in enumerate(stream, 1):
            if not line.strip(): continue
            if len(line) > 65536: raise ValueError("oversized queue record")
            try: row = json.loads(line)
            except (ValueError, UnicodeError) as exc:
                raise ValueError("unreadable queue record " + str(number)) from exc
            if not isinstance(row, dict) or not isinstance(row.get("candidate_id"), str):
                raise ValueError("invalid queue record " + str(number))
            key = row.get("work_key", row["candidate_id"])
            if not isinstance(key, str) or not key: raise ValueError("invalid work identity")
            keys.add(key)
    return keys


def plan_review_chain(loops, receipts, handoffs, seen=None, pending=None):
    """One joined, idempotent review plan; waiting work is not executed work."""
    order, parents, children = review_graph(loops, handoffs)
    definitions = {x["id"]: x for x in loops}
    rows = {x["id"]: x for x in receipts}
    seen = set() if seen is None else set(seen)
    graph_id = sha(canonical({"revision": CHAIN_REVISION,
        "parents": {k: sorted(v) for k,v in parents.items()},
        "actions": {k: v.get("deep_action") for k,v in definitions.items()}}))
    pending = {} if pending is None else pending
    if not isinstance(pending, dict) or len(pending) > 40:
        raise ValueError("invalid deferred review triggers")
    seeds = {}; superseded = []
    for ident, seed in pending.items():
        if ident not in definitions or not isinstance(seed, dict) or not valid_fingerprint(seed.get("transition_id")) or not valid_fingerprint(seed.get("fingerprint")):
            raise ValueError("invalid deferred transition identity")
        current = rows.get(ident, {})
        if current.get("state") == "OBSERVED" and current.get("fingerprint") != seed["fingerprint"]:
            superseded.append({"loop_id":ident,"transition_id":seed["transition_id"],"reason":"later observed source transition"})
        else: seeds[ident] = seed
    for ident, row in rows.items():
        if ident != "H-40" and row.get("state") == "OBSERVED" and row.get("delta") == "CHANGED":
            cause = row.get("transition_id") or row.get("receipt_hash")
            if valid_fingerprint(cause) and valid_fingerprint(row.get("fingerprint")):
                seeds[ident] = {"transition_id":cause,"fingerprint":row["fingerprint"],"source_receipt_hash":row.get("receipt_hash")}
    causes = {ident: {} for ident in order}
    defer = set()
    blocked = []; blocked_ids = set(); jobs = {}; newly_queued = []
    for ident in order:
        row = rows.get(ident, {})
        if ident in seeds: causes[ident][ident] = seeds[ident]["transition_id"]
        for parent in parents[ident]: causes[ident].update(causes[parent])
        if not causes[ident]: continue
        required = parents[ident] | {ident}
        missing = sorted(key for key in required if rows.get(key, {}).get("state") != "OBSERVED"
                         or not valid_fingerprint(rows.get(key, {}).get("fingerprint")))
        missing = sorted(set(missing) | (parents[ident] & blocked_ids))
        if missing:
            blocked_ids.add(ident)
            if ident != "H-40" and definitions[ident].get("deep_action"): defer.update(causes[ident])
            blocked.append({"loop_id": ident, "state": "HOLD_SOURCE_EVIDENCE",
                            "sources": missing, "trigger_loops": sorted(causes[ident])})
            continue
        if ident == "H-40" or not definitions[ident].get("deep_action"): continue
        upstream = [jobs[parent]["candidate_id"] for parent in sorted(parents[ident]) if parent in jobs]
        key = sha(canonical({"graph": graph_id, "loop": ident,
            "action": definitions[ident]["deep_action"], "source": row["fingerprint"],
            "causes": causes[ident]}))
        candidate = {
            "schema": "csoai.deep-measurement-candidate/0.1", "candidate_id": key[:24], "work_key": key,
            "created_at": row.get("observed_at"), "loop_id": ident,
            "action": definitions[ident]["deep_action"], "state": "QUEUED_INTERNAL_REVIEW",
            "readiness": "WAITING_FOR_UPSTREAM_REVIEW" if upstream else "READY_FOR_REVIEW",
            "reason": "CHANGED" if row.get("delta") == "CHANGED" else "UPSTREAM_CHANGED",
            "source_fingerprint": row["fingerprint"], "source_receipt_hash": row.get("receipt_hash"),
            "trigger_transitions": causes[ident], "depends_on_candidate_ids": upstream,
            "source_dependencies": {key: rows[key]["fingerprint"] for key in sorted(parents[ident])},
            "chain_revision": CHAIN_REVISION, "graph_id": graph_id,
            "execution": "not_performed", "publication": "not_performed", "payment": "not_performed",
            "signing": "not_performed", "model_training": "not_authorized", "cost_authorized": None,
            "claim_boundary": "Review-routing intent only. Requires scoped owner approval and actual upstream result receipts; no execution, delivery, buyer acceptance or revenue is inferred.",
        }
        jobs[ident] = candidate
        if key not in seen and candidate["candidate_id"] not in seen:
            newly_queued.append(candidate); seen.add(key)
    if len(newly_queued) > MAX_CANDIDATES_PER_RUN:
        raise ValueError("candidate limit exceeded; preserve baseline for later review")
    plan = {"schema": CHAIN_REVISION, "graph_id": graph_id, "loop_count": len(loops),
            "handoff_edge_count": sum(len(v) for v in parents.values()),
            "planned": len(jobs), "new": len(newly_queued), "already_queued": len(jobs)-len(newly_queued),
            "blocked": blocked, "jobs": list(jobs.values()),
            "pending_triggers": {key: seeds[key] for key in sorted(defer)},
            "superseded_pending": superseded, "scheduler": "existing-standing-cycle",
            "execution": "disabled", "publication": "disabled", "payment": "disabled",
            "feedback_rule": "A later observed content transition re-enters; a timer tick alone does not."}
    return plan, newly_queued


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    manifest = load_json(args.manifest)
    loops = manifest.get("loops")
    validate_loop_plan(loops)
    handoffs = manifest.get("review_handoffs", {})
    review_graph(loops, handoffs)

    args.state.mkdir(parents=True, exist_ok=True)
    with (args.state / "engine.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0

        seen_work = queued_work_keys(args.state / "deep-candidates.jsonl")
        observed = now()
        hour_key = observed.strftime("%Y-%m-%dT%H")
        latest_path = args.state / "latest.json"
        prior_run = load_json(latest_path)
        if prior_run.get("hour_key") == hour_key and not args.force:
            print(json.dumps({"state": "ALREADY_TOUCHED", "hour_key": hour_key}))
            return 0

        previous = load_json(args.state / "loop-state.json", default={})
        current_state = {}
        receipts = []
        by_id = {}
        candidates = []
        snapshots = HttpSnapshotBatch()
        for loop in loops:
            probes = [run_probe(spec, snapshots=snapshots, archive_dir=args.state / "signed-corrections") for spec in loop.get("probes", [])]
            dep_hashes = {
                dep: (by_id.get(dep) or {}).get("fingerprint")
                for dep in loop.get("depends_on", [])
            }
            fingerprint = loop_fingerprint(loop, probes, dep_hashes)
            prior = previous.get(loop["id"]) if isinstance(previous, dict) else None
            prior_fp = prior.get("fingerprint") if isinstance(prior, dict) else None
            dependency_states = {
                dep: (by_id.get(dep) or {}).get("state", "MISSING")
                for dep in loop.get("depends_on", [])
            }
            state, blocked_dependencies = classify_loop(loop, probes, by_id)
            if any(not valid_fingerprint(row.get("signed_content_id") or row.get("sha256")) for row in probes):
                state = "INCONCLUSIVE"
            delta = (
                "BASELINE"
                if prior_fp is None
                else ("CHANGED" if fingerprint != prior_fp else "UNCHANGED")
            )
            receipt = {
                "schema": "csoai.hourly-loop-receipt/0.1",
                "id": loop["id"],
                "family": loop["family"],
                "name": loop["name"],
                "observed_at": stamp(observed),
                "state": state,
                "delta": delta,
                "fingerprint": fingerprint,
                "related_axes": loop.get("related_axes", []),
                "probes": probes,
                "dependencies": dep_hashes,
                "dependency_states": dependency_states,
                "blocked_dependencies": blocked_dependencies,
                "execution_authority": "none",
                "publication_authority": "none",
                "claim_boundary": loop.get("claim_boundary"),
            }
            receipt["transition_id"] = transition_identity(prior, receipt)
            root_freshness_special(receipt, snapshots=snapshots)
            receipt["receipt_hash"] = sha(canonical(receipt))
            receipts.append(receipt)
            by_id[loop["id"]] = receipt
            # A failed probe is retained in the receipt, but must not replace
            # the last observed baseline: recovery alone is not a content change.
            current_state[loop["id"]] = next_observed_state(prior, receipt)

        chain_review, candidates = plan_review_chain(loops, receipts, handoffs, seen_work,
            (prior_run.get("review_chain") or {}).get("pending_triggers", {}))

        axis = axis_touch(snapshots=snapshots)
        digest_inputs = [row["receipt_hash"] for row in receipts if row["id"] != "H-40"]
        hour_root = merkle_root(digest_inputs)
        h40 = by_id["H-40"]
        h40["hourly_merkle_root"] = hour_root
        h40["leaf_count"] = len(digest_inputs)
        h40["receipt_assembly_state"] = "ASSEMBLED"
        h40["evidence_coverage_state"] = "COMPLETE_OBSERVATIONS" if all(row["state"] == "OBSERVED" for row in receipts if row["id"] != "H-40") else "PARTIAL_OBSERVATIONS"
        h40["signing_state"] = "UNSIGNED_LOCAL_RESEARCH"
        h40["anchoring_state"] = "NOT_ATTEMPTED"
        h40["receipt_hash"] = sha(canonical({k: v for k, v in h40.items() if k != "receipt_hash"}))

        report = {
            "schema": "csoai.hourly-loop-run/0.1",
            "hour_key": hour_key,
            "observed_at": stamp(observed),
            "execution": "disabled",
            "publication": "disabled",
            "scheduler": "existing-standing-cycle",
            "loop_count": len(receipts),
            "observed_loops": sum(row["state"] == "OBSERVED" for row in receipts),
            "inconclusive_loops": sum(row["state"] != "OBSERVED" for row in receipts),
            "changed_loops": sum(row["delta"] == "CHANGED" for row in receipts),
            "baseline_loops": sum(row["delta"] == "BASELINE" for row in receipts),
            "deep_candidates_created": len(candidates),
            "review_chain": chain_review,
            "axis_touch": axis,
            "acquisition": snapshots.stats(),
            "hourly_merkle_root": hour_root,
            "receipts": receipts,
            "claim_boundary": (
                "An hourly touch receipt proves only the declared probe was observed. "
                "UNCHANGED means the cheap fingerprint did not change, not that the "
                "entire external population was re-downloaded. Deep candidates do not "
                "mean deep measurement executed."
            ),
        }
        report["content_hash"] = sha(canonical(report))

        # Existing lock + stable work IDs make partial appends replay-safe.
        for candidate in candidates:
            append_jsonl(args.state / "deep-candidates.jsonl", candidate)
        # Persist deferred triggers before advancing comparison baselines.
        atomic_json(latest_path, report)
        atomic_json(args.state / "loop-state.json", current_state)
        history = args.state / "history" / (hour_key.replace(":", "") + ".json")
        atomic_json(history, report)
        print(json.dumps({
            "hour_key": hour_key,
            "loops": len(receipts),
            "observed": report["observed_loops"],
            "inconclusive": report["inconclusive_loops"],
            "changed": report["changed_loops"],
            "deep_candidates": len(candidates),
            "axes": axis.get("axis_count"),
            "axis_measured": axis.get("measured"),
            "axis_unmeasured": axis.get("unmeasured"),
            "merkle_root": hour_root,
            "content_hash": report["content_hash"],
        }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

