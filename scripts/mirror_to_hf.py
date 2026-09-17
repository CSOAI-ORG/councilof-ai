#!/usr/bin/env python3
"""Mirror the public evidence surface to Hugging Face, because our own edge refuses common clients.

WHY THIS EXISTS, measured on 17 September 2026:
  - councilof.ai answers HTTP 403 (Cloudflare error 1010, Browser Integrity Check) to a plain
    Python urllib client and to libwww-perl, on the API as well as the site. A machine consumer
    following our published instructions gets a 403.
  - Our GitHub account is restricted, so the repository and anything we author there answers 404
    to the public while other authors' content in the same repositories answers 200.

Both single points of failure are outside our control and inside somebody else's dashboard. This
mirrors the artifacts a stranger actually needs onto a host that serves them, and it verifies that
claim with the same client that our own edge rejects rather than assuming it.

WHAT THIS IS NOT
  Not a second source of truth. councilof.ai remains authoritative; every mirrored file carries the
  URL it was taken from and the sha256 of the bytes as fetched, so a reader can tell whether the
  mirror has drifted. A mirror that cannot be compared to its origin is worse than none.
"""
import argparse, hashlib, json, os, sys, urllib.request, urllib.error, datetime

ORIGIN = "https://councilof.ai"

# What a stranger needs to check our claims without asking us.
PATHS = [
    "/api/gspc",
    "/api/corrections",
    "/api/state",
    "/root.json",
    "/signed/card_index.json",
    "/interop/mill-cards-signed/WITHDRAWN.jsonl",
    "/interop/mill-cards-signed/SUPERSEDED.jsonl",
    "/interop/master-consolidation-2026-09-16.json",
    "/interop/master-consolidation-summary.json",
    "/interop/regulatory-crosswalk-2026-09-17.json",
    "/contributions/osaia-safe-discriminating-power-2026-09-17.md",
    "/.well-known/did.json",
]

UA = {"User-Agent": "Mozilla/5.0 (csoai-mirror)"}


def fetch(path):
    """Fetch from the origin. We send a browser UA because our own edge blocks the honest one —
    that is the defect this script exists for, and it is recorded rather than hidden."""
    r = urllib.request.urlopen(urllib.request.Request(ORIGIN + path, headers=UA), timeout=60)
    b = r.read()
    return b, r.status


def plain_client_status(url):
    """The control: what a plain Python client gets, with no browser pretence."""
    try:
        return urllib.request.urlopen(url, timeout=30).status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="csoai/councilof-ai-mirror")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        # The claim this script rests on is that HF serves a client our origin refuses. Prove both
        # halves; if either flips, the mirror's justification is gone and we should know.
        hf = plain_client_status("https://huggingface.co/api/models?author=csoai&limit=1")
        us = plain_client_status(ORIGIN + "/api/gspc")
        print(f"plain Python client: huggingface.co -> {hf}, {ORIGIN} -> {us}")
        assert hf == 200, "Hugging Face did not serve a plain client; the mirror's premise is wrong"
        if us == 200:
            print("NOTE: the origin now serves a plain client. The 403 may be fixed; re-check "
                  "whether this mirror is still needed for that reason.")
        print("selftest OK")
        return 0

    token = os.environ.get("HF_TOKEN")
    if not token:
        print("no HF_TOKEN in the environment"); return 2

    manifest = {
        "schema": "csoai.mirror-manifest/0.1",
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "origin": ORIGIN,
        "authoritative": ("councilof.ai is authoritative. This mirror exists because the origin "
                          "refuses common HTTP clients and our GitHub account is restricted. If a "
                          "file here disagrees with the origin, the origin wins and the mirror is stale."),
        "why": {
            "origin_status_to_a_plain_python_client": plain_client_status(ORIGIN + "/api/gspc"),
            "mirror_host_status_to_the_same_client": plain_client_status(
                "https://huggingface.co/api/models?author=csoai&limit=1"),
            "note": "Measured at the time in as_of, by this script, with no browser user-agent.",
        },
        "files": [],
    }

    from huggingface_hub import HfApi
    api = HfApi(token=token)
    if not a.dry_run:
        api.create_repo(a.repo, repo_type="dataset", exist_ok=True, private=False)

    import tempfile, pathlib
    tmp = pathlib.Path(tempfile.mkdtemp())
    ok = failed = 0
    for p in PATHS:
        try:
            b, status = fetch(p)
        except Exception as e:
            manifest["files"].append({"path": p, "state": "COULD_NOT_FETCH", "error": str(e)[:120]})
            failed += 1
            continue
        name = p.lstrip("/").replace("/", "__")
        (tmp / name).write_bytes(b)
        manifest["files"].append({
            "path": p, "state": "MIRRORED", "mirror_name": name,
            "sha256_as_fetched": hashlib.sha256(b).hexdigest(),
            "bytes": len(b), "origin_url": ORIGIN + p,
        })
        ok += 1

    (tmp / "MIRROR-MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (tmp / "README.md").write_text(
        "---\nlicense: cc-by-4.0\n---\n\n"
        "# Council of AI — public evidence mirror\n\n"
        f"Mirrored from {ORIGIN} at {manifest['as_of']}.\n\n"
        "**councilof.ai is authoritative.** This mirror exists for one measured reason: the origin "
        "answers HTTP 403 (Cloudflare error 1010) to a plain Python or Perl client, on the API as "
        "well as the site, so a machine consumer following our own published instructions is "
        "refused. Hugging Face serves those same clients.\n\n"
        "Every file carries the URL it came from and the sha256 of the bytes as fetched, in "
        "`MIRROR-MANIFEST.json`. If a file here disagrees with the origin, the origin wins and this "
        "mirror is stale.\n\n"
        "Nothing here is a certification. We measure and we never certify, and verification is free.\n")

    if a.dry_run:
        print(f"DRY RUN: would mirror {ok} file(s), {failed} unfetchable, to {a.repo}")
    else:
        api.upload_folder(folder_path=str(tmp), repo_id=a.repo, repo_type="dataset",
                          commit_message=f"mirror {ok} public artifacts from {ORIGIN}")
        print(f"mirrored {ok} file(s), {failed} unfetchable, to {a.repo}")
    for f in manifest["files"]:
        if f["state"] != "MIRRORED":
            print(f"   UNFETCHABLE {f['path']}: {f.get('error','')[:70]}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
