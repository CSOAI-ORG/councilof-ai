#!/usr/bin/env python3
"""
mirror_fanout.py — content-addressed multi-mirror publication for CSOAI evidence.

Purpose
-------
No single provider outage or account flag should be able to take our evidence
offline. This script does three things and nothing else:

  1. MANIFEST   For a given list of artifact files, emit
                public/interop/mirror-manifest.json carrying, per artifact:
                relative path, sha256 of the bytes on disk, size, and a
                `mirrors` array of {surface, url, last_verified_at, state}.

  2. PROBE      Fetch each mirror URL ANONYMOUSLY — no token, no cookie, no
                Authorization header — sha256 what actually comes back, and
                compare it to the manifest digest. This is the step that turns
                "we uploaded it" into "a stranger can get the right bytes".

  3. PUBLISH    Upload the artifact set to the Hugging Face dataset repo with
                the keychain write token, then IMMEDIATELY read back
                anonymously and record whatever that read actually returned.

The five rules this file exists to enforce
------------------------------------------
  R1. A state is NEVER written without a fetch having actually happened.
      The only state that may be written without a fetch is NOT_PUBLISHED,
      and it may only be written when there is no URL to fetch (url is null).
      There are no optimistic defaults anywhere in this file.

  R2. The four states are never collapsed into each other and never collapsed
      into a boolean:
        VERIFIED_MATCHING_DIGEST   2xx, and sha256(body) == manifest digest
        REACHABLE_DIGEST_MISMATCH  2xx, but sha256(body) != manifest digest
        UNREACHABLE                we had a URL, we fetched, and we did not
                                   get 2xx bytes (404 / 403 / DNS / TLS /
                                   timeout / redirect loop / …)
        NOT_PUBLISHED              no URL exists for this artifact on this
                                   surface — nothing was ever put there
      REACHABLE_DIGEST_MISMATCH is emphatically NOT a soft VERIFIED. A mirror
      that serves a stale copy is worse than one that serves nothing, because
      a reader cannot tell.

  R3. Every check must be provable-failable. `--selftest` feeds each check an
      input that MUST make it fail, and fails loudly if the check stays green.
      A check that cannot be made to fail is not a check.

  R4. The prober is injectable (`fetch=`), so the mismatch and unreachable
      paths are exercised with zero network dependence.

  R5. The prober is anonymous by construction. It builds its own opener with
      no cookie jar and no auth handler, and it never reads a token. A reader
      of our evidence has no credentials; neither does this check.

Surfaces
--------
Some surfaces expose a public listing API, so whether an artifact is published
there is MEASURED, not assumed. Where no listing exists (a static host), we
always assign a URL and let the fetch decide.

Never prints the Hugging Face token.
"""

from __future__ import annotations

import argparse
import hashlib
import http.server
import json
import os
import socket
import ssl
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Iterable, Optional

SCHEMA = "csoai.mirror-manifest/0.2"

# ---------------------------------------------------------------------------
# States — the whole point. Do not add a fifth without a ruling.
# ---------------------------------------------------------------------------
VERIFIED = "VERIFIED_MATCHING_DIGEST"
MISMATCH = "REACHABLE_DIGEST_MISMATCH"
UNREACHABLE = "UNREACHABLE"
NOT_PUBLISHED = "NOT_PUBLISHED"
STATES = (VERIFIED, MISMATCH, UNREACHABLE, NOT_PUBLISHED)

DEFAULT_UA = "csoai-mirror-fanout/0.2 (+https://councilof.ai; anonymous readback probe)"
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)

HF_REPO = "csoai/councilof-ai-mirror"
KAGGLE_OWNER = "nicktempleman"
KAGGLE_SLUG = "csoai-gspc-living-board"
ZENODO_RECORD = "21991104"
# 21991104 is the CONCEPT recid of the published methodology record (it 302s to
# record 21991105). scripts/spray/gspc-spray.py pins it as ZENODO_METHODOLOGY_DOI and
# guards it as "NEVER modified", so the two single-homed artifacts were NOT versioned
# into it. They were staged as a separate deposit instead — see ZENODO_MIRROR_RECORD.
ZENODO_MIRROR_RECORD = "22806072"
GITHUB_OWNER = "CSOAI-ORG"
GITHUB_REPO = "councilof-ai"
GITHUB_REF = "master"

DEFAULT_ARTIFACTS = [
    "public/interop/agent-population-2026-09-17.json",
    "public/interop/master-consolidation-rollup-v0.1.json",
    "public/root.json",
    "public/signed/card_index.json",
]
DEFAULT_MANIFEST_OUT = "public/interop/mirror-manifest.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


# ---------------------------------------------------------------------------
# Anonymous fetcher (R5). Injectable (R4).
# ---------------------------------------------------------------------------
@dataclass
class FetchResult:
    """What actually came back. `body` is only set on a 2xx."""

    url: str
    status: Optional[int]
    body: Optional[bytes]
    error: Optional[str]
    final_url: Optional[str] = None
    elapsed_ms: Optional[int] = None

    @property
    def ok(self) -> bool:
        return self.status is not None and 200 <= self.status < 300 and self.body is not None


def anonymous_fetch(url: str, *, timeout: float = 45.0, ua: str = DEFAULT_UA) -> FetchResult:
    """Fetch a URL with NO credentials of any kind.

    Deliberately builds a fresh opener with no cookie processor and no auth
    handler, so nothing from the ambient environment (netrc, keychain, a
    previously installed global opener) can leak in and make a private
    resource look public.
    """
    t0 = time.monotonic()
    opener = urllib.request.build_opener(
        urllib.request.HTTPRedirectHandler(),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
    )
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "*/*"})
    try:
        with opener.open(req, timeout=timeout) as resp:
            body = resp.read()
            return FetchResult(
                url=url,
                status=resp.status,
                body=body,
                error=None,
                final_url=resp.geturl(),
                elapsed_ms=int((time.monotonic() - t0) * 1000),
            )
    except urllib.error.HTTPError as e:
        # Drain the error body so the connection closes cleanly, but never
        # treat an error body as content.
        try:
            e.read()
        except Exception:
            pass
        return FetchResult(
            url=url,
            status=e.code,
            body=None,
            error=f"HTTP {e.code} {e.reason}",
            final_url=getattr(e, "url", None),
            elapsed_ms=int((time.monotonic() - t0) * 1000),
        )
    except Exception as e:  # URLError, socket.timeout, ssl errors, …
        return FetchResult(
            url=url,
            status=None,
            body=None,
            error=f"{type(e).__name__}: {e}",
            elapsed_ms=int((time.monotonic() - t0) * 1000),
        )


Fetcher = Callable[[str], FetchResult]


# ---------------------------------------------------------------------------
# The single place a state is decided (R1, R2).
# ---------------------------------------------------------------------------
def classify(expected_sha256: str, url: Optional[str], result: Optional[FetchResult]) -> dict:
    """Turn (expected digest, url, what actually came back) into one state.

    This is the ONLY function in this file that may produce a state. It is
    total and has no default branch that guesses.
    """
    if url is None:
        # Nothing was published here, so there is nothing to fetch. This is the
        # one and only state reachable without a fetch.
        if result is not None:
            raise AssertionError("NOT_PUBLISHED must not carry a fetch result")
        return {
            "state": NOT_PUBLISHED,
            "http_status": None,
            "sha256_received": None,
            "bytes_received": None,
            "detail": "no URL on this surface for this artifact",
        }

    if result is None:
        # R1: a URL exists but nothing was fetched. Refuse to invent a state.
        raise AssertionError(
            f"refusing to write a state for {url} without having fetched it (R1)"
        )

    if not result.ok:
        return {
            "state": UNREACHABLE,
            "http_status": result.status,
            "sha256_received": None,
            "bytes_received": None,
            "detail": result.error or "no 2xx body",
        }

    got = sha256_bytes(result.body)
    if got == expected_sha256:
        state = VERIFIED
        detail = "bytes served match the manifest digest"
    else:
        state = MISMATCH
        detail = (
            "reachable, but the bytes served are NOT the manifest bytes "
            "(stale or divergent copy)"
        )
    return {
        "state": state,
        "http_status": result.status,
        "sha256_received": got,
        "bytes_received": len(result.body),
        "detail": detail,
    }


def probe_mirror(
    *,
    surface: str,
    url: Optional[str],
    expected_sha256: str,
    fetch: Optional[Fetcher] = None,
) -> dict:
    """Probe one mirror and return a fully-populated manifest mirror entry."""
    fetch = fetch or anonymous_fetch
    result = None if url is None else fetch(url)
    verdict = classify(expected_sha256, url, result)
    entry = {
        "surface": surface,
        "url": url,
        "last_verified_at": now_iso(),
        "state": verdict["state"],
        "http_status": verdict["http_status"],
        "sha256_received": verdict["sha256_received"],
        "bytes_received": verdict["bytes_received"],
        "detail": verdict["detail"],
    }
    if result is not None and result.final_url and result.final_url != url:
        entry["final_url"] = result.final_url
    if result is not None and result.elapsed_ms is not None:
        entry["elapsed_ms"] = result.elapsed_ms
    assert entry["state"] in STATES
    return entry


# ---------------------------------------------------------------------------
# Surfaces. `listing` is measured where an API exists.
# ---------------------------------------------------------------------------
def public_relpath(repo_relpath: str) -> str:
    """public/root.json -> root.json (Cloudflare Pages serves public/ as docroot)."""
    p = repo_relpath.replace("\\", "/")
    return p[len("public/"):] if p.startswith("public/") else p


def hf_flat_name(repo_relpath: str) -> str:
    """public/signed/card_index.json -> signed__card_index.json

    Matches the flattening convention already used in this HF dataset repo.
    """
    return public_relpath(repo_relpath).replace("/", "__")


@dataclass
class SurfaceListing:
    """What a surface actually holds, measured from its public listing API.

    `paths` is None when the surface has no listing API — in that case we
    always hand out a URL and let the fetch adjudicate.
    """

    names: Optional[set] = None
    error: Optional[str] = None


def hf_listing(fetch: Fetcher) -> SurfaceListing:
    r = fetch(f"https://huggingface.co/api/datasets/{HF_REPO}/tree/main?recursive=1")
    if not r.ok:
        return SurfaceListing(names=set(), error=r.error or f"HTTP {r.status}")
    try:
        items = json.loads(r.body)
        return SurfaceListing(names={i["path"] for i in items if i.get("type") == "file"})
    except Exception as e:
        return SurfaceListing(names=set(), error=f"unparseable listing: {e}")


def kaggle_listing(fetch: Fetcher) -> SurfaceListing:
    r = fetch(f"https://www.kaggle.com/api/v1/datasets/list/{KAGGLE_OWNER}/{KAGGLE_SLUG}")
    if not r.ok:
        return SurfaceListing(names=set(), error=r.error or f"HTTP {r.status}")
    try:
        d = json.loads(r.body)
        return SurfaceListing(names={f["name"] for f in d.get("datasetFiles", [])})
    except Exception as e:
        return SurfaceListing(names=set(), error=f"unparseable listing: {e}")


def _zenodo_record_listing(fetch: Fetcher, recid: str) -> SurfaceListing:
    r = fetch(f"https://zenodo.org/api/records/{recid}")
    if not r.ok:
        return SurfaceListing(names=set(), error=r.error or f"HTTP {r.status}")
    try:
        d = json.loads(r.body)
        return SurfaceListing(names={f["key"] for f in d.get("files", [])})
    except Exception as e:
        return SurfaceListing(names=set(), error=f"unparseable listing: {e}")


def zenodo_listing(fetch: Fetcher) -> SurfaceListing:
    return _zenodo_record_listing(fetch, ZENODO_RECORD)


def zenodo_mirror_listing(fetch: Fetcher) -> SurfaceListing:
    return _zenodo_record_listing(fetch, ZENODO_MIRROR_RECORD)


@dataclass
class Surface:
    name: str
    provider: str
    note: str
    url_for: Callable[[str, SurfaceListing], Optional[str]]
    list_fn: Optional[Callable[[Fetcher], SurfaceListing]] = None


def _hf_url(rel: str, listing: SurfaceListing) -> Optional[str]:
    flat = hf_flat_name(rel)
    if listing.names is not None and flat not in listing.names:
        return None
    return f"https://huggingface.co/datasets/{HF_REPO}/resolve/main/{urllib.parse.quote(flat)}"


def _kaggle_url(rel: str, listing: SurfaceListing) -> Optional[str]:
    base = os.path.basename(rel)
    if listing.names is not None and base not in listing.names:
        return None
    return (
        f"https://www.kaggle.com/api/v1/datasets/download/"
        f"{KAGGLE_OWNER}/{KAGGLE_SLUG}/{urllib.parse.quote(base)}"
    )


def _zenodo_url(rel: str, listing: SurfaceListing) -> Optional[str]:
    base = os.path.basename(rel)
    if listing.names is not None and base not in listing.names:
        return None
    return f"https://zenodo.org/api/records/{ZENODO_RECORD}/files/{urllib.parse.quote(base)}/content"


def _zenodo_mirror_url(rel: str, listing: SurfaceListing) -> Optional[str]:
    base = os.path.basename(rel)
    if listing.names is not None and base not in listing.names:
        return None
    return (
        f"https://zenodo.org/api/records/{ZENODO_MIRROR_RECORD}"
        f"/files/{urllib.parse.quote(base)}/content"
    )


def _councilof_url(rel: str, _listing: SurfaceListing) -> Optional[str]:
    return "https://councilof.ai/" + urllib.parse.quote(public_relpath(rel))


def _csoai_url(rel: str, _listing: SurfaceListing) -> Optional[str]:
    return "https://csoai.org/" + urllib.parse.quote(public_relpath(rel))


def _github_url(rel: str, _listing: SurfaceListing) -> Optional[str]:
    return (
        f"https://raw.githubusercontent.com/{GITHUB_OWNER}/{GITHUB_REPO}/"
        f"{GITHUB_REF}/{urllib.parse.quote(rel)}"
    )


SURFACES: list[Surface] = [
    Surface(
        name="huggingface",
        provider="Hugging Face",
        note=f"dataset {HF_REPO}; we hold a write token, so this is the surface we can repair",
        url_for=_hf_url,
        list_fn=hf_listing,
    ),
    Surface(
        name="cloudflare-pages-councilof",
        provider="Cloudflare Pages",
        note=(
            "origin of record; static host with no listing API, so every path is fetched. "
            "MEASURED 2026-09-17: Cloudflare bot management 403s the literal Python-urllib/* "
            "User-Agent while serving 200 to curl and to this prober. A reader whose client "
            "does not set a UA is locked out of this leg; the Hugging Face leg serves all of them."
        ),
        url_for=_councilof_url,
    ),
    Surface(
        name="cloudflare-pages-csoai",
        provider="Cloudflare Pages",
        note=(
            "same provider as councilof.ai and 308-redirects to it — NOT an independent mirror. "
            "A VERIFIED here and a VERIFIED on councilof.ai are one surviving copy, not two, "
            "which is why independence is counted by provider."
        ),
        url_for=_csoai_url,
    ),
    Surface(
        name="kaggle",
        provider="Kaggle",
        note=(
            f"dataset {KAGGLE_OWNER}/{KAGGLE_SLUG}; per-file anonymous download. "
            "MEASURED 2026-09-17: a fresh, complete, byte-correct version can exist on Kaggle "
            "while the anonymous default still serves an older one. Versions 30 and 31 carry the "
            "current root.json (24454 bytes, dedb49d0…); the version-less per-file endpoint, the "
            "version-less dataset zip and datasets/view all still resolved to version 29 "
            "(24310 bytes, d9639d9a…) for 20+ minutes after the push. The `?datasetVersionNumber=` "
            "parameter was proved falsifiable in the same run (v=28 → different bytes, v=32 → 404), "
            "so this is Kaggle's current-version pointer lagging, not a failed upload. A reader "
            "following the documented URL therefore still gets the stale copy, which is exactly why "
            "this leg is probed anonymously rather than trusted from the upload's exit code."
        ),
        url_for=_kaggle_url,
        list_fn=kaggle_listing,
    ),
    Surface(
        name="zenodo",
        provider="Zenodo",
        note=(
            f"concept {ZENODO_RECORD} (published record 21991105); immutable DOI-backed deposit. "
            "This is the GSPC methodology / 417-provision corpus-anchor record. "
            "scripts/spray/gspc-spray.py pins it as ZENODO_METHODOLOGY_DOI and refuses to write to "
            "it, so nothing is versioned into it from here."
        ),
        url_for=_zenodo_url,
        list_fn=zenodo_listing,
    ),
    Surface(
        name="zenodo-mirror-deposit",
        provider="Zenodo",
        note=(
            f"deposit {ZENODO_MIRROR_RECORD} — created on PRODUCTION zenodo.org 2026-09-17 to give "
            "agent-population-2026-09-17.json and master-consolidation-rollup-v0.1.json a second "
            "independent provider. MEASURED: it is state=unsubmitted. Both files are uploaded and "
            "read back with matching md5 over the authenticated deposit API, but a Zenodo draft is "
            "not public — /api/records/22806072 and its file contents both 404 anonymously, while a "
            "published record's file (21991105/methodology.md) returns 200 in the same run. "
            "Publishing mints the permanent DOI 10.5281/zenodo.22806072 and cannot be undone, so it "
            "is left to the owner. Until then this surface is correctly NOT a verified mirror."
        ),
        url_for=_zenodo_mirror_url,
        list_fn=zenodo_mirror_listing,
    ),
    Surface(
        name="github-raw",
        provider="GitHub",
        note="account is flagged; anonymous readers see 404. Recorded, never relied on.",
        url_for=_github_url,
    ),
]


def surfaces_by_name(names: Optional[Iterable[str]]) -> list[Surface]:
    if not names:
        return SURFACES
    want = set(names)
    out = [s for s in SURFACES if s.name in want]
    unknown = want - {s.name for s in SURFACES}
    if unknown:
        raise SystemExit(f"unknown surface(s): {sorted(unknown)}")
    return out


# ---------------------------------------------------------------------------
# Manifest build
# ---------------------------------------------------------------------------
def build_manifest(
    root: str,
    artifacts: list[str],
    *,
    fetch: Optional[Fetcher] = None,
    only_surfaces: Optional[list[str]] = None,
    ua: str = DEFAULT_UA,
) -> dict:
    fetch = fetch or (lambda u: anonymous_fetch(u, ua=ua))
    surfaces = surfaces_by_name(only_surfaces)

    listings: dict[str, SurfaceListing] = {}
    for s in surfaces:
        listings[s.name] = s.list_fn(fetch) if s.list_fn else SurfaceListing(names=None)

    entries = []
    for rel in artifacts:
        abspath = os.path.join(root, rel)
        if not os.path.isfile(abspath):
            print(f"  ! missing on disk, skipped: {rel}", file=sys.stderr)
            continue
        with open(abspath, "rb") as fh:
            data = fh.read()
        digest = sha256_bytes(data)
        mirrors = []
        for s in surfaces:
            url = s.url_for(rel, listings[s.name])
            mirrors.append(probe_mirror(surface=s.name, url=url, expected_sha256=digest, fetch=fetch))
            m = mirrors[-1]
            print(f"  {rel:58s} {s.name:28s} {m['state']}")
        entries.append(
            {
                "path": rel,
                "public_path": public_relpath(rel),
                "sha256": digest,
                "size": len(data),
                "mirrors": mirrors,
            }
        )

    counts = {st: 0 for st in STATES}
    for e in entries:
        for m in e["mirrors"]:
            counts[m["state"]] += 1

    # An artifact is genuinely multi-homed only when two or more DISTINCT
    # providers each served the exact bytes. Two hosts on one provider is one
    # outage away from zero, so providers are counted, not URLs.
    provider_of = {s.name: s.provider for s in SURFACES}
    for e in entries:
        verified_providers = sorted(
            {provider_of[m["surface"]] for m in e["mirrors"] if m["state"] == VERIFIED}
        )
        e["verified_providers"] = verified_providers
        e["independent_provider_count"] = len(verified_providers)
        e["single_homed"] = len(verified_providers) <= 1

    return {
        "schema": SCHEMA,
        "as_of": now_iso(),
        "generated_by": "scripts/mirror_fanout.py",
        "method": {
            "readback": "anonymous — no token, no cookie, no Authorization header",
            "user_agent": ua,
            "digest": "sha256 of the exact bytes returned by the mirror",
            "states": {
                VERIFIED: "2xx and sha256(body) == manifest sha256",
                MISMATCH: "2xx but sha256(body) != manifest sha256 — stale or divergent copy",
                UNREACHABLE: "a URL exists, was fetched, and did not yield 2xx bytes",
                NOT_PUBLISHED: "no URL on this surface — the artifact was never put there",
            },
            "no_optimistic_defaults": (
                "every state other than NOT_PUBLISHED is backed by an actual fetch in this run"
            ),
            "independence": (
                "independent_provider_count counts DISTINCT PROVIDERS that served matching "
                "bytes. Two hosts behind one provider count once."
            ),
        },
        "surfaces": [
            {
                "surface": s.name,
                "provider": s.provider,
                "note": s.note,
                "listing": (
                    None
                    if listings[s.name].names is None
                    else {
                        "files": len(listings[s.name].names),
                        "error": listings[s.name].error,
                    }
                ),
            }
            for s in surfaces
        ],
        "totals": {
            "artifacts": len(entries),
            "mirror_probes": sum(len(e["mirrors"]) for e in entries),
            **counts,
            "artifacts_single_homed": sum(1 for e in entries if e["single_homed"]),
        },
        "artifacts": entries,
    }


# ---------------------------------------------------------------------------
# Hugging Face publish
# ---------------------------------------------------------------------------
def hf_token() -> str:
    """Read the write token from the macOS keychain. Never printed, never logged."""
    out = subprocess.run(
        ["security", "find-generic-password", "-s", "meok-keystone", "-a", "HF_TOKEN", "-w"],
        capture_output=True,
        text=True,
    )
    if out.returncode != 0 or not out.stdout.strip():
        raise SystemExit("could not read HF_TOKEN from keychain (meok-keystone/HF_TOKEN)")
    return out.stdout.strip()


def publish_hf(root: str, artifacts: list[str], *, dry_run: bool = False) -> list[str]:
    """Upload the artifact set to the HF dataset in ONE commit. Returns flat names."""
    from huggingface_hub import CommitOperationAdd, HfApi

    ops, flats = [], []
    for rel in artifacts:
        abspath = os.path.join(root, rel)
        if not os.path.isfile(abspath):
            print(f"  ! missing on disk, not uploaded: {rel}", file=sys.stderr)
            continue
        flat = hf_flat_name(rel)
        flats.append(flat)
        ops.append(CommitOperationAdd(path_in_repo=flat, path_or_fileobj=abspath))
        print(f"  staged {rel} -> {HF_REPO}:{flat}")

    if dry_run:
        print("  dry-run: no commit made")
        return flats
    if not ops:
        return flats

    api = HfApi(token=hf_token())
    info = api.create_commit(
        repo_id=HF_REPO,
        repo_type="dataset",
        operations=ops,
        commit_message=f"mirror-fanout: {len(ops)} artifact(s) {now_iso()}",
    )
    print(f"  committed: {getattr(info, 'oid', '(no oid)')}")
    return flats


def wait_for_hf_readback(flats: list[str], *, attempts: int = 6, delay: float = 5.0) -> None:
    """Poll the anonymous CDN until the new objects are visible.

    Every poll is a real anonymous fetch. Nothing here writes a state; this
    only avoids recording a CDN-propagation artefact as a permanent verdict.
    The manifest state is decided by the probe that runs AFTER this.
    """
    for flat in flats:
        url = f"https://huggingface.co/datasets/{HF_REPO}/resolve/main/{urllib.parse.quote(flat)}"
        for i in range(attempts):
            r = anonymous_fetch(url)
            if r.ok:
                print(f"  anonymous readback visible: {flat} ({len(r.body)} bytes)")
                break
            if i < attempts - 1:
                time.sleep(delay)
        else:
            print(f"  anonymous readback NOT visible after {attempts} tries: {flat}")


# ---------------------------------------------------------------------------
# Selftest (R3) — prove every check can fail
# ---------------------------------------------------------------------------
class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):  # silence
        pass


def _serve_dir(directory: str):
    handler = lambda *a, **kw: _QuietHandler(*a, directory=directory, **kw)  # noqa: E731
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv, srv.server_address[1]


def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def selftest() -> int:
    import tempfile

    results: list[tuple[str, bool, str]] = []

    def check(name: str, got, want, extra: str = ""):
        ok = got == want
        results.append((name, ok, f"got={got} want={want} {extra}".strip()))
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}: got={got} want={want} {extra}")

    good = b'{"artifact":"canonical bytes","n":1}\n'
    bad = b'{"artifact":"DIFFERENT bytes","n":2}\n'
    good_sha = sha256_bytes(good)
    bad_sha = sha256_bytes(bad)
    assert good_sha != bad_sha

    tmp = tempfile.mkdtemp(prefix="mirror-selftest-")
    with open(os.path.join(tmp, "good.json"), "wb") as fh:
        fh.write(good)
    with open(os.path.join(tmp, "bad.json"), "wb") as fh:
        fh.write(bad)

    srv, port = _serve_dir(tmp)
    base = f"http://127.0.0.1:{port}"
    dead_port = _free_port()  # bound then released: nothing is listening

    print("\n== A. live local http.server fixtures (network-free) ==")
    try:
        # A1 matching bytes -> VERIFIED
        e = probe_mirror(surface="fixture", url=f"{base}/good.json", expected_sha256=good_sha)
        check("A1 matching bytes -> VERIFIED_MATCHING_DIGEST", e["state"], VERIFIED)
        check("A1 records the received digest", e["sha256_received"], good_sha)

        # A2 different bytes -> MISMATCH. THE check must fire.
        e = probe_mirror(surface="fixture", url=f"{base}/bad.json", expected_sha256=good_sha)
        check("A2 different bytes -> REACHABLE_DIGEST_MISMATCH", e["state"], MISMATCH)
        check("A2 records what it actually got", e["sha256_received"], bad_sha)
        check("A2 http status was 2xx (reachable, not unreachable)", e["http_status"], 200)

        # A3 404 on a live server -> UNREACHABLE
        e = probe_mirror(surface="fixture", url=f"{base}/nope.json", expected_sha256=good_sha)
        check("A3 404 -> UNREACHABLE", e["state"], UNREACHABLE)
        check("A3 refuses to report a digest it never received", e["sha256_received"], None)

        # A4 nothing listening -> UNREACHABLE
        e = probe_mirror(
            surface="fixture", url=f"http://127.0.0.1:{dead_port}/good.json", expected_sha256=good_sha
        )
        check("A4 connection refused -> UNREACHABLE", e["state"], UNREACHABLE)
        check("A4 has no http status at all", e["http_status"], None)

        # A5 one-bit perturbation of the EXPECTED digest must break VERIFIED.
        # Without this, A1 could be passing for a vacuous reason.
        perturbed = ("0" if good_sha[0] != "0" else "1") + good_sha[1:]
        e = probe_mirror(surface="fixture", url=f"{base}/good.json", expected_sha256=perturbed)
        check("A5 negative control: perturbed expected digest -> MISMATCH", e["state"], MISMATCH)

        # A6 truncated body must NOT verify (content-addressing is over all bytes)
        with open(os.path.join(tmp, "trunc.json"), "wb") as fh:
            fh.write(good[:-1])
        e = probe_mirror(surface="fixture", url=f"{base}/trunc.json", expected_sha256=good_sha)
        check("A6 one byte short -> REACHABLE_DIGEST_MISMATCH", e["state"], MISMATCH)
    finally:
        srv.shutdown()
        srv.server_close()

    print("\n== B. injected fetcher (no network at all) ==")

    def fetch_mismatch(url: str) -> FetchResult:
        return FetchResult(url=url, status=200, body=bad, error=None)

    def fetch_dead(url: str) -> FetchResult:
        return FetchResult(url=url, status=None, body=None, error="URLError: injected outage")

    def fetch_403(url: str) -> FetchResult:
        return FetchResult(url=url, status=403, body=None, error="HTTP 403 Forbidden")

    def fetch_match(url: str) -> FetchResult:
        return FetchResult(url=url, status=200, body=good, error=None)

    def fetch_empty(url: str) -> FetchResult:
        return FetchResult(url=url, status=200, body=b"", error=None)

    e = probe_mirror(surface="inj", url="https://x/a", expected_sha256=good_sha, fetch=fetch_mismatch)
    check("B1 injected wrong bytes -> REACHABLE_DIGEST_MISMATCH", e["state"], MISMATCH)
    e = probe_mirror(surface="inj", url="https://x/a", expected_sha256=good_sha, fetch=fetch_dead)
    check("B2 injected outage -> UNREACHABLE", e["state"], UNREACHABLE)
    e = probe_mirror(surface="inj", url="https://x/a", expected_sha256=good_sha, fetch=fetch_403)
    check("B3 injected 403 (account flag) -> UNREACHABLE", e["state"], UNREACHABLE)
    e = probe_mirror(surface="inj", url="https://x/a", expected_sha256=good_sha, fetch=fetch_match)
    check("B4 injected right bytes -> VERIFIED_MATCHING_DIGEST", e["state"], VERIFIED)
    e = probe_mirror(surface="inj", url="https://x/a", expected_sha256=good_sha, fetch=fetch_empty)
    check("B5 injected 200-with-empty-body -> MISMATCH (not VERIFIED)", e["state"], MISMATCH)

    print("\n== C. NOT_PUBLISHED, and the no-optimistic-default rule ==")
    e = probe_mirror(surface="inj", url=None, expected_sha256=good_sha)
    check("C1 no URL -> NOT_PUBLISHED", e["state"], NOT_PUBLISHED)
    check("C1 NOT_PUBLISHED carries no digest", e["sha256_received"], None)

    # C2: classify() must REFUSE to emit a state for a URL that was not fetched.
    refused = False
    try:
        classify(good_sha, "https://x/a", None)
    except AssertionError:
        refused = True
    check("C2 classify() refuses a state without a fetch (R1)", refused, True)

    # C3: NOT_PUBLISHED must not be smuggled in alongside a fetch result.
    refused = False
    try:
        classify(good_sha, None, FetchResult(url="x", status=200, body=good, error=None))
    except AssertionError:
        refused = True
    check("C3 classify() refuses NOT_PUBLISHED with a fetch result", refused, True)

    print("\n== D. the fetcher is anonymous ==")
    sent: dict = {}

    class _Spy(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            sent.update({k.lower(): v for k, v in self.headers.items()})
            self.send_response(200)
            self.send_header("Content-Length", str(len(good)))
            self.end_headers()
            self.wfile.write(good)

        def log_message(self, *a):
            pass

    spy = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Spy)
    threading.Thread(target=spy.serve_forever, daemon=True).start()
    try:
        os.environ["HF_TOKEN"] = "should-never-be-sent"
        anonymous_fetch(f"http://127.0.0.1:{spy.server_address[1]}/x")
        check("D1 no Authorization header sent", "authorization" in sent, False)
        check("D2 no Cookie header sent", "cookie" in sent, False)
        check("D3 identifies itself in User-Agent", sent.get("user-agent", ""), DEFAULT_UA)
    finally:
        os.environ.pop("HF_TOKEN", None)
        spy.shutdown()
        spy.server_close()

    failed = [n for n, ok, _ in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    if failed:
        print("FAILED: " + "; ".join(failed))
        print(
            "\nA failing selftest means a check in this file is worthless as written. "
            "Fix the check, do not relax the assertion."
        )
        return 1
    print(
        "\nEvery state was produced by an input that forced it: a mirror serving wrong "
        "bytes reports REACHABLE_DIGEST_MISMATCH, an outage or account flag reports "
        "UNREACHABLE, and VERIFIED_MATCHING_DIGEST breaks under a one-bit change to the "
        "expected digest. The checks can fail, so their passing means something."
    )
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def summarize(manifest: dict) -> None:
    t = manifest["totals"]
    print("\n--- totals ---")
    for k in ("artifacts", "mirror_probes", *STATES, "artifacts_single_homed"):
        print(f"  {k:28s} {t[k]}")
    print("\n--- per artifact ---")
    for a in manifest["artifacts"]:
        v = a["verified_providers"]
        flag = "SINGLE-HOMED" if a["single_homed"] else f"{len(v)} independent providers"
        print(f"  {a['path']}  sha256={a['sha256'][:16]}…  {flag}")
        for m in a["mirrors"]:
            print(f"      {m['surface']:28s} {m['state']:26s} {m['detail']}")


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--selftest", action="store_true", help="prove every check can fail, then exit")
    p.add_argument("--root", default=os.getcwd(), help="repo root (default: cwd)")
    p.add_argument("--artifact", action="append", default=None, help="repo-relative artifact path (repeatable)")
    p.add_argument("--surface", action="append", default=None, help="restrict to these surfaces (repeatable)")
    p.add_argument("--publish-hf", action="store_true", help="upload artifacts to the HF dataset first")
    p.add_argument("--dry-run", action="store_true", help="with --publish-hf: stage but do not commit")
    p.add_argument("--out", default=DEFAULT_MANIFEST_OUT, help=f"manifest path (default: {DEFAULT_MANIFEST_OUT})")
    p.add_argument("--no-write", action="store_true", help="probe and print, do not write the manifest")
    p.add_argument("--browser-ua", action="store_true",
                   help="probe with a browser User-Agent instead of the tool UA (diagnostic only)")
    args = p.parse_args(argv)

    if args.selftest:
        return selftest()

    root = os.path.abspath(args.root)
    artifacts = args.artifact or DEFAULT_ARTIFACTS
    ua = BROWSER_UA if args.browser_ua else DEFAULT_UA

    if args.publish_hf:
        print(f"== publishing {len(artifacts)} artifact(s) to {HF_REPO} ==")
        flats = publish_hf(root, artifacts, dry_run=args.dry_run)
        if not args.dry_run and flats:
            print("== waiting for anonymous visibility ==")
            wait_for_hf_readback(flats)

    print(f"\n== anonymous readback probe (UA: {'browser' if args.browser_ua else 'tool'}) ==")
    manifest = build_manifest(root, artifacts, only_surfaces=args.surface, ua=ua)
    summarize(manifest)

    if not args.no_write:
        out = os.path.join(root, args.out)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(manifest, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        print(f"\nwrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
