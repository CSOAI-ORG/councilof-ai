#!/usr/bin/env python3
"""Renders public/claims/claimreg-pulse-verity-<day>.md from the .json beside it. The JSON governs.

    python3 scripts/claims/pulse-verity/render_md.py public/claims/claimreg-pulse-verity-2026-10-06.json
"""
import json, pathlib, sys
SRC = pathlib.Path(sys.argv[1]).resolve()
R = json.loads(SRC.read_text())
C = {c['claim_id']: c for c in R['claims']}
ev = C['PV-1']['method']['evidence']
w = C['PV-1']['window']
_DAYS = {'2026-09-26': '26 September', '2026-09-28': '28 September', '2026-09-30': '30 September', '2026-10-01': '1 October'}
EARLIER_DAYS = [d for d in _DAYS if d < w['from'][:10]]
EARLIER = ", ".join(_DAYS[d] for d in EARLIER_DAYS)
L = []
a = L.append
a("# Claim maintained: Pulse Verity Index signatures")
a("")
a(f"**Status: {R['status']}**")
a("")
a("Maintainer: CSOAI Ltd (Council of AI), UK Companies House 16939677.  ")
a("Subject: Pulse Labs OpCo LLC, `thepulse.markets`. The signing API is at `mcp.thepulse.markets`.  ")
a("Follows: [Claim Maintenance v0.2](https://councilof.ai/spec/claim-maintenance/v0.2/).  ")
a(f"Record of reference: `{SRC.name}` (registry digest `" + R['registry_digest'] + "`). This page is a readable rendering of it; where the two disagree, the JSON governs.")
a("")
a("## In one paragraph")
a("")
a("On 23 September 2026 we told Pulse privately that its v1 signature covered four fields: symbol, quoted value text, timestamp and grade. "
  "The venue count, dispersion, interval and cadence fields in each print sat outside it, so they could be changed without the signature noticing. "
  "Pulse added a second signature, `pulse-index-v2`, covering the full record, to its REST index prints (live 2026-09-25 00:29:58 UTC, by Pulse's deployment records), "
  "and published its key ring on a separately hosted file with a rotation note (live 2026-09-26 04:39 UTC, by Pulse's records). "
  f"At the final re-check, from {w['from']} to {w['to']}, we checked three fresh prints against that separately hosted key. "
  "All three v2 signatures verified, and every signed line matched the field it names. A one-byte change to the signed text made each one INVALID. "
  "The same checks gave the same outcome at every earlier read (" + EARLIER + "), and the key-ring bytes have not changed since 26 September.")
a("")
a("**This is not an endorsement, certification, listing or partnership.** It says nothing about whether any quoted value, venue count or dispersion figure is accurate: a valid signature shows who committed to the bytes, not that the numbers are right.")
a("")
a("## History")
a("")
a("All times UTC, converted from message headers. \"private\" means the entry comes from email between us and Pulse; Pulse agreed to publication of a dated record. No private statement is used as a claim (spec §1.3).")
a("")
a("| When (UTC) | Who | What | Source |")
a("|---|---|---|---|")
for h in R['case_history']:
    a(f"| {h['utc']} | {h['who']} | {h['what']} | {'public' if h['public'] else 'private'} |")
a("")
a("## The claims and what was measured")
a("")
a("Each claim is Pulse's own public wording, captured verbatim. **CLAIM_MEASURED** means only that a measurement sits beside the claim. It is not a verdict.")
a("")
for cid in ('PV-1', 'PV-2', 'PV-3', 'PV-4'):
    c = C[cid]
    a(f"### {cid}: {c['state']}")
    a(f"> \"{c['claim_verbatim']}\"")
    a("")
    a(f"Source: `{c['source_url']}`, read {c['access_date']}.")
    a("")
    if c['state'] == 'UNMEASURED':
        a(f"- **Plan.** {c['measurement_plan']}")
    else:
        a(f"- **Window.** {c['window']['from']} to {c['window']['to']}.")
        a(f"- **Denominator.** {c['denominator']['n']}: {c['denominator']['description']}")
        a(f"- **Method.** {c['method']['description']}")
        a(f"- **Result.** {c['result']['value']}.")
    a(f"- **Artifact digest.** `{c['artifact_sha256']}`")
    a("")
a("PV-2 limit, stated plainly: both copies of the key ring sit under one domain and one DNS operator. Whoever controls that domain controls both copies. The separation is in hosting, not in control.")
a("")
a("## What this record does NOT establish")
a("")
for x in R['what_this_record_does_not_establish']:
    a(f"- {x}")
a("- Nothing here says or implies that any Pulse claim was or is false, misleading or exaggerated.")
a("")
a("## Conflicts")
a("")
a(R['conflicts_note'])
a("")
a("## Subject review")
a("")
a(R['subject_review'])
a("")
a("## Evidence (sha256 of the exact bytes read at the final re-check)")
a("")
a("| URL | Read (UTC) | sha256 |")
a("|---|---|---|")
for e in ev:
    a(f"| {e['url']} | {e['access_date']} | `{e['content_hash']}` |")
a("")
a(f"Checker: `pulse-verity/verify_pulse.py` sha256 `{R['tools']['verify_pulse.py']}`. To re-run from the repository root: `{R['how_to_rerun']['verify']}`. The earlier reads are kept beside this record in " + ", ".join(f"`pulse-verity/evidence-{d}/`" for d in EARLIER_DAYS) + ".")
a("")
a(f"**Signature and timestamp:** {R['signature_state']}  ")
a(f"**Next scheduled read:** {C['PV-1']['next_read_utc']}.  ")
a(f"**Right of reply:** {R['right_of_reply']}")
OUT = SRC.with_suffix('.md')
OUT.write_text('\n'.join(L) + '\n')
print('wrote', OUT.name)
