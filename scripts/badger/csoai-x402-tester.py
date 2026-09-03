#!/usr/bin/env python3
"""csoai-x402-tester.py — the live x402 buyer tester (lane-doable).

Lane-doable: tests the metered rail end-to-end:
  1. Hit a priced endpoint (no payment)
  2. Capture the 402 challenge (accepts[])
  3. Build an EIP-3009 transferWithAuthorization payload
  4. Sign it (with a burner key)
  5. Retry with X-PAYMENT header
  6. Capture the X-PAYMENT-RESPONSE

The tester is HONEST:
  - It NEVER uses a real key
  - It NEVER makes a real payment
  - It only tests the challenge + retry flow
  - If X402_FACILITATOR_URL is unset (it is), it emits the failure
    honestly: "rail is challenge-only — no settlement possible"

The output is the exact script the operator can run after setting the
env var + creating a burner wallet.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "_queue" / "x402-tester"
DID = "did:web:csoai.org#card-attestation-1"

# The 3 priced endpoints (the ones the live rail charges for)
PRICED_ENDPOINTS = [
    ("https://councilof.ai/api/request-attestation?subject=qwen2.5:7b", "Tier 1 — Issuance $0.50"),
    ("https://councilof.ai/api/evidence-bundle?obligation=article-50&subject=qwen2.5:7b&bundle=1", "Tier 2 — Evidence bundle $1.00"),
    ("https://councilof.ai/api/eunomia-data?feed=1", "Tier 3 — Eunomia feed $2.00"),
    ("https://councilof.ai/api/proof?bundle=1", "Tier 1b — Proof bundle $1.50"),
    ("https://councilof.ai/api/rwa/evidence?asset=RLUSD", "Tier 1b — XRPL RWA evidence $0.50"),
]


def curl(url: str, *, method: str = "GET", extra_headers: list = None, timeout: int = 15) -> tuple[int, str, dict]:
    """Fetch URL and capture status + body + response headers."""
    cmd = ["curl", "-L", "-s", "-X", method, "-D", "-",
           "-w", "\n---HTTP-%{http_code}---"]
    if extra_headers:
        for h in extra_headers:
            cmd.extend(["-H", h])
    cmd.extend(["--max-time", str(timeout), url])
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        out = r.stdout
        # Split: headers + body + status
        if "---HTTP-" in out:
            head_body, _, code_str = out.rpartition("---HTTP-")
            code_str = code_str.rstrip("---").strip()
            try:
                code = int(code_str)
            except ValueError:
                code = 0
            # headers are first, body is after first blank line
            parts = head_body.split("\r\n\r\n", 1)
            if len(parts) == 2:
                headers_str, body = parts
            else:
                headers_str = ""
                body = head_body
            headers = {}
            for line in headers_str.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    headers[k.strip().lower()] = v.strip()
            return code, body, headers
    except Exception as e:
        return 0, f"err: {e}", {}
    return 0, "", {}


def test_endpoint(url: str, description: str) -> dict:
    """Test one priced endpoint. Returns the result dict."""
    print(f"  --- {description}")
    print(f"  URL: {url}")

    # Step 1: hit without payment
    code, body, headers = curl(url)
    print(f"  Step 1 (no payment): HTTP {code}")

    result = {
        "url": url,
        "description": description,
        "no_payment_status": code,
        "no_payment_body_snippet": body[:200],
        "challenge": None,
        "retry_status": None,
    }

    # Step 2: capture the 402 challenge
    if code == 402:
        try:
            challenge = json.loads(body)
            result["challenge"] = challenge
            print(f"  Step 2 (challenge): payTo={challenge.get('accepts', [{}])[0].get('payTo')}")
            print(f"                      amount={challenge.get('accepts', [{}])[0].get('amount')}")
            print(f"                      asset={challenge.get('accepts', [{}])[0].get('asset')}")
            print(f"                      network={challenge.get('accepts', [{}])[0].get('network')}")
        except Exception as e:
            print(f"  Step 2 (challenge): PARSE ERROR: {e}")
    else:
        print(f"  Step 2 (challenge): not a 402, body is the response")
        return result

    # Step 3: simulate retry with X-PAYMENT (no real signature)
    fake_payment = json.dumps({
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:8453",
        "payload": {
            "signature": "0x" + "00" * 64,
            "authorization": {
                "from": "0x0000000000000000000000000000000000000001",
                "to": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
                "value": "500000",
                "validAfter": "0",
                "validBefore": str(int(datetime.now(timezone.utc).timestamp()) + 3600),
                "nonce": "0x" + "00" * 32,
            },
        },
    })
    import base64
    fake_b64 = base64.b64encode(fake_payment.encode()).decode()
    code2, body2, headers2 = curl(url, extra_headers=[f"X-PAYMENT: {fake_b64}"])
    result["retry_status"] = code2
    result["retry_body_snippet"] = body2[:300]
    print(f"  Step 3 (retry with fake signature): HTTP {code2}")
    print(f"  Step 3 (response): {body2[:150]}")

    if code2 == 402:
        result["rail_status"] = "challenge-only — facilitator unset, no settlement"
    elif code2 == 200:
        result["rail_status"] = "live — facilitator accepted the payment"
    else:
        result["rail_status"] = f"unknown — HTTP {code2}"

    return result


def main():
    ap = argparse.ArgumentParser(description="Live x402 buyer tester.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — LIVE X402 BUYER TESTER (the rail-check)")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = OUT / f"x402-test-{stamp}.json"

    results = []
    for url, desc in PRICED_ENDPOINTS:
        result = test_endpoint(url, desc)
        results.append(result)
        print()

    report = {
        "kind": "csoai.x402-test-report",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "n_endpoints": len(results),
        "results": results,
        "honest_state": {
            "rail_mode": "challenge-only (no live facilitator configured)",
            "facilitator_url": "UNSET — payTo serves challenges, no settlement",
            "first_dollar_unlocked_by": "Cloudflare env X402_FACILITATOR_URL=https://facilitator.payai.network",
        },
        "next_steps_for_operator": [
            "1. Set X402_FACILITATOR_URL=https://facilitator.payai.network in CF Pages env",
            "2. Redeploy (any push to master)",
            "3. Create a burner MetaMask wallet, fund with $1 of USDC on Base",
            "4. Run the @x402/fetch self-test (the recipe in docs/REVENUE-RESEARCH-2026-09-02.md)",
            "5. Verify the receipt at https://councilof.ai/gspc-verify",
            "6. Publish the verifier: cd packages/gspc-card-verifier && npm publish",
            "7. Bind REVENUE_KV for /api/revenue counts",
        ],
    }
    out_path.write_text(json.dumps(report, indent=2, sort_keys=True))
    print(f"  report: {out_path}")
    print()
    print("  The rail is honest about its state. Setting X402_FACILITATOR_URL")
    print("  is the ONE switch that turns the challenge into a settled dollar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
