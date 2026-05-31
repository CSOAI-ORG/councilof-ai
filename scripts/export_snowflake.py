#!/usr/bin/env python3
"""
Snowflake Marketplace Export
============================
Export RegGeoInt compliance data as Snowflake-compatible datasets.

Usage:
    python export_snowflake.py --format parquet --output ./snowflake-export/
    python export_snowflake.py --format csv --output ./snowflake-export/
    python export_snowflake.py --format json --output ./snowflake-export/

Tables generated:
    - jurisdictions: All mapped jurisdictions with frameworks
    - frameworks: Framework metadata (penalties, scope, status)
    - cross_border_rules: Deployment rules between jurisdiction pairs
    - compliance_heatmap: Geospatial data for visualization
    - enterprise_tenants: Anonymized tenant distribution
    - enforcement_actions: Public enforcement data

This script is designed to run as a scheduled job (e.g., daily)
to keep Snowflake Marketplace listings current.
"""
import argparse
import csv
import json
import sys
from pathlib import Path
from datetime import datetime

# Add meok-ai to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "meok-ai"))


def export_jurisdictions(format_type: str, output_dir: Path) -> Path:
    """Export jurisdiction data."""
    from meok.api.compliance_map import REGULATORY_MAP

    records = []
    for code, data in REGULATORY_MAP.items():
        records.append({
            "jurisdiction_code": code,
            "name": data["name"],
            "region": data["region"],
            "eu_member": data.get("eu_member", False),
            "frameworks": ",".join(data["frameworks"]),
            "framework_count": len(data["frameworks"]),
            "enforcement_date": data.get("enforcement_date", ""),
            "competent_authority": data.get("competent_authority", ""),
            "notes": data.get("notes", ""),
            "exported_at": datetime.utcnow().isoformat(),
        })

    return _write(records, "jurisdictions", format_type, output_dir)


def export_frameworks(format_type: str, output_dir: Path) -> Path:
    """Export framework metadata."""
    from meok.api.compliance_map import FRAMEWORKS

    records = []
    for fw_id, data in FRAMEWORKS.items():
        records.append({
            "framework_id": fw_id,
            "name": data["name"],
            "scope": data["scope"],
            "status": data["status"],
            "penalties_max": data["penalties_max"],
            "exported_at": datetime.utcnow().isoformat(),
        })

    return _write(records, "frameworks", format_type, output_dir)


def export_cross_border_rules(format_type: str, output_dir: Path) -> Path:
    """Export cross-border deployment rules for all pairs."""
    from meok.api.compliance_map import REGULATORY_MAP

    records = []
    codes = list(REGULATORY_MAP.keys())
    for src in codes:
        for dst in codes:
            if src == dst:
                continue
            src_data = REGULATORY_MAP[src]
            dst_data = REGULATORY_MAP[dst]
            src_fw = set(src_data["frameworks"])
            dst_fw = set(dst_data["frameworks"])
            new_reqs = dst_fw - src_fw

            records.append({
                "source": src,
                "source_name": src_data["name"],
                "target": dst,
                "target_name": dst_data["name"],
                "shared_frameworks": ",".join(sorted(src_fw & dst_fw)),
                "new_requirements": ",".join(sorted(new_reqs)),
                "new_framework_count": len(new_reqs),
                "risk_change": "elevated" if dst_data.get("eu_member") and not src_data.get("eu_member") else "neutral",
                "compliance_cost_estimate_usd": len(new_reqs) * 30000,
                "exported_at": datetime.utcnow().isoformat(),
            })

    return _write(records, "cross_border_rules", format_type, output_dir)


def export_heatmap(format_type: str, output_dir: Path) -> Path:
    """Export heatmap geospatial data."""
    from meok.api.compliance_map import REGULATORY_MAP, _COORDS

    records = []
    for code, data in REGULATORY_MAP.items():
        lat, lon = _COORDS.get(code, (0.0, 0.0))
        records.append({
            "jurisdiction_code": code,
            "name": data["name"],
            "latitude": lat,
            "longitude": lon,
            "intensity": len(data["frameworks"]),
            "frameworks": ",".join(data["frameworks"]),
            "eu_member": data.get("eu_member", False),
            "exported_at": datetime.utcnow().isoformat(),
        })

    return _write(records, "compliance_heatmap", format_type, output_dir)


def _write(records: list, name: str, format_type: str, output_dir: Path) -> Path:
    """Write records to file in specified format."""
    output_dir.mkdir(parents=True, exist_ok=True)

    if format_type == "json":
        path = output_dir / f"{name}.json"
        with open(path, "w") as f:
            json.dump(records, f, indent=2, default=str)
        return path

    elif format_type == "csv":
        path = output_dir / f"{name}.csv"
        if not records:
            path.write_text("")
            return path
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=records[0].keys())
            writer.writeheader()
            writer.writerows(records)
        return path

    elif format_type == "parquet":
        try:
            import pandas as pd
            path = output_dir / f"{name}.parquet"
            df = pd.DataFrame(records)
            df.to_parquet(path, index=False)
            return path
        except ImportError:
            print("WARNING: pandas/pyarrow not installed. Falling back to JSON.")
            return _write(records, name, "json", output_dir)

    else:
        raise ValueError(f"Unknown format: {format_type}")


def main():
    parser = argparse.ArgumentParser(description="Export RegGeoInt data for Snowflake Marketplace")
    parser.add_argument("--format", choices=["json", "csv", "parquet"], default="parquet",
                        help="Export format (default: parquet)")
    parser.add_argument("--output", type=Path, default=Path("./snowflake-export"),
                        help="Output directory")
    parser.add_argument("--tables", nargs="+", default=["all"],
                        choices=["all", "jurisdictions", "frameworks", "cross_border_rules", "heatmap"],
                        help="Tables to export")
    args = parser.parse_args()

    print(f"🚀 RegGeoInt Snowflake Export")
    print(f"   Format: {args.format}")
    print(f"   Output: {args.output}")
    print()

    exported = []
    tables = args.tables
    if "all" in tables:
        tables = ["jurisdictions", "frameworks", "cross_border_rules", "heatmap"]

    for table in tables:
        print(f"   Exporting {table}...", end=" ")
        if table == "jurisdictions":
            path = export_jurisdictions(args.format, args.output)
        elif table == "frameworks":
            path = export_frameworks(args.format, args.output)
        elif table == "cross_border_rules":
            path = export_cross_border_rules(args.format, args.output)
        elif table == "heatmap":
            path = export_heatmap(args.format, args.output)
        else:
            print(f"SKIP (unknown)")
            continue
        print(f"✅ {path}")
        exported.append(path)

    # Generate manifest
    manifest = {
        "export_name": "RegGeoInt Compliance Dataset",
        "version": "3.0.0-phase3",
        "export_date": datetime.utcnow().isoformat(),
        "format": args.format,
        "total_tables": len(exported),
        "tables": [str(p.name) for p in exported],
        "description": "Regulatory geospatial intelligence for AI compliance — 50+ jurisdictions",
        "publisher": "CSGA Global / MEOK Protocol Nexus",
        "license": "Commercial — Snowflake Marketplace",
        "refresh_schedule": "Daily at 00:00 UTC",
    }
    manifest_path = args.output / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\n📋 Manifest: {manifest_path}")
    print(f"\n✅ Export complete. {len(exported)} tables ready for Snowflake Marketplace.")


if __name__ == "__main__":
    main()
