#!/usr/bin/env python3
"""Render public Kaggle descriptions from a complete, typed metadata audit.

Remove only named shared announcements; keep the dataset-specific description,
mirror revision, citations and file contents. Metadata publication is separate.
"""
import argparse
import json
import re
from pathlib import Path

from product_cards import clean_body, first_artifact

HEADING = '## Download and use this snapshot'
SHARED = {
    'The live board is the authority',
    'Capability + living GET (TUI7 distribution 2026-09-14)',
    'Council of AI — GSPC + Hub printer',
    'Signed archive by axis (measurement, never certification)',
    'Signed measurement archive (free cite · never a grade)',
    'Smithery / MCP Connect (measured 2026-10-05 — not a certification)',
    'OpenAPI / CDP discovery (apex · Wave E)',
}
TRUNCATED_ARCHIVE_REFS = {
    'nicktempleman/csoai-gspc-custody-disclosure',
    'nicktempleman/csoai-gspc-distribution-integrity',
    'nicktempleman/csoai-gspc-humanoid-labour-index',
    'nicktempleman/csoai-gspc-human-labour-index',
}
EDITORIAL = {
    'nicktempleman/csoai-mcp-contract-parity': '''## MCP contract parity — dated evidence package

This snapshot records whether public discovery surfaces and a service's observed MCP contract agreed at the time of the probe. Its scope is contract consistency, not general agent capability or safety.

The mirrored record is version 0.1.2, dated 26 September 2026. Earlier records and the correction evidence remain in the files. The source reports a PARTIAL read state. Read the method, limitations and corrections in `README.md` before using a per-endpoint finding; a historical mismatch must not be presented as an unresolved current defect.

The previous Kaggle description was cut off during its corrections section. The complete source documentation, including historical records and verification instructions, is available in the downloaded `README.md` and the pinned source below.
''',
    'nicktempleman/csoai-gspc-board': '''## GSPC board — historical export

This is the older board export mirrored on 15 October 2026. Use its own data and observation dates when reproducing a historical result. It is distinct from the maintained [GSPC Living Board dataset](https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board).

Inspect `board.csv`, the axis register and the accompanying README to understand the exported fields and limitations. Use the current board API for a current claim; do not mix a historical row with a newer board total. The complete dated methodology and evidence examples remain in the downloaded `README.md` and the pinned source below.
''',
    'nicktempleman/csoai-measurement-capsules': '''## Signed measurement capsules — v0.2 snapshot

This package mirrors the 26 September 2026 capsule index and its supporting records. A capsule describes one instrument's observation about one subject at one time, including its declared value, observed value, limitations and state. Batch records bind capsule identifiers through a Merkle root; the daily index binds the batches.

**Publication erratum:** the files' `private_until: "owner approves publication"` field was superseded by `v0.2/publication/2026-09-26-erratum.json` after publication was approved. That erratum does not change capsule content or signatures.

Start with `data/capsules.parquet` for observations and `data/batches.parquet` for batch context. Read the original signed records, timestamp status and verification instructions in the downloaded `README.md`. A signature establishes integrity of the signed statement; it is not certification or proof that an external subject is safe. The previous page was truncated; the complete source remains at the pinned revision below.
''',
}


def remove_shared_sections(text):
    # Some Kaggle descriptions lost HTML boundaries during an earlier mirror.
    # Recognise only exact shared titles, outside fenced code. Preserve all other
    # sections, including unique content following a shared section.
    output, skipping, fence = [], None, False
    for line in text.splitlines(keepends=True):
        if line.lstrip().startswith(('```', '~~~')):
            fence = not fence
        match = None if fence else re.match(r'^(#{1,6}) (.*?)\s*$', line)
        if match:
            level, title = len(match[1]), match[2]
            if skipping is not None and level <= skipping:
                skipping = None
            if title in SHARED:
                skipping = level if skipping is None else min(level, skipping)
        if skipping is None:
            output.append(line)
    return ''.join(output).strip()


def render(row):
    metadata = row['metadata']
    if metadata.get('isPrivate') is not False or not row.get('files_complete'):
        raise ValueError('verified public visibility and a complete file inventory are required')
    current = metadata['description']
    if HEADING in current or row['ref'] == 'nicktempleman/csoai-gspc-living-board':
        return current
    archive_start = '<!-- csoai-archive-by-axis:start 2026-10-06 -->'
    archive_end = '<!-- csoai-archive-by-axis:end 2026-10-06 -->'
    if row['ref'] in TRUNCATED_ARCHIVE_REFS and len(current) == 19000 and current.count(archive_start) == 1 and archive_end not in current:
        # These four audited mirrors were cut at exactly 19,000 characters,
        # inside the same obsolete shared archive table. Keep the unique prefix.
        current = current.split(archive_start,1)[0]
    if row['ref'] in EDITORIAL:
        mirror = re.search(r'^> \*\*Mirror\.\*\*.*$', current, re.M)
        source = re.search(r'https://huggingface.co/datasets/([\w.-]+/[\w.-]+) at revision `([0-9a-f]{40})`', current)
        if not mirror or not source:
            raise ValueError('reviewed historical mirror provenance is missing')
        body = mirror[0] + '\n\n' + EDITORIAL[row['ref']] + f'\n[Complete source README at the mirrored revision](https://huggingface.co/datasets/{source[1]}/blob/{source[2]}/README.md).\n'
    else:
        cleaned, _ = clean_body(current)
        body = remove_shared_sections(cleaned)
    names = [f['name'] for f in row['files']]
    artifact = first_artifact(names)
    guide = [HEADING, '', f"This page describes the published files in `{row['ref']}`. Treat them as a dated snapshot: use the observation dates and limitations in the files and source notes below. A page edit does not refresh the measurements.", '']
    if names:
        guide += ['With the Kaggle CLI installed and authenticated:', '', '```bash', f"kaggle datasets download -d {row['ref']} -p ./dataset --unzip", '```', '']
        if artifact:
            guide += [f"Start by inspecting `{artifact}`. Keep its original bytes and record the Kaggle version before transforming or comparing results.", '']
        guide += ['Published files include:', '']
        for name in sorted(names, key=lambda n:(n.count('/'),len(n),n))[:8]:
            guide.append(f'- `{name}`')
        if len(names) > 8:
            guide.append(f'- See the Data tab for all {len(names)} files.')
        guide += ['']
    else:
        guide += ['The catalogue audit returned no downloadable files. This entry is not yet a usable data package; use the linked source material and do not infer measurements from its title.', '']
    guide += ['[Current GSPC board](https://councilof.ai/api/gspc) · [Methodology](https://councilof.ai/methodology/) · [Verify supported signed records](https://councilof.ai/gspc-verify/) · [Corrections](https://councilof.ai/claim-maintenance)', '',
        'Apply the licence shown on this dataset. Published by Council of AI — Council for the Safety of Artificial Intelligence, operated by CSOAI Ltd. Measurement is not certification; a mirror or package is not evidence of current board admission or benchmark leadership.', '']
    if not body:
        body = f"## About the package\n\n{metadata['title']}\n\nThe publisher has not supplied a detailed methodological description for this entry. Inspect the data and its embedded provenance before reuse.\n"
    result = '\n'.join(guide) + '\n---\n\n' + body.rstrip() + '\n'
    # Kaggle removes HTML comments during metadata updates. Render the same
    # visible text before review so exact readback remains meaningful.
    result = re.sub(r'<!--.*?-->', '', result, flags=re.S)
    # An older 19,000-character export also cut one announcement marker itself.
    # Remove that trailing marker fragment only; never discard following prose.
    result = re.sub(r'<!-- csoai-[^\n]*\n?\Z', '', result)
    # The metadata endpoint treats angle-bracket autolinks as HTML and can
    # discard the remaining document. Use ordinary Markdown links instead.
    result = re.sub(r'<(https?://[^\s<>]+)>', lambda m: f'[{m[1]}]({m[1]})', result)
    # Reviewed documentation placeholders also resemble HTML to that endpoint.
    for placeholder in ('wrapped-symbol:chain', 'date', 'model:id', 'id', 'caip19', 'file', 'model-id'):
        result = result.replace('<' + placeholder + '>', placeholder.upper().replace('-', '_').replace(':', '_'))
    if len(result) > 20000:
        raise ValueError('description exceeds 20,000 characters; requires a specific editorial pass')
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--audit', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    a = ap.parse_args(); a.out.mkdir(parents=True, exist_ok=True)
    entries = []
    for row in json.loads(a.audit.read_text()):
        if row.get('error') or row['metadata'].get('isPrivate') is not False:
            continue
        try:
            description = render(row)
        except ValueError as exc:
            entries.append(dict(ref=row['ref'],status='REVIEW_REQUIRED',reason=str(exc)));continue
        if description == row['metadata']['description']:
            entries.append(dict(ref=row['ref'],status='UNCHANGED'));continue
        proposed = dict(row['metadata'], description=description)
        folder = a.out / row['ref'].split('/')[1]; folder.mkdir(exist_ok=True)
        (folder/'dataset-metadata.json').write_text(json.dumps(proposed,indent=2)+'\n')
        (folder/'before.json').write_text(json.dumps(row,indent=2)+'\n')
        (folder/'description.md').write_text(description)
        entries.append(dict(ref=row['ref'],status='PREVIEW',folder=folder.name,
                            before_bytes=len(row['metadata']['description'].encode()),after_bytes=len(description.encode())))
    (a.out/'manifest.json').write_text(json.dumps(entries,indent=2)+'\n')
    print(json.dumps({'public':len(entries),'changed':sum(e['status']=='PREVIEW' for e in entries),
                      'review_required':[e for e in entries if e['status']=='REVIEW_REQUIRED']}))


if __name__ == '__main__':
    main()
