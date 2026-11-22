#!/usr/bin/env python3
"""Reconcile the rolling public-root candidate with master.

WHY THIS EXISTS (26 Oct 2026). The pending candidate branch `public-root/pending` could not be
reconciled with master, and every run of public-root-candidate-upgrade.yml failed at that step,
so the ONE public root had not advanced for over nine hours. Two faults, both here:

  1. THE MERGE DIED ON A CONTENT CONFLICT in three files: public/interop/ots/manifest.json,
     public/llms.txt and public/llms-full.txt. The first is GENERATED from the .ots files in the
     tree; the other two quote its counts and as_of. All three are derived views, so both sides
     are regenerated from the merged tree below and choosing a side is not choosing content —
     the generation decides it. A conflict anywhere else — root, proof or witness bytes — is a
     real conflict and still fails closed. Nothing is auto-resolved there.

  2. THE VIEWS WERE GENERATED BEFORE THE MANIFEST WAS REBUILT. The manifest is rebuilt when the
     proof bytes change, and the views quote it, so the views were always one cycle stale.
     pr-gates' llms-txt-derived test caught it on the candidate head: the manifest's as_of
     2026-10-26T01:48:57Z appeared 0 times in llms.txt, and the candidate could not pass the
     gate and could not merge. Here the order is manifest first, views second, always.

  3. A STAMPED ARTEFACT CONFLICTED WITH MASTER AND FAILED CLOSED. public/interop/
     sbom-councilof-ai.json is STAMPED: it has a sibling public/interop/sbom-councilof-ai.json.ots
     that proves those exact bytes. On 2026-10-29 master re-stamped it (#3614) while the
     candidate was parked holding its own regenerated copy, so the merge died on that ONE path
     and the candidate could not reconcile at all. The rule below resolves it: when master
     carries a proof for a path, master's bytes AND master's proof win, as a pair. The candidate
     cannot hold a valid proof for its own bytes - a proof is minted against the exact bytes it
     proves, and the candidate does not mint proofs. So the candidate's copy of a re-stamped
     artefact is stale, and its copy of the proof is stale with it.

    python3 scripts/root_candidate_reconcile.py --selftest   # proves each failure goes red
    python3 scripts/root_candidate_reconcile.py               # reconcile the checked-out candidate

Exit 0 = reconciled, 1 = a real conflict (fail closed), 2 = UNCHECKABLE (the tree is not a
candidate, or a generator is missing). Measurement, not certification: this merges two trees
and regenerates derived views. It does not sign, root, attest or certify anything.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

DERIVED_VIEWS = (
    "public/cards-bundle.json",
    "public/card-feed-index.json",
    "public/interop/model-lifecycle.json",
    "functions/api/_model-lifecycle-snapshot.ts",
    "public/interop/ots/manifest.json",
    "public/llms.txt",
    "public/llms-full.txt",
)

# A stamped artefact is a file with a sibling OpenTimestamps proof. For a derived view the
# GENERATOR decides the bytes; for a stamped artefact the PROOF decides them, and the only
# proof that exists for master's bytes is the one that sits beside them on master.
STAMPED_SUFFIX = ".ots"

# The root, and the pointer that names it. The pointer is not a free choice between two
# readings: it RECORDS a root — its digest, size, merkle root, card count and as_of — and the
# estate's own release gate (RELEASE_GATE) asserts that a pointer binds the root in the tree
# it sits in. So the pointer follows the root.
ROOT_PATH = "public/root.json"
ROOT_POINTER = "public/interop/root-witness-pointer.json"
RELEASE_GATE = "scripts/root-witness-release-gate.py"

# The manifest is generated from the .ots files in the tree; the views quote it. This order is
# the whole point of the second fault above, so it is asserted rather than assumed.
MANIFEST_BUILDER = "scripts/ots_manifest_rebuild.py"
VIEW_GENERATOR = "scripts/llms-txt.mjs"
# The cards bundle is generated from the cards and the root in the tree, and the llms view
# quotes it (its card_count comes from there). It is a derived view like the other two, and
# MEASURED 2026-11-07 it was the second path the rolling candidate could not reconcile:
# "REAL CONFLICT ... failing closed: public/cards-bundle.json, public/interop/root-witness-pointer.json".
# Its bytes are a function of the tree — its as_of comes from the root's as_of — so the
# generator decides them and either side will do.
BUNDLE_GENERATOR = "scripts/generate-cards-bundle.mjs"
# The model-lifecycle ledger is a derived view too, and MEASURED 2026-11-07 it was the
# third: the ledger is generated from public/data/v1/latest.json (its estate_measurement
# as_of and version come from there) and public/interop/models-measured.json. The root
# publisher writes latest.json on EVERY publish, so a publish that lands a new root
# leaves the committed ledger holding the previous root's stamps — and nothing rebuilt it,
# because scripts/build-model-lifecycle.mjs had NO caller anywhere in the estate.
#
# The symptom was the rolling candidate's pr-gates: "Unit tests — client, functions and
# scripts" failed on functions/api/model-lifecycle.test.ts ("the builder's own --check
# passes against the committed bytes"), 1 failed / 9765 passed (run 42362056788, head
# 91de3b221b8969ea13a44a93dcf232ae712d4e78). The four fields that differed were exactly
# the freshness stamps: estate_measurement_version 2026-11-01.2 -> 2026-11-01.3 and its
# as_of 2026-11-01T15:09:42Z -> 2026-11-01T23:43:53Z. No conflict was involved: the
# ledger's own history is empty across the merge that changed its input, so the merge was
# silent and only the gate noticed.
#
# The generator decides these bytes, so either side will do and the rebuild happens
# after the merge — which is the whole point of it being here.
LIFECYCLE_GENERATOR = "scripts/build-model-lifecycle.mjs"


class RealConflict(Exception):
    """A conflict outside the derived views. Fail closed; choose nothing."""


class Uncheckable(Exception):
    """The tree is not a candidate, or a generator is missing. Not the same as a conflict."""


def git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    if check and result.returncode != 0:
        raise Uncheckable(f"git {' '.join(args)} failed: {result.stderr.strip() or result.stdout.strip()}")
    return result


def unmerged_paths(repo: Path) -> list[str]:
    """The paths git left conflicted, in the order git lists them."""
    out = git(repo, "diff", "--name-only", "--diff-filter=U").stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def is_derived(path: str) -> bool:
    return path in DERIVED_VIEWS


def has_path(repo: Path, ref: str, path: str) -> bool:
    """Whether `path` exists in `ref`'s tree. A path that is not there is False, not an error."""
    return git(repo, "cat-file", "-e", f"{ref}:{path}", check=False).returncode == 0


def _load_release_gate(repo: Path) -> Any | None:
    """The estate's OWN binding predicate, loaded from the tree being reconciled.

    The tool is run from a copy fetched out of master while it works on the candidate's tree,
    so the gate is loaded from the TREE and not from beside this tool. It is the GATE's rule
    that decides whether a pointer binds a root: a rule written twice is a rule that drifts,
    and the trigger-coupling check is what that costs.
    """
    path = repo / RELEASE_GATE
    if not path.is_file():
        return None
    spec = importlib.util.spec_from_file_location("root_witness_release_gate", path)
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception:
        return None
    return module


def _as_bytes(value: bytes | str) -> bytes:
    """The bytes a JSON artefact hashes to. git(1) hands back text; the tree holds bytes."""
    return value if isinstance(value, bytes) else value.encode("utf-8")


def _binds_root(gate: Any, pointer_bytes: bytes | str, root_raw: bytes | str) -> bool:
    """Whether this pointer satisfies the release gate against these root bytes.

    The gate checks two things and both are asked here: that the pointer's live_root binds
    the root (exact_artifact_issues), and that its drift record binds that root too
    (validate_drift_record). A pointer that names a root and then records a drift against a
    DIFFERENT root is not a pointer that binds anything.
    """
    pointer_bytes = _as_bytes(pointer_bytes)
    root_raw = _as_bytes(root_raw)
    try:
        pointer = json.loads(pointer_bytes)
        root = json.loads(root_raw)
    except (TypeError, ValueError):
        return False
    if not isinstance(pointer, dict) or not isinstance(root, dict):
        return False
    root_sha = hashlib.sha256(root_raw).hexdigest()
    issues = list(gate.exact_artifact_issues(
        pointer.get("live_root"), root, root_raw, root_sha, "pointer live_root"))
    gate.validate_drift_record(
        issues, pointer.get("drift"), root, root_raw, root_sha,
        label="pointer drift", require_observation=False)
    return not issues


def _merged_root_bytes(repo: Path) -> bytes | None:
    """The root bytes the merge left in the working tree, or None when there is no single one."""
    if unmerged_paths(repo) and ROOT_PATH in unmerged_paths(repo):
        return None
    path = repo / ROOT_PATH
    if not path.is_file():
        return None
    return path.read_bytes()


def _pointer_side_for_merged_root(repo: Path, conflicted: list[str]) -> str | None:
    """Which side of a conflicted root-witness pointer binds the root the merge kept.

    "ours" is the checked-out candidate, "theirs" is master. None means the rule decides
    nothing — the pointer is not conflicted, the root itself is conflicted, the release gate
    is not in the tree, or neither side binds the merged root — and the path stays a real
    conflict, so the reconcile fails closed exactly as it did before.

    MEASURED 2026-11-07 on the real candidate: the merge of master into the rolling candidate
    keeps the CANDIDATE's root (429 cards, as_of 2026-11-01T23:43:53Z), and only the
    candidate's pointer binds it — master's pointer fails the gate against that root ("pointer
    live_root sha256 does not bind current root"). Every one of the 70 replaced card leaves is
    measured -> measured, no asset was dropped, and the net is +1 card: GROWTH, which is
    published. So the resolution is not "choose a side": it is "the pointer follows the root
    the merge kept".
    """
    if ROOT_POINTER not in conflicted:
        return None
    root_raw = _merged_root_bytes(repo)
    if root_raw is None:
        return None
    gate = _load_release_gate(repo)
    if gate is None:
        return None
    ours = git(repo, "show", f":2:{ROOT_POINTER}", check=False)
    theirs = git(repo, "show", f":3:{ROOT_POINTER}", check=False)
    ours_binds = ours.returncode == 0 and _binds_root(gate, ours.stdout, root_raw)
    theirs_binds = theirs.returncode == 0 and _binds_root(gate, theirs.stdout, root_raw)
    if ours_binds and theirs_binds:
        # Both name the merged root; the candidate's is the one written beside its own tree.
        return "ours"
    if ours_binds:
        return "ours"
    if theirs_binds:
        return "theirs"
    return None


def rebuild_derived_views(repo: Path, builder: list[str], generator: list[str],
                          bundle: list[str] | None = None,
                          lifecycle: list[str] | None = None) -> list[str]:
    """Rebuild the cards bundle, then the lifecycle ledger, then the manifest, then the views.

    The order is the point, and it is asserted by the selftest rather than assumed: the
    bundle is generated from the cards and the root in the tree, the manifest is generated
    from the .ots files in the tree, and the llms views quote BOTH — so a view generated
    before its inputs would publish a number that no file holds.

    MEASURED 2026-11-07: scripts/llms-txt.mjs reads public/cards-bundle.json (its
    card_count comes from there), and public/cards-bundle.json is generated by
    scripts/generate-cards-bundle.mjs from public/cards/ and public/root.json. Its as_of
    comes from the root's as_of, so the generator's bytes are a function of the tree — which
    is what makes it a derived view and not a third writer.

    The lifecycle ledger joins between the bundle and the manifest because it is root-derived
    too (its freshness stamps come from public/data/v1/latest.json, which the root publisher
    writes) and because nothing else in the chain feeds it. It is rebuilt AFTER the merge
    for the same reason the bundle is: a ledger that keeps the stamps of the root the merge
    replaced publishes a measurement of a root that is no longer the one in the tree.
    """
    ran = []
    for cmd in (([bundle] if bundle else []) + ([lifecycle] if lifecycle else []) + [builder, generator]):
        result = subprocess.run(cmd, cwd=str(repo), capture_output=True, text=True)
        if result.returncode != 0:
            raise Uncheckable(
                f"{cmd[0]} failed in {repo}: {result.stderr.strip() or result.stdout.strip()}")
        ran.append(" ".join(cmd))
    return ran


def reconcile(
    repo: Path,
    *,
    remote: str = "origin",
    branch: str = "master",
    builder: list[str] | None = None,
    generator: list[str] | None = None,
    bundle: list[str] | None = None,
    lifecycle: list[str] | None = None,
    commit: bool = True,
) -> dict:
    """Merge `remote/branch` into the checked-out candidate, then rebuild the derived views.

    Raises RealConflict when something that is not a derived view conflicts, and Uncheckable
    when the merge failed for a reason that is not a conflict, or a generator is missing.
    """
    builder_supplied = builder is not None
    generator_supplied = generator is not None
    bundle_supplied = bundle is not None
    lifecycle_supplied = lifecycle is not None
    builder = builder or [sys.executable, MANIFEST_BUILDER, "--apply"]
    generator = generator or ["node", VIEW_GENERATOR]
    bundle = bundle or ["node", BUNDLE_GENERATOR]
    lifecycle = lifecycle or ["node", LIFECYCLE_GENERATOR]
    # A default generator that is not in the tree is UNCHECKABLE, not a silent pass. A caller
    # that supplied its own command is responsible for that command, so nothing is checked.
    if not builder_supplied and not (repo / MANIFEST_BUILDER).is_file():
        raise Uncheckable(f"the candidate tree has no {MANIFEST_BUILDER}")
    if not generator_supplied and not (repo / VIEW_GENERATOR).is_file():
        raise Uncheckable(f"the candidate tree has no {VIEW_GENERATOR}")
    if not bundle_supplied and not (repo / BUNDLE_GENERATOR).is_file():
        raise Uncheckable(f"the candidate tree has no {BUNDLE_GENERATOR}")
    if not lifecycle_supplied and not (repo / LIFECYCLE_GENERATOR).is_file():
        raise Uncheckable(f"the candidate tree has no {LIFECYCLE_GENERATOR}")

    # Fetch with an EXPLICIT refspec that force-updates the remote-tracking ref. A plain
    # `git fetch origin master` writes FETCH_HEAD only and leaves refs/remotes/origin/master
    # where it was (Git 2.20 removed the opportunistic update), so the merge below would
    # reconcile the candidate against whichever master the checkout happened to see, not
    # against the master this run fetched. That is a silent wrong answer, so the refspec
    # names the destination.
    git(repo, "fetch", remote, f"+refs/heads/{branch}:refs/remotes/{remote}/{branch}")
    merge = git(repo, "merge", "--no-edit", f"{remote}/{branch}", check=False)
    if merge.returncode != 0:
        # A merge that failed without leaving MERGE_HEAD did not conflict; something else is
        # wrong and this must not be papered over.
        head = git(repo, "rev-parse", "-q", "--verify", "MERGE_HEAD", check=False)
        if head.returncode != 0:
            raise Uncheckable(
                "merge failed without a conflict to resolve: "
                f"{merge.stderr.strip() or merge.stdout.strip()}")
        conflicted = unmerged_paths(repo)
        master_ref = f"{remote}/{branch}"
        # A stamped artefact resolves to MASTER's bytes and MASTER's proof, as a pair.
        #
        # The candidate cannot hold a valid proof for its own bytes: a proof is minted
        # against the exact bytes it proves, and the candidate does not mint proofs. So
        # when master carries a proof for a path, the candidate's copy of that path is
        # stale, and its copy of the proof is stale with it. Measured 2026-10-29: master
        # re-stamped the SBOM while the candidate was parked, and the merge died on
        # public/interop/sbom-councilof-ai.json — one path — with the candidate unable to
        # reconcile at all.
        #
        # This is not "choose a side". For a derived view the generator decides the bytes,
        # so either side will do. For a stamped artefact the proof decides, and the proof
        # that exists is the one beside master's bytes.
        stamped = [p for p in conflicted if has_path(repo, master_ref, p + STAMPED_SUFFIX)]
        # The pointer to the witnessed root follows the root, and the estate's OWN release gate
        # is what says so: it asserts that a pointer binds the root in the tree it sits in, and
        # that its drift record binds that root too. So this is not a free choice between two
        # readings of the same file — the root decides, and the gate says which side agrees.
        #
        # If the rule decides nothing — neither side binds the root the merge kept — the path
        # stays a real conflict and this fails closed exactly as it did before. The guarantee
        # this script exists to hold is not weakened; it is stated in terms of the artefact.
        pointer_side = _pointer_side_for_merged_root(repo, conflicted)
        bound = [p for p in conflicted if pointer_side and p == ROOT_POINTER]
        real = [p for p in conflicted
                if not is_derived(p) and p not in stamped and p not in bound]
        if real:
            raise RealConflict(
                "REAL CONFLICT outside the derived views and the stamped artefacts; "
                "failing closed: " + ", ".join(real))
        for path in conflicted:
            if path in stamped:
                checkout = git(repo, "checkout", "--theirs", "--", path, check=False)
                if checkout.returncode != 0:
                    git(repo, "rm", "--quiet", "--", path)
                # The proof comes with the bytes it proves. If the proof itself conflicted,
                # master's proof is the one that matches master's bytes.
                proof = path + STAMPED_SUFFIX
                if proof in conflicted:
                    git(repo, "checkout", "--theirs", "--", proof, check=False)
                    git(repo, "add", "--", proof)
            elif path in bound:
                # The pointer follows the root the merge kept.
                checkout = git(repo, "checkout", f"--{pointer_side}", "--", path, check=False)
                if checkout.returncode != 0:
                    git(repo, "rm", "--quiet", "--", path)
            else:
                # a derived view: the generator decides the bytes, so either side will do
                checkout = git(repo, "checkout", "--ours", "--", path, check=False)
                if checkout.returncode != 0:
                    git(repo, "rm", "--quiet", "--", path)
            git(repo, "add", "--", path)
        git(repo, "commit", "--no-edit")

    ran = rebuild_derived_views(repo, builder, generator, bundle, lifecycle)
    git(repo, "add", "--", *DERIVED_VIEWS)
    git(repo, "add", "--", "public/interop/ots")
    if commit:
        staged = git(repo, "diff", "--cached", "--quiet", check=False)
        if staged.returncode != 0:
            git(repo, "commit", "-m",
                "reconcile: rebuild the derived views from the merged tree")
    return {"rebuilt": ran, "head": git(repo, "rev-parse", "HEAD").stdout.strip()}



# --------------------------------------------------------------------------------------------- selftest

def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _make_repo(tmp: Path, *, master_changes_root: bool, candidate_changes_root: bool) -> Path:
    """A candidate repo where the three derived views conflict, and optionally root.json too."""
    repo = tmp / "repo"
    repo.mkdir(parents=True)
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "root@csoai.org")
    git(repo, "config", "user.name", "csoai-public-root")
    # The machine's global hooks are the estate's own (a pre-push that refuses any repo without
    # scripts/pre-push-gates.sh). A throwaway fixture is not the estate, so point the hooks path
    # at an empty directory: the fixture must not inherit a gate meant for the real tree.
    empty_hooks = repo / ".no-hooks"
    empty_hooks.mkdir(exist_ok=True)
    git(repo, "config", "core.hooksPath", str(empty_hooks))
    for view in DERIVED_VIEWS:
        _write(repo / view, "base\n")
    _write(repo / "public/root.json", "base root\n")
    _write(repo / "scripts/ots_manifest_rebuild.py", "")
    _write(repo / "scripts/llms-txt.mjs", "")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "base")
    git(repo, "branch", "-M", "master")

    # master moves the derived views, and optionally root.json
    for view in DERIVED_VIEWS:
        _write(repo / view, "master\n")
    if master_changes_root:
        _write(repo / "public/root.json", "master root\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "master")

    # the candidate moves them differently, from the same base
    git(repo, "checkout", "-q", "-b", "candidate", "HEAD~1")
    for view in DERIVED_VIEWS:
        _write(repo / view, "candidate\n")
    if candidate_changes_root:
        _write(repo / "public/root.json", "candidate root\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "candidate")

    # a second remote so the merge has somewhere to come from
    remote = tmp / "remote.git"
    subprocess.run(["git", "clone", "-q", "--bare", str(repo), str(remote)], check=True)
    git(repo, "remote", "add", "origin", str(remote))
    git(repo, "fetch", "-q", "origin")
    git(repo, "checkout", "-q", "candidate")
    return repo


def _make_stamped_repo(tmp: Path) -> Path:
    """A candidate repo where MASTER re-stamps an artefact and the CANDIDATE holds a
    different copy of the same artefact, with the OLD proof.

    This is the 2026-10-29 situation exactly: master re-stamped
    public/interop/sbom-councilof-ai.json (#3614) while the candidate was parked with its
    own regenerated copy. The merge must not fail closed on that path, and the tree it
    leaves must carry master's bytes AND master's proof, because a proof is minted against
    the exact bytes it proves.
    """
    repo = tmp / "repo"
    repo.mkdir(parents=True)
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "root@csoai.org")
    git(repo, "config", "user.name", "csoai-public-root")
    empty_hooks = repo / ".no-hooks"
    empty_hooks.mkdir(exist_ok=True)
    git(repo, "config", "core.hooksPath", str(empty_hooks))
    for view in DERIVED_VIEWS:
        _write(repo / view, "base\n")
    _write(repo / "public/interop/stamped.json", "base artefact\n")
    _write(repo / "public/interop/stamped.json.ots", "base proof\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "base")
    git(repo, "branch", "-M", "master")

    # master re-stamps: new bytes AND a new proof beside them
    _write(repo / "public/interop/stamped.json", "master artefact\n")
    _write(repo / "public/interop/stamped.json.ots", "master proof\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "master re-stamps")

    # the candidate holds its own regenerated copy, and the inherited proof
    git(repo, "checkout", "-q", "-b", "candidate", "HEAD~1")
    _write(repo / "public/interop/stamped.json", "candidate artefact\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "candidate regenerates")

    remote = tmp / "remote.git"
    subprocess.run(["git", "clone", "-q", "--bare", str(repo), str(remote)], check=True)
    git(repo, "remote", "add", "origin", str(remote))
    git(repo, "fetch", "-q", "origin")
    git(repo, "checkout", "-q", "candidate")
    return repo


def _fixture_root(card_count: int, merkle: str, as_of: str) -> bytes:
    """Root bytes for a fixture. The fields are the ones the release gate binds."""
    return (json.dumps({
        "kind": "csoai.public-root/0.1",
        "as_of": as_of,
        "card_count": card_count,
        "merkle_root": merkle,
    }, indent=2) + "\n").encode("utf-8")


def _fixture_pointer(root_raw: bytes) -> bytes:
    """A root-witness pointer that binds exactly these root bytes."""
    root = json.loads(root_raw)
    sha = hashlib.sha256(root_raw).hexdigest()
    doc = {
        "kind": "csoai.root-witness-pointer/v0",
        "as_of": "2026-11-07T00:00:00Z",
        "live_root": {
            "url": "https://councilof.ai/root.json",
            "sha256": sha,
            "bytes": len(root_raw),
            "merkle_root": root["merkle_root"],
            "card_count": root["card_count"],
            "as_of": root["as_of"],
        },
        "drift": {
            "status": "MATCH",
            "checked_at": "2026-11-07T00:00:00Z",
            "checked_against": "https://councilof.ai/root.json",
            "live_root_sha256": sha,
            "live_root_merkle_root": root["merkle_root"],
            "live_root_bytes": len(root_raw),
            "match_sha256": True,
            "match_merkle_root": True,
            "witness_artifact_sha256": sha,
            "witness_artifact_merkle_root": root["merkle_root"],
            "reason": "the fixture's live root is byte-identical to the witnessed bytes",
        },
    }
    return (json.dumps(doc, indent=2) + "\n").encode("utf-8")


def _make_pointer_repo(tmp: Path, *, candidate_pointer_binds: bool) -> Path:
    """A candidate repo where the root-witness POINTER conflicts beside a root that also moved.

    This is the 2026-11-07 situation exactly: the rolling candidate carries a newer root and a
    pointer that binds it; master's pointer binds master's root; and the merge of master into
    the candidate keeps the candidate's root. The pointer must follow the root.

    With candidate_pointer_binds=False the candidate's pointer binds NEITHER the root the
    merge keeps nor master's root, so the rule decides nothing and the merge must still fail
    closed.
    """
    repo = tmp / "repo"
    repo.mkdir(parents=True)
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "root@csoai.org")
    git(repo, "config", "user.name", "csoai-public-root")
    empty_hooks = repo / ".no-hooks"
    empty_hooks.mkdir(exist_ok=True)
    git(repo, "config", "core.hooksPath", str(empty_hooks))
    # The rule is the GATE'S rule, so the fixture carries the estate's real gate.
    gate = Path(__file__).resolve().parents[1] / RELEASE_GATE
    if not gate.is_file():
        raise Uncheckable(f"the release gate is not beside this tool: {gate}")
    (repo / "scripts").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(gate, repo / RELEASE_GATE)
    for view in DERIVED_VIEWS:
        _write(repo / view, "base\n")
    root_a = _fixture_root(428, "a" * 64, "2026-11-01T15:09:42Z")
    root_b = _fixture_root(428, "b" * 64, "2026-11-01T19:41:11Z")
    root_c = _fixture_root(429, "c" * 64, "2026-11-01T23:43:53Z")
    root_d = _fixture_root(427, "d" * 64, "2026-11-01T09:00:00Z")
    _write(repo / ROOT_PATH, root_a.decode("utf-8"))
    _write(repo / ROOT_POINTER, _fixture_pointer(root_a).decode("utf-8"))
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "base")
    git(repo, "branch", "-M", "master")

    # master moves the pointer to a pointer that binds master's own root
    _write(repo / ROOT_POINTER, _fixture_pointer(root_b).decode("utf-8"))
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "master witnesses its own root")

    # the candidate moves the root, and its pointer follows it
    git(repo, "checkout", "-q", "-b", "candidate", "HEAD~1")
    _write(repo / ROOT_PATH, root_c.decode("utf-8"))
    _write(repo / ROOT_POINTER,
           _fixture_pointer(root_c if candidate_pointer_binds else root_d).decode("utf-8"))
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "candidate publishes a newer root")

    remote = tmp / "remote.git"
    subprocess.run(["git", "clone", "-q", "--bare", str(repo), str(remote)], check=True)
    git(repo, "remote", "add", "origin", str(remote))
    git(repo, "fetch", "-q", "origin")
    git(repo, "checkout", "-q", "candidate")
    return repo


def _stubs(repo: Path, log: Path) -> tuple[list[str], list[str]]:
    """Real, runnable stand-ins for the generators.

    They record the order they ran in, which is what the second fault was about: the
    manifest is generated from the tree, the views are generated from the manifest, and
    the views must never be generated first.

    The lifecycle stub writes the MERGED root's bytes into the ledger, so the selftest can
    assert the rebuild happened against the tree the merge left — not against the root the
    merge replaced. That is the fault this case was written for.
    """
    _write(repo / "scripts/ots_manifest_rebuild.py",
           f"open({str(log)!r}, 'a').write('manifest\\n')\n")
    _write(repo / "scripts/generate-cards-bundle.mjs",
           f"import {{ appendFileSync, existsSync, readFileSync, writeFileSync }} from 'node:fs';\n"
           f"appendFileSync({str(log)!r}, 'bundle\\n');\n"
           f"const root = existsSync('public/root.json')\n"
           f"  ? readFileSync('public/root.json', 'utf8') : 'no root in this tree\\n';\n"
           f"writeFileSync('public/card-feed-index.json', 'feed-of:' + root);\n")
    _write(repo / "scripts/build-model-lifecycle.mjs",
           f"import {{ appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync }} from 'node:fs';\n"
           f"appendFileSync({str(log)!r}, 'lifecycle\\n');\n"
           f"const root = existsSync('public/root.json')\n"
           f"  ? readFileSync('public/root.json', 'utf8')\n"
           f"  : 'no root in this tree\\n';\n"
           f"mkdirSync('public/interop', {{ recursive: true }});\n"
           f"mkdirSync('functions/api', {{ recursive: true }});\n"
           f"writeFileSync('public/interop/model-lifecycle.json', 'ledger-of:' + root);\n"
           f"writeFileSync('functions/api/_model-lifecycle-snapshot.ts', 'snapshot-of:' + root);\n")
    _write(repo / "scripts/llms-txt.mjs",
           f"import {{ appendFileSync }} from 'node:fs';\n"
           f"appendFileSync({str(log)!r}, 'views\\n');\n")
    return [sys.executable, "scripts/ots_manifest_rebuild.py"], ["node", "scripts/llms-txt.mjs"]


def run_selftest() -> int:
    failures = 0

    # 1. The three derived views conflict: the merge must survive it.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            ok = True
            detail = "reconciled"
        except (RealConflict, Uncheckable) as exc:
            ok = False
            detail = str(exc)
        print(f"  {'ok ' if ok else 'BAD'} derived-view conflict is reconciled: {detail}")
        failures += not ok

    # 2. root.json conflicts too: that is a REAL conflict and must fail closed.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=True, candidate_changes_root=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            ok = False
            detail = "a real conflict was resolved automatically"
        except RealConflict as exc:
            ok = "root.json" in str(exc)
            detail = str(exc)[:100]
        except Uncheckable as exc:
            ok = False
            detail = f"unexpected UNCHECKABLE: {exc}"
        print(f"  {'ok ' if ok else 'BAD'} a real conflict fails closed: {detail}")
        failures += not ok

    # 3. The bundle and the manifest are rebuilt BEFORE the views that quote them. This is the
    #    second fault, and the bundle joined the chain when it was measured as a derived view
    #    the reconcile did not know about. The lifecycle ledger joined it for the same reason:
    #    it is a derived view the reconcile did not know about, and a view rebuilt after its
    #    inputs is the whole rule.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        reconcile(repo, builder=builder, generator=generator)
        order = log.read_text(encoding="utf-8").split()
        ok = order == ["bundle", "lifecycle", "manifest", "views"]
        print(f"  {'ok ' if ok else 'BAD'} the bundle and the manifest are rebuilt before the "
              f"views that quote them: {order}")
        failures += not ok

    # 4. The candidate tree is reconciled with master and ends up containing master's bytes
    #    for a file neither side derived. The remote's master moves from a SECOND clone, so
    #    this repo's refs/remotes/origin/master is STALE when the reconcile runs. That is the
    #    real situation — another lane pushed to master — and it is exactly what a plain
    #    `git fetch origin master` does not fix, because that writes FETCH_HEAD only and
    #    leaves the tracking ref where it was (Git 2.20 removed the opportunistic update).
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        remote_url = git(repo, "remote", "get-url", "origin").stdout.strip()
        other = Path(tmp) / "other"
        subprocess.run(["git", "clone", "-q", remote_url, str(other)], check=True)
        empty_hooks = other / ".no-hooks"
        empty_hooks.mkdir(exist_ok=True)
        git(other, "config", "core.hooksPath", str(empty_hooks))
        git(other, "config", "user.email", "root@csoai.org")
        git(other, "config", "user.name", "csoai-public-root")
        git(other, "checkout", "-q", "master")
        _write(other / "plain.txt", "from master\n")
        git(other, "add", "-A")
        git(other, "commit", "-q", "-m", "master adds a plain file")
        git(other, "push", "-q", "origin", "master")
        git(repo, "checkout", "-q", "candidate")
        # Narrow the remote's refspec, the way a checkout that tracks one branch has it.
        # With a narrow refspec a plain `git fetch origin master` writes FETCH_HEAD and
        # leaves refs/remotes/origin/master stale, so the merge would reconcile against an
        # OLD master and say so with a clean exit code. The fetch names its destination, so
        # the refspec cannot decide the answer.
        git(repo, "config", "remote.origin.fetch", "+refs/heads/other:refs/remotes/origin/other")
        stale = git(repo, "rev-parse", "refs/remotes/origin/master").stdout.strip()
        reconcile(repo, builder=builder, generator=generator)
        try:
            merged = git(repo, "cat-file", "-p", "HEAD:plain.txt").stdout.strip()
        except Uncheckable:
            merged = "<master's file never arrived>"
        fresh = git(repo, "rev-parse", "refs/remotes/origin/master").stdout.strip()
        ok = merged == "from master" and stale != fresh
        print(f"  {'ok ' if ok else 'BAD'} master moves under a narrow refspec and still comes "
              f"across: {merged!r} | tracking ref {'was stale, now refreshed' if stale != fresh else 'was NOT stale'}")
        failures += not ok

    # 5. A missing generator is UNCHECKABLE, not a silent pass.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        (repo / "scripts/llms-txt.mjs").unlink()
        try:
            reconcile(repo)
            ok = False
            detail = "a missing generator was not reported"
        except Uncheckable as exc:
            ok = VIEW_GENERATOR in str(exc)
            detail = str(exc)[:80]
        print(f"  {'ok ' if ok else 'BAD'} a missing generator is UNCHECKABLE: {detail}")
        failures += not ok

    # 6. The tool works when it is NOT in the tree it reconciles. This is not hypothetical:
    # the workflow checks out the rolling candidate branch, which does not have this file
    # until it merges master, so the tool is run from a copy fetched out of master while it
    # works on the candidate's tree. Run it the way the workflow runs it.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        _stubs(repo, log)
        outside = Path(tmp) / "tool" / "root_candidate_reconcile.py"
        outside.parent.mkdir(parents=True, exist_ok=True)
        outside.write_text(Path(__file__).read_text(encoding="utf-8"), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(outside), "--repo", str(repo)],
            capture_output=True, text=True, cwd=str(Path(tmp)))
        order = log.read_text(encoding="utf-8").split() if log.exists() else []
        ok = result.returncode == 0 and order == ["bundle", "lifecycle", "manifest", "views"]
        detail = (result.stdout.strip().splitlines() or [result.stderr.strip()])[-1][:90]
        print(f"  {'ok ' if ok else 'BAD'} the tool works from outside the tree it reconciles: "
              f"{detail} | order {order}")
        failures += not ok

    # 7. A re-stamped artefact: the merge must survive it, and the tree it leaves must carry
    #    MASTER's bytes and MASTER's proof. A candidate that kept its own copy would carry a
    #    proof that no longer proves what sits next to it.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_stamped_repo(Path(tmp))
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            artefact = git(repo, "cat-file", "-p", "HEAD:public/interop/stamped.json").stdout.strip()
            proof = git(repo, "cat-file", "-p", "HEAD:public/interop/stamped.json.ots").stdout.strip()
            ok = artefact == "master artefact" and proof == "master proof"
            detail = f"artefact {artefact!r} proof {proof!r}"
        except (RealConflict, Uncheckable) as exc:
            ok = False
            detail = str(exc)[:100]
        print(f"  {'ok ' if ok else 'BAD'} a re-stamped artefact takes master's bytes and master's proof: {detail}")
        failures += not ok

    # 8. The root-witness pointer follows the root. The candidate carries a newer root and the
    #    pointer that binds it; master's pointer binds master's root; the merge keeps the
    #    candidate's root. The pointer must resolve to the side that binds the root the merge
    #    kept — and the tree it leaves must satisfy the estate's own release gate.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_pointer_repo(Path(tmp), candidate_pointer_binds=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            pointer = git(repo, "cat-file", "-p", f"HEAD:{ROOT_POINTER}").stdout
            root_raw = git(repo, "cat-file", "-p", f"HEAD:{ROOT_PATH}").stdout
            gate = _load_release_gate(repo)
            binds = gate is not None and _binds_root(gate, pointer, root_raw)
            ok = binds
            detail = ("the pointer binds the root in the tree it landed in"
                      if binds else "the pointer in the tree does not bind the tree's root")
        except (RealConflict, Uncheckable) as exc:
            ok = False
            detail = str(exc)[:100]
        print(f"  {'ok ' if ok else 'BAD'} the pointer follows the root the merge kept: {detail}")
        failures += not ok

    # 9. The CONTROL: when neither side binds the root the merge kept, the rule decides
    #    nothing and the merge must STILL fail closed. A fix that resolves a conflict by
    #    guessing is worse than the conflict.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_pointer_repo(Path(tmp), candidate_pointer_binds=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            ok = False
            detail = "a pointer that binds no root was resolved automatically"
        except RealConflict as exc:
            ok = ROOT_POINTER in str(exc)
            detail = str(exc)[:100]
        except Uncheckable as exc:
            ok = False
            detail = f"unexpected UNCHECKABLE: {exc}"
        print(f"  {'ok ' if ok else 'BAD'} a pointer that binds no root still fails closed: {detail}")
        failures += not ok

    # 10. The lifecycle ledger is a derived view the reconcile must rebuild AFTER the merge.
    #     MEASURED 2026-11-07: the rolling candidate's pr-gates failed on
    #     functions/api/model-lifecycle.test.ts — the committed ledger still held the previous
    #     root's freshness stamps (estate_measurement_version 2026-11-01.2 -> 2026-11-01.3),
    #     because scripts/build-model-lifecycle.mjs had NO caller anywhere in the estate.
    #     The ledger in the tree the reconcile leaves must hold the root the merge kept.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            ledger = git(repo, "cat-file", "-p", "HEAD:public/interop/model-lifecycle.json").stdout
            snapshot = git(repo, "cat-file", "-p", "HEAD:functions/api/_model-lifecycle-snapshot.ts").stdout
            root_raw = git(repo, "cat-file", "-p", "HEAD:public/root.json").stdout
            ok = ledger == f"ledger-of:{root_raw}" and snapshot == f"snapshot-of:{root_raw}"
            detail = ("the ledger and the snapshot hold the root the merge kept"
                      if ok else f"ledger {ledger!r} does not hold the tree's root {root_raw!r}")
        except (RealConflict, Uncheckable) as exc:
            ok = False
            detail = str(exc)[:100]
        print(f"  {'ok ' if ok else 'BAD'} the lifecycle ledger is rebuilt from the merged tree: {detail}")
        failures += not ok

    # 11. The CONTROL for case 10: with the rebuild suppressed, the ledger keeps a side's bytes
    #     and the assertion above goes red. A case that cannot fail proves nothing.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        reconcile(repo, builder=builder, generator=generator, lifecycle=["node", "-e", ""])
        ledger = git(repo, "cat-file", "-p", "HEAD:public/interop/model-lifecycle.json").stdout
        root_raw = git(repo, "cat-file", "-p", "HEAD:public/root.json").stdout
        ok = ledger != f"ledger-of:{root_raw}"
        detail = ("without the rebuild the ledger keeps the pre-merge bytes"
                  if ok else "the ledger was rebuilt even though the generator was suppressed")
        print(f"  {'ok ' if ok else 'BAD'} without the rebuild the ledger goes stale: {detail}")
        failures += not ok

    # 12. The compact feed is another root-derived output of the existing bundle producer.
    #     It must be regenerated and committed after reconciliation, not inherit one side's
    #     stale projection. Read HEAD, not the working file, to exercise the staging list too.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        reconcile(repo, builder=builder, generator=generator)
        index = git(repo, "cat-file", "-p", "HEAD:public/card-feed-index.json").stdout
        root_raw = git(repo, "cat-file", "-p", "HEAD:public/root.json").stdout
        ok = index == f"feed-of:{root_raw}"
        print(f"  {'ok ' if ok else 'BAD'} the committed feed index holds the merged root")
        failures += not ok

    # 13. Suppressing the producer leaves the old index, so the case above can go red.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        reconcile(repo, builder=builder, generator=generator, bundle=["node", "-e", ""])
        index = git(repo, "cat-file", "-p", "HEAD:public/card-feed-index.json").stdout
        root_raw = git(repo, "cat-file", "-p", "HEAD:public/root.json").stdout
        ok = index != f"feed-of:{root_raw}"
        print(f"  {'ok ' if ok else 'BAD'} without the producer the feed index goes stale")
        failures += not ok

    if failures:
        print(f"root-candidate-reconcile selftest: FAIL ({failures} case(s))", file=sys.stderr)
        return 1
    print("root-candidate-reconcile selftest: PASS (13 cases)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Reconcile the public-root candidate with master")
    parser.add_argument("--repo", default=".", help="the candidate working tree")
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--branch", default="master")
    parser.add_argument("--selftest", action="store_true", help="Prove each failure goes red; no network")
    args = parser.parse_args()

    if args.selftest:
        return run_selftest()

    try:
        result = reconcile(Path(args.repo).resolve(), remote=args.remote, branch=args.branch)
    except RealConflict as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Uncheckable as exc:
        print(f"UNCHECKABLE: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({"state": "RECONCILED", **result}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
