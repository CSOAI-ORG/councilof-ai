"""Guard: no outside person's email address in any tracked file, or in a pull request's title, description or commits.

This repository is public, and so is every branch, commit message and pull request in it. On 19 Nov 2026 the owner
ruled that the contact details and correspondence of people outside Council of AI never go into any of them. Two
sweeps had to remove such addresses from public files, and earlier a correspondent's emails sat on a public branch for
weeks. Deleting a line later does not clean git history or PR pages, so this check fails before the merge.

An address is OUTSIDE, and fails, unless one of these holds (see classify()):
  - it is at one of our own domains (OWN_DOMAINS) or a subdomain of one;
  - it is a role or team mailbox: a word of its local part is in ROLE_WORDS (press, security, comments, ...), or its
    local part is a label of its own domain (the organisation's name);
  - it is at a domain reserved for examples (RFC 2606 and RFC 6761), a private-use name, or a placeholder domain;
  - it is a placeholder (PLACEHOLDER_LOCALS), a no-reply address or a cloud service account;
  - it is at a mailing-list host (list.* or lists.*);
  - it is listed, with a reason, in outside-email-allowlist.txt. List an organisation's published mailbox there, or a
    test value; never a person's own address.
A personal address of our own, such as a Gmail account, is outside too: use an address at one of our domains.

Not read as addresses: message IDs (a long number or a UUID before the @), and strings whose last label is not a
delegated top-level domain (iana-tlds.txt), such as np.asarray or logo@2x.png. Binary files and package lock files
are not read. A verbatim third-party record can be exempted as a whole file in the allowlist, pinned to its SHA-256:
the exemption lapses as soon as one byte of the file changes.

Never print an address from here. CI logs on a public repository are public too, so a failure names the file and line
(or the PR field, or the commit) and nothing more.

    python3 scripts/privacy/test_outside_email_addresses.py -v           # everything (CI: needs a full checkout)
    python3 scripts/privacy/test_outside_email_addresses.py Matcher -v   # the rules alone, on synthetic text
"""
from __future__ import annotations

import collections
import hashlib
import json
import os
import re
import subprocess
import tempfile
import time
import unittest
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ALLOWLIST = os.path.join(HERE, "outside-email-allowlist.txt")
TLD_FILE = os.path.join(HERE, "iana-tlds.txt")

OWN_DOMAINS = ("councilof.ai", "csoai.org", "proofof.ai", "openmoe.ai", "asisecurity.ai", "agisafe.ai",
               "safetyof.ai", "meok.ai", "defoneos.com")
RESERVED_DOMAINS = ("example.com", "example.org", "example.net")
RESERVED_TLDS = frozenset(("example", "test", "invalid", "localhost", "local", "internal", "lan"))
PLACEHOLDER_DOMAINS = ("email.com", "company.com", "yourcompany.com", "yourco.com", "yourdomain.com", "domain.com",
                       "mycompany.com", "acme.com", "test.com")
PLACEHOLDER_LOCALS = frozenset("""you your yourname your.name your_name name user username someone jane.doe john.doe
janedoe johndoe first.last firstname.lastname demo test sample example foo bar colleague password""".split())
SERVICE_DOMAINS = ("users.noreply.github.com", "noreply.github.com", "iam.gserviceaccount.com")
ROLE_WORDS = frozenset("""info contact contacts kontakt hello support help helpdesk service services customerservice
press presse prensa imprensa pr media mediarelations relations news newsroom communications comms marketing
globalmarketing security secure cert csirt psirt cyber vulnerability vuln disclosure bugbounty admin administrator
webmaster postmaster hostmaster abuse noc root sales enterprise team office enquiries enquiry inquiries inquiry mail
email inbox privacy dpo gdpr dataprotection legal compliance regulatory policy standards governance ethics research
partnerships partners partner integrationpartners sponsorships sponsors grants funding business jobs careers billing
finance payments accounts feedback editor editors editorial events community developers devrel ops operations it
registry membership members secretariat chair chairs comments comment consultation consultations correspondence
listing listings notify notifications alerts noreply donotreply reply mailer daemon bounce bounces git actions bot
bots ai digital connect""".split())

EMAIL = re.compile(rb"(?<![A-Za-z0-9._%+\-])([A-Za-z0-9._%+\-]{1,64})@"
                   rb"((?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,24}|xn--[A-Za-z0-9\-]{1,59}))"
                   rb"(?![A-Za-z0-9\-])")
# Encoded @ signs. None of these adds or removes a newline, so line numbers survive the substitution.
DECODE = ((re.compile(rb"%40"), b"@"), (re.compile(rb"&#0*64;|&#x0*40;|&commat;", re.I), b"@"))
MESSAGE_ID = re.compile(r"(?:%3c|<)?(?:[0-9]+(?:\.[0-9]+)+|[0-9]{12,}|[0-9a-f]{24,}"
                        r"|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", re.I)
BINARY_EXT = frozenset(""".png .jpg .jpeg .gif .webp .avif .ico .bmp .tif .tiff .psd .pdf .mp4 .mp3 .mov .m4a .wav
.ogg .webm .woff .woff2 .ttf .otf .eot .zip .gz .tgz .bz2 .xz .zst .7z .jar .whl .wasm .so .dylib .dll .exe .bin
.onnx .pt .pth .safetensors .npy .npz .pkl .parquet .arrow .sqlite .db .ots""".split())
LOCKFILES = frozenset("""package-lock.json npm-shrinkwrap.json yarn.lock pnpm-lock.yaml bun.lockb poetry.lock
Pipfile.lock uv.lock Cargo.lock go.sum composer.lock Gemfile.lock""".split())
HELP = ("Remove it. If it is an organisation's published mailbox, list it with a reason in "
        "scripts/privacy/outside-email-allowlist.txt; never list a person's own address.")


def load_tlds(path: str = TLD_FILE) -> frozenset:
    with open(path, encoding="ascii") as f:
        return frozenset(l.strip().lower() for l in f if l.strip() and not l.startswith("#"))


def load_allowlist(path: str = ALLOWLIST):
    """(addresses, exempt files {path: frozenset of sha256}, numbers of lines without a reason).

    A path may be listed more than once, one reviewed digest per line: a verbatim record that a
    publisher re-fetches (the public-root candidate re-mirrors its sources) has one reviewed digest
    per reviewed version. Each digest still names exact bytes; any other version is read in full."""
    addrs, files, bad = set(), {}, []
    with open(path, encoding="utf-8") as f:
        for n, raw in enumerate(f, 1):
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            entry, sep, reason = line.partition("#")
            entry = entry.strip()
            if not sep or not reason.strip() or not entry:
                bad.append(n)
            elif entry.startswith("file "):
                rel, sep2, digest = entry[5:].strip().rpartition(" sha256:")
                if not sep2 or not re.fullmatch(r"[0-9a-f]{64}", digest.strip().lower()):
                    bad.append(n)
                else:
                    files.setdefault(rel.strip(), set()).add(digest.strip().lower())
            else:
                addrs.add(entry.lower())
    return frozenset(addrs), {k: frozenset(v) for k, v in files.items()}, bad


def classify(local: str, domain: str, allow: frozenset = frozenset()) -> str:
    """'outside' fails; every other class passes."""
    local, domain = local.lower(), domain.lower()

    def at(*domains):
        return any(domain == d or domain.endswith("." + d) for d in domains)

    if f"{local}@{domain}" in allow:
        return "listed"
    if at(*OWN_DOMAINS) or any(domain.startswith(d + "-") for d in OWN_DOMAINS):  # also a file name like x@csoai.org-a.md
        return "own"
    if at(*SERVICE_DOMAINS):
        return "service"
    if at(*RESERVED_DOMAINS) or domain.rsplit(".", 1)[-1] in RESERVED_TLDS or domain.endswith(".home.arpa"):
        return "reserved"
    if at(*PLACEHOLDER_DOMAINS) or local in PLACEHOLDER_LOCALS:
        return "placeholder"
    if domain.split(".", 1)[0] in ("list", "lists"):
        return "list"
    words = [w for w in re.split(r"[._+\-]+", local) if w]
    if any(w in ROLE_WORDS for w in words) or local in domain.split(".")[:-1]:
        return "role"
    return "outside"


def find(data: bytes, tlds: frozenset, allow: frozenset = frozenset()):
    """(line, class) for every address in `data`."""
    if not any(k in data for k in (b"@", b"%40", b"&#", b"&commat;")):
        return []
    for rx, rep in DECODE:
        data = rx.sub(rep, data)
    out = []
    for m in EMAIL.finditer(data):
        local, domain = m.group(1).decode("ascii"), m.group(2).decode("ascii").lower()
        tld = domain.rsplit(".", 1)[-1]
        if MESSAGE_ID.fullmatch(local) or (tld not in tlds and tld not in RESERVED_TLDS):
            continue
        out.append((data.count(b"\n", 0, m.start()) + 1, classify(local, domain, allow)))
    return out


def readable(path: str, data: bytes) -> bool:
    name = path.rsplit("/", 1)[-1]
    if name in LOCKFILES or os.path.splitext(name)[1].lower() in BINARY_EXT:
        return False
    return b"\0" not in data[:8000]


def scan_items(items, tlds: frozenset, allow: frozenset, exempt: dict):
    """items: (path, bytes) pairs. Returns (found 'path:line' list, counts by class, files read)."""
    found, counts, read = [], collections.Counter(), 0
    for name, data in items:
        if not readable(name, data):
            continue
        read += 1
        reviewed = exempt.get(name) or ()
        if isinstance(reviewed, str):
            reviewed = (reviewed,)
        if reviewed and hashlib.sha256(data).hexdigest() in reviewed:
            counts["exempt file"] += 1
            continue
        for line, kind in find(data, tlds, allow):
            counts[kind] += 1
            if kind == "outside":
                found.append(f"{name}:{line}")
    return found, counts, read


def tracked(root: str = ROOT):
    """(mode, path bytes) for every tracked entry."""
    out = subprocess.run(["git", "-C", root, "ls-files", "-s", "-z"], capture_output=True, check=True).stdout
    rows = []
    for rec in out.split(b"\0"):
        if rec:
            meta, path = rec.split(b"\t", 1)
            rows.append((meta.split(b" ", 1)[0].decode(), path))
    return rows


def tree_items(root: str, absent: list):
    for mode, rel in tracked(root):
        if mode in ("160000", "120000"):  # a submodule (its own repository) or a symlink
            continue
        name = rel.decode("utf-8", "surrogateescape")
        try:
            with open(os.path.join(root.encode(), rel), "rb") as f:
                yield name, f.read()
        except FileNotFoundError:
            absent.append(name)


def annotate(locations, field_note: str = ""):
    """GitHub annotations for each location ('path:line'); never an address."""
    if os.environ.get("GITHUB_ACTIONS") != "true":
        return
    for loc in locations[:50]:
        path, _, line = loc.rpartition(":")
        if field_note:
            print(f"::error::An outside person's email address is in {loc}. {field_note}")
        else:
            print(f"::error file={path},line={line}::An outside person's email address is on this line. {HELP}")


def pr_number() -> str:
    return os.environ.get("PR_NUMBER", "").strip()


def pr_commit_messages(repo: str, number: str, token: str):
    """(short sha, message) for each commit of the PR (the API returns at most 250)."""
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "councilof-ai-outside-email-guard"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    out = []
    for page in range(1, 4):
        req = urllib.request.Request(
            f"https://api.github.com/repos/{repo}/pulls/{number}/commits?per_page=100&page={page}", headers=headers)
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    batch = json.load(r)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(3 * (attempt + 1))
        out += [(c["sha"][:10], c["commit"]["message"]) for c in batch]
        if len(batch) < 100:
            break
    return out


def addr(local: str, domain: str) -> bytes:
    """Builds a test address at run time, so that no address is written in this file."""
    return (local + "@" + domain).encode()


ELSEWHERE = "agency-x" + ".eu"  # a made-up organisation


class Matcher(unittest.TestCase):
    """The rules on synthetic text, including proof that each failure can still go red."""

    tlds = load_tlds()

    def kinds(self, text: bytes, allow: frozenset = frozenset()):
        return [k for _, k in find(text, self.tlds, allow)]

    def test_a_personal_address_is_outside(self):
        self.assertEqual(self.kinds(b"write to " + addr("jane.smith", ELSEWHERE) + b" today"), ["outside"])
        self.assertEqual(self.kinds(addr("jane.smith", "gmail.com")), ["outside"])  # our own webmail too

    def test_encoded_at_signs_are_read(self):
        for at in (b"%40", b"&#64;", b"&#x40;", b"&commat;"):
            self.assertEqual(self.kinds(b"jane.smith" + at + ELSEWHERE.encode()), ["outside"], at)

    def test_every_passing_class(self):
        cases = [("own", addr("nick", "councilof.ai")), ("own", addr("ops", "lab.meok.ai")),
                 ("role", addr("press.office", ELSEWHERE)), ("role", addr("sp800-239-comments", "nist.gov")),
                 ("role", addr("agencyx", "agencyx.eu")), ("role", addr("no-reply", ELSEWHERE)),
                 ("reserved", addr("jane", "example.com")), ("reserved", addr("jane", "agency.test")),
                 ("placeholder", addr("you", "company.com")), ("placeholder", addr("demo", ELSEWHERE)),
                 ("service", addr("12345+someone", "users.noreply.github.com")),
                 ("list", addr("wg-poc", "list.nist.gov"))]
        for kind, text in cases:
            self.assertEqual(self.kinds(text), [kind], text)

    def test_an_allowlisted_address_passes_and_only_that_one(self):
        allow = frozenset({addr("desk", ELSEWHERE).decode()})
        self.assertEqual(self.kinds(addr("desk", ELSEWHERE) + b" " + addr("jane.smith", ELSEWHERE), allow),
                         ["listed", "outside"])

    def test_things_that_are_not_addresses(self):
        for text in (b"z" + b"@" + b"np.asarray(x)", b"logo" + b"@2x.png", b"fn" + b"@pytest.mark.parametrize",
                     addr("1509486989.87654.1790069007934", ELSEWHERE),
                     addr("%3c32e85430-b650-4774-ad14-00688e473c5b", ELSEWHERE)):
            self.assertEqual(self.kinds(text), [], text)

    def test_line_numbers(self):
        self.assertEqual(find(b"one\ntwo\n" + addr("jane.smith", ELSEWHERE), self.tlds), [(3, "outside")])

    def test_binary_and_lock_files_are_not_read(self):
        self.assertFalse(readable("packages/x/package-lock.json", b"{}"))
        self.assertFalse(readable("public/a.png", b"text"))
        self.assertFalse(readable("docs/a.txt", b"ab\0cd"))
        self.assertTrue(readable("docs/a.md", b"hello"))

    def test_an_exemption_lapses_when_one_byte_changes(self):
        body = b"verbatim " + addr("jane.smith", ELSEWHERE)
        exempt = {"mirror.json": hashlib.sha256(body).hexdigest()}
        found, counts, _ = scan_items([("mirror.json", body)], self.tlds, frozenset(), exempt)
        self.assertEqual((found, counts["exempt file"]), ([], 1))
        found, _, _ = scan_items([("mirror.json", body + b" ")], self.tlds, frozenset(), exempt)
        self.assertEqual(found, ["mirror.json:1"])
        self.assertNotIn("@", found[0])  # a failure names a place, never the address

    def test_allowlist_lines_need_a_reason(self):
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
            f.write("# header\n" + addr("desk", ELSEWHERE).decode() + "  # the agency's press desk\n"
                    + addr("desk2", ELSEWHERE).decode() + "\n"
                    + "file a/b.json sha256:" + "0" * 64 + "  # verbatim record\n")
        try:
            addrs, files, bad = load_allowlist(f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual((sorted(addrs), files, bad),
                         ([addr("desk", ELSEWHERE).decode()], {"a/b.json": frozenset({"0" * 64})}, [3]))

    def test_a_path_can_carry_several_reviewed_digests_and_nothing_else(self):
        v1 = b"verbatim one " + addr("jane.smith", ELSEWHERE)
        v2 = b"verbatim two " + addr("jane.smith", ELSEWHERE)
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
            for body in (v1, v2):
                f.write("file m/r.json sha256:" + hashlib.sha256(body).hexdigest() + "  # reviewed version\n")
        try:
            _, files, bad = load_allowlist(f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual((bad, len(files["m/r.json"])), ([], 2))
        for body in (v1, v2):
            found, counts, _ = scan_items([("m/r.json", body)], self.tlds, frozenset(), files)
            self.assertEqual((found, counts["exempt file"]), ([], 1))
        found, _, _ = scan_items([("m/r.json", v2 + b" ")], self.tlds, frozenset(), files)
        self.assertEqual(found, ["m/r.json:1"])  # an unreviewed version is read like any other file


class TrackedTree(unittest.TestCase):
    def test_no_outside_address_in_any_tracked_file(self):
        allow, exempt, bad = load_allowlist()
        self.assertEqual(bad, [], "allowlist lines without a reason after '#', or with a malformed file entry")
        absent = []
        found, counts, read = scan_items(tree_items(ROOT, absent), load_tlds(), allow, exempt)
        listed = {p.decode("utf-8", "surrogateescape") for _, p in tracked(ROOT)}
        stale = sorted(p for p in exempt if p not in listed)
        self.assertGreater(read + len(absent), 1000, "git ls-files returned too little to be this repository")
        self.assertEqual(absent[:20], [], f"{len(absent)} tracked files are not in the working tree; "
                         "a partial checkout cannot vouch for the files it does not have")
        self.assertEqual(stale, [], "the allowlist exempts files that are no longer tracked: remove those entries")
        annotate(found)
        self.assertEqual(found, [], f"{len(found)} outside email address(es). {HELP} At: " + ", ".join(found[:30]))
        print(f"\n  {read} tracked text files read; addresses found by class: {dict(sorted(counts.items()))}; "
              "none outside")


class PullRequestText(unittest.TestCase):
    def test_title_and_description(self):
        if not pr_number():
            self.skipTest("not a pull request (PR_NUMBER is empty)")
        allow, _, _ = load_allowlist()
        tlds, found = load_tlds(), []
        for env, field in (("PR_TITLE", "this PR's title"), ("PR_BODY", "this PR's description")):
            for line, kind in find(os.environ.get(env, "").encode("utf-8", "surrogateescape"), tlds, allow):
                if kind == "outside":
                    found.append(f"{field}, line {line}")
        annotate(found, "Edit the PR to remove it: PR pages are public.")
        self.assertEqual(found, [], "outside email address(es) in " + "; ".join(found))


class PullRequestCommits(unittest.TestCase):
    def test_commit_messages(self):
        if not pr_number():
            self.skipTest("not a pull request (PR_NUMBER is empty)")
        repo = os.environ.get("GITHUB_REPOSITORY", "")
        if not repo:
            self.skipTest("GITHUB_REPOSITORY is not set")
        try:
            commits = pr_commit_messages(repo, pr_number(), os.environ.get("GH_TOKEN", ""))
        except Exception as e:  # UNMEASURED is not a pass
            self.fail(f"could not read this PR's commits ({type(e).__name__}), so their messages are unchecked")
        self.assertTrue(commits, "the API returned no commits for this PR")
        allow, _, _ = load_allowlist()
        tlds, found = load_tlds(), []
        for sha, message in commits:
            for line, kind in find(message.encode("utf-8", "surrogateescape"), tlds, allow):
                if kind == "outside":
                    found.append(f"commit {sha} message, line {line}")
        annotate(found, "Rewrite that commit's message: commit messages are public and the squash merge keeps them.")
        self.assertEqual(found, [], "outside email address(es) in " + "; ".join(found))
        print(f"\n  {len(commits)} commit message(s) read: none outside")


if __name__ == "__main__":
    unittest.main()
