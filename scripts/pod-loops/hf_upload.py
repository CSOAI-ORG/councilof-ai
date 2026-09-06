#!/usr/bin/env python3
"""Upload loop outputs to a csoai/* dataset from the pod, or queue them until a token exists.

    hf_upload.py --repo csoai/x402-settlement-census --file /path/a.jsonl --path-in-repo dry/a.jsonl \
                 [--config-name dry-2026-09-06] [--create] [--readme-if-absent README.md] [--private]
    hf_upload.py --flush            # push everything queued in $LANES/out/pending-upload.jsonl

Token: $LANES/.secrets/hf_token (owner-placed, mode 0600) or a NON-EMPTY $HF_TOKEN. Never printed.
No token -> the upload is queued (one JSON line per file) and the exit code is 3 UNCHECKABLE; the
file stays on /workspace. Nothing is ever deleted from the Hub or from /workspace.

--config-name adds a `configs:` entry to the dataset README front matter so the HF viewer shows the
dated file as its own config (one file format per dataset: every loop output here is .jsonl).
It is idempotent: an entry whose data_files path already exists is not added twice.
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


def do_upload(job, tok):
    from huggingface_hub import HfApi, hf_hub_download
    from huggingface_hub.utils import HfHubHTTPError
    api = HfApi(token=tok)
    repo = job["repo"]
    if job.get("create"):
        api.create_repo(repo, repo_type="dataset", private=bool(job.get("private")), exist_ok=True)
    api.upload_file(path_or_fileobj=job["file"], path_in_repo=job["path_in_repo"], repo_id=repo,
                    repo_type="dataset", commit_message=f"pod loop: {job['path_in_repo']}")
    if job.get("readme_if_absent"):
        try:
            hf_hub_download(repo, "README.md", repo_type="dataset", token=tok)
        except HfHubHTTPError:
            api.upload_file(path_or_fileobj=job["readme_if_absent"], path_in_repo="README.md",
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
        remaining, rc = [], 0
        for j in jobs:
            try:
                print(do_upload(j, tok))
            except Exception as e:  # keep it queued; never drop a pending upload
                print(f"FAILED {j['repo']}/{j['path_in_repo']}: {type(e).__name__}: {str(e)[:160]}"); remaining.append(j); rc = 1
        QUEUE.write_text("".join(json.dumps(j) + "\n" for j in remaining))
        return rc
    if not (a.repo and a.file and a.path_in_repo):
        ap.error("--repo, --file and --path-in-repo are required unless --flush")
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
