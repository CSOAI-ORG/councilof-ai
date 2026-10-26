#!/usr/bin/env python3
"""Generate a pre-build CycloneDX 1.5 inventory from the committed npm lockfile.

Versions and licence/integrity strings are lockfile declarations, not observations
of installed or deployed packages, verified licences, or vulnerability findings.
No package install, registry lookup, audit, signing or payment is performed.
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from urllib.parse import quote

VERSION = "2.0"
SECTIONS = ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies")
EXACT_VERSION = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$")

def sha256(raw):
    return hashlib.sha256(raw).hexdigest()

def load_json(raw):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            if key in value:
                raise ValueError("Duplicate JSON key: " + key)
            value[key] = item
        return value
    return json.loads(raw, object_pairs_hook=unique)

def build_sbom(package, lock, commit, source_hashes, timestamp=None):
    if not re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", commit):
        raise ValueError("A full source commit is required")
    if lock.get("lockfileVersion") not in (2, 3) or not isinstance(lock.get("packages"), dict):
        raise ValueError("npm lockfile v2/v3 packages inventory is required")
    root = lock["packages"].get("")
    if not isinstance(root, dict):
        raise ValueError("Lockfile root package is missing")
    for section in SECTIONS:
        if package.get(section, {}) != root.get(section, {}):
            raise ValueError("Manifest and lockfile root differ: " + section)
    for field in ("name", "version"):
        if not isinstance(package.get(field), str) or not package[field]:
            raise ValueError("Package name/version is required")
        if root.get(field, package[field]) != package[field]:
            raise ValueError("Manifest and lockfile root differ: " + field)
    for name in ("package.json", "package-lock.json"):
        if not re.fullmatch(r"[0-9a-f]{64}", source_hashes.get(name, "")):
            raise ValueError("Exact input SHA-256 is required: " + name)
    components = []
    missing_licences = 0
    for path, item in sorted(lock["packages"].items()):
        if not path:
            continue
        if not path.startswith("node_modules/") or not isinstance(item, dict) or item.get("link"):
            raise ValueError("Unsupported unresolved lockfile package: " + path)
        name = item.get("name") or path.rsplit("node_modules/", 1)[-1]
        version = item.get("version")
        if not isinstance(name, str) or not name or not isinstance(version, str) or not EXACT_VERSION.fullmatch(version):
            raise ValueError("Exact lockfile package name/version required: " + path)
        properties = [
            {"name": "csoai:lockfile:path", "value": path},
            {"name": "csoai:lockfile:development-only", "value": str(bool(item.get("dev"))).lower()},
            {"name": "csoai:lockfile:optional", "value": str(bool(item.get("optional"))).lower()},
            {"name": "csoai:version:evidence", "value": "committed npm package-lock.json declaration; not installed/deployed observation"},
        ]
        component = {
            "type": "library",
            "bom-ref": "npm-lock:" + sha256(path.encode("utf-8")),
            "name": name,
            "version": version,
            "purl": "pkg:npm/" + quote(name, safe="/") + "@" + quote(version, safe=""),
            "scope": "optional" if item.get("optional") else "required",
            "properties": properties,
        }
        licence = item.get("license")
        if isinstance(licence, str) and licence.strip():
            # Preserve the publisher's literal declaration; do not invent SPDX IDs,
            # parse expressions as grants, or claim review of licence text/notices.
            component["licenses"] = [{"license": {"name": licence}}]
            properties.append({"name": "csoai:license:evidence", "value": "lockfile declaration only; text, authority and obligations not verified"})
        else:
            missing_licences += 1
            properties.append({"name": "csoai:license:evidence", "value": "UNRECORDED"})
        integrity = item.get("integrity")
        if isinstance(integrity, str) and integrity:
            properties.append({"name": "csoai:lockfile:integrity-declaration", "value": integrity})
        components.append(component)
    now = timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "serialNumber": "urn:uuid:" + str(uuid.uuid4()),
        "version": 1,
        "metadata": {
            "timestamp": now,
            "lifecycles": [{"phase": "pre-build"}],
            "tools": [{"name": "scripts/gen_sbom.py", "version": VERSION}],
            "component": {"type": "application", "name": package["name"], "version": package["version"],
                          "bom-ref": "source:" + commit},
            "properties": [
                {"name": "repo", "value": "github.com/CSOAI-ORG/councilof-ai"},
                {"name": "commit", "value": commit},
                {"name": "package.json:sha256", "value": source_hashes["package.json"]},
                {"name": "package-lock.json:sha256", "value": source_hashes["package-lock.json"]},
                {"name": "csoai:lockfile:version", "value": str(lock["lockfileVersion"])},
                {"name": "csoai:license:unrecorded-count", "value": str(missing_licences)},
                {"name": "scope_notes", "value":
                 "All node_modules package entries in the committed npm lockfile, including transitive, development and optional declarations. "
                 "Scopes describe this pre-build inventory; development/optional roles remain explicit properties. "
                 "Not an installed, bundled or deployed inventory; platform selection and the dependency graph are not assessed. "
                 "Licence and integrity declarations are retained, not independently verified; required notices and operating rights remain separate. "
                 "Python/native/system dependencies, vulnerability status and absence of any particular dependency are not assessed."},
            ],
        },
        "components": components,
    }


def stable_projection(document):
    # Only generation-time metadata varies; retain every other output field.
    value = json.loads(json.dumps(document))
    value.pop("serialNumber", None)
    metadata = value.get("metadata", {})
    metadata.pop("timestamp", None)
    metadata["properties"] = sorted(
        [p for p in metadata.get("properties", []) if p.get("name") != "commit"],
        key=lambda p: (p.get("name", ""), p.get("value", "")))
    if isinstance(metadata.get("component"), dict):
        metadata["component"]["bom-ref"] = "source:GENERATION_COMMIT"
    value["components"] = sorted(value.get("components", []), key=lambda c: c.get("bom-ref", ""))
    return value

def check_output(stored, fresh, package_raw, lock_raw, read_pinned):
    metadata = stored.get("metadata", {})
    commits = [p.get("value") for p in metadata.get("properties", []) if p.get("name") == "commit"]
    if len(commits) != 1 or not isinstance(commits[0], str) or not re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", commits[0]):
        raise ValueError("Stored SBOM needs one full generation-time commit")
    recorded = commits[0]
    serial = stored.get("serialNumber")
    if not isinstance(serial, str) or not re.fullmatch(r"urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", serial):
        raise ValueError("Stored SBOM generation UUID is invalid")
    stamp = metadata.get("timestamp")
    rfc3339 = (r"[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])[Tt]"
               r"(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?"
               r"(?:[Zz]|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])")
    if not isinstance(stamp, str) or not re.fullmatch(rfc3339, stamp):
        raise ValueError("Stored SBOM timestamp needs supported RFC3339 syntax")
    observed = datetime.datetime.fromisoformat(stamp.replace("Z", "+00:00").replace("z", "+00:00"))
    if observed.tzinfo is None:
        raise ValueError("Stored SBOM timestamp needs a timezone")
    if metadata.get("component", {}).get("bom-ref") != "source:" + recorded:
        raise ValueError("Stored SBOM root reference differs from recorded commit")
    for relative, raw in (("package.json", package_raw), ("package-lock.json", lock_raw)):
        # The recorded commit may precede the commit containing the generated BOM.
        # Verify its actual inputs rather than requiring an impossible self-reference.
        if read_pinned(recorded, relative) != raw:
            raise ValueError("Stored SBOM source inputs are stale: " + relative)
    if stable_projection(stored) != stable_projection(fresh):
        raise ValueError("Stored SBOM detailed inventory differs; regenerate it")
    return True

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true", help="Read-only detailed output/source parity; refuses missing pinned history")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    output = args.output or root / "public/interop/sbom-councilof-ai.json"
    temporary = None
    try:
        package_raw = (root / "package.json").read_bytes()
        lock_raw = (root / "package-lock.json").read_bytes()
        commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, check=True,
                                capture_output=True, text=True).stdout.strip()
        for relative, original in (("package.json", package_raw), ("package-lock.json", lock_raw)):
            pinned = subprocess.run(["git", "show", commit + ":" + relative], cwd=root,
                                    check=True, capture_output=True).stdout
            if pinned != original:
                raise ValueError("Input differs from source commit: " + relative)
        result = build_sbom(load_json(package_raw), load_json(lock_raw), commit,
                            {"package.json": sha256(package_raw), "package-lock.json": sha256(lock_raw)})
        if args.check:
            def read_pinned(revision, relative):
                return subprocess.run(["git", "show", revision + ":" + relative], cwd=root,
                                      check=True, capture_output=True).stdout
            check_output(load_json(output.read_bytes()), result, package_raw, lock_raw, read_pinned)
            print("SBOM detailed inventory and pinned input bytes match; no output changed")
            return 0
        encoded = (json.dumps(result, indent=1, ensure_ascii=False) + "\n").encode("utf-8")
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=output.parent, prefix=".sbom-", delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(encoded)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(str(temporary), str(output))
        temporary = None
        print("SBOM written: {} ({} lockfile package entries) @ {}".format(output, len(result["components"]), commit))
        return 0
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print("SBOM held; previous output preserved: " + str(error), file=sys.stderr)
        return 2
    finally:
        if temporary is not None:
            temporary.unlink()

if __name__ == "__main__":
    sys.exit(main())
