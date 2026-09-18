"""Fail-closed, committed-byte inputs for mirror_fanout; no network or credentials.
Checks local origin/master, not a remote approval or an institutional signature.
Snapshots prevent a later working-tree edit changing bytes after preflight.
"""
from contextlib import contextmanager
import fnmatch
import pathlib
import subprocess
import tempfile


class SourceRefused(ValueError):
    pass


def git(root, *args):
    try:
        r = subprocess.run(['git', '-C', str(root), *args], capture_output=True, timeout=15)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise SourceRefused('GIT_UNAVAILABLE') from exc
    if r.returncode:
        raise SourceRefused('GIT_CHECK_FAILED: ' + args[0])
    return r.stdout


def approved_source(root, artifacts, patterns, exclusions):
    root = pathlib.Path(root).resolve()
    top = pathlib.Path(git(root, 'rev-parse', '--show-toplevel').decode().strip()).resolve()
    if top != root:
        raise SourceRefused('ROOT_IS_NOT_REPOSITORY_TOPLEVEL')
    revision = git(root, 'rev-parse', '--verify', 'HEAD^{commit}').decode().strip()
    approved = git(root, 'rev-parse', '--verify', 'refs/remotes/origin/master^{commit}').decode().strip()
    if revision != approved:
        raise SourceRefused('HEAD_IS_NOT_LOCAL_ORIGIN_MASTER')
    if git(root, 'diff', '--no-ext-diff', '--name-only', '-z', 'HEAD', '--'):
        raise SourceRefused('TRACKED_SOURCE_CHANGED')
    if not artifacts or len(artifacts) != len(set(artifacts)):
        raise SourceRefused('EMPTY_OR_DUPLICATE_INPUT_SET')
    blobs = {}
    for rel in artifacts:
        p = pathlib.PurePosixPath(rel)
        if p.is_absolute() or '..' in p.parts or p.as_posix() != rel or '\\' in rel:
            raise SourceRefused('NONCANONICAL_INPUT_PATH')
        matches = any(len(p.parts) == len(pathlib.PurePosixPath(g).parts) and
                      all(fnmatch.fnmatchcase(a, b) for a, b in zip(p.parts, pathlib.PurePosixPath(g).parts))
                      for g in patterns)
        if not matches or any(rx.search(rel) for rx, _ in exclusions):
            raise SourceRefused('INPUT_OUTSIDE_PUBLISH_PROFILE: ' + rel)
        record = git(root, 'ls-tree', '-z', revision, '--', rel).rstrip(b'\0')
        if not record or b'\0' in record:
            raise SourceRefused('INPUT_NOT_IN_APPROVED_COMMIT: ' + rel)
        header, _ = record.split(b'\t', 1)
        mode, kind, oid = header.decode().split()
        if mode not in ('100644', '100755') or kind != 'blob':
            raise SourceRefused('INPUT_NOT_REGULAR_BLOB: ' + rel)
        target = root / rel
        if not target.is_file() or target.is_symlink() or root not in target.resolve().parents:
            raise SourceRefused('INPUT_NOT_CONTAINED_REGULAR_FILE: ' + rel)
        observed = git(root, 'hash-object', '--no-filters', '--', rel).decode().strip()
        if observed != oid:
            raise SourceRefused('INPUT_BYTES_DIFFER_FROM_COMMIT: ' + rel)
        blobs[rel] = oid
    return revision, blobs


@contextmanager
def committed_snapshot(root, blobs):
    with tempfile.TemporaryDirectory(prefix='csoai-mirror-inputs-') as td:
        snapshot = pathlib.Path(td)
        for rel, oid in blobs.items():
            target = snapshot / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            try:
                with target.open('xb') as stream:
                    r = subprocess.run(['git', '-C', str(root), 'cat-file', 'blob', oid],
                                       stdout=stream, stderr=subprocess.PIPE, timeout=20)
            except (OSError, subprocess.TimeoutExpired) as exc:
                raise SourceRefused('SNAPSHOT_FAILED') from exc
            if r.returncode:
                raise SourceRefused('SNAPSHOT_BLOB_UNAVAILABLE')
            observed = git(root, 'hash-object', '--no-filters', '--', str(target)).decode().strip()
            if observed != oid:
                raise SourceRefused('SNAPSHOT_DIGEST_MISMATCH')
        yield snapshot


def check_manifest_output(root, output):
    root = pathlib.Path(root).resolve()
    target = pathlib.Path(output)
    if not target.is_absolute():
        target = root / target
    if target.is_symlink():
        raise SourceRefused('OUTPUT_MUST_NOT_BE_SYMLINK')
    try:
        rel = target.resolve().relative_to(root).as_posix()
    except ValueError:
        return  # Explicit external report paths remain supported.
    if '.git' in pathlib.PurePosixPath(rel).parts:
        raise SourceRefused('OUTPUT_WOULD_OVERWRITE_GIT_METADATA')
    if git(root, 'ls-tree', '-z', 'HEAD', '--', rel):
        raise SourceRefused('OUTPUT_WOULD_OVERWRITE_TRACKED_SOURCE')
