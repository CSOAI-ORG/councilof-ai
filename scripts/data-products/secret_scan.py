#!/usr/bin/env python3
"""Secret-scan every file of staged dataset folders (gzip members decompressed, parquet string columns
read). Prints file:pattern counts only, never the matched text. Exit 1 on any hit.

    python3 secret_scan.py DIR [DIR...]
"""
import gzip
import os
import re
import sys

PATTERNS = {
    "hf_token": rb"\bhf_[A-Za-z0-9]{30,}\b",
    "github_token": rb"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b",
    "openai_like": rb"\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}\b",
    "aws_key_id": rb"\bAKIA[0-9A-Z]{16}\b",
    "slack_token": rb"\bxox[baprs]-[A-Za-z0-9-]{10,}\b",
    "private_key_block": rb"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "jwt": rb"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
    "bearer_header": rb"(?i)authorization[\"']?\s*[:=]\s*[\"']?bearer\s+[A-Za-z0-9._~+/=-]{16,}",
    "secret_field": rb"(?i)[\"'](?:private_?key|secret(?:_key)?|mnemonic|seed_?phrase|api_?key|access_?token|password|passwd|pkcs8|d)[\"']\s*:\s*[\"'][^\"']{12,}[\"']",
    "hex_privkey_field": rb"(?i)(?:priv(?:ate)?[_ -]?key|secret)[^\n]{0,20}0x[0-9a-f]{64}\b",
    "cloudflare_token": rb"(?i)cf[_-]?(?:api[_-]?)?token[\"']?\s*[:=]\s*[\"'][A-Za-z0-9_-]{30,}",
    "runpod_key": rb"\brpa_[A-Za-z0-9]{30,}\b",
}
RX = {k: re.compile(v) for k, v in PATTERNS.items()}


def blobs(path):
    b = open(path, "rb").read()
    yield b
    if path.endswith(".gz"):
        yield gzip.decompress(b)
    if path.endswith(".parquet"):
        import pyarrow.parquet as pq
        t = pq.read_table(path)
        for col in t.column_names:
            vals = t.column(col).to_pylist()
            yield "\n".join(str(v) for v in vals).encode("utf-8")


def main():
    hits, n = [], 0
    for d in sys.argv[1:]:
        for root, _, fs in os.walk(d):
            for fn in fs:
                p = os.path.join(root, fn)
                n += 1
                for b in blobs(p):
                    for k, rx in RX.items():
                        c = len(rx.findall(b))
                        if c:
                            hits.append(f"{os.path.relpath(p, d)}: {k} x{c}")
    print(f"scanned {n} files; {len(hits)} hit(s)")
    for h in sorted(set(hits)):
        print("  " + h)
    sys.exit(1 if hits else 0)


if __name__ == "__main__":
    main()
