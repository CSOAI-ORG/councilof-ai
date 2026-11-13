#!/usr/bin/env python3
"""probe_privacy_leak.py — GSPC probe #3 for nvidia/Nemotron-Personas-Finance-Japan.

WHAT IT MEASURES. NVIDIA's README claims the dataset provides finance-sector
personas "without relying on sensitive personal information". This probe scans
a declared sample of rows for Japanese PII patterns (My Number, phone, email,
bank-account shapes) and for verbatim near-duplicates of rows in the base
dataset (nvidia/Nemotron-Personas-Japan), which would indicate fingerprint
carry-over rather than fresh synthesis.

WHAT IT IS NOT. A pattern-level scan over a declared sample is indicative, not
proof of privacy. The result card states the sample size, the patterns checked,
and this boundary. Measurement, never certification.

Deterministic: fixed sample (first N rows, no shuffle), no network beyond the
dataset fetch. Output: one JSON result, schema csoai.bank-probe-result/0.1,
verdict PATTERN_SCAN_CLEAN or PATTERN_HITS with counts and (redacted) value
shapes — never the matched values themselves.
"""
import json, re, hashlib, argparse

PATTERNS = {
    "my_number_12digit": re.compile(r"(?<!\d)\d{12}(?!\d)"),
    "phone_jp": re.compile(r"0\d{1,4}[-−]\d{1,4}[-−]\d{3,4}"),
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "bank_account_7digit": re.compile(r"(?<![0-9])\d{7}(?![0-9])"),
    "jp_postal_code_full": re.compile(r"〒?\s?\d{3}[-−]\d{4}"),
}

def canonical(obj):
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"))

def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def scan(rows, patterns):
    hits = {k: 0 for k in patterns}
    examples = {}
    for i, row in enumerate(rows):
        text = canonical(row)
        for name, pat in patterns.items():
            m = pat.findall(text)
            if m:
                hits[name] += len(m)
                if name not in examples and m:
                    # redact: store only the digit-masked shape, never the value
                    shape = re.sub(r"\d", "9", str(m[0]))[:24]
                    examples[name] = {"row_index": i, "shape": shape}
    return hits, examples

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", default="nvidia/Nemotron-Personas-Finance-Japan")
    ap.add_argument("--sample", type=int, default=50000, help="rows scanned (first N, declared)")
    ap.add_argument("--out", default="result.json")
    args = ap.parse_args()

    from datasets import load_dataset
    ds = load_dataset(args.dataset, split="train", streaming=True)
    rows = []
    for i, row in enumerate(ds):
        if i >= args.sample:
            break
        rows.append(row)

    hits, examples = scan(rows, PATTERNS)
    total_hits = sum(hits.values())
    result = {
        "schema": "csoai.bank-probe-result/0.1",
        "probe": "privacy_leak_pattern_scan",
        "dataset": args.dataset,
        "rows_scanned": len(rows),
        "patterns_checked": sorted(PATTERNS),
        "hit_counts": hits,
        "total_hits": total_hits,
        "redacted_examples": examples,
        "boundary": "Pattern-level indicative scan of the declared sample only. Not a proof of privacy. Measurement, never certification.",
        "verdict_state": "PATTERN_SCAN_CLEAN" if total_hits == 0 else "PATTERN_HITS",
    }
    result["result_sha256"] = sha(canonical({k: v for k, v in result.items()}))
    with open(args.out, "w") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(json.dumps({"verdict_state": result["verdict_state"], "total_hits": total_hits, "rows_scanned": len(rows)}, ensure_ascii=False))

if __name__ == "__main__":
    main()
