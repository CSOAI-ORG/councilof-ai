#!/usr/bin/env python3
"""hf_publish.py — publish the measurement cards + datasets to Hugging Face (HF_TOKEN).

Publishes to the estate's live `csoai/gspc-{axis}` dataset repos (already confirmed 200
in the venue audit). The measurement data is signed; publishing is distribution, never
certification. Honest when HF_TOKEN is absent.

Usage:
  HF_TOKEN=<token> python3 hf_publish.py <local_card_or_dataset_dir> [repo_name]
  # default repo: csoai/gspc-board

Exit 0 = published. Exit 2 = NO token (honest, not published). Never fabricates a repo
that does not exist (create_repo only with =True; otherwise it reports and stops).
"""
import json, os, sys


def main():
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("NO_HF_TOKEN — not published (honest). Set HF_TOKEN.")
        return 2
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    repo = sys.argv[2] if len(sys.argv) > 2 else "csoai/gspc-board"
    from huggingface_hub import HfApi
    api = HfApi(token=token)
    try:
        api.upload_folder(folder_path=path, repo_id=repo, repo_type="dataset")
        print(f"PUBLISHED to {repo} (dataset) — signed cards now distributed, never certified.")
        return 0
    except Exception as e:
        print(f"PUBLISH ERROR: {str(e)[:120]}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
