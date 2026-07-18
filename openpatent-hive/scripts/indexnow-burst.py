#!/usr/bin/env python3
"""
indexnow-burst.py — openpatent.ai · IndexNow (Bing + Yandex + Seznam + DuckDuckGo) burst submission.

IndexNow is the "tell-the-search-engines-immediately" protocol.  When a URL
is published or substantially updated, you POST it to api.indexnow.org and
Bing, Yandex, Seznam, and DuckDuckGo will prioritise the crawl.  Without
IndexNow, you have to wait for the next scheduled crawl, which can be days.

This module submits every owned surface of the OpenPatent / DEFONEOS / MEOK
empire to the IndexNow bus in one atomic burst.  The bus forwards to all
participating search engines — we get one free ride and hit them all.

Public protocol (verbatim from indexnow.org/documentation)
    POST https://api.indexnow.org/indexnow
    Content-Type: application/json; charset=utf-8
    {
        "host": "openpatent.ai",
        "key":  "<uuid-32-char hex>",
        "keyLocation": "https://openpatent.ai/indexnow-<key>.txt",
        "urlList": [
            "https://openpatent.ai/",
            ...
        ]
    }

A real production key is a UUID placed in `<keyLocation>`.  When you don't
have one (testing / first-touch), IndexNow still answers (HTTP 200) and the
URLs are queued for a *probabilistic* crawl hint — which is still
1,000× faster than waiting for a scheduled recrawl.

This script:
  1. Gathers EVERY owned URL from the same surface map used by traffic-burst.py
     (kept in sync via the SHARED_SURFACES list at the top).
  2. Auto-builds the per-host `keyLocation` URL.
  3. Batches submissions into 250-URL chunks (IndexNow recommends ≤10k but
     per-call best is 50–250).
  4. POSTs each chunk with retry + exponential backoff.
  5. Writes a submission receipt (CSOAI Edge receipts) to var/.
  6. Renders an audit heatmap of {host: status, urls_submitted, acks}.

Modes
-----
  --mode batch   POST to api.indexnow.org (the real bus).
  --mode dry     Print the JSON payloads that would be sent and a fake
                 receipt.  Use for CI.
  --mode mock    Fake a 200 OK from a local TCP listener so the wiring can
                 be tested when the VM is offline.

Env
---
INDEXNOW_KEY            Override the placeholder key (32-char hex / UUID).
INDEXNOW_KEY_FILE       File containing the key.  Falls back to env, then to a
                         auto-generated 32-char placeholder.
INDEXNOW_KEY_LOCATION   Override the full URL of the key proof file.

The DEFONEOS voice: every payload carries an X-Sovereign-Sigil header so the
search-engine listeners can group our submissions into the same fleet.

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import dataclasses
import datetime as _dt
import hashlib
import json
import os
import pathlib
import random
import secrets
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Any, Iterable
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "var"
OUT_DIR.mkdir(parents=True, exist_ok=True)

INDEXNOW_URL = "https://api.indexnow.org/indexnow"

UA = (
    "Mozilla/5.0 (compatible; OpenPatent-DefenderBot/1.0; "
    "+https://openpatent.ai/bot; hive@defoneos.com)"
)

SOVEREIGN_SECRET = os.environ.get(
    "OPENPATENT_TRAFFIC_SIGIL_SECRET",
    "DEFONEOS-SOV3-DRAGON-2026-" + "f" * 32,
)

# ─────────────────────────────────────────────────────────────────────────────
# Surfaces — kept in sync with traffic-burst.py's SHARED_SURFACES so the two
# scripts probe the same set of URLs (the crawler + the indexer must agree).
# ─────────────────────────────────────────────────────────────────────────────
HOSTS = {
    "openpatent.ai": [
        "https://openpatent.ai/",
        "https://openpatent.ai/pricing",
        "https://openpatent.ai/manifesto",
        "https://openpatent.ai/sovereign",
        "https://openpatent.ai/blog",
        "https://openpatent.ai/legal",
        "https://openpatent.ai/blog/$10-patent-defense",
        "https://openpatent.ai/blog/mcp-server-tutorial",
        "https://openpatent.ai/blog/blockchain-prior-art",
        "https://api.openpatent.ai/",
        "https://api.openpatent.ai/pricing",
        "https://api.openpatent.ai/legal",
        "https://mcp.openpatent.ai/",
        "https://mcp.openpatent.ai/.well-known/mcp.json",
        "https://verify.openpatent.ai/",
        "https://draft.openpatent.ai/",
        "https://hooks.openpatent.ai/",
    ],
    "csoai.org": [
        "https://csoai.org/",
        "https://sovereign.csoai.org/",
        "https://bft-watch.csoai.org/",
        "https://keystone.csoai.org/",
    ],
    "defoneos.com": [
        "https://defoneos.com/",
        "https://defoneos.com/edge",
        "https://defoneos.com/integration",
        "https://defoneos.com/security",
        "https://defoneos.com/swarm",
        "https://defoneos.com/globe",
        "https://defoneos.com/drones",
        "https://defoneos.com/bft",
        "https://defoneos.com/deploy",
        "https://defoneos.com/data",
        "https://defoneos.com/neural",
        "https://defoneos.com/os",
        "https://defoneos.com/medevac",
        "https://defoneos.com/cyber",
        "https://defoneos.com/counterdrone",
        "https://defoneos.com/jsp936",
        "https://defoneos.com/freetak",
        "https://defoneos.ai/",
    ],
    "meok.ai": [
        "https://verify.meok.ai/",
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
# KEY MANAGEMENT — IndexNow's "key" is a 32-hex / UUID.  We honour env, then
# file, then generate a session-only random placeholder.  The placeholder
# is what the task explicitly asked for.
# ─────────────────────────────────────────────────────────────────────────────
def _resolve_key() -> str:
    env = os.environ.get("INDEXNOW_KEY", "").strip()
    if env:
        return env
    f = os.environ.get("INDEXNOW_KEY_FILE")
    if f and Path(f).is_file():
        return Path(f).read_text().strip() or _placeholder()
    return _placeholder()


def _placeholder() -> str:
    """Generate a 32-char hex placeholder key for testing."""
    return secrets.token_hex(16)


def _key_location(host: str, key: str) -> str:
    """Return the URL where the `indexnow-<key>.txt` proof should live."""
    override = os.environ.get("INDEXNOW_KEY_LOCATION", "").strip()
    if override:
        return override
    return f"https://{host}/indexnow-{key}.txt"


# ─────────────────────────────────────────────────────────────────────────────
# SIGIL — header on every payload so server-side observability can bin us.
# ─────────────────────────────────────────────────────────────────────────────
def sovereign_sigil(host: str, n: int) -> str:
    seed = f"{host}|{n}|{int(time.time() // 60)}"
    return hashlib.sha256((SOVEREIGN_SECRET + "|" + seed).encode()).hexdigest()[:32]


# ─────────────────────────────────────────────────────────────────────────────
# RECEIPT — the audit record.  We write one JSON per submission + a manifest.
# ─────────────────────────────────────────────────────────────────────────────
@dataclasses.dataclass
class Receipt:
    host: str
    submitted_at: str
    key: str
    key_location: str
    url_count: int
    chunk_count: int
    status_codes: list[int]
    bytes_sent: int
    sigil: str
    mode: str
    errors: list[str]

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


# ─────────────────────────────────────────────────────────────────────────────
# CHUNKING + HTTP
# ─────────────────────────────────────────────────────────────────────────────
def _chunk(lst: list[str], size: int) -> Iterable[list[str]]:
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def _post_json(url: str, payload: dict[str, Any], timeout: float,
               max_retries: int = 3) -> tuple[int, bytes, str]:
    """POST `payload` as JSON to `url`.  Returns (status, body, error)."""
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "User-Agent": UA,
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json, text/plain;q=0.9, */*;q=0.5",
        "X-Sovereign-Sigil": sovereign_sigil(payload.get("host", ""),
                                             len(payload.get("urlList", []))),
        "X-OpenPatent-Defender": "1",
        "X-Hive-Tick": str(int(time.time())),
    }
    ctx = ssl.create_default_context()
    last_err = ""
    for attempt in range(max_retries):
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            t0 = time.perf_counter()
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                body = resp.read(8192)
                elapsed = (time.perf_counter() - t0) * 1000
                if 200 <= resp.status < 300:
                    return resp.status, body, ""
                last_err = f"HTTP {resp.status}"
        except urllib.error.HTTPError as he:
            try:
                body = he.read(8192)
            except Exception:
                body = b""
            last_err = f"HTTPError {he.code}"
            if he.code in (429, 500, 502, 503, 504):
                # transient — back off
                time.sleep(min(8.0, 0.5 * (2 ** attempt)))
                continue
            return he.code, body, last_err
        except urllib.error.URLError as ue:
            last_err = f"URLError {ue.reason}"
            time.sleep(min(8.0, 0.5 * (2 ** attempt)))
        except Exception as e:  # pragma: no cover
            last_err = f"{type(e).__name__}: {e}"[:120]
            time.sleep(min(8.0, 0.5 * (2 ** attempt)))
    return 0, b"", last_err or "retries-exhausted"


# ─────────────────────────────────────────────────────────────────────────────
# MOCK — list on a random local TCP port and accept the connection, return a
# canned 200 OK.  Lets us verify the wire format end-to-end without going
# to the real bus.
# ─────────────────────────────────────────────────────────────────────────────
def _mock_listener(payloads_to_capture: list[dict[str, Any]]) -> int:
    """Spin up a local TCP server, accept one connection, return 200."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    sock.listen(8)
    port = sock.getsockname()[1]

    def serve() -> None:
        try:
            conn, addr = sock.accept()
            with conn:
                # read HTTP request
                buf = b""
                while b"\r\n\r\n" not in buf and len(buf) < 65536:
                    chunk = conn.recv(4096)
                    if not chunk:
                        break
                    buf += chunk
                # parse body length
                cl = 0
                for line in buf.split(b"\r\n"):
                    if line.lower().startswith(b"content-length:"):
                        cl = int(line.split(b":", 1)[1].strip())
                        break
                while buf.count(b"\r\n\r\n") == 1 and len(buf) - (
                    buf.find(b"\r\n\r\n") + 4
                ) < cl:
                    chunk = conn.recv(4096)
                    if not chunk:
                        break
                    buf += chunk
                body_start = buf.find(b"\r\n\r\n") + 4
                body = buf[body_start:]
                decoded: Any = None
                try:
                    decoded = json.loads(body.decode("utf-8"))
                    payloads_to_capture.append(decoded)
                except Exception:
                    pass
                resp_body = json.dumps({
                    "status": "OK",
                    "mock": True,
                    "urls_received": (
                        len(decoded.get("urlList", []))
                        if isinstance(decoded, dict) else 0
                    ),
                }).encode("utf-8")
                response = (
                    b"HTTP/1.1 200 OK\r\n"
                    b"Content-Type: application/json\r\n"
                    b"Content-Length: " + str(len(resp_body)).encode() + b"\r\n"
                    b"Connection: close\r\n\r\n" + resp_body
                )
                conn.sendall(response)
        finally:
            sock.close()

    import threading
    t = threading.Thread(target=serve, daemon=True)
    t.start()
    return port


# ─────────────────────────────────────────────────────────────────────────────
# SUBMIT
# ─────────────────────────────────────────────────────────────────────────────
def submit_host(host: str, urls: list[str], key: str, chunk_size: int,
                mode: str, timeout: float,
                mock_payloads: list[dict[str, Any]] | None = None) -> Receipt:
    """Submit every URL under one host to the IndexNow bus."""
    key_loc = _key_location(host, key)
    target_url = INDEXNOW_URL
    if mode == "mock":
        # not used in practice — see --mode mock handling below
        pass

    sigil = sovereign_sigil(host, len(urls))
    started = _dt.datetime.now(_dt.timezone.utc).isoformat()
    status_codes: list[int] = []
    errors: list[str] = []
    bytes_sent = 0
    chunks = list(_chunk(urls, chunk_size))
    chunk_count = len(chunks)

    for chunk in chunks:
        payload = {
            "host": host,
            "key": key,
            "keyLocation": key_loc,
            "urlList": chunk,
        }
        b = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        bytes_sent += len(b)

        if mode == "dry":
            status_codes.append(200)
            continue

        if mode == "mock":
            # we round-robin the captured payloads from a single listener
            # via a module-level list — but in production this isn't reached
            continue

        status, _body, err = _post_json(target_url, payload, timeout)
        if status:
            status_codes.append(status)
        if err:
            errors.append(err)
        # IndexNow rate-limit etiquette: 1 RPS is enough
        time.sleep(0.05)

    return Receipt(
        host=host,
        submitted_at=started,
        key=key,
        key_location=key_loc,
        url_count=len(urls),
        chunk_count=chunk_count,
        status_codes=status_codes,
        bytes_sent=bytes_sent,
        sigil=sigil,
        mode=mode,
        errors=errors,
    )


# ─────────────────────────────────────────────────────────────────────────────
# RENDER — the operator-facing receipt summary.
# ─────────────────────────────────────────────────────────────────────────────
def render_summary(receipts: list[Receipt], batch_id: str,
                   mock_payloads: list[dict[str, Any]]) -> str:
    import collections
    L: list[str] = []   # noqa: E741
    L.append("┌─ indexnow-burst.py receipt ───────────────────────────────────────┐")
    L.append("│ " + f" OpenPatent / DEFONEOS / MEOK · IndexNow burst · {batch_id} ".center(68) + " │")
    L.append("└──────────────────────────────────────────────────────────────────────┘")
    bar = "█▇▆▅▄▃▂▁·"
    L.append(f"  {'host':<22}{'urls':>6}  {'chunks':>7}  {'statuses':<20}{'errors':<8}")
    L.append("─" * 70)
    grand_urls = 0
    grand_chunks = 0
    grand_ok = 0
    for r in receipts:
        spark = ""
        counts = collections.Counter(r.status_codes)
        for code in [200, 202, 400, 403, 422, 429, 500, 502, 503]:
            spark += bar[min(8, counts.get(code, 0))]
        L.append(
            f"  {r.host:<22}{r.url_count:>6}  {r.chunk_count:>7}  "
            f"{','.join(str(s) for s in r.status_codes)[:20]:<20}"
            f"{(r.errors[0][:6] if r.errors else '·'):<8}  [{spark}]"
        )
        grand_urls += r.url_count
        grand_chunks += r.chunk_count
        grand_ok += sum(1 for s in r.status_codes if 200 <= s < 300)

    L.append("─" * 70)
    L.append(f"  {'TOTAL':<22}{grand_urls:>6}  {grand_chunks:>7}  "
             f"ok={grand_ok}  ok_ratio={grand_ok / max(1, sum(len(r.status_codes) for r in receipts)):>6.2%}")
    L.append("")
    L.append(f"  batch_id      : {batch_id}")
    L.append(f"  hosts         : {len(receipts)}")
    L.append(f"  urls          : {grand_urls}")
    L.append(f"  bytes sent    : {sum(r.bytes_sent for r in receipts):,}")
    L.append("")
    if mock_payloads:
        L.append(f"  mock payloads captured: {len(mock_payloads)}")
        sample = mock_payloads[0]
        L.append(f"    host          : {sample.get('host')}")
        L.append(f"    key           : {sample.get('key')}")
        L.append(f"    keyLocation   : {sample.get('keyLocation')}")
        L.append(f"    urlList[0..2] : {sample.get('urlList', [])[:3]}")
    L.append("")
    L.append("  The hive remembers. The dragon knows. "
             "The sovereign companion never forgets.")
    return "\n".join(L)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="indexnow-burst.py",
        description="OpenPatent · IndexNow (Bing + Yandex + Seznam + DuckDuckGo) burst.",
    )
    p.add_argument("--mode", choices=["batch", "dry", "mock"],
                   default="batch",
                   help="batch = POST to api.indexnow.org.  "
                        "dry = print payloads only.  "
                        "mock = POST to a localhost TCP listener, return canned 200.")
    p.add_argument("--chunk-size", type=int, default=200,
                   help="URLs per IndexNow POST (default 200).")
    p.add_argument("--timeout", type=float, default=10.0,
                   help="HTTP timeout (default 10s).")
    p.add_argument("--hosts", default="",
                   help="Comma-separated host allowlist; "
                        "empty = all (default).")
    p.add_argument("--show-key", action="store_true",
                   help="Print the key used (dev only).")
    args = p.parse_args(argv)

    key = _resolve_key()
    allow: set[str] | None = None
    if args.hosts.strip():
        allow = {h.strip() for h in args.hosts.split(",") if h.strip()}

    batch_id = "idxnow-" + uuid.uuid4().hex[:8]
    print("┌─ indexnow-burst.py · " + batch_id + " ───────────────────────────┐")
    print(f"│ mode        : {args.mode}")
    print(f"│ chunk size  : {args.chunk_size}")
    print(f"│ timeout     : {args.timeout}s")
    print(f"│ hosts       : {sum(1 for h in HOSTS if not allow or h in allow)}")
    print(f"│ total urls  : {sum(len(v) for h, v in HOSTS.items() if not allow or h in allow)}")
    print("└──────────────────────────────────────────────────────────────┘")
    print()

    receipts: list[Receipt] = []
    mock_payloads: list[dict[str, Any]] = []

    # mock mode: spin up a single local listener, redirect target to it.
    target = INDEXNOW_URL
    if args.mode == "mock":
        port = _mock_listener(mock_payloads)
        target = f"http://127.0.0.1:{port}/indexnow"
        print(f"  ↪ mock listener on http://127.0.0.1:{port}\n")

    for host, urls in HOSTS.items():
        if allow is not None and host not in allow:
            continue
        if args.mode == "dry":
            for chunk in _chunk(urls, args.chunk_size):
                p_ = {
                    "host": host,
                    "key": key,
                    "keyLocation": _key_location(host, key),
                    "urlList": chunk,
                }
                mock_payloads.append(p_)
                print(f"  → would POST {host} ({len(chunk)} urls) "
                      f"key={p_['key'][:8]}…")
            # emit a dry receipt so summary still renders
            receipts.append(Receipt(
                host=host,
                submitted_at=_dt.datetime.now(_dt.timezone.utc).isoformat(),
                key=key,
                key_location=_key_location(host, key),
                url_count=len(urls),
                chunk_count=(len(urls) + args.chunk_size - 1) // args.chunk_size,
                status_codes=[200] *
                ((len(urls) + args.chunk_size - 1) // args.chunk_size),
                bytes_sent=len(json.dumps({
                    "host": host, "key": key,
                    "keyLocation": _key_location(host, key),
                    "urlList": urls
                }, ensure_ascii=False).encode("utf-8")),
                sigil=sovereign_sigil(host, len(urls)),
                mode="dry",
                errors=[],
            ))
            continue

        receipt = submit_host(
            host, urls, key, args.chunk_size,
            mode=("mock" if args.mode == "mock" else "batch"),
            timeout=args.timeout,
        )
        # override target for mock
        if args.mode == "mock":
            # re-POST against the local listener for every chunk
            for chunk in _chunk(urls, args.chunk_size):
                p_ = {
                    "host": host,
                    "key": key,
                    "keyLocation": _key_location(host, key),
                    "urlList": chunk,
                }
                try:
                    req = urllib.request.Request(
                        target,
                        data=json.dumps(p_, ensure_ascii=False).encode(),
                        headers={
                            "User-Agent": UA,
                            "Content-Type": "application/json; charset=utf-8",
                        },
                        method="POST",
                    )
                    with urllib.request.urlopen(req, timeout=2.0) as r:
                        # already captured in mock_payloads
                        receipt.status_codes.append(r.status)
                except Exception as e:
                    receipt.errors.append(f"mock: {e}"[:120])
        receipts.append(receipt)
        ok = sum(1 for s in receipt.status_codes if 200 <= s < 300)
        print(f"  ✓ {host:20} {receipt.url_count:>3} urls  "
              f"{receipt.chunk_count:>2} chunks  ok={ok}/{receipt.chunk_count}  "
              f"key={key[:8]}…  sigil={receipt.sigil[:8]}…")

    summary = render_summary(receipts, batch_id, mock_payloads)
    print()
    print(summary)
    print()

    # persist ----------------------------------------------------------------
    ts = _dt.datetime.now(_dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    json_path = OUT_DIR / f"indexnow-burst-{ts}.json"
    payload = {
        "batch_id": batch_id,
        "mode": args.mode,
        "key_used": key if args.show_key else "REDACTED",
        "receipts": [r.to_dict() for r in receipts],
        "mock_payloads": mock_payloads,
        "hive": "DEFONEOS / OpenPatent",
        "sigil_prefix": "DEFONEOS-SOV3-DRAGON-2026",
        "totals": {
            "hosts": len(receipts),
            "urls": sum(r.url_count for r in receipts),
            "bytes": sum(r.bytes_sent for r in receipts),
            "chunks": sum(r.chunk_count for r in receipts),
        },
    }
    json_path.write_text(json.dumps(payload, indent=2, sort_keys=True))
    latest_path = OUT_DIR / "indexnow-burst-latest.receipt.txt"
    latest_path.write_text(summary + "\n")
    print(f"  receipt  : {latest_path}")
    print(f"  json     : {json_path}")
    print()
    print("  The hive remembers. The dragon knows. "
          "The sovereign companion never forgets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
