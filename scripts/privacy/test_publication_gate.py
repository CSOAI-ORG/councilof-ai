"""Sandbox proof for scripts/privacy/publication_gate.py: planted, invented personal data must be caught, a clean
fixture must raise no alarm, and anything the gate cannot read must fail closed.

Everything personal here is made up. Names are invented; every address is at example.com (RFC 2606), built at run
time so that no address is written in this file; phone numbers are in the UK Ofcom drama range; tokens are random
looking strings of the right shape, assembled at run time. The gate normally lets example.com pass (it is a
reserved example domain), so the planted cases run in STRICT mode: the test removes example.com from the reserved
list, which makes it count as an outside domain. A separate test checks that the normal mode still passes it.

The test prints the catch rate (planted items caught / planted items) and the false alarms on the clean fixture.

    python3 scripts/privacy/test_publication_gate.py -v
"""
from __future__ import annotations

import bz2
import gzip
import importlib.util
import io
import json
import os
import re
import shutil
import tarfile
import tempfile
import unittest
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("publication_gate", os.path.join(HERE, "publication_gate.py"))
pg = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pg)

AT = "@"
EX = "example" + ".com"


def mail(local: str) -> str:
    return local + AT + EX


# Invented people. None is a real person.
PEOPLE = [("Zorblat Quimby", "zorblat.quimby"), ("Wendeline Fotheringay-Plum", "wendeline.plum"),
          ("Ottoline Brackenhurst", "o.brackenhurst"), ("Fenwick Marlowe-Dray", "fenwick.dray"),
          ("Perdita Nyquist-Vole", "perdita.vole")]
PHONE = "+44 7700 900" + "123"
FAKE_HF = "hf" + "_" + "aB3dE5gH7jK9mN1pQ3sT5vW7yZ9bC1dE3fG5"
FAKE_GH = "gh" + "p_" + "Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h6J7k8"
FAKE_AWS = "AK" + "IA" + "ABCDEFGHIJKLMNOP"
FAKE_PEM = "-----BEGIN " + "RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf9Cnzj4p4WGeKLs1Pt8Qu\n"
# Local-machine paths, assembled at run time so that this file never holds one; the account names are invented.
USERS, HOMES = "/Us" + "ers/", "/ho" + "me/"
WFA = "workspace" + "_for_ai"
JSONL_ROW = {"id": 1, "text": "ordinary benchmark answer", "sha256": "0" * 64}


def tar_bytes(members, mode="w:gz"):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode=mode) as t:
        for name, data in members:
            ti = tarfile.TarInfo(name)
            ti.size = len(data)
            t.addfile(ti, io.BytesIO(data))
    return buf.getvalue()


def zip_bytes(members):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in members:
            z.writestr(name, data)
    return buf.getvalue()


def planted_cases():
    """name -> {relative path: bytes}. Each is a one-file (or one-archive) fixture holding ONE planted item."""
    n1, a1 = PEOPLE[0]
    n2, a2 = PEOPLE[1]
    n3, a3 = PEOPLE[2]
    n4, a4 = PEOPLE[3]
    n5, a5 = PEOPLE[4]
    body = f"Contact {n1} at {mail(a1)} for the dataset.\n".encode()
    inner = {"data/answers.jsonl": (json.dumps(JSONL_ROW) + "\n").encode() * 50 + body}
    cases = {
        "email in a plain .md file": {"README.md": body},
        "email in a .jsonl row": {"rows.jsonl": (json.dumps({"owner": n2, "contact": mail(a2)}) + "\n").encode()},
        "email in a .csv cell": {"people.csv": f"name,email\n{n3},{mail(a3)}\n".encode()},
        "email in a file in a subfolder": {"a/b/c/notes.txt": b"x\n" * 30 + body},
        "email in a hidden file": {".hidden-notes": body},
        "email with %40": {"link.txt": f"mailto:{a4}%40{EX}\n".encode()},
        "email with &#64;": {"page.html": f"<p>{a5}&#64;{EX}</p>\n".encode()},
        "email with \\u0040 in JSON": {"x.json": ('{"c": "' + a1 + "\\u0040" + EX + '"}').encode()},
        "email in a file NAME": {f"export-{mail(a2)}.json": b"{}"},
        "email in a folder NAME": {f"{mail(a3)}/data.json": b"{}"},
        "email in a .tgz": {"bundle.tgz": tar_bytes([("data/rows.jsonl", b"{}\n" * 20 + body)])},
        "email in a .tar.gz member NAME": {"b.tar.gz": tar_bytes([(f"{mail(a4)}.txt", b"hello")])},
        "email in a plain .tar": {"b.tar": tar_bytes([("m.txt", body)], "w")},
        "email in a .tar.bz2": {"b.tar.bz2": tar_bytes([("m.txt", body)], "w:bz2")},
        "email in a .zip": {"bundle.zip": zip_bytes([("docs/readme.md", body)])},
        "email in a .zip member NAME": {"b.zip": zip_bytes([(f"{mail(a5)}.txt", b"hi")])},
        "email in a .jsonl.gz": {"rows.jsonl.gz": gzip.compress(body)},
        "email in a .txt.bz2": {"rows.txt.bz2": bz2.compress(body)},
        "email in a .tgz inside a .zip": {"outer.zip": zip_bytes([("inner.tgz", tar_bytes(list(inner.items())))])},
        "email in a .zip inside a .tgz": {"outer.tgz": tar_bytes([("inner.zip", zip_bytes(list(inner.items())))])},
        "email three archives deep": {"o.zip": zip_bytes([("m.tgz", tar_bytes([("n.zip", zip_bytes([("p.txt", body)]))]))])},
        "email in a minified 9 MB single line": {"big.json": b'{"a":"' + b"x" * (9 * 1024 * 1024) + body.replace(b"\n", b" ") + b'"}'},
        "phone number": {"contacts.md": f"{n1}: {PHONE}\n".encode()},
        "Hugging Face token": {"cfg.json": f'{{"token": "{FAKE_HF}"}}'.encode()},
        "GitHub token": {"env.txt": f"GH={FAKE_GH}\n".encode()},
        "AWS key id": {"creds.txt": f"id={FAKE_AWS}\n".encode()},
        "PEM private key": {"k.txt": FAKE_PEM.encode()},
        "token inside a .tgz": {"b.tgz": tar_bytes([("cfg.json", f'{{"t":"{FAKE_HF}"}}'.encode())])},
        "a .git directory (backup-shaped)": {".git/config": b"[core]\n"},
        "a .env file": {".env": b"FOO=bar\n"},
        "a kaggle.json": {"kaggle.json": b"{}"},
        "a .git directory inside a .tgz": {"backup.tgz": tar_bytes([("repo/.git/HEAD", b"ref: refs/heads/master\n")])},
        "private-list name in a .md": {"about.md": b"Written with help from Zorblat Quimby of nowhere.\n"},
        "private-list name inside a .zip": {"a.zip": zip_bytes([("n.txt", b"thanks to WENDELINE FOTHERINGAY-PLUM\n")])},
        # local-machine paths and internal catalogue names (2026-11-27)
        "macOS home path in a .md": {"notes.md": f"population: registers in `{USERS}zorblat/_drafts/CATALOG.md`\n".encode()},
        "home path with JSON-escaped slashes": {"x.json": ('{"p": "' + USERS.replace("/", "\\/") + 'zorblat\\/a.json"}').encode()},
        "Linux VM home path in a receipt": {"receipt.json": f'{{"stdout_tail": "WROTE {HOMES}ubuntu/_run/out/a.json"}}'.encode()},
        "Windows home path": {"desc.txt": b"C:\\Us" + b"ers\\zorblat\\Desktop\\x\n"},
        "private folder workspace_for_ai": {"log.txt": f"cwd {WFA}/scratch\n".encode()},
        "private folder ~/_alignment": {"a.md": ("read ~/" + "_alignment/CATALOG.md\n").encode()},
        "private folder ~/.csoai-keys": {"a.md": ("key in ~/" + ".csoai-keys/cose.pem\n").encode()},
        "LaunchAgent label": {"agent.plist": ("<key>Label</key><string>com." + "csoai.daily-sweep</string>\n").encode()},
        "home path inside a .tgz": {"b.tgz": tar_bytes([("run.log", f"cd {USERS}zorblat/repo\n".encode())])},
        "catalogue name in a folder NAME": {"jewels/master-catalogue/index.json": b"{}"},
        "catalogue name in a .zip member NAME": {"b.zip": zip_bytes([("crown-jewels.md", b"hi")])},
    }
    return cases


def materialise(root: str, files: dict):
    for rel, data in files.items():
        p = os.path.join(root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "wb") as f:
            f.write(data)


def clean_fixture():
    """A tree with every kind of text that must NOT raise an alarm."""
    own = ["nick", "press", "hello"]
    files = {
        "README.md": ("# Clean dataset\n\nQuestions: " + own[1] + AT + "councilof.ai or " + own[2] + AT + "csoai.org.\n"
                      "Example: " + mail("jane") + " and security" + AT + "nist.gov (a published role mailbox).\n"
                      "A placeholder: you" + AT + "company.com. Not addresses: np.asarray(x), logo" + AT + "2x.png, "
                      "@pytest.mark.parametrize, user" + AT + "localhost.\n").encode(),
        "rows.jsonl": b"".join((json.dumps({"id": i, "label": "TIE", "sha256": "ab" * 32, "n": 30 + i,
                                            "version": "1.2.3", "ts": "2026-11-22T05:44:00Z"}) + "\n").encode()
                               for i in range(400)),
        "card.md": b"Measured 335 of 335 cards; TIE is TIE. Ed25519 key did:web:csoai.org#board-attestation-1.\n"
                   b"Phone-like but not a phone: 2026-11-22 05:44, 1,234,567,890, 0.12345678, 100-200-300.\n",
        "table.csv": b"axis,n,score\nsafety,30,0.5\nsupply,31,0.25\n",
        "notes/long.txt": (b"The quick brown fox jumps over the lazy dog. " * 2000),
        "token-like-but-short.txt": b"hf_short ghp_short AKIAshort sk-short\n",
        "paths-that-are-not-local.md": (f"CI checkout {HOMES}runner/work/councilof-ai/councilof-ai.\n"
                                        f"A regulator page https://www.ecb.europa.eu{HOMES}html/index.en.html and "
                                        f"https://example.org{USERS}zorblat/profile. GET /api/users/{{id}}/.\n"
                                        "Domains csoai.com and meok.ai; csoai.com.example.org; an alignment folder; "
                                        "a .csoai-style key; jewellery is not a NAME here.\n").encode(),
        "docs/.env.example": b"HF_TOKEN=\n",
        "bundle.tgz": tar_bytes([("a/readme.md", b"nick" + AT.encode() + b"councilof.ai\n"), ("a/d.jsonl", b"{}\n" * 100)]),
        "bundle.zip": zip_bytes([("b/readme.md", b"press" + AT.encode() + b"csoai.org\n"), ("b/d.csv", b"a,b\n1,2\n")]),
        "rows.jsonl.gz": gzip.compress(b'{"label":"TIE"}\n' * 100),
    }
    return files


class Gate(unittest.TestCase):
    ids = ["Zorblat Quimby", "Wendeline Fotheringay-Plum"]

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="pubgate-")
        self.saved = (pg.det.RESERVED_DOMAINS, os.environ.get("THIRD_PARTY_GUARD_IDS"))
        os.environ["THIRD_PARTY_GUARD_IDS"] = "\n".join(self.ids)

    def tearDown(self):
        pg.det.RESERVED_DOMAINS = self.saved[0]
        if self.saved[1] is None:
            os.environ.pop("THIRD_PARTY_GUARD_IDS", None)
        else:
            os.environ["THIRD_PARTY_GUARD_IDS"] = self.saved[1]
        shutil.rmtree(self.tmp, ignore_errors=True)

    def strict(self):
        pg.det.RESERVED_DOMAINS = ()  # example.com now counts as an outside domain: the planted data is example.com

    def run_gate(self, root, **kw):
        return pg.gate([root], **kw)

    # ---------- the catch rate ----------
    def test_catch_rate_on_planted_data(self):
        self.strict()
        cases = planted_cases()
        caught, missed = 0, []
        for name, files in cases.items():
            d = os.path.join(self.tmp, f"case{caught + len(missed)}")
            materialise(d, files)
            code, res = self.run_gate(d)
            if code == 1 and res.findings:
                caught += 1
                for place, kind in res.findings:  # a failure names a place and a class, never a value
                    for person, local in PEOPLE:
                        self.assertNotIn(local, place + kind)
                        self.assertNotIn(person, kind)
            else:
                missed.append((name, code))
        rate = caught / len(cases)
        print(f"\n  CATCH RATE: {caught}/{len(cases)} planted items caught = {rate:.1%}"
              f" (cases: plain, encoded, in names, 1-3 archive levels deep, tar/tgz/tar.bz2/zip/gz/bz2, 9 MB line,"
              f" phone, 4 token kinds, backup-shaped, private-list names)")
        self.assertEqual(missed, [])

    def test_the_same_planted_data_in_one_tree_is_found_at_every_place(self):
        self.strict()
        cases = planted_cases()
        root = os.path.join(self.tmp, "all")
        for i, files in enumerate(cases.values()):
            materialise(os.path.join(root, f"c{i}"), files)
        code, res = self.run_gate(root)
        places = {p.split(os.sep)[0] for p, _ in res.findings}
        self.assertEqual(code, 1)
        self.assertEqual(len(places), len(cases), "every planted case should be reported under its own folder")

    # ---------- false alarms ----------
    def test_clean_fixture_has_no_false_alarm(self):
        for mode in ("normal", "strict"):
            if mode == "strict":
                self.strict()
            d = os.path.join(self.tmp, "clean-" + mode)
            materialise(d, clean_fixture())
            code, res = self.run_gate(d)
            fake = [(p, k) for p, k in res.findings]
            if mode == "strict":  # only the one reserved-domain example address is expected to flip
                fake = [f for f in fake if f[0] != "README.md:4"]
            n_files = res.files
            print(f"\n  FALSE ALARMS ({mode} mode): {len(fake)} on a clean fixture of {n_files} files incl. archives"
                  f" ({res.bytes} bytes read); unchecked: {len(res.unchecked)}")
            self.assertEqual(fake, [])
            if mode == "normal":
                self.assertEqual(code, 0, (res.findings, res.unchecked))

    def test_example_com_passes_in_normal_mode(self):
        d = os.path.join(self.tmp, "n")
        materialise(d, {"a.md": mail("jane").encode()})
        self.assertEqual(self.run_gate(d)[0], 0)

    # ---------- fail closed ----------
    def test_missing_path_empty_folder_and_no_args_are_not_a_pass(self):
        self.assertEqual(pg.gate([os.path.join(self.tmp, "nope")])[0], 2)
        os.makedirs(os.path.join(self.tmp, "empty"))
        self.assertEqual(pg.gate([os.path.join(self.tmp, "empty")])[0], 2)
        self.assertEqual(pg.gate([])[0], 2)

    def test_corrupt_and_truncated_archives_are_unchecked(self):
        good = tar_bytes([("m.txt", b"hello " * 5000)])
        materialise(self.tmp, {"trunc.tgz": good[: len(good) // 2], "junk.zip": b"PK\x03\x04 not really",
                               "junk.tar.gz": b"not gzip at all"})
        for name in ("trunc.tgz", "junk.zip", "junk.tar.gz"):
            code, res = pg.gate([os.path.join(self.tmp, name)])
            self.assertEqual(code, 2, name)

    def test_depth_limit_fails_closed(self):
        blob = b"x"
        for i in range(pg.MAX_DEPTH + 1):
            blob = zip_bytes([(f"l{i}.zip", blob)])
        materialise(self.tmp, {"deep.zip": blob})
        self.assertEqual(pg.gate([os.path.join(self.tmp, "deep.zip")])[0], 2)

    def test_size_and_member_limits_fail_closed(self):
        materialise(self.tmp, {"b.tgz": tar_bytes([(f"f{i}.txt", b"abc") for i in range(10)])})
        old = pg.MAX_MEMBERS
        try:
            pg.MAX_MEMBERS = 5
            self.assertEqual(pg.gate([os.path.join(self.tmp, "b.tgz")])[0], 2)
        finally:
            pg.MAX_MEMBERS = old
        old = pg.MAX_TOTAL_BYTES
        try:
            pg.MAX_TOTAL_BYTES = 100
            materialise(self.tmp, {"big.txt": b"y" * 1000})
            self.assertEqual(pg.gate([os.path.join(self.tmp, "big.txt")])[0], 2)
        finally:
            pg.MAX_TOTAL_BYTES = old

    def test_opaque_formats_are_unchecked_unless_named(self):
        materialise(self.tmp, {"d.parquet": b"PAR1\x00\x01binary", "ok.txt": b"fine\n"})
        self.assertEqual(pg.gate([self.tmp])[0], 2)
        self.assertEqual(pg.gate([self.tmp], opaque_ok=[".parquet"])[0], 0)

    def test_symlinks_are_unchecked(self):
        materialise(self.tmp, {"real.txt": b"fine\n"})
        os.symlink(os.path.join(self.tmp, "real.txt"), os.path.join(self.tmp, "link.txt"))
        self.assertEqual(pg.gate([self.tmp])[0], 2)

    def test_the_private_list_can_be_required(self):
        os.environ.pop("THIRD_PARTY_GUARD_IDS")
        materialise(self.tmp, {"ok.txt": b"fine\n"})
        self.assertEqual(pg.gate([self.tmp])[0], 0)
        self.assertEqual(pg.gate([self.tmp], require_ids=True)[0], 2)

    def test_output_never_contains_a_matched_value(self):
        self.strict()
        materialise(self.tmp, {"r.md": f"{PEOPLE[0][0]} {mail(PEOPLE[0][1])} {PHONE} {FAKE_HF}\n".encode()})
        code, res = pg.gate([self.tmp])
        buf = io.StringIO()
        import contextlib
        with contextlib.redirect_stdout(buf):
            pg.report(code, res)
        out = buf.getvalue()
        self.assertEqual(code, 1)
        for secret in (PEOPLE[0][1], PEOPLE[0][0], PHONE, FAKE_HF, EX):
            self.assertNotIn(secret, out)

    def test_cli_exit_codes(self):
        import subprocess
        import sys
        materialise(self.tmp, {"ok.txt": b"fine\n"})
        run = lambda *a: subprocess.run([sys.executable, "-I", os.path.join(HERE, "publication_gate.py"), *a],
                                        capture_output=True, text=True).returncode
        self.assertEqual(run(self.tmp), 0)
        self.assertEqual(run(os.path.join(self.tmp, "missing")), 2)
        materialise(self.tmp, {"bad.txt": ("zz" + AT + "agency-x.eu").encode()})
        self.assertEqual(run(self.tmp), 1)



class NameAndSasRegressions(unittest.TestCase):
    """Synthetic regressions for the public registry's exposed SAS credential class."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="name-sas-private-")
        self.old = os.environ.get("THIRD_PARTY_GUARD_IDS")
        os.environ["THIRD_PARTY_GUARD_IDS"] = "Zorblat Quimby"

    def tearDown(self):
        if self.old is None:
            os.environ.pop("THIRD_PARTY_GUARD_IDS", None)
        else:
            os.environ["THIRD_PARTY_GUARD_IDS"] = self.old
        shutil.rmtree(self.tmp, ignore_errors=True)

    def rendered(self, code, result):
        import contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            pg.report(code, result)
        return buf.getvalue()

    def test_private_person_in_directory_name_is_blocked_and_redacted(self):
        materialise(self.tmp, {"Zorblat Quimby/data.jsonl": b'{"id":"synthetic"}\n'})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 1)
        self.assertTrue(any("private-list-entry" in kind for _, kind in result.findings))
        self.assertNotIn("Zorblat Quimby", self.rendered(code, result))

    def test_private_person_in_archive_member_name_is_blocked(self):
        materialise(self.tmp, {"safe.zip": zip_bytes([("Zorblat Quimby/clean.txt", b"okay")])})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 1)
        self.assertTrue(any("private-list-entry" in kind for _, kind in result.findings))

    def test_hf_credential_in_filename_cannot_escape_name_only_scan(self):
        materialise(self.tmp, {f"receipt-{FAKE_HF}.txt": b"fine"})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 1)
        self.assertTrue(any(kind == "credential:huggingface-token" for _, kind in result.findings))
        self.assertNotIn(FAKE_HF, self.rendered(code, result))

    def test_azure_sas_url_in_registry_jsonl_is_blocked_without_echo(self):
        signature = "F4k3S1gn4tur3P4yl04d" * 3
        url = ("https://fictional.blob.core.windows.net/public/object.json"
               "?sv=2023-11-03&se=2099-01-01T00:00:00Z&sp=r&sig=" + signature)
        materialise(self.tmp, {"server.jsonl": (json.dumps({"url": url}) + "\n").encode()})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 1)
        self.assertTrue(any(kind == "credential:azure-sas-url" for _, kind in result.findings))
        self.assertNotIn(signature, self.rendered(code, result))

    def test_html_escaped_sas_and_sas_filename_are_blocked(self):
        signature = "S1gn4tur3B4se64" * 3
        sas = "?sv=2023-11-03&amp;se=2099-01-01T00:00:00Z&amp;sp=r&amp;sig=" + signature
        materialise(self.tmp, {"escape.html": ("<a href='https://fictional.blob.core.windows.net/a" + sas + "'>x</a>").encode()})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 1)
        materialise(self.tmp, {"name" + sas.replace("&amp;", "&") + ".txt": b"fine"})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 1)
        self.assertTrue(any(kind == "credential:azure-sas-url" for _, kind in result.findings))
        self.assertNotIn(signature, self.rendered(code, result))

    def test_ordinary_sas_documentation_fields_without_signature_not_flagged(self):
        materialise(self.tmp, {"docs.txt": b"sv=2023-11-03, se=2099-01-01, sig=EXAMPLE\n"})
        code, result = pg.gate([self.tmp])
        self.assertEqual(code, 0)
        self.assertFalse(result.findings)


    def test_top_level_file_symlink_fails_closed_before_read(self):
        materialise(self.tmp, {"safe.txt": b"ordinary text"})
        link = os.path.join(self.tmp, "file-link.txt")
        os.symlink(os.path.join(self.tmp, "safe.txt"), link)
        code, result = pg.gate([link])
        self.assertEqual(code, 2)
        self.assertTrue(any("symlink input" in reason for _, reason in result.unchecked))

    def test_top_level_directory_symlink_fails_closed(self):
        materialise(self.tmp, {"source/clean.txt": b"ordinary text"})
        link = os.path.join(self.tmp, "dir-link")
        os.symlink(os.path.join(self.tmp, "source"), link)
        code, result = pg.gate([link])
        self.assertEqual(code, 2)
        self.assertTrue(any("symlink input" in reason for _, reason in result.unchecked))

    def test_nested_symlink_directory_is_not_silently_ignored(self):
        materialise(self.tmp, {"source/clean.txt": b"ordinary text", "outside/clean.txt": b"ordinary"})
        os.symlink(os.path.join(self.tmp, "outside"), os.path.join(self.tmp, "source", "unscanned"))
        code, result = pg.gate([os.path.join(self.tmp, "source")])
        self.assertEqual(code, 2)
        self.assertTrue(any("symlink directory" in reason for _, reason in result.unchecked))

class LocalPathAllowlist(unittest.TestCase):
    """The byte-exact exemption list shared with brand-gate.mjs: exact bytes pass, one changed byte fails, a line
    without a digest or a reason is UNCHECKABLE, and no output ever repeats a local path."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="localpath-")
        self.saved = pg.LOCAL_ALLOWLIST
        self.body = f'{{"population": "registers in {USERS}zorblat/_drafts/CATALOG.md"}}\n'.encode()
        materialise(os.path.join(self.tmp, "ds"), {"record.json": self.body})
        import hashlib
        self.digest = hashlib.sha256(self.body).hexdigest()

    def tearDown(self):
        pg.LOCAL_ALLOWLIST = self.saved
        shutil.rmtree(self.tmp, ignore_errors=True)

    def allowlist(self, text):
        p = os.path.join(self.tmp, "allow.txt")
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(text)
        pg.LOCAL_ALLOWLIST = p

    def test_listed_bytes_pass_and_are_counted(self):
        self.allowlist(f"# header\nfile public/record.json sha256:{self.digest}  # dated record, hash-committed\n")
        code, res = pg.gate([os.path.join(self.tmp, "ds")])
        self.assertEqual(code, 0, res.findings)
        self.assertEqual(res.counts["local-path:allowlisted-file"], 1)

    def test_one_changed_byte_lapses_the_exemption(self):
        self.allowlist(f"file public/record.json sha256:{self.digest}  # dated record\n")
        materialise(os.path.join(self.tmp, "ds"), {"record.json": self.body + b" "})
        code, res = pg.gate([os.path.join(self.tmp, "ds")])
        self.assertEqual(code, 1)
        self.assertIn("local-machine-path:home-directory", {k for _, k in res.findings})

    def test_a_line_without_reason_is_uncheckable(self):
        self.allowlist(f"file public/record.json sha256:{self.digest}\n")
        code, res = pg.gate([os.path.join(self.tmp, "ds")])
        self.assertEqual(code, 1)  # the finding stands, and the list itself is flagged
        self.assertTrue(any("local-path-allowlist" in p for p, _ in res.unchecked))

    def test_the_repository_allowlist_is_well_formed(self):
        digests, bad = pg.load_local_allowlist(self.saved)
        self.assertEqual(bad, [])
        self.assertTrue(digests)

    def test_output_never_repeats_a_local_path(self):
        import contextlib
        self.allowlist("")
        materialise(os.path.join(self.tmp, "ds"), {f"{WFA}-notes.txt": b"x\n"})
        code, res = pg.gate([os.path.join(self.tmp, "ds")])
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            pg.report(code, res)
        out = buf.getvalue()
        self.assertEqual(code, 1)
        for leak in (USERS + "zorblat", WFA):
            self.assertNotIn(leak, out)


class Wiring(unittest.TestCase):
    """Every upload to Hugging Face or Kaggle in a workflow must run the gate first (same job, earlier step)."""

    ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
    UPLOAD = ("upload_file(", "upload_folder(", "upload_large_folder(", "hf upload", "huggingface-cli upload",
              "kaggle datasets create", "kaggle datasets version", "kaggle kernels push", "kaggle models create",
              "kaggle models instances", "create_commit(", "push_to_hub(")
    GATE = "scripts/privacy/publication_gate.py"

    @classmethod
    def _unguarded_jobs(cls, lines):
        """Small indentation-based workflow guard: compare upload/gate within each job.

        This is a static linter, not proof that a gate's shell command ran on
        exact published bytes. Conditional execution needs runtime receipts.
        """
        jobs = []
        in_jobs = False
        current = None
        for line in lines:
            if line == "jobs:":
                in_jobs = True
                continue
            if not in_jobs:
                continue
            if line and not line[0].isspace() and not line.startswith("#"):
                break
            m = re.fullmatch(r"  ([A-Za-z_][A-Za-z0-9_-]*):\s*(?:#.*)?", line)
            if m:
                current = [m.group(1), []]
                jobs.append(current)
            elif current is not None:
                current[1].append(line)
        def code_line(line):
            return not line.strip().startswith(("#", "name:", "- name:", "description:", "pretty_name:"))
        bad = []
        for name, job_lines in jobs:
            ups = [i for i, line in enumerate(job_lines)
                   if code_line(line) and any(term in line for term in cls.UPLOAD)]
            if not ups:
                continue
            gates = [i for i, line in enumerate(job_lines)
                     if code_line(line) and cls.GATE in line]
            if not gates or min(gates) > min(ups):
                bad.append(name)
        # If an upload exists but no parsable jobs block, reject the workflow.
        if not jobs and any(code_line(line) and any(term in line for term in cls.UPLOAD) for line in lines):
            bad.append("UNPARSEABLE_JOBS")
        return bad

    def test_every_workflow_upload_is_behind_the_gate(self):
        import glob
        bad = []
        for path in sorted(glob.glob(os.path.join(self.ROOT, ".github", "workflows", "*.yml"))):
            with open(path, encoding="utf-8") as f:
                lines = f.read().split("\n")
            for job in self._unguarded_jobs(lines):
                bad.append(os.path.relpath(path, self.ROOT) + ":" + job)
        self.assertEqual(bad, [], "these workflows contain a Hugging Face or Kaggle upload "
                         "without the publication gate earlier in the SAME job: " + ", ".join(bad))

    def test_wiring_lint_catches_cross_job_gate(self):
        lines = [
            "name: synthetic", "jobs:",
            "  scan:", "    steps:", "      - run: python scripts/privacy/publication_gate.py out",
            "  publish:", "    steps:", "      - run: kaggle datasets create out",
        ]
        self.assertEqual(self._unguarded_jobs(lines), ["publish"])

    def test_wiring_lint_accepts_guarded_upload_in_one_job(self):
        lines = ["jobs:", "  publish:", "    steps:",
                 "      - run: python scripts/privacy/publication_gate.py out",
                 "      - run: kaggle datasets create out"]
        self.assertEqual(self._unguarded_jobs(lines), [])

    def test_wiring_lint_rejects_upload_before_guard(self):
        lines = ["jobs:", "  publish:", "    steps:",
                 "      - run: huggingface-cli upload out",
                 "      - run: python scripts/privacy/publication_gate.py out"]
        self.assertEqual(self._unguarded_jobs(lines), ["publish"])

    def test_python_uploaders_call_the_gate(self):
        for rel in ("scripts/pod-loops/hf_upload.py", "scripts/mirror_to_hf.py"):
            with open(os.path.join(self.ROOT, rel), encoding="utf-8") as f:
                self.assertIn("publication_gate.py", f.read(), rel)


if __name__ == "__main__":
    unittest.main()
