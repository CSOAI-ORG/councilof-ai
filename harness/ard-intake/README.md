# Cisco AI Catalog / ARD intake for Layer 0 and Harness X

This adapter consumes a saved Agentic Resource Discovery (ARD) manifest and
turns each entry into a **discovery-only candidate**. It is a source adapter,
not a validator, runtime connector, GSPC measurement, or endorsement.

## Safe path

1. Run `python3 fetch_cisco_catalog.py --snapshot /tmp/cisco-ard.json --receipt /tmp/cisco-ard-fetch.json`.
   The fetcher is pinned to Cisco's HTTPS catalog host, caps input at 32 MiB,
   rejects off-host redirects, and saves exact response bytes plus digest.
2. Run `python3 cisco_catalog_intake.py /tmp/cisco-ard.json --out /tmp/candidates.jsonl --receipt /tmp/intake.json`.
3. Review the receipt and quarantine report; check entry URLs, identity and
   trust-manifest evidence before any endpoint-specific probe.
4. A separate Harness X adapter can perform a bounded, consented protocol
   handshake. Only admitted, reproducible observations can be considered by
   Layer 0. A directory count or card never becomes a GSPC score.

The parser treats every description, prompt, locator and capability string as
untrusted data. It does not dereference card URLs, call MCP/A2A endpoints,
execute tools, follow instructions embedded in records, or infer live health.
It records the manifest's SHA-256 and each exact entry's canonical JSON digest.

The page UI displayed 3,087 indexed cards on 28 September 2026. That displayed
count is recorded separately from manifest counts. The pinned manifest fetch
failed local DNS resolution during this run, so the next successful fetch must
reconcile the manifest entry count before the catalog is treated as ingested.

## Run the full local catalog intake

One command fetches the manifest, preserves exact bytes, normalizes candidates,
and emits a descriptive GSPC source-change event:

```sh
python3 sync_cisco_catalog.py --out-dir /tmp/cisco-ard-run-20260928
```

The output directory contains the exact manifest, fetch/intake receipts,
quarantined candidate JSONL, and the event. The event conforms to the existing
Condor/GSPC CloudEvents contract, but is not a SOV-X write, admitted finding,
measurement, signature, or anchor. If fetch fails, no source-change event is
emitted. Existing run directories are never overwritten.
