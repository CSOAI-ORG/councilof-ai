#!/usr/bin/env python3
"""publish_manager.py — stage and publish social posts for the CSOAI blitz.

Reads READY_TO_POST.txt and SOCIAL_BLITZ.md, extracts posts, stages them in
.hive/tasks/publish_queue.jsonl, and attempts to publish via Buffer API or
Kimi WebBridge when configured and available.
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
LOG = ROOT / ".hive" / "logs" / "publish_manager.log"


def load_config() -> dict[str, Any]:
    try:
        import yaml

        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")
    print(msg)


def queue_path(cfg: dict[str, Any]) -> Path:
    q = cfg.get("publish_loop", {}).get("queue", ".hive/tasks/publish_queue.jsonl")
    return ROOT / q


def read_queue(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    entries = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except Exception:
            continue
    return entries


def write_queue(path: Path, entries: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e) + "\n")


def extract_ready_to_post(text: str) -> list[dict[str, Any]]:
    posts = []
    # Look for a "TEXT:" block followed by body until a separator or ACTION.
    for m in re.finditer(r"(?:TEXT:|Text:)\s*\n(.*?)(?:\n---|\nACTION:|\Z)", text, re.DOTALL):
        body = m.group(1).strip()
        platforms = ["linkedin", "twitter"]
        if "reddit" in text.lower():
            platforms.append("reddit")
        posts.append({
            "source": "csoai-org/READY_TO_POST.txt",
            "platforms": platforms,
            "title": text.splitlines()[0][:80],
            "body": body,
        })
    return posts


def extract_social_blitz(text: str) -> list[dict[str, Any]]:
    posts = []
    # Match DAY headers and capture text until the next DAY or end.
    days = list(re.finditer(r"### DAY \d+:([^\n]+)\n", text))
    for i, m in enumerate(days):
        title = m.group(1).strip()
        start = m.end()
        end = days[i + 1].start() if i + 1 < len(days) else len(text)
        block = text[start:end]

        # Platform hint from title
        platforms = []
        lower_title = title.lower()
        if "linkedin" in lower_title:
            platforms.append("linkedin")
        if "twitter" in lower_title or "twitter/x" in lower_title:
            platforms.append("twitter")
        if "reddit" in lower_title:
            platforms.append("reddit")
        if "all channels" in lower_title:
            platforms = ["linkedin", "twitter", "reddit"]
        if not platforms:
            platforms = ["linkedin", "twitter"]

        # Extract **Text:** block
        tm = re.search(r"\*\*Text:\*\*\s*\n(.*?)(?:\n---|\n\#|\Z)", block, re.DOTALL)
        if tm:
            body = tm.group(1).strip()
            posts.append({
                "source": "csoai-org/SOCIAL_BLITZ.md",
                "platforms": platforms,
                "title": title,
                "body": body,
            })
    return posts


def ingest(cfg: dict[str, Any]) -> list[dict[str, Any]]:
    sources = cfg.get("publish_loop", {}).get("sources", [])
    posts: list[dict[str, Any]] = []
    for src in sources:
        path = ROOT / src
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if "READY_TO_POST" in src:
            posts.extend(extract_ready_to_post(text))
        elif "SOCIAL_BLITZ" in src:
            posts.extend(extract_social_blitz(text))
    return posts


def stage_new_posts(cfg: dict[str, Any]) -> list[dict[str, Any]]:
    q = queue_path(cfg)
    existing = read_queue(q)
    existing_bodies = {e.get("body", "") for e in existing}

    new = []
    for post in ingest(cfg):
        if post["body"] in existing_bodies:
            continue
        entry = {
            "id": f"post_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{len(existing) + len(new)}",
            "ts_queued": datetime.now(timezone.utc).isoformat(),
            "status": "pending",
            **post,
        }
        new.append(entry)

    if new:
        existing.extend(new)
        write_queue(q, existing)
        log(f"staged {len(new)} new posts (queue size: {len(existing)})")
    else:
        log("no new posts to stage")
    return new


def publish_via_buffer(post: dict[str, Any], token: str) -> bool:
    """Publish via Buffer API. Returns True if accepted."""
    url = "https://api.bufferapp.com/1/updates/create.json"
    # Profile IDs would need to be fetched separately; log limitation.
    data = {"text": post["body"][:280], "profile_ids": []}
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        log(f"buffer publish failed for {post['id']}: {e}")
        return False


def publish_via_webbridge(post: dict[str, Any], webbridge_url: str) -> bool:
    """Attempt to publish via Kimi WebBridge daemon if extension is connected."""
    try:
        status_url = f"{webbridge_url}/status"
        with urllib.request.urlopen(status_url, timeout=3) as resp:
            status = json.loads(resp.read().decode("utf-8"))
        if not status.get("extension_connected"):
            log(f"webbridge extension not connected for {post['id']}")
            return False
        payload = {
            "action": "publish_social",
            "platforms": post.get("platforms", []),
            "text": post["body"],
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(f"{webbridge_url}/execute", data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200
    except Exception as e:
        log(f"webbridge publish failed for {post['id']}: {e}")
        return False


def publish_pending(cfg: dict[str, Any]) -> None:
    q = queue_path(cfg)
    entries = read_queue(q)
    loop_cfg = cfg.get("publish_loop", {})
    dry_run = loop_cfg.get("dry_run", True)
    buffer_token = loop_cfg.get("buffer", {}).get("access_token") or os.environ.get("BUFFER_ACCESS_TOKEN")
    webbridge_url = loop_cfg.get("webbridge", {}).get("url")
    webbridge_enabled = loop_cfg.get("webbridge", {}).get("enabled", False)

    published = 0
    for entry in entries:
        if entry.get("status") != "pending":
            continue

        log(f"publishing {entry['id']} to {entry.get('platforms')} — dry_run={dry_run}")
        if dry_run:
            entry["status"] = "dry_run"
            entry["ts_result"] = datetime.now(timezone.utc).isoformat()
            published += 1
            continue

        ok = False
        if loop_cfg.get("buffer", {}).get("enabled") and buffer_token:
            ok = publish_via_buffer(entry, buffer_token)
        if not ok and webbridge_enabled and webbridge_url:
            ok = publish_via_webbridge(entry, webbridge_url)

        entry["status"] = "published" if ok else "failed"
        entry["ts_result"] = datetime.now(timezone.utc).isoformat()
        published += 1

    if published:
        write_queue(q, entries)
        log(f"processed {published} pending posts")


def main() -> None:
    cfg = load_config()
    loop_cfg = cfg.get("publish_loop", {})
    if not loop_cfg.get("enabled", False):
        log("publish_loop disabled in config")
        return

    stage_new_posts(cfg)
    publish_pending(cfg)


if __name__ == "__main__":
    main()
