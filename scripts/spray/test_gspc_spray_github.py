#!/usr/bin/env python3
"""The GitHub mirror republishes when its bytes differ, even under an unchanged root as_of.

THE DEFECT
──────────
``spray_github()`` returned UNCHANGED as soon as the mirror's SNAPSHOT.json carried the captured
root ``as_of``, so a board change that lands without a new root never reached CSOAI-ORG/gspc-board.
Seen live 2026-11-19: batch #4483 released two held axes under root as_of 2026-11-19T03:15:46Z.
The post-deploy spray republished the HF dataset, the HF Space and Kaggle, whose skips fall through
to ``byte_parity_reason``, and logged the GitHub mirror UNCHANGED. The mirror kept the old board.

THE RULE
────────
The as_of check still runs first. When it says skip, the mirror's copy of every SNAPSHOT_FILES
entry is read raw through the contents API and compared with the built snapshot. Any difference
republishes; exact equality stays UNCHANGED. A republish is confirmed by those bytes, because the
mirror already carried this as_of before the push.

Offline: no network, no credential, no git. The contents API and the git CLI are faked over one
in-memory copy of the mirror's main branch, so the spray's own decision is what is under test.
"""
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent


def load_spray():
    """gspc-spray.py has a hyphen: import it by path, under a name the test can hold."""
    spec = importlib.util.spec_from_file_location("gspc_spray_github_under_test", HERE / "gspc-spray.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


spray = load_spray()

AS_OF = "2026-11-19T03:15:46Z"   # the root that did not move when the board did
CONTENTS = f"https://api.github.com/repos/{spray.GITHUB_REPO}/contents/"
TOPICS = f"https://api.github.com/repos/{spray.GITHUB_REPO}/topics"
OLD_BOARD = b'{"axes":["before the release"]}'
NEW_BOARD = b'{"axes":["before the release","released axis"]}'


def snapshot_bytes(board: bytes, read_at: str) -> dict[str, bytes]:
    """The eight files one build writes. Each one follows the board, as a real build's files do."""
    digest = spray.sha256_hex(board)
    files = {name: f"{name} for board {digest}\n".encode() for name in spray.SNAPSHOT_FILES}
    files["board.json"] = board
    files["SNAPSHOT.json"] = json.dumps({"as_of": AS_OF, "read_at": read_at, "board_sha256": digest,
                                         "fingerprint": digest}).encode()
    return files


def build(tmp_path: Path, files: dict[str, bytes]) -> Path:
    snap = tmp_path / "snap"
    snap.mkdir()
    for name, data in files.items():
        (snap / name).write_bytes(data)
    return snap


def truth(board: bytes) -> dict:
    return {"as_of": AS_OF, "fingerprint": spray.sha256_hex(board), "lid": "test lid"}


class Mirror:
    """main of CSOAI-ORG/gspc-board, as the contents API serves it and as the git CLI changes it."""

    def __init__(self, files: dict[str, bytes], *, push_lands: bool = True):
        self.files = dict(files)
        self.push_lands = push_lands
        self.git: list[str] = []
        self.pushes: list[dict[str, bytes]] = []

    def http(self, url, *, method="GET", data=None, headers=None, timeout=60.0):
        if url == TOPICS:
            return 200, b'{"names": []}', {}
        assert url.startswith(CONTENTS) and method == "GET", (method, url)
        assert (headers or {}).get("Accept") == "application/vnd.github.raw+json", "contents must be read raw"
        name = url[len(CONTENTS):]
        if name in self.files:
            return 200, self.files[name], {}
        return 404, b'{"message": "Not Found"}', {}

    def run(self, cmd, *, cwd=None, env=None, check=True):
        assert cmd[0] == "git", cmd
        self.git.append(cmd[1])
        stdout = ""
        if cmd[1] == "clone":
            assert cmd[-2].endswith(f"@github.com/{spray.GITHUB_REPO}.git"), "the clone must be the mirror"
            dest = Path(cmd[-1])
            dest.mkdir(parents=True)
            for name, data in self.files.items():
                (dest / name).write_bytes(data)
        elif cmd[1] == "rm":
            (Path(cwd) / cmd[-1]).unlink()
        elif cmd[1] == "status":
            tree = self._tree(cwd)
            stdout = "".join(f" M {name}\n" for name in sorted(set(tree) | set(self.files))
                             if tree.get(name) != self.files.get(name))
        elif cmd[1] == "push":
            tree = self._tree(cwd)
            self.pushes.append(tree)
            if self.push_lands:
                self.files = tree
        return subprocess.CompletedProcess(cmd, 0, stdout, "")

    @staticmethod
    def _tree(cwd) -> dict[str, bytes]:
        return {p.name: p.read_bytes() for p in Path(cwd).iterdir() if p.is_file()}


@pytest.fixture
def wire(monkeypatch):
    def _wire(mirror: Mirror) -> Mirror:
        monkeypatch.setattr(spray, "github_token", lambda: "test-token")
        monkeypatch.setattr(spray, "http", mirror.http)
        monkeypatch.setattr(spray, "run", mirror.run)
        monkeypatch.setattr(spray.time, "sleep", lambda seconds: None)
        return mirror
    return _wire


def test_equal_as_of_with_different_board_bytes_pushes(wire, tmp_path):
    """The 2026-11-19 case: the root's as_of did not move and the board did. The mirror takes the new bytes."""
    published = snapshot_bytes(OLD_BOARD, read_at="2026-11-19T05:12:38Z")
    built = snapshot_bytes(NEW_BOARD, read_at="2026-11-19T06:17:00Z")
    mirror = wire(Mirror(published))
    assert spray.unchanged(json.loads(published["SNAPSHOT.json"]), truth(NEW_BOARD), False), \
        "premise: the as_of-first rule still says skip"

    rows = spray.spray_github(truth(NEW_BOARD), build(tmp_path, built), dry_run=False, force=False)

    assert len(mirror.pushes) == 1, f"an equal as_of stopped the push although the bytes differ: {rows}"
    assert mirror.files == built, "main does not carry the built bytes, file for file"
    assert [r["status"] for r in rows] == ["PUBLISHED"], rows


def test_equal_bytes_stay_unchanged(wire, tmp_path):
    """A mirror that already carries every built byte is left alone: no clone, no commit, no push."""
    built = snapshot_bytes(NEW_BOARD, read_at="2026-11-19T06:17:00Z")
    mirror = wire(Mirror(built))

    rows = spray.spray_github(truth(NEW_BOARD), build(tmp_path, built), dry_run=False, force=False)

    assert [r["status"] for r in rows] == ["UNCHANGED"], rows
    assert "already carries as_of" in rows[0]["detail"]
    assert mirror.git == [], "a byte-identical mirror was cloned or pushed"


def test_a_republish_under_the_same_as_of_is_confirmed_by_bytes(wire, tmp_path):
    """The mirror carried this as_of before the push, so an as_of re-read confirms a push nobody can see yet.
    Until the contents API serves the pushed bytes, the row says PUBLISHED-UNCONFIRMED."""
    published = snapshot_bytes(OLD_BOARD, read_at="2026-11-19T05:12:38Z")
    built = snapshot_bytes(NEW_BOARD, read_at="2026-11-19T06:17:00Z")
    mirror = wire(Mirror(published, push_lands=False))

    rows = spray.spray_github(truth(NEW_BOARD), build(tmp_path, built), dry_run=False, force=False)

    assert len(mirror.pushes) == 1, rows
    assert [r["status"] for r in rows] == ["PUBLISHED-UNCONFIRMED"], rows


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))
