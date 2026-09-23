# Receipt chain

An append-only record of what this estate did, each link naming the digest of the one
before it, so a reader can detect a removed or reordered entry without trusting us.

- links: **35**
- links whose `prev_hash` equals the previous entry's `state_digest`: **34 of 34**
- first entry: `2026-09-22T06:49:19` (GENESIS)
- most recent: `2026-09-23T05:05:02` (HOURLY_SPINE)
- file digest (sha256): `1fe396fd30b5c8c43b24e8386f00602864b3ed94f9f796dcb78e1fb87ef99ec9`

## Verify it yourself

```bash
curl -sO https://councilof.ai/interop/receipts/receipt-chain.jsonl
python3 - <<'EOF'
import json
ls=[json.loads(l) for l in open("receipt-chain.jsonl") if l.strip()]
bad=[i for i,(a,b) in enumerate(zip(ls,ls[1:]),1) if b.get("prev_hash")!=a.get("state_digest")]
print(f"{len(ls)} links, {len(bad)} broken", bad[:5])
EOF
```

A broken link means an entry was altered, removed or reordered after the fact.

## What this does and does not prove

It proves these entries existed in this order and have not been edited since the next one
was written. It does **not** prove any statement inside an entry is true — each entry points
at its own evidence, and that is where a reader should go next.

The accompanying `.ots` is an OpenTimestamps receipt **submitted to the calendars and pending
confirmation**. It is not a Bitcoin attestation and must not be described as anchored until
the proof is upgraded and verified.

This chain began on 2026-09-22. It is short, and saying so is the point.
