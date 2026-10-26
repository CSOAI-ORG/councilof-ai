"""Guard: a third party's identifiers must not come back anywhere in this repository's tracked tree.

On 6 Oct 2026 we removed a third party's contact details (email addresses, domain names, a person's name
and a company name) from this tree, after we had told them that nothing naming them would be public. This
test fails if any of those identifiers comes back, in any tracked file or tracked path, in any letter case.

The identifiers are not in this repository in any form. The first version of this guard kept sha256
digests with short anchors; review on the PR showed that short strings are recovered from such hints by
offline search, and a dictionary of names or domains reverses a bare digest just as fast. So a public
digest of a name is the name. They are read at run time from the environment variable
THIRD_PARTY_GUARD_IDS (one identifier per line, or comma-separated), which pr-gates.yml fills from the
repository secret of the same name. Without it this guard cannot speak: in GitHub Actions it FAILS and says
so (UNMEASURED is not a pass); elsewhere it skips and says so.

Never print an identifier from here (failures name the file, the line and the identifier's position in the
list, nothing more), and keep identifiers out of commit messages and PR text too: history and PR pages are
public and are not cleaned by deleting a line.

A first name on its own should not be listed: an unrelated public account in the census data shares it.

The scan reads the working tree. Every regular tracked file must be present, so a sparse or partial
checkout fails loudly instead of passing on the files it happens to have.

    THIRD_PARTY_GUARD_IDS="$(cat <private list>)" python3 scripts/privacy/test_third_party_identifiers.py -v
"""
import os, re, subprocess, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
NL = b"\n"
MIN_LEN = 5  # a shorter entry would match ordinary text all over the tree


def guarded_ids(raw=None):
    raw = os.environ.get("THIRD_PARTY_GUARD_IDS", "") if raw is None else raw
    return [s.strip().lower() for s in re.split(r"[\n,]", raw) if s.strip()]


def hits(data, ids):
    """(offset, index into ids) for every occurrence of an identifier in `data` (bytes, any case)."""
    low = data.lower()
    out = []
    for k, ident in enumerate(ids):
        needle = ident.encode()
        i = low.find(needle)
        while i != -1:
            out.append((i, k))
            i = low.find(needle, i + 1)
    return out


def tracked(root=ROOT):
    """(mode, path) for every tracked entry."""
    out = subprocess.run(["git", "-C", root, "ls-files", "-s", "-z"], capture_output=True, check=True).stdout
    rows = []
    for rec in out.split(b"\0"):
        if rec:
            meta, path = rec.split(b"\t", 1)
            rows.append((meta.split(b" ", 1)[0].decode(), path))
    return rows


def scan(ids, root=ROOT):
    """(found, absent, scanned): found entries name file:line and the identifier's list position only."""
    found, absent, scanned = [], [], 0
    for mode, rel in tracked(root):
        name = rel.decode("utf-8", "surrogateescape")
        for _, k in hits(rel, ids):
            found.append(f"{name} (in the path; identifier #{k + 1})")
        if mode == "160000":  # a submodule: its own repository
            continue
        p = os.path.join(root.encode(), rel)
        if mode == "120000":  # a symlink: check where it points, not the target's bytes
            data = os.readlink(p) if os.path.islink(p) else None
        else:
            try:
                with open(p, "rb") as f:
                    data = f.read()
            except FileNotFoundError:
                data = None
        if data is None:
            absent.append(name)
            continue
        scanned += 1
        for start, k in hits(data, ids):
            found.append(f"{name}:{data.count(NL, 0, start) + 1} (identifier #{k + 1})")
    return found, absent, scanned


class Matcher(unittest.TestCase):
    """The matcher, checked on a synthetic identifier so that nothing real is named here."""

    ids = guarded_ids("placeholder-org\n, Example-Widget ")

    def test_list_parsing(self):
        self.assertEqual(self.ids, ["placeholder-org", "example-widget"])

    def test_found_in_any_case_and_inside_an_address(self):
        self.assertEqual(hits(b"write to info@PlaceHolder-ORG.example today", self.ids), [(14, 0)])

    def test_near_miss_is_not_found(self):
        self.assertEqual(hits(b"placeholder-orb placeholder_org example widget", self.ids), [])


class TrackedTree(unittest.TestCase):
    def test_no_guarded_identifier_in_any_tracked_path_or_file(self):
        ids = guarded_ids()
        if not ids:
            msg = ("THIRD_PARTY_GUARD_IDS is empty, so this guard cannot speak (UNMEASURED). In CI it comes from the "
                   "repository secret of the same name (Settings > Secrets and variables > Actions).")
            if os.environ.get("GITHUB_ACTIONS") == "true":
                self.fail(msg)
            self.skipTest(msg)
        short = [k + 1 for k, i in enumerate(ids) if len(i) < MIN_LEN]
        self.assertEqual(short, [], f"identifiers shorter than {MIN_LEN} characters (by list position) would match ordinary text")
        found, absent, scanned = scan(ids)
        self.assertGreater(scanned + len(absent), 1000, "git ls-files returned too little to be this repository")
        self.assertEqual(absent[:20], [], f"{len(absent)} tracked files are not in the working tree; "
                         "a partial checkout cannot vouch for the files it does not have")
        self.assertEqual(found, [], "a guarded third-party identifier is back in the tree (read this file's "
                         "docstring before changing anything): " + ", ".join(found[:20]))
        print(f"\n  {len(ids)} identifiers, {scanned} tracked files and every tracked path scanned: none found")


if __name__ == "__main__":
    unittest.main()
