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

A broken link means an entry was removed or reordered, or its `state_digest` was changed. It does **not**
catch an entry whose other fields were edited while its `state_digest` was left alone. For that, recompute
each link's own digest:

```bash
python3 - <<'EOF'
import json, hashlib
ls=[json.loads(l) for l in open("receipt-chain.jsonl") if l.strip()]
bad=[i for i,l in enumerate(ls) if hashlib.sha256(json.dumps({k:v for k,v in l.items() if k!="state_digest"}, sort_keys=True).encode()).hexdigest()!=l.get("state_digest")]
print(f"{len(ls)} links, {len(ls)-len(bad)} digests reproduce; not reproducing: {bad}")
EOF
```

The rule is `state_digest = sha256(json.dumps(link without state_digest, sort_keys=True))` with Python's default
separators. It reproduces 34 of the 35 links. The first link (GENESIS, seq 0) does not reproduce under this rule
or any other we tried, so it cannot be checked from the published bytes (C-2026-0929-05).

## What this does and does not prove

The link check shows that no entry was removed or reordered after the next one was written. The digest
check above shows that links 1 to 34 were not edited after their digest was taken; link 0 is not checkable. It does **not** prove any statement inside an entry is true — each entry points
at its own evidence, and that is where a reader should go next.

The accompanying `.ots` is an OpenTimestamps receipt **submitted to the calendars and pending
confirmation**. It is not a Bitcoin attestation and must not be described as anchored until
the proof is upgraded and verified.

This chain began on 2026-09-22. It is short, and saying so is the point.
