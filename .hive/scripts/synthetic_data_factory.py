#!/usr/bin/env python3
"""synthetic_data_factory.py — generate synthetic training corpora for CSOAI agents.

Wave 2 play: produce labelled, privacy-safe datasets for RAG/fine-tuning:
- construction plant-hire request -> quote JSON
- aquaculture koi symptoms -> diagnosis + care plan
- logistics waste booking -> duty-of-care document
"""
from __future__ import annotations

import argparse
import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from faker import Faker

ROOT = Path("/Users/nicholas/clawd")
OUT_DIR = ROOT / ".hive" / "data" / "synthetic"
REPORT = ROOT / ".hive" / "logs" / "synthetic_factory.json"

fake = Faker("en_GB")
Faker.seed(42)

PLANTS = ["mini digger", "3-ton excavator", "6-ton excavator", "8-ton excavator", "dump truck", "roller", "telehandler", "mixer"]
REGIONS = ["London", "Birmingham", "Manchester", "Bristol", "Leeds", "Glasgow", "Cardiff", "Liverpool"]
WASTE_TYPES = ["muckaway", "hardcore", "topsoil", "green waste", "mixed C&D", "asbestos", "tarmac"]
KOI_VARIETIES = ["Kohaku", "Showa", "Sanke", "Utsurimono", "Bekko", "Asagi", "Shusui", "Ogon"]
SYMPTOMS = ["flashing", "lethargy", "loss of appetite", "white spots", "fin clamping", "gasping", "sores", "bulging eyes"]
DIAGNOSES = ["ich", "bacterial infection", "parasites", "poor water quality", "fluke", "ulcer", "ammonia burn"]


def plant_hire_record() -> dict[str, Any]:
    plant = random.choice(PLANTS)
    region = random.choice(REGIONS)
    days = random.randint(1, 14)
    daily = random.randint(120, 450)
    return {
        "domain": "grabhire.ai",
        "type": "plant_hire_request",
        "customer": fake.company(),
        "plant": plant,
        "region": region,
        "days": days,
        "delivery_date": fake.date_between(start_date="today", end_date="+30d").isoformat(),
        "notes": f"Need {plant} for {fake.bs()}. Site access 8am.",
        "label": {
            "estimated_daily_rate_gbp": daily,
            "estimated_total_gbp": daily * days,
            "operator_required": random.random() > 0.5,
            "compliance_tags": ["CIS", "HGV"] if "truck" in plant or "mixer" in plant else [],
        },
    }


def koi_health_record() -> dict[str, Any]:
    symptom = random.choice(SYMPTOMS)
    diagnosis = random.choice(DIAGNOSES)
    return {
        "domain": "fishkeeper.ai",
        "type": "koi_health_check",
        "owner": fake.name(),
        "variety": random.choice(KOI_VARIETIES),
        "length_cm": random.randint(15, 75),
        "symptoms": [symptom] + random.sample(SYMPTOMS, k=random.randint(0, 2)),
        "water_temp_c": round(random.uniform(8, 24), 1),
        "ph": round(random.uniform(6.8, 8.5), 2),
        "ammonia_mg_l": round(random.uniform(0.0, 1.0), 3),
        "label": {
            "diagnosis": diagnosis,
            "severity": random.choice(["low", "medium", "high"]),
            "treatment": f"Isolate affected fish, test water, treat for {diagnosis}.",
            "vet_recommended": diagnosis in ["bacterial infection", "ulcer", "ammonia burn"],
        },
    }


def waste_booking_record() -> dict[str, Any]:
    waste = random.choice(WASTE_TYPES)
    tonnes = random.randint(3, 30)
    price_per_tonne = random.randint(18, 80)
    return {
        "domain": "muckaway.ai",
        "type": "waste_booking",
        "producer": fake.company(),
        "waste_type": waste,
        "tonnes": tonnes,
        "collection_region": random.choice(REGIONS),
        "collection_date": fake.date_between(start_date="today", end_date="+14d").isoformat(),
        "notes": f"{tonnes}t of {waste}; site code {fake.postcode()}",
        "label": {
            "estimated_price_gbp": price_per_tonne * tonnes,
            "ewc_code": random.choice(["17 01 01", "17 01 07", "17 05 04", "20 02 01"]),
            "duty_of_care_required": True,
            "hazardous": waste in ["asbestos", "tarmac"],
        },
    }


GENERATORS = {
    "plant_hire": plant_hire_record,
    "koi_health": koi_health_record,
    "waste_booking": waste_booking_record,
}


def generate(count: int, kinds: list[str] | None = None) -> list[dict[str, Any]]:
    kinds = kinds or list(GENERATORS.keys())
    records = []
    for i in range(count):
        kind = random.choice(kinds)
        rec = GENERATORS[kind]()
        rec["id"] = f"synth_{kind}_{i:08d}"
        rec["created_at"] = datetime.now(timezone.utc).isoformat()
        records.append(rec)
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=1000)
    parser.add_argument("--kind", action="append", choices=list(GENERATORS.keys()))
    args = parser.parse_args()

    records = generate(args.count, args.kind)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"synthetic_corpus_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.jsonl"
    with out_path.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    by_type: dict[str, int] = {}
    for r in records:
        by_type[r["type"]] = by_type.get(r["type"], 0) + 1

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "count": len(records),
        "by_type": by_type,
        "path": str(out_path.relative_to(ROOT)),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Generated {len(records)} synthetic records → {out_path}")
    print(f"By type: {by_type}")


if __name__ == "__main__":
    main()
