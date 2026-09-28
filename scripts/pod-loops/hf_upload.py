#!/usr/bin/env python3
"""Upload loop outputs to a csoai/* dataset from the pod, or queue them until a token exists.

    hf_upload.py --repo csoai/x402-settlement-census --file /path/a.jsonl --path-in-repo dry/a.jsonl \
                 [--config-name dry-2026-09-06] [--create] [--readme-if-absent README.md] [--private]
    hf_upload.py --repo csoai/gspc-estate --folder /workspace/lanes/out/gspc-estate --create \
                 [--config-name-from <name>=<path-in-repo> ...]
    hf_upload.py --flush            # push everything queued in $LANES/out/pending-upload.jsonl

--folder uploads a whole directory tree in ONE commit (HfApi.upload_folder) instead of one
commit per file. A publication of a thousand files is one publication, and a thousand
commits makes the repo slow and its history unreadable. Same token rule, same queue
behaviour: with no token the folder job is queued, not lost.

Token: $LANES/.secrets/hf_token (owner-placed, mode 0600) or a NON-EMPTY $HF_TOKEN. Never printed.
No token -> the upload is queued (one JSON line per file) and the exit code is 3 UNCHECKABLE; the
file stays on /workspace. Nothing is ever deleted from the Hub or from /workspace.

--config-name adds a `configs:` entry to the dataset README front matter so the HF viewer shows the
dated file as its own config (one file format per dataset: every loop output here is .jsonl).
It is idempotent: an entry whose data_files path already exists is not added twice.

Every dataset card (README.md) this script writes passes through cite_block.apply(): the How-to-cite /
corrections / verification block every public csoai/* card carries (lane L5, 28 Sep 2026). cite_block.py is
found beside this file, in ../hf (the repo layout) or in $REPO/scripts/hf (the pod's sparse clone, lib.sh).
When it cannot be found, a README upload is HELD and the live card is kept: a card written without the block
would strip it from the live one. A folder's root manifest.jsonl entry for README.md is updated to the bytes
actually uploaded, so the bundle stays self-consistent.
"""
import argparse, json, os, sys, time
from pathlib import Path

LANES = Path(os.environ.get("LANES", "/workspace/lanes"))
QUEUE = LANES / "out" / "pending-upload.jsonl"


def token():
    f = LANES / ".secrets" / "hf_token"
    if f.is_file() and f.stat().st_size:
        return f.read_text().strip()
    return os.environ.get("HF_TOKEN", "").strip() or None


def queue(job):
    QUEUE.parent.mkdir(parents=True, exist_ok=True)
    with QUEUE.open("a") as q:
        q.write(json.dumps(job) + "\n")


def carded(text, repo):
    """`text` with the cite block for `repo` (cite_block.apply), or None when cite_block.py is not found."""
    here = Path(__file__).resolve().parent
    for d in (here, here.parent / "hf", Path(os.environ.get("REPO") or LANES / "councilof-ai") / "scripts" / "hf"):
        if (d / "cite_block.py").is_file():
            if str(d) not in sys.path:
                sys.path.insert(0, str(d))
            from cite_block import apply
            return apply(text, repo)
    return None


def git_blob_id(data):
    import hashlib
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def card_folder_readme(folder, repo):
    """Pass a folder's root README.md through carded() in place, and keep a root manifest.jsonl entry for it
    (path/file == README.md) equal to the bytes that will be uploaded. Returns "HELD", "CARDED" or "NONE"."""
    import hashlib
    rd = Path(folder) / "README.md"
    if not rd.is_file():
        return "NONE"
    text = rd.read_text(encoding="utf-8")
    new = carded(text, repo)
    if new is None:
        return "HELD"
    if new != text:
        rd.write_text(new, encoding="utf-8")
    data = rd.read_bytes()
    mf = Path(folder) / "manifest.jsonl"
    if mf.is_file():
        out = []
        for line in mf.read_text(encoding="utf-8").splitlines():
            row = json.loads(line) if line.strip() else None
            if isinstance(row, dict) and (row.get("path") == "README.md" or row.get("file") == "README.md"):
                if "bytes" in row:
                    row["bytes"] = len(data)
                if row.get("sha256") is not None:
                    row["sha256"] = hashlib.sha256(data).hexdigest()
                if row.get("blob_id") is not None:
                    row["blob_id"] = git_blob_id(data)
                line = json.dumps(row, ensure_ascii=False)
            out.append(line)
        mf.write_text("\n".join(out) + "\n", encoding="utf-8")
    return "CARDED"


def add_config(readme_text, name, path):
    """Add `- config_name: <name> / data_files: - split: train / path: <path>` to the front matter."""
    if not readme_text.startswith("---\n"):
        return readme_text, False
    end = readme_text.find("\n---", 4)
    if end < 0:
        return readme_text, False
    fm, body = readme_text[4:end], readme_text[end + 4:]
    if f"path: {path}" in fm:
        return readme_text, False
    entry = f"- config_name: {name}\n  data_files:\n  - split: train\n    path: {path}\n"
    if "\nconfigs:\n" in fm or fm.startswith("configs:\n"):
        # append after the last config entry: find the configs block and insert at its end
        lines = fm.split("\n")
        i = next(k for k, l in enumerate(lines) if l == "configs:")
        j = i + 1
        while j < len(lines) and (lines[j].startswith("- ") or lines[j].startswith("  ")):
            j += 1
        lines[j:j] = entry.rstrip("\n").split("\n")
        fm = "\n".join(lines)
    else:
        fm = fm.rstrip("\n") + "\nconfigs:\n" + entry.rstrip("\n")
    return "---\n" + fm + "\n---" + body, True


def do_upload_folder(job, tok):
    """One commit for a whole tree. Viewer configs are registered afterwards, from the
    same README-rewriting path single-file uploads use, so the two cannot disagree."""
    from huggingface_hub import HfApi, hf_hub_download
    api = HfApi(token=tok)
    repo = job["repo"]
    if job.get("create"):
        api.create_repo(repo, repo_type="dataset", private=bool(job.get("private")), exist_ok=True)
    card = card_folder_readme(job["folder"], repo)
    api.upload_folder(folder_path=job["folder"], repo_id=repo, repo_type="dataset",
                      commit_message=job.get("commit_message") or f"publish {Path(job['folder']).name}",
                      ignore_patterns=["README.md"] if card == "HELD" else None)
    n = sum(1 for p in Path(job["folder"]).rglob("*") if p.is_file())
    for spec in job.get("configs") or []:
        name, _, path = spec.partition("=")
        local = hf_hub_download(repo, "README.md", repo_type="dataset", token=tok, force_download=True)
        text = Path(local).read_text(encoding="utf-8")
        new, changed = add_config(text, name, path)
        if changed:
            api.upload_file(path_or_fileobj=new.encode(), path_in_repo="README.md", repo_id=repo,
                            repo_type="dataset", commit_message=f"pod loop: config {name}")
    held = "; README HELD (cite_block.py not found; the live card is kept)" if card == "HELD" else ""
    return f"UPLOADED {repo} <- {job['folder']} ({n} files, one commit){held}"


def do_upload(job, tok):
    from huggingface_hub import HfApi, hf_hub_download
    from huggingface_hub.utils import HfHubHTTPError
    api = HfApi(token=tok)
    repo = job["repo"]
    if job.get("create"):
        api.create_repo(repo, repo_type="dataset", private=bool(job.get("private")), exist_ok=True)
    if job["path_in_repo"] == "README.md":
        new = carded(Path(job["file"]).read_text(encoding="utf-8"), repo)
        if new is None:
            return f"HELD {repo}/README.md: cite_block.py not found; the live card is kept"
        api.upload_file(path_or_fileobj=new.encode(), path_in_repo="README.md", repo_id=repo,
                        repo_type="dataset", commit_message="pod loop: README.md")
    else:
        api.upload_file(path_or_fileobj=job["file"], path_in_repo=job["path_in_repo"], repo_id=repo,
                        repo_type="dataset", commit_message=f"pod loop: {job['path_in_repo']}")
    if job.get("readme_if_absent"):
        try:
            hf_hub_download(repo, "README.md", repo_type="dataset", token=tok)
        except HfHubHTTPError:
            first = Path(job["readme_if_absent"]).read_text(encoding="utf-8")
            api.upload_file(path_or_fileobj=(carded(first, repo) or first).encode(), path_in_repo="README.md",
                            repo_id=repo, repo_type="dataset", commit_message="pod loop: initial README")
    if job.get("config_name"):
        local = hf_hub_download(repo, "README.md", repo_type="dataset", token=tok, force_download=True)
        text = Path(local).read_text(encoding="utf-8")
        new, changed = add_config(text, job["config_name"], job["path_in_repo"])
        if changed:
            api.upload_file(path_or_fileobj=new.encode(), path_in_repo="README.md", repo_id=repo,
                            repo_type="dataset", commit_message=f"pod loop: config {job['config_name']}")
    return f"UPLOADED {repo}/{job['path_in_repo']}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo"); ap.add_argument("--file"); ap.add_argument("--path-in-repo")
    ap.add_argument("--folder"); ap.add_argument("--commit-message")
    ap.add_argument("--config-name-from", action="append", default=[],
                    help="<config-name>=<path-in-repo>, repeatable; used with --folder")
    ap.add_argument("--config-name"); ap.add_argument("--create", action="store_true")
    ap.add_argument("--private", action="store_true"); ap.add_argument("--readme-if-absent")
    ap.add_argument("--flush", action="store_true")
    a = ap.parse_args()
    tok = token()
    if a.flush:
        if not QUEUE.exists():
            print("FLUSH nothing queued"); return 0
        if not tok:
            print(f"UNCHECKABLE no token; {sum(1 for _ in QUEUE.open())} queued uploads remain"); return 3
        jobs = [json.loads(l) for l in QUEUE.open() if l.strip()]
        # One upload per (repo, path): a loop re-run for the same date queues the same path twice, and the
        # LAST entry points at the bytes that are on disk now. Both files are the same path anyway.
        jobs = list({(j["repo"], j.get("path_in_repo") or "folder:" + j.get("folder", "")): j
                     for j in jobs}.values())
        remaining, rc = [], 0
        for j in jobs:
            try:
                print(do_upload_folder(j, tok) if j.get("kind") == "folder" else do_upload(j, tok))
            except Exception as e:  # keep it queued; never drop a pending upload
                print(f"FAILED {j['repo']}/{j.get('path_in_repo') or j.get('folder')}: {type(e).__name__}: {str(e)[:160]}"); remaining.append(j); rc = 1
        QUEUE.write_text("".join(json.dumps(j) + "\n" for j in remaining))
        return rc
    if a.folder:
        if not a.repo:
            ap.error("--repo is required with --folder")
        job = {"kind": "folder", "repo": a.repo, "folder": str(Path(a.folder).resolve()),
               "create": a.create, "private": a.private, "configs": a.config_name_from,
               "commit_message": a.commit_message,
               "queued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        if not tok:
            queue(job)
            print(f"UNCHECKABLE no HF token on this pod; queued folder {a.folder} -> {a.repo}")
            return 3
        try:
            print(do_upload_folder(job, tok)); return 0
        except Exception as e:
            queue(job)
            print(f"FAILED {type(e).__name__}: {str(e)[:200]}; queued for --flush"); return 1
    if not (a.repo and a.file and a.path_in_repo):
        ap.error("--repo, --file and --path-in-repo are required, or --folder, unless --flush")
    job = {"repo": a.repo, "file": str(Path(a.file).resolve()), "path_in_repo": a.path_in_repo,
           "config_name": a.config_name, "create": a.create, "private": a.private,
           "readme_if_absent": a.readme_if_absent, "queued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    if not tok:
        queue(job)
        print(f"UNCHECKABLE no HF token on this pod ({LANES}/.secrets/hf_token absent, HF_TOKEN empty); "
              f"queued {a.path_in_repo} -> {a.repo} in {QUEUE}")
        return 3
    try:
        print(do_upload(job, tok)); return 0
    except Exception as e:
        queue(job)
        print(f"FAILED {type(e).__name__}: {str(e)[:200]}; queued for --flush"); return 1


if __name__ == "__main__":
    sys.exit(main())
