#!/usr/bin/env python3
"""Pre-publication privacy gate: scan any folder, file or archive before it goes anywhere public. Fails closed.

Extends the detector behind the required `outside-email-addresses` check (test_outside_email_addresses.py: same
address grammar, same own/role/reserved/placeholder classes, same allowlist) from "this repository's tracked files"
to "whatever you are about to upload": a folder, a single file, or an archive (.tgz .tar.gz .tar .zip .gz .bz2 .xz,
nested up to MAX_DEPTH), without extracting anything to disk. Born of breach-002 (a backup of the repository
mirrored to a public Hugging Face dataset) and breach-003 (history on a public branch): a publication step must
read the exact bytes it is about to publish.

What it fails on (exit 1):
  - an outside person's email address (also %40, &#64; and \\u0040 spellings) in a file's bytes or in a path/member name;
  - a credential: Hugging Face / GitHub / Slack / OpenAI-style tokens, AWS key ids, PEM private keys;
  - a backup- or secret-shaped entry: a .git directory, .env, kaggle.json, an SSH key, a .pem/.key file;
  - an identifier from the private list in the environment variable named by --ids-env (default
    THIRD_PARTY_GUARD_IDS), matched case-insensitively; failures say the entry's position, never the entry;
  - an international phone number written with + and a country code (conservative: needs 9-14 digits);
  - a local-machine path or private working-folder name: a home directory (/Users/<name>/, /home/<name>/ other than
    the GitHub Actions runner's /home/runner/, C:\\Users\\<name>\\), workspace_for_ai, ~/_alignment, ~/.csoai*, or a
    LaunchAgent label com.csoai.* / com.meok.* (the same rules as scripts/brand-gate.mjs LOCAL_LEAK_RULES); a file
    whose exact bytes are listed in local-path-allowlist.txt (published debt, with a reason) is counted, not failed;
  - an internal catalogue name ("jewel", "crown-jewels") in a file, folder or archive member NAME.

What it refuses to vouch for (exit 2, UNCHECKABLE, never a pass): a path that does not exist or holds no files, an
archive it cannot open or that is encrypted, a nesting depth or size or member-count limit, a member too large to
read in memory, a read error. A file in an opaque binary format (parquet, sqlite, pdf, images, model weights...) has
its raw bytes searched, which finds only uncompressed text, and is listed as OPAQUE; OPAQUE also exits 2 unless the
caller names that extension with --opaque-ok (use it only for data already read by another check).

Not detected, said plainly: a person's name with no contact detail next to it (use the private list), addresses
hidden by base64 or by spelling out "at"/"dot", text inside compressed columns of opaque formats, and images.

Never prints a matched value: output names a place (file, archive member, line), a class and a count. CI logs on a
public repository are public too.

    python3 scripts/privacy/publication_gate.py PATH [PATH ...]          # exit 0 clean, 1 findings, 2 unchecked
    python3 scripts/privacy/publication_gate.py --opaque-ok .parquet out/ds
    python3 scripts/privacy/publication_gate.py --selftest              # planted-data proof, see the test file
"""
from __future__ import annotations

import argparse
import bz2
import collections
import gzip
import hashlib
import importlib.util
import io
import lzma
import os
import re
import sys
import tarfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("outside_email", os.path.join(HERE, "test_outside_email_addresses.py"))
det = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(det)  # the one detector: find(), classify(), load_tlds(), load_allowlist()

NL = b"\n"
MAX_DEPTH = 4
MAX_TOTAL_BYTES = 4 * 1024**3        # decompressed bytes read across one run
MAX_MEMBERS = 250_000
MAX_NESTED_BYTES = 512 * 1024**2     # an archive inside an archive is read into memory up to this size
CHUNK = 8 * 1024**2
OVERLAP = 512

ARCHIVE_EXT = (".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tar.xz", ".txz", ".tar", ".zip", ".gz", ".bz2", ".xz")
OPAQUE_EXT = frozenset(""".png .jpg .jpeg .gif .webp .avif .ico .bmp .tif .tiff .psd .pdf .mp4 .mp3 .mov .m4a .wav
.ogg .webm .woff .woff2 .ttf .otf .eot .whl .wasm .so .dylib .dll .exe .bin .onnx .pt .pth .safetensors .gguf .npy
.npz .pkl .parquet .arrow .sqlite .db .ots .jar .7z .zst .h5 .hdf5 .pyc""".split())

SECRET_RX = tuple((kind, re.compile(rx)) for kind, rx in (
    ("credential:huggingface-token", rb"(?<![A-Za-z0-9_])hf_[A-Za-z0-9]{30,}"),
    ("credential:github-token", rb"(?<![A-Za-z0-9_])(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})"),
    ("credential:aws-key-id", rb"(?<![A-Za-z0-9])(?:AKIA|ASIA)[0-9A-Z]{16}(?![A-Za-z0-9])"),
    ("credential:slack-token", rb"xox[abprs]-[A-Za-z0-9\-]{20,}"),
    ("credential:api-key", rb"(?<![A-Za-z0-9_])sk-(?:ant-|proj-)?[A-Za-z0-9_\-]{32,}"),
    ("credential:private-key", rb"-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----"),
    ("credential:kaggle-key", rb"\"key\"\s*:\s*\"[0-9a-f]{32}\""),
))
PHONE_RX = re.compile(rb"(?<![0-9A-Za-z+])\+[1-9][0-9]{0,2}(?:[ .\-]?\(?[0-9]{1,4}\)?){2,5}(?![0-9A-Za-z])")
EXTRA_DECODE = ((re.compile(rb"\\u0040", re.I), b"@"), (re.compile(rb"\\x40", re.I), b"@"))
# Azure SAS URLs can carry time-scoped bearer credentials. Requiring all three
# query fields reduces false alarms on ordinary documentation parameters.
# This is a lexical safeguard, not a complete credential-class inventory.
AZURE_SAS_SIG = re.compile(rb"(?:[?&])sig=[A-Za-z0-9%+/_=.\-]{16,}", re.I)
AZURE_SAS_VERSION = re.compile(rb"(?:[?&])sv=[0-9]{4}-[0-9]{2}-[0-9]{2}", re.I)
AZURE_SAS_EXPIRY = re.compile(rb"(?:[?&])se=[A-Za-z0-9%:TZ.\-]{8,}", re.I)
# Local-machine paths and internal catalogue names (added 2026-11-27 after the 2026-11-24 public-exposure audit).
# The same rules as LOCAL_LEAK_RULES in scripts/brand-gate.mjs, with the same reasons there; change both together.
# The look-behind keeps URL paths out (https://host/home/html/ is a third party's site). /home/runner/ is the
# GitHub Actions runner's home, common to every public workflow log, so it is the one exempt home.
LOCAL_RX = (
    ("local-machine-path:home-directory", re.compile(
        rb"(?<![A-Za-z0-9._~%+\-])/(?:Users|home)/(?!runner/)[A-Za-z0-9._\-]+/"
        rb"|(?<![A-Za-z0-9])[A-Za-z]:\\{1,2}Users\\{1,2}[A-Za-z0-9._\-]+\\")),
    ("local-machine-path:private-folder", re.compile(rb"workspace_for_ai|(?:~|\$HOME|\$\{HOME\})/(?:_alignment|\.csoai)", re.I)),
    ("local-machine-path:launchagent-label", re.compile(rb"(?<![A-Za-z0-9_.\-])com\.(?:csoai|meok)\.[A-Za-z0-9][A-Za-z0-9._\-]*", re.I)),
)
CATALOGUE_NAME = re.compile(rb"jewel", re.I)
LOCAL_ALLOWLIST = os.path.join(HERE, "local-path-allowlist.txt")
LOCAL_ALLOW_LINE = re.compile(r"^file\s+(\S+)\s+sha256:([0-9a-f]{64})\s+#\s*\S")


def load_local_allowlist(path=None):
    """Byte-exact exemptions shared with brand-gate.mjs: (set of sha256 digests, line numbers without digest/reason)."""
    digests, bad = set(), []
    try:
        with open(path or LOCAL_ALLOWLIST, encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except OSError:
        return digests, bad
    for i, line in enumerate(lines, 1):
        t = line.strip()
        if not t or t.startswith("#"):
            continue
        m = LOCAL_ALLOW_LINE.match(t)
        if m:
            digests.add(m.group(2))
        else:
            bad.append(i)
    return digests, bad


def local_normalise(data: bytes) -> bytes:
    """JSON's "\\/" and URL-encoded "%2F" read as "/" (no newline moves, so line numbers hold)."""
    return re.sub(rb"%2[Ff]", b"/", data.replace(b"\\/", b"/"))

SECRET_NAMES = ("kaggle.json", "id_rsa", "id_ed25519", "id_ecdsa", ".netrc", ".npmrc", ".pypirc")


def shaped_like_a_secret_or_backup(path: str):
    parts = [p for p in re.split(r"[\\/]+", path) if p]
    low = [p.lower() for p in parts]
    if ".git" in low:
        return "backup-shaped:git-directory"
    last = low[-1] if low else ""
    if last == ".env" or last.startswith(".env.") and last not in (".env.example", ".env.sample", ".env.template"):
        return "secret-file:env"
    if last in SECRET_NAMES:
        return "secret-file:" + last
    if last.endswith((".pem", ".key", ".p12", ".pfx")):
        return "secret-file:key-material"
    return None


class Result:
    def __init__(self, tlds, allow, ids, opaque_ok, local_allow=frozenset()):
        self.tlds, self.allow, self.ids, self.opaque_ok = tlds, allow, ids, frozenset(opaque_ok)
        self.local_allow = frozenset(local_allow)    # sha256 of files exempt from the local-path rules
        self.findings: list[tuple[str, str]] = []     # (place, class)
        self.unchecked: list[tuple[str, str]] = []    # (place, reason)
        self.opaque: list[str] = []
        self.counts = collections.Counter()           # class -> n (passing classes included)
        self.files = 0
        self.archives = 0
        self.bytes = 0
        self.members = 0

    def redact(self, place: str) -> str:
        """A path or archive member name can itself hold an address or a listed name: never print it."""
        b = place.encode("utf-8", "surrogateescape")
        for rx, rep in det.DECODE + EXTRA_DECODE:
            b = rx.sub(rep, b)
        b = det.EMAIL.sub(b"<address>", b)
        for ident in self.ids:
            b = re.sub(re.escape(ident), b"<listed-name>", b, flags=re.I)
        for _, rx in SECRET_RX:
            b = rx.sub(b"<credential>", b)
        # A SAS token in a path must never be reprinted in CI logs.
        b = AZURE_SAS_SIG.sub(b"?sig=<credential>", b.replace(b"&amp;", b"&"))
        for _, rx in LOCAL_RX:
            b = rx.sub(b"<local-path>", b)
        return b.decode("utf-8", "replace")

    def hit(self, place, kind):
        place = self.redact(place)
        if (place, kind) not in self.findings:
            self.findings.append((place, kind))

    def unc(self, place, reason):
        place = self.redact(place)
        self.unchecked.append((place, reason))


def scan_text(res: Result, place: str, data: bytes, first_line: int = 1, names_only: bool = False, local_sink=None):
    """Search `data` (bytes of a file, or a name). Adds findings to res. Local-path findings go to `local_sink`
    when given (the caller decides once the whole file's digest is known), else straight to res."""
    if not data:
        return
    for rx, rep in EXTRA_DECODE:
        data = rx.sub(rep, data)
    for line, kind in det.find(data, res.tlds, res.allow):
        res.counts["email:" + kind] += 1
        if kind == "outside":
            res.hit(f"{place}:{line + first_line - 1}", "outside-email-address")
    if names_only:
        # export-x@host.tld.json reads as host "tld.json": retry with the trailing .ext segments cut off
        cut = data
        for _ in range(3):
            cut, dot, _ext = cut.rpartition(b".")
            if not dot:
                break
            if any(k == "outside" for _, k in det.find(cut, res.tlds, res.allow)):
                res.hit(f"{place}:1", "outside-email-address")
                break
        # File and directory names also carry keys and private identities.
        # Continue through the same checks as file content.
    for kind, rx in SECRET_RX:
        for m in rx.finditer(data):
            res.hit(f"{place}:{data.count(NL, 0, m.start()) + first_line}", kind)
    for m in PHONE_RX.finditer(data):
        digits = sum(c in b"0123456789" for c in m.group(0))
        if 9 <= digits <= 14:
            res.hit(f"{place}:{data.count(NL, 0, m.start()) + first_line}", "phone-number")
    if res.ids:
        low = data.lower()
        for i, ident in enumerate(res.ids, 1):
            pos = low.find(ident)
            if pos >= 0:
                res.hit(f"{place}:{data.count(NL, 0, pos) + first_line}", f"private-list-entry-{i}")
    # SAS URLs often appear in JSONL registry crawls and tool cards. Recognise
    # a complete sv/se/sig trio even when HTML escaped, never echo the token.
    for i, line in enumerate(data.splitlines(), first_line):
        q = line.replace(b"&amp;", b"&").replace(b"\\u0026", b"&")
        if AZURE_SAS_SIG.search(q) and AZURE_SAS_VERSION.search(q) and AZURE_SAS_EXPIRY.search(q):
            res.hit(f"{place}:{i}", "credential:azure-sas-url")
    if names_only and CATALOGUE_NAME.search(data):
        res.hit(f"{place}:1", "internal-catalogue-name")
    norm = local_normalise(data)
    for kind, rx in LOCAL_RX:
        for m in rx.finditer(norm):
            entry = (f"{place}:{norm.count(NL, 0, m.start()) + first_line}", kind)
            if local_sink is None:
                res.hit(*entry)
            else:
                local_sink.append(entry)



def scan_stream(res: Result, place: str, fh):
    """Scan a binary file object in newline-aligned chunks. Local-path findings are held until the file's sha256
    is known: bytes listed in local-path-allowlist.txt are counted as published debt, anything else fails."""
    carry, line0 = b"", 1
    digest, local = hashlib.sha256(), []

    def settle():
        if local and digest.hexdigest() in res.local_allow:
            res.counts["local-path:allowlisted-file"] += 1
        else:
            for entry in local:
                res.hit(*entry)
    while True:
        block = fh.read(CHUNK)
        res.bytes += len(block)
        digest.update(block)
        if res.bytes > MAX_TOTAL_BYTES:
            res.unc(place, f"more than {MAX_TOTAL_BYTES} bytes read in this run")
            for entry in local:
                res.hit(*entry)
            return False
        data = carry + block
        if not block:
            scan_text(res, place, data, line0, local_sink=local)
            settle()
            return True
        cut = data.rfind(b"\n") + 1
        if cut == 0 or len(data) - cut > CHUNK // 2:   # no newline (minified): overlap instead of splitting a token
            cut = max(len(data) - OVERLAP, 1)
        scan_text(res, place, data[:cut], line0, local_sink=local)
        line0 += data[:cut].count(b"\n")
        carry = data[cut:]


def archive_kind(name: str):
    low = name.lower()
    for ext in ARCHIVE_EXT:
        if low.endswith(ext):
            return ext
    return None


def scan_file_obj(res: Result, place: str, name: str, fh, size, depth: int):
    """One file's bytes (real or an archive member)."""
    res.files += 1
    why = shaped_like_a_secret_or_backup(name)
    if why:
        res.hit(place, why)
    scan_text(res, place, name.encode("utf-8", "surrogateescape"), names_only=True)
    ext = archive_kind(name)
    if ext:
        if depth > 0:  # a member of another archive: not seekable, so hold it in memory (bounded)
            fh = read_nested(res, place, fh, size)
            if fh is None:
                return False
        return scan_archive(res, place, ext, fh, size, depth)
    suffix = os.path.splitext(name)[1].lower()
    if suffix in OPAQUE_EXT:
        res.opaque.append(res.redact(place))
        if suffix not in res.opaque_ok:
            res.unc(place, "opaque binary format: only raw bytes searched; name it with --opaque-ok if another check reads it")
    return scan_stream(res, place, fh)


def read_nested(res, place, fh, size):
    if size is not None and size > MAX_NESTED_BYTES:
        res.unc(place, "nested archive larger than the in-memory limit")
        return None
    data = fh.read(MAX_NESTED_BYTES + 1)
    if len(data) > MAX_NESTED_BYTES:
        res.unc(place, "nested archive larger than the in-memory limit")
        return None
    return io.BytesIO(data)


def scan_archive(res: Result, place: str, ext: str, fh, size, depth: int):
    res.archives += 1
    if depth >= MAX_DEPTH:
        res.unc(place, f"archives nested deeper than {MAX_DEPTH}")
        return False
    try:
        if ext == ".zip":
            with zipfile.ZipFile(fh) as z:
                for info in z.infolist():
                    res.members += 1
                    if res.members > MAX_MEMBERS:
                        res.unc(place, "too many archive members"); return False
                    if info.is_dir():
                        scan_text(res, f"{place}!{info.filename}", info.filename.encode(), names_only=True)
                        continue
                    if info.flag_bits & 0x1:
                        res.unc(f"{place}!{info.filename}", "encrypted zip member"); continue
                    with z.open(info) as m:
                        scan_file_obj(res, f"{place}!{info.filename}", info.filename, m, info.file_size, depth + 1)
            return True
        if ext in (".tar", ".tgz", ".tar.gz", ".tar.bz2", ".tbz2", ".tar.xz", ".txz"):
            with tarfile.open(fileobj=fh, mode="r|*") as t:
                for ti in t:
                    res.members += 1
                    if res.members > MAX_MEMBERS:
                        res.unc(place, "too many archive members"); return False
                    mname = ti.name
                    if ti.isdir() or ti.issym() or ti.islnk():
                        scan_text(res, f"{place}!{mname}", mname.encode("utf-8", "surrogateescape"), names_only=True)
                        why = shaped_like_a_secret_or_backup(mname)
                        if why:
                            res.hit(f"{place}!{mname}", why)
                        if ti.issym() or ti.islnk():
                            scan_text(res, f"{place}!{mname}", ti.linkname.encode("utf-8", "surrogateescape"), names_only=True)
                        continue
                    if not ti.isfile():
                        res.unc(f"{place}!{mname}", "special file in archive"); continue
                    f = t.extractfile(ti)
                    scan_file_obj(res, f"{place}!{mname}", mname, f, ti.size, depth + 1)
            return True
        # single-stream compression: .gz .bz2 .xz
        opener = {".gz": lambda f: gzip.GzipFile(fileobj=f), ".bz2": bz2.BZ2File, ".xz": lzma.LZMAFile}[ext]
        with opener(fh) as s:
            inner = re.sub(r"\.(gz|bz2|xz)$", "", place, flags=re.I)
            return scan_file_obj(res, inner, os.path.basename(inner), s, None, depth + 1)
    except (tarfile.TarError, zipfile.BadZipFile, OSError, EOFError, lzma.LZMAError, ValueError, RuntimeError, NotImplementedError) as e:
        res.unc(place, f"could not read this archive to the end ({type(e).__name__})")
        return False


def scan_path(res: Result, path: str):
    if not os.path.lexists(path):
        res.unc(path, "path does not exist"); return
    # The root argument also must not be a symlink: isfile/isdir follow it.
    if os.path.islink(path):
        res.unc(path, "symlink input is not an approved publication source"); return
    if os.path.isfile(path):
        with open(path, "rb") as fh:
            scan_file_obj(res, path, os.path.basename(path), fh, os.path.getsize(path), 0)
        return
    if not os.path.isdir(path):
        res.unc(path, "neither a file nor a folder"); return
    for dirpath, dirnames, filenames in os.walk(path, followlinks=False):
        dirnames.sort()
        for d in list(dirnames):
            rel = os.path.relpath(os.path.join(dirpath, d), path)
            scan_text(res, rel, rel.encode("utf-8", "surrogateescape"), names_only=True)
            why = shaped_like_a_secret_or_backup(rel)
            if why:
                res.hit(rel, why)
            if os.path.islink(os.path.join(dirpath, d)):
                # os.walk(followlinks=False) silently skips nested symlink folders.
                # Fail closed instead of treating an unexamined subtree as clean.
                res.unc(rel, "symlink directory was not scanned")
                dirnames.remove(d)
        for fn in sorted(filenames):
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, path)
            if os.path.islink(full):
                if not os.path.exists(full):
                    res.unc(rel, "dangling symlink")
                else:
                    res.unc(rel, "symlink: publish the real file, not a link")
                continue
            try:
                with open(full, "rb") as fh:
                    scan_file_obj(res, rel, fn, fh, os.path.getsize(full), 0)
            except OSError as e:
                res.unc(rel, f"unreadable ({type(e).__name__})")


def load_ids(var: str):
    raw = os.environ.get(var, "")
    ids = [x.strip().lower().encode() for x in re.split(r"[\n,]", raw) if len(x.strip()) >= 5]
    return ids


def gate(paths, opaque_ok=(), ids_env="THIRD_PARTY_GUARD_IDS", require_ids=False):
    """Returns (exit code, Result). 0 clean, 1 findings, 2 unchecked."""
    allow, _, bad = det.load_allowlist()
    local_allow, local_bad = load_local_allowlist()
    res = Result(det.load_tlds(), allow, load_ids(ids_env), opaque_ok, local_allow)
    if bad:
        res.unc("scripts/privacy/outside-email-allowlist.txt", "allowlist lines without a reason")
    if local_bad:
        res.unc("scripts/privacy/local-path-allowlist.txt", "allowlist lines without a sha256 digest or a reason")
    if require_ids and not res.ids:
        res.unc(ids_env, "private identifier list is not set, so named third parties are unchecked")
    if not paths:
        res.unc("(no path)", "nothing to scan")
    for p in paths:
        try:
            scan_path(res, p)
        except Exception as e:  # anything unforeseen is UNCHECKABLE, never a pass
            res.unc(p, f"scan aborted ({type(e).__name__})")
    if paths and res.files == 0 and not any(u[1] == "path does not exist" for u in res.unchecked):
        res.unc(",".join(paths), "no files found, so nothing was read")
    code = 1 if res.findings else (2 if res.unchecked else 0)
    return code, res


def report(code: int, res: Result, label: str = ""):
    tag = {0: "PASS", 1: "FAIL", 2: "UNCHECKABLE"}[code]
    gha = os.environ.get("GITHUB_ACTIONS") == "true"
    print(f"publication-gate {tag}{' (' + label + ')' if label else ''}: {res.files} files, {res.archives} archives, "
          f"{res.members} archive members, {res.bytes} bytes read; address classes seen: "
          f"{dict(sorted((k, v) for k, v in res.counts.items()))}; private-list entries checked: {len(res.ids)}")
    for place, kind in res.findings[:200]:
        print(f"  FOUND {kind} at {place}")
        if gha:
            print(f"::error::publication gate: {kind} at {place}")
    for place, why in res.unchecked[:200]:
        print(f"  UNCHECKED {place}: {why}")
        if gha:
            print(f"::error::publication gate could not vouch for {place}: {why}")
    if res.opaque:
        print(f"  OPAQUE ({len(res.opaque)}): raw bytes only, e.g. {res.opaque[0]}")
    if code:
        print("  Do not publish. Remove the data (or fix the cause), then re-run. This gate never prints the matched value.")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--opaque-ok", action="append", default=[], metavar=".EXT",
                    help="opaque binary extension another check already covers (repeatable)")
    ap.add_argument("--ids-env", default="THIRD_PARTY_GUARD_IDS")
    ap.add_argument("--require-ids", action="store_true", help="UNCHECKABLE when the private list is not set")
    ap.add_argument("--label", default="")
    a = ap.parse_args(argv)
    code, res = gate(a.paths, [e if e.startswith(".") else "." + e for e in a.opaque_ok], a.ids_env, a.require_ids)
    report(code, res, a.label)
    return code


if __name__ == "__main__":
    sys.exit(main())
