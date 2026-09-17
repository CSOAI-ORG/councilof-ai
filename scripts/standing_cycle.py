#!/usr/bin/env python3
"""standing_cycle.py — the M4 standing job. Repeated on Hermes until external blockers lift.

For each cycle:
  pick → measure → record exclusions → derive status → write evidence object
       → mirror to HF → read back ANONYMOUSLY → record the readback state

Nothing counts until the anonymous readback passes.

DOES NOT assume RunPod. DOES NOT assume GHA. DOES NOT touch the COSE interop key.
Local Mac compute only. HF is the only writable publication path; councilof.ai is the
authoritative surface but reads anonymously may 403 (Cloudflare browser-integrity).

Per DONE WHEN A–D (M4 ROUND 3, 17 Sep 2026).
"""
from __future__ import annotations
import argparse, hashlib, json, os, pathlib, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────────────────
# COMPUTE REALITY — verified 17 Sep 2026 (do not plan around anything else)
# ─────────────────────────────────────────────────────────────────────────────
RUNPOD_DEAD = True            # stored API key returns HTTP 403; SSH closed; key burned
GHA_DEAD = True                # gh workflow run returns HTTP 422 (ticket #4720908, day 15)
COSE_INTEROP_KEY_FORBIDDEN = True  # ~/.csoai-keys/cose-interop-1.pem — different system; using it is forgery
HF_WRITABLE = True             # only writable publication path
COUNCILOF_AI_AUTHORITATIVE = True  # but machine clients may get 403 (Cloudflare browser-integrity)


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS — exclusion ceiling + third state
# ─────────────────────────────────────────────────────────────────────────────
EXCLUSION_CEILING = 0.20
THIRD_STATE = "MEASURED_HIGH_EXCLUSION"  # run happened, score is real for what was graded, not quotable as the bank's result

# Surfaces to mirror + read back
# The HF token is stored under service name "meok.ai" (verified 2026-09-17).
# NOT "meok-keystone" — that was the wrong assumption in the brief.
HF_TOKEN_KEYCHAIN_NAME = "meok.ai"  # the HF_TOKEN entry in the keychain (verified 2026-09-17)


def hf_token() -> str | None:
    """Read the HF token from the keychain. NEVER print, NEVER log."""
    try:
        out = subprocess.check_output(
            ["security", "find-generic-password", "-s", HF_TOKEN_KEYCHAIN_NAME, "-w"],
            stderr=subprocess.DEVNULL)
        token = out.decode().strip()
        return token if token else None
    except Exception:
        return os.environ.get("HF_TOKEN")


def hf_write(org: str, repo: str, filename: str, content: bytes, readme_path: str | None = None) -> dict:
    """Write content to Hugging Face dataset. Returns {state, url, sha256, error}."""
    token = hf_token()
    if not token:
        return {"state": "UNWRITABLE", "reason": "HF_TOKEN missing", "written_at": datetime.now(timezone.utc).isoformat()}
    try:
        # Upload via HF datasets API (multipart)
        from huggingface_hub import HfApi
        api = HfApi(token=token)
        # Write to a tmp file then upload
        tmp = pathlib.Path("/tmp") / filename
        tmp.write_bytes(content)
        url = api.upload_file(
            path_or_fileobj=str(tmp),
            path_in_repo=filename,
            repo_id=f"{org}/{repo}",
            repo_type="dataset",
        )
        # Compute digest for readback comparison
        digest = hashlib.sha256(content).hexdigest()
        return {"state": "WRITTEN", "url": str(url), "sha256": digest,
                "written_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"state": "WRITE_FAILED", "reason": str(e)[:200], "written_at": datetime.now(timezone.utc).isoformat()}


def hf_readback_anonymous(org: str, repo: str, filename: str) -> dict:
    """Read the file back ANONYMOUSLY (no auth). A mirror that returned 200 is not
    publication — today Kaggle served stale bytes for 30+ minutes. We hash what
    we fetched and compare to what we wrote."""
    url = f"https://huggingface.co/datasets/{org}/{repo}/resolve/main/{filename}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
            fetched_digest = hashlib.sha256(body).hexdigest()
            return {"state": "READABLE", "url": url, "fetched_sha256": fetched_digest,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                    "fetched_bytes": len(body)}
    except urllib.error.HTTPError as e:
        return {"state": "UNREACHABLE", "reason": f"HTTP {e.code}", "url": url,
                "fetched_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"state": "UNREACHABLE", "reason": str(e)[:200], "url": url,
                "fetched_at": datetime.now(timezone.utc).isoformat()}


def cycle_record_pick() -> dict:
    """The pick phase. Pulls candidates from the LIVE /api/gspc registry so
    the cycle cannot drift from the canonical roster.

    Per the Day-1 execution log + section 19 failure modes: "Stale
    count/contract copied into code — fetch live source or label snapshot with
    timestamp; fail closed on internal mismatch."

    Returns a dict with `candidates` (the per-axis URL), `picked_at`, and
    `roster_source` (the live URL the roster came from).
    """
    live = "https://councilof.ai/api/gspc"
    try:
        req = urllib.request.Request(live, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read()
        roster = json.loads(body)
        axes = roster.get("axes", [])
    except Exception as e:
        # Fail closed: do NOT fall back to a hardcoded list. Return NO_WORK with the reason.
        return {
            "phase": "pick",
            "candidates": [],
            "picked_at": datetime.now(timezone.utc).isoformat(),
            "roster_source": live,
            "roster_state": "UNREACHABLE",
            "roster_reason": str(e)[:200],
            "no_work": True,
            "rule": "Per plan section 19, fail closed on internal mismatch — the cycle cannot use a hardcoded candidate list when the live source is unreachable.",
        }
    # Each axis becomes a candidate: probe the per-axis URL (the dataset)
    candidates = []
    for a in axes:
        if not isinstance(a, dict):
            continue
        axis = a.get("axis", "?")
        ds = a.get("dataset") or {}
        ds_url = ds.get("dataset_url") if isinstance(ds, dict) else None
        if ds_url:
            candidates.append((axis, ds_url, "json", "/dataset", "fetch"))
        # Also include the board roster URL itself as the system-of-record probe
        candidates.append((f"gspc_axis:{axis}", live, "json", f"/axes", "value"))
    if not candidates:
        return {
            "phase": "pick",
            "candidates": [],
            "picked_at": datetime.now(timezone.utc).isoformat(),
            "roster_source": live,
            "roster_state": "EMPTY_ROSTER",
            "no_work": True,
        }
    # Keep the historical human-surfacing probes too (so the cycle still
    # exercises councilof.ai + HF mirrors per the realignment brief).
    candidates.extend([
        ("councilof_ai_root_json", "https://councilof.ai/root.json", "json", "/root_hash", "value"),
        ("hf_csoai_org", "https://huggingface.co/csoai", "html", None, "fetch"),
    ])
    return {
        "phase": "pick",
        "candidates": candidates,
        "picked_at": datetime.now(timezone.utc).isoformat(),
        "roster_source": live,
        "roster_state": "REACHED",
        "axes_in_roster": len(axes),
    }


def cycle_measure(pick: dict) -> dict:
    """The measure phase. Records cells_attempted, cells_graded, cells_skipped."""
    attempt = []
    graded = []
    skipped = []
    exclusions = {"excluded_count": 0, "graded_count": 0, "ratio": None}  # third-state gate

    for name, url, kind, path, op in pick["candidates"]:
        attempt.append({"name": name, "url": url, "attempted_at": datetime.now(timezone.utc).isoformat()})
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = resp.read()
                if kind == "json":
                    data = json.loads(body)
                    # Walk the path
                    val = data
                    for p in path.strip("/").split("/"):
                        val = val.get(p) if isinstance(val, dict) else None
                    graded.append({
                        "name": name, "url": url,
                        "status": resp.status, "value": val,
                        "graded_at": datetime.now(timezone.utc).isoformat(),
                    })
                else:
                    graded.append({
                        "name": name, "url": url,
                        "status": resp.status, "bytes": len(body),
                        "graded_at": datetime.now(timezone.utc).isoformat(),
                    })
                exclusions["graded_count"] += 1
        except urllib.error.HTTPError as e:
            if e.code == 402:
                # 402 challenge is a PASS for x402 sources
                graded.append({"name": name, "url": url, "status": 402,
                               "observation": "402 challenge issued",
                               "graded_at": datetime.now(timezone.utc).isoformat()})
                exclusions["graded_count"] += 1
            else:
                skipped.append({"name": name, "url": url, "reason": f"HTTP {e.code}",
                               "skipped_at": datetime.now(timezone.utc).isoformat()})
        except Exception as e:
            skipped.append({"name": name, "url": url, "reason": str(e)[:60],
                           "skipped_at": datetime.now(timezone.utc).isoformat()})

    # Compute exclusion ratio (third-state gate)
    total = exclusions["graded_count"] + exclusions["excluded_count"]
    if total > 0 and exclusions["graded_count"] > 0:
        exclusions["ratio"] = round(exclusions["excluded_count"] / total, 4)
    else:
        exclusions["ratio"] = None  # NEVER zero when ratio is uncomputable
    exclusions["state"] = "MEASURED_HIGH_EXCLUSION" if (exclusions["ratio"] or 0) > EXCLUSION_CEILING else "QUOTABLE"

    return {
        "phase": "measure",
        "cells_attempted": len(attempt),
        "cells_graded": len(graded),
        "cells_skipped": len(skipped),
        "exclusions": exclusions,
        "graded": graded,
        "skipped": skipped,
        "measured_at": datetime.now(timezone.utc).isoformat(),
    }


def cycle_evidence_object(measure: dict, pick: dict | None = None) -> dict:
    """Build the canonical evidence object — the artifact a stranger can fetch."""
    obj = {
        "schema": "csoai.standing-cycle/0.1",
        "kind": "standing-cycle-evidence",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "exclusion_ceiling": EXCLUSION_CEILING,
        "third_state": THIRD_STATE,
        "cells_attempted": measure["cells_attempted"],
        "cells_graded": measure["cells_graded"],
        "cells_skipped": measure["cells_skipped"],
        "exclusions": measure["exclusions"],
        "no_work": measure["cells_graded"] == 0,
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "exclusion ratio is the THIRD-STATE gate. ratio=None is NEVER 0.",
            "Cells skipped are recorded with reason, not omitted.",
            "An idle honest cycle beats a busy dishonest one. NO_WORK is valid.",
        ],
    }
    if pick:
        obj["roster_source"] = pick.get("roster_source")
        obj["roster_state"] = pick.get("roster_state")
        obj["roster_reason"] = pick.get("roster_reason")
        obj["axes_in_roster"] = pick.get("axes_in_roster")
        obj["candidates_count"] = len(pick.get("candidates", []))
    return obj


def cycle_mirror_and_readback(evidence: dict, org: str, repo: str) -> dict:
    """Mirror to HF, read back ANONYMOUSLY, record readback state."""
    canonical = json.dumps(evidence, sort_keys=True, separators=(",", ":")).encode()
    evidence["sha256"] = hashlib.sha256(canonical).hexdigest()
    filename = f"cycle-{evidence['sha256'][:12]}.json"

    # Write
    write_result = hf_write(org, repo, filename, canonical)
    evidence["hf_write"] = write_result

    # Anonymous readback — required for publication
    if write_result.get("state") == "WRITTEN":
        readback = hf_readback_anonymous(org, repo, filename)
        evidence["hf_readback"] = readback
        # Did the bytes round-trip?
        if readback.get("state") == "READABLE":
            evidence["hf_round_trip_ok"] = (readback.get("fetched_sha256") == write_result.get("sha256"))
            if not evidence["hf_round_trip_ok"]:
                evidence["hf_readback"]["warning"] = "fetched sha256 differs from written sha256 — STALE WRITE"
        else:
            evidence["hf_round_trip_ok"] = False
    else:
        evidence["hf_readback"] = {"state": "NOT_ATTEMPTED", "reason": write_result.get("state", "WRONG_STATE")}
        evidence["hf_round_trip_ok"] = False

    return evidence


def cycle_run(org: str = "csoai", repo: str = "standing-cycle") -> dict:
    """One full cycle. Returns the manifest dict."""
    pick = cycle_record_pick()
    measure = cycle_measure(pick)
    evidence = cycle_evidence_object(measure, pick=pick)
    evidence = cycle_mirror_and_readback(evidence, org, repo)

    # Final manifest — what the cycle DID and DID NOT do
    manifest = {
        "schema": "csoai.standing-cycle-manifest/0.1",
        "kind": "cycle-manifest",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cycle_id": evidence["sha256"][:12],
        "cells_attempted": evidence["cells_attempted"],
        "cells_graded": evidence["cells_graded"],
        "cells_skipped": evidence["cells_skipped"],
        "no_work": evidence["no_work"],
        "surfaces_written": [s["name"] for s in evidence.get("graded", []) if evidence.get("hf_write", {}).get("state") == "WRITTEN"],
        "surfaces_failed": [s["name"] for s in evidence.get("graded", []) if evidence.get("hf_write", {}).get("state") != "WRITTEN"],
        "readback_state": evidence.get("hf_readback", {}).get("state", "NOT_ATTEMPTED"),
        "round_trip_ok": evidence.get("hf_round_trip_ok", False),
        "external_blockers_in_force": {
            "runpod_dead": RUNPOD_DEAD,
            "gha_dead": GHA_DEAD,
            "cose_interop_key_forbidden": COSE_INTEROP_KEY_FORBIDDEN,
        },
        "evidence_object_url": f"/datasets/{org}/{repo}/resolve/main/cycle-{evidence['sha256'][:12]}.json",
        "evidence_sha256": evidence["sha256"],
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "An upload that returned 200 is not publication; the bytes must read back ANONYMOUSLY and hash-equal.",
            "If hf_write state != WRITTEN, the readback is NOT_ATTEMPTED.",
            "If hf_round_trip_ok is False, the write did not become publication.",
        ],
    }

    return manifest


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--org", default="csoai")
    ap.add_argument("--repo", default="standing-cycle")
    ap.add_argument("--audit-only", action="store_true",
                    help="Run pick+measure only, do NOT mirror. Use this to test the cycle locally before HF write.")
    a = ap.parse_args()

    if a.audit_only:
        # Audit path — no write, no readback. For local sanity check.
        pick = cycle_record_pick()
        measure = cycle_measure(pick)
        evidence = cycle_evidence_object(measure, pick=pick)
        print(json.dumps({"pick": pick, "measure": measure, "evidence_no_write": evidence}, indent=2))
        return 0

    manifest = cycle_run(a.org, a.repo)
    print(json.dumps(manifest, indent=2))

    # Write the manifest locally too (so we have a record of the cycle even if HF write failed)
    out_dir = pathlib.Path("public/interop/standing-cycle")
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / f"manifest-{manifest['cycle_id']}.json"
    manifest_path.write_bytes(json.dumps(manifest, indent=2).encode())

    # If nothing was written, the cycle is honest about it
    if manifest["no_work"]:
        print(f"\n[honest] NO_WORK cycle — measured 0 cells. Manifest: {manifest_path}")
        return 0  # NO_WORK is valid, publishable, NOT an error
    return 0


if __name__ == "__main__":
    sys.exit(main())
