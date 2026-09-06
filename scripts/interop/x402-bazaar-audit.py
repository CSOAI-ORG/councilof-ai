#!/usr/bin/env python3
"""Audit our presence in BOTH x402 Bazaars.

    python3 scripts/interop/x402-bazaar-audit.py            # writes docs/product/X402-BAZAAR-AUDIT.md
    python3 scripts/interop/x402-bazaar-audit.py --json     # print the derived reading, write nothing

THERE ARE TWO INDEXES AND THEY ARE NOT THE SAME PLACE. PayAI and Coinbase CDP each run their own
discovery index, an agent shopping for a resource reads one of them, and being in one says nothing
about the other. Both are read here in one pass, because a document that audits one and is titled
as if it audited "the Bazaar" is how a half-answer gets filed as a whole one.

READING CDP NEEDS NO KEY. The estate has an open owner-ask for a free CDP API key, recorded as
what blocks CDP work. It blocks WRITING — being indexed. The discovery endpoint answers 200 to an
anonymous GET, so our absence from CDP was measurable the whole time and was being carried as
unmeasurable.

COSTS NO SELF-PROBES. Every request goes to facilitator.payai.network; the live door bytes it is
compared against come from public/openapi.json and functions/api/*, not from fetching our own
edge. Governor rule G5 caps this lane at 20 self-probes an hour and an audit that spent them
could not be re-run when it mattered.

READS THE WHOLE POPULATION OR REFUSES. /discovery/resources pages at 1000 and reports its own
`pagination.total`. A single page is 1000 of 28,230, and "we appear once" computed from it would
be a statement about the first page wearing the clothes of a statement about the Bazaar. The
scan asserts scanned >= declared total before it will report an absence; short of that it exits 2
UNCHECKABLE and writes nothing. (This is the estate's partial-read-totalled-as-population rule:
a disclosure printed beside a wrong number does not repair the number.)
"""
import argparse, collections, json, re, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

INDEXES = [
    ("PayAI", "https://facilitator.payai.network/discovery/resources"),
    ("Coinbase CDP", "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"),
]
BASE = INDEXES[0][1]
UA = "csoai-bazaar-audit/0.1 (+https://councilof.ai/interop/)"
OURS = ("councilof.ai", "csoai.org")
OUT = Path("docs/product/X402-BAZAAR-AUDIT.md")
DOOR_BUILDER = Path("functions/api/_x402.ts")
PAGE = 1000


def door_max_timeout():
    """What our own 402 builder puts in accepts[].maxTimeoutSeconds — read, never typed.

    The Bazaar entry is a SNAPSHOT taken when the resource was first indexed. Comparing it against
    the door's current value turns "the listing looks old" into a number: if they disagree, the
    index is serving a buyer a description of a door that no longer exists in that shape. There is
    no way to observe this from the listing alone — `lastUpdated` tells you when the record moved,
    not whether it is still true.
    """
    m = re.findall(r"maxTimeoutSeconds:\s*(\d+)", DOOR_BUILDER.read_text())
    vals = sorted(set(int(x) for x in m))
    return vals[0] if len(vals) == 1 else None


def scan(base=BASE):
    """Every resource that existed when the walk began, or an exception. Never a partial page.

    THE INDEX MOVES WHILE YOU READ IT. First run today: 15768 scanned of 15768 declared. Second
    run, minutes later: 15769 of 15770 — two resources were added mid-walk, and an offset-paged
    read that ends one short of the total it is told at the END looks exactly like a short read.
    Refusing there would make a busy index permanently UNCHECKABLE, which is not what the guard is
    for; loosening it to "close enough" would hand back the defect it exists to stop.

    So the population is pinned to the FIRST page's declared total — what existed when we started.
    scanned >= that is a complete read of that population and an absence in it is a claim.
    Anything less is still a refusal. Growth is reported, never absorbed: the caller is told both
    totals, so "we are not in this index" is always a statement about a population you can name.
    """
    items, offset, first_total, last_total = [], 0, None, None
    while True:
        req = urllib.request.Request(f"{base}?limit={PAGE}&offset={offset}", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.load(r)
        page = d.get("items") or []
        last_total = d.get("pagination", {}).get("total")
        if last_total is None:
            raise ValueError("the index declared no pagination.total — absence is unprovable without it")
        if first_total is None:
            first_total = last_total
        items.extend(page)
        offset += PAGE
        if offset >= first_total or not page:
            break
        time.sleep(0.2)
    if len(items) < first_total:
        raise ValueError(f"scanned {len(items)} of the {first_total} that existed when the walk began; "
                         f"absence would be a guess")
    return items, first_total, last_total


def ours(items):
    return sorted((i for i in items if any(h in json.dumps(i) for h in OURS)),
                  key=lambda x: str(x.get("resource")))


def reading(name, url, door_timeout):
    """One index, fully scanned, or an exception naming why it could not be."""
    items, total, total_at_end = scan(url)
    mine = ours(items)
    # CAN ONE HOST HAVE MANY RESOURCES INDEXED? Our own standing is 1 door of 9, and the first
    # question about a number like that is whether it is a platform limit or our own gap. It is
    # ours: most hosts in this index carry more than one resource. Derived from the same scan, so
    # it costs nothing and cannot drift away from the figure it qualifies.
    hosts = collections.Counter(
        urllib.parse.urlparse(str(i.get("resource") or "")).netloc for i in items)
    hosts.pop("", None)
    return {
        "index": name, "url": url, "declared_total": total, "scanned": len(items),
        "declared_total_at_end": total_at_end,
        "grew_during_scan": (total_at_end or 0) - total,
        "population_complete": len(items) >= total,
        "distinct_hosts": len(hosts),
        "hosts_with_more_than_one_resource": sum(1 for c in hosts.values() if c > 1),
        "most_resources_on_one_host": hosts.most_common(1)[0][1] if hosts else 0,
        "x402_versions": dict(collections.Counter(i.get("x402Version") for i in items)),
        "ours": [{"resource": m.get("resource"),
                  "last_updated": m.get("last_updated") or m.get("lastUpdated"),
                  "x402_version": m.get("x402Version"), "service_name": m.get("serviceName"),
                  "tags": m.get("tags"), "description_chars": len(m.get("description") or ""),
                  "max_timeout_seconds": (m.get("accepts") or [{}])[0].get("maxTimeoutSeconds"),
                  "amount": (m.get("accepts") or [{}])[0].get("amount"),
                  "listing_disagrees_with_door": (
                      None if door_timeout is None else
                      (m.get("accepts") or [{}])[0].get("maxTimeoutSeconds") != door_timeout)}
                 for m in mine],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--source", help="audit ONE index at this URL instead of both")
    a = ap.parse_args()
    targets = [("source", a.source)] if a.source else INDEXES
    door_timeout = door_max_timeout()
    readings = []
    for name, url in targets:
        try:
            readings.append(reading(name, url, door_timeout))
        except (urllib.error.URLError, ValueError, KeyError) as e:
            print(f"UNCHECKABLE {name} {type(e).__name__}: {e}; {OUT} left untouched", file=sys.stderr)
            return 2
    doc = {
        "kind": "csoai.x402-bazaar-audit/v0",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "door_max_timeout_seconds": door_timeout,
        "door_max_timeout_source": str(DOOR_BUILDER),
        "indexes": readings,
    }
    if a.json:
        print(json.dumps(doc, indent=2))
        return 0
    lines = ["# x402 Bazaars — what each index holds for us", "",
             "DERIVED by `scripts/interop/x402-bazaar-audit.py`. Never hand-edited; regenerate it.",
             "",
             "There are TWO indexes. An agent shopping for a resource reads one of them, and being in",
             "one says nothing about the other. Reading either needs no API key — CDP answers an",
             "anonymous GET — so an absence here is always measurable. A key is needed to be INDEXED,",
             "never to check.", "",
             f"Our own 402 builder (`{DOOR_BUILDER}`) sets `maxTimeoutSeconds` to "
             f"**{door_timeout if door_timeout is not None else 'more than one value — not comparable'}**;",
             "a listing that disagrees is serving a buyer a door that no longer has that shape.", ""]
    for r in readings:
        lines += [f"## {r['index']}", "",
                  f"- `{r['url']}`",
                  f"- scanned **{r['scanned']} of the {r['declared_total']}** that existed when the walk"
                  f" began — complete, which is what makes the finding a claim rather than a guess"
                  + (f"; {r['grew_during_scan']} more were added while we read, and are not in it"
                     if r["grew_during_scan"] else ""),
                  f"- ours: **{len(r['ours'])}**",
                  f"- {r['hosts_with_more_than_one_resource']} of {r['distinct_hosts']} hosts here carry "
                  f"MORE than one resource (the largest carries {r['most_resources_on_one_host']}), so a "
                  f"host being represented by one door is our gap, not a limit of the index",
                  f"- dialects indexed: " + ", ".join(f"v{k}×{v}" for k, v in sorted(
                      r["x402_versions"].items(), key=lambda kv: str(kv[0]))) + " — both are carried, so a"
                  " v1 door is not excluded on that ground alone",
                  ""]
        if r["ours"]:
            lines += ["| resource | last updated | x402 | serviceName | tags | amount | maxTimeout |",
                      "|---|---|---|---|---|---|---|"]
            for m in r["ours"]:
                lines.append(f"| `{m['resource']}` | {m['last_updated']} | v{m['x402_version']} | "
                             f"{m['service_name'] or '—'} | {m['tags'] or '—'} | {m['amount']} | "
                             f"{m['max_timeout_seconds']}"
                             f"{' **(stale)**' if m['listing_disagrees_with_door'] else ''} |")
            lines.append("")
        else:
            lines += ["**Not listed.** No resource on councilof.ai or csoai.org appears in this index —",
                      "and the scan above is what makes that a measurement.", ""]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n")
    print("wrote " + str(OUT) + ": " + "; ".join(
        f"{r['index']} {len(r['ours'])} of {r['scanned']}/{r['declared_total']}" for r in readings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
