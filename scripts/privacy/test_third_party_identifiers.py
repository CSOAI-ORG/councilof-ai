"""Guard: a third party's identifiers must not come back anywhere in this repository's tracked tree.

On 6 Oct 2026 we removed a third party's contact details (email addresses, domain names, a person's name
and a company name) from this tree, after we had told them that nothing naming them would be public. This
test fails if any of those identifiers comes back, in any tracked file or tracked path, in any letter case.

The identifiers are stored here only as sha256 digests, so this file does not name them. A digest keeps the
string out of a search; it does not hide it from someone who already has a guess. Each entry is
(anchor, offset, length, digest): the scan finds every occurrence of a short anchor cut from inside the
identifier, takes the `length` bytes that start `offset` bytes before it, and compares their sha256.

To guard another identifier, compute identifier_entry("<lower-case identifier>", "<4-character slice of it>")
in a local shell and add the tuple below. Never commit the identifier itself, and keep it out of commit
messages and PR text too: history and PR pages are public and are not cleaned by deleting a line.

A first name on its own is not guarded: an unrelated public account in the census data shares it.

The scan reads the working tree. Every regular tracked file must be present, so a sparse or partial
checkout fails loudly instead of passing on the files it happens to have.

    python3 scripts/privacy/test_third_party_identifiers.py -v      # needs git
"""
import hashlib, os, subprocess, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
NL = b"\n"

GUARDED = [
    ("ro-o", 2, 7, "6ee4b01a3f985deaa987520126f2df9047e5abcdff647cdfd6d4016eb4f76c03"),
    ("uroo", 1, 6, "856fb58e6a6ac1453f660e14451678b1d85fbbe8a4f045f3165851cdd59c27c8"),
    ("ro o", 2, 7, "d2ae1b263ad41b2134028c9d94a13ec6dc55f1e778ec3511d103740ce80b4218"),
    ("ro_o", 2, 7, "4ae3a2c0bde263afe2ede0d1446c7eb1e07730040eb0855d87f4128c3545e0bd"),
    ("otru", 1, 7, "b89e3769fe12e02798352c264dd86d9ada2b4702b2fd1377ff2900da168a7b84"),
    ("nhov", 5, 10, "e0ae74b63c1e144605db98e9de2e9af4a2f68656ede517436e3cbdfcdbf58cc7"),
]


def identifier_entry(identifier, anchor):
    identifier = identifier.lower()
    return (anchor, identifier.index(anchor), len(identifier), hashlib.sha256(identifier.encode()).hexdigest())


def hits(data, guarded=GUARDED):
    """Start offsets in `data` (bytes, any case) where a guarded identifier occurs."""
    low = data.lower()
    out = []
    for anchor, off, n, digest in guarded:
        a = anchor.encode()
        i = low.find(a)
        while i != -1:
            start = i - off
            if start >= 0 and hashlib.sha256(low[start:start + n]).hexdigest() == digest:
                out.append(start)
            i = low.find(a, i + 1)
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


class Matcher(unittest.TestCase):
    """The matcher, checked on a synthetic identifier so that nothing real is named here."""

    def setUp(self):
        self.e = identifier_entry("placeholder-org", "ehol")

    def test_found_in_any_case_and_inside_an_address(self):
        self.assertEqual(hits(b"write to info@PlaceHolder-ORG.example today", [self.e]), [14])

    def test_near_miss_is_not_found(self):
        self.assertEqual(hits(b"placeholder-orb placeholder_org", [self.e]), [])

    def test_anchor_too_close_to_the_start_is_not_misread(self):
        self.assertEqual(hits(b"eholder-org", [self.e]), [])

    def test_entries_are_well_formed(self):
        for anchor, off, n, digest in GUARDED:
            self.assertEqual(len(digest), 64)
            self.assertTrue(off >= 0 and off + len(anchor) <= n, anchor)


class TrackedTree(unittest.TestCase):
    def test_no_guarded_identifier_in_any_tracked_path_or_file(self):
        rows = tracked()
        self.assertGreater(len(rows), 1000, "git ls-files returned too little to be this repository")
        found, absent, scanned = [], [], 0
        for mode, rel in rows:
            name = rel.decode("utf-8", "surrogateescape")
            if hits(rel):
                found.append(f"{name} (in the path)")
            if mode == "160000":  # a submodule: its own repository
                continue
            p = os.path.join(ROOT.encode(), rel)
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
            for start in hits(data):
                found.append(f"{name}:{data.count(NL, 0, start) + 1}")
        self.assertEqual(absent[:20], [], f"{len(absent)} tracked files are not in the working tree; "
                         "a partial checkout cannot vouch for the files it does not have")
        self.assertEqual(found, [], "a guarded third-party identifier is back in the tree (see this file's "
                         "docstring before changing anything): " + ", ".join(found[:20]))
        self.assertGreater(scanned, 1000)


if __name__ == "__main__":
    unittest.main()
