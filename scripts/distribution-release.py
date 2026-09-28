#!/usr/bin/env python3
"""Land one measured distribution census through the existing pod release gates.

The 07:00 measurement loop pushes distribution/auto-YYYY-MM-DD. This program
copies ONLY its dated JSON and latest alias onto a fresh master candidate,
validates them, derives the two discovery-text sections, and releases via the
existing guarded Cloudflare publisher. It never reads GitHub.
"""
from __future__ import annotations

import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time

BARE = Path("/workspace/git/councilof-ai.git")
CLONE = Path("/workspace/lanes/distribution-release-repo")
LOOPS = Path("/workspace/lanes/loops")
LOG = Path("/workspace/lanes/logs/distribution-release.log")
RECEIPT = Path("/workspace/lanes/state/distribution-release-latest.json")
OWN_LOCK = Path("/workspace/lanes/state/distribution-release.lock")
LAND_LOCK = Path("/workspace/lanes/state/mill-hourly-land.lock")
ALLOWED = {"READ", "PARTIAL", "UNCHECKABLE", "UNMEASURED"}


def run(*argv: str, cwd: Path | None = None, timeout: int = 1800) -> str:
    proc = subprocess.run(argv, cwd=cwd, text=True, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, timeout=timeout)
    if proc.returncode:
        raise RuntimeError(f"{argv[0]} failed ({proc.returncode}): {proc.stdout[-1600:]}")
    return proc.stdout


def stamp(message: str) -> None:
    now = f"{dt.datetime.now(dt.timezone.utc):%Y-%m-%dT%H:%M:%SZ}"
    line = f"{now} {message}"
    print(line, flush=True)
    if LOG.parent.exists():
        with LOG.open("a") as out:
            out.write(line + "\n")
    state = message.split(" ", 1)[0]
    if state in {"HOLD", "SERVED", "PREPARED"} and RECEIPT.parent.exists():
        temporary = RECEIPT.with_suffix(".tmp")
        temporary.write_text(json.dumps({"as_of": now, "state": state, "detail": message}) + "\n")
        os.replace(temporary, RECEIPT)


def parsed_utc(value: str) -> dt.datetime:
    return dt.datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)


def validate(new: dict, old: dict, day: str, now: dt.datetime) -> None:
    if new.get("schema") != "csoai.distribution/0.1":
        raise ValueError("unknown distribution schema")
    measured = parsed_utc(new["as_of"])
    if measured.date().isoformat() != day or not dt.timedelta(0) <= now - measured <= dt.timedelta(hours=24):
        raise ValueError("dated census is not fresh and from the named UTC day")
    if measured < parsed_utc(old["as_of"]):
        raise ValueError("candidate census predates the current master")
    if parsed_utc(new["stale_after"]) <= now:
        raise ValueError("candidate is already stale")
    if set(new.get("registries", {})) != {"pypi", "npm", "huggingface"}:
        raise ValueError("one of the three measured registries is absent")
    packages = new.get("packages")
    if not isinstance(packages, list):
        raise ValueError("package rows absent")
    seen = set()
    for row in packages:
        key = (row.get("registry"), row.get("repo_type"), row.get("name"))
        if key in seen or key[0] not in new["registries"]:
            raise ValueError("duplicate package row or unknown registry")
        seen.add(key)
        for field in ("name", "reason"):
            value = row.get(field)
            if value is not None and (not isinstance(value, str) or len(value) > 240 or any(ord(c) < 32 for c in value)):
                raise ValueError(f"unsafe package {field}")
    for window in ("downloads_30d", "downloads_all_time"):
        total = new["totals"][window]
        previous = old["totals"][window]
        state, covered, attempted, value = (total[k] for k in ("state", "covered", "attempted", "value"))
        if state not in ALLOWED or not all(isinstance(x, int) and not isinstance(x, bool) for x in (covered, attempted)):
            raise ValueError(f"invalid {window} state or coverage")
        if attempted != len(packages) or attempted < previous["attempted"] or not 0 <= covered <= attempted:
            raise ValueError(f"{window} denominator shrank or contradicts package rows")
        if covered * 100 < attempted * 95:
            raise ValueError(f"{window} coverage below 95%; manual review required")
        if state != ("READ" if covered == attempted else "PARTIAL"):
            raise ValueError(f"{window} state contradicts coverage")
        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
            raise ValueError(f"{window} value is not a measured non-negative integer")
        if window == "downloads_all_time" and value < previous["value"]:
            raise ValueError("cumulative count fell; source revision needs manual review")
        sub = [new["registries"][r][window] for r in ("pypi", "npm", "huggingface")]
        if sum(r["covered"] for r in sub) != covered or sum(r["attempted"] for r in sub) != attempted:
            raise ValueError(f"{window} registry coverage does not add to total")
        if sum(r["value"] for r in sub if r["value"] is not None) != value:
            raise ValueError(f"{window} registry values do not add to total")
        for registry in ("pypi", "npm", "huggingface"):
            rows = [p for p in packages if p["registry"] == registry]
            measured_rows = [p[window] for p in rows if p.get(window) is not None]
            reg = new["registries"][registry][window]
            if len(rows) != reg["attempted"] or len(measured_rows) != reg["covered"] or sum(measured_rows) != reg["value"]:
                raise ValueError(f"{window} package rows disagree with {registry} aggregate")
        shares = new["by_entity"][window]
        if sum(r["value"] for r in shares.values() if r["value"] is not None) != value:
            raise ValueError(f"{window} entity values do not add to total")


def distribution_section(doc: dict, heading: str) -> str:
    total30 = doc["totals"]["downloads_30d"]
    cumulative = doc["totals"]["downloads_all_time"]
    reg = doc["registries"]
    attempts = cumulative["attempted"]
    source = reg["pypi"].get("cross_check", {})
    missing = [p for p in doc["packages"] if p.get("downloads_all_time") is None or p.get("downloads_30d") is None]
    def observed(label: str, row: dict) -> str:
        caveat = ("a LOWER BOUND over those, never a total over all of them"
                  if row["state"] == "PARTIAL" else "all named counters answered")
        return (f"- {label}: {row['value']:,} gross download events — state {row['state']}, "
                f"{row['covered']} of {row['attempted']} counters answered; {caveat}. "
                f"Window: {row['window']}. as_of {doc['as_of']}.")
    lines = [heading, "",
             "Derived from https://councilof.ai/interop/distribution-latest.json "
             f"(schema {doc['schema']}, artifact as_of {doc['as_of']}). "
             "Re-read the dated artifact for coverage and source methods.", "",
             f"- Packages across three registries: {attempts} "
             f"(huggingface {reg['huggingface']['downloads_all_time']['attempted']} · "
             f"npm {reg['npm']['downloads_all_time']['attempted']} · "
             f"pypi {reg['pypi']['downloads_all_time']['attempted']}). These are package rows, "
             "not users or installations.",
             observed("Last 30 days", total30),
             observed("Cumulative since first release", cumulative),
             "- The 30-day and cumulative windows cover the same packages and are never added. "
             "Registry counters include mirrors, CI and crawlers; downloads are distribution, "
             "not adoption, customers, or GSPC measurements."]
    if missing:
        labels = ", ".join(f"{p['registry']} `{p['name']}` ({p.get('reason', 'no counter')})" for p in missing[:5])
        suffix = f"; {len(missing)-5} more in the artifact" if len(missing) > 5 else ""
        lines.append(f"- Counters without a value: {labels}{suffix}. Missing means null, never 0.")
    n, ratio = source.get("samples_compared"), source.get("pepy_over_pypistats_median")
    if isinstance(n, int) and n > 0 and isinstance(ratio, (int, float)):
        lines.append(f"- PyPI counter cross-check: {n} sampled packages; pepy.tech versus "
                     f"pypistats.org median ratio {ratio:.2f}x. The divergence is unresolved; "
                     "the published PyPI series is pepy.tech and is labelled gross.")
    lines += ["- CSOAI Ltd and MEOK AI Labs are labelled separately under `by_entity` in the artifact.", ""]
    return "\n".join(lines) + "\n"


def replace_section(text: str, heading_prefix: str, next_heading: str, section: str) -> str:
    pattern = re.compile(rf"(?m)^{re.escape(heading_prefix)}[^\n]*\n")
    matches = list(pattern.finditer(text))
    if len(matches) != 1:
        raise ValueError(f"expected exactly one {heading_prefix} section")
    start = matches[0].start()
    end = text.find(next_heading, matches[0].end())
    if end < 0:
        raise ValueError(f"missing boundary after {heading_prefix}")
    return text[:start] + section + text[end:]


def stage(repo: Path, day: str, now: dt.datetime) -> str:
    dated = repo / "public/interop" / f"distribution-{day}.json"
    latest = repo / "public/interop/distribution-latest.json"
    if dated.read_bytes() != latest.read_bytes():
        raise ValueError("dated and latest aliases differ")
    old = json.loads(run("git", "show", "HEAD:public/interop/distribution-latest.json", cwd=repo))
    new = json.loads(dated.read_text())
    validate(new, old, day, now)
    for file, head, following in (("llms.txt", "## Distribution — ", "## Timestamp proofs"),
                                   ("llms-full.txt", "### 9a. Distribution — ", "### 9b. MCP Registry")):
        path = repo / "public" / file
        source = path.read_text()
        title = ("## Distribution — " if file == "llms.txt" else "### 9a. Distribution — ")
        updated = replace_section(source, head, following,
                                  distribution_section(new, f"{title}measured, {new['totals']['downloads_all_time']['state']}, and not adoption"))
        path.write_text(updated)
    return new["as_of"]


def public_readback(as_of: str, expected: bytes) -> bool | None:
    # Cloudflare currently returns 403 to Python urllib's fingerprint on this
    # zone; curl is the already-used production readback client.
    def fetch(url: str) -> bytes:
        result = subprocess.run(("curl", "-fLsS", "--compressed", "--max-time", "20", url),
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25)
        if result.returncode:
            raise RuntimeError(result.stderr.decode(errors="replace")[-300:])
        return result.stdout
    try:
        served = fetch("https://councilof.ai/interop/distribution-latest.json")
        matched = hashlib.sha256(served).digest() == hashlib.sha256(expected).digest()
        for name in ("llms.txt", "llms-full.txt"):
            if as_of not in fetch(f"https://councilof.ai/{name}").decode():
                matched = False
        return matched
    except Exception:
        return None


def deploy_and_verify(day: str, as_of: str, expected: bytes, candidate: str, deploy_ref: str) -> None:
    observed = public_readback(as_of, expected)
    if observed is True:
        stamp(f"SERVED {day} {as_of} already matches exact JSON hash + both discovery texts; no second deploy")
        return
    if observed is None:
        raise RuntimeError("public readback unavailable; refusing a possible duplicate deploy")
    for deploy_attempt in range(3):
        current = run("git", f"--git-dir={BARE}", "rev-parse", "refs/heads/master").strip()
        if current != candidate:
            raise RuntimeError("master advanced before deploy; no stale candidate will be published")
        # The ref is pinned to candidate, so a master movement between this
        # check and the publisher's fetch cannot silently change its source.
        output = run("bash", str(LOOPS / "deploy-prod.sh"), deploy_ref, timeout=1800)
        if "DEPLOYED:" in output and "=== done" in output:
            break
        stamp(f"WAIT deploy lock attempt={deploy_attempt+1}")
        time.sleep(45)
    else:
        raise RuntimeError("no successful guarded deployment after three attempts")
    current = run("git", f"--git-dir={BARE}", "rev-parse", "refs/heads/master").strip()
    if current != candidate:
        raise RuntimeError("master advanced during deploy; latest production state needs another release")
    for _ in range(12):
        observed = public_readback(as_of, expected)
        if observed is True:
            stamp(f"SERVED {day} {as_of} exact JSON hash + both discovery texts")
            return
        time.sleep(10)
    raise RuntimeError("guarded deploy returned but public readback did not match")


def release(day: str, prepare_only: bool = False) -> None:
    branch = f"distribution/auto-{day}"
    if not BARE.is_dir() and not prepare_only:
        raise RuntimeError("pod bare repository absent")
    with OWN_LOCK.open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if not CLONE.joinpath(".git").exists():
            run("git", "clone", "-q", str(BARE), str(CLONE))
        for attempt in range(3):
            # This clone belongs only to this worker. Recover a failed prior
            # prepare without ever resetting an operator's shared checkout.
            run("git", "reset", "--hard", "HEAD", cwd=CLONE)
            run("git", "fetch", "-q", "origin", cwd=CLONE)
            base = run("git", "rev-parse", "origin/master", cwd=CLONE).strip()
            run("git", "checkout", "-q", "-B", "distribution/release-staging", base, cwd=CLONE)
            dated_rel = f"public/interop/distribution-{day}.json"
            latest_rel = "public/interop/distribution-latest.json"
            run("git", "restore", "--source", f"origin/{branch}", "--staged", "--worktree",
                "--", dated_rel, latest_rel, cwd=CLONE)
            raw_unchanged = run("git", "diff", "HEAD", "--", dated_rel, latest_rel, cwd=CLONE).strip() == ""
            if raw_unchanged:
                observed = public_readback(json.loads((CLONE / latest_rel).read_text())["as_of"],
                                           (CLONE / latest_rel).read_bytes())
                if observed is True:
                    stamp(f"SERVED {day} already matches exact public JSON hash + both texts; no second deploy")
                    return
                if observed is None and not prepare_only:
                    raise RuntimeError("master has census but public readback is unavailable")
            as_of = stage(CLONE, day, dt.datetime.now(dt.timezone.utc))
            allowed = {dated_rel, latest_rel, "public/llms.txt", "public/llms-full.txt"}
            changed = set(run("git", "diff", "HEAD", "--name-only", cwd=CLONE).splitlines())
            if not changed.issubset(allowed):
                raise RuntimeError(f"release contains a path outside the four allowed: {changed}")
            if prepare_only:
                stamp(f"PREPARED {day} {as_of} files={len(changed)}")
                return
            if not changed:
                with LAND_LOCK.open("w") as landing:
                    fcntl.flock(landing, fcntl.LOCK_EX)
                    run("git", "fetch", "-q", "origin", cwd=CLONE)
                    if run("git", "rev-parse", "origin/master", cwd=CLONE).strip() != base:
                        stamp(f"RETRY master advanced before existing-census deploy attempt={attempt+1}")
                        continue
                    deploy_and_verify(day, as_of, (CLONE / latest_rel).read_bytes(), base, "master")
                return
            run("git", "add", "--", *sorted(allowed), cwd=CLONE)
            run("git", "-c", "user.name=CSOAI", "-c", "user.email=nicholas@csoai.org",
                "commit", "-q", "-m", f"distribution: dated census {day} and derived discovery text", cwd=CLONE)
            committed_paths = set(run("git", "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD", cwd=CLONE).splitlines())
            if committed_paths != changed:
                raise RuntimeError("committed paths differ from reviewed candidate")
            candidate = run("git", "rev-parse", "HEAD", cwd=CLONE).strip()
            stage_ref = f"distribution/release-{day}-{candidate[:10]}"
            run("git", "push", "-q", "origin", f"HEAD:refs/heads/{stage_ref}", cwd=CLONE)
            output = run("bash", str(LOOPS / "build-gates.sh"), stage_ref, timeout=1800)
            if not all(f"{gate} ok" in output for gate in ("npm ci", "build:client", "brand-gate", "signed-json-guard")):
                raise RuntimeError("build-gates did not report all required passes")
            run("python3", "scripts/root-witness-release-gate.py", "--phase", "candidate", "--public-dir", "public", cwd=CLONE)
            with LAND_LOCK.open("w") as landing:
                fcntl.flock(landing, fcntl.LOCK_EX)
                run("git", "fetch", "-q", "origin", cwd=CLONE)
                if run("git", "rev-parse", "origin/master", cwd=CLONE).strip() != base:
                    stamp(f"RETRY master advanced during preflight attempt={attempt+1}")
                    continue
                run("git", "push", "-q", "origin", "HEAD:refs/heads/master", cwd=CLONE)
                stamp(f"LANDED {day} commit={candidate[:12]} {as_of}")
                expected = (CLONE / latest_rel).read_bytes()
                # Keep the same landing lock until served readback succeeds.
                # The hourly lander uses this lock and cannot move master
                # while the pinned candidate is being uploaded.
                deploy_and_verify(day, as_of, expected, candidate, stage_ref)
            return
        raise RuntimeError("master advanced during all three candidate attempts")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("day", help="UTC date, YYYY-MM-DD; uses distribution/auto-<day>")
    ap.add_argument("--prepare-only", action="store_true")
    args = ap.parse_args()
    if not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", args.day):
        ap.error("day must be YYYY-MM-DD")
    try:
        release(args.day, args.prepare_only)
        return 0
    except Exception as exc:
        stamp(f"HOLD {args.day}: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
