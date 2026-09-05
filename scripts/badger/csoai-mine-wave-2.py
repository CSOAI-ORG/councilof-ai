#!/usr/bin/env python3
"""csoai-mine-wave-2.py — Phase 1 part 2: more sources, fixed parsers."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "badger" / "_queue" / "1000-moves"
OUT.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def get(url: str, timeout: int = 30) -> str | None:
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "CSOAI-Miner/1.0 (councilof.ai)",
            "Accept": "application/json, text/plain, */*",
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception:
        return None


def main() -> None:
    sources = [
        # 1. arXiv (fixed — regex extract)
        {
            "name": "arxiv-ai",
            "url": "http://export.arxiv.org/api/query?search_query=cat:cs.AI&max_results=20",
            "parser": "arxiv",
        },
        # 2. HuggingFace models (fixed — accept JSON)
        {
            "name": "huggingface-models",
            "url": "https://huggingface.co/api/models?limit=20&sort=modified",
            "parser": "json",
        },
        # 3. HuggingFace datasets
        {
            "name": "huggingface-datasets",
            "url": "https://huggingface.co/api/datasets?limit=20&sort=modified",
            "parser": "json",
        },
        # 4. GitHub topics (AI)
        {
            "name": "github-topics-ai",
            "url": "https://api.github.com/search/repositories?q=topic:artificial-intelligence&sort=updated&per_page=20",
            "parser": "json",
        },
        # 5. Crossref
        {
            "name": "crossref-ai",
            "url": "https://api.crossref.org/works?query=AI+governance&rows=20&sort=published&order=desc",
            "parser": "crossref",
        },
        # 6. Semantic Scholar
        {
            "name": "semantic-scholar",
            "url": "https://api.semanticscholar.org/graph/v1/paper/search?query=AI+regulation&limit=20&fields=title,year,authors,citationCount",
            "parser": "json",
        },
        # 7. Companies House search
        {
            "name": "companies-house",
            "url": "https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?companyNameIncludes=AI&companyNameExcludes=&companyStatus=active&page=1",
            "parser": "companies-house",
        },
        # 8. ICO data protection register (search)
        {
            "name": "ico-register",
            "url": "https://ico.org.uk/register-of-data-controllers/search-results/?q=AI&limit=20",
            "parser": "html-links",
        },
        # 9. HMRC trade tariff
        {
            "name": "uk-trade-tariff",
            "url": "https://www.trade-tariff.service.gov.uk/api/xi/sections",
            "parser": "json",
        },
        # 10. Met Office
        {
            "name": "met-office",
            "url": "https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/HadUK-Grid/HadUK-Grid_rainfall_days_annual_1991-2020.nc",
            "parser": "binary-skip",
        },
    ]

    atoms = []
    for src in sources:
        print(f"  mining {src['name']:<30} ", end="", flush=True)
        body = get(src["url"])
        if body is None:
            print(f"-> 0 atoms (network error)")
            continue

        kind = src["parser"]
        try:
            if kind == "arxiv":
                items = re.findall(r"<entry>(.*?)</entry>", body, re.DOTALL)
                atoms.extend([{"source": src["name"], "raw_xml": item[:1500]} for item in items[:20]])
                print(f"-> {min(20, len(items))} atoms")
            elif kind == "json":
                items = json.loads(body)
                if isinstance(items, list):
                    atoms.extend([{"source": src["name"], "raw": item} for item in items[:20]])
                    print(f"-> {min(20, len(items))} atoms")
                elif isinstance(items, dict):
                    items_list = items.get("results", items.get("items", items.get("data", [])))
                    atoms.extend([{"source": src["name"], "raw": item} for item in items_list[:20]])
                    print(f"-> {min(20, len(items_list))} atoms")
                else:
                    print(f"-> 0 atoms")
            elif kind == "crossref":
                items = json.loads(body).get("message", {}).get("items", [])
                atoms.extend([{"source": src["name"], "raw": item} for item in items[:20]])
                print(f"-> {min(20, len(items))} atoms")
            elif kind == "companies-house":
                items = re.findall(r"companyName[^>]*>([^<]+)", body)
                atoms.extend([{"source": src["name"], "raw_name": item.strip()} for item in items[:20]])
                print(f"-> {min(20, len(items))} atoms")
            elif kind == "html-links":
                items = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>', body)
                atoms.extend([{"source": src["name"], "raw": {"href": h, "text": t}} for h, t in items[:20]])
                print(f"-> {min(20, len(items))} atoms")
            elif kind == "binary-skip":
                print(f"-> 0 atoms (binary)")
            else:
                print(f"-> 0 atoms (unknown parser)")
        except Exception as e:
            print(f"-> 0 atoms (parse error: {e})")

    # Sign + record
    atoms_path = OUT / f"atoms-wave2-{now()}.jsonl"
    with atoms_path.open("w") as f:
        for atom in atoms:
            blob = json.dumps(atom, sort_keys=True, default=str).encode()
            atom["sha256"] = hashlib.sha256(blob).hexdigest()
            atom["mined_at"] = now()
            f.write(json.dumps(atom) + "\n")

    summary = {
        "ts": now(),
        "atoms_total": len(atoms),
        "atoms_per_source": {src["name"]: sum(1 for a in atoms if a.get("source") == src["name"]) for src in sources},
        "atoms_file": str(atoms_path),
    }
    (OUT / f"summary-wave2-{now()}.json").write_text(json.dumps(summary, indent=2))

    print()
    print(f"=== WAVE 2 COMPLETE ===")
    print(f"  atoms: {len(atoms)}")


if __name__ == "__main__":
    main()
