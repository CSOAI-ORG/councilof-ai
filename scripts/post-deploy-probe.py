#!/usr/bin/env python3
"""One bounded public HTTP probe; emit only allowlisted transport diagnostics.

The urllib application User-Agent is a separate control. It never retries or
replaces the default-client observation. No response body, header, exception
message or full effective URL is emitted.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request

CONTROL_USER_AGENT = "csoai-post-deploy-control/1.0"


def http_status(value):
    text = str(value)
    return int(text) if len(text) == 3 and text.isascii() and text.isdigit() and 100 <= int(text) <= 599 else None


def response_host(url, status):
    # An effective URL alone does not establish that a response was received.
    if status is None:
        return None
    try:
        return urllib.parse.urlsplit(url).hostname
    except ValueError:
        return None


def curl_probe(url, *, method="GET", timeout=20, accepted_statuses=(200,)):
    result = {
        "client": "curl", "method": method, "ok": False,
        "curl_exit": None, "exception": None, "http_status": None, "final_host": None,
    }
    command = [
        "curl", "--silent", "--location", "--max-time", str(timeout),
        "--output", os.devnull, "--write-out", "%{http_code}\n%{url_effective}",
    ]
    if method == "HEAD":
        command.append("--head")
    command.extend(["--url", url])
    try:
        completed = subprocess.run(
            command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            text=True, encoding="utf-8", errors="replace", check=False, timeout=timeout + 2,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        result["exception"] = type(exc).__name__
        return result
    code, separator, effective_url = completed.stdout.partition("\n")
    status = http_status(code) if separator else None
    result.update(
        curl_exit=completed.returncode,
        http_status=status,
        final_host=response_host(effective_url.strip(), status),
        ok=completed.returncode == 0 and status in accepted_statuses,
    )
    return result


def urllib_probe(url, *, application_control=False, timeout=20):
    result = {
        "client": "urllib", "method": "GET", "ok": False,
        "user_agent_mode": "application-control" if application_control else "default",
        "exception": None, "http_status": None, "final_host": None,
    }
    # Passing the URL directly retains Python's real default User-Agent.
    request = urllib.request.Request(url, headers={"User-Agent": CONTROL_USER_AGENT}) if application_control else url
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = http_status(response.status)
            result.update(http_status=status, final_host=response_host(response.geturl(), status), ok=status is not None)
    except Exception as exc:
        is_http = isinstance(exc, urllib.error.HTTPError)
        status = http_status(exc.code) if is_http else None
        result.update(
            exception=type(exc).__name__, http_status=status,
            final_host=response_host(exc.geturl(), status) if is_http else None,
        )
    return result


def positive_timeout(value):
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise argparse.ArgumentTypeError("timeout must be finite and positive")
    return number


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client", required=True, choices=("curl", "urllib"))
    parser.add_argument("--method", choices=("GET", "HEAD"), default="GET")
    parser.add_argument("--timeout", type=positive_timeout, default=20)
    parser.add_argument("--accept-status", type=int, action="append")
    parser.add_argument("--application-control", action="store_true")
    parser.add_argument("url")
    args = parser.parse_args()
    if args.client == "curl":
        if args.application_control:
            parser.error("application-control requires urllib")
        result = curl_probe(args.url, method=args.method, timeout=args.timeout, accepted_statuses=args.accept_status or (200,))
    else:
        if args.method != "GET" or args.accept_status:
            parser.error("urllib retains the existing GET response contract")
        result = urllib_probe(args.url, application_control=args.application_control, timeout=args.timeout)
    print(json.dumps(result, sort_keys=True))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
