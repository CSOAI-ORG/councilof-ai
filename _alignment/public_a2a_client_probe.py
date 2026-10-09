#!/usr/bin/env python3
"""Read-only, anonymous client-compatibility probe for a public A2A card.

This tests reachability and byte parity. It does not verify the card's owner,
signature, admission, agent invocation, or any commercial use.
"""

import argparse
import datetime
import hashlib
import json
import sys
import urllib.error
import urllib.parse
import urllib.request


def read_card(url: str, user_agent: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": user_agent, "Accept": "application/a2a+json, application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            body = response.read(1_000_001)
            if len(body) > 1_000_000:
                return {"state": "TOO_LARGE", "status": response.status}
            try:
                parsed = json.loads(body)
            except (ValueError, UnicodeDecodeError):
                return {"state": "NON_JSON", "status": response.status}
            if not isinstance(parsed, dict):
                return {"state": "NON_OBJECT_JSON", "status": response.status}
            return {
                "state": "READABLE",
                "status": response.status,
                "content_type": response.headers.get("Content-Type", ""),
                "cf_ray": response.headers.get("CF-Ray"),
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
                "name": parsed.get("name"),
                "url": parsed.get("url"),
                "skills": len(parsed.get("skills", [])) if isinstance(parsed.get("skills"), list) else None,
            }
    except urllib.error.HTTPError as error:
        body = error.read(2048)
        return {
            "state": "CLOUDFLARE_1010" if b"1010" in body and error.code == 403 else "HTTP_ERROR",
            "status": error.code,
            "cf_ray": error.headers.get("CF-Ray"),
        }
    except (urllib.error.URLError, TimeoutError) as error:
        return {"state": "NETWORK_ERROR", "error_type": type(error).__name__}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--url",
        default="https://councilof.ai/.well-known/agent-card.json",
        help="Public HTTPS A2A card URL",
    )
    args = parser.parse_args()
    parsed_url = urllib.parse.urlparse(args.url)
    if parsed_url.scheme != "https" or not parsed_url.netloc or parsed_url.username or parsed_url.password:
        parser.error("--url must be an HTTPS URL without embedded credentials")

    clients = {
        "curl_user_agent": "curl/8.7.1",
        "python_urllib": "Python-urllib/3.14",
    }
    observations = {name: read_card(args.url, agent) for name, agent in clients.items()}
    readable = all(result["state"] == "READABLE" for result in observations.values())
    matching = readable and len({result["sha256"] for result in observations.values()}) == 1
    report = {
        "schema": "csoai.public-a2a-client-probe/0.1",
        "observed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "url": args.url,
        "observations": observations,
        "verdict": "PASS" if matching else "FAIL",
        "limit": "Anonymous card reachability and exact-byte parity only; no identity, signature, invocation or admission verdict.",
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if matching else 1


if __name__ == "__main__":
    sys.exit(main())
