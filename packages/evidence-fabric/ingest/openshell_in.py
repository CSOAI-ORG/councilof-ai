#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""openshell-adapter rows.json (declared policy vs enforcer record vs independent witness) -> evidence events.

    python3 ingest/openshell_in.py OUT/rows.json --read-at 2026-09-28T13:43:00Z --control DIVERGENT > events.jsonl

One event per row. Supplied HELD/DIVERGED labels map to CONSISTENT/DIVERGENT only
with a recognized typed witness outcome; absent or unknown outcomes remain UNMEASURED.
This importer does not authenticate the supplied report or recompute its policy comparison.
--control is the result the adapter returned on its must-fail fixture in the same run (it must be DIVERGENT);
anything else makes every event NOT_DISCRIMINATING. The OpenShell OCSF records the adapter reads are the input;
this is the OUTPUT side: render/ocsf.py turns these events into OCSF Detection Findings.

Typed witness outcomes reuse the package's canonical openshell_witness.py module,
also used by the harness adapter. The generated standalone distribution carries
the same module; no harness checkout or duplicate rules are required.
"""
import argparse, hashlib, json, os, sys
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

STATE = {"HELD": "CONSISTENT", "DIVERGED": "DIVERGENT"}
IMPORTER_VERSION = "0.2.1"
_HELPER_PATH = Path(__file__).resolve().parents[1] / "openshell_witness.py"
_WITNESS_OUTCOME = None


def _witness_reader():
    global _WITNESS_OUTCOME
    if _WITNESS_OUTCOME is None:
        try:
            import openshell_witness as W
            if Path(W.__file__).resolve() != _HELPER_PATH.resolve() or not _HELPER_PATH.is_file():
                raise ImportError
            _WITNESS_OUTCOME = W.witness_outcome
            if not callable(_WITNESS_OUTCOME):
                raise AttributeError
        except (OSError, ImportError, AttributeError, TypeError, SyntaxError):
            _WITNESS_OUTCOME = None
            raise RuntimeError("Canonical OpenShell witness helper unavailable; restore the complete package.") from None
    return _WITNESS_OUTCOME


def _method_pin():
    """Identify the local importer and its canonical witness-rule dependency."""
    try:
        pins = {"evidence-fabric/openshell_witness.py": hashlib.sha256(_HELPER_PATH.read_bytes()).hexdigest(),
                "evidence-fabric/ingest/openshell_in.py": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    except OSError:
        raise RuntimeError("Canonical OpenShell witness helper unavailable; restore the complete package.") from None
    return hashlib.sha256(E.jcs(pins)).hexdigest()


def ingest(raw, *, read_at, control, subject, source_url=None):
    d = json.loads(raw)
    if not isinstance(d, dict) or not isinstance(d.get("rows"), list):
        raise ValueError("OpenShell rows report must contain a row list.")
    # Validate the complete batch before building or returning any events. A row
    # identity cannot refer to two reports or count twice in a canonical batch.
    seen = set()
    for r in d["rows"]:
        if not isinstance(r, dict) or type(r.get("row")) is not int or r["row"] <= 0 or r["row"] in seen:
            raise ValueError("OpenShell row identities must be unique positive integers.")
        seen.add(r["row"])
        if "comparison" in r and not isinstance(r["comparison"], str):
            raise ValueError("OpenShell comparison labels must be strings when supplied.")
        if any(not isinstance(r.get(k, {}), dict) for k in ("attempt", "declared", "enforcer")) \
                or (r.get("witness") is not None and not isinstance(r["witness"], dict)):
            raise ValueError("OpenShell row records have an unsupported shape.")
    outcome_of = _witness_reader()
    method_pin = _method_pin()
    sha = hashlib.sha256(raw).hexdigest()
    ad = d.get("adapter", {})
    if not isinstance(ad, dict) or not isinstance(d.get("inputs", {}), dict):
        raise ValueError("OpenShell report metadata has an unsupported shape.")
    out = []
    for r in d["rows"]:
        witness = r.get("witness")
        outcome = outcome_of(witness) if isinstance(witness, dict) and witness.get("kind") == r.get("kind") else None
        st = STATE.get(r.get("comparison"), "UNMEASURED") if outcome is not None else "UNMEASURED"
        if control != "DIVERGENT" and st in ("CONSISTENT", "DIVERGENT"):
            st = "NOT_DISCRIMINATING"
        nc = ({"id": "must-fail-deny-declared-egress", "expected": "DIVERGENT", "got": "DIVERGENT"} if control == "DIVERGENT"
              else {"id": "must-fail-deny-declared-egress", "expected": None, "got": control or "NOT_RUN"})
        a = r.get("attempt", {})
        what = f"{r.get('kind')} {a.get('method', '')} {a.get('host', a.get('path', ''))}:{a.get('port', '')}{a.get('path', '') if a.get('host') else ''}".strip()
        out.append(E.build(
            subject={"kind": "sandbox_run", "locator": f"{subject}#row-{r.get('row')}", "declared_by": f"policy sha256:{d.get('inputs', {}).get('policy_sha256')}"},
            claim={"text": f"The sandbox policy declares {r.get('declared', {}).get('effect')} for {what}; the enforcer recorded "
                           f"{r.get('enforcer', {}).get('claim')}; the supplied witness reports effect={outcome}.",
                   "source_url": source_url, "source_sha256": sha, "read_at": read_at},
            method={"id": "openshell-declared-observed", "version": IMPORTER_VERSION, "code_sha256": method_pin, "holder": "csoai"},
            declared=r.get("declared"), observed={"enforcer": r.get("enforcer"), "witness": r.get("witness"), "comparison": r.get("comparison"), "code": r.get("code"),
                                                "source_adapter_declared": {"name": ad.get("name"), "version": ad.get("version")}},
            state=st, value=None, negative_control=nc,
            limits=["One sandbox run: rows describe these attempts, not every path the policy allows or denies.",
                    "The supplied witness outcome is not authenticated here; missing or unknown outcomes remain UNMEASURED.",
                    "The negative-control result is caller-supplied; this import does not rerun or authenticate that control.",
                    "The supplied comparison label is not recomputed here; source-byte hashes do not prove the adapter ran.",
                    "OpenShell is NVIDIA's (Apache-2.0); this is our adapter, not an NVIDIA integration."]))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("rows"); ap.add_argument("--read-at", required=True); ap.add_argument("--control", required=True)
    ap.add_argument("--subject", default="urn:example:openshell-sandbox"); ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    try:
        with open(a.rows, "rb") as fh:
            events = ingest(fh.read(), read_at=a.read_at, control=a.control, subject=a.subject, source_url=a.source_url)
    except (OSError, ValueError, RuntimeError):
        sys.stderr.write("OpenShell import refused: invalid rows or canonical witness helper unavailable. No events emitted.\n")
        return 2
    for ev in events:
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
