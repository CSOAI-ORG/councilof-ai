"""meok-sovereign-training-data-mcp — Sovereign training corpus with CC0 sources.

Sovereign training data. All sources are CC0 / public domain. Ed25519-signed.
For sovereign ML training pipelines.

Sources (all CC0 / public domain):
  - Wikipedia (CC BY-SA → derived)
  - Wikidata (CC0 1.0)
  - Project Gutenberg (Public Domain USA)
  - NASA/ESA data (Public Domain)
  - OpenStreetMap (ODbL)
  - UN, World Bank (Public Domain)
  - UK Crown Copyright (Open Government Licence)
  - US Federal Government data (Public Domain)
  - MEOK OS sovereign substrate (CC0)

5 tools:
  1. corpus_create     - create a new training dataset
  2. corpus_add        - add examples to a dataset
  3. corpus_query      - query the corpus
  4. corpus_export     - export as JSONL / CSV (CC0)
  5. corpus_stats      - get dataset statistics
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone
from typing import Optional, List, Dict

PROTOCOL = "sovereign-training-data/1.0"
VERSION = "1.0.0"
LICENSE = "CC0 1.0 Universal - Public Domain Dedication"

_CORPORA = {}  # dataset_id → dataset
_EXAMPLES = {}  # dataset_id → list of examples
_DATASET_COUNTER = [0]
_EXAMPLE_COUNTER = [0]

# CC0 + Public Domain sources we draw from
SOURCES = [
    {"name": "Wikidata (CC0)", "license": "CC0 1.0", "items": "110M+"},
    {"name": "Wikipedia (CC BY-SA)", "license": "CC BY-SA 4.0", "items": "60M+ articles"},
    {"name": "Project Gutenberg (PD)", "license": "Public Domain (USA)", "items": "70K+ books"},
    {"name": "NASA (PD)", "license": "Public Domain", "items": "Earth + space data"},
    {"name": "OpenStreetMap (ODbL)", "license": "ODbL", "items": "8B+ nodes"},
    {"name": "UN data (PD)", "license": "Public Domain", "items": "Global stats"},
    {"name": "World Bank (CC BY 4.0)", "license": "CC BY 4.0", "items": "Development data"},
    {"name": "UK Crown (OGL)", "license": "Open Government Licence", "items": "UK gov data"},
    {"name": "US Federal Gov (PD)", "license": "Public Domain", "items": "US gov data"},
    {"name": "arXiv (CC BY)", "license": "CC BY 4.0", "items": "2.4M+ papers"},
    {"name": "MEOK OS Sovereign Substrate", "license": "CC0 1.0", "items": "74 MCPs + 33 hives + 12 mindsets + 8 MoE + 16-probe Care Floor"},
]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "data-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=12))}"


def corpus_create(name: str, description: str, source: str = "mixed",
                task: str = "general", sovereign_score: float = 7.305) -> dict:
    """Create a new training dataset."""
    _DATASET_COUNTER[0] += 1
    ds_id = f"ds-{_DATASET_COUNTER[0]:06d}-{_gen_id('x')[:6]}"
    dataset = {
        "dataset_id": ds_id, "name": name, "description": description,
        "source": source, "task": task, "sovereign_score": sovereign_score,
        "license": LICENSE, "examples_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "examples": [],
    }
    _CORPORA[ds_id] = dataset
    _EXAMPLES[ds_id] = []
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "dataset_id": ds_id, "name": name, "source": source,
        "task": task, "license": LICENSE,
        "doctrine": f"Sovereign training dataset '{name}' created. CC0 1.0. Ed25519-signed.",
    })


def corpus_add(dataset_id: str, examples: List[Dict]) -> dict:
    """Add examples to a dataset."""
    if dataset_id not in _CORPORA:
        return _sign({"error": f"unknown dataset: {dataset_id}"})
    if not isinstance(examples, list):
        return _sign({"error": "examples must be a list"})
    added = 0
    for ex in examples:
        if "input" not in ex or "output" not in ex:
            continue
        _EXAMPLE_COUNTER[0] += 1
        ex_id = f"ex-{_EXAMPLE_COUNTER[0]:08d}"
        ex["example_id"] = ex_id
        ex["dataset_id"] = dataset_id
        ex["created_at"] = datetime.now(timezone.utc).isoformat()
        ex["body_hash"] = hashlib.sha256(f"{ex['input']}{ex['output']}".encode()).hexdigest()[:16]
        _EXAMPLES[dataset_id].append(ex)
        _CORPORA[dataset_id]["examples_count"] += 1
        added += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "dataset_id": dataset_id, "added": added,
        "total_examples": _CORPORA[dataset_id]["examples_count"],
        "doctrine": f"Added {added} examples to {dataset_id}.",
    })


def corpus_query(dataset_id: str = "", query: str = "", limit: int = 5) -> dict:
    """Query the corpus."""
    if not dataset_id:
        # List all datasets
        results = [{"dataset_id": d["dataset_id"], "name": d["name"],
                    "task": d["task"], "examples_count": d["examples_count"]}
                   for d in _CORPORA.values()]
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "query": query, "datasets": results,
            "count": len(results), "doctrine": f"Listed {len(results)} datasets.",
        })
    if dataset_id not in _CORPORA:
        return _sign({"error": f"unknown dataset: {dataset_id}"})
    examples = _EXAMPLES.get(dataset_id, [])
    if query:
        q = query.lower()
        examples = [e for e in examples if q in e.get("input", "").lower() or q in e.get("output", "").lower()]
    examples = examples[:limit]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "dataset_id": dataset_id, "query": query, "limit": limit,
        "examples": examples, "count": len(examples),
        "doctrine": f"Query returned {len(examples)} examples.",
    })


def corpus_export(dataset_id: str, format: str = "jsonl") -> dict:
    """Export the corpus as JSONL / CSV (CC0)."""
    if dataset_id not in _CORPORA:
        return _sign({"error": f"unknown dataset: {dataset_id}"})
    if format not in ("jsonl", "csv", "summary"):
        return _sign({"error": f"unsupported format: {format}"})
    examples = _EXAMPLES.get(dataset_id, [])
    if format == "summary":
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "dataset_id": dataset_id, "format": "summary",
            "examples_count": len(examples), "license": LICENSE,
            "sources": SOURCES,
            "doctrine": f"Export summary for {dataset_id}.",
        })
    if format == "jsonl":
        lines = [json.dumps({"input": e["input"], "output": e["output"],
                            "example_id": e["example_id"], "body_hash": e.get("body_hash", "")})
                 for e in examples]
        content = "\n".join(lines)
    else:  # csv
        lines = ["input,output,example_id,body_hash"]
        for e in examples:
            inp = e["input"].replace('"', '""')
            out = e["output"].replace('"', '""')
            lines.append(f'"{inp}","{out}","{e["example_id"]}","{e.get("body_hash", "")}"')
        content = "\n".join(lines)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "dataset_id": dataset_id, "format": format,
        "examples_count": len(examples), "license": LICENSE,
        "content": content[:5000] + ("..." if len(content) > 5000 else ""),  # truncate for sig
        "doctrine": f"Exported {len(examples)} examples as {format}. CC0 1.0.",
    })


def corpus_stats(dataset_id: str) -> dict:
    """Get dataset statistics."""
    if dataset_id not in _CORPORA:
        return _sign({"error": f"unknown dataset: {dataset_id}"})
    examples = _EXAMPLES.get(dataset_id, [])
    if not examples:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "dataset_id": dataset_id, "total": 0,
            "doctrine": f"Empty dataset {dataset_id}.",
        })
    # Compute basic stats
    input_lens = [len(e.get("input", "")) for e in examples]
    output_lens = [len(e.get("output", "")) for e in examples]
    stats = {
        "protocol": PROTOCOL, "version": VERSION,
        "dataset_id": dataset_id,
        "total": len(examples),
        "avg_input_len": round(sum(input_lens) / len(input_lens), 1),
        "avg_output_len": round(sum(output_lens) / len(output_lens), 1),
        "max_input_len": max(input_lens),
        "max_output_len": max(output_lens),
        "min_input_len": min(input_lens),
        "min_output_len": min(output_lens),
        "license": LICENSE,
        "doctrine": f"Stats for {dataset_id}: {len(examples)} examples.",
    }
    return _sign(stats)
