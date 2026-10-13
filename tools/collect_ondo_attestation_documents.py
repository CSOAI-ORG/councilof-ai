#!/usr/bin/env python3
"""GAP-01 third pass: pin USDY attestation document inventory.

Downloads (or reads local copies of) the two Dropbox folder zip exports
(?dl=1, read-only public bytes), then:
  - sha256 of each zip as served
  - full per-file inventory (name, bytes, sha256) — the complete denominator
  - pins a bounded sample of documents (latest + earliest of each series) into
    the content-addressed raw store
  - extracts key fields from the latest daily and monthly PDFs via
    `pdftotext -layout` (must be on PATH)
  - computes business-day continuity of the daily ATCAttest series

Read-only: no wallet, transaction, signing, or publishing. The zip exports are
time-variant (new reports are added over time, and Dropbox zip metadata
differs per build); the per-file sha256 inventory is the stable artifact.

Usage:
  python3 tools/collect_ondo_attestation_documents.py                 # download fresh
  python3 tools/collect_ondo_attestation_documents.py \
      --daily-zip /tmp/ondo-usdy-daily.zip --monthly-zip /tmp/ondo-usdy-monthly.zip
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import urllib.request
import zipfile
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

REGISTER = Path('measurement/registers/2026-09-20')
OUT = REGISTER / 'ondo-attestation-inventory.json'
RAW_DIR = REGISTER / 'ondo-evidence-raw'
UA = 'CSOAI-ondo-evidence-intake/0.3 (+https://councilof.ai)'

DAILY_URL = ('https://www.dropbox.com/scl/fo/375wdvar3rbc7o23nxsgp/AOFY8jhpENaNx9WAw-WPnbY'
             '?rlkey=4icqn1z9bez725wywr30fx52a&st=bsxeh8j5&dl=1')
MONTHLY_URL = ('https://www.dropbox.com/scl/fo/fk5t99zyihshuak3u1u9v/AMYiYSUwvoL6osa2FX_G_M8'
               '?rlkey=0ttmb4ifhdg4ebvhbh8aa3juc&st=fyoof4cu&dl=1')
DAILY_RE = re.compile(r'Ondo USDY LLC_ATCAttest_(\d{6})\.pdf$')
MONTHLY_RE = re.compile(r'Ondo USDY LLC[_ ]_?ATC ?Attest\.pdf$|Ondo USDY LLC_MonthlyRpt_(\d{6})\.pdf$')
MONTH_KEY = re.compile(r'(?:MonthlyRpt_|^)(\d{6})')


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=280) as r:  # nosec B310 fixed HTTPS source
        dest.write_bytes(r.read())


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def inventory_zip(zip_path: Path) -> list[dict]:
    rows = []
    with zipfile.ZipFile(zip_path) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            data = z.read(info.filename)
            rows.append({'zip_member': info.filename, 'bytes': len(data), 'sha256': sha256(data)})
    rows.sort(key=lambda r: r['zip_member'])
    return rows


def pin_sample(zip_path: Path, member: str) -> str:
    with zipfile.ZipFile(zip_path) as z:
        data = z.read(member)
    digest = sha256(data)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_DIR / f'{digest}.bin').write_bytes(data)
    return str(RAW_DIR / f'{digest}.bin')


def pdftotext(pdf_path: str) -> str:
    return subprocess.run(['pdftotext', '-layout', pdf_path, '-'],
                          capture_output=True, text=True, check=True).stdout


def grab(text: str, pattern: str) -> str | None:
    m = re.search(pattern, text)
    return m.group(1).strip() if m else None


def business_day_gaps(dates: list[date]) -> list[str]:
    if not dates:
        return []
    have = set(dates)
    gaps = []
    d = min(have)
    end = max(have)
    while d <= end:
        if d.weekday() < 5 and d not in have:
            gaps.append(d.isoformat())
        d += timedelta(days=1)
    return gaps


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--daily-zip', type=Path)
    ap.add_argument('--monthly-zip', type=Path)
    args = ap.parse_args()

    daily_zip = args.daily_zip or Path('/tmp/ondo-usdy-daily.zip')
    monthly_zip = args.monthly_zip or Path('/tmp/ondo-usdy-monthly.zip')
    if not args.daily_zip:
        download(DAILY_URL, daily_zip)
    if not args.monthly_zip:
        download(MONTHLY_URL, monthly_zip)

    fetched_at = datetime.now(UTC).isoformat()
    daily_rows = inventory_zip(daily_zip)
    monthly_rows = inventory_zip(monthly_zip)

    daily_dates = []
    for r in daily_rows:
        m = DAILY_RE.search(r['zip_member'])
        if m:
            s = m.group(1)
            daily_dates.append(date(2000 + int(s[:2]), int(s[2:4]), int(s[4:6])))
            r['report_date'] = f'20{s[:2]}-{s[2:4]}-{s[4:6]}'
    monthly_keys = []
    for r in monthly_rows:
        base = r['zip_member'].split('/')[-1]
        m = MONTH_KEY.search(base)
        if m:
            monthly_keys.append(m.group(1))
            r['report_month'] = m.group(1)

    # pin bounded samples: earliest + latest of each series
    def by_date(rows, key):
        dated = [r for r in rows if key in r]
        return (min(dated, key=lambda r: r[key]), max(dated, key=lambda r: r[key])) if dated else (None, None)

    samples = {}
    for label, rows, key, zpath in (('daily', daily_rows, 'report_date', daily_zip),
                                    ('monthly', monthly_rows, 'report_month', monthly_zip)):
        first, last = by_date(rows, key)
        for tag, row in (('earliest', first), ('latest', last)):
            if row:
                row['pinned_raw_path'] = pin_sample(zpath, row['zip_member'])
                samples[f'{label}_{tag}'] = row

    # extract key fields from latest pinned reports
    fields: dict = {}
    for label in ('daily_latest', 'monthly_latest'):
        row = samples.get(label)
        if not row:
            continue
        text = pdftotext(row['pinned_raw_path'])
        fields[label] = {
            'zip_member': row['zip_member'],
            'report_date_or_period': grab(text, r'Date \(end of day\)\s+(\S+)')
                                   or (f"{grab(text, r'Beginning Date\s+(\S+)')} – {grab(text, r'End Date\s+(\S+)')}"),
            'prepared_by': grab(text, r'(Daily|Monthly) Report Prepared by (\S.*)') and
                           f"{grab(text, r'(Daily|Monthly)')} Report Prepared by {grab(text, r'Prepared by (\S.*)')}",
            'token_principal_outstanding': grab(text, r'Token Principal Outstanding\s+([\d,\.]+)'),
            'permitted_assets_market_value': grab(text, r'Permitted Assets \(at market value\)\s+([\d,\.]+)'),
            'ratio_permitted_assets_to_tpo': grab(text, r'Permitted Assets/Token Principal Outstanding\s+([\d\.]+)'),
            'verification_agent': grab(text, r'(Ankura Trust Company, LLC), in its capacity as Verification Agent'),
            'scope_footnote': bool(re.search(r'does not account for USDY issued by Ondo Global Markets', text)),
        }

    gaps = business_day_gaps(daily_dates)
    doc = {
        'schema': 'csoai.ondo-attestation-inventory/0.1',
        'as_of': '2026-09-20',
        'subject_id': 'issuer:ondo',
        'gap_ref': 'GAP-01',
        'source': {
            'daily_folder_zip': {'locator': DAILY_URL, 'bytes': daily_zip.stat().st_size,
                                 'sha256': sha256(daily_zip.read_bytes())},
            'monthly_folder_zip': {'locator': MONTHLY_URL, 'bytes': monthly_zip.stat().st_size,
                                   'sha256': sha256(monthly_zip.read_bytes())},
            'fetched_at': fetched_at,
            'time_variant_note': 'Zip bytes change as reports are added and per Dropbox zip-build metadata; the per-file inventory below is the stable artifact. Re-run reproduces the inventory, not the zip hash.',
        },
        'retention_policy': 'Full inventory hashes retained for every member; document bytes pinned only for earliest+latest of each series (bounded local register). Any member can be re-pinned on demand by re-downloading the zip.',
        'series': {
            'daily': {
                'file_count': len(daily_rows),
                'dated_reports': len(daily_dates),
                'first_report_date': min(daily_dates).isoformat() if daily_dates else None,
                'last_report_date': max(daily_dates).isoformat() if daily_dates else None,
                'business_day_gaps_in_range': gaps,
                'business_day_gap_count': len(gaps),
            },
            'monthly': {
                'file_count': len(monthly_rows),
                'dated_reports': len(monthly_keys),
                'first_report_month': min(monthly_keys) if monthly_keys else None,
                'last_report_month': max(monthly_keys) if monthly_keys else None,
            },
        },
        'extracted_fields_latest': fields,
        'files': {'daily': daily_rows, 'monthly': monthly_rows},
    }
    OUT.write_text(json.dumps(doc, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps({'daily_files': len(daily_rows), 'monthly_files': len(monthly_rows),
                      'daily_span': [doc['series']['daily']['first_report_date'],
                                     doc['series']['daily']['last_report_date']],
                      'business_day_gaps': len(gaps),
                      'samples_pinned': sorted(samples)}, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
