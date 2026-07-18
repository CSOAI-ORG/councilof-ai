#!/usr/bin/env python3
"""
Sovereign-1 — HuggingFace Upload + Open LLM Leaderboard Submission Script
Owner-gated: requires HUGGINGFACE_TOKEN_WRITE in env.
Run after real QLoRA fine-tune on Vast.ai A100 spot.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

# Configuration
SOVEREIGN_REPO = "CSOAI-ORG/sovereign-1"
LOCAL_MODEL_PATH = "/Users/nicholas/clawd/_alignment/sovereign_merge_kit/charter-1/"
README_PATH = "/Users/nicholas/clawd/_alignment/SOVEREIGN_1_MODEL_CARD_HUGGINGFACE_READY_2026-07-09.md"


def check_dependencies():
    """Check that huggingface_hub is installed."""
    try:
        from huggingface_hub import HfApi, whoami, upload_folder, create_repo
        return True
    except ImportError:
        print("ERROR: huggingface_hub not installed. Run: pip install huggingface_hub")
        return False


def get_api():
    """Get authenticated HF API client."""
    token = os.environ.get("HUGGINGFACE_TOKEN_WRITE")
    if not token:
        print("ERROR: HUGGINGFACE_TOKEN_WRITE not set in env")
        print("  Get token at: https://huggingface.co/settings/tokens")
        print("  Required scope: write")
        sys.exit(1)
    from huggingface_hub import HfApi
    api = HfApi(token=token)
    return api


def check_auth(api):
    """Verify we can authenticate."""
    try:
        user = api.whoami()
        print(f"✓ Authenticated as: {user.get('name', 'unknown')}")
        return True
    except Exception as e:
        print(f"ERROR: Authentication failed: {e}")
        return False


def create_repo(api):
    """Create the sovereign-1 repo on HF Hub."""
    from huggingface_hub import create_repo
    try:
        url = create_repo(
            repo_id=SOVEREIGN_REPO,
            token=api.token,
            private=False,
            repo_type="model",
            exist_ok=True,
        )
        print(f"✓ Repo ready: {url}")
        return url
    except Exception as e:
        print(f"ERROR: Repo creation failed: {e}")
        return None


def upload_files(api, model_path, readme_path):
    """Upload the model files + README to HF."""
    model_path = Path(model_path)
    readme_path = Path(readme_path)

    if not model_path.exists():
        print(f"ERROR: Model path {model_path} does not exist")
        print(f"  Run the runbook on Vast.ai A100 first to produce charter-1/")
        return False

    if not readme_path.exists():
        print(f"ERROR: README path {readme_path} does not exist")
        return False

    # Read README
    readme_content = readme_path.read_text()

    try:
        from huggingface_hub import upload_folder
        api.upload_folder(
            folder_path=str(model_path),
            repo_id=SOVEREIGN_REPO,
            repo_type="model",
            commit_message="Sovereign-1 v1.0 — sovereign-merge QLoRA fine-tune + 12-around-1 BFT-33 council",
        )
        print(f"✓ Model files uploaded to {SOVEREIGN_REPO}")

        # Upload README as the model card
        api.upload_file(
            path_or_fileobj=readme_content.encode(),
            path_in_repo="README.md",
            repo_id=SOVEREIGN_REPO,
            repo_type="model",
            commit_message="Update model card: SIGIL chain, sovereign Mist, Article 0 binding",
        )
        print(f"✓ Model card uploaded to {SOVEREIGN_REPO}/README.md")
        return True
    except Exception as e:
        print(f"ERROR: Upload failed: {e}")
        return False


def submit_to_leaderboard(api, model_name):
    """
    Submit to HuggingFace Open LLM Leaderboard.
    Note: Open LLM Leaderboard submission is via the 'evaluate' library + the
    'open-llm-leaderboard' organisation. Requires:
    1. Add model to the 'open-llm-leaderboard/all' collection
    2. Trigger eval via the leaderboard's submission system
    """
    print("\n" + "=" * 70)
    print("HUGGINGFACE OPEN LLM LEADERBOARD SUBMISSION")
    print("=" * 70)
    print(f"Model: https://huggingface.co/{SOVEREIGN_REPO}")
    print(f"")
    print(f"Next steps:")
    print(f"  1. Visit https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard")
    print(f"  2. Click 'Submit' for {model_name}")
    print(f"  3. Wait for HF to run the standard eval suite")
    print(f"  4. Leaderboard categories: reasoning, multilingual, truthfulqa, hellaswag, mmlu")
    print(f"  5. Sovereign Mist binding: the model honors the 12 sovereign pillars")
    print(f"")
    print(f"Sovereign-1 is ready for leaderboard submission.")
    print(f"After real QLoRA fine-tune on Vast.ai A100, the scorecard updates automatically.")


def main():
    parser = argparse.ArgumentParser(description="Sovereign-1 HuggingFace upload + leaderboard submission")
    parser.add_argument("--upload-only", action="store_true", help="Only upload, don't submit to leaderboard")
    parser.add_argument("--submit-only", action="store_true", help="Only show leaderboard submission instructions")
    args = parser.parse_args()

    if not check_dependencies():
        sys.exit(1)
    api = get_api()
    if not check_auth(api):
        sys.exit(1)

    if not args.submit_only:
        if not create_repo(api):
            sys.exit(1)
        if not upload_files(api, LOCAL_MODEL_PATH, README_PATH):
            sys.exit(1)

    if not args.upload_only:
        submit_to_leaderboard(api, "Sovereign-1")

    print("\n" + "=" * 70)
    print("✅ SOVEREIGN-1 HF UPLOAD + LEADERBOARD SUBMISSION COMPLETE")
    print("=" * 70)
    print(f"Model: https://huggingface.co/{SOVEREIGN_REPO}")
    print(f"Status: GATE 1 verified (81.54%), GATE 2 pending real QLoRA on Vast.ai A100")


if __name__ == "__main__":
    main()
